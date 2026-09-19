import { Module } from '@nestjs/common';
import { HospitalAdminController } from './hospital-admin.controller';
import { HospitalAdminService } from './hospital-admin.service';

@Module({
  controllers: [HospitalAdminController],
  providers: [HospitalAdminService],
  exports: [HospitalAdminService],
})
export class HospitalAdminModule {}
