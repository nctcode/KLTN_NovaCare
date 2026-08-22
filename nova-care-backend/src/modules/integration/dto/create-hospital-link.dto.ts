import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { MatchingStatus } from '@prisma/client';

export class CreateHospitalLinkDto {
  @ApiProperty({ description: 'ID bệnh viện', example: 'uuid' })
  @IsString()
  @IsNotEmpty({ message: 'hospitalId không được để trống' })
  hospitalId: string;

  @ApiProperty({ description: 'Mã bệnh nhân nội bộ tại bệnh viện', example: 'PAT-175-001' })
  @IsString()
  @IsNotEmpty({ message: 'externalPatientId không được để trống' })
  externalPatientId: string;

  @ApiPropertyOptional({ enum: MatchingStatus, default: MatchingStatus.MATCHED })
  @IsEnum(MatchingStatus, { message: 'matchingStatus phải thuộc MatchingStatus (MATCHED, PENDING, UNMATCHED)' })
  @IsOptional()
  matchingStatus?: MatchingStatus;
}
