import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateShareDto } from './dto/create-share.dto';
import * as crypto from 'crypto';

@Injectable()
export class MedicalPassportService {
  private readonly logger = new Logger(MedicalPassportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy hồ sơ passport của người dùng hiện tại
   */
  async getMyPassport(userId: string) {
    const passport = await this.prisma.medicalPassport.findUnique({
      where: { userId },
      include: {
        shares: {
          where: { isActive: true, validUntil: { gte: new Date() } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!passport) {
      throw new NotFoundException(
        'Chưa có hồ sơ y tế. Hãy hoàn thành phiếu tiền khám để tạo hồ sơ.',
      );
    }

    return passport;
  }

  /**
   * Tạo link chia sẻ hồ sơ với QR code và mã PIN
   */
  async createShare(userId: string, dto: CreateShareDto) {
    const passport = await this.prisma.medicalPassport.findUnique({ where: { userId } });
    if (!passport) {
      throw new NotFoundException('Chưa có hồ sơ y tế');
    }

    const validDays = dto.validDays || 7;
    const shareToken = crypto.randomUUID();
    const qrCode = crypto.createHash('sha256').update(shareToken).digest('hex');
    const pinCode = String(Math.floor(1000 + Math.random() * 9000));
    const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    const share = await this.prisma.medicalPassportShare.create({
      data: {
        passportId: passport.id,
        shareToken,
        qrCode,
        pinCode,
        allowedSections: dto.allowedSections,
        validUntil,
        sharedWith: dto.sharedWith,
      },
    });

    this.logger.log(`Created passport share ${share.id} for user ${userId}`);

    return {
      id: share.id,
      shareUrl: `https://novacare.vn/share/${shareToken}`,
      qrCode: qrCode,
      pinCode,
      validUntil,
      allowedSections: dto.allowedSections,
    };
  }

  /**
   * Truy cập hồ sơ chia sẻ (endpoint public – yêu cầu token + PIN)
   */
  async accessSharedPassport(
    token: string,
    pin: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const share = await this.prisma.medicalPassportShare.findUnique({
      where: { shareToken: token },
      include: { medicalPassport: true },
    });

    if (!share) {
      throw new NotFoundException('Link chia sẻ không tồn tại hoặc đã hết hạn');
    }

    if (!share.isActive || share.revokedAt) {
      throw new ForbiddenException('Link chia sẻ đã bị thu hồi');
    }

    if (share.validUntil < new Date()) {
      throw new ForbiddenException('Link chia sẻ đã hết hạn');
    }

    if (share.pinCode && share.pinCode !== pin) {
      throw new ForbiddenException('Mã PIN không đúng');
    }

    // Ghi nhật ký truy cập
    await this.prisma.medicalPassportAccessLog.create({
      data: { shareId: share.id, ipAddress, userAgent },
    });

    // Cập nhật thống kê truy cập
    await this.prisma.medicalPassportShare.update({
      where: { id: share.id },
      data: { lastAccessedAt: new Date(), accessCount: { increment: 1 } },
    });

    // Lọc dữ liệu theo allowedSections
    const fullSummary = share.medicalPassport.summary as Record<string, any>;
    const filteredData: Record<string, any> = {};

    for (const section of share.allowedSections) {
      if (fullSummary[section] !== undefined) {
        filteredData[section] = fullSummary[section];
      } else {
        // Map generic section names
        const sectionMap: Record<string, string> = {
          summary: 'chiefComplaint',
          allergies: 'allergies',
          medications: 'medications',
          medical_history: 'medicalHistory',
          recent_visits: 'lastUpdated',
        };
        const key = sectionMap[section];
        if (key && fullSummary[key] !== undefined) {
          filteredData[section] = fullSummary[key];
        }
      }
    }

    return {
      accessGranted: true,
      sharedWith: share.sharedWith,
      validUntil: share.validUntil,
      allowedSections: share.allowedSections,
      data: filteredData,
    };
  }

  /**
   * Thu hồi quyền truy cập link chia sẻ
   */
  async revokeShare(shareId: string, userId: string) {
    const share = await this.prisma.medicalPassportShare.findUnique({
      where: { id: shareId },
      include: { medicalPassport: true },
    });

    if (!share) {
      throw new NotFoundException('Không tìm thấy link chia sẻ');
    }

    if (share.medicalPassport.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thu hồi link này');
    }

    await this.prisma.medicalPassportShare.update({
      where: { id: shareId },
      data: { isActive: false, revokedAt: new Date() },
    });

    this.logger.log(`Revoked passport share ${shareId} by user ${userId}`);
    return { message: 'Đã thu hồi quyền truy cập thành công' };
  }

  /**
   * Lấy danh sách link chia sẻ và nhật ký truy cập
   */
  async getMyShares(userId: string) {
    const passport = await this.prisma.medicalPassport.findUnique({
      where: { userId },
      include: {
        shares: {
          orderBy: { createdAt: 'desc' },
          include: { accessLogs: { orderBy: { accessedAt: 'desc' }, take: 10 } },
        },
      },
    });

    if (!passport) {
      throw new NotFoundException('Chưa có hồ sơ y tế');
    }

    return passport.shares;
  }
}
