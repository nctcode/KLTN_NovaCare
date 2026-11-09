import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, AuditLogService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
