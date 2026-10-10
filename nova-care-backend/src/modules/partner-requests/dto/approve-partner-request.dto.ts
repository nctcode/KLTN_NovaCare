import { IsOptional, IsEmail, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovePartnerRequestDto {
  @ApiPropertyOptional({
    description: 'Email chính thức của Quản trị viên Bệnh viện (nếu muốn thay đổi so với đơn đăng ký)',
    example: 'admin@bvbachmai.vn',
  })
  @IsEmail({}, { message: 'Email quản trị không đúng định dạng' })
  @IsOptional()
  adminEmail?: string;

  @ApiPropertyOptional({
    description: 'Họ tên hiển thị của Quản trị viên Bệnh viện',
    example: 'Ban Quản Trị BV Bạch Mai',
  })
  @IsString()
  @IsOptional()
  adminFullName?: string;

  @ApiPropertyOptional({
    description: 'Tên chính thức chuẩn pháp nhân của Bệnh viện',
    example: 'Bệnh Viện Đa Khoa Bạch Mai',
  })
  @IsString()
  @IsOptional()
  hospitalName?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú nội bộ của Platform Admin khi duyệt',
    example: 'Đã hoàn tất ký biên bản ghi nhớ hợp tác vào ngày 07/10',
  })
  @IsString()
  @IsOptional()
  adminNote?: string;
}
