import { Module } from '@nestjs/common';
import { MedicalServicesService } from './medical-services.service';
import { MedicalServicesController } from './medical-services.controller';

@Module({
  controllers: [MedicalServicesController],
  providers: [MedicalServicesService],
  exports: [MedicalServicesService],
})
export class MedicalServicesModule {}
