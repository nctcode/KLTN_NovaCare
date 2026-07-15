import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @ApiProperty({
    example: 'Bệnh nhân bận đột xuất',
    description: 'Lý do hủy',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
