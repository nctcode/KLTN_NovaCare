import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DataSource, Gender } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Nguyễn Văn An', description: 'Họ và tên bác sĩ' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên bác sĩ không được để trống' })
  @MaxLength(150)
  fullName!: string;

  @ApiPropertyOptional({ example: 'BS.CKI', description: 'Học hàm / Chức danh' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE, description: 'Giới tính' })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính phải là MALE, FEMALE hoặc OTHER' })
  gender?: Gender;

  @ApiPropertyOptional({
    example: 'Bác sĩ Chuyên khoa I Tim mạch',
    description: 'Bằng cấp / Chuyên môn',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  qualification?: string;

  @ApiPropertyOptional({ example: 8, description: 'Số năm kinh nghiệm' })
  @IsOptional()
  @IsInt({ message: 'Số năm kinh nghiệm phải là số nguyên' })
  @Min(0, { message: 'Số năm kinh nghiệm không được âm' })
  @Max(70, { message: 'Số năm kinh nghiệm không hợp lệ' })
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Tiểu sử / Giới thiệu chuyên môn' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện bác sĩ' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'DOC_001', description: 'Mã bác sĩ nội bộ / HIS (nếu có)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @ApiPropertyOptional({ enum: DataSource, default: DataSource.MANUAL })
  @IsOptional()
  @IsEnum(DataSource)
  source?: DataSource;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // ── Thông tin nơi công tác ban đầu (DoctorWorkplace) ──
  @ApiPropertyOptional({ description: 'ID cơ sở y tế (HOSPITAL_ADMIN sẽ tự động gắn)' })
  @IsOptional()
  @IsUUID('4', { message: 'hospitalId không hợp lệ' })
  hospitalId?: string;

  @ApiPropertyOptional({ description: 'ID chi nhánh cơ sở y tế (nếu có)' })
  @IsOptional()
  @IsUUID('4', { message: 'branchId không hợp lệ' })
  branchId?: string;

  @ApiPropertyOptional({ description: 'ID chuyên khoa tại cơ sở y tế' })
  @IsOptional()
  @IsUUID('4', { message: 'specialtyId không hợp lệ' })
  specialtyId?: string;

  @ApiPropertyOptional({ example: 350000, description: 'Giá khám (VNĐ)' })
  @IsOptional()
  @IsNumber({}, { message: 'Giá khám phải là số hợp lệ' })
  @Min(0, { message: 'Giá khám không được âm' })
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Trưởng khoa', description: 'Chức vụ tại khoa' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu công tác (ISO date)' })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @ApiPropertyOptional({ default: true, description: 'Nơi công tác chính' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
