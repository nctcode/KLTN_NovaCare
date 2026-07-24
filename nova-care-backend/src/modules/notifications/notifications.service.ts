import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { NotificationType } from '@prisma/client';
import { FcmService } from './fcm.service';
import { DeviceTokenService } from './device-token.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private fcmService: FcmService,
    private deviceTokenService: DeviceTokenService,
    private emailService: EmailService,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    content: string,
    type: NotificationType,
    data?: any,
    channel: string = 'in_app',
    appointmentId?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
        data: data ? JSON.parse(JSON.stringify(data)) : undefined,
        channel,
      },
    });

    // Send push notification if token exists
    const activeTokens = await this.deviceTokenService.getActiveTokens(userId);
    if (activeTokens.length > 0) {
      const stringData: Record<string, string> = {};
      if (data) {
        Object.keys(data).forEach((k) => {
          stringData[k] = String(data[k]);
        });
      }
      await this.fcmService.sendPushNotification(activeTokens, title, content, stringData);
    }

    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Thông báo không tồn tại');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
