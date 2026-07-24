import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  Ip,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { MedicalPassportService } from './medical-passport.service';
import { CreateShareDto } from './dto/create-share.dto';

@ApiTags('Medical Passport (Hộ chiếu y tế)')
@Controller('api/v1/passport')
export class MedicalPassportController {
  constructor(private readonly passportService: MedicalPassportService) {}

  // ── Authenticated endpoints ──────────────────────────────────────────────

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy hồ sơ y tế cá nhân (Medical Passport)' })
  getMyPassport(@Request() req: any) {
    return this.passportService.getMyPassport(req.user.id);
  }

  @Post('share')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo link chia sẻ hồ sơ với QR code và mã PIN' })
  createShare(@Request() req: any, @Body() dto: CreateShareDto) {
    return this.passportService.createShare(req.user.id, dto);
  }

  @Get('shares')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Danh sách link chia sẻ và nhật ký truy cập' })
  getMyShares(@Request() req: any) {
    return this.passportService.getMyShares(req.user.id);
  }

  @Patch('share/:id/revoke')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thu hồi quyền truy cập link chia sẻ' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  revokeShare(@Request() req: any, @Param('id') shareId: string) {
    return this.passportService.revokeShare(shareId, req.user.id);
  }

  // ── Public endpoint (yêu cầu token + PIN) ────────────────────────────────

  @Get('share/:token')
  @ApiOperation({
    summary: 'Truy cập hồ sơ chia sẻ (Public – yêu cầu token + PIN)',
    description: 'Không cần JWT. Nhập PIN qua query param ?pin=XXXX',
  })
  @ApiParam({ name: 'token', description: 'Share token từ URL chia sẻ' })
  @ApiQuery({ name: 'pin', required: false, description: 'Mã PIN 4 chữ số' })
  accessSharedPassport(
    @Param('token') token: string,
    @Query('pin') pin: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.passportService.accessSharedPassport(
      token,
      pin || '',
      ipAddress,
      userAgent || '',
    );
  }
}
