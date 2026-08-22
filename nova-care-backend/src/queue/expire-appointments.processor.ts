import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ExpireAppointmentsProcessor {
  private logger = new Logger(ExpireAppointmentsProcessor.name);

  constructor(private prisma: PrismaService) {}

  async process(jobData?: any): Promise<any> {
    this.logger.log(`Processing expiration check job`);
    const now = new Date();

    const expiredAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'AWAITING_PAYMENT',
        expiresAt: { lt: now },
      } as any,
      include: { slot: true },
    });

    for (const appt of expiredAppointments) {
      try {
        const slot = (appt as any).slot;
        const currentBookedCount = slot?.bookedCount ?? 1;

        await this.prisma.$transaction(async (tx) => {
          await tx.appointment.update({
            where: { id: appt.id },
            data: { status: 'EXPIRED' },
          });

          await tx.appointmentSlot.update({
            where: { id: appt.slotId },
            data: {
              bookedCount: Math.max(0, currentBookedCount - 1),
              isAvailable: true,
            },
          });

          await tx.appointmentStatusHistory.create({
            data: {
              appointmentId: appt.id,
              status: 'EXPIRED',
              note: 'Hết hạn giữ chỗ do không thực hiện thanh toán đúng thời hạn',
            },
          });
        });

        this.logger.log(`Expired appointment ${appt.bookingCode} and freed slot.`);
      } catch (e: any) {
        this.logger.error(`Error expiring appointment ${appt.id}: ${e.message}`);
      }
    }

    return { processedCount: expiredAppointments.length };
  }
}
