import {
  Controller,
  Get,
  Patch,
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
import { AdminPaymentsService } from './admin-payments.service';
import { PaymentStatus } from '@prisma/client';

@ApiTags('Admin - Quản lý Thanh toán & Giao dịch')
@ApiBearerAuth('access-token')
@Controller('api/v1/admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPaymentsController {
  constructor(private readonly service: AdminPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách giao dịch thanh toán (Phân trang, tìm kiếm, lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết giao dịch thanh toán' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Xử lý hoàn tiền giao dịch' })
  refund(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    return this.service.refund(id, reason, req.user.id, ip, ua);
  }
}
