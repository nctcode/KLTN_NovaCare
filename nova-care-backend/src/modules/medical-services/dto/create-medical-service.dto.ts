import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateMedicalServiceDto {
  @ApiProperty({
    example: 'uuid-of-hospital',
    description: 'ID cơ sở y tế',
  })
  @IsUUID()
  hospitalId: string;

  @ApiProperty({
    example: 'Khám tổng quát',
    description: 'Tên dịch vụ y tế',
  })
  @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Khám sức khỏe tổng quát định kỳ',
    description: 'Mô tả chi tiết về dịch vụ',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 150000,
    description: 'Giá dịch vụ (VND)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    example: 30,
    description: 'Thời lượng khám (phút)',
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  duration?: number;

  @ApiProperty({
    example: true,
    description: 'Kích hoạt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
