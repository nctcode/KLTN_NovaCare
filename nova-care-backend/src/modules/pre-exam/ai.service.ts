import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PreExamQA {
  question: string;
  answer?: string;
  order: number;
  context?: Record<string, any>;
}

export interface StructuredPreExamData {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: string; // mild, moderate, severe
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  suggestedSpecialty: string;
  urgencyLevel: string; // low, medium, high, emergency
  preparationNotes: string[];
}

export interface JourneyRecommendation {
  specialty: string;
  examType: string; // in-person, online
  preparationSteps: string[];
  suggestedTimeSlot: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly useRealAi: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('OPENAI_API_KEY');
    this.useRealAi = !!apiKey;
    if (this.useRealAi) {
      this.logger.log('AI Service initialized with real LLM provider');
    } else {
      this.logger.warn('AI Service running in mock mode (no API key configured)');
    }
  }

  /**
   * Sinh câu hỏi thích ứng tiếp theo dựa trên hội thoại đã có
   */
  async generateNextQuestion(
    initialText: string | null,
    previousQAs: PreExamQA[],
  ): Promise<{ question: string; context: Record<string, any>; isComplete: boolean }> {
    // Nếu đã có >= 5 câu hỏi, coi như đủ thông tin
    if (previousQAs.length >= 5) {
      return { question: '', context: {}, isComplete: true };
    }

    if (this.useRealAi) {
      return this.callLlmForNextQuestion(initialText, previousQAs);
    }
    return this.mockNextQuestion(previousQAs.length, initialText);
  }

  private mockNextQuestion(
    questionIndex: number,
    initialText: string | null,
  ): { question: string; context: Record<string, any>; isComplete: boolean } {
    const questions = [
      {
        question: `Triệu chứng ${initialText ? `"${initialText}"` : 'bạn đang gặp'} bắt đầu từ bao lâu rồi?`,
        context: { tags: ['duration'] },
      },
      {
        question: 'Mức độ khó chịu của bạn như thế nào trên thang điểm 1-10?',
        context: { tags: ['severity'] },
      },
      {
        question: 'Bạn có đang dùng thuốc nào thường xuyên không? Nếu có, hãy liệt kê tên thuốc.',
        context: { tags: ['medications'] },
      },
      {
        question: 'Bạn có tiền sử bệnh nền nào (tiểu đường, cao huyết áp, tim mạch...) không?',
        context: { tags: ['medical_history'] },
      },
      {
        question: 'Bạn có dị ứng với thuốc hoặc thực phẩm nào không?',
        context: { tags: ['allergies'] },
      },
    ];

    if (questionIndex >= questions.length) {
      return { question: '', context: {}, isComplete: true };
    }

    return {
      ...questions[questionIndex],
      isComplete: false,
    };
  }

  private async callLlmForNextQuestion(
    initialText: string | null,
    previousQAs: PreExamQA[],
  ): Promise<{ question: string; context: Record<string, any>; isComplete: boolean }> {
    // Placeholder cho tích hợp thực tế với Gemini/OpenAI
    this.logger.log('Calling LLM for adaptive question generation...');
    return this.mockNextQuestion(previousQAs.length, initialText);
  }

  /**
   * Phân tích toàn bộ hội thoại và tạo phiếu tiền khám có cấu trúc
   */
  async generateStructuredData(
    initialText: string | null,
    qas: PreExamQA[],
  ): Promise<StructuredPreExamData> {
    if (this.useRealAi) {
      return this.callLlmForStructuredData(initialText, qas);
    }
    return this.mockStructuredData(initialText, qas);
  }

  private mockStructuredData(
    initialText: string | null,
    qas: PreExamQA[],
  ): StructuredPreExamData {
    const durationAnswer = qas.find(q => q.context && (q.context as any).tags?.includes('duration'))?.answer || 'không rõ';
    const severityAnswer = qas.find(q => q.context && (q.context as any).tags?.includes('severity'))?.answer || '5';
    const medicationsAnswer = qas.find(q => q.context && (q.context as any).tags?.includes('medications'))?.answer || 'không';
    const historyAnswer = qas.find(q => q.context && (q.context as any).tags?.includes('medical_history'))?.answer || 'không';
    const allergiesAnswer = qas.find(q => q.context && (q.context as any).tags?.includes('allergies'))?.answer || 'không';

    const severityNum = parseInt(severityAnswer) || 5;
    const urgency = severityNum >= 8 ? 'high' : severityNum >= 5 ? 'medium' : 'low';

    return {
      chiefComplaint: initialText || 'Triệu chứng chưa xác định',
      symptoms: initialText ? [initialText] : ['Đau nhức'],
      duration: durationAnswer,
      severity: severityNum >= 7 ? 'severe' : severityNum >= 4 ? 'moderate' : 'mild',
      medicalHistory: historyAnswer !== 'không' ? [historyAnswer] : [],
      currentMedications: medicationsAnswer !== 'không' ? [medicationsAnswer] : [],
      allergies: allergiesAnswer !== 'không' ? [allergiesAnswer] : [],
      suggestedSpecialty: this.inferSpecialty(initialText),
      urgencyLevel: urgency,
      preparationNotes: ['Mang theo CCCD/CMND', 'Mang sổ khám bệnh (nếu có)', 'Nhịn ăn nếu cần xét nghiệm máu'],
    };
  }

  private async callLlmForStructuredData(
    initialText: string | null,
    qas: PreExamQA[],
  ): Promise<StructuredPreExamData> {
    this.logger.log('Calling LLM for structured data generation...');
    return this.mockStructuredData(initialText, qas);
  }

  /**
   * Tạo đề xuất hành trình khám dựa trên phiếu tiền khám
   */
  async generateRecommendations(structuredData: StructuredPreExamData): Promise<JourneyRecommendation> {
    const isUrgent = structuredData.urgencyLevel === 'high' || structuredData.urgencyLevel === 'emergency';
    return {
      specialty: structuredData.suggestedSpecialty,
      examType: isUrgent ? 'in-person' : 'in-person',
      preparationSteps: structuredData.preparationNotes,
      suggestedTimeSlot: isUrgent ? 'Sớm nhất có thể (trong ngày hôm nay)' : 'Trong vòng 3-7 ngày tới',
    };
  }

  private inferSpecialty(text: string | null): string {
    if (!text) return 'Nội tổng quát';
    const lower = text.toLowerCase();
    if (lower.includes('tim') || lower.includes('ngực') || lower.includes('huyết áp')) return 'Tim mạch';
    if (lower.includes('da') || lower.includes('mẩn') || lower.includes('ngứa')) return 'Da liễu';
    if (lower.includes('răng') || lower.includes('nướu') || lower.includes('miệng')) return 'Răng hàm mặt';
    if (lower.includes('mắt') || lower.includes('thị') || lower.includes('nhìn')) return 'Nhãn khoa';
    if (lower.includes('xương') || lower.includes('khớp') || lower.includes('cơ')) return 'Cơ xương khớp';
    if (lower.includes('đau đầu') || lower.includes('chóng mặt') || lower.includes('não')) return 'Thần kinh';
    if (lower.includes('bụng') || lower.includes('tiêu hóa') || lower.includes('dạ dày')) return 'Tiêu hóa';
    return 'Nội tổng quát';
  }
}
