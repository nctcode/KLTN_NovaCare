import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PartnerRequestsService } from './partner-requests.service';
import { CreatePartnerRequestDto } from './dto/create-partner-request.dto';
import { ApprovePartnerRequestDto } from './dto/approve-partner-request.dto';
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Role, PartnerRequestStatus, PartnerType } from '@prisma/client';

@ApiTags('Quản lý Đăng ký Hợp tác (Partner Requests)')
@Controller('api/v1')
export class PartnerRequestsController {
  constructor(private readonly service: PartnerRequestsService) {}

  /**
   * 1. Public endpoint: Gửi yêu cầu hợp tác
   */
  @Public()
  @Post('partner-requests')
  @ApiOperation({ summary: 'Cơ sở y tế gửi đơn đăng ký hợp tác (Public)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Đã nhận đơn đăng ký' })
  async createRequest(@Body() dto: CreatePartnerRequestDto) {
    return this.service.createRequest(dto);
  }

  /**
   * 2. Admin endpoint: Lấy danh sách yêu cầu hợp tác
   */
  @Get('admin/partner-requests')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Platform Admin: Danh sách đơn đăng ký hợp tác' })
  @ApiQuery({ name: 'type', required: false, enum: PartnerType })
  @ApiQuery({ name: 'status', required: false, enum: PartnerRequestStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('type') type?: PartnerType,
    @Query('status') status?: PartnerRequestStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.service.findAll({ type, status, search, page, limit });
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách yêu cầu hợp tác thành công',
      data,
    };
  }

  /**
   * 3. Admin endpoint: Chi tiết đơn đăng ký
   */
  @Get('admin/partner-requests/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Platform Admin: Chi tiết đơn đăng ký hợp tác' })
  async findById(@Param('id') id: string) {
    const data = await this.service.findById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết yêu cầu hợp tác thành công',
      data,
    };
  }

  /**
   * 4. Admin endpoint: Cập nhật trạng thái (CONTACTED, REJECTED)
   */
  @Patch('admin/partner-requests/:id/status')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Platform Admin: Cập nhật trạng thái trao đổi' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerStatusDto,
  ) {
    const data = await this.service.updateStatus(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái thành công',
      data,
    };
  }

  /**
   * 5. Admin endpoint: DUYỆT HỢP TÁC & GỬI EMAIL KÍCH HOẠT
   */
  @Post('admin/partner-requests/:id/approve')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Platform Admin: Phê duyệt hợp tác và gửi thư kích hoạt tài khoản' })
  async approveRequest(
    @Param('id') id: string,
    @Body() dto: ApprovePartnerRequestDto,
  ) {
    return this.service.approveRequest(id, dto);
  }
}
