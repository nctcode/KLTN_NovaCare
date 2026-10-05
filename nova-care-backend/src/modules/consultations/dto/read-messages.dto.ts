import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReadMessagesDto {
  @ApiProperty()
  @IsUUID()
  lastReadMessageId: string;
}
