import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { PreExamV2Service } from './pre-exam-v2.service';
import { StartPreExamDto } from './dto/start-session.dto';
import { SubmitSymptomDto } from './dto/submit-symptom.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@ApiTags('Pre-Exam v2 (Smart Screening)')
@ApiBearerAuth()
@Controller('api/v1/pre-exam-v2')
export class PreExamV2Controller {
  constructor(private service: PreExamV2Service) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bắt đầu phiên sàng lọc tiền khám mới' })
  async start(@CurrentUser() user: any, @Body() dto: StartPreExamDto) {
    const sessionId = await this.service.startSession(user.id, dto);
    return { data: { sessionId } };
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
  @Post('analyze-smartphone')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'voice', maxCount: 1 },
      { name: 'images', maxCount: 5 },
    ]),
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
