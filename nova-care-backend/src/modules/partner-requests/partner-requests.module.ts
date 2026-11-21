import { Module } from '@nestjs/common';
import { PartnerRequestsController } from './partner-requests.controller';
import { PartnerRequestsService } from './partner-requests.service';
import { EmailModule } from '@/modules/email/email.module';
import { AuditLogService } from '@/common/services/audit-log.service';

@Module({
  imports: [EmailModule],
  controllers: [PartnerRequestsController],
  providers: [PartnerRequestsService, AuditLogService],
  exports: [PartnerRequestsService],
})
export class PartnerRequestsModule {}
