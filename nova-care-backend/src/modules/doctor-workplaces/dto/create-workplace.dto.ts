import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkplaceDto {
  @ApiProperty({
    example: 'uuid-of-doctor',
    description: 'ID bác sĩ',
  })
  @IsString()
  doctorId: string;

  @ApiProperty({
    example: 'uuid-of-hospital',
    description: 'ID cơ sở y tế',
  })
  @IsString()
  hospitalId: string;

  @ApiProperty({
    example: 'uuid-of-specialty',
    description: 'ID chuyên khoa',
  })
  @IsString()
  specialtyId: string;

  @ApiProperty({
    example: 'uuid-of-branch',
    description: 'ID chi nhánh (nếu có)',
    required: false,
  })
  @IsOptional()
  @IsString()
  branchId?: string | null;

  @ApiProperty({
    example: true,
    description: 'Nơi công tác chính',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

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
