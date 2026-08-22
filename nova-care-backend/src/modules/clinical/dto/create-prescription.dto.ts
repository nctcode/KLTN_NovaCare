import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @ApiPropertyOptional({ description: 'Ghi chú cho đơn thuốc', example: 'Uống thuốc đúng giờ sau ăn' })
  @IsString()
  @IsOptional()
  note?: string;
}
