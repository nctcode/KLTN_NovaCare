import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ObservationCategory } from '@prisma/client';

export class CreateObservationDto {
  @ApiProperty({ enum: ObservationCategory, example: ObservationCategory.VITAL_SIGNS })
  @IsEnum(ObservationCategory, { message: 'category phải thuộc ObservationCategory (VITAL_SIGNS, LAB_RESULT, IMAGING)' })
  @IsNotEmpty()
  category: ObservationCategory;

  @ApiPropertyOptional({ description: 'Mã phân loại observation', example: 'BP' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Tên sinh hiệu hoặc xét nghiệm', example: 'Huyết áp' })
  @IsString()
  @IsNotEmpty({ message: 'name không được để trống' })
  name: string;

  @ApiProperty({ description: 'Giá trị quan sát', example: '135/85' })
  @IsString()
  @IsNotEmpty({ message: 'value không được để trống' })
  value: string;

  @ApiPropertyOptional({ description: 'Đơn vị đo', example: 'mmHg' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Khoảng tham chiếu', example: '< 120/80 mmHg' })
  @IsString()
  @IsOptional()
  referenceRange?: string;

  @ApiPropertyOptional({ description: 'Đánh giá kết quả', example: 'Bình thường' })
  @IsString()
  @IsOptional()
  interpretation?: string;
}
