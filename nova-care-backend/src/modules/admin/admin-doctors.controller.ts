import {
  Controller,
  Get,
  Post,
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
import { AdminDoctorsService } from './admin-doctors.service';

@ApiTags('Admin - Quản lý Bác sĩ')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDoctorsController {
  constructor(private readonly service: AdminDoctorsService) { }

  @Get()
  @ApiOperation({ summary: 'Danh sách bác sĩ (Phân trang, tìm kiếm, bộ lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'externalId', required: false, type: String })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  @ApiQuery({ name: 'specialtyId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'source', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('externalId') externalId?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('isActive') isActive?: string,
    @Query('gender') gender?: string,
    @Query('source') source?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      externalId,
      hospitalId,
      specialtyId,
      isActive,
      gender,
      source,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bác sĩ' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bác sĩ mới' })
  create(
    @Body() body: any,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.create(body, req.user?.id, ip, ua);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin bác sĩ' })
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.update(id, body, req.user?.id, ip, ua);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bác sĩ (Soft Delete)' })
  delete(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.delete(id, req.user?.id, ip, ua);
  }

  // Workplace management endpoints
  @Post(':id/workplaces')
  @ApiOperation({ summary: 'Thêm nơi công tác cho bác sĩ' })
  createWorkplace(@Param('id') doctorId: string, @Body() body: any) {
    return this.service.createWorkplace(doctorId, body);
  }

  @Patch('workplaces/:workplaceId')
  @ApiOperation({ summary: 'Cập nhật nơi công tác của bác sĩ' })
  updateWorkplace(@Param('workplaceId') workplaceId: string, @Body() body: any) {
    return this.service.updateWorkplace(workplaceId, body);
  }

  @Delete('workplaces/:workplaceId')
  @ApiOperation({ summary: 'Ngừng nơi công tác của bác sĩ' })
  deleteWorkplace(@Param('workplaceId') workplaceId: string) {
    return this.service.deleteWorkplace(workplaceId);
  }

  // Schedule management endpoints
  @Post('workplaces/:workplaceId/schedules')
  @ApiOperation({ summary: 'Thêm lịch làm việc cho nơi công tác' })
  createSchedule(@Param('workplaceId') workplaceId: string, @Body() body: any) {
    return this.service.createSchedule(workplaceId, body);
  }

  @Patch('schedules/:scheduleId')
  @ApiOperation({ summary: 'Cập nhật ca làm việc' })
  updateSchedule(@Param('scheduleId') scheduleId: string, @Body() body: any) {
    return this.service.updateSchedule(scheduleId, body);
  }

  @Delete('schedules/:scheduleId')
  @ApiOperation({ summary: 'Xóa ca làm việc' })
  deleteSchedule(@Param('scheduleId') scheduleId: string) {
    return this.service.deleteSchedule(scheduleId);
  }
}

