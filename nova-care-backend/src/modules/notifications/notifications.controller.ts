import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { DeviceTokenService } from './device-token.service';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'fcm-token-string' })
  @IsNotEmpty()
  @IsString()
  deviceToken: string;

  @ApiProperty({ example: 'ANDROID', required: false })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

@ApiTags('Thông báo')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceTokenService: DeviceTokenService,
  ) {}

  @Post('register-device')
  @ApiOperation({ summary: 'Đăng ký FCM Token thiết bị di động' })
  async registerDevice(@CurrentUser() user: User, @Body() dto: RegisterDeviceDto) {
    const token = await this.deviceTokenService.registerToken(user.id, dto.deviceToken, dto.deviceType || 'ANDROID');
    return {
      statusCode: 200,
      message: 'Đăng ký token thiết bị thành công',
      data: token,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng' })
  async getNotifications(@CurrentUser() user: User) {
    const list = await this.notificationsService.getUserNotifications(user.id);
    return {
      statusCode: 200,
      message: 'Lấy danh sách thông báo thành công',
      data: list,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return {
      statusCode: 200,
      message: 'Lấy số lượng thông báo chưa đọc thành công',
      data: count,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  async markRead(@CurrentUser() user: User, @Param('id') id: string) {
    const res = await this.notificationsService.markAsRead(id, user.id);
    return {
      statusCode: 200,
      message: 'Đánh dấu thông báo đã đọc thành công',
      data: res,
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu đọc tất cả thông báo' })
  async markAllRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return {
      statusCode: 200,
      message: 'Đánh dấu đọc tất cả thông báo thành công',
      data: { success: true },
    };
  }
}
