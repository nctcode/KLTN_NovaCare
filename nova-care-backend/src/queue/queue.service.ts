import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { EmailService } from '@/modules/email/email.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class QueueService {
  private logger = new Logger(QueueService.name);

  constructor(
    @Optional() @Inject('BULL_EMAIL_QUEUE') private emailQueue: any,
    @Optional() @Inject('BULL_PUSH_QUEUE') private pushQueue: any,
    @Optional() @Inject('BULL_REMINDER_QUEUE') private reminderQueue: any,
    @Optional() @Inject('BULL_EXPIRE_QUEUE') private expireQueue: any,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  async addEmailJob(appointmentId: string, type: 'booking_confirmed' | 'payment_success' | 'reminder') {
    try {
      await this.emailQueue.add('send-email', { appointmentId, type }, { attempts: 3, backoff: 5000 });
      this.logger.log(`Added email job for appointment ${appointmentId} (${type})`);
    } catch (e: any) {
      this.logger.warn(`BullMQ add failure (${e.message}). Executing email directly.`);
      this.processEmailDirect(appointmentId, type);
    }
  }

  async addPushJob(appointmentId: string, type: string) {
    try {
      await this.pushQueue.add('send-push', { appointmentId, type }, { attempts: 3, backoff: 3000 });
    } catch (e: any) {
      this.logger.warn(`BullMQ push job fallback: ${e.message}`);
      this.processPushDirect(appointmentId, type);
    }
  }

  async addExpireJob(appointmentId: string, delayMs: number = 900000) { // 15 mins default
    try {
      await this.expireQueue.add('expire-single', { appointmentId }, { delay: delayMs });
    } catch (e: any) {
      this.logger.warn(`BullMQ expire job fallback: ${e.message}`);
    }
  }

  // Direct fallbacks
  async processEmailDirect(appointmentId: string, type: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: true,
        user: true,
        slot: {
          include: {
            doctorWorkplace: {
              include: {
                doctor: true,
                hospital: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) return;

    const profileEmail = (appointment.patientProfile as any)?.email;
    const email = profileEmail || appointment.user.email;
    if (!email) return;

    const doctorName = appointment.slot.doctorWorkplace.doctor.fullName;
    const hospitalName = appointment.slot.doctorWorkplace.hospital.name;
    const dateStr = `${new Date(appointment.slot.startTime).toLocaleDateString('vi-VN')} ${new Date(appointment.slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

    if (type === 'booking_confirmed') {
      await this.emailService.sendAppointmentConfirmation(
        email,
        appointment.patientProfile.fullName,
        appointment.bookingCode,
        doctorName,
        hospitalName,
        dateStr,
        appointment.id,
        appointment.userId,
      );
    } else if (type === 'payment_success') {
      await this.emailService.sendPaymentSuccess(
        email,
        appointment.patientProfile.fullName,
        appointment.bookingCode,
        Number(appointment.totalPrice).toLocaleString('vi-VN'),
        appointment.id,
        appointment.userId,
      );
    } else if (type === 'reminder') {
      await this.emailService.sendAppointmentReminder(
        email,
        appointment.patientProfile.fullName,
        appointment.bookingCode,
        doctorName,
        dateStr,
        appointment.id,
        appointment.userId,
      );
    }
  }

  async processPushDirect(appointmentId: string, type: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patientProfile: true },
    });
    if (!appointment) return;

    let title = 'Thông báo lịch khám NovaCare';
    let body = `Lịch khám ${appointment.bookingCode} đã được cập nhật.`;

    if (type === 'booking_confirmed') {
      title = 'Đặt lịch khám thành công';
      body = `Phiếu khám ${appointment.bookingCode} đã được tạo thành công. Vui lòng thanh toán hoặc giữ chỗ.`;
    } else if (type === 'payment_success') {
      title = 'Thanh toán thành công';
      body = `Đã nhận thanh toán cho lịch khám mã ${appointment.bookingCode}.`;
    }

    await this.notificationsService.createNotification(
      appointment.userId,
      title,
      body,
      type === 'payment_success' ? 'PAYMENT_SUCCESS' : 'BOOKING_CONFIRMED',
      { bookingCode: appointment.bookingCode, appointmentId: appointment.id },
      'push',
      appointment.id,
    );
  }
}
