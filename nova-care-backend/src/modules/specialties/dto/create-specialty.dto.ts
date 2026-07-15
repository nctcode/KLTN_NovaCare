import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpecialtyDto {
  @ApiProperty({
    example: 'Tim mạch',
    description: 'Tên chuyên khoa',
  })
  @IsNotEmpty({ message: 'Tên chuyên khoa không được để trống' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Chuyên khoa về tim và mạch máu',
    description: 'Mô tả chuyên khoa',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '❤️',
    description: 'Icon đại diện cho chuyên khoa',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    example: true,
    description: 'Trạng thái hoạt động',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
