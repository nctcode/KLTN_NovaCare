import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreatePatientProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên người đi khám' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  fullName: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE, description: 'Giới tính', required: false })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiProperty({ example: '1990-01-01', description: 'Ngày sinh (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dateOfBirth?: string;

  @ApiProperty({ example: '0123456789', description: 'Số điện thoại liên hệ', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123 Đường ABC, Quận 1, TP.HCM', description: 'Địa chỉ', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '001201012345', description: 'Số CCCD/CMND', required: false })
  @IsOptional()
  @IsString()
  identityNumber?: string;

  @ApiProperty({ example: 'BHYT-123456789', description: 'Số bảo hiểm y tế', required: false })
  @IsOptional()
  @IsString()
  healthInsurance?: string;

  @ApiProperty({ example: 'Tiểu đường type 2, Tăng huyết áp', description: 'Tiền sử bệnh', required: false })
  @IsOptional()
  @IsString()
  medicalHistory?: string;

  @ApiProperty({ example: 'Penicillin, Hải sản', description: 'Dị ứng', required: false })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiProperty({ example: 'Nguyễn Thị B', description: 'Người liên hệ khẩn cấp', required: false })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({ example: '0987654321', description: 'Số điện thoại liên hệ khẩn cấp', required: false })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiProperty({ example: 'Bản thân', description: 'Mối quan hệ với tài khoản chủ', required: false })
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiProperty({ example: true, description: 'Đặt làm hồ sơ mặc định', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
