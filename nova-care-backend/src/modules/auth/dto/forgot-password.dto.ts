import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiPropertyOptional({ description: 'Email tài khoản cần khôi phục', example: 'patient@gmail.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại tài khoản cần khôi phục', example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}
