import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerQuestionDto {
  @ApiProperty({ description: 'Câu trả lời của bệnh nhân cho câu hỏi hiện tại' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}
