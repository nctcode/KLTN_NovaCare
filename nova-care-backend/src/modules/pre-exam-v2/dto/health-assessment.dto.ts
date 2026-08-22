import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, IsObject } from 'class-validator';

export class SymptomDetailDto {
  @IsString()
  symptom: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  severity?: number; // 1 - 10

  @IsOptional()
  @IsString()
  onset?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  progression?: string; // 'stable' | 'worsening' | 'improving'
}

export class VitalSignsDto {
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  spo2?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  source?: string; // 'smartwatch' | 'manual' | 'camera_ppg'
}

export class HealthAssessmentDto {
  @ApiProperty({ description: 'Mô tả ngắn gọn bằng văn bản' })
  @IsOptional()
  @IsString()
  textInput?: string;

  @ApiProperty({ description: 'Danh sách triệu chứng có cấu trúc' })
  @IsOptional()
  @IsArray()
  symptoms?: SymptomDetailDto[];

  @ApiProperty({ description: 'Tiền sử bệnh lý' })
  @IsOptional()
  @IsArray()
  medicalHistory?: string[];

  @ApiProperty({ description: 'Danh sách thuốc đang dùng' })
  @IsOptional()
  @IsArray()
  medications?: string[];

  @ApiProperty({ description: 'Tiền sử dị ứng' })
  @IsOptional()
  @IsArray()
  allergies?: string[];

  @ApiProperty({ description: 'Tiền sử gia đình' })
  @IsOptional()
  @IsArray()
  familyHistory?: string[];

  @ApiProperty({ description: 'Thông tin lối sống' })
  @IsOptional()
  @IsObject()
  lifestyle?: {
    smoking?: string;
    alcohol?: string;
    activityLevel?: string;
    sleepHours?: number;
  };

  @ApiProperty({ description: 'Chỉ số sinh hiệu y tế' })
  @IsOptional()
  @IsObject()
  vitalSigns?: VitalSignsDto;

  @ApiProperty({ description: 'Tên bệnh viện được chọn nếu có' })
  @IsOptional()
  @IsString()
  hospitalId?: string;
}
