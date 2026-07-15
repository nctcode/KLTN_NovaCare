import { Module } from '@nestjs/common';
import { DoctorWorkplacesService } from './doctor-workplaces.service';
import { DoctorWorkplacesController } from './doctor-workplaces.controller';

@Module({
  controllers: [DoctorWorkplacesController],
  providers: [DoctorWorkplacesService],
  exports: [DoctorWorkplacesService],
})
export class DoctorWorkplacesModule {}
