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
import { ScreeningDataNormalizerService } from './normalization/screening-data-normalizer.service';
import { RedFlagEngineService } from './engines/red-flag-engine.service';
import { RiskScoringEngineService } from './engines/risk-scoring-engine.service';
import { QuestionEngineService } from './engines/question-engine.service';
import { SpecialtyRecommendationEngineService } from './engines/specialty-recommendation-engine.service';
import { ScreeningResultValidatorService } from './validators/screening-result-validator.service';
import { AiScreeningOrchestratorService } from './ai/ai-screening-orchestrator.service';

import { ScreeningMediaService } from './services/screening-media.service';
import { ClinicalFeatureExtractorService } from './services/clinical-feature-extractor.service';
import { ClinicalPatternEngineService } from './engines/clinical-pattern-engine.service';
import { SpecialtyConstraintValidatorService } from './validators/specialty-constraint-validator.service';
import { ICDCandidateResolverService } from './services/icd-candidate-resolver.service';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [PreExamV2Controller],
  providers: [
    PreExamV2Service,
    ScreeningMediaService,
    TriageEngineService,
    RecommendationService,
    GoogleSpeechToTextService,
    OpenAIVisionService,
    AuditLogService,
    ScreeningDataNormalizerService,
    RedFlagEngineService,
    RiskScoringEngineService,
    QuestionEngineService,
    SpecialtyRecommendationEngineService,
    ScreeningResultValidatorService,
    AiScreeningOrchestratorService,
    ClinicalFeatureExtractorService,
    ClinicalPatternEngineService,
    SpecialtyConstraintValidatorService,
    ICDCandidateResolverService,
  ],
  exports: [
    PreExamV2Service,
    ScreeningMediaService,
    TriageEngineService,
    AiScreeningOrchestratorService,
    QuestionEngineService,
    RedFlagEngineService,
    ClinicalFeatureExtractorService,
    ClinicalPatternEngineService,
    SpecialtyConstraintValidatorService,
    ICDCandidateResolverService,
  ],
})
export class PreExamV2Module {}
