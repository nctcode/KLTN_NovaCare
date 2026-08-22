import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

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
}
