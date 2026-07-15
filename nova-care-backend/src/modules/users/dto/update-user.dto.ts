import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Nguyễn Văn A Updated',
    description: 'Họ và tên',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    example: 'user_new@novacare.vn',
    description: 'Email mới',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiProperty({
    example: '0987654321',
    description: 'Số điện thoại mới',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
