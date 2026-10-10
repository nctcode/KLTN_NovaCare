import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RevertNoShowDto {
  @ApiProperty({
    description: 'Lý do khôi phục lịch khám (bệnh nhân đến muộn, tiếp đón nhầm lẫn, v.v.)',
    example: 'Bệnh nhân đến muộn 25 phút do tắc đường, phòng khám đồng ý tiếp nhận bổ sung',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Lý do khôi phục phải có ít nhất 5 ký tự để đảm bảo tính minh bạch kiểm toán' })
  reason: string;
}
