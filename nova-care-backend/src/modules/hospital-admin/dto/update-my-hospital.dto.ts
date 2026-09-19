import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMyHospitalDto {
  @ApiPropertyOptional({ example: '1900 6868' })
  @IsOptional()
  @IsString()
  hotline?: string;

  @ApiPropertyOptional({ example: '028 3822 1234' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1900 9999' })
  @IsOptional()
  @IsString()
  emergencyHotline?: string;

  @ApiPropertyOptional({ example: '456 Nguyễn Thị Minh Khai, Q.1, TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '07:00 - 20:00 (Thứ 2 - Thứ 7)' })
  @IsOptional()
  @IsString()
  operatingHours?: string;

  @ApiPropertyOptional({ example: 'Bệnh viện chuyên khoa quốc tế tiêu chuẩn cao...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://hospital.example.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'contact@hospital.example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}
