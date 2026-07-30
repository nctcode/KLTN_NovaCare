import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PaymentStatus;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { transactionCode: { contains: params.search, mode: 'insensitive' } },
        { vnpTransactionNo: { contains: params.search, mode: 'insensitive' } },
        { appointment: { bookingCode: { contains: params.search, mode: 'insensitive' } } },
        { appointment: { user: { fullName: { contains: params.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: {
            include: {
              patientProfile: true,
              user: { select: { id: true, fullName: true, email: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.paymentTransaction.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            patientProfile: true,
            user: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Giao dịch không tồn tại');
    return payment;
  }

  async refund(
    id: string,
    reason: string,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      include: { appointment: true },
    });

    if (!payment) throw new NotFoundException('Giao dịch không tồn tại');
    if (payment.status === 'REFUNDED') {
      throw new BadRequestException('Giao dịch đã hoàn tiền trước đó');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.paymentTransaction.update({
        where: { id },
        data: { status: 'REFUNDED' },
      });

      await tx.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: 'REFUNDED' },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: payment.appointmentId,
          status: 'REFUNDED',
          note: `Admin hoàn tiền giao dịch: ${reason || 'Yêu cầu từ quản trị viên'}`,
        },
      });

      return p;
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'REFUND_PAYMENT_TRANSACTION',
      entityType: 'PaymentTransaction',
      entityId: id,
      oldValue: { status: payment.status },
      newValue: { status: 'REFUNDED', reason },
      ipAddress,
      userAgent,
    });

    return updated;
  }
}
