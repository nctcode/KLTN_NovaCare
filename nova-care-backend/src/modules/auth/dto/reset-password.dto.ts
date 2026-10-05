import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiPropertyOptional({ description: 'Email tài khoản', example: 'patient@gmail.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại tài khoản', example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Mã OTP 6 chữ số', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  otpCode: string;

  @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 6 ký tự)', example: 'NewPass123' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
