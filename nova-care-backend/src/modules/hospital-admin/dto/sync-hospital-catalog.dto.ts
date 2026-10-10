import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, IsArray } from 'class-validator';

export class SyncHospitalCatalogDto {
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
    description: 'Bảng ánh xạ mã khoa phòng của HIS (dept_code) sang ID chuyên khoa của NovaCare',
    example: { K_TIM_CAN_THIEP: 'uuid-chuyen-khoa-tim-mach' },
  })
  @IsOptional()
  @IsObject()
  specialtyMappings?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Danh sách staff_id của các bác sĩ được chọn để kích hoạt đồng bộ (nếu để trống sẽ đồng bộ tất cả)',
    example: ['HIS_DOC_001', 'HIS_DOC_002'],
  })
  @IsOptional()
  @IsArray()
  selectedDoctorIds?: string[];
}
