import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { Qd4750ExtractorService } from './qd4750-extractor.service';

@ApiTags('Liên thông y tế - Trích xuất QĐ 4750/QĐ-BYT (Cổng BHYT & KBCB)')
@Controller('api/v1/integration/byt-4750')
export class Qd4750Controller {
  constructor(private readonly qd4750Service: Qd4750ExtractorService) {}

  @Public()
  @Get('extract/:encounterCode')
  @ApiOperation({
    summary: 'Trích xuất dữ liệu Bảng Check-in & Bảng 1 theo Quyết định số 4750/QĐ-BYT',
    description:
      'Chuyển đổi hồ sơ lượt khám và thông tin người bệnh sang đúng 100% chuẩn tên trường in hoa, kiểu dữ liệu và format ngày tháng yyyymmddHHMM của Bộ Y tế.',
  })
  @ApiParam({ name: 'encounterCode', example: 'ENC-175-20260810-001' })
  @ApiResponse({ status: 200, description: 'Trích xuất dữ liệu chuẩn QĐ 4750 thành công' })
  async extractPackage(@Param('encounterCode') encounterCode: string) {
    const data = await this.qd4750Service.extractPackageByEncounter(encounterCode);
    return {
      statusCode: HttpStatus.OK,
      message: 'Trích xuất dữ liệu chuẩn QĐ 4750/QĐ-BYT thành công',
      data,
    };
  }

  @Public()
  @Get('extract/:encounterCode/xml')
  @ApiOperation({
    summary: 'Tải gói tin XML QĐ 4750/QĐ-BYT phục vụ cổng Giám định BHYT',
  })
  @ApiParam({ name: 'encounterCode', example: 'ENC-175-20260810-001' })
  async exportXml(@Param('encounterCode') encounterCode: string, @Res() res: Response) {
    const data = await this.qd4750Service.extractPackageByEncounter(encounterCode);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="QD4750_${encounterCode}_${Date.now()}.xml"`,
    );
    return res.status(HttpStatus.OK).send(data.xmlPayload);
  }
}
