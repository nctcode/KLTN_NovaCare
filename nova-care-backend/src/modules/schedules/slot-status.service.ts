import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SlotStatus, ScheduleExceptionType } from '@prisma/client';

@Injectable()
export class SlotStatusService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolves canonical SlotStatus for a slot.
   */
  async resolveStatus(
    tx: any,
    slot: {
      id: string;
      doctorWorkplaceId: string;
      date?: Date | null;
      startTime: Date;
      endTime: Date;
      capacity: number;
      bookedCount: number;
      isActive: boolean;
      isAvailable: boolean;
      status: SlotStatus;
    },
  ): Promise<SlotStatus> {
    const prismaClient = tx || this.prisma;

    // 1. Conflict State (Schedule disabled/modified but has active patient bookings)
    if (!slot.isActive && slot.bookedCount > 0) {
      return SlotStatus.CONFLICTED;
    }

    // 2. Cancelled State (Disabled with zero bookings)
    if (!slot.isActive && slot.bookedCount === 0) {
      return SlotStatus.CANCELLED;
    }

    // 3. Full State (Capacity reached)
    if (slot.bookedCount >= slot.capacity) {
      return SlotStatus.FULL;
    }

    // 4. Check for active Schedule Exception on that date (BLOCK_TIME or DAY_OFF)
    const slotDate = slot.date || new Date(slot.startTime);
    const dateOnly = new Date(slotDate.toISOString().split('T')[0]);

    const activeException = await prismaClient.scheduleException.findFirst({
      where: {
        doctorWorkplaceId: slot.doctorWorkplaceId,
        date: dateOnly,
      },
    });

    if (activeException) {
      if (activeException.exceptionType === ScheduleExceptionType.DAY_OFF) {
        return SlotStatus.BLOCKED;
      }
      if (activeException.exceptionType === ScheduleExceptionType.BLOCK_TIME) {
        if (activeException.startTime && activeException.endTime) {
          const slotStartStr = new Date(slot.startTime).toTimeString().substring(0, 5);
          const slotEndStr = new Date(slot.endTime).toTimeString().substring(0, 5);
          if (slotStartStr < activeException.endTime && slotEndStr > activeException.startTime) {
            return SlotStatus.BLOCKED;
          }
        } else {
          return SlotStatus.BLOCKED;
        }
      }
    }

    // 5. Admin / Manual BLOCKED state
    if (!slot.isAvailable || slot.status === SlotStatus.BLOCKED) {
      return SlotStatus.BLOCKED;
    }

    // 6. Otherwise AVAILABLE
    return SlotStatus.AVAILABLE;
  }

  async updateAndSyncSlotStatus(tx: any, slotId: string): Promise<SlotStatus> {
    const prismaClient = tx || this.prisma;
    const slot = await prismaClient.appointmentSlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) return SlotStatus.CANCELLED;

    const newStatus = await this.resolveStatus(prismaClient, slot);
    const isAvailable = newStatus === SlotStatus.AVAILABLE;

    await prismaClient.appointmentSlot.update({
      where: { id: slotId },
      data: {
        status: newStatus,
        isAvailable,
      },
    });

    return newStatus;
  }
}
