import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { QueueService } from '@/queue/queue.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async createPaymentUrl(appointmentId: string, ipAddress: string = '127.0.0.1'): Promise<string> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patientProfile: true, user: true },
    });

    if (!appointment) throw new NotFoundException('Lịch khám không tồn tại');
    if (appointment.status !== 'AWAITING_PAYMENT' && appointment.status !== 'PENDING') {
      throw new BadRequestException(`Lịch khám không ở trạng thái chờ thanh toán (Trạng thái hiện tại: ${appointment.status})`);
    }

    const tmnCode = this.configService.get<string>('VNP_TMN_CODE') || '2QX5222E';
    const secretKey = this.configService.get<string>('VNP_HASH_SECRET') || 'RA499R1M587FNHFOWD2W13W35N6L8XLS';
    const vnpUrl = this.configService.get<string>('VNP_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = this.configService.get<string>('VNP_RETURN_URL') || 'http://localhost:3001/thanh-toan/return';

    const transactionCode = `NOVA${Date.now()}`;
    const amount = Math.round(Number(appointment.totalPrice) * 100);

    const now = new Date();
    const createDate = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

    const vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: amount,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: transactionCode,
      vnp_OrderInfo: `Thanh toan lich kham ${appointment.bookingCode}`,
      vnp_OrderType: 'billpayment',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddress,
      vnp_CreateDate: createDate,
    };

    // Sort and encode parameters according to VNPay 2.1.0 spec
    const sortedKeys = Object.keys(vnpParams).sort();
    const encodedParams: Record<string, string> = {};
    for (const key of sortedKeys) {
      encodedParams[key] = encodeURIComponent(String(vnpParams[key])).replace(/%20/g, '+');
    }

    const signData = Object.keys(encodedParams)
      .map((key) => `${key}=${encodedParams[key]}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', secretKey);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    encodedParams['vnp_SecureHash'] = secureHash;

    // Save transaction in DB
    await this.prisma.paymentTransaction.upsert({
      where: { appointmentId },
      update: {
        transactionCode,
        amount: appointment.totalPrice,
        paymentMethod: 'VNPAY',
        status: 'PENDING',
        updatedAt: new Date(),
      },
      create: {
        appointmentId,
        amount: appointment.totalPrice,
        paymentMethod: 'VNPAY',
        transactionCode,
        status: 'PENDING',
      },
    });

    const queryString = Object.keys(encodedParams)
      .map((key) => `${key}=${encodedParams[key]}`)
      .join('&');

    return `${vnpUrl}?${queryString}`;
  }

  async handleIpn(params: Record<string, any>): Promise<{ RspCode: string; Message: string }> {
    try {
      const vnpParams = { ...params };
      const secureHash = vnpParams['vnp_SecureHash'];
      delete vnpParams['vnp_SecureHash'];
      delete vnpParams['vnp_SecureHashType'];

      const secretKey = this.configService.get<string>('VNP_HASH_SECRET') || 'RA499R1M587FNHFOWD2W13W35N6L8XLS';

      const sortedKeys = Object.keys(vnpParams).sort();
      const signData = sortedKeys.map((key) => `${key}=${vnpParams[key]}`).join('&');

      const hmac = crypto.createHmac('sha512', secretKey);
      const computedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      if (secureHash !== computedHash) {
        this.logger.warn(`Invalid VNPay IPN signature checksum mismatch.`);
        return { RspCode: '97', Message: 'Invalid Checksum' };
      }

      const transactionCode = vnpParams['vnp_TxnRef'];
      const responseCode = vnpParams['vnp_ResponseCode'];
      const transactionNo = vnpParams['vnp_TransactionNo'];

      const payment = await this.prisma.paymentTransaction.findFirst({
        where: { OR: [{ transactionCode }, { appointmentId: transactionCode }] },
        include: { appointment: true },
      });

      if (!payment) {
        return { RspCode: '01', Message: 'Order Not Found' };
      }

      if (payment.status === 'PAID') {
        return { RspCode: '02', Message: 'Order Already Confirmed' };
      }

      const isSuccess = responseCode === '00';

      await this.prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: {
            status: isSuccess ? 'PAID' : 'FAILED',
            vnpResponseCode: responseCode,
            vnpTransactionNo: transactionNo,
            paidAt: isSuccess ? new Date() : null,
            callbackData: params,
          },
        });

        if (isSuccess) {
          await tx.appointment.update({
            where: { id: payment.appointmentId },
            data: { status: 'PAID' },
          });

          await tx.appointmentStatusHistory.create({
            data: {
              appointmentId: payment.appointmentId,
              status: 'PAID',
              note: 'Thanh toán qua cổng VNPay thành công',
            },
          });
        }
      });

      if (isSuccess) {
        // Enqueue background notifications
        await this.queueService.addEmailJob(payment.appointmentId, 'payment_success');
        await this.queueService.addPushJob(payment.appointmentId, 'payment_success');
      }

      return { RspCode: '00', Message: 'Confirm Success' };
    } catch (error: any) {
      this.logger.error(`Error processing VNPay IPN: ${error.message}`);
      return { RspCode: '99', Message: 'Unknown Error' };
    }
  }

  async getPaymentStatus(appointmentId: string) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { appointmentId },
      include: { appointment: true },
    });

    if (!payment) {
      const appt = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      if (!appt) throw new NotFoundException('Lịch khám không tồn tại');
      return {
        appointmentId,
        paymentStatus: appt.status === 'PAID' ? 'PAID' : 'UNPAID',
        bookingCode: appt.bookingCode,
      };
    }

    return {
      appointmentId,
      paymentStatus: payment.status,
      transactionCode: payment.transactionCode,
      vnpTransactionNo: payment.vnpTransactionNo,
      amount: payment.amount,
      paidAt: payment.paidAt,
      bookingCode: payment.appointment.bookingCode,
    };
  }

  async simulatePaymentSuccess(appointmentId: string, paymentMethodStr: string = 'MOMO') {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) throw new NotFoundException('Lịch khám không tồn tại');

    // Map incoming string to PaymentMethod enum value
    const methodMap: Record<string, any> = {
      MOMO: 'MOMO',
      VIETQR: 'VIETQR',
      CARD: 'CARD',
      VNPAY: 'VNPAY',
      CASH: 'CASH',
      BANKING: 'BANKING',
    };
    const paymentMethod = methodMap[paymentMethodStr.toUpperCase()] ?? 'MOMO';
    const transactionCode = `${paymentMethod}_${Date.now()}`;

    await this.prisma.$transaction(async (tx) => {
      // Check if a transaction already exists
      const existing = await tx.paymentTransaction.findUnique({ where: { appointmentId } });

      if (existing) {
        await tx.paymentTransaction.update({
          where: { appointmentId },
          data: {
            status: 'PAID',
            paymentMethod,
            paidAt: new Date(),
          },
        });
      } else {
        await tx.paymentTransaction.create({
          data: {
            appointmentId,
            amount: appointment.totalPrice,
            paymentMethod,
            transactionCode,
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'PAID' },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId,
          status: 'PAID',
          note: `Thanh toán giả lập qua ${paymentMethod} thành công`,
        },
      });
    });

    try {
      await this.queueService.addEmailJob(appointmentId, 'payment_success');
      await this.queueService.addPushJob(appointmentId, 'payment_success');
    } catch (e: any) {
      this.logger.warn(`Failed to queue notification: ${e.message}`);
    }

    return {
      appointmentId,
      status: 'PAID',
      paymentMethod,
      bookingCode: appointment.bookingCode,
    };
  }
}
