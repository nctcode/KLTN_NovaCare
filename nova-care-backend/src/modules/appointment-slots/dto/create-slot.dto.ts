import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateSlotDto {
  @ApiProperty({
    example: 'uuid-of-doctor-workplace',
    description: 'ID liên kết nơi làm việc của bác sĩ',
  })
  @IsUUID()
  doctorWorkplaceId: string;

  @ApiProperty({
    example: '2026-07-20T08:00:00Z',
    description: 'Thời gian bắt đầu khám (ISO String)',
  })
  @IsDateString({}, { message: 'Thời gian bắt đầu không hợp lệ' })
  startTime: string;

  @ApiProperty({
    example: '2026-07-20T08:30:00Z',
    description: 'Thời gian kết thúc khám (ISO String)',
  })
  @IsDateString({}, { message: 'Thời gian kết thúc không hợp lệ' })
  endTime: string;

  @ApiProperty({
    example: 1,
    description: 'Số lượng tối đa bệnh nhân có thể đặt trong khung giờ',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({
    example: true,
    description: 'Còn khả dụng để đặt khám',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({
    example: true,
    description: 'Kích hoạt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
