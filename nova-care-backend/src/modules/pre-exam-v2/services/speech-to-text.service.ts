import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '@/modules/ai/openai.service';

@Injectable()
export class GoogleSpeechToTextService {
  private readonly logger = new Logger(GoogleSpeechToTextService.name);

  constructor(private readonly openAIService: OpenAIService) {}

  async transcribe(file: any): Promise<string> {
    try {
      this.logger.log(`Transcribing audio: ${file.originalname || file.path || 'audio'}`);
      const buffer: Buffer = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : file.path
          ? require('fs').readFileSync(file.path)
          : Buffer.alloc(0);

      if (buffer.length === 0) {
        return 'Không có dữ liệu âm thanh để xử lý.';
      }

      const ext = (file.originalname || file.filename || 'audio.wav').split('.').pop() || 'wav';
      return await this.openAIService.transcribeAudio(buffer, ext);
    } catch (error) {
      this.logger.error('Lỗi xử lý giọng nói', error);
      return 'Không thể nhận diện giọng nói. Vui lòng nhập văn bản mô tả triệu chứng.';
    }
  }
}
