import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AiService } from './ai.service';
import { CreatePreExamSessionDto } from './dto/create-session.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@Injectable()
export class PreExamService {
  private readonly logger = new Logger(PreExamService.name);
  private readonly MAX_QUESTIONS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Tạo session tiền khám mới và sinh câu hỏi đầu tiên
   */
  async createSession(userId: string, dto: CreatePreExamSessionDto) {
    // Session hết hạn sau 7 ngày
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.prisma.preExamSession.create({
      data: {
        userId,
        initialText: dto.initialText,
        voiceTranscript: dto.voiceTranscript,
        bodyDiagramData: dto.bodyDiagramData as any,
        uploadedFiles: dto.uploadedFiles || [],
        expiresAt,
      },
    });

    // Sinh câu hỏi đầu tiên từ AI
    const { question, context, isComplete } = await this.aiService.generateNextQuestion(
      dto.initialText || null,
      [],
    );

    if (!isComplete && question) {
      await this.prisma.preExamQuestion.create({
        data: {
          sessionId: session.id,
          question,
          order: 1,
          context: context as any,
        },
      });
    }

    return this.getSession(session.id, userId);
  }

  /**
   * Gửi câu trả lời và lấy câu hỏi tiếp theo
   */
  async answerAndGetNext(sessionId: string, userId: string, dto: AnswerQuestionDto) {
    const session = await this.prisma.preExamSession.findFirst({
      where: { id: sessionId, userId, status: 'IN_PROGRESS' },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy session tiền khám hoặc session đã kết thúc');
    }

    // Lấy câu hỏi chưa trả lời cuối cùng
    const unanswered = session.questions.find(q => !q.answer);
    if (!unanswered) {
      throw new BadRequestException('Không có câu hỏi nào đang chờ trả lời');
    }

    // Lưu câu trả lời
    await this.prisma.preExamQuestion.update({
      where: { id: unanswered.id },
      data: { answer: dto.answer },
    });

    const updatedQAs = session.questions.map(q =>
      q.id === unanswered.id
        ? { ...q, answer: dto.answer, context: q.context as any }
        : { ...q, context: q.context as any },
    );

    // Sinh câu hỏi tiếp theo
    const { question, context, isComplete } = await this.aiService.generateNextQuestion(
      session.initialText,
      updatedQAs.map(q => ({
        question: q.question,
        answer: q.answer || undefined,
        order: q.order,
        context: q.context as Record<string, any>,
      })),
    );

    if (!isComplete && question) {
      await this.prisma.preExamQuestion.create({
        data: {
          sessionId: session.id,
          question,
          order: session.questions.length + 1,
          context: context as any,
        },
      });
    }

    return this.getSession(sessionId, userId);
  }

  /**
   * Hoàn thành session, tạo phiếu tiền khám và đề xuất hành trình
   */
  async completeSession(sessionId: string, userId: string) {
    const session = await this.prisma.preExamSession.findFirst({
      where: { id: sessionId, userId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (!session) {
      throw new NotFoundException('Không tìm thấy session tiền khám');
    }
    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Session đã hoàn thành trước đó');
    }

    const answeredQAs = session.questions
      .filter(q => q.answer)
      .map(q => ({
        question: q.question,
        answer: q.answer || '',
        order: q.order,
        context: q.context as Record<string, any>,
      }));

    // Tạo phiếu tiền khám từ AI
    const structuredData = await this.aiService.generateStructuredData(
      session.initialText,
      answeredQAs,
    );

    // Tạo đề xuất hành trình
    const recommendations = await this.aiService.generateRecommendations(structuredData);

    const updatedSession = await this.prisma.preExamSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        structuredData: structuredData as any,
        recommendations: recommendations as any,
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    // Đồng bộ / cập nhật Medical Passport
    await this.syncMedicalPassport(userId, structuredData);

    this.logger.log(`Pre-exam session ${sessionId} completed for user ${userId}`);
    return updatedSession;
  }

  /**
   * Lấy thông tin session
   */
  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.preExamSession.findFirst({
      where: { id: sessionId, userId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!session) {
      throw new NotFoundException('Không tìm thấy session tiền khám');
    }
    return session;
  }

  /**
   * Lấy đề xuất hành trình
   */
  async getRecommendations(sessionId: string, userId: string) {
    const session = await this.prisma.preExamSession.findFirst({
      where: { id: sessionId, userId, status: 'COMPLETED' },
    });
    if (!session) {
      throw new NotFoundException('Không tìm thấy session hoặc session chưa hoàn thành');
    }
    return {
      structuredData: session.structuredData,
      recommendations: session.recommendations,
    };
  }

  /**
   * Tạo lịch khám từ phiếu tiền khám
   */
  async createAppointmentFromPreExam(
    userId: string,
    sessionId: string,
    selectedSlotId: string,
    patientProfileId: string,
  ) {
    const session = await this.prisma.preExamSession.findFirst({
      where: { id: sessionId, userId, status: 'COMPLETED' },
    });
    if (!session) {
      throw new NotFoundException('Không tìm thấy session hoặc session chưa hoàn thành');
    }

    const structured = session.structuredData as any;
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id: selectedSlotId },
      include: { doctorWorkplace: { include: { doctor: true, hospital: true, specialty: true } } },
    });
    if (!slot || !slot.isAvailable || slot.bookedCount >= slot.capacity) {
      throw new BadRequestException('Khung giờ không còn trống');
    }

    const bookingCode = `BK${Date.now().toString().slice(-8)}`;
    const consultationFee = Number(slot.doctorWorkplace.consultationFee) || 0;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút để thanh toán

    const appointment = await this.prisma.$transaction(async tx => {
      const apt = await tx.appointment.create({
        data: {
          bookingCode,
          patientProfileId,
          slotId: selectedSlotId,
          userId,
          reason: structured?.chiefComplaint || 'Khám theo phiếu tiền khám',
          symptoms: structured?.symptoms?.join(', ') || '',
          totalPrice: consultationFee,
          consultationFee,
          expiresAt,
          status: 'AWAITING_PAYMENT',
        },
      });

      await tx.appointmentStatusHistory.create({
        data: { appointmentId: apt.id, status: 'AWAITING_PAYMENT', note: 'Tạo từ phiếu tiền khám' },
      });

      await tx.appointmentSlot.update({
        where: { id: selectedSlotId },
        data: { bookedCount: { increment: 1 } },
      });

      return apt;
    });

    return appointment;
  }

  /**
   * Đồng bộ Medical Passport sau khi hoàn thành session
   */
  private async syncMedicalPassport(userId: string, structuredData: any) {
    const existing = await this.prisma.medicalPassport.findUnique({ where: { userId } });

    const summary = {
      chiefComplaint: structuredData.chiefComplaint,
      symptoms: structuredData.symptoms,
      allergies: structuredData.allergies,
      medications: structuredData.currentMedications,
      medicalHistory: structuredData.medicalHistory,
      lastUpdated: new Date().toISOString(),
    };

    if (existing) {
      await this.prisma.medicalPassport.update({
        where: { userId },
        data: { summary, version: { increment: 1 } },
      });
    } else {
      await this.prisma.medicalPassport.create({
        data: { userId, summary },
      });
    }
  }
}
