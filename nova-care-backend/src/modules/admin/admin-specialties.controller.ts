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
import { AdminSpecialtiesService } from './admin-specialties.service';
import { CreateSpecialtyDto } from '../specialties/dto/create-specialty.dto';
import { UpdateSpecialtyDto } from '../specialties/dto/update-specialty.dto';

@ApiTags('Admin - Quản lý Chuyên khoa')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/specialties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSpecialtiesController {
  constructor(private readonly service: AdminSpecialtiesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách chuyên khoa dùng chung toàn hệ thống (Phân trang, tìm kiếm, bộ lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết chuyên khoa và danh sách bệnh viện đang gán' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới chuyên khoa dùng chung' })
  create(
    @Body() dto: CreateSpecialtyDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.create(dto, req.user?.id, ip, ua);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin chuyên khoa' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSpecialtyDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.update(id, dto, req.user?.id, ip, ua);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Bật / Tắt trạng thái hoạt động (Ngừng hoạt động / Kích hoạt lại)' })
  toggleStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.toggleStatus(id, isActive, req.user?.id, ip, ua);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Ngừng hoạt động chuyên khoa (Soft deactivate)' })
  deactivate(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.toggleStatus(id, false, req.user?.id, ip, ua);
  }
}
