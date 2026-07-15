import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    example: 'uuid-of-patient-profile',
    description: 'ID hồ sơ người đi khám',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'ID hồ sơ bệnh nhân không được để trống' })
  patientProfileId: string;

  @ApiProperty({
    example: 'uuid-of-appointment-slot',
    description: 'ID khung giờ khám',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'ID khung giờ khám không được để trống' })
  slotId: string;

  @ApiProperty({
    example: 'uuid-of-medical-service',
    description: 'ID dịch vụ khám (tùy chọn)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  medicalServiceId?: string;

  @ApiProperty({
    example: 'Đau ngực, khó thở',
    description: 'Lý do khám',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    example: 'Xuất hiện sau khi vận động mạnh, kèm mệt mỏi',
    description: 'Triệu chứng ban đầu',
    required: false,
  })
  @IsOptional()
  @IsString()
  symptoms?: string;

  @ApiProperty({
    example: 'uuid-of-idempotency',
    description: 'Mã chống gửi lặp (tạo từ client)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Idempotency key không được để trống' })
  idempotencyKey: string;
}
