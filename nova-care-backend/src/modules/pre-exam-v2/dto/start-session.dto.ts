import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class StartPreExamDto {
  @ApiProperty({ example: 45 })
  @IsNumber()
  age: number;

  @ApiProperty({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsString()
  gender: string;

  @ApiProperty({ example: ['Tăng huyết áp', 'Đái tháo đường'], required: false })
  @IsOptional()
  @IsArray()
  medicalHistory?: string[];

  @ApiProperty({ example: 'Amlodipine 5mg', required: false })
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiProperty({ example: 'Penicillin', required: false })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiProperty({ example: 170, required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ example: 68, required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;
}
