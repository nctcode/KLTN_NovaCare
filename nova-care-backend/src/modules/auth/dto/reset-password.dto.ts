import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email tài khoản', example: 'patient@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ description: 'Mã OTP 6 chữ số', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  otpCode: string;

  @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 6 ký tự)', example: 'NewPass123' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
