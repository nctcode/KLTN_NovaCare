import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatusHistoryService } from './appointment-status-history.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Lịch khám')
@ApiBearerAuth('access-token')
@Controller('api/v1/appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly service: AppointmentsService,
    private readonly historyService: AppointmentStatusHistoryService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo lịch khám mới' })
  @ApiResponse({ status: 201, description: 'Tạo lịch khám thành công' })
  @ApiResponse({ status: 409, description: 'Khung giờ đã hết chỗ hoặc trùng lịch' })
  async create(@CurrentUser() user: User, @Body() createDto: CreateAppointmentDto) {
    const data = await this.service.create(user.id, createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo lịch khám thành công',
      data,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy tất cả lịch khám của tôi' })
  async findAll(@CurrentUser() user: User) {
    const data = await this.service.findByUser(user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách lịch khám thành công',
      data,
    };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Lấy lịch khám sắp tới' })
  async getUpcoming(@CurrentUser() user: User) {
    const data = await this.service.getUpcoming(user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách lịch sắp tới thành công',
      data,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Lấy lịch sử khám' })
  async getHistory(@CurrentUser() user: User) {
    const data = await this.service.getHistory(user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy lịch sử khám thành công',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết lịch khám' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    const data = await this.service.findOne(id, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết lịch khám thành công',
      data,
    };
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Lấy lịch sử trạng thái (timeline) của lịch khám' })
  async getTimeline(@Param('id') id: string) {
    const data = await this.historyService.getTimeline(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy lịch sử trạng thái thành công',
      data,
    };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy lịch khám' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() cancelDto: CancelAppointmentDto
  ) {
    const data = await this.service.cancel(id, user.id, cancelDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hủy lịch khám thành công',
      data,
    };
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Đổi lịch khám' })
  async reschedule(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('newSlotId') newSlotId: string
  ) {
    const data = await this.service.reschedule(id, user.id, newSlotId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Đổi lịch khám thành công',
      data,
    };
  }

  @Public()
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Hoàn thành lịch khám' })
  async complete(@Param('id') id: string) {
    const data = await this.service.complete(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hoàn thành lịch khám thành công',
      data,
    };
  }

  @Post('expire-pending')
  @ApiOperation({ summary: 'Quét và hủy các lịch khám quá hạn giữ chỗ (Background Job)' })
  async expirePending() {
    const expiredCount = await this.service.expirePendingAppointments();
    return {
      statusCode: HttpStatus.OK,
      message: `Đã hủy ${expiredCount} lịch khám quá hạn giữ chỗ`,
      data: { expiredCount },
    };
  }
}
