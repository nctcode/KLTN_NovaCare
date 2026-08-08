import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { OpenAIService } from '@/modules/ai/openai.service';
import { TriageEngineService } from './services/triage-engine.service';
import { RecommendationService } from './services/recommendation.service';
import { GoogleSpeechToTextService } from './services/speech-to-text.service';
import { OpenAIVisionService } from './services/vision-analysis.service';
import { StartPreExamDto } from './dto/start-session.dto';
import { SubmitSymptomDto } from './dto/submit-symptom.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@Injectable()
export class PreExamV2Service {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private openAIService: OpenAIService,
    private triageEngine: TriageEngineService,
    private recommendationService: RecommendationService,
    private speechService: GoogleSpeechToTextService,
    private visionService: OpenAIVisionService,
  ) {}

  async startSession(userId: string, dto: StartPreExamDto) {
    const session = await this.prisma.preExamSession.create({
      data: {
        userId,
        structuredData: { patientInfo: { ...dto } } as any,
        status: 'IN_PROGRESS',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return session.id;
  }

  async submitSymptoms(sessionId: string, dto: SubmitSymptomDto, files?: { voiceFile?: any; imageFiles?: any[] }) {
    const session = await this.prisma.preExamSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session không tồn tại');

    // 1. Process Voice via Whisper API
    let transcript = '';
    if (files?.voiceFile) {
      transcript = await this.speechService.transcribe(files.voiceFile);
    }

    // 2. Process Images via GPT-4o Vision API
    const imageAnalysis: any[] = [];
    if (files?.imageFiles && files.imageFiles.length > 0) {
      for (const img of files.imageFiles) {
        const result = await this.visionService.analyzeImage(img);
        imageAnalysis.push(result);
      }
    }

    // 3. Parse body diagram & vitals safely
    let parsedBodyDiagram = null;
    if (dto.bodyDiagram) {
      try {
        parsedBodyDiagram = typeof dto.bodyDiagram === 'string' ? JSON.parse(dto.bodyDiagram) : dto.bodyDiagram;
      } catch {
        parsedBodyDiagram = [{ area: dto.bodyDiagram }];
      }
    }

    let parsedVitals = null;
    if (dto.vitals) {
      try {
        parsedVitals = typeof dto.vitals === 'string' ? JSON.parse(dto.vitals) : dto.vitals;
      } catch {
        parsedVitals = null;
      }
    }

    // 4. Update session in DB
    const uploadedFiles: string[] = [];
    if (files?.voiceFile) uploadedFiles.push(files.voiceFile.path || files.voiceFile.filename || 'voice.wav');
    if (files?.imageFiles) {
      files.imageFiles.forEach((f) => uploadedFiles.push(f.path || f.filename || 'image.jpg'));
    }

    await this.prisma.preExamSession.update({
      where: { id: sessionId },
      data: {
        initialText: dto.text,
        voiceTranscript: transcript,
        bodyDiagramData: parsedBodyDiagram,
        imageAnalysis: imageAnalysis as any,
        uploadedFiles: uploadedFiles,
      },
    });

    // 5. Generate Adaptive AI Questions via GPT-4o Chat
    const questions = await this.generateAdaptiveQuestions(sessionId, dto.text, parsedBodyDiagram, session);
    return { sessionId, transcript, imageAnalysis, questions };
  }

  private async generateAdaptiveQuestions(sessionId: string, text: string, bodyDiagram: any, session: any) {
    // Clear old questions
    await this.prisma.preExamQuestion.deleteMany({ where: { sessionId } });

    const patientInfo = (session.structuredData as any)?.patientInfo || {};

    // Get previous answers (empty for first call)
    const prevQs = await this.prisma.preExamQuestion.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
    });

    // Call GPT-4o to generate adaptive questions
    const aiQuestions = await this.openAIService.generateAdaptiveQuestions(
      text || '',
      { age: patientInfo.age, gender: patientInfo.gender, medicalHistory: patientInfo.medicalHistory },
      prevQs.map((q) => ({ question: q.question, answer: q.answer })),
    );

    const createdQuestions = [];
    for (let i = 0; i < aiQuestions.length; i++) {
      const q = aiQuestions[i];
      const created = await this.prisma.preExamQuestion.create({
        data: {
          sessionId,
          question: q.question,
          order: i + 1,
          context: { context: q.context } as any,
        },
      });
      createdQuestions.push({ id: created.id, question: created.question, order: created.order });
    }
    return createdQuestions;
  }

  async answerQuestion(sessionId: string, dto: AnswerQuestionDto) {
    const question = await this.prisma.preExamQuestion.findUnique({ where: { id: dto.questionId } });
    if (!question) throw new NotFoundException('Câu hỏi không tồn tại');
    await this.prisma.preExamQuestion.update({ where: { id: dto.questionId }, data: { answer: dto.answer } });
    return { success: true };
  }

  async completeSession(sessionId: string) {
    const session = await this.prisma.preExamSession.findUnique({
      where: { id: sessionId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Session không tồn tại');

    // 1. AI Summarize Pre-Exam (GPT-4o Chat)
    const aiSummary = await this.openAIService.summarizePreExam({
      patientInfo: (session.structuredData as any)?.patientInfo,
      initialText: session.initialText ?? undefined,
      voiceTranscript: session.voiceTranscript ?? undefined,
      bodyDiagramData: session.bodyDiagramData,
      questions: session.questions.map((q: any) => ({ question: q.question, answer: q.answer })),
    });

    const structuredData = {
      ...(typeof session.structuredData === 'object' ? (session.structuredData as any) : {}),
      initialText: session.initialText,
      voiceTranscript: session.voiceTranscript,
      bodyDiagramData: session.bodyDiagramData,
      imageAnalysis: (session as any).imageAnalysis,
      answers: session.questions.map((q: any) => ({ question: q.question, answer: q.answer })),
      aiSummary,
    };

    // 2. Risk Triage Assessment (Rules + AI data)
    const riskAssessment = this.triageEngine.assess({
      ...structuredData,
      ...aiSummary,
    });

    // 3. Recommendations Engine
    const recommendations = await this.recommendationService.generate(structuredData, riskAssessment);

    // 4. Update session in DB
    const updated = await this.prisma.preExamSession.update({
      where: { id: sessionId },
      data: {
        structuredData,
        riskLevel: riskAssessment.level as any,
        recommendations,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // 5. Audit Log
    try {
      await this.auditLogService.logAction({
        userId: session.userId,
        action: 'PRE_EXAM_SESSION',
        entityType: 'PreExamSession',
        entityId: sessionId,
        newValue: {
          riskLevel: riskAssessment.level,
          suggestedSpecialty: aiSummary.suggestedSpecialty || (recommendations as any)?.suggestedSpecialty,
          completedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Ignore log error
    }

    return { sessionId: updated.id, riskAssessment, recommendations, structuredData };
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.preExamSession.findUnique({
      where: { id: sessionId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Session không tồn tại');
    return session;
  }

  async analyzeSmartphoneInputs(dto: {
    symptoms?: string;
    heartRateBpm?: number;
    heightCm?: number;
    weightKg?: number;
    hospitalId?: string;
    bodyAreas?: any;
    questionnaire?: any;
  }, files?: { voiceFile?: any; imageFiles?: any[] }) {
    // 1. Process Voice via Whisper if uploaded
    let transcript = '';
    if (files?.voiceFile) {
      try {
        transcript = await this.speechService.transcribe(files.voiceFile);
      } catch (err) {
        transcript = '';
      }
    }

    // 2. Process Images via GPT-4o Vision
    const imageAnalysisFindings: string[] = [];
    if (files?.imageFiles && files.imageFiles.length > 0) {
      for (const img of files.imageFiles) {
        try {
          const result = await this.visionService.analyzeImage(img);
          if (result?.findings) imageAnalysisFindings.push(result.findings);
        } catch {
          // ignore error
        }
      }
    }

    // 3. Parse Body Areas and Questionnaire JSON safely
    let parsedBodyAreas: string[] = [];
    if (dto.bodyAreas) {
      if (Array.isArray(dto.bodyAreas)) {
        parsedBodyAreas = dto.bodyAreas;
      } else {
        try {
          parsedBodyAreas = JSON.parse(dto.bodyAreas);
        } catch {
          parsedBodyAreas = [dto.bodyAreas];
        }
      }
    }

    let parsedQuestionnaire: any = null;
    if (dto.questionnaire) {
      try {
        parsedQuestionnaire = typeof dto.questionnaire === 'string' ? JSON.parse(dto.questionnaire) : dto.questionnaire;
      } catch {
        parsedQuestionnaire = null;
      }
    }

    // 4. Fetch hospital and available specialties if hospitalId provided
    let hospitalName = 'Bệnh viện NovaCare';
    let availableSpecialties: string[] = [];
    if (dto.hospitalId) {
      const hosp = await this.prisma.hospital.findUnique({
        where: { id: dto.hospitalId },
        include: { hospitalSpecialties: { include: { specialty: true } } },
      });
      if (hosp) {
        hospitalName = hosp.name;
        availableSpecialties = hosp.hospitalSpecialties.map((hs) => hs.specialty.name);
      }
    }

    // 5. Run OpenAIService Smartphone Triage
    const result = await this.openAIService.analyzeSmartphoneInputs({
      symptoms: dto.symptoms,
      voiceTranscript: transcript,
      heartRateBpm: dto.heartRateBpm ? Number(dto.heartRateBpm) : undefined,
      heightCm: dto.heightCm ? Number(dto.heightCm) : undefined,
      weightKg: dto.weightKg ? Number(dto.weightKg) : undefined,
      imageAnalysisFindings,
      bodyAreas: parsedBodyAreas,
      questionnaire: parsedQuestionnaire,
      hospitalName,
      availableSpecialties,
    });

    return {
      ...result,
      transcript,
      imageAnalysisFindings,
      bodyAreas: parsedBodyAreas,
      questionnaire: parsedQuestionnaire,
    };
  }
}
