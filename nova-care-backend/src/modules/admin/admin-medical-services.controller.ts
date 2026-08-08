import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminMedicalServicesService } from './admin-medical-services.service';

@ApiTags('Admin - Medical Services')
@Controller('api/v1/admin/medical-services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth('access-token')
export class AdminMedicalServicesController {
  constructor(private readonly adminMedicalServicesService: AdminMedicalServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ y tế cho Admin (phân trang, lọc, tìm kiếm)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const data = await this.adminMedicalServicesService.findAll({
      page,
      limit,
      search,
      hospitalId,
      status,
      sortBy,
      sortOrder,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách dịch vụ y tế thành công',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết dịch vụ y tế' })
  async findOne(@Param('id') id: string) {
    const data = await this.adminMedicalServicesService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết dịch vụ y tế thành công',
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới dịch vụ y tế' })
  async create(@Body() body: any, @Req() req: any) {
    const adminUserId = req.user?.id || req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const data = await this.adminMedicalServicesService.create(body, adminUserId, ipAddress, userAgent);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo dịch vụ y tế mới thành công',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật dịch vụ y tế' })
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const adminUserId = req.user?.id || req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const data = await this.adminMedicalServicesService.update(id, body, adminUserId, ipAddress, userAgent);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật dịch vụ y tế thành công',
      data,
    };
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Bật / tắt trạng thái dịch vụ y tế' })
  async toggleStatus(@Param('id') id: string, @Body('isActive') isActive: boolean, @Req() req: any) {
    const adminUserId = req.user?.id || req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const data = await this.adminMedicalServicesService.toggleStatus(id, isActive, adminUserId, ipAddress, userAgent);
    return {
      statusCode: HttpStatus.OK,
      message: isActive ? 'Đã kích hoạt dịch vụ y tế' : 'Đã tạm ngưng dịch vụ y tế',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa dịch vụ y tế' })
  async delete(@Param('id') id: string, @Req() req: any) {
    const adminUserId = req.user?.id || req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const data = await this.adminMedicalServicesService.delete(id, adminUserId, ipAddress, userAgent);
    return {
      statusCode: HttpStatus.OK,
      message: data.message,
    };
  }
}
