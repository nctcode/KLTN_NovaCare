import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role, example: Role.HOSPITAL_ADMIN, description: 'Vai trò người dùng' })
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn vai trò' })
  role: Role;

  @ApiPropertyOptional({
    example: '3aae9ef1-8bad-4c06-b142-fb85e87ca424',
    description: 'ID cơ sở y tế (Bắt buộc khi gán vai trò HOSPITAL_ADMIN)',
  })
  @IsOptional()
  @IsString()
  hospitalId?: string | null;
}
