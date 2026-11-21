import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn An' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/doctors/an.jpg' })
  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Bác sĩ chuyên khoa Nội tổng quát.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;
}
