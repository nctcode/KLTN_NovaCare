import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { BookingType, ScheduleSource } from '@prisma/client';

export interface ResolvedHospitalConfig {
  maxAdvanceDays: number;
  allowSaturday: boolean;
  allowSunday: boolean;
  minAdvanceMinutes: number;
  defaultSlotDuration: number;
  scheduleSource: ScheduleSource;
}

const CONTROLLED_DEFAULT_CONFIG: ResolvedHospitalConfig = {
  maxAdvanceDays: 30,
  allowSaturday: true,
  allowSunday: true,
  minAdvanceMinutes: 60,
  defaultSlotDuration: 30,
  scheduleSource: ScheduleSource.INTERNAL,
};

@Injectable()
export class HospitalConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolves hospital config with 3-tier fallback chain:
   * 1. hospitalId + requestedBookingType
   * 2. hospitalId + ALL
   * 3. Controlled Default Config
   */
  async resolveConfig(hospitalId: string, bookingType?: BookingType): Promise<ResolvedHospitalConfig> {
    const requestedType = bookingType || BookingType.ALL;

    // 1. Try hospitalId + requestedBookingType
    if (requestedType !== BookingType.ALL) {
      const specificConfig = await this.prisma.hospitalBookingConfig.findUnique({
        where: {
          hospitalId_bookingType: {
            hospitalId,
            bookingType: requestedType,
          },
        },
      });
      if (specificConfig) return specificConfig;
    }

    // 2. Try hospitalId + ALL
    const allConfig = await this.prisma.hospitalBookingConfig.findUnique({
      where: {
        hospitalId_bookingType: {
          hospitalId,
          bookingType: BookingType.ALL,
        },
      },
    });
    if (allConfig) return allConfig;

    // 3. Fallback to Controlled Default
    return CONTROLLED_DEFAULT_CONFIG;
  }
}
