import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '@prisma/client';

export class CreateReviewReportDto {
  @ApiProperty({
    enum: ReportReason,
    example: ReportReason.INAPPROPRIATE_LANGUAGE,
    description: 'Lý do báo cáo vi phạm',
  })
  @IsEnum(ReportReason, { message: 'Lý do báo cáo không hợp lệ' })
  @IsNotEmpty({ message: 'Lý do báo cáo không được để trống' })
  reason: ReportReason;

  @ApiProperty({
    example: 'Nội dung chứa từ ngữ xúc phạm danh dự cá nhân',
    required: false,
    description: 'Chi tiết mô tả vi phạm (tùy chọn)',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;
}
