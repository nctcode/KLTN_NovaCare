import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogService } from '@/common/services/audit-log.service';
import { UsersModule } from '@/modules/users/users.module';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { ConsultationsGateway } from './consultations.gateway';
import { ConsultationVideoService } from './consultation-video.service';
import { ConsultationVideoController } from './consultation-video.controller';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [ConsultationsController, ConsultationVideoController],
  providers: [ConsultationsService, ConsultationsGateway, AuditLogService, ConsultationVideoService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
