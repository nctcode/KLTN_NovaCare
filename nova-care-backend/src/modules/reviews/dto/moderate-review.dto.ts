import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class ModerateReviewDto {
  @ApiProperty({
    enum: [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.HIDDEN],
    example: ReviewStatus.APPROVED,
    description: 'Trạng thái xử lý kiểm duyệt: APPROVED, REJECTED hoặc HIDDEN',
  })
  @IsEnum(ReviewStatus, { message: 'Trạng thái kiểm duyệt không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái kiểm duyệt không được để trống' })
  status: ReviewStatus;

  @ApiProperty({
    example: 'Nội dung chứa từ ngữ không phù hợp quy định kiểm duyệt',
    required: false,
    description: 'Lý do từ chối hoặc ẩn đánh giá',
  })
  @IsOptional()
  @IsString({ message: 'Lý do kiểm duyệt phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Lý do kiểm duyệt không được vượt quá 500 ký tự' })
  moderationReason?: string;
}
