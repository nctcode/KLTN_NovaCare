import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSlotDto {
  @ApiProperty({
    example: 2,
    description: 'Số lượng đặt tối đa mỗi khung giờ (Capacity)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({
    example: true,
    description: 'Trạng thái còn khả dụng để đặt (isAvailable)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({
    example: true,
    description: 'Trạng thái hoạt động (isActive)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
