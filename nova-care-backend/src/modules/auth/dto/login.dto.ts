import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@novacare.vn',
    description: 'Email hoặc số điện thoại',
  })
  @IsNotEmpty({ message: 'Email hoặc số điện thoại không được để trống' })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mật khẩu',
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  password: string;
}
