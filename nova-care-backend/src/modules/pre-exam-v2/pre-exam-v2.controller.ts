import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Delete,
  UploadedFile,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ScreeningLLMService } from '@/modules/ai/services/screening-llm.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { PreExamV2Service } from './pre-exam-v2.service';
import { ScreeningMediaService } from './services/screening-media.service';
import { StartPreExamDto } from './dto/start-session.dto';
import { SubmitSymptomDto } from './dto/submit-symptom.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { SCREENING_CATALOG } from './normalization/screening-input';

@ApiTags('Pre-Exam v2 (Smart Screening)')
@ApiBearerAuth()
@Controller('api/v1/pre-exam-v2')
export class PreExamV2Controller {
  constructor(
    private service: PreExamV2Service,
    private mediaService: ScreeningMediaService,
    private screeningLLM: ScreeningLLMService,
  ) {}

  @Public()
  @Get('screening-catalog')
  getScreeningCatalog() {
    return { data: SCREENING_CATALOG };
  }

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bắt đầu phiên sàng lọc tiền khám mới' })
  async start(@CurrentUser() user: any, @Body() dto: StartPreExamDto) {
    const sessionId = await this.service.startSession(user.id, dto);
    return { data: { sessionId } };
  }

  @Public()
  @Post('sessions/:id/media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tải lên video/audio recording cho phiên sàng lọc (Video & Voice)' })
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() dto: { durationMs?: number; scriptId?: string; type?: string },
  ) {
    const result = await this.mediaService.saveMedia(id, file, dto);
    return { data: result };
  }

  @Public()
  @Delete('sessions/:id/media/:mediaId')
  @ApiOperation({ summary: 'Xóa video/audio recording khỏi hệ thống' })
  async deleteMedia(@Param('id') id: string, @Param('mediaId') mediaId: string) {
    const result = await this.mediaService.deleteMedia(id, mediaId);
    return { data: result };
  }

  @Post(':id/symptoms')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'voice', maxCount: 1 },
      { name: 'images', maxCount: 5 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Gửi triệu chứng (kèm sơ đồ cơ thể, file ghi âm giọng nói & ảnh)' })
  async submitSymptoms(
    @Param('id') id: string,
    @Body() dto: SubmitSymptomDto,
    @UploadedFiles() files: { voice?: any[]; images?: any[] },
  ) {
    const voiceFile = files?.voice && files.voice.length > 0 ? files.voice[0] : undefined;
    const imageFiles = files?.images || [];

    const result = await this.service.submitSymptoms(id, dto, { voiceFile, imageFiles });
    return { data: result };
  }

  @Post(':id/answer')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Gửi câu trả lời cho câu hỏi thích ứng AI' })
  async answerQuestion(@Param('id') id: string, @Body() dto: AnswerQuestionDto) {
    const result = await this.service.answerQuestion(id, dto);
    return { data: result };
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Hoàn thành và nhận kết quả phân loại nguy cơ & đề xuất bác sĩ' })
  async complete(@Param('id') id: string) {
    const result = await this.service.completeSession(id);
    return { data: result };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết phiếu tiền khám' })
  async getDetail(@Param('id') id: string) {
    const session = await this.service.getSession(id);
    return { data: session };
  }

  @Public()
  @Post('transcribe')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async transcribe(@UploadedFile() file: any, @Body() dto: { consent?: string }) {
    if (dto.consent !== 'true' || !file?.buffer?.length || !/^(audio\/(webm|wav|mpeg|mp4|ogg)|video\/(webm|mp4))(;.*)?$/.test(file.mimetype))
      throw new BadRequestException('Cần đồng ý xử lý bản ghi và cung cấp file âm thanh hợp lệ, tối đa 10 MB.');
    try { return { data: { transcript: await this.screeningLLM.transcribe(file), status: 'NEEDS_CONFIRMATION' } }; }
    catch { throw new ServiceUnavailableException('Chưa thể chuyển giọng nói thành văn bản. Vui lòng thử lại hoặc nhập mô tả.'); }
  }

  @Public()
  @Post('analyze-smartphone')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'voice', maxCount: 1 },
      { name: 'images', maxCount: 3 },
    ], { limits: { fileSize: 5 * 1024 * 1024, files: 3, fieldSize: 64 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Phân tích sàng lọc 100% Smartphone (PPG nhịp tim, BMI, Voice, Vision & Triage 3 cấp)' })
  async analyzeSmartphone(
    @Body() dto: any,
    @UploadedFiles() files: { voice?: any[]; images?: any[] },
  ) {
    const voiceFile = files?.voice && files.voice.length > 0 ? files.voice[0] : undefined;
    const imageFiles = files?.images || [];

    const result = await this.service.analyzeSmartphoneInputs(dto, { voiceFile, imageFiles });
    return { data: result };
  }

  @Public()
  @Post('health-assessment')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'voice', maxCount: 1 },
      { name: 'images', maxCount: 5 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Đánh giá sức khỏe sơ bộ NovaCare AI (Multimodal Health Assessment)' })
  async evaluateHealthAssessment(
    @CurrentUser() user: any,
    @Body() dto: any,
    @UploadedFiles() files: { voice?: any[]; images?: any[] },
  ) {
    const voiceFile = files?.voice && files.voice.length > 0 ? files.voice[0] : undefined;
    const imageFiles = files?.images || [];

    const result = await this.service.evaluateHealthAssessment(user?.id, dto, { voiceFile, imageFiles });
    return { data: result };
  }
}
