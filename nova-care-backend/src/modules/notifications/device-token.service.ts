import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class DeviceTokenService {
  constructor(private prisma: PrismaService) {}

  async registerToken(userId: string, token: string, deviceType: string = 'ANDROID') {
    return this.prisma.deviceToken.upsert({
      where: { deviceToken: token },
      update: { userId, deviceType, isActive: true, updatedAt: new Date() },
      create: { userId, deviceToken: token, deviceType, isActive: true },
    });
  }

  async getActiveTokens(userId: string): Promise<string[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
    });
    return tokens.map((t) => t.deviceToken);
  }

  async deactivateToken(token: string) {
    return this.prisma.deviceToken.updateMany({
      where: { deviceToken: token },
      data: { isActive: false },
    });
  }
}
