import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Ip,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminAppointmentsService } from './admin-appointments.service';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Admin - Giám sát Lịch khám')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'HOSPITAL_ADMIN')
export class AdminAppointmentsController {
  constructor(private readonly service: AdminAppointmentsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê tổng quan lịch khám hôm nay và trạng thái' })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  getStats(@Req() req: any, @Query('hospitalId') hospitalId?: string) {
    let scopedHospitalId = hospitalId;
    if (req.user?.role === 'HOSPITAL_ADMIN') {
      if (!req.user.hospitalId) {
        throw new ForbiddenException('Tài khoản chưa được liên kết với cơ sở y tế nào');
      }
      scopedHospitalId = req.user.hospitalId;
    }
    return this.service.getStats(scopedHospitalId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tất cả lịch khám (Phân trang, tìm kiếm, lọc đa chiều)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  @ApiQuery({ name: 'specialtyId', required: false, type: String })
  @ApiQuery({ name: 'medicalServiceId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: AppointmentStatus | 'OVERDUE',
    @Query('hospitalId') hospitalId?: string,
    @Query('branchId') branchId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('medicalServiceId') medicalServiceId?: string,
    @Query('date') date?: string
  ) {
    let scopedHospitalId = hospitalId;
    if (req.user?.role === 'HOSPITAL_ADMIN') {
      if (!req.user.hospitalId) {
        throw new ForbiddenException('Tài khoản chưa được liên kết với cơ sở y tế nào');
      }
      scopedHospitalId = req.user.hospitalId;
    }
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      status,
      hospitalId: scopedHospitalId,
      branchId,
      doctorId,
      specialtyId,
      medicalServiceId,
      date,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết lịch khám & Dòng thời gian lịch sử' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const appointment = await this.service.findOne(id);
    await this.assertHospitalAppointmentAccess(req.user, id, appointment);
    return appointment;
  }

  @Patch(':id/status')
  @Roles('HOSPITAL_ADMIN')
  @ApiOperation({ summary: 'Cập nhật trạng thái lịch khám (Confirm, Complete, Paid, v.v.)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
    @Body('note') note: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string
  ) {
    await this.assertHospitalAppointmentAccess(req.user, id);
    return this.service.updateStatus(id, status, note, req.user.id, ip, ua);
  }

  @Get(':id/no-show-eligibility')
  @ApiOperation({ summary: 'Kiểm tra điều kiện xác nhận NO_SHOW theo chính sách cơ sở' })
  async checkNoShowEligibility(@Param('id') id: string, @Req() req: any) {
    await this.assertHospitalAppointmentAccess(req.user, id);
    return this.service.validateNoShowEligibility(id);
  }

  @Patch(':id/check-in')
  @Roles('HOSPITAL_ADMIN')
  @ApiOperation({ summary: 'Tiếp nhận / Check-in bệnh nhân có mặt tại cơ sở y tế' })
  async checkIn(
    @Param('id') id: string,
    @Body('note') note: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string
  ) {
    await this.assertHospitalAppointmentAccess(req.user, id);
    return this.service.checkIn(id, { note }, req.user?.id, req.user?.fullName, ip, ua);
  }

  @Patch(':id/revert-no-show')
  @Roles('HOSPITAL_ADMIN')
  @ApiOperation({ summary: 'Khôi phục lịch khám bị ghi nhận nhầm hoặc bệnh nhân đến muộn' })
  async revertNoShow(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string
  ) {
    await this.assertHospitalAppointmentAccess(req.user, id);
    return this.service.revertNoShow(id, { reason }, req.user?.id, ip, ua);
  }

  @Post(':id/contact-logs')
  @Roles('HOSPITAL_ADMIN')
  @ApiOperation({ summary: 'Ghi nhận lịch sử liên hệ với bệnh nhân (gọi điện, SMS...)' })
  async recordContactLog(
    @Param('id') id: string,
    @Body() body: { channel: string; outcome: string; note?: string },
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string
  ) {
    await this.assertHospitalAppointmentAccess(req.user, id);
    return this.service.recordContactLog(id, body, req.user?.id, req.user?.fullName, ip, ua);
  }

  private async assertHospitalAppointmentAccess(
    user: any,
    appointmentId: string,
    existingAppointment?: any
  ) {
    if (user?.role !== 'HOSPITAL_ADMIN') {
      return;
    }

    if (!user.hospitalId) {
      throw new ForbiddenException('Tài khoản chưa được liên kết với cơ sở y tế nào');
    }

    const appointment = existingAppointment || (await this.service.findOne(appointmentId));
    if (appointment.slot?.doctorWorkplace?.hospitalId !== user.hospitalId) {
      throw new ForbiddenException('Bạn chỉ có quyền thao tác trên lịch hẹn thuộc cơ sở của mình');
    }
  }
}
