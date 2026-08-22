import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalIntegrationService } from './medical-integration.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Liên thông y tế - Truy xuất lịch sử khám chia sẻ (Interoperability)')
@ApiBearerAuth('access-token')
@Controller('api/v1/integration')
@UseGuards(JwtAuthGuard)
export class MedicalIntegrationController {
  constructor(private readonly service: MedicalIntegrationService) {}

  @Get('medical-history/shared')
  @ApiOperation({ summary: 'Truy xuất lịch sử khám bệnh liên thông giữa các bệnh viện (Khi có Consent)' })
  @ApiQuery({ name: 'identityNumber', description: 'Số CCCD/Định danh của bệnh nhân', required: true, example: '079088012345' })
  @ApiQuery({ name: 'sourceHospitalId', description: 'ID bệnh viện nguồn (nơi lưu hồ sơ y tế)', required: true })
  @ApiQuery({ name: 'targetHospitalId', description: 'ID bệnh viện đích (nơi truy xuất xem hồ sơ)', required: true })
  @ApiResponse({ status: 200, description: 'Truy xuất lịch sử khám liên thông thành công' })
  @ApiResponse({ status: 400, description: 'Lỗi tham số hoặc sourceHospitalId === targetHospitalId' })
  @ApiResponse({ status: 403, description: 'Từ chối truy cập: Chưa cấp Consent hoặc Consent đã hết hạn/thu hồi' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bệnh nhân hoặc bệnh viện liên kết' })
  async getSharedMedicalHistory(
    @Query('identityNumber') identityNumber: string,
    @Query('sourceHospitalId') sourceHospitalId: string,
    @Query('targetHospitalId') targetHospitalId: string,
  ) {
    const data = await this.service.getSharedMedicalHistory(
      identityNumber,
      sourceHospitalId,
      targetHospitalId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Truy xuất lịch sử khám y tế liên thông thành công',
      data,
    };
  }
}
