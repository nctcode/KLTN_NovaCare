import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '@/modules/pre-exam/ai.service';
import { ConfigService } from '@nestjs/config';

describe('AiService', () => {
  let service: AiService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(null), // no API key → mock mode
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('generateNextQuestion', () => {
    it('should return first question for empty QAs', async () => {
      const result = await service.generateNextQuestion('Đau đầu', []);
      expect(result.isComplete).toBe(false);
      expect(result.question).toContain('bao lâu');
    });

    it('should mark complete when 5+ QAs provided', async () => {
      const qas = Array.from({ length: 5 }, (_, i) => ({
        question: `Q${i}`,
        answer: `A${i}`,
        order: i + 1,
        context: {},
      }));
      const result = await service.generateNextQuestion('Test', qas);
      expect(result.isComplete).toBe(true);
    });

    it('should include initialText in first question when provided', async () => {
      const result = await service.generateNextQuestion('Đau dạ dày', []);
      expect(result.question).toContain('Đau dạ dày');
    });
  });

  describe('generateStructuredData', () => {
    it('should return structured data with chiefComplaint from initialText', async () => {
      const qas = [
        { question: 'Bao lâu?', answer: '3 ngày', order: 1, context: { tags: ['duration'] } },
        { question: 'Mức độ?', answer: '8', order: 2, context: { tags: ['severity'] } },
        { question: 'Thuốc?', answer: 'không', order: 3, context: { tags: ['medications'] } },
        { question: 'Tiền sử?', answer: 'không', order: 4, context: { tags: ['medical_history'] } },
        { question: 'Dị ứng?', answer: 'không', order: 5, context: { tags: ['allergies'] } },
      ];

      const result = await service.generateStructuredData('Đau tim', qas);
      expect(result.chiefComplaint).toBe('Đau tim');
      expect(result.severity).toBe('severe');
      expect(result.urgencyLevel).toBe('high');
      expect(result.suggestedSpecialty).toContain('Tim mạch');
    });

    it('should infer Tiêu hóa specialty for stomach complaints', async () => {
      const result = await service.generateStructuredData('Đau bụng dữ dội', []);
      expect(result.suggestedSpecialty).toBe('Tiêu hóa');
    });

    it('should infer Nội tổng quát for unknown complaints', async () => {
      const result = await service.generateStructuredData('không biết', []);
      expect(result.suggestedSpecialty).toBe('Nội tổng quát');
    });
  });

  describe('generateRecommendations', () => {
    it('should recommend in-person for high urgency', async () => {
      const structured = {
        chiefComplaint: 'Đau ngực',
        symptoms: ['đau ngực'],
        duration: '1 giờ',
        severity: 'severe' as const,
        medicalHistory: [],
        currentMedications: [],
        allergies: [],
        suggestedSpecialty: 'Tim mạch',
        urgencyLevel: 'high',
        preparationNotes: [],
      };
      const result = await service.generateRecommendations(structured);
      expect(result.examType).toBe('in-person');
      expect(result.suggestedTimeSlot).toContain('hôm nay');
    });

    it('should include preparation steps', async () => {
      const structured = {
        chiefComplaint: 'Ngứa da',
        symptoms: [],
        duration: '1 tuần',
        severity: 'mild' as const,
        medicalHistory: [],
        currentMedications: [],
        allergies: [],
        suggestedSpecialty: 'Da liễu',
        urgencyLevel: 'low',
        preparationNotes: ['Mang theo CCCD/CMND'],
      };
      const result = await service.generateRecommendations(structured);
      expect(result.preparationSteps).toContain('Mang theo CCCD/CMND');
    });
  });
});
