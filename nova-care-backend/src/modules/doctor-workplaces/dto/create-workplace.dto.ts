import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateWorkplaceDto {
  @ApiProperty({
    example: 'uuid-of-doctor',
    description: 'ID bác sĩ',
  })
  @IsUUID()
  doctorId: string;

  @ApiProperty({
    example: 'uuid-of-hospital',
    description: 'ID cơ sở y tế',
  })
  @IsUUID()
  hospitalId: string;

  @ApiProperty({
    example: 'uuid-of-specialty',
    description: 'ID chuyên khoa',
  })
  @IsUUID()
  specialtyId: string;

  @ApiProperty({
    example: 250000,
    description: 'Phí khám (VND)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @ApiProperty({
    example: true,
    description: 'Kích hoạt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
