import { Module } from '@nestjs/common';
import { PartnerRequestsController } from './partner-requests.controller';
import { PartnerRequestsService } from './partner-requests.service';
import { EmailModule } from '@/modules/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [PartnerRequestsController],
  providers: [PartnerRequestsService],
  exports: [PartnerRequestsService],
})
export class PartnerRequestsModule {}
