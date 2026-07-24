import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PreExamService } from './pre-exam.service';
import { CreatePreExamSessionDto } from './dto/create-session.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@ApiTags('Pre-Exam (Tiền khám AI)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/pre-exam/sessions')
export class PreExamController {
  constructor(private readonly preExamService: PreExamService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo session tiền khám mới và lấy câu hỏi đầu tiên' })
  createSession(@Request() req: any, @Body() dto: CreatePreExamSessionDto) {
    return this.preExamService.createSession(req.user.id, dto);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Gửi câu trả lời và lấy câu hỏi tiếp theo' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  answerQuestion(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: AnswerQuestionDto,
  ) {
    return this.preExamService.answerAndGetNext(sessionId, req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin session tiền khám' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  getSession(@Request() req: any, @Param('id') sessionId: string) {
    return this.preExamService.getSession(sessionId, req.user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Hoàn thành session, tạo phiếu tiền khám và đề xuất' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  completeSession(@Request() req: any, @Param('id') sessionId: string) {
    return this.preExamService.completeSession(sessionId, req.user.id);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Lấy đề xuất hành trình khám từ phiếu tiền khám' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  getRecommendations(@Request() req: any, @Param('id') sessionId: string) {
    return this.preExamService.getRecommendations(sessionId, req.user.id);
  }
}
