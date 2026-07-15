import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateHospitalDto {
  @ApiProperty({
    example: 'Bệnh viện Đa khoa NovaCare',
    description: 'Tên cơ sở y tế',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: '456 Đường ABC, Quận 2, TP.HCM',
    description: 'Địa chỉ',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: '028 1234 5678',
    description: 'Số điện thoại',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'Bệnh viện đa khoa hiện đại với đội ngũ bác sĩ giàu kinh nghiệm',
    description: 'Mô tả',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL logo',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'URL logo không hợp lệ' })
  logoUrl?: string;

  @ApiProperty({
    example: 'https://hospital.example.com',
    description: 'Website',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website không hợp lệ' })
  website?: string;

  @ApiProperty({
    example: 'contact@hospital.example.com',
    description: 'Email liên hệ',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiProperty({
    example: 4.8,
    description: 'Đánh giá (0-5)',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({
    example: true,
    description: 'Kích hoạt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
