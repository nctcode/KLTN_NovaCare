import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatusHistoryService } from './appointment-status-history.service';
import { AppointmentsController } from './appointments.controller';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentStatusHistoryService],
  exports: [AppointmentsService, AppointmentStatusHistoryService],
})
export class AppointmentsModule {}
