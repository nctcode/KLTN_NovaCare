import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateHealthPackageDto {
  @ApiProperty({ description: 'Tên gói khám' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả gói khám' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Giá gói khám' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Thời gian thực hiện (phút)', default: 60 })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'ID bệnh viện / cơ sở y tế' })
  @IsString()
  @IsOptional()
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'Danh sách dịch vụ / mục khám đi kèm' })
  @IsArray()
  @IsOptional()
  services?: string[];

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
