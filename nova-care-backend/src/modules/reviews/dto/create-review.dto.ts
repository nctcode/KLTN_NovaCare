import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewTargetType } from '@prisma/client';

export class ReviewCriteriaDto {
  // Tiêu chí Bác sĩ (1-5)
  @ApiProperty({ example: 5, required: false, description: 'Thái độ & tôn trọng người bệnh (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  doctorAttitude?: number;

  @ApiProperty({ example: 5, required: false, description: 'Lắng nghe & giải thích (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  doctorExplanation?: number;

  @ApiProperty({ example: 5, required: false, description: 'Sự tận tâm tư vấn (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  doctorDedication?: number;

  @ApiProperty({ example: 5, required: false, description: 'Trải nghiệm giao tiếp (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  doctorCommunication?: number;

  // Tiêu chí Bệnh viện (1-5)
  @ApiProperty({ example: 4, required: false, description: 'Cơ sở vật chất (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hospitalFacility?: number;

  @ApiProperty({ example: 5, required: false, description: 'Vệ sinh & môi trường (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hospitalHygiene?: number;

  @ApiProperty({ example: 4, required: false, description: 'Quy trình tiếp nhận (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hospitalReception?: number;

  @ApiProperty({ example: 3, required: false, description: 'Thời gian chờ (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hospitalWaitingTime?: number;

  @ApiProperty({ example: 4, required: false, description: 'Thái độ phục vụ chung (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hospitalStaffAttitude?: number;
}

export class CreateReviewDto {
  @ApiProperty({
    example: 'uuid-of-appointment',
    description: 'ID lượt khám đã hoàn thành',
  })
  @IsUUID('4', { message: 'appointmentId phải là định dạng UUID hợp lệ' })
  @IsNotEmpty({ message: 'Mã lượt khám không được để trống' })
  appointmentId: string;

  @ApiProperty({
    enum: ReviewTargetType,
    example: ReviewTargetType.DOCTOR,
    description: 'Đối tượng đánh giá: DOCTOR hoặc HOSPITAL',
  })
  @IsEnum(ReviewTargetType, { message: 'targetType phải là DOCTOR hoặc HOSPITAL' })
  @IsNotEmpty({ message: 'Loại đối tượng đánh giá không được để trống' })
  targetType: ReviewTargetType;

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
    example: 'Bác sĩ tư vấn rất tận tâm, giải thích rõ ràng tình trạng bệnh và đơn thuốc.',
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
    default: false,
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
