import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class SubmitSymptomDto {
  @ApiProperty({ example: 'Tôi bị đau tức ngực trái kéo dài 2 ngày, khó thở nhẹ khi đi bộ' })
  @IsString()
  text: string;

  @ApiProperty({ example: '[{"area":"ngực trái","x":120,"y":200}]', required: false })
  @IsOptional()
  bodyDiagram?: string; // JSON string or Array

  @ApiProperty({ example: '{"spo2": 96, "heartRate": 82}', required: false })
  @IsOptional()
  vitals?: string;
}
