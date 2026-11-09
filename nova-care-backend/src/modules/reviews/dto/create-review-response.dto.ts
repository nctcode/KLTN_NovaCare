import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReviewResponseDto {
  @ApiProperty({
    example: 'Cảm ơn bạn đã phản hồi. Bác sĩ và phòng khám sẽ tiếp tục nỗ lực nâng cao chất lượng dịch vụ.',
    description: 'Nội dung phản hồi chính thức từ Bác sĩ hoặc Bệnh viện (5 - 1000 ký tự)',
  })
  @IsString({ message: 'Nội dung phản hồi phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung phản hồi không được để trống' })
  @MinLength(5, { message: 'Nội dung phản hồi tối thiểu 5 ký tự' })
  @MaxLength(1000, { message: 'Nội dung phản hồi không được vượt quá 1000 ký tự' })
  responseContent: string;
}
