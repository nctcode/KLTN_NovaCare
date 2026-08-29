import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Ip,
  Headers,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import {
  InteroperabilityPortalService,
  InteroperabilityLookupDto,
  CreateShareCodeDto,
} from './interoperability-portal.service';

@ApiTags('Liên thông y tế - Cổng tra cứu Bác sĩ & Quản lý chia sẻ (Interoperability Portal)')
@Controller('api/v1/interoperability/portal')
export class InteroperabilityPortalController {
  constructor(private readonly portalService: InteroperabilityPortalService) {}

  /**
   * 1. API Tra cứu liên thông công khai / bán công khai cho Bác sĩ (Public / Doctor Lookup)
   * Nhận vào Số CCCD, Mã định danh MPI hoặc Mã chia sẻ ShareCode
   */
  @Public()
  @Post('lookup')
  @ApiOperation({
    summary: 'Cổng Bác sĩ: Tra cứu hồ sơ bệnh án liên thông đa cơ sở y tế (qua CCCD / MPI / ShareCode)',
    description: 'Bác sĩ nhập số CCCD hoặc mã chia sẻ để tổng hợp toàn bộ lịch sử khám từ các bệnh viện liên kết.',
  })
  @ApiResponse({ status: 200, description: 'Tra cứu hồ sơ liên thông thành công' })
  @ApiResponse({ status: 400, description: 'Mã tra cứu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Mã chia sẻ đã hết hạn hoặc bị thu hồi' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hồ sơ bệnh nhân' })
  async lookupPatientRecord(
    @Body() dto: InteroperabilityLookupDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const data = await this.portalService.lookupPatientRecord(dto, ipAddress, userAgent);
    return {
      statusCode: HttpStatus.OK,
      message: 'Tra cứu hồ sơ bệnh án liên thông thành công',
      data,
    };
  }

  /**
   * 2. Lấy danh sách Nhật ký truy cập (Audit Logs)
   */
  @Public()
  @Get('audit-logs')
  @ApiOperation({ summary: 'Lấy nhật ký truy cập liên thông (Audit Logs)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'patientProfileId', required: false })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('patientProfileId') patientProfileId?: string,
  ) {
    const data = await this.portalService.getAuditLogs(userId, patientProfileId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách nhật ký truy cập thành công',
      data,
    };
  }

  /**
   * 3. Tạo mã chia sẻ (Share Code) có thời hạn
   */
  @Post('share-codes')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bệnh nhân tạo mã chia sẻ hồ sơ (ShareCode)' })
  async createShareCode(@Request() req: any, @Body() dto: CreateShareCodeDto) {
    const data = await this.portalService.createShareCode(req.user.id, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo mã chia sẻ hồ sơ thành công',
      data,
    };
  }

  /**
   * 4. Lấy danh sách mã chia sẻ của bệnh nhân
   */
  @Get('share-codes')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Danh sách mã chia sẻ của bệnh nhân' })
  async getMyShareCodes(@Request() req: any) {
    const data = await this.portalService.getMyShareCodes(req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách mã chia sẻ thành công',
      data,
    };
  }

  /**
   * 5. Thu hồi mã chia sẻ
   */
  @Patch('share-codes/:id/revoke')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thu hồi mã chia sẻ' })
  @ApiParam({ name: 'id', description: 'Share Code ID' })
  async revokeShareCode(@Request() req: any, @Param('id') shareId: string) {
    const data = await this.portalService.revokeShareCode(shareId, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Đã thu hồi mã chia sẻ thành công',
      data,
    };
  }
}
