import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ReadMessagesDto } from './dto/read-messages.dto';
import { ConsultationsGateway } from './consultations.gateway';

@ApiTags('Tư vấn từ xa')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/consultations')
export class ConsultationsController {
  constructor(
    private readonly service: ConsultationsService,
    private readonly gateway: ConsultationsGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo phiên tư vấn từ lịch online hợp lệ' })
  async create(@CurrentUser() user: User, @Body() dto: CreateConsultationDto) {
    return { statusCode: HttpStatus.CREATED, message: 'Tạo phiên tư vấn thành công', data: await this.service.create(user.id, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy hộp thư tư vấn của bệnh nhân hoặc bác sĩ' })
  async findAll(@CurrentUser() user: User, @Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return { statusCode: HttpStatus.OK, data: await this.service.findAll(user.id, cursor, limit) };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return { statusCode: HttpStatus.OK, data: await this.service.findOne(id, user.id) };
  }

  @Patch(':id/accept')
  async accept(@CurrentUser() user: User, @Param('id') id: string) {
    const data = await this.service.accept(id, user.id);
    this.gateway.emitStatus(id, data);
    return { statusCode: HttpStatus.OK, message: 'Bác sĩ đã nhận phiên tư vấn', data };
  }

  @Patch(':id/start')
  async start(@CurrentUser() user: User, @Param('id') id: string) {
    const data = await this.service.start(id, user.id);
    this.gateway.emitStatus(id, data);
    return { statusCode: HttpStatus.OK, message: 'Phiên tư vấn đã bắt đầu', data };
  }

  @Patch(':id/complete')
  async complete(@CurrentUser() user: User, @Param('id') id: string) {
    const data = await this.service.complete(id, user.id);
    this.gateway.emitStatus(id, data);
    return { statusCode: HttpStatus.OK, message: 'Phiên tư vấn đã kết thúc', data };
  }

  @Patch(':id/cancel')
  async cancel(@CurrentUser() user: User, @Param('id') id: string) {
    const data = await this.service.cancel(id, user.id);
    this.gateway.emitStatus(id, data);
    return { statusCode: HttpStatus.OK, message: 'Phiên tư vấn đã hủy', data };
  }

  @Get(':id/messages')
  async messages(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('before') before?: string,
    @Query('limit') limit?: number,
  ) {
    return { statusCode: HttpStatus.OK, data: await this.service.listMessages(id, user.id, before, limit) };
  }

  @Post(':id/messages')
  async sendMessage(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: SendMessageDto) {
    const data = await this.service.sendText(id, user.id, dto);
    this.gateway.emitMessage(id, data);
    return { statusCode: HttpStatus.CREATED, message: 'Đã gửi tin nhắn', data };
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async sendAttachment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('clientMessageId') clientMessageId: string,
    @Body('caption') caption?: string,
  ) {
    const data = await this.service.sendAttachment(id, user.id, clientMessageId, file, caption);
    this.gateway.emitMessage(id, data);
    return { statusCode: HttpStatus.CREATED, message: 'Đã gửi tài liệu', data };
  }

  @Get(':id/attachments/:attachmentId')
  async attachment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() response: Response,
  ) {
    const file = await this.service.getAttachment(id, attachmentId, user.id);
    response.type(file.mimeType);
    response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    return response.sendFile(file.absolutePath);
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ReadMessagesDto) {
    const data = await this.service.markRead(id, user.id, dto.lastReadMessageId);
    this.gateway.emitReceipt(id, { ...data, readerUserId: user.id });
    return { statusCode: HttpStatus.OK, data };
  }
}
