import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { IdentityMatchingService } from './identity-matching.service';
import { CreateHospitalLinkDto } from './dto/create-hospital-link.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Liên thông y tế - Khớp định danh bệnh nhân (Identity Matching)')
@ApiBearerAuth('access-token')
@Controller('api/v1/integration/patients')
@UseGuards(JwtAuthGuard)
export class IdentityMatchingController {
  constructor(private readonly service: IdentityMatchingService) {}

  @Get('match')
  @ApiOperation({ summary: 'Khớp định danh bệnh nhân theo số CCCD (identityNumber)' })
  @ApiQuery({ name: 'identityNumber', description: 'Số CCCD/Định danh cá nhân', required: true, example: '079088012345' })
  @ApiResponse({ status: 200, description: 'Khớp định danh thành công' })
  @ApiResponse({ status: 400, description: 'Thiếu hoặc sai định dạng identityNumber' })
  async matchPatientByIdentityNumber(@Query('identityNumber') identityNumber: string) {
    const data = await this.service.matchPatientByIdentityNumber(identityNumber);
    return {
      statusCode: HttpStatus.OK,
      message: data.matched ? 'Khớp định danh bệnh nhân thành công' : 'Không tìm thấy hồ sơ bệnh nhân',
      data,
    };
  }

  @Get(':patientProfileId/identities')
  @ApiOperation({ summary: 'Lấy danh sách mã định danh bệnh nhân tại các bệnh viện liên kết' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách mã định danh thành công' })
  @ApiResponse({ status: 404, description: 'Hồ sơ bệnh nhân không tồn tại' })
  async getPatientIdentities(@Param('patientProfileId') patientProfileId: string) {
    const data = await this.service.getPatientIdentities(patientProfileId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách mã định danh bệnh nhân thành công',
      data,
    };
  }

  @Post(':patientProfileId/hospital-links')
  @ApiOperation({ summary: 'Tạo hoặc cập nhật liên kết mã bệnh nhân tại bệnh viện (PatientHospitalLink)' })
  @ApiResponse({ status: 201, description: 'Tạo liên kết mã bệnh nhân thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy PatientProfile hoặc Hospital' })
  @ApiResponse({ status: 409, description: 'Đã tồn tại mã liên kết hoặc trùng externalPatientId' })
  async createHospitalLink(
    @Param('patientProfileId') patientProfileId: string,
    @Body() dto: CreateHospitalLinkDto
  ) {
    const data = await this.service.createHospitalLink(patientProfileId, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo mã liên kết bệnh viện thành công',
      data,
    };
  }
}
