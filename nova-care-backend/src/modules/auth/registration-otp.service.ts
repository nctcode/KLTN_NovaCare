import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SmsService } from './sms.service';
import { createHash, randomBytes, randomInt } from 'crypto';
import * as argon2 from 'argon2';

const INVALID = 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.';
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');

export function normalizePhone(value: string): string {
  const phone = value.replace(/[\s.-]/g, '').replace(/^\+?84/, '0');
  if (!/^0[35789]\d{8}$/.test(phone)) throw new BadRequestException('Số điện thoại không hợp lệ');
  return phone;
}

@Injectable()
export class RegistrationOtpService {
  constructor(private readonly prisma: PrismaService, private readonly sms: SmsService) {}

  async request(rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    if (await this.prisma.user.findUnique({ where: { phone } })) throw new ConflictException('Số điện thoại đã được đăng ký');
    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await argon2.hash(otp);
    const now = new Date();
    const reserved = await this.prisma.$transaction(async tx => {
      const old = await tx.registrationOtpChallenge.findUnique({ where: { phone } });
      const sameWindow = !!old && now.getTime() - old.windowStart.getTime() < 3_600_000;
      if (old && (now.getTime() - old.requestedAt.getTime() < 60_000 || (sameWindow && old.sendCount >= 5))) return false;
      const data = { otpHash, expiresAt: new Date(now.getTime() + 300_000), requestedAt: now, attempts: 0,
        windowStart: sameWindow ? old!.windowStart : now, sendCount: sameWindow ? old!.sendCount + 1 : 1,
        verificationTokenHash: null, verificationExpiresAt: null };
      await tx.registrationOtpChallenge.upsert({ where: { phone }, create: { phone, ...data }, update: data });
      return true;
    });
    if (!reserved) return { message: 'Nếu có thể gửi lại, mã xác thực mới sẽ được gửi đến số điện thoại này.' };
    try {
      await this.sms.sendResetOtp(phone, otp);
    } catch {
      await this.prisma.registrationOtpChallenge.updateMany({ where: { phone, otpHash }, data: { otpHash: null } });
      throw new ServiceUnavailableException('Chưa thể gửi mã xác thực. Vui lòng thử lại sau.');
    }
    return { message: 'Mã xác thực đã được gửi. Mã có hiệu lực 5 phút.', maskedPhone: phone.slice(0, 3) + '****' + phone.slice(-3) };
  }

  async verify(rawPhone: string, otpCode: string) {
    const phone = normalizePhone(rawPhone);
    const result = await this.prisma.$transaction(async tx => {
      const challenge = await tx.registrationOtpChallenge.findUnique({ where: { phone } });
      if (!challenge?.otpHash || challenge.expiresAt <= new Date() || challenge.attempts >= 5) return null;
      if (!await argon2.verify(challenge.otpHash, otpCode)) {
        await tx.registrationOtpChallenge.update({ where: { phone }, data: { attempts: { increment: 1 } } });
        return null;
      }
      const verificationToken = randomBytes(32).toString('hex');
      await tx.registrationOtpChallenge.update({ where: { phone }, data: {
        otpHash: null, verificationTokenHash: tokenHash(verificationToken), verificationExpiresAt: new Date(Date.now() + 10 * 60_000),
      } });
      return verificationToken;
    });
    if (!result) throw new BadRequestException(INVALID);
    return { verificationToken: result, phone };
  }
}
