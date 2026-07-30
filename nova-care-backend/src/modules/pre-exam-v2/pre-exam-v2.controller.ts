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
import { PreExamV2Service } from './pre-exam-v2.service';
import { StartPreExamDto } from './dto/start-session.dto';
import { SubmitSymptomDto } from './dto/submit-symptom.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@ApiTags('Pre-Exam v2 (Smart Screening)')
@ApiBearerAuth()
@Controller('api/v1/pre-exam-v2')
@UseGuards(JwtAuthGuard)
export class PreExamV2Controller {
  constructor(private service: PreExamV2Service) {}

  @Post('start')
  @ApiOperation({ summary: 'Bắt đầu phiên sàng lọc tiền khám mới' })
  async start(@CurrentUser() user: any, @Body() dto: StartPreExamDto) {
    const sessionId = await this.service.startSession(user.id, dto);
    return { data: { sessionId } };
  }

  @Post(':id/symptoms')
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
  @ApiOperation({ summary: 'Gửi câu trả lời cho câu hỏi thích ứng AI' })
  async answerQuestion(@Param('id') id: string, @Body() dto: AnswerQuestionDto) {
    const result = await this.service.answerQuestion(id, dto);
    return { data: result };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Hoàn thành và nhận kết quả phân loại nguy cơ & đề xuất bác sĩ' })
  async complete(@Param('id') id: string) {
    const result = await this.service.completeSession(id);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết phiếu tiền khám' })
  async getDetail(@Param('id') id: string) {
    const session = await this.service.getSession(id);
    return { data: session };
  }
}
