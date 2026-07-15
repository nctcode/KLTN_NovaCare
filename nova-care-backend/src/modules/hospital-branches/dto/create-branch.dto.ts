import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({
    example: 'uuid-of-hospital',
    description: 'ID của cơ sở y tế',
  })
  @IsUUID()
  hospitalId: string;

  @ApiProperty({
    example: 'Chi nhánh Quận 2',
    description: 'Tên chi nhánh',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '456 Đường ABC, Quận 2, TP.HCM',
    description: 'Địa chỉ chi nhánh',
  })
  @IsString()
  address: string;

  @ApiProperty({
    example: '028 1234 5678',
    description: 'Số điện thoại chi nhánh',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 10.762622,
    description: 'Vĩ độ',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    example: 106.660172,
    description: 'Kinh độ',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: true,
    description: 'Kích hoạt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
