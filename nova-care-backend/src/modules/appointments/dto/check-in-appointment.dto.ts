import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckInAppointmentDto {
  @ApiPropertyOptional({
    description: 'Ghi chú khi tiếp nhận bệnh nhân tại quầy',
    example: 'Bệnh nhân có mặt tại quầy tiếp đón số 2, đã kiểm tra CCCD/BHYT',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
