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
import { AdminHospitalsService } from './admin-hospitals.service';

@ApiTags('Admin - Quản lý Bệnh viện & Cơ sở Y tế')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/hospitals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminHospitalsController {
  constructor(private readonly service: AdminHospitalsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách bệnh viện (Phân trang, bộ lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      type,
      city,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bệnh viện' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bệnh viện mới' })
  create(
    @Body() body: any,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.create(body, req.user.id, ip, ua);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin bệnh viện' })
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.update(id, body, req.user.id, ip, ua);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bệnh viện' })
  delete(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.delete(id, req.user.id, ip, ua);
  }
}
