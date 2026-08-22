import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Liên thông y tế - Quản lý quyền chia sẻ (Consent Management)')
@ApiBearerAuth('access-token')
@Controller('api/v1/integration')
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly service: ConsentService) {}

  @Post('consents')
  @ApiOperation({ summary: 'Tạo yêu cầu đồng ý chia sẻ hồ sơ (Consent Request)' })
  @ApiResponse({ status: 201, description: 'Tạo yêu cầu consent thành công (PENDING)' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc sourceHospital === targetHospital' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý consent cho hồ sơ này' })
  @ApiResponse({ status: 409, description: 'Consent cho cặp bệnh viện này đã tồn tại' })
  async createConsent(@CurrentUser() user: User, @Body() dto: CreateConsentDto) {
    const data = await this.service.createConsent(user.id, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo yêu cầu đồng ý chia sẻ thành công',
      data,
    };
  }

  @Get('consents/check')
  @ApiOperation({ summary: 'Kiểm tra quyền truy xuất hồ sơ y tế giữa 2 bệnh viện' })
  @ApiQuery({ name: 'patientProfileId', description: 'ID hồ sơ bệnh nhân', required: true })
  @ApiQuery({ name: 'sourceHospitalId', description: 'ID bệnh viện nguồn', required: true })
  @ApiQuery({ name: 'targetHospitalId', description: 'ID bệnh viện đích', required: true })
  @ApiResponse({ status: 200, description: 'Trả về trạng thái Consent (hasConsent)' })
  async checkConsent(
    @Query('patientProfileId') patientProfileId: string,
    @Query('sourceHospitalId') sourceHospitalId: string,
    @Query('targetHospitalId') targetHospitalId: string
  ) {
    const data = await this.service.checkConsent(patientProfileId, sourceHospitalId, targetHospitalId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Kiểm tra trạng thái Consent thành công',
      data,
    };
  }

  @Get('patients/:patientProfileId/consents')
  @ApiOperation({ summary: 'Lấy danh sách các quyền Consent của bệnh nhân' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách consent thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem consent của hồ sơ này' })
  async getPatientConsents(
    @CurrentUser() user: User,
    @Param('patientProfileId') patientProfileId: string
  ) {
    const data = await this.service.getPatientConsents(user.id, patientProfileId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách quyền Consent của bệnh nhân thành công',
      data,
    };
  }

  @Patch('consents/:id/grant')
  @ApiOperation({ summary: 'Chấp thuận chia sẻ hồ sơ (PENDING -> GRANTED)' })
  @ApiResponse({ status: 200, description: 'Cấp quyền thành công' })
  @ApiResponse({ status: 400, description: 'Consent đã quá hạn, đã thu hồi hoặc không ở trạng thái PENDING' })
  @ApiResponse({ status: 403, description: 'Không có quyền thao tác trên consent này' })
  async grantConsent(@CurrentUser() user: User, @Param('id') id: string) {
    const data = await this.service.grantConsent(user.id, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Đồng ý chia sẻ dữ liệu y tế thành công (GRANTED)',
      data,
    };
  }

  @Patch('consents/:id/revoke')
  @ApiOperation({ summary: 'Thu hồi quyền chia sẻ hồ sơ (GRANTED/PENDING -> REVOKED)' })
  @ApiResponse({ status: 200, description: 'Thu hồi quyền thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền thao tác trên consent này' })
  async revokeConsent(@CurrentUser() user: User, @Param('id') id: string) {
    const data = await this.service.revokeConsent(user.id, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Thu hồi quyền chia sẻ dữ liệu thành công (REVOKED)',
      data,
    };
  }
}
