import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SlotStatus } from '@prisma/client';
import { ScheduleReconciliationService } from './schedule-reconciliation.service';
import { HospitalConfigService } from './hospital-config.service';
import { contiguousSlotWindow } from './contiguous-slot-window';

export interface BookingOption {
  id: string; // Primary slotId (S_0)
  startTime: string; // "08:00"
  endTime: string; // "08:30"
  formattedTime: string; // "08:00 - 08:30"
  remainingCapacity: number;
  duration: number;
  isAvailable: boolean;
  baseSlotIds: string[];
}

@Injectable()
export class AvailabilityService {
  constructor(
    private prisma: PrismaService,
    private reconciliationService: ScheduleReconciliationService,
    private hospitalConfigService: HospitalConfigService,
  ) {}

  /**
   * Generates candidate booking options for a doctor workplace, date, and medical service.
   */
  async getAvailabilityOptions(params: {
    doctorWorkplaceId: string;
    date: string; // "YYYY-MM-DD"
    medicalServiceId?: string;
  }): Promise<{ options: BookingOption[]; totalCandidates: number; serviceDuration: number }> {
    const { doctorWorkplaceId, date, medicalServiceId } = params;
    const dateStr = date.split('T')[0];
    const targetNoon = new Date(`${dateStr}T12:00:00+07:00`);
    const dayOfWeek = targetNoon.getDay();
    const dateOnly = new Date(`${dateStr}T00:00:00+07:00`);

    // 1. Fetch DoctorWorkplace & HospitalConfig
    const workplace = await this.prisma.doctorWorkplace.findUnique({
      where: { id: doctorWorkplaceId },
      include: { hospital: true },
    });
    if (!workplace) {
      throw new NotFoundException('Doctor workplace not found');
    }

    const hospitalConfig = await this.hospitalConfigService.resolveConfig(workplace.hospitalId);

    // 2. Fetch service duration (mặc định 30 phút)
    let serviceDuration = hospitalConfig.defaultSlotDuration || 30;
    if (medicalServiceId) {
      const service = await this.prisma.medicalService.findUnique({
        where: { id: medicalServiceId },
      });
      if (service && service.duration) {
        serviceDuration = service.duration;
      }
    }

    // 3. Reconcile slots if missing (sinh khung giờ 30 phút theo múi giờ VN)
    await this.reconciliationService.reconcileWorkplaceSlotsForDate(doctorWorkplaceId, dateOnly);

    // 4. Query base slots for date & filter strictly by active DoctorSchedule shifts
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorWorkplaceId,
        dayOfWeek,
        isActive: true,
      },
    });

    const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59+07:00`);

    let baseSlots = await this.prisma.appointmentSlot.findMany({
      where: {
        doctorWorkplaceId,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { startTime: 'asc' },
    });

    // Keep baseSlots strictly within active schedule shifts and outside break times (dùng giờ Việt Nam)
    baseSlots = baseSlots.filter((slot) => {
      const sMins = this.getVietnamMinutes(slot.startTime);
      const eMins = this.getVietnamMinutes(slot.endTime);

      return schedules.some((sched) => {
        const [sh, sm] = sched.startTime.split(':').map(Number);
        const [eh, em] = sched.endTime.split(':').map(Number);
        const schedStartMins = sh * 60 + sm;
        const schedEndMins = eh * 60 + em;

        if (sMins < schedStartMins || eMins > schedEndMins) return false;

        if (sched.breakStart && sched.breakEnd) {
          const [bsh, bsm] = sched.breakStart.split(':').map(Number);
          const [beh, bem] = sched.breakEnd.split(':').map(Number);
          const breakStartMins = bsh * 60 + bsm;
          const breakEndMins = beh * 60 + bem;
          if (sMins < breakEndMins && eMins > breakStartMins) return false;
        }
        return true;
      });
    });

    if (baseSlots.length === 0) {
      return { options: [], totalCandidates: 0, serviceDuration };
    }

    const options: BookingOption[] = [];

    // 5. Aggregate base slots into Fixed Candidate Booking Options (Step = service duration)
    for (let i = 0; i < baseSlots.length; i++) {
      const candidateWindow = contiguousSlotWindow(baseSlots.slice(i), serviceDuration);
      if (!candidateWindow.length) continue;
      let isValidCandidate = true;
      let minRemainingCapacity = Infinity;

      for (let j = 0; j < candidateWindow.length; j++) {
        const slot = candidateWindow[j];

        // Criterion 1: Must be AVAILABLE & bookedCount < capacity
        if (slot.status !== SlotStatus.AVAILABLE || slot.bookedCount >= slot.capacity) {
          isValidCandidate = false;
          break;
        }

        // Criterion 2: No gap between consecutive slots
        if (j > 0) {
          const prevSlot = candidateWindow[j - 1];
          if (new Date(prevSlot.endTime).getTime() !== new Date(slot.startTime).getTime()) {
            isValidCandidate = false;
            break;
          }
        }

        const remaining = slot.capacity - slot.bookedCount;
        if (remaining < minRemainingCapacity) {
          minRemainingCapacity = remaining;
        }
      }

      if (isValidCandidate && minRemainingCapacity > 0 && minRemainingCapacity !== Infinity) {
        const startSlot = candidateWindow[0];
        const endSlot = candidateWindow[candidateWindow.length - 1];

        const startTimeStr = this.getVietnamTimeStr(startSlot.startTime);
        const endTimeStr = this.getVietnamTimeStr(endSlot.endTime);

        options.push({
          id: startSlot.id,
          startTime: startTimeStr,
          endTime: endTimeStr,
          formattedTime: `${startTimeStr} - ${endTimeStr}`,
          remainingCapacity: minRemainingCapacity,
          duration: serviceDuration,
          isAvailable: true,
          baseSlotIds: candidateWindow.map((s) => s.id),
        });
      }
    }

    return {
      options,
      totalCandidates: options.length,
      serviceDuration,
    };
  }

  private getVietnamTimeStr(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(date));
    const h = parts.find((p) => p.type === 'hour')?.value || '00';
    const m = parts.find((p) => p.type === 'minute')?.value || '00';
    return `${h}:${m}`;
  }

  private getVietnamMinutes(date: Date): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(date));
    const h = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    return h * 60 + m;
  }
}
