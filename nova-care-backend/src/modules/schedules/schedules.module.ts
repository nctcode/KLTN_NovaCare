import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { SlotStatusService } from './slot-status.service';
import { ScheduleOverlapValidator } from './schedule-overlap.validator';
import { HospitalConfigService } from './hospital-config.service';
import { ScheduleReconciliationService } from './schedule-reconciliation.service';
import { AvailabilityService } from './availability.service';
import { BookingController } from './booking.controller';
import { SchedulesController } from './schedules.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BookingController, SchedulesController],
  providers: [
    SlotStatusService,
    ScheduleOverlapValidator,
    HospitalConfigService,
    ScheduleReconciliationService,
    AvailabilityService,
  ],
  exports: [
    SlotStatusService,
    ScheduleOverlapValidator,
    HospitalConfigService,
    ScheduleReconciliationService,
    AvailabilityService,
  ],
})
export class SchedulesModule {}
