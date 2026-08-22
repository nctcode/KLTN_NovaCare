import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { MedicalRAGService } from './services/medical-rag.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenAIService, MedicalRAGService],
  exports: [OpenAIService, MedicalRAGService],
})
export class AIModule {}
