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

import { MedicalRAGService } from '@/modules/ai/services/medical-rag.service';

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
    private ragService: MedicalRAGService,
  ) { }

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

  async evaluateHealthAssessment(
    userId?: string,
    dto?: any,
    files?: { voiceFile?: any; imageFiles?: any[] },
  ) {
    // 1. Process Voice
    let transcript = '';
    if (files?.voiceFile) {
      try {
        transcript = await this.speechService.transcribe(files.voiceFile);
      } catch {
        transcript = '';
      }
    }

    // 2. Process Images
    const imageAnalysisFindings: string[] = [];
    if (files?.imageFiles && files.imageFiles.length > 0) {
      for (const img of files.imageFiles) {
        try {
          const result = await this.visionService.analyzeImage(img);
          if (result?.findings) imageAnalysisFindings.push(result.findings);
        } catch {
          // ignore
        }
      }
    }

    // 3. Parse JSON structures safely
    let symptoms: any[] = [];
    if (dto?.symptoms) {
      try {
        symptoms = typeof dto.symptoms === 'string' ? JSON.parse(dto.symptoms) : dto.symptoms;
      } catch {
        symptoms = [{ symptom: dto.symptoms }];
      }
    }

    let vitalSigns: any = {};
    if (dto?.vitalSigns) {
      try {
        vitalSigns = typeof dto.vitalSigns === 'string' ? JSON.parse(dto.vitalSigns) : dto.vitalSigns;
      } catch {
        vitalSigns = {};
      }
    }

    let medicalHistory: string[] = [];
    if (dto?.medicalHistory) {
      try {
        medicalHistory = typeof dto.medicalHistory === 'string' ? JSON.parse(dto.medicalHistory) : dto.medicalHistory;
      } catch {
        medicalHistory = [dto.medicalHistory];
      }
    }

    let medications: string[] = [];
    if (dto?.medications) {
      try {
        medications = typeof dto.medications === 'string' ? JSON.parse(dto.medications) : dto.medications;
      } catch {
        medications = [dto.medications];
      }
    }

    let allergies: string[] = [];
    if (dto?.allergies) {
      try {
        allergies = typeof dto.allergies === 'string' ? JSON.parse(dto.allergies) : dto.allergies;
      } catch {
        allergies = [dto.allergies];
      }
    }

    // If userId provided, retrieve default PatientProfile for enriched context
    if (userId && medicalHistory.length === 0) {
      const profile = await this.prisma.patientProfile.findFirst({
        where: { userId, isDefault: true },
      });
      if (profile?.medicalHistory) medicalHistory.push(profile.medicalHistory);
      if (profile?.allergies && allergies.length === 0) allergies.push(profile.allergies);
    }

    // 4. Safety & Red Flag Rules Check
    const redFlags: string[] = [];
    const hr = vitalSigns.heartRate ? Number(vitalSigns.heartRate) : undefined;
    const temp = vitalSigns.temperature ? Number(vitalSigns.temperature) : undefined;
    const bp = vitalSigns.bloodPressure;

    if (hr && (hr > 130 || hr < 45)) {
      redFlags.push(`Nhịp tim bất thường nguy hiểm: ${hr} BPM`);
    }
    if (temp && temp > 39.5) {
      redFlags.push(`Sốt cao nguy hiểm: ${temp}°C`);
    }
    if (bp) {
      const parts = bp.split('/');
      if (parts.length === 2) {
        const sys = parseInt(parts[0], 10);
        if (sys >= 180) redFlags.push(`Cơn tăng huyết áp cấp cứu: ${bp} mmHg`);
      }
    }

    const rawText = `${dto?.textInput || ''} ${transcript} ${symptoms.map((s) => s.symptom || '').join(' ')}`.toLowerCase();
    if (rawText.includes('đau ngực dữ dội') || rawText.includes('khó thở nặng') || rawText.includes('co giật')) {
      redFlags.push('Dấu hiệu suy hô hấp hoặc biến cố tim mạch cấp tính');
    }

    // 5. Determine Urgency & Risk Level
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY' = 'LOW';
    let urgency: 'home_monitoring' | 'doctor_visit' | 'prompt_visit' | 'emergency' = 'home_monitoring';

    if (redFlags.length > 0) {
      riskLevel = 'EMERGENCY';
      urgency = 'emergency';
    } else if (rawText.includes('đau') || rawText.includes('sốt') || rawText.includes('ho') || symptoms.length > 1) {
      riskLevel = 'MODERATE';
      urgency = 'doctor_visit';
    }

    // Ensure a valid userId for foreign key constraint if user is anonymous/guest
    let validUserId = userId;
    if (!validUserId) {
      const anyUser = await this.prisma.user.findFirst();
      if (anyUser) validUserId = anyUser.id;
    }

    // 6. Vector RAG Search with Anti-Gibberish Threshold Guardrail
    const ragResult = await this.ragService.searchSpecialtyRAG(rawText);

    // If input is non-medical / random nonsense, do NOT force doctor recommendation
    if (!ragResult.isMedicalInput) {
      let sessionId = `session-${Date.now()}`;
      if (validUserId) {
        try {
          const session = await this.prisma.preExamSession.create({
            data: {
              userId: validUserId,
              status: 'COMPLETED',
              completedAt: new Date(),
              initialText: dto?.textInput || '',
              voiceTranscript: transcript,
              uploadedFiles: [],
              structuredData: { symptoms, vitalSigns, medicalHistory, medications, allergies, imageAnalysisFindings } as any,
              recommendations: [] as any,
              riskLevel: 'LOW',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
          sessionId = session.id;
        } catch (err) {
          // fallback if session save fails
        }
      }

      return {
        assessment_id: sessionId,
        assessment_status: 'completed',
        risk_level: 'LOW',
        urgency: 'home_monitoring',
        red_flags_detected: [],
        possible_health_areas: ['Thông tin không phải triệu chứng y tế hợp lệ'],
        recommended_specialties: [],
        recommendation: ragResult.reasoning || 'Thông tin bạn nhập không chứa từ khóa triệu chứng y tế rõ ràng. Hãy theo dõi thêm tại nhà hoặc mô tả cụ thể hơn.',
        reasoning_summary: ragResult.reasoning,
        missing_information: ['Mô tả triệu chứng y tế chi tiết (ví dụ: đau đầu, sốt, đau ngực, phát ban...)'],
        disclaimer: 'Lưu ý: Hệ thống phát hiện dữ liệu nhập vào chưa có chỉ số triệu chứng y tế hợp lệ.',
      };
    }

    // Match Specialty based on Vector RAG Result
    const dbSpecialties = await this.prisma.specialty.findMany();
    let matchedSpec = dbSpecialties.find((s) => s.id === ragResult.matchedSpecialtyId);

    if (!matchedSpec) {
      matchedSpec = dbSpecialties.find(
        (s) => s.name.toLowerCase().includes((ragResult.matchedSpecialtyName || '').toLowerCase())
      ) || dbSpecialties[0];
    }
    const suggestedSpecialtyName = matchedSpec?.name || 'Nội tổng quát';
    const retrievedMedicalKnowledge = `Chuyên khoa: ${matchedSpec?.name || 'Nội tổng quát'}. Mô tả: ${matchedSpec?.description || ''}. Cần khám khi có triệu chứng liên quan.`;

    const now = new Date();

    // Query doctor workplaces that have active available slots in the future
    let doctors = await this.prisma.doctorWorkplace.findMany({
      where: {
        specialtyId: matchedSpec?.id,
        isActive: true,
        doctor: { isActive: true },
        slots: {
          some: {
            isAvailable: true,
            startTime: { gte: now },
          },
        },
      },
      include: {
        doctor: true,
        hospital: true,
        specialty: true,
        slots: {
          where: {
            isAvailable: true,
            startTime: { gte: now },
          },
          orderBy: { startTime: 'asc' },
          take: 20,
        },
      },
      take: 6,
    });

    // Fallback if no doctor currently has future slots scheduled
    if (doctors.length === 0) {
      doctors = await this.prisma.doctorWorkplace.findMany({
        where: {
          specialtyId: matchedSpec?.id,
          isActive: true,
          doctor: { isActive: true },
        },
        include: {
          doctor: true,
          hospital: true,
          specialty: true,
          slots: {
            where: {
              isAvailable: true,
              startTime: { gte: now },
            },
            orderBy: { startTime: 'asc' },
            take: 1,
          },
        },
        take: 4,
      });
    }

    // Extract unique hospitals offering this specialty from active doctors
    const recommendedHospitalsMap = new Map<string, any>();
    doctors.forEach((w) => {
      if (w.hospital && !recommendedHospitalsMap.has(w.hospitalId)) {
        recommendedHospitalsMap.set(w.hospitalId, {
          hospitalId: w.hospitalId,
          hospitalName: w.hospital.name,
          address: w.hospital.address || 'Hệ thống Bệnh viện NovaCare',
          phone: w.hospital.phone || '1900 1234',
        });
      }
    });
    const recommendedHospitals = Array.from(recommendedHospitalsMap.values());

    const recommendedSpecialties = [
      {
        specialty_id: matchedSpec?.id || 'default-spec',
        specialty_name: matchedSpec?.name || suggestedSpecialtyName,
        reason: `Dựa trên phân tích triệu chứng: ${symptoms.map((s) => s.symptom).join(', ') || 'Cần kiểm tra lâm sàng'}`,
        matched_doctors: doctors.map((w) => {
          const availableSlots = w.slots || [];
          const nextSlot = availableSlots[0];
          const nextSlotFormatted = nextSlot
            ? new Date(nextSlot.startTime).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
            : null;

          return {
            doctorId: w.doctorId,
            doctorName: w.doctor.fullName,
            title: w.doctor.title || 'Bác sĩ Chuyên khoa',
            hospitalId: w.hospitalId,
            hospitalName: w.hospital.name,
            consultationFee: Number(w.consultationFee),
            availableSlotsCount: availableSlots.length,
            nextAvailableSlot: nextSlotFormatted,
            hasAvailableSlots: availableSlots.length > 0,
          };
        }),
      },
    ];

    // 7. Save Health Assessment Session to DB
    let sessionId = `session-${Date.now()}`;
    if (validUserId) {
      try {
        const session = await this.prisma.preExamSession.create({
          data: {
            userId: validUserId,
            status: 'COMPLETED',
            completedAt: new Date(),
            initialText: dto?.textInput || '',
            voiceTranscript: transcript,
            uploadedFiles: [],
            structuredData: {
              symptoms,
              vitalSigns,
              medicalHistory,
              medications,
              allergies,
              imageAnalysisFindings,
            } as any,
            recommendations: recommendedSpecialties as any,
            riskLevel,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        sessionId = session.id;
      } catch (err) {
        // fallback
      }
    }

    return {
      assessment_id: sessionId,
      assessment_status: 'completed',
      risk_level: riskLevel,
      urgency,
      red_flags_detected: redFlags,
      possible_health_areas: [matchedSpec?.name || suggestedSpecialtyName],
      recommended_specialties: recommendedSpecialties,
      recommended_hospitals: recommendedHospitals,
      detailed_analysis: {
        symptom_breakdown: symptoms.length > 0
          ? `Đã phân tích ${symptoms.length} nhóm triệu chứng chính: ${symptoms.map(s => s.symptom).join(', ')}.`
          : 'Hệ thống đã nhận diện và tổng hợp dữ liệu mô tả triệu chứng của bệnh nhân.',
        vital_signs_interpretation: vitalSigns.heartRate
          ? `Nhịp tim đo qua camera PPG: ${vitalSigns.heartRate} BPM (Chỉ số sinh hiệu sẵn sàng).`
          : 'Chỉ số sinh hiệu ở mức ổn định.',
        rag_matching_reason: ragResult.reasoning,
        specialty_description: matchedSpec?.description || 'Chuyên khoa phụ trách chẩn đoán và điều trị chuyên sâu.',
      },
      recommendation:
        riskLevel === 'EMERGENCY'
          ? 'Thông tin được cung cấp có dấu hiệu cần được đánh giá y tế khẩn cấp. Không nên chờ lịch khám thông thường.'
          : riskLevel === 'MODERATE'
            ? 'Bạn nên đặt lịch để được bác sĩ chuyên khoa đánh giá trực tiếp.'
            : 'Bạn có thể theo dõi tình trạng tại nhà. Nếu triệu chứng kéo dài hoặc nặng hơn, hãy đi khám.',
      reasoning_summary: `${ragResult.reasoning} Nhịp tim: ${hr || 'bình thường'}, BMI/Chỉ số: sẵn sàng.`,
      missing_information: [],
      disclaimer: 'Lưu ý: Đây là đánh giá sơ bộ dựa trên AI RAG và không thay thế chẩn đoán hoặc thăm khám trực tiếp bởi nhân viên y tế.',
    };
  }
}
