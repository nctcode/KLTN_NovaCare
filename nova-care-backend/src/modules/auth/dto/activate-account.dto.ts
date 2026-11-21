import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivateAccountDto {
  @ApiProperty({ description: 'Mã token kích hoạt tài khoản từ email', example: 'd3f6...' })
  @IsString()
  @IsNotEmpty({ message: 'Token kích hoạt không được để trống' })
  token: string;

  @ApiProperty({ description: 'Mật khẩu mới do Quản trị viên thiết lập', example: 'BvBachMai@2025!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @ApiProperty({ description: 'Email đăng nhập mới do bệnh viện thiết lập' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email đăng nhập không được để trống' })
  email?: string;
}
