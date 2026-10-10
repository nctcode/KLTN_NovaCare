import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerRequestStatus } from '@prisma/client';

export class UpdatePartnerStatusDto {
  @ApiProperty({
    description: 'Trạng thái xử lý yêu cầu hợp tác',
    enum: PartnerRequestStatus,
    example: PartnerRequestStatus.CONTACTED,
  })
  @IsEnum(PartnerRequestStatus, { message: 'Trạng thái không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp trạng thái' })
  status: PartnerRequestStatus;

  @ApiPropertyOptional({ description: 'Ghi chú thêm về cuộc trao đổi' })
  @IsString()
  @IsOptional()
  adminNote?: string;
}
