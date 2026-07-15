import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class GenerateSlotsDto {
  @ApiProperty({
    example: 'uuid-of-doctor',
    description: 'ID bác sĩ',
  })
  @IsUUID()
  doctorId: string;

  @ApiProperty({
    example: 'uuid-of-doctor-workplace',
    description: 'ID nơi làm việc của bác sĩ',
  })
  @IsUUID()
  doctorWorkplaceId: string;

  @ApiProperty({
    example: '2026-07-20',
    description: 'Ngày bắt đầu sinh khung giờ (YYYY-MM-DD)',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2026-08-20',
    description: 'Ngày kết thúc sinh khung giờ (YYYY-MM-DD)',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    example: 30,
    description: 'Thời lượng một khung giờ khám (phút)',
    default: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotDuration?: number;

  @ApiProperty({
    example: 1,
    description: 'Số lượng đặt tối đa mỗi khung giờ',
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
