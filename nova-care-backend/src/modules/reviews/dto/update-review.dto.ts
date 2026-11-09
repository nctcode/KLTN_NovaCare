import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewCriteriaDto } from './create-review.dto';

export class UpdateReviewDto {
  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Điểm số hài lòng chung (1 - 5 sao)',
  })
  @IsInt({ message: 'Điểm đánh giá phải là số nguyên' })
  @Min(1, { message: 'Điểm đánh giá tối thiểu là 1 sao' })
  @Max(5, { message: 'Điểm đánh giá tối đa là 5 sao' })
  rating: number;

  @ApiProperty({
    example: 'Nội dung nhận xét đã được chỉnh sửa bổ sung.',
    minLength: 10,
    maxLength: 1000,
    description: 'Nội dung nhận xét (10 - 1000 ký tự)',
  })
  @IsString({ message: 'Nội dung nhận xét phải là chuỗi ký tự' })
  @MinLength(10, { message: 'Nhận xét phải có ít nhất 10 ký tự' })
  @MaxLength(1000, { message: 'Nhận xét không được vượt quá 1000 ký tự' })
  comment: string;

  @ApiProperty({
    example: false,
    description: 'Ẩn danh tên của người đánh giá khi hiển thị công khai',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({
    type: ReviewCriteriaDto,
    required: false,
    description: 'Điểm số theo từng tiêu chí chi tiết',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReviewCriteriaDto)
  criteria?: ReviewCriteriaDto;
}
