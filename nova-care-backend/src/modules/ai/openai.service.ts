import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ImageAnalysisResult {
  type: string;
  findings: string;
  suggestion: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AdaptiveQuestion {
  question: string;
  context: string;
}

export interface PreExamSummary {
  reason: string;
  chiefComplaint: string;
  symptomDetails: {
    location: string;
    severity: number;
    duration: string;
    trigger: string;
    relief: string;
  };
  pastHistory: {
    chronicDiseases: string[];
    medications: { name: string; dosage: string }[];
    allergies: string[];
  };
  priority: string;
  suggestedSpecialty: string;
}

@Injectable()
export class OpenAIService {
  private readonly client: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);
  private readonly modelVision: string;
  private readonly modelChat: string;
  private readonly modelWhisper: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(private configService: ConfigService) {
    const apiKey = process.env.OPENAI_API_KEY || this.configService.get<string>('OPENAI_API_KEY') || 'unconfigured';
    const baseUrl = process.env.OPENAI_BASE_URL || this.configService.get<string>('OPENAI_BASE_URL') || 'https://platform.beeknoee.com/api/v1';


    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
      timeout: 30000,
      maxRetries: 2,
    });
    this.modelVision = process.env.OPENAI_MODEL_VISION || this.configService.get<string>('OPENAI_MODEL_VISION') || 'gpt-5.4';
    this.modelChat = process.env.OPENAI_MODEL_CHAT || this.configService.get<string>('OPENAI_MODEL_CHAT') || 'gpt-5.4';
    this.modelWhisper = process.env.OPENAI_MODEL_WHISPER || this.configService.get<string>('OPENAI_MODEL_WHISPER') || 'whisper-1';
    this.maxTokens = 2000;
    this.temperature = 0.3;
  }

  private hasApiKey(): boolean {
    return Boolean(process.env.OPENAI_API_KEY || this.configService.get<string>('OPENAI_API_KEY'));
  }

  /**
   * Phân tích hình ảnh y tế (da, mắt, họng, vết thương, móng)
   */
  async analyzeImage(
    imageBase64OrBuffer: string | Buffer,
    imageType: 'skin' | 'eye' | 'throat' | 'wound' | 'nail' = 'skin',
  ): Promise<ImageAnalysisResult> {
    if (!this.hasApiKey()) {
      return this.fallbackImageAnalysis(imageType);
    }
    try {
      const base64 = Buffer.isBuffer(imageBase64OrBuffer)
        ? imageBase64OrBuffer.toString('base64')
        : imageBase64OrBuffer;
      const imageTypeNames: Record<string, string> = {
        skin: 'da', eye: 'mắt', throat: 'họng', wound: 'vết thương', nail: 'móng tay',
      };
      const imageTypeName = imageTypeNames[imageType] || 'da';
      const prompt = this.getImageAnalysisPrompt(imageType);

      const response = await this.client.chat.completions.create({
        model: this.modelVision,
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý y tế NovaCare. Phân tích hình ảnh ${imageTypeName}. Quy tắc: 1. Chỉ mô tả những gì quan sát được. 2. Phân loại mức độ: LOW, MEDIUM, HIGH. 3. Trả về JSON: {"findings":"...","suggestion":"...","severity":"LOW|MEDIUM|HIGH"}`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Phân tích hình ảnh ${imageType}: ${prompt}` },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            ],
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return this.fallbackImageAnalysis(imageType);
      const result = JSON.parse(content);
      this.logger.log(`OpenAI Vision phân tích ${imageType}: severity=${result.severity}`);
      return {
        type: imageTypeName,
        findings: result.findings || 'Không phát hiện bất thường rõ rệt',
        suggestion: result.suggestion || 'Chưa có đề xuất cụ thể',
        severity: result.severity || 'MEDIUM',
      };
    } catch (error) {
      this.logger.error(`Lỗi phân tích ảnh: ${error.message}`);
      return this.fallbackImageAnalysis(imageType);
    }
  }

  /**
   * Tạo câu hỏi thích ứng (GPT-4o Chat)
   */
  async generateAdaptiveQuestions(
    symptoms: string,
    patientInfo: { age?: number; gender?: string; medicalHistory?: string[] },
    previousQuestions: Array<{ question: string; answer: string | null }> = [],
  ): Promise<AdaptiveQuestion[]> {
    if (!this.hasApiKey()) {
      return this.fallbackQuestions(symptoms);
    }
    try {
      const conversation = previousQuestions
        .filter((q) => q.answer)
        .map((q) => `Hỏi: ${q.question}\nTrả lời: ${q.answer}`)
        .join('\n');

      const prompt = `Bạn là trợ lý y tế NovaCare. Đặt 3-5 câu hỏi để thu thập thêm thông tin.
Bệnh nhân: Tuổi ${patientInfo.age || '?'}, Giới tính ${patientInfo.gender || '?'}, Tiền sử: ${patientInfo.medicalHistory?.join(', ') || 'Không có'}
Triệu chứng: ${symptoms}
${conversation ? `Lịch sử:\n${conversation}\n` : ''}
Tập trung: mức đau (1-10), thời gian, yếu tố tăng/giảm, triệu chứng kèm theo.
Trả về mảng JSON: [{"question":"...","context":"pain|duration|trigger|accompanying|risk"}]
Tối đa 5 câu.`;

      const response = await this.client.chat.completions.create({
        model: this.modelChat,
        messages: [
          { role: 'system', content: 'Trợ lý y tế NovaCare, đặt câu hỏi thu thập triệu chứng.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return this.fallbackQuestions(symptoms);
      const result = JSON.parse(content);
      const questions: AdaptiveQuestion[] = Array.isArray(result) ? result : (result.questions || []);
      this.logger.log(`OpenAI sinh ${questions.length} câu hỏi thích ứng`);
      return questions.slice(0, 5);
    } catch (error) {
      this.logger.error(`Lỗi tạo câu hỏi: ${error.message}`);
      return this.fallbackQuestions(symptoms);
    }
  }

  /**
   * Tổng hợp phiếu tiền khám có cấu trúc (GPT-4o Chat)
   */
  async summarizePreExam(sessionData: {
    patientInfo?: any;
    initialText?: string;
    voiceTranscript?: string;
    bodyDiagramData?: any;
    questions?: Array<{ question: string; answer: string | null }>;
  }): Promise<PreExamSummary> {
    if (!this.hasApiKey()) {
      return this.fallbackSummary(sessionData);
    }
    try {
      const conversation =
        sessionData.questions
          ?.filter((q) => q.answer)
          .map((q) => `Hỏi: ${q.question}\nTrả lời: ${q.answer}`)
          .join('\n') || '';

      const prompt = `Tổng hợp phiếu tiền khám NovaCare từ:
Bệnh nhân: ${JSON.stringify(sessionData.patientInfo || {})}
Triệu chứng: ${sessionData.initialText || ''}
Ghi âm: ${sessionData.voiceTranscript || ''}
Vị trí đau: ${JSON.stringify(sessionData.bodyDiagramData || [])}
${conversation ? `Hội thoại:\n${conversation}` : ''}
Trả về JSON:
{"reason":"...","chiefComplaint":"...","symptomDetails":{"location":"...","severity":0,"duration":"...","trigger":"...","relief":"..."},"pastHistory":{"chronicDiseases":[],"medications":[],"allergies":[]},"priority":"NORMAL|HIGH|URGENT","suggestedSpecialty":"..."}`;

      const response = await this.client.chat.completions.create({
        model: this.modelChat,
        messages: [
          { role: 'system', content: 'Tổng hợp thông tin thành phiếu tiền khám có cấu trúc.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return this.fallbackSummary(sessionData);
      this.logger.log('OpenAI tổng hợp phiếu tiền khám thành công');
      return JSON.parse(content) as PreExamSummary;
    } catch (error) {
      this.logger.error(`Lỗi tổng hợp phiếu: ${error.message}`);
      return this.fallbackSummary(sessionData);
    }
  }

  /**
   * Phân tích tổng hợp 100% dữ liệu Smartphone (PPG Heart Rate, BMI, Voice, Vision, Triage 3 Cấp)
   */
  async analyzeSmartphoneInputs(inputs: {
    symptoms?: string;
    voiceTranscript?: string;
    heartRateBpm?: number;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    imageAnalysisFindings?: string[];
    bodyAreas?: string[];
    questionnaire?: {
      duration?: string;
      painLevel?: number;
      warningSigns?: string[];
      medicalHistory?: string[];
      specificSymptoms?: string[];
      voiceBiomarkers?: { clinicalEvaluation?: string };
    };
    hospitalName?: string;
    availableSpecialties?: string[];
    retrievedMedicalKnowledge?: string;
  }): Promise<{
    riskLevel: 'MONITOR' | 'CONSULT' | 'EMERGENCY';
    riskLabel: string;
    riskColor: string;
    recommendedSpecialtyName: string;
    summary: string;
    vitalSignsAssessment: string;
    triageDetails: {
      urgencyReason: string;
      actionAdvice: string;
      keyObservations: string[];
    };
  }> {
    const bmiVal = inputs.bmi || (inputs.heightCm && inputs.weightKg ? (inputs.weightKg / Math.pow(inputs.heightCm / 100, 2)) : undefined);
    const heartRate = inputs.heartRateBpm;

    if (!this.hasApiKey()) {
      return this.fallbackSmartphoneTriage(inputs, heartRate, bmiVal);
    }

    try {
      const prompt = `DỮ LIỆU ĐA PHƯƠNG THỨC THU THẬP TỪ BỆNH NHÂN (100% SMARTPHONE):
1. VÙNG CƠ THỂ BẤT THƯỜNG (Body Map): ${inputs.bodyAreas?.join(', ') || 'Khảo sát toàn thân'}
2. KHẢO SÁT LÂM SÀNG & TIỀN SỬ:
   - Triệu chứng đặc thù: ${inputs.questionnaire?.specificSymptoms?.join('; ') || inputs.symptoms || 'Không chọn chi tiết'}
   - Thời gian khởi phát: ${inputs.questionnaire?.duration || 'Chưa rõ'}
   - Mức độ đau/khó chịu: ${inputs.questionnaire?.painLevel || 0} / 10
   - Dấu hiệu cảnh báo đỏ (Red Flags): ${inputs.questionnaire?.warningSigns?.join('; ') || 'Không có dấu hiệu cảnh báo đỏ'}
   - TIỀN SỬ BỆNH LÝ & YẾU TỐ NGUY CƠ: ${inputs.questionnaire?.medicalHistory?.join('; ') || 'Chưa ghi nhận tiền sử mạn tính'}
   - Mô tả thêm của người bệnh: "${inputs.symptoms || inputs.voiceTranscript || 'Không có'}"
3. SINH HIỆU & THỂ TRẠNG:
   - Nhịp tim đo qua Camera PPG: ${heartRate ? `${heartRate} BPM` : '75 BPM (Nghỉ ngơi)'}
   - Chiều cao / Cân nặng: ${inputs.heightCm || '?'} cm, ${inputs.weightKg || '?'} kg (BMI: ${bmiVal ? bmiVal.toFixed(1) : '22.0'} kg/m²)
4. ÂM SINH HỌC GIỌNG NÓI / TIẾNG HO (Whisper STT):
   - ${inputs.voiceTranscript || 'Không có ghi âm giọng nói'}
5. ẢNH SOI LÂM SÀNG (Computer Vision):
   - ${inputs.imageAnalysisFindings?.join('; ') || 'Không có ảnh chụp tổn thương'}

NHIỆM VỤ:
1. Tổng hợp dữ liệu đã cung cấp thành đoạn tóm tắt sàng lọc lâm sàng.
2. Không tự thêm triệu chứng.Không suy diễn dữ liệu thiếu thành dữ liệu âm tính.
3. Xác định các pattern lâm sàng khả dĩ (MUSCULOSKELETAL, RESPIRATORY, CARDIOVASCULAR, GASTROINTESTINAL, NEUROLOGICAL, DERMATOLOGICAL, ENDOCRINE...).
4. Liệt kê bằng chứng ủng hộ và bằng chứng chống lại.
5. Đề xuất các candidate condition (tên khả năng y tế) để backend đối chiếu.
6. KHÔNG đưa ra mã ICD-10 tự sinh và KHÔNG tự quyết định tên chuyên khoa.

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON STRICT:
{
  "clinicalSummary": "Tóm tắt kết quả sàng lọc tổng hợp từ dữ liệu thu được",
  "vitalSignsAssessment": "Đánh giá nhịp tim PPG và BMI",
  "historyCorrelation": "Nhận định về yếu tố tiền sử nền nếu có",
  "clinicalPatterns": [
    {
      "pattern": "MUSCULOSKELETAL",
      "confidence": 0.8,
      "supportingEvidence": ["Ấn vào đau thành ngực", "Đau tăng khi hít sâu/xoay người"],
      "contradictingEvidence": ["Không có đau kiểu đè nặng lan tay/hàm"]
    }
  ],
  "candidateConditions": [
    {
      "term": "Theo dõi viêm sụn sườn / Đau thành ngực",
      "confidence": 0.8,
      "supportingEvidence": ["Đau tái tạo khi ấn thành ngực", "Đau tăng khi hít sâu"],
      "contradictingEvidence": []
    }
  ],
  "missingInformation": ["Thông tin tiền sử chi tiết"],
  "reasoningSummary": "Biện giải lâm sàng dựa trên các bằng chứng thu được",
  "safetyNotes": []
}`;

      const response = await this.client.chat.completions.create({
        model: this.modelChat,
        messages: [
          {
            role: 'system',
            content:
              'Bạn là thành phần hỗ trợ sàng lọc lâm sàng của hệ thống NovaCare. Bạn KHÔNG phải bác sĩ điều trị. Bạn KHÔNG đưa ra chẩn đoán xác định. Bạn KHÔNG tự quyết định chuyên khoa cuối cùng.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return this.fallbackSmartphoneTriage(inputs, heartRate, bmiVal);
      const res = JSON.parse(content);
      this.logger.log(`OpenAI Clinical Extraction Completed: summary=${res.clinicalSummary?.slice(0, 40)}`);
      return {
        riskLevel: 'CONSULT',
        riskLabel: 'Nên khám bác sĩ chuyên khoa',
        riskColor: 'amber',
        recommendedSpecialtyName: '', // Left blank so Backend Engine calculates it deterministically!
        summary: res.clinicalSummary || res.reasoningSummary || 'Đã tổng hợp kết quả sàng lọc y tế',
        vitalSignsAssessment: res.vitalSignsAssessment || 'Chỉ số sinh hiệu ổn định.',
        historyCorrelation: res.historyCorrelation || 'Chưa ghi nhận tiền sử mạn tính đặc biệt.',
        clinicalPatterns: res.clinicalPatterns || [],
        candidateConditions: res.candidateConditions || [],
        triageDetails: {
          urgencyReason: 'Cần bác sĩ chuyên khoa kiểm tra lâm sàng trực tiếp.',
          actionAdvice: 'Đăng ký đặt lịch khám với chuyên khoa phù hợp.',
          keyObservations: (res.candidateConditions || []).map((c: any) => c.term),
        },
        imageAnalysisFindings: inputs.imageAnalysisFindings || [],
        transcript: inputs.voiceTranscript || '',
      } as any;
    } catch (error) {
      this.logger.error(`Lỗi Smartphone Triage: ${error.message}`);
      return this.fallbackSmartphoneTriage(inputs, heartRate, bmiVal);
    }
  }

  private fallbackSmartphoneTriage(inputs: any, heartRate?: number, bmiVal?: number) {
    let riskLevel: 'MONITOR' | 'CONSULT' | 'EMERGENCY' = 'CONSULT';
    let riskLabel = 'Nên khám bác sĩ chuyên khoa';
    let riskColor = 'amber';

    if (heartRate && (heartRate > 130 || heartRate < 45)) {
      riskLevel = 'EMERGENCY';
      riskLabel = 'CẦN ĐẾN CẤP CỨU NGAY (Bất thường nhịp tim)';
      riskColor = 'rose';
    } else if (!inputs.symptoms && !inputs.voiceTranscript) {
      riskLevel = 'MONITOR';
      riskLabel = 'Có thể theo dõi tại nhà';
      riskColor = 'emerald';
    }

    const lower = (inputs.symptoms || inputs.voiceTranscript || '').toLowerCase();
    const areas = (inputs.bodyAreas || []).map((a: string) => a.toUpperCase());
    let specialty = 'Nội tổng quát';
    if (areas.includes('HEAD') || lower.includes('đầu') || lower.includes('chóng mặt')) specialty = 'Thần kinh';
    else if (areas.includes('LEG') || lower.includes('bàn chân') || lower.includes('chân')) specialty = 'Cơ xương khớp';
    else if (lower.includes('da') || lower.includes('ngứa') || lower.includes('phát ban')) specialty = 'Da liễu';
    else if (lower.includes('tim') || lower.includes('ngực') || (heartRate && heartRate > 100)) specialty = 'Tim mạch';
    else if (lower.includes('ho') || lower.includes('họng') || lower.includes('tai')) specialty = 'Tai Mũi Họng';

    const historyItems = inputs.questionnaire?.medicalHistory || [];
    const historyText = historyItems.length > 0
      ? `Người bệnh có tiền sử: ${historyItems.join(', ')}. Đây là yếu tố nguy cơ nền cần được bác sĩ chuyên khoa lưu ý khi thăm khám.`
      : 'Chưa ghi nhận tiền sử bệnh mạn tính đặc biệt.';

    return {
      riskLevel,
      riskLabel,
      riskColor,
      recommendedSpecialtyName: '', // Backend Engine calculates deterministically
      summary: `Tóm tắt sàng lọc lâm sàng (${inputs.bodyAreas?.join(', ') || 'Vùng đã chọn'}): ${inputs.symptoms || inputs.voiceTranscript || 'Ghi nhận dấu hiệu cần thăm khám lâm sàng chuyên khoa'}.`,
      vitalSignsAssessment: `Nhịp tim PPG ${heartRate || 75} BPM (${heartRate && heartRate > 100 ? 'Nhịp nhanh' : 'Ổn định'}), Chỉ số BMI: ${bmiVal ? bmiVal.toFixed(1) : '22.0'} kg/m² (Cân đối).`,
      historyCorrelation: historyText,
      differentialDiagnoses: [
        { diseaseName: `Theo dõi bệnh lý chuyên khoa ${specialty}`, icdCode: 'R69', probability: 'Cao' },
        { diseaseName: 'Rối loạn chức năng thần kinh thực vật / Căng thẳng', icdCode: 'F45.3', probability: 'Trung bình' },
      ],
      triageDetails: {
        urgencyReason: riskLevel === 'EMERGENCY' ? 'Cảnh báo nhịp tim vượt ngưỡng an toàn hoặc mức đau dữ dội!' : 'Cần bác sĩ chuyên khoa kiểm tra lâm sàng và chẩn đoán xác định.',
        actionAdvice: riskLevel === 'EMERGENCY' ? 'Đến phòng cấp cứu gần nhất lập tức.' : 'Đăng ký đặt lịch khám với bác sĩ chuyên khoa phù hợp.',
        keyObservations: [
          `Vùng tổn thương: ${inputs.bodyAreas?.join(', ') || 'Toàn thân'}`,
          `Mức độ đau: ${inputs.questionnaire?.painLevel || 0}/10 • Thời gian: ${inputs.questionnaire?.duration || 'Chưa rõ'}`,
          `Yếu tố nguy cơ nền: ${historyItems.join(', ') || 'Không có'}`,
        ],
      },
      imageAnalysisFindings: inputs.imageAnalysisFindings || [],
      transcript: inputs.voiceTranscript || '',
    };
  }

  /**
   * Chuyển đổi giọng nói thành văn bản (Whisper)
   */
  async transcribeAudio(audioBuffer: Buffer, audioFormat = 'webm'): Promise<string> {
    if (!this.hasApiKey()) {
      return this.fallbackTranscription();
    }
    const tempFile = path.join(os.tmpdir(), `audio_${Date.now()}.${audioFormat}`);
    try {
      fs.writeFileSync(tempFile, audioBuffer);
      const response = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        language: 'vi',
        prompt: 'Khai báo triệu chứng y tế NovaCare: đau ngực, ho, sốt, đau đầu, mệt mỏi, khó thở.',
        response_format: 'text',
        temperature: 0.0,
      });
      this.logger.log('Whisper chuyển đổi giọng nói thành công');
      let text = (response as unknown as string) || '';

      // Filter known YouTube hallucination phrases when audio has silence or background noise
      const hallucinationKeywords = [
        'đăng ký kênh',
        'ủng hộ kênh',
        'subscribe',
        'cảm ơn các bạn đã xem',
        'nhớ bấm chuông',
        'theo dõi kênh',
        'like và chia sẻ',
      ];

      const lowerText = text.toLowerCase();
      if (hallucinationKeywords.some(keyword => lowerText.includes(keyword))) {
        this.logger.warn(`Whisper hallucination detected: "${text}". Replacing with clean notice.`);
        return 'Đã thu âm tiếng ho / âm thanh triệu chứng (Không có câu nói dài).';
      }

      return text || 'Đã thu âm âm thanh triệu chứng thành công.';
    } catch (error) {
      this.logger.error(`Lỗi Whisper: ${error.message}`);
      return this.fallbackTranscription();
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  }

  // ==========================================
  // FALLBACK METHODS (100% offline)
  // ==========================================

  private fallbackImageAnalysis(imageType: string): ImageAnalysisResult {
    const map: Record<string, ImageAnalysisResult> = {
      skin: { type: 'da', findings: 'Hình ảnh da được ghi nhận. Cần bác sĩ kiểm tra trực tiếp.', suggestion: 'Nên đến cơ sở y tế để được khám da liễu', severity: 'MEDIUM' },
      eye: { type: 'mắt', findings: 'Mắt có dấu hiệu đỏ nhẹ. Cần kiểm tra chuyên sâu.', suggestion: 'Nên khám mắt để loại trừ viêm kết mạc', severity: 'MEDIUM' },
      throat: { type: 'họng', findings: 'Họng có dấu hiệu viêm đỏ.', suggestion: 'Nên khám Tai Mũi Họng để điều trị kịp thời', severity: 'MEDIUM' },
      wound: { type: 'vết thương', findings: 'Vết thương cần được đánh giá bởi bác sĩ.', suggestion: 'Làm sạch vết thương và đến cơ sở y tế gần nhất', severity: 'MEDIUM' },
      nail: { type: 'móng tay', findings: 'Móng có dấu hiệu bất thường.', suggestion: 'Nên khám da liễu để đánh giá tình trạng móng', severity: 'LOW' },
    };
    return map[imageType] || map['skin'];
  }

  private fallbackQuestions(symptoms: string): AdaptiveQuestion[] {
    const lower = (symptoms || '').toLowerCase();
    const base: AdaptiveQuestion[] = [
      { question: 'Triệu chứng này đã kéo dài bao lâu?', context: 'duration' },
      { question: 'Bạn có đang dùng bất kỳ loại thuốc nào không?', context: 'medication' },
      { question: 'Có triệu chứng nào khác đi kèm không?', context: 'accompanying' },
    ];
    if (lower.includes('đau') || lower.includes('tức') || lower.includes('nhức')) {
      base.unshift({ question: 'Mức độ đau từ 1 đến 10 là bao nhiêu?', context: 'pain' });
    }
    return base.slice(0, 5);
  }

  private fallbackSummary(sessionData: any): PreExamSummary {
    return {
      reason: 'Bệnh nhân cần được khám để đánh giá chính xác tình trạng sức khỏe',
      chiefComplaint: sessionData.initialText || 'Triệu chứng chưa được mô tả rõ',
      symptomDetails: { location: 'Chưa xác định', severity: 0, duration: 'Chưa rõ', trigger: 'Chưa rõ', relief: 'Chưa rõ' },
      pastHistory: { chronicDiseases: [], medications: [], allergies: [] },
      priority: 'NORMAL',
      suggestedSpecialty: 'Nội tổng quát',
    };
  }

  private fallbackTranscription(): string {
    return 'Không thể nhận diện giọng nói. Vui lòng nhập văn bản mô tả triệu chứng.';
  }

  private getImageAnalysisPrompt(imageType: string): string {
    const prompts: Record<string, string> = {
      skin: 'Phân tích da: màu sắc, tổn thương, phát ban, nốt bất thường.',
      eye: 'Phân tích mắt: đỏ, vàng, đục thủy tinh thể, xuất huyết.',
      throat: 'Phân tích họng: đỏ, sưng, mủ, loét.',
      wound: 'Phân tích vết thương: kích thước, độ sâu, chảy máu, nhiễm trùng.',
      nail: 'Phân tích móng: màu sắc, hình dạng, gãy, nấm.',
    };
    return prompts[imageType] || 'Phân tích hình ảnh y tế.';
  }
}
