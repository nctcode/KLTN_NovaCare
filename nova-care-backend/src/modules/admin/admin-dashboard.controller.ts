import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin - Dashboard Thống kê')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Thống kê KPI tổng quan (Số user, số bác sĩ, số lịch, doanh thu)' })
  getOverview() {
    return this.service.getOverview();
  }

  @Get('appointments-by-day')
  @ApiOperation({ summary: 'Thống kê lịch hẹn theo ngày (7 ngày gần nhất)' })
  getAppointmentsByDay() {
    return this.service.getAppointmentsByDay();
  }

  @Get('revenue-by-month')
  @ApiOperation({ summary: 'Thống kê doanh thu theo tháng (6 tháng gần nhất)' })
  getRevenueByMonth() {
    return this.service.getRevenueByMonth();
  }

  @Get('top-doctors')
  @ApiOperation({ summary: 'Top 5 bác sĩ được đặt lịch nhiều nhất' })
  getTopDoctors() {
    return this.service.getTopDoctors();
  }

  @Get('top-hospitals')
  @ApiOperation({ summary: 'Top 5 cơ sở y tế có lượt đặt cao nhất' })
  getTopHospitals() {
    return this.service.getTopHospitals();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Danh sách nhật ký thao tác Admin (Audit Logs)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getAuditLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }
}
