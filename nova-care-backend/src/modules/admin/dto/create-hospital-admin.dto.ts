import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateHospitalAdminDto {
  @ApiPropertyOptional({ example: 'Nguyễn Quản Trị Viện' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'admin.novalife@novacare.vn' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'AdminNovaLife@2026' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password: string;

  @ApiProperty({
    example: '3aae9ef1-8bad-4c06-b142-fb85e87ca424',
    description: 'ID cơ sở y tế mà người này sẽ quản lý',
  })
  @IsString()
  @IsNotEmpty({ message: 'Bắt buộc chọn cơ sở y tế quản lý' })
  hospitalId: string;
}
