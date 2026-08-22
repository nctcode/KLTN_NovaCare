import { IsArray, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShareDto {
  @ApiProperty({
    description: 'Các phần dữ liệu được phép chia sẻ',
    example: ['summary', 'allergies', 'medications', 'recent_visits'],
  })
  @IsArray()
  @IsString({ each: true })
  allowedSections: string[];

  @ApiPropertyOptional({ description: 'Số ngày hiệu lực (mặc định 7 ngày)', minimum: 1, maximum: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  validDays?: number;

  @ApiPropertyOptional({ description: 'Tên hoặc ID cơ sở y tế được chia sẻ' })
  @IsOptional()
  @IsString()
  sharedWith?: string;

  @ApiPropertyOptional({ description: 'Mã token tùy chỉnh (Ví dụ: NC-8F3K-29QX)' })
  @IsOptional()
  @IsString()
  customToken?: string;
}
