import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class TestHandshakeDto {
  @ApiPropertyOptional({
    description: 'URL endpoint HIS Catalog của bệnh viện',
    example: 'http://localhost:5055/api/hospital-catalog',
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
    example: 'tamanh_secret_2026',
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
}
