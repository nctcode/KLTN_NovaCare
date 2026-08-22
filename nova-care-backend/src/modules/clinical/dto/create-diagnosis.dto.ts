import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDiagnosisDto {
  @ApiProperty({ description: 'Mã ICD-10', example: 'I10' })
  @IsString()
  @IsNotEmpty({ message: 'icdCode không được để trống' })
  icdCode: string;

  @ApiProperty({ description: 'Tên bệnh', example: 'Tăng huyết áp vô căn' })
  @IsString()
  @IsNotEmpty({ message: 'diseaseName không được để trống' })
  diseaseName: string;

  @ApiPropertyOptional({ description: 'Chẩn đoán chính', default: true })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Ghi chú chẩn đoán' })
  @IsString()
  @IsOptional()
  note?: string;
}
