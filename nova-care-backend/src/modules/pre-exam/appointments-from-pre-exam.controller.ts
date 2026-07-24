import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PreExamService } from './pre-exam.service';

class CreateFromPreExamDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  selectedSlotId: string;

  @IsString()
  @IsNotEmpty()
  patientProfileId: string;
}

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/appointments')
export class AppointmentsFromPreExamController {
  constructor(private readonly preExamService: PreExamService) {}

  @Post('from-pre-exam')
  @ApiOperation({ summary: 'Tạo lịch khám từ phiếu tiền khám (tự động điền thông tin)' })
  @ApiBody({ type: CreateFromPreExamDto })
  createFromPreExam(@Request() req: any, @Body() dto: CreateFromPreExamDto) {
    return this.preExamService.createAppointmentFromPreExam(
      req.user.id,
      dto.sessionId,
      dto.selectedSlotId,
      dto.patientProfileId,
    );
  }
}
