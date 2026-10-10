import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { HospitalAdminGuard } from '@/common/guards/hospital-admin.guard';
import { HospitalAdminService } from './hospital-admin.service';
import { UpdateMyHospitalDto } from './dto/update-my-hospital.dto';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Cổng Quản trị Bệnh viện (Hospital Admin Portal)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, HospitalAdminGuard)
@Controller('api/v1/hospital-admin')
export class HospitalAdminController {
  constructor(private readonly service: HospitalAdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Thống kê tổng quan bệnh viện của tôi' })
  async getDashboard(@Req() req: any) {
    const data = await this.service.getDashboardOverview(req.targetHospitalId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thống kê tổng quan thành công',
      data,
    };
  }

  @Get('my-hospital')
  @ApiOperation({ summary: 'Xem thông tin cơ sở y tế của tôi' })
  async getMyHospital(@Req() req: any) {
    const data = await this.service.getMyHospital(req.targetHospitalId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin bệnh viện thành công',
      data,
    };
  }

  @Put('my-hospital')
  @ApiOperation({ summary: 'Cập nhật thông tin cơ sở y tế của tôi' })
  async updateMyHospital(
    @Req() req: any,
    @Body() dto: UpdateMyHospitalDto
  ) {
    const data = await this.service.updateMyHospital(req.targetHospitalId, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật thông tin bệnh viện thành công',
      data,
    };
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Danh sách bác sĩ thuộc bệnh viện của tôi' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'specialtyId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyDoctors(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const data = await this.service.getMyDoctors(req.targetHospitalId, {
      search,
      specialtyId,
      page,
      limit,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bác sĩ thành công',
      data,
    };
  }

  @Patch('doctors/:workplaceId')
  @ApiOperation({ summary: 'Cập nhật giá khám hoặc trạng thái bác sĩ' })
  async updateDoctorWorkplace(
    @Req() req: any,
    @Param('workplaceId') workplaceId: string,
    @Body() body: { consultationFee?: number; isActive?: boolean }
  ) {
    const data = await this.service.updateDoctorWorkplace(
      req.targetHospitalId,
      workplaceId,
      body
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật bác sĩ thành công',
      data,
    };
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Danh sách lịch hẹn đặt tại bệnh viện của tôi' })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyAppointments(
    @Req() req: any,
    @Query('status') status?: AppointmentStatus | 'OVERDUE',
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const data = await this.service.getMyAppointments(req.targetHospitalId, {
      status,
      search,
      page,
      limit,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách lịch hẹn thành công',
      data,
    };
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái lịch hẹn' })
  async updateAppointmentStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus; note?: string }
  ) {
    const data = await this.service.updateAppointmentStatus(
      req.targetHospitalId,
      id,
      body.status,
      body.note
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái lịch hẹn thành công',
      data,
    };
  }

  @Get('appointments/:id/no-show-eligibility')
  @ApiOperation({ summary: 'Kiểm tra điều kiện xác nhận NO_SHOW theo chính sách bệnh viện' })
  async checkNoShowEligibility(@Req() req: any, @Param('id') id: string) {
    const data = await this.service.validateNoShowEligibility(
      req.targetHospitalId,
      id
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Kiểm tra điều kiện NO_SHOW thành công',
      data,
    };
  }

  @Patch('appointments/:id/check-in')
  @ApiOperation({ summary: 'Tiếp đón / Check-in bệnh nhân tại quầy bệnh viện' })
  async checkIn(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { note?: string }
  ) {
    const data = await this.service.checkIn(
      req.targetHospitalId,
      id,
      body
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Tiếp đón bệnh nhân thành công',
      data,
    };
  }

  @Patch('appointments/:id/revert-no-show')
  @ApiOperation({ summary: 'Khôi phục lịch khám bị ghi nhận nhầm hoặc bệnh nhân đến muộn' })
  async revertNoShow(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    const data = await this.service.revertNoShow(
      req.targetHospitalId,
      id,
      body
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Khôi phục lịch hẹn thành công',
      data,
    };
  }

  @Post('appointments/:id/contact-logs')
  @ApiOperation({ summary: 'Ghi nhận liên hệ bệnh nhân (gọi điện, SMS...)' })
  async recordContactLog(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { channel: string; outcome: string; note?: string }
  ) {
    const data = await this.service.recordContactLog(
      req.targetHospitalId,
      id,
      body,
      req.user?.id,
      req.user?.fullName
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Ghi nhận lịch sử liên hệ thành công',
      data,
    };
  }

  @Get('specialties')
  @ApiOperation({ summary: 'Danh mục chuyên khoa viện đang cung cấp' })
  async getMySpecialties(@Req() req: any) {
    const data = await this.service.getMySpecialties(req.targetHospitalId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh mục chuyên khoa thành công',
      data,
    };
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Lịch làm việc của bác sĩ trong bệnh viện' })
  async getMySchedules(@Req() req: any) {
    const data = await this.service.getMySchedules(req.targetHospitalId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy lịch làm việc bác sĩ thành công',
      data,
    };
  }
}
