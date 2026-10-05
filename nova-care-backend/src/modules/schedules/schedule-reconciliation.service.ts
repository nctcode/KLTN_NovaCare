import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SlotStatus } from '@prisma/client';

@Injectable()
export class ScheduleReconciliationService {
  private readonly logger = Logger ? new Logger(ScheduleReconciliationService.name) : console;

  constructor(private prisma: PrismaService) {}

  /**
   * Reconciles DoctorSchedule shifts into 15-minute base AppointmentSlots for a workplace and target date.
   * Preserves existing booked slots and sets SlotStatus appropriately.
   */
  async reconcileWorkplaceSlotsForDate(doctorWorkplaceId: string, targetDate: Date | string): Promise<void> {
    let dateStr: string;
    if (typeof targetDate === 'string') {
      dateStr = targetDate.split('T')[0];
    } else {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(targetDate);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const d = parts.find((p) => p.type === 'day')?.value;
      dateStr = `${y}-${m}-${d}`;
    }

    const targetNoon = new Date(`${dateStr}T12:00:00+07:00`);
    const dayOfWeek = targetNoon.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
    const dateOnly = new Date(`${dateStr}T00:00:00+07:00`);

    // 1. Fetch active schedules valid for targetDate
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorWorkplaceId,
        dayOfWeek,
        isActive: true,
      },
      include: {
        scheduleServices: true,
      },
    });

    const activeSchedules = schedules.filter((s) => {
      const from = s.effectiveFrom ? new Date(s.effectiveFrom) : new Date('1970-01-01');
      const to = s.effectiveTo ? new Date(s.effectiveTo) : new Date('2099-12-31');
      return dateOnly >= from && dateOnly <= to;
    });

    if (activeSchedules.length === 0) {
      return;
    }

    const baseSlotMinutes = 30; // 30 phút, bỏ các khung 15 phút

    for (const schedule of activeSchedules) {
      const startMinutes = this.timeToMinutes(schedule.startTime);
      const endMinutes = this.timeToMinutes(schedule.endTime);
      const breakStartMinutes = schedule.breakStart ? this.timeToMinutes(schedule.breakStart) : null;
      const breakEndMinutes = schedule.breakEnd ? this.timeToMinutes(schedule.breakEnd) : null;

      for (let m = startMinutes; m + baseSlotMinutes <= endMinutes; m += baseSlotMinutes) {
        // Skip break time
        if (breakStartMinutes !== null && breakEndMinutes !== null) {
          if (m >= breakStartMinutes && m < breakEndMinutes) {
            continue;
          }
        }

        const sH = String(Math.floor(m / 60)).padStart(2, '0');
        const sM = String(m % 60).padStart(2, '0');
        const eH = String(Math.floor((m + baseSlotMinutes) / 60)).padStart(2, '0');
        const eM = String((m + baseSlotMinutes) % 60).padStart(2, '0');

        const slotStartTime = new Date(`${dateStr}T${sH}:${sM}:00+07:00`);
        const slotEndTime = new Date(`${dateStr}T${eH}:${eM}:00+07:00`);

        await this.prisma.appointmentSlot.upsert({
          where: {
            doctorWorkplaceId_startTime: {
              doctorWorkplaceId,
              startTime: slotStartTime,
            },
          },
          create: {
            doctorWorkplaceId,
            date: dateOnly,
            startTime: slotStartTime,
            endTime: slotEndTime,
            capacity: schedule.capacity || 1,
            bookedCount: 0,
            isAvailable: true,
            isActive: true,
            status: SlotStatus.AVAILABLE,
          },
          update: {
            date: dateOnly,
            endTime: slotEndTime,
            capacity: schedule.capacity || 1,
            isActive: true,
          },
        });
      }
    }
  }

  private timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }
}
