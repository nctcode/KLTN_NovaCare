import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class TestHandshakeDto {
  @ApiPropertyOptional({
    description: 'URL endpoint HIS Catalog của bệnh viện',
    example: 'https://his.benhvien.vn/api/hospital-catalog',
  })
  @IsOptional()
  @IsString()
  endpointUrl?: string;

  @ApiPropertyOptional({
    description: 'Phương thức xác thực: none, api_key, bearer',
    example: 'api_key',
  })
  @IsOptional()
  @IsString()
  authType?: string;

  @ApiPropertyOptional({
    description: 'Khóa API Key hoặc Token xác thực',
    example: 'hospital_partner_key_2026',
  })
  @IsOptional()
  @IsString()
  authToken?: string;

  @ApiPropertyOptional({
    description: 'Mã xác thực Bearer token hoặc Secret Token (dự phòng)',
  })
  @IsOptional()
  @IsString()
  secretToken?: string;

  @ApiPropertyOptional({
    description: 'Lưu cấu hình endpoint sau khi kiểm tra kết nối thành công',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  persistConfig?: boolean;
}
