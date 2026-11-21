import { Controller, Get, Header, Headers, Param, Post, RawBodyRequest, Req, BadRequestException, ParseUUIDPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ConsultationVideoService } from './consultation-video.service';

@Controller('api/v1/consultation-video')
export class ConsultationVideoController {
  constructor(private readonly video: ConsultationVideoService) {}

  @Get('capabilities')
  capabilities() { return { statusCode: HttpStatus.OK, success: true, data: { videoEnabled: this.video.isConfigured() } }; }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async join(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: User) {
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Tham gia phòng video thành công',
      data: await this.video.join(id, user.id),
    };
  }

  @Public()
  @Post('webhook')
  async webhook(@Req() request: RawBodyRequest<Request>, @Headers('authorization') authorization?: string) {
    if (!request.rawBody) throw new BadRequestException('Missing raw webhook body');
    await this.video.webhook(request.rawBody.toString('utf8'), authorization);
    return { received: true };
  }
}
