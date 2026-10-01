import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { MedicalRAGService } from './services/medical-rag.service';
import { ScreeningLLMService } from './services/screening-llm.service';
import { ClinicalEvidenceService } from './services/clinical-evidence.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenAIService, MedicalRAGService, ScreeningLLMService, ClinicalEvidenceService],
  exports: [OpenAIService, MedicalRAGService, ScreeningLLMService, ClinicalEvidenceService],
})
export class AIModule {}
