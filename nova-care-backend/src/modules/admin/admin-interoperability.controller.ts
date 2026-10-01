import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminInteroperabilityService } from './admin-interoperability.service';

@ApiTags('Admin - Giám Sát Liên Thông Y Tế (HIE Monitor)')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/interoperability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminInteroperabilityController {
  constructor(private readonly service: AdminInteroperabilityService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Thống kê tổng quan KPIs giám sát liên thông' })
  getOverview() {
    return this.service.getOverview();
  }

  @Get('traffic-chart')
  @ApiOperation({ summary: 'Biểu đồ lưu lượng liên thông 7 ngày qua (Thành công vs Cảnh báo lỗi)' })
  getTrafficChart() {
    return this.service.getTrafficChart();
  }

  @Get('hospital-matrix')
  @ApiOperation({ summary: 'Ma trận phân bổ trao đổi dữ liệu theo bệnh viện' })
  getHospitalMatrix() {
    return this.service.getHospitalMatrix();
  }

  @Get('live-audit-stream')
  @ApiOperation({ summary: 'Dòng sự kiện nhật ký truy xuất hồ sơ theo thời gian thực (Live Audit)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  getLiveAuditStream(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getLiveAuditStream(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      status,
    );
  }

  @Get('gateways')
  @ApiOperation({ summary: 'Danh sách và trạng thái kết nối các cổng HIS bệnh viện (Node Telemetry)' })
  getGateways() {
    return this.service.getGateways();
  }

  @Post('simulate-traffic')
  @ApiOperation({ summary: 'Kích hoạt giả lập các phiên tra cứu liên viện mẫu (Demo Tool)' })
  simulateTraffic() {
    return this.service.simulateTraffic();
  }
}
