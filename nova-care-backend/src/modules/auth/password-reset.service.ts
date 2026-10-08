import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import { SmsService } from './sms.service';
import { randomBytes, randomInt } from 'crypto';
import { tokenHash } from './registration-otp.service';
import * as argon2 from 'argon2';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const ACK = 'Nếu tài khoản hợp lệ, mã xác thực sẽ được gửi đến thông tin bạn cung cấp. Mã có hiệu lực 5 phút.';
const INVALID = 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới nếu cần.';

export function resetIdentifier(dto: ForgotPasswordDto) {
  if (!!dto.phone === !!dto.email) throw new BadRequestException('Vui lòng nhập một số điện thoại hoặc email');
  if (dto.phone) {
    const phone = dto.phone.replace(/[\s.-]/g, '').replace(/^\+?84/, '0');
    if (!/^0[35789]\d{8}$/.test(phone)) throw new BadRequestException('Số điện thoại không hợp lệ');
    return { phone };
  }
  const email = dto.email!.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Email không hợp lệ');
  return { email };
}

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService, private readonly sms: SmsService, private readonly email: EmailService) {}

  async request(dto: ForgotPasswordDto) {
    const identifier = resetIdentifier(dto);
    const destination = identifier.phone || identifier.email!;
    const response = { message: ACK, maskedPhone: identifier.phone ? destination.slice(0, 3) + '****' + destination.slice(-3) : destination.replace(/^(.{1,2}).*(@.*)$/, '$1***$2') };
    const user = await this.prisma.user.findFirst({ where: { ...identifier, deletedAt: null, isActive: true } });
    if (!user) return response;
    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await argon2.hash(otp);
    const now = new Date();
    const reserved = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const old = await tx.passwordResetChallenge.findUnique({ where: { userId: user.id } });
      const sameWindow = !!old && now.getTime() - old.windowStart.getTime() < 3600000;
      if (old && (now.getTime() - old.requestedAt.getTime() < 60000 || (sameWindow && old.sendCount >= 5))) return false;
      const data = { otpHash, destination, expiresAt: new Date(now.getTime() + 300000), requestedAt: now, attempts: 0,
        windowStart: sameWindow ? old!.windowStart : now, sendCount: sameWindow ? old!.sendCount + 1 : 1 };
      await tx.passwordResetChallenge.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
      return true;
    });
    if (!reserved) return response;
    try {
      if (identifier.phone) await this.sms.sendResetOtp(identifier.phone, otp);
      else if (!await this.email.sendForgotPasswordOtp(identifier.email!, user.fullName, otp, user.id)) throw new ServiceUnavailableException();
    } catch {
      await this.prisma.passwordResetChallenge.updateMany({ where: { userId: user.id, otpHash }, data: { otpHash: null } });
      throw new ServiceUnavailableException('Chưa thể gửi mã xác thực. Vui lòng thử lại sau.');
    }
    return response;
  }

  async verify(dto: VerifyOtpDto) {
    const identifier = resetIdentifier(dto);
    const user = await this.prisma.user.findFirst({ where: { ...identifier, deletedAt: null, isActive: true } });
    if (!user) throw new BadRequestException(INVALID);
    const resetToken = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const challenge = await tx.passwordResetChallenge.findUnique({ where: { userId: user.id } });
      if (!challenge?.otpHash || challenge.destination !== (identifier.phone || identifier.email) || challenge.expiresAt <= new Date() || challenge.attempts >= 5) return false;
      if (!await argon2.verify(challenge.otpHash, dto.otpCode)) {
        await tx.passwordResetChallenge.update({ where: { userId: user.id }, data: { attempts: { increment: 1 } } });
        return false;
      }
      const rawToken = randomBytes(32).toString('hex');
      await tx.passwordResetChallenge.update({ where: { userId: user.id }, data: { otpHash: null,
        verificationTokenHash: tokenHash(rawToken), verificationExpiresAt: new Date(Date.now() + 10 * 60_000) } });
      return rawToken;
    });
    if (!resetToken) throw new BadRequestException(INVALID);
    return { resetToken };
  }

  async reset(dto: ResetPasswordDto) {
    const hashedToken = tokenHash(dto.resetToken);
    const challenge = await this.prisma.passwordResetChallenge.findFirst({ where: {
      verificationTokenHash: hashedToken, verificationExpiresAt: { gt: new Date() },
    } });
    if (!challenge) throw new BadRequestException('Phiên đổi mật khẩu không hợp lệ hoặc đã hết hạn.');
    const success = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${challenge.userId} FOR UPDATE`;
      const current = await tx.passwordResetChallenge.findUnique({ where: { userId: challenge.userId } });
      if (current?.verificationTokenHash !== hashedToken || !current.verificationExpiresAt || current.verificationExpiresAt <= new Date()) return false;
      const passwordHash = await argon2.hash(dto.newPassword);
      await tx.user.update({ where: { id: challenge.userId }, data: { passwordHash, authVersion: { increment: 1 }, otpCode: null, otpExpiresAt: null, otpVerified: false } });
      await tx.passwordResetChallenge.update({ where: { userId: challenge.userId }, data: { verificationTokenHash: null, verificationExpiresAt: null } });
      await tx.refreshToken.updateMany({ where: { userId: challenge.userId, isRevoked: false }, data: { isRevoked: true } });
      return true;
    });
    if (!success) throw new BadRequestException('Phiên đổi mật khẩu không hợp lệ hoặc đã hết hạn.');
    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' };
  }
}
