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
import { AdminHealthPackagesService } from './admin-health-packages.service';

@ApiTags('Admin - Quản lý Gói khám Sức khỏe')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/health-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminHealthPackagesController {
  constructor(private readonly service: AdminHealthPackagesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách các gói khám (Phân trang, tìm kiếm, lọc theo Bệnh viện, Chuyên khoa, Trạng thái)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  @ApiQuery({ name: 'specialtyId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      hospitalId,
      specialtyId,
      status,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết gói khám' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo gói khám mới' })
  create(
    @Body() body: any,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.create(body, req.user.id, ip, ua);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin gói khám' })
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.update(id, body, req.user.id, ip, ua);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Bật/Tắt trạng thái hoạt động của gói khám' })
  toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.toggleStatus(id, isActive, req.user.id, ip, ua);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa gói khám' })
  delete(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.delete(id, req.user.id, ip, ua);
  }
}
