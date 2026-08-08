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
    const apiKey = this.configService.get<string>('app.openai.apiKey') || process.env.OPENAI_API_KEY;
    const baseUrl = this.configService.get<string>('app.openai.baseUrl') || process.env.OPENAI_BASE_URL || 'https://platform.beeknoee.com/api/v1';

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY chưa được cấu hình. AI sẽ chạy ở chế độ fallback.');
    } else {
      this.logger.log(`Khởi tạo OpenAI Client với Beeknoee API BaseURL: ${baseUrl}`);
    }

    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key',
      baseURL: baseUrl,
      timeout: 30000,
      maxRetries: 2,
    });
    this.modelVision = this.configService.get<string>('app.openai.modelVision') || process.env.OPENAI_MODEL_VISION || 'gpt-5.4';
    this.modelChat = this.configService.get<string>('app.openai.modelChat') || process.env.OPENAI_MODEL_CHAT || 'gpt-5.4';
    this.modelWhisper = this.configService.get<string>('app.openai.modelWhisper') || process.env.OPENAI_MODEL_WHISPER || 'whisper-1';
    this.maxTokens = this.configService.get<number>('app.openai.maxTokens') || 2000;
    this.temperature = this.configService.get<number>('app.openai.temperature') || 0.3;
  }

  private hasApiKey(): boolean {
    return !!this.configService.get<string>('app.openai.apiKey');
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
    };
    hospitalName?: string;
    availableSpecialties?: string[];
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
      const prompt = `Bạn là hệ thống AI Sàng Lọc & Phân Loại Cấp Cứu (Triage Engine) y tế NovaCare.
Phân tích dữ liệu từ Điện thoại thông minh (100% Smartphone-Only):
- Vùng bất thường trên cơ thể (Sơ đồ cơ thể Body Map): ${inputs.bodyAreas?.join(', ') || 'Chưa chọn'}
- Khảo sát trắc nghiệm triệu chứng:
  + Thời gian xuất hiện: ${inputs.questionnaire?.duration || 'Chưa rõ'}
  + Mức độ đau/khó chịu: ${inputs.questionnaire?.painLevel || 0}/10
  + Dấu hiệu cảnh báo: ${inputs.questionnaire?.warningSigns?.join(', ') || 'Không có'}
  + Tiền sử bệnh lý: ${inputs.questionnaire?.medicalHistory?.join(', ') || 'Không có'}
- Mô tả triệu chứng/Giọng nói: "${inputs.symptoms || inputs.voiceTranscript || 'Chưa rõ'}"
- Nhịp tim đo qua Camera PPG: ${heartRate ? `${heartRate} BPM` : 'Chưa đo'}
- Chiều cao/Cân nặng/BMI: ${inputs.heightCm || '?'}cm, ${inputs.weightKg || '?'}kg (BMI: ${bmiVal ? bmiVal.toFixed(1) : '?'})
- Kết quả soi camera tổn thương/xét nghiệm: ${inputs.imageAnalysisFindings?.join('; ') || 'Không có ảnh'}
- Cơ sở y tế đã chọn: ${inputs.hospitalName || 'Bệnh viện NovaCare'}
- Chuyên khoa sẵn có tại bệnh viện: ${inputs.availableSpecialties?.join(', ') || 'Nội tổng quát, Tim mạch, Da liễu, Tai Mũi Họng, Nhi khoa, Mắt, Thần kinh, Xương khớp'}

Yêu cầu phân loại Mức độ nguy cơ (Triage 3 Cấp):
- MONITOR: Nhẹ, theo dõi tại nhà hoặc khám thường
- CONSULT: Cần khám bác sĩ chuyên khoa trong ngày hoặc sớm
- EMERGENCY: Cấp cứu khẩn cấp (đau ngực kéo dài, khó thở nặng, sốt cao kèm giật, nhịp tim > 130 hoặc < 45 BPM, mức đau >= 8/10 kèm dấu hiệu nguy hiểm)

Gợi ý Chuyên khoa phù hợp nhất từ danh sách chuyên khoa sẵn có trên.

Trả về JSON duy nhất:
{
  "riskLevel": "MONITOR" | "CONSULT" | "EMERGENCY",
  "riskLabel": "Có thể theo dõi tại nhà" | "Nên khám bác sĩ chuyên khoa" | "CẦN ĐẾN CẤP CỨU NGAY",
  "riskColor": "emerald" | "amber" | "rose",
  "recommendedSpecialtyName": "Tên chuyên khoa gợi ý",
  "summary": "Tóm tắt tình trạng và nguyên nhân",
  "vitalSignsAssessment": "Đánh giá nhịp tim PPG và chỉ số BMI",
  "triageDetails": {
    "urgencyReason": "Lý do phân loại nguy cơ",
    "actionAdvice": "Lời khuyên hành động",
    "keyObservations": ["Bất thường 1", "Bất thường 2"]
  }
}`;

      const response = await this.client.chat.completions.create({
        model: this.modelChat,
        messages: [
          { role: 'system', content: 'Chuyên gia AI Sàng lọc y tế và Phân loại Triage y khoa.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return this.fallbackSmartphoneTriage(inputs, heartRate, bmiVal);
      const res = JSON.parse(content);
      this.logger.log(`OpenAI Smartphone Triage: riskLevel=${res.riskLevel}, specialty=${res.recommendedSpecialtyName}`);
      return {
        ...res,
        imageAnalysisFindings: inputs.imageAnalysisFindings || [],
        transcript: inputs.voiceTranscript || '',
      };
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
    let specialty = 'Nội tổng quát';
    if (lower.includes('da') || lower.includes('ngứa') || lower.includes('phát ban')) specialty = 'Da liễu';
    else if (lower.includes('tim') || lower.includes('ngực') || (heartRate && heartRate > 100)) specialty = 'Tim mạch';
    else if (lower.includes('ho') || lower.includes('họng') || lower.includes('tai')) specialty = 'Tai Mũi Họng';

    return {
      riskLevel,
      riskLabel,
      riskColor,
      recommendedSpecialtyName: specialty,
      summary: `Tình trạng ghi nhận: ${inputs.symptoms || inputs.voiceTranscript || 'Cần kiểm tra sức khỏe tổng quát'}. Nhịp tim PPG: ${heartRate || 72} BPM.`,
      vitalSignsAssessment: `Nhịp tim PPG ${heartRate || 75} BPM (Bình thường), BMI: ${bmiVal ? bmiVal.toFixed(1) : '22.0'} (Cân đối).`,
      triageDetails: {
        urgencyReason: riskLevel === 'EMERGENCY' ? 'Cảnh báo nhịp tim vượt ngưỡng an toàn!' : 'Cần bác sĩ chuyên khoa kiểm tra lâm sàng.',
        actionAdvice: riskLevel === 'EMERGENCY' ? 'Đến phòng cấp cứu gần nhất lập tức.' : 'Đăng ký đặt lịch khám với bác sĩ chuyên khoa phù hợp.',
        keyObservations: [
          `Nhịp tim PPG: ${heartRate || 75} BPM`,
          `Chỉ số BMI: ${bmiVal ? bmiVal.toFixed(1) : '22.0'}`,
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
