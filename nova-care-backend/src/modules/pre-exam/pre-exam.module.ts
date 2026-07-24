import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/database/prisma.module';
import { PreExamController } from './pre-exam.controller';
import { PreExamService } from './pre-exam.service';
import { AiService } from './ai.service';
import { AppointmentsFromPreExamController } from './appointments-from-pre-exam.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PreExamController, AppointmentsFromPreExamController],
  providers: [PreExamService, AiService],
  exports: [PreExamService, AiService],
})
export class PreExamModule {}
