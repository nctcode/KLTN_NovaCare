import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { GoogleSpeechToTextService } from './speech-to-text.service';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_MIME_TYPES = [
  'video/webm',
  'video/mp4',
  'video/ogg',
  'video/quicktime',
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/mpeg',
  'audio/ogg',
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

@Injectable()
export class ScreeningMediaService {
  private readonly logger = new Logger(ScreeningMediaService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'pre-exam-media');

  constructor(
    private prisma: PrismaService,
    private speechService: GoogleSpeechToTextService,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveMedia(
    sessionId: string,
    file: any,
    metadata?: { durationMs?: number; scriptId?: string; type?: string },
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên file media hợp lệ (SCREENING_MEDIA_MISSING)');
    }

    // 1. MIME & Size Validation (Source of truth on backend)
    const mimeType = file.mimetype || file.type || 'video/webm';
    if (!ALLOWED_MIME_TYPES.some((allowed) => mimeType.toLowerCase().startsWith(allowed))) {
      throw new BadRequestException(
        `Định dạng file media không được hỗ trợ (${mimeType}). Chỉ chấp nhận WebM, MP4, WAV. (SCREENING_MEDIA_INVALID_TYPE)`,
      );
    }

    const size = file.size || (file.buffer ? file.buffer.length : 0);
    if (size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `Dung lượng file vượt quá giới hạn 50MB. (SCREENING_MEDIA_TOO_LARGE)`,
      );
    }

    // Verify PreExamSession exists
    const session = await this.prisma.preExamSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Phiên sàng lọc không tồn tại');
    }

    // 2. Save file to server disk storage
    const ext = path.extname(file.originalname || 'recording.webm') || '.webm';
    const filename = `${sessionId}_${Date.now()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, filePath);
    }

    // 3. Transcribe audio track via Whisper STT (Speech-to-Text)
    let transcript = '';
    try {
      transcript = await this.speechService.transcribe({
        buffer: file.buffer || (fs.existsSync(filePath) ? fs.readFileSync(filePath) : null),
        originalname: filename,
        filename: filename,
        path: filePath,
      });
    } catch (err) {
      this.logger.warn(`STT processing non-fatal error: ${err.message}`);
      transcript = '';
    }

    // 4. Save metadata into ScreeningMedia DB table
    const mediaType = metadata?.type || 'VIDEO_VOICE';
    const mediaRecord = await this.prisma.screeningMedia.create({
      data: {
        sessionId,
        type: mediaType,
        storageKey: filename,
        mimeType,
        sizeBytes: size,
        durationMs: metadata?.durationMs ? Number(metadata.durationMs) : null,
        scriptId: metadata?.scriptId || 'DEFAULT_VOICE_SAMPLE',
        processingStatus: 'READY',
        transcript: transcript || null,
      },
    });

    // 5. Update PreExamSession voiceTranscript
    if (transcript) {
      const combinedTranscript = session.voiceTranscript
        ? `${session.voiceTranscript} | ${transcript}`
        : transcript;
      await this.prisma.preExamSession.update({
        where: { id: sessionId },
        data: {
          voiceTranscript: combinedTranscript,
          uploadedFiles: [...session.uploadedFiles, filename],
        },
      });
    }

    return {
      id: mediaRecord.id,
      sessionId: mediaRecord.sessionId,
      type: mediaRecord.type,
      storageKey: mediaRecord.storageKey,
      mimeType: mediaRecord.mimeType,
      sizeBytes: mediaRecord.sizeBytes,
      durationMs: mediaRecord.durationMs,
      scriptId: mediaRecord.scriptId,
      status: mediaRecord.processingStatus,
      transcript: mediaRecord.transcript,
      createdAt: mediaRecord.createdAt,
    };
  }

  async deleteMedia(sessionId: string, mediaId: string) {
    const mediaRecord = await this.prisma.screeningMedia.findFirst({
      where: { id: mediaId, sessionId },
    });

    if (!mediaRecord) {
      throw new NotFoundException('Dữ liệu media không tồn tại');
    }

    // Delete local file from disk
    const filePath = path.join(this.uploadDir, mediaRecord.storageKey);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        this.logger.warn(`Could not delete file ${filePath}: ${e.message}`);
      }
    }

    await this.prisma.screeningMedia.delete({ where: { id: mediaId } });
    return { success: true, deletedId: mediaId };
  }
}
