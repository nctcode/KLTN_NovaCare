import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAppointmentDto {
  @ApiProperty({
    example: 'uuid-of-new-slot',
    description: 'ID khung giờ mới (khi đổi lịch)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @ApiProperty({
    example: 'Cập nhật lý do khám',
    description: 'Lý do khám mới',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    example: 'Triệu chứng đã thay đổi',
    description: 'Triệu chứng mới',
    required: false,
  })
  @IsOptional()
  @IsString()
  symptoms?: string;
}
