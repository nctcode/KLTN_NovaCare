import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({
    example: 'uuid-of-doctor-workplace',
    description: 'ID nơi làm việc của bác sĩ',
  })
  @IsUUID()
  doctorWorkplaceId: string;

  @ApiProperty({
    example: 1,
    description: 'Ngày trong tuần (0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy)',
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    example: '08:00',
    description: 'Giờ bắt đầu làm việc (HH:mm)',
  })
  @IsNotEmpty({ message: 'Giờ bắt đầu không được để trống' })
  @IsString()
  startTime: string;

  @ApiProperty({
    example: '17:00',
    description: 'Giờ kết thúc làm việc (HH:mm)',
  })
  @IsNotEmpty({ message: 'Giờ kết thúc không được để trống' })
  @IsString()
  endTime: string;

  @ApiProperty({
    example: '12:00',
    description: 'Giờ bắt đầu nghỉ trưa (HH:mm)',
    required: false,
  })
  @IsOptional()
  @IsString()
  breakStart?: string;

  @ApiProperty({
    example: '13:00',
    description: 'Giờ kết thúc nghỉ trưa (HH:mm)',
    required: false,
  })
  @IsOptional()
  @IsString()
  breakEnd?: string;

  @ApiProperty({
    example: true,
    description: 'Kích hoạt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
