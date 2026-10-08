import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token đổi mật khẩu nhận được sau khi OTP đúng' })
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 6 ký tự)', example: 'NewPass123' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  @MaxLength(128)
  newPassword: string;
}
