import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogService } from '@/common/services/audit-log.service';
import { UsersModule } from '@/modules/users/users.module';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { ConsultationsGateway } from './consultations.gateway';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, ConsultationsGateway, AuditLogService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
