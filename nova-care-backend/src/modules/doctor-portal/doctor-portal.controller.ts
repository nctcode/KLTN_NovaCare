import { Body, Controller, Get, HttpStatus, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { DoctorPortalService } from './doctor-portal.service';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

@ApiTags('Doctor Portal')
@ApiBearerAuth('access-token')
@Controller('api/v1/doctor-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorPortalController {
  constructor(private readonly service: DoctorPortalService) {}

  private response(data: unknown, message: string) {
    return { statusCode: HttpStatus.OK, message, data };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Tổng quan công việc của bác sĩ đang đăng nhập' })
  async dashboard(@CurrentUser() user: User) {
    return this.response(await this.service.getDashboard(user.id), 'Lấy tổng quan bác sĩ thành công');
  }

  @Get('me')
  @ApiOperation({ summary: 'Hồ sơ bác sĩ đang đăng nhập' })
  async profile(@CurrentUser() user: User) {
    return this.response(await this.service.getProfile(user.id), 'Lấy hồ sơ bác sĩ thành công');
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật các trường hồ sơ bác sĩ được phép' })
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateDoctorProfileDto) {
    return this.response(await this.service.updateProfile(user.id, dto), 'Cập nhật hồ sơ bác sĩ thành công');
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Lịch làm việc, ca trực và phòng khám của bác sĩ đang đăng nhập' })
  async schedules(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.response(
      await this.service.getSchedules(user.id, startDate, endDate),
      'Lấy lịch làm việc bác sĩ thành công',
    );
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Danh sách lịch hẹn thuộc bác sĩ đang đăng nhập' })
  async appointments(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.response(
      await this.service.getAppointments(user.id, { startDate, endDate, status, page, limit }),
      'Lấy lịch hẹn được phân công thành công',
    );
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Chi tiết lịch hẹn thuộc phạm vi bác sĩ được phân công' })
  async appointment(@CurrentUser() user: User, @Param('id') id: string) {
    return this.response(await this.service.getAppointment(user.id, id), 'Lấy chi tiết lịch hẹn thành công');
  }

  @Get('appointments/:id/shared-records')
  @ApiOperation({ summary: 'Hồ sơ khám trước đã được bệnh nhân cấp quyền cho cơ sở của lịch hẹn' })
  async sharedRecords(@CurrentUser() user: User, @Param('id') id: string) {
    return this.response(await this.service.getSharedRecords(user.id, id), 'Lấy hồ sơ được chia sẻ thành công');
  }
}
