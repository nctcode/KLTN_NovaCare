import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export const CONSENT_SECTIONS = ['SUMMARY', 'DIAGNOSES', 'OBSERVATIONS', 'PRESCRIPTIONS'] as const;

export class CreateConsentDto {
  @ApiProperty({ description: 'ID hồ sơ bệnh nhân', example: 'uuid' })
  @IsUUID('4', { message: 'patientProfileId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'patientProfileId không được để trống' })
  patientProfileId: string;

  @ApiProperty({ description: 'ID bệnh viện nguồn (nơi lưu trữ lịch sử khám)', example: 'uuid' })
  @IsUUID('4', { message: 'sourceHospitalId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'sourceHospitalId không được để trống' })
  sourceHospitalId: string;

  @ApiProperty({ description: 'ID bệnh viện đích (nơi xin quyền truy xuất)', example: 'uuid' })
  @IsUUID('4', { message: 'targetHospitalId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'targetHospitalId không được để trống' })
  targetHospitalId: string;

  @ApiPropertyOptional({ description: 'Thời điểm hết hạn đồng ý chia sẻ', example: '2026-09-18T23:59:59.000Z' })
  @IsDateString({}, { message: 'expiresAt phải là chuỗi ngày ISO 8601 hợp lệ' })
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({ description: 'Các lần khám nguồn được phép chia sẻ', type: [String] })
  @IsArray({ message: 'encounterIds phải là một danh sách' })
  @IsUUID('4', { each: true, message: 'Mỗi encounterId phải là UUID hợp lệ' })
  encounterIds: string[];

  @ApiProperty({ description: 'Nhóm dữ liệu được phép truy xuất', enum: CONSENT_SECTIONS, isArray: true })
  @IsArray({ message: 'allowedSections phải là một danh sách' })
  @IsIn(CONSENT_SECTIONS, { each: true, message: 'Nhóm dữ liệu chia sẻ không hợp lệ' })
  allowedSections: (typeof CONSENT_SECTIONS)[number][];

  @ApiPropertyOptional({ description: 'Mục đích sử dụng dữ liệu', default: 'TREATMENT' })
  @IsOptional()
  @IsString()
  purpose?: string;
}
