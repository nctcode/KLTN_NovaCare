import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ReviewStatus, ReviewTargetType } from '@prisma/client';

export class QueryReviewDto {
  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ enum: ReviewStatus, required: false })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiProperty({ enum: ReviewTargetType, required: false })
  @IsOptional()
  @IsEnum(ReviewTargetType)
  targetType?: ReviewTargetType;

  @ApiProperty({ example: 'uuid-of-doctor-or-hospital', required: false })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiProperty({ example: 5, required: false, description: 'Lọc theo số sao (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'newest', enum: ['newest', 'highest', 'lowest'], required: false })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'highest' | 'lowest' = 'newest';

  @ApiProperty({ example: 'tận tâm', required: false, description: 'Tìm kiếm từ khóa trong nhận xét' })
  @IsOptional()
  @IsString()
  q?: string;
}
