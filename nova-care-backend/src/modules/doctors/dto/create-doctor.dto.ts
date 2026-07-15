import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({
    example: 'TS.BS. Nguyễn Văn An',
    description: 'Họ và tên bác sĩ',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: 'https://example.com/doctor-avatar.png',
    description: 'URL avatar',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    example: 'Tiến sĩ Y khoa, Bác sĩ chuyên khoa II',
    description: 'Học vị, chức danh',
  })
  @IsString()
  qualification: string;

  @ApiProperty({
    example: '15 năm kinh nghiệm trong lĩnh vực tim mạch can thiệp',
    description: 'Kinh nghiệm',
    required: false,
  })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiProperty({
    example: 'Chuyên về các bệnh lý tim mạch, tăng huyết áp, suy tim',
    description: 'Mô tả chi tiết',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    example: 4.9,
    description: 'Đánh giá (0-5)',
    required: false,
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
