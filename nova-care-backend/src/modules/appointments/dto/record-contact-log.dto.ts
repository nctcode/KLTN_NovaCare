import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class RecordContactLogDto {
  @ApiProperty({
    description: 'Kênh liên hệ (PHONE, SMS, ZALO, DIRECT, OTHER)',
    example: 'PHONE',
    default: 'PHONE',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['PHONE', 'SMS', 'ZALO', 'DIRECT', 'OTHER'])
  channel: string;

  @ApiProperty({
    description: 'Kết quả cuộc gọi/liên hệ (NO_ANSWER, BUSY, UNREACHABLE, ANSWERED, WRONG_NUMBER, RESCHEDULE_REQUESTED, OTHER)',
    example: 'NO_ANSWER',
    default: 'NO_ANSWER',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['NO_ANSWER', 'BUSY', 'UNREACHABLE', 'ANSWERED', 'WRONG_NUMBER', 'RESCHEDULE_REQUESTED', 'OTHER'])
  outcome: string;

  @ApiPropertyOptional({
    description: 'Ghi chú chi tiết về cuộc liên hệ',
    example: 'Gọi lần 1 lúc 09:10 chuông reo không ai nghe máy',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
