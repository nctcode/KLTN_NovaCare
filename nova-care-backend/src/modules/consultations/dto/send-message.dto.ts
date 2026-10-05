import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'ID phía client để retry an toàn' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientMessageId: string;

  @ApiProperty({ example: 'Bác sĩ cho tôi hỏi...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text: string;
}
