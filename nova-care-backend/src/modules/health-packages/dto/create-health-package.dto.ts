import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';

export class CreateHealthPackageDto {
  @ApiProperty({ description: 'Tên gói khám' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên gói khám' })
  name: string;

  @ApiProperty({ description: 'ID Bệnh viện sở hữu gói khám' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn Bệnh viện cho gói khám' })
  hospitalId: string;

  @ApiPropertyOptional({ description: 'ID chuyên khoa' })
  @IsString()
  @IsOptional()
  specialtyId?: string;

  @ApiPropertyOptional({ description: 'Ảnh đại diện gói khám' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Giá bán gói khám (hiện tại)' })
  @IsNumber()
  @Min(0, { message: 'Giá gói khám không được nhỏ hơn 0' })
  price: number;

  @ApiPropertyOptional({ description: 'Giá gốc (dùng hiển thị khuyến mãi)' })
  @IsNumber()
  @Min(0, { message: 'Giá gốc không được nhỏ hơn 0' })
  @IsOptional()
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'Mô tả gói khám' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Thời gian thực hiện (phút)', default: 60 })
  @IsNumber()
  @Min(1, { message: 'Thời gian thực hiện phải lớn hơn 0' })
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Danh sách dịch vụ / mục khám đi kèm' })
  @IsArray()
  @IsOptional()
  services?: string[];

  @ApiPropertyOptional({ description: 'Hướng dẫn chuẩn bị trước khi khám' })
  @IsString()
  @IsOptional()
  preparationNote?: string;

  @ApiPropertyOptional({ description: 'Thời gian trả kết quả (ví dụ: Trong ngày, 24 giờ)' })
  @IsString()
  @IsOptional()
  estimatedResultTime?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
