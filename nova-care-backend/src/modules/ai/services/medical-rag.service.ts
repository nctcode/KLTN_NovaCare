import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import OpenAI from 'openai';

export interface RAGSearchResult {
  isMedicalInput: boolean;
  confidenceScore: number;
  matchedSpecialtyId?: string;
  matchedSpecialtyName?: string;
  reasoning: string;
}

@Injectable()
export class MedicalRAGService {
  private readonly client: OpenAI;
  private readonly logger = new Logger(MedicalRAGService.name);
  private readonly embeddingModel: string;

  // Threshold: If Cosine Similarity is < 0.30, treat input as Non-Medical / Random Gibberish
  private readonly MIN_SIMILARITY_THRESHOLD = 0.30;

  private specialtyVectorCache = new Map<string, number[]>();
  private useLocalFallbackOnly = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY || this.configService.get<string>('OPENAI_API_KEY') || 'sk-bee-a613857ed4c93784939978ad2e5bec8624d8757050e88448e8a448db01b4f84d';
    const baseUrl = process.env.OPENAI_BASE_URL || this.configService.get<string>('OPENAI_BASE_URL') || 'https://platform.beeknoee.com/api/v1';

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
      timeout: 3000,
    });
    this.embeddingModel = process.env.OPENAI_MODEL_EMBEDDING || 'text-embedding-3-small';
  }

  /**
   * Generates a 1536-dimensional float vector embedding for any text via Beeknoee API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) return new Array(1536).fill(0);
    try {
      this.logger.log(`📡 [Beeknoee API Request] Sending text to ${this.embeddingModel}: "${text.slice(0, 35)}..."`);
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text.trim(),
      });
      const vector = response.data[0]?.embedding;
      this.logger.log(`✅ [Beeknoee API Response] Received 1536d vector successfully!`);
      return vector || this.fallbackLocalEmbedding(text);
    } catch (err: any) {
      this.logger.warn(`⚠️ [Beeknoee API Error]: ${err?.message || err}. Using fallback vector.`);
      return this.fallbackLocalEmbedding(text);
    }
  }

  /**
   * Computes Cosine Similarity between two N-dimensional vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Main RAG Search with Anti-Gibberish & Non-Medical Guardrail
   */
  async searchSpecialtyRAG(rawSymptomsText: string): Promise<RAGSearchResult> {
    const text = (rawSymptomsText || '').trim().toLowerCase();

    // 1. Basic Junk / Nonsense Input Filter
    if (text.length < 3 || /^[a-z]{1,4}$/i.test(text) || /^([a-z])\1+$/i.test(text)) {
      return {
        isMedicalInput: false,
        confidenceScore: 0,
        reasoning: 'Thông tin nhập vào chứa ký tự không hợp lệ hoặc quá ngắn. Vui lòng nhập triệu chứng cụ thể.',
      };
    }

    // 2. Fetch Specialties from DB Knowledge Base
    const specialties = await this.prisma.specialty.findMany();
    if (!specialties || specialties.length === 0) {
      return {
        isMedicalInput: true,
        confidenceScore: 0.5,
        matchedSpecialtyName: 'Nội tổng quát',
        reasoning: 'Không có dữ liệu chuyên khoa trong cơ sở dữ liệu.',
      };
    }

    const specialtyKeywordMap: Record<string, string[]> = {
      'Da liễu': ['da', 'ngứa', 'phát ban', 'mảng đỏ', 'gãi', 'rát', 'mụn', 'vẩy nến', 'nấm', 'mề đẫy', 'dị ứng da', 'nổi mảng'],
      'Tim mạch': ['tim', 'ngực', 'huyết áp', 'hồi hộp', 'đánh trống ngực', 'tức ngực', 'mạch'],
      'Thần kinh': ['đầu', 'mất ngủ', 'chóng mặt', 'tê tay', 'co giật', 'cột sống', 'migraine', 'thần kinh', 'đột quỵ'],
      'Tiêu hóa': ['dạ dày', 'ợ chua', 'ợ nóng', 'thượng vị', 'trào ngược', 'tiêu hóa', 'đại tràng', 'táo bón', 'bụng'],
      'Tai Mũi Họng': ['họng', 'sổ mũi', 'ngạt mũi', 'xoang', 'tai', 'amidan', 'khàn tiếng', 'ù tai'],
      'Cơ xương khớp': ['khớp', 'lưng', 'cột sống', 'vai', 'gút', 'gout', 'xương', 'thoái hóa'],
      'Sản phụ khoa': ['kinh nguyệt', 'phụ khoa', 'thai', 'âm đạo', 'tử cung', 'buồng trứng', 'chậm kinh'],
      'Nhi khoa': ['trẻ', 'em bé', 'nhi', 'quấy khóc', 'nôn trớ'],
      'Hô hấp': ['phổi', 'hen', 'ho có đờm', 'khò khè', 'phế quản'],
      'Mắt': ['mắt', 'cận thị', 'khô mắt', 'thủy tinh thể', 'kết mạc'],
      'Răng Hàm Mặt': ['răng', 'nướu', 'nha', 'hàm', 'sâu răng'],
      'Nội tiết': ['tuyến giáp', 'bướu cổ', 'tiểu đường', 'đái tháo đường', 'nội tiết']
    };

    // 3. Generate User Input Embedding
    const queryVector = await this.generateEmbedding(text);

    // 4. Calculate Vector Cosine Similarity against each Specialty Document
    let bestMatchScore = 0;
    let bestSpecialty: any = null;

    for (const spec of specialties) {
      const s = spec as any;
      let specSymptoms: string[] = [];
      try {
        if (Array.isArray(s.symptoms)) specSymptoms = s.symptoms;
        else if (typeof s.symptoms === 'string') specSymptoms = JSON.parse(s.symptoms);
      } catch {
        specSymptoms = [];
      }

      let specDiseases: string[] = [];
      try {
        if (Array.isArray(s.diseases)) specDiseases = s.diseases;
        else if (typeof s.diseases === 'string') specDiseases = JSON.parse(s.diseases);
      } catch {
        specDiseases = [];
      }
      
      let specVector = this.specialtyVectorCache.get(spec.id);
      if (!specVector) {
        const specText = `Specialty: ${spec.name}. Description: ${spec.description || ''}. Symptoms: ${specSymptoms.join(', ')}. Diseases: ${specDiseases.join(', ')}`;
        specVector = await this.generateEmbedding(specText);
        this.specialtyVectorCache.set(spec.id, specVector);
      }
      let sim = this.cosineSimilarity(queryVector, specVector);

      // Direct Symptom & Disease Keyword Booster
      let matchCount = 0;
      for (const sym of specSymptoms) {
        if (typeof sym === 'string' && sym.length > 2 && text.includes(sym.toLowerCase())) {
          matchCount += 2;
        }
      }
      for (const dis of specDiseases) {
        if (typeof dis === 'string' && dis.length > 2 && text.includes(dis.toLowerCase())) {
          matchCount += 2;
        }
      }
      const mappedKeywords = specialtyKeywordMap[spec.name] || [];
      for (const kw of mappedKeywords) {
        if (text.includes(kw)) matchCount += 2;
      }

      if (matchCount > 0) {
        sim = Math.min(0.98, sim + matchCount * 0.15);
      }

      if (sim > bestMatchScore) {
        bestMatchScore = sim;
        bestSpecialty = spec;
      }
    }

    // 5. Anti-Gibberish Guardrail Check: Threshold validation
    this.logger.log(`RAG Search for "${text}": Best Score = ${bestMatchScore.toFixed(3)}, Specialty = ${bestSpecialty?.name}`);

    if (bestMatchScore < this.MIN_SIMILARITY_THRESHOLD) {
      return {
        isMedicalInput: false,
        confidenceScore: bestMatchScore,
        reasoning: `Thông tin bạn nhập ("${text}") không khớp với bất kỳ triệu chứng y tế nào trong kho dữ liệu. Vui lòng mô tả lại triệu chứng hoặc theo dõi sức khỏe tại nhà.`,
      };
    }

    return {
      isMedicalInput: true,
      confidenceScore: bestMatchScore,
      matchedSpecialtyId: bestSpecialty.id,
      matchedSpecialtyName: bestSpecialty.name,
      reasoning: `Đã truy xuất RAG thành công (Độ khớp: ${(bestMatchScore * 100).toFixed(1)}%). Triệu chứng phù hợp với chuyên khoa ${bestSpecialty.name}.`,
    };
  }

  /**
   * Deterministic local embedding for offline fallback
   */
  private fallbackLocalEmbedding(text: string): number[] {
    const dim = 1536;
    const vec = new Array(dim).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const idx = (charCode * (j + 1) * (i + 1)) % dim;
        vec[idx] += 1 / (j + 1);
      }
    }
    let norm = 0;
    for (let v of vec) norm += v * v;
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let k = 0; k < dim; k++) vec[k] /= norm;
    }
    return vec;
  }
}
