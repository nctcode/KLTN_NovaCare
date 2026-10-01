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
  async reconcileWorkplaceSlotsForDate(doctorWorkplaceId: string, targetDate: Date): Promise<void> {
    const dateOnly = new Date(targetDate.toISOString().split('T')[0]);
    const dayOfWeek = dateOnly.getDay(); // 0: Sunday, 1: Monday, ...

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

    const baseSlotMinutes = 15;

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

        const slotStartTime = new Date(dateOnly);
        slotStartTime.setHours(Math.floor(m / 60), m % 60, 0, 0);

        const slotEndTime = new Date(dateOnly);
        slotEndTime.setHours(Math.floor((m + baseSlotMinutes) / 60), (m + baseSlotMinutes) % 60, 0, 0);

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
