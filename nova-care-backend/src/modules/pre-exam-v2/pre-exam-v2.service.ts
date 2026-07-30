import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day expiration
      },
    });
    return session.id;
  }

  async submitSymptoms(sessionId: string, dto: SubmitSymptomDto, files?: { voiceFile?: any; imageFiles?: any[] }) {
    const session = await this.prisma.preExamSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session không tồn tại');

    // 1. Process Voice
    let transcript = '';
    if (files?.voiceFile) {
      transcript = await this.speechService.transcribe(files.voiceFile);
    }

    // 2. Process Images
    const imageAnalysis: any[] = [];
    if (files?.imageFiles && files.imageFiles.length > 0) {
      for (const img of files.imageFiles) {
        const result = await this.visionService.analyzeImage(img);
        imageAnalysis.push(result);
      }
    }

    // Parse body diagram & vitals JSON safely
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

    // 3. Update session
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
        imageAnalysis: imageAnalysis,
        uploadedFiles: uploadedFiles,
      },
    });

    // 4. Generate Adaptive AI Questions
    const questions = await this.generateAdaptiveQuestions(sessionId, dto.text, parsedBodyDiagram);
    return { sessionId, transcript, imageAnalysis, questions };
  }

  private async generateAdaptiveQuestions(sessionId: string, text: string, bodyDiagram: any) {
    const lower = (text || '').toLowerCase();

    // Clear old questions
    await this.prisma.preExamQuestion.deleteMany({ where: { sessionId } });

    const qList: { question: string; order: number; options?: string[] }[] = [];

    if (lower.includes('đau') || lower.includes('tức') || lower.includes('nhức')) {
      qList.push({
        question: 'Mức độ đau của bạn ở mức nào trên thang điểm từ 1 đến 10?',
        order: 1,
        options: ['1-3 (Nhẹ)', '4-6 (Vừa)', '7-8 (Nặng)', '9-10 (Dữ dội)'],
      });
      qList.push({
        question: 'Triệu chứng xuất hiện liên tục hay từng cơn?',
        order: 2,
        options: ['Liên tục kéo dài', 'Từng cơn bùng phát', 'Thi thoảng xuất hiện'],
      });
    } else {
      qList.push({
        question: 'Triệu chứng này đã kéo dài bao lâu?',
        order: 1,
        options: ['Dưới 24 giờ', 'Từ 1-3 ngày', 'Từ 3-7 ngày', 'Trên 1 tuần'],
      });
    }

    qList.push({
      question: 'Bạn có kèm theo triệu chứng nào sau đây không?',
      order: 3,
      options: ['Sốt / Nóng lạnh', 'Vã mồ hôi / Khó thở', 'Chóng mặt / Buồn nôn', 'Không có triệu chứng khác'],
    });

    const createdQuestions = [];
    for (const q of qList) {
      const created = await this.prisma.preExamQuestion.create({
        data: {
          sessionId,
          question: q.question,
          order: q.order,
          context: q.options ? { options: q.options } : undefined,
        },
      });
      createdQuestions.push({
        id: created.id,
        question: created.question,
        order: created.order,
        options: q.options || [],
      });
    }

    return createdQuestions;
  }

  async answerQuestion(sessionId: string, dto: AnswerQuestionDto) {
    const question = await this.prisma.preExamQuestion.findUnique({
      where: { id: dto.questionId },
    });
    if (!question) throw new NotFoundException('Câu hỏi không tồn tại');

    await this.prisma.preExamQuestion.update({
      where: { id: dto.questionId },
      data: { answer: dto.answer },
    });

    return { success: true };
  }

  async completeSession(sessionId: string) {
    const session = await this.prisma.preExamSession.findUnique({
      where: { id: sessionId },
      include: { questions: true },
    });
    if (!session) throw new NotFoundException('Session không tồn tại');

    const structuredData = {
      ...(typeof session.structuredData === 'object' ? (session.structuredData as any) : {}),
      initialText: session.initialText,
      voiceTranscript: session.voiceTranscript,
      bodyDiagramData: session.bodyDiagramData,
      imageAnalysis: session.imageAnalysis,
      answers: session.questions.map((q: any) => ({ question: q.question, answer: q.answer })),
    };

    // 1. Risk Triage Assessment
    const riskAssessment = this.triageEngine.assess(structuredData);

    // 2. Recommendations Engine
    const recommendations = await this.recommendationService.generate(structuredData, riskAssessment);

    // 3. Update session in DB
    const updated = await this.prisma.preExamSession.update({
      where: { id: sessionId },
      data: {
        structuredData,
        riskLevel: riskAssessment.level,
        recommendations,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // 4. Audit Log Integration
    try {
      await this.auditLogService.logAction({
        userId: session.userId,
        action: 'PRE_EXAM_SESSION',
        entityType: 'PreExamSession',
        entityId: sessionId,
        newValue: {
          riskLevel: riskAssessment.level,
          suggestedSpecialty: (recommendations as any)?.suggestedSpecialty,
          completedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Ignore log error
    }

    return {
      sessionId: updated.id,
      riskAssessment,
      recommendations,
      structuredData,
    };
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.preExamSession.findUnique({
      where: { id: sessionId },
      include: { questions: true },
    });
    if (!session) throw new NotFoundException('Session không tồn tại');
    return session;
  }
}
