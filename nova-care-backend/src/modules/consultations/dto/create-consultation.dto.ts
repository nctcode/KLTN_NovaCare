import { ApiProperty } from '@nestjs/swagger';
import { ConsultationChannel, ConsultationRequestMode } from '@prisma/client';
import { Equals, IsBoolean, IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty({ description: 'Lịch khám online đã được xác nhận hoặc thanh toán' })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ enum: ConsultationRequestMode, default: ConsultationRequestMode.SCHEDULED })
  @IsEnum(ConsultationRequestMode)
  requestMode: ConsultationRequestMode = ConsultationRequestMode.SCHEDULED;

  @ApiProperty({ enum: ConsultationChannel, default: ConsultationChannel.CHAT })
  @IsEnum(ConsultationChannel)
  channel: ConsultationChannel = ConsultationChannel.CHAT;

  @ApiProperty({ example: 'Đau khớp gối khi vận động' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  topic: string;

  @ApiProperty({ example: 'Triệu chứng bắt đầu ba ngày trước...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(4000)
  description: string;

  @ApiProperty({ description: 'Người bệnh xác nhận chia sẻ nội dung đã nhập với bác sĩ' })
  @IsBoolean()
  @Equals(true)
  consentAccepted: boolean;

  @ApiProperty({ description: 'Khóa chống tạo trùng do client sinh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idempotencyKey: string;
}
