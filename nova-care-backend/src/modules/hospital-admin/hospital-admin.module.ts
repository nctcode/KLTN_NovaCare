import { Module } from '@nestjs/common';
import { HospitalAdminController } from './hospital-admin.controller';
import { HospitalAdminService } from './hospital-admin.service';
import { IntegrationModule } from '@/modules/integration/integration.module';

@Module({
  imports: [IntegrationModule],
  controllers: [HospitalAdminController],
  providers: [HospitalAdminService],
  exports: [HospitalAdminService],
})
export class HospitalAdminModule {}
