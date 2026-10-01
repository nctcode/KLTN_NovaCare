import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ScheduleOverlapValidator {
  constructor(private prisma: PrismaService) {}

  /**
   * Validates that a DoctorSchedule shift does not overlap with existing shifts for the same workplace.
   * REJECTS if same dayOfWeek, time ranges overlap, and effective date ranges overlap.
   */
  async validateScheduleOverlap(
    doctorWorkplaceId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    effectiveFrom?: Date | null,
    effectiveTo?: Date | null,
    excludeScheduleId?: string,
  ): Promise<void> {
    const existingSchedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorWorkplaceId,
        dayOfWeek,
        isActive: true,
        ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
      },
    });

    const newFrom = effectiveFrom ? new Date(effectiveFrom) : new Date('1970-01-01');
    const newTo = effectiveTo ? new Date(effectiveTo) : new Date('2099-12-31');

    for (const schedule of existingSchedules) {
      // 1. Time range overlap check (startA < endB AND endA > startB)
      if (startTime < schedule.endTime && endTime > schedule.startTime) {
        const existFrom = schedule.effectiveFrom ? new Date(schedule.effectiveFrom) : new Date('1970-01-01');
        const existTo = schedule.effectiveTo ? new Date(schedule.effectiveTo) : new Date('2099-12-31');

        // 2. Date range overlap check
        if (newFrom <= existTo && newTo >= existFrom) {
          throw new ConflictException(
            `Khung giờ (${startTime} - ${endTime}) bị trùng lặp với lịch làm việc hiện có (${schedule.startTime} - ${schedule.endTime}) trong cùng khoảng thời gian hiệu lực`,
          );
        }
      }
    }
  }
}
