import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({ example: 'question-id-uuid' })
  @IsString()
  questionId: string;

  @ApiProperty({ example: 'Cơn đau lan ra vai trái và tay trái' })
  @IsString()
  answer: string;
}
