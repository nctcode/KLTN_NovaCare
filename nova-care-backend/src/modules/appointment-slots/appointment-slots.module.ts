import { Module } from '@nestjs/common';
import { AppointmentSlotsService } from './appointment-slots.service';
import { AppointmentSlotsController } from './appointment-slots.controller';

@Module({
  controllers: [AppointmentSlotsController],
  providers: [AppointmentSlotsService],
  exports: [AppointmentSlotsService],
})
export class AppointmentSlotsModule {}
