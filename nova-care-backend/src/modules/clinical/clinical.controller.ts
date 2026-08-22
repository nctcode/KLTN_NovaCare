import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicalService } from './clinical.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { CreateObservationDto } from './dto/create-observation.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreatePrescriptionItemDto } from './dto/create-prescription-item.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Lâm sàng & Lượt khám (Clinical Encounters)')
@ApiBearerAuth('access-token')
@Controller('api/v1/clinical')
@UseGuards(JwtAuthGuard)
export class ClinicalController {
  constructor(private readonly service: ClinicalService) {}

  @Get('encounters/:id')
  @ApiOperation({ summary: 'Lấy chi tiết lượt khám y tế lâm sàng' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết lượt khám thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lượt khám' })
  async getEncounter(@Param('id') id: string) {
    const data = await this.service.getEncounter(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết lượt khám thành công',
      data,
    };
  }

  @Post('encounters/:id/diagnoses')
  @ApiOperation({ summary: 'Thêm chẩn đoán ICD-10 cho lượt khám' })
  @ApiResponse({ status: 201, description: 'Thêm chẩn đoán thành công' })
  @ApiResponse({ status: 400, description: 'Lượt khám đã COMPLETED hoặc PUBLISHED' })
  async addDiagnosis(
    @Param('id') id: string,
    @Body() dto: CreateDiagnosisDto,
  ) {
    const data = await this.service.addDiagnosis(id, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Thêm chẩn đoán thành công',
      data,
    };
  }

  @Post('encounters/:id/observations')
  @ApiOperation({ summary: 'Thêm chỉ số sinh hiệu/xét nghiệm/CĐHA cho lượt khám' })
  @ApiResponse({ status: 201, description: 'Thêm observation thành công' })
  @ApiResponse({ status: 400, description: 'Lượt khám đã COMPLETED hoặc PUBLISHED' })
  async addObservation(
    @Param('id') id: string,
    @Body() dto: CreateObservationDto,
  ) {
    const data = await this.service.addObservation(id, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Thêm chỉ số/kết quả thành công',
      data,
    };
  }

  @Post('encounters/:id/prescriptions')
  @ApiOperation({ summary: 'Khởi tạo đơn thuốc cho lượt khám' })
  @ApiResponse({ status: 201, description: 'Tạo đơn thuốc thành công' })
  @ApiResponse({ status: 400, description: 'Lượt khám đã COMPLETED hoặc PUBLISHED' })
  async createPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    const data = await this.service.createPrescription(id, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo đơn thuốc thành công',
      data,
    };
  }

  @Post('prescriptions/:prescriptionId/items')
  @ApiOperation({ summary: 'Thêm chi tiết thuốc vào đơn' })
  @ApiResponse({ status: 201, description: 'Thêm chi tiết thuốc thành công' })
  @ApiResponse({ status: 400, description: 'Lượt khám đã COMPLETED hoặc PUBLISHED' })
  async addPrescriptionItem(
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: CreatePrescriptionItemDto,
  ) {
    const data = await this.service.addPrescriptionItem(prescriptionId, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Thêm thuốc vào đơn thành công',
      data,
    };
  }

  @Patch('encounters/:id/complete')
  @ApiOperation({ summary: 'Hoàn tất lượt khám (IN_PROGRESS -> COMPLETED)' })
  @ApiResponse({ status: 200, description: 'Hoàn tất lượt khám thành công' })
  @ApiResponse({ status: 400, description: 'Lượt khám không ở trạng thái IN_PROGRESS' })
  async completeEncounter(@Param('id') id: string) {
    const data = await this.service.completeEncounter(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hoàn tất lượt khám thành công (COMPLETED)',
      data,
    };
  }

  @Patch('encounters/:id/publish')
  @ApiOperation({ summary: 'Phát hành lượt khám để liên thông (COMPLETED -> PUBLISHED)' })
  @ApiResponse({ status: 200, description: 'Phát hành lượt khám thành công' })
  @ApiResponse({ status: 400, description: 'Lượt khám chưa COMPLETED' })
  async publishEncounter(@Param('id') id: string) {
    const data = await this.service.publishEncounter(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Phát hành hồ sơ khám thành công (PUBLISHED)',
      data,
    };
  }
}
