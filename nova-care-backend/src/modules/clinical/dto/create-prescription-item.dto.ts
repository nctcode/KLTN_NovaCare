import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreatePrescriptionItemDto {
  @ApiProperty({ description: 'Tên thuốc', example: 'Amlodipine 5mg' })
  @IsString()
  @IsNotEmpty({ message: 'drugName không được để trống' })
  drugName: string;

  @ApiProperty({ description: 'Liều dùng', example: '5mg' })
  @IsString()
  @IsNotEmpty({ message: 'dosage không được để trống' })
  dosage: string;

  @ApiProperty({ description: 'Cách dùng', example: 'Uống 1 viên buổi sáng' })
  @IsString()
  @IsNotEmpty({ message: 'usageInstruction không được để trống' })
  usageInstruction: string;

  @ApiProperty({ description: 'Số lượng', example: 14 })
  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(1, { message: 'quantity phải lớn hơn 0' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Đơn vị', example: 'viên' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Thời gian dùng', example: '14 ngày' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thuốc' })
  @IsString()
  @IsOptional()
  note?: string;
}
