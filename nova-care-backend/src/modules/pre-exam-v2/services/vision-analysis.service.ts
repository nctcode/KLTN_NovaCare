import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService, ImageAnalysisResult } from '@/modules/ai/openai.service';

@Injectable()
export class OpenAIVisionService {
  private readonly logger = new Logger(OpenAIVisionService.name);

  constructor(private readonly openAIService: OpenAIService) {}

  async analyzeImage(file: any): Promise<ImageAnalysisResult> {
    try {
      this.logger.log(`Analyzing image: ${file.originalname || file.path || 'image'}`);

      const buffer: Buffer = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : file.path
          ? require('fs').readFileSync(file.path)
          : Buffer.alloc(0);

      // Detect image type from filename
      const filename = (file.originalname || file.filename || '').toLowerCase();
      let imageType: 'skin' | 'eye' | 'throat' | 'wound' | 'nail' = 'skin';
      if (filename.includes('eye') || filename.includes('mat')) imageType = 'eye';
      else if (filename.includes('throat') || filename.includes('hong')) imageType = 'throat';
      else if (filename.includes('wound') || filename.includes('vet')) imageType = 'wound';
      else if (filename.includes('nail') || filename.includes('mong')) imageType = 'nail';

      return await this.openAIService.analyzeImage(buffer, imageType);
    } catch (error) {
      this.logger.error('Lỗi phân tích hình ảnh', error);
      return {
        type: 'tổn thương lâm sàng',
        findings: 'Dữ liệu hình ảnh được tiếp nhận thành công',
        suggestion: 'Bác sĩ sẽ trực tiếp xem xét hình ảnh khi thăm khám',
        severity: 'MEDIUM',
      };
    }
  }
}
