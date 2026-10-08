import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class VerifyOtpDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(254)
  email?: string;

  @ApiProperty({ example: '123456' }) @IsString()
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm 6 chữ số' })
  otpCode: string;
}

export class RequestRegistrationOtpDto {
  @ApiProperty({ example: '0912345678' }) @IsString() @MaxLength(30)
  phone: string;
}
