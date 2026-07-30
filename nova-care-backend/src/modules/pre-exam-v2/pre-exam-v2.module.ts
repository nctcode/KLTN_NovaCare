import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { AIModule } from '@/modules/ai/ai.module';
import { AuditLogService } from '@/common/services/audit-log.service';
import { PreExamV2Controller } from './pre-exam-v2.controller';
import { PreExamV2Service } from './pre-exam-v2.service';
import { TriageEngineService } from './services/triage-engine.service';
import { RecommendationService } from './services/recommendation.service';
import { GoogleSpeechToTextService } from './services/speech-to-text.service';
import { OpenAIVisionService } from './services/vision-analysis.service';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [PreExamV2Controller],
  providers: [
    PreExamV2Service,
    TriageEngineService,
    RecommendationService,
    GoogleSpeechToTextService,
    OpenAIVisionService,
    AuditLogService,
  ],
  exports: [PreExamV2Service, TriageEngineService],
})
export class PreExamV2Module {}
