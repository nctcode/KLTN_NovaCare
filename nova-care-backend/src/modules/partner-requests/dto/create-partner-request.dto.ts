import { IsNotEmpty, IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerType } from '@prisma/client';

export class CreatePartnerRequestDto {
  @ApiProperty({ description: 'Loại hình đối tác', enum: PartnerType, default: PartnerType.HOSPITAL })
  @IsEnum(PartnerType)
  @IsOptional()
  type?: PartnerType = PartnerType.HOSPITAL;

  @ApiProperty({ description: 'Họ tên người liên hệ đại diện', example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty({ message: 'Họ tên người liên hệ không được để trống' })
  contactName: string;

  @ApiPropertyOptional({ description: 'Chức danh / Vai trò', example: 'Trưởng phòng Kế hoạch tổng hợp' })
  @IsString()
  @IsOptional()
  titleOrRole?: string;

  @ApiProperty({ description: 'Số điện thoại liên hệ', example: '0912345678' })
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @ApiProperty({ description: 'Email liên hệ & nhận tài khoản', example: 'contact@bvbachmai.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiPropertyOptional({ description: 'Tên Bệnh viện hoặc Phòng khám', example: 'Bệnh Viện Đa Khoa Bạch Mai' })
  @IsString()
  @IsOptional()
  hospitalName?: string;

  @ApiPropertyOptional({ description: 'Chuyên khoa thế mạnh', example: 'Nội tiết, Tim mạch, Nhi khoa' })
  @IsString()
  @IsOptional()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm về quy mô hoặc nhu cầu hợp tác' })
  @IsString()
  @IsOptional()
  notes?: string;
}
