import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminAppointmentsService } from './admin-appointments.service';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Admin - Quản lý Lịch khám')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAppointmentsController {
  constructor(private readonly service: AdminAppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách tất cả lịch khám (Phân trang, tìm kiếm, lọc đa chiều)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('hospitalId') hospitalId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      status,
      hospitalId,
      doctorId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết lịch khám & Dòng thời gian lịch sử' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái lịch khám (Confirm, Complete, Paid, v.v.)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
    @Body('note') note: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.updateStatus(id, status, note, req.user.id, ip, ua);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hủy lịch khám (ghi lý do)' })
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.cancelAppointment(id, reason, req.user.id, ip, ua);
  }
}
