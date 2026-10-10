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
  ForbiddenException,
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
@Roles('ADMIN', 'HOSPITAL_ADMIN')
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
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('status') status?: string,
  ) {
    let scopedHospitalId: string | undefined = undefined;
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
      type,
      city,
      status,
      hospitalId: scopedHospitalId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bệnh viện' })
  findOne(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role === 'HOSPITAL_ADMIN' && req.user.hospitalId !== id) {
      throw new ForbiddenException('Bạn chỉ có quyền xem thông tin cơ sở y tế của mình');
    }
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
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
    if (req.user?.role === 'HOSPITAL_ADMIN' && req.user.hospitalId !== id) {
      throw new ForbiddenException('Bạn chỉ có quyền cập nhật thông tin cơ sở y tế của mình');
    }
    return this.service.update(id, body, req.user.id, ip, ua);
  }

  @Delete(':id')
  @Roles('ADMIN')
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
