import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/modules/users/users.service';
import { PrismaService } from '@/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User } from '@prisma/client';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<User, 'passwordHash'> & {
    hospital?: { id: string; name: string; logoUrl?: string | null; externalId?: string | null } | null;
  };
}

import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegistrationOtpService, normalizePhone, tokenHash } from './registration-otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private passwordReset: PasswordResetService,
    private registrationOtp: RegistrationOtpService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, fullName, password, verificationToken } = registerDto;
    const phone = normalizePhone(registerDto.phone || '');

    // Kiểm tra ít nhất một trong email hoặc phone
    if (!email && !phone) {
      throw new BadRequestException('Vui lòng cung cấp email hoặc số điện thoại');
    }

    // Kiểm tra trùng lặp
    if (email) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new ConflictException('Email đã được đăng ký');
    }
    if (phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone } });
      if (existing) throw new ConflictException('Số điện thoại đã được đăng ký');
    }

    const passwordHash = await argon2.hash(password);
    const verificationTokenHash = tokenHash(verificationToken);
    const fullUser = await this.prisma.$transaction(async tx => {
      const challenge = await tx.registrationOtpChallenge.findUnique({ where: { phone } });
      if (!challenge?.verificationTokenHash || challenge.verificationTokenHash !== verificationTokenHash || !challenge.verificationExpiresAt || challenge.verificationExpiresAt <= new Date()) {
        throw new BadRequestException('Vui lòng xác minh số điện thoại trước khi đăng ký');
      }
      const created = await tx.user.create({ data: { email: email?.trim().toLowerCase() || null, phone, fullName: fullName.trim(), passwordHash, isActive: true } });
      await tx.registrationOtpChallenge.delete({ where: { phone } });
      return created;
    });
    const { passwordHash: _, ...user } = fullUser;
    const tokens = await this.generateTokens(fullUser!);

    return { ...tokens, user };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { username, password } = loginDto;

    // Tìm user theo email hoặc phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { phone: username }],
        deletedAt: null,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            externalId: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc số điện thoại không tồn tại');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // Kiểm tra mật khẩu với Argon2id
    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    // Cập nhật thời gian đăng nhập
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);
    const { passwordHash: _, ...sanitizedUser } = user;

    return { ...tokens, user: sanitizedUser };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const claims = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('app.jwt.refreshSecret') as string,
      });

      // Kiểm tra token trong database
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: {
              hospital: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  externalId: true,
                },
              },
            },
          },
        },
      });

      if (!storedToken || storedToken.isRevoked) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }
      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token đã hết hạn');
      }

      const user = storedToken.user;
      if ((claims.authVersion ?? 0) !== user.authVersion) throw new UnauthorizedException();
      if (!user.isActive) {
        throw new UnauthorizedException('Tài khoản đã bị khóa');
      }

      // Tạo tokens mới
      const tokens = await this.generateTokens(user);

      // Thu hồi refresh token cũ (xoay vòng)
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      const { passwordHash: _, ...sanitizedUser } = user;
      return { ...tokens, user: sanitizedUser };
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId },
      data: { isRevoked: true },
    });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) { return this.passwordReset.request(dto); }

  async verifyForgotPasswordOtp(dto: VerifyOtpDto) { return this.passwordReset.verify(dto); }

  async requestRegistrationOtp(phone: string) { return this.registrationOtp.request(phone); }

  async verifyRegistrationOtp(phone: string, otpCode: string) { return this.registrationOtp.verify(phone, otpCode); }

  async resetPassword(dto: ResetPasswordDto) { return this.passwordReset.reset(dto); }

  /**
   * Xác minh mã token kích hoạt tài khoản Quản trị bệnh viện
   */
  async verifyActivationToken(token: string) {
    if (!token) {
      throw new BadRequestException('Mã token kích hoạt không được để trống');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        activationToken: token,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Mã kích hoạt không hợp lệ hoặc tài khoản đã được kích hoạt');
    }

    if (user.activationExpiresAt && user.activationExpiresAt < new Date()) {
      throw new BadRequestException('Mã kích hoạt đã hết hạn (quá 48 giờ). Vui lòng liên hệ NovaCare để nhận lại mã mới.');
    }

    return {
      valid: true,
      email: user.email,
      fullName: user.fullName,
      hospitalName: user.hospital?.name || 'Cơ sở Y tế Đối tác',
      hospitalId: user.hospitalId,
    };
  }

  /**
   * Kích hoạt tài khoản: Thiết lập mật khẩu mới và tự động đăng nhập
   */
  async activateHospitalAccount(token: string, password: string): Promise<AuthResponse> {
    if (!token) {
      throw new BadRequestException('Mã token kích hoạt không được để trống');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        activationToken: token,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            externalId: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Mã kích hoạt không hợp lệ hoặc đã được sử dụng');
    }

    if (user.activationExpiresAt && user.activationExpiresAt < new Date()) {
      throw new BadRequestException('Mã kích hoạt đã hết hạn. Vui lòng liên hệ NovaCare để được hỗ trợ.');
    }

    // Băm mật khẩu người dùng tự đặt
    const passwordHash = await argon2.hash(password);

    // Cập nhật trạng thái người dùng
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
        activationToken: null,
        activationExpiresAt: null,
        lastLoginAt: new Date(),
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            externalId: true,
          },
        },
      },
    });

    // Tự động sinh token đăng nhập và trả về
    const tokens = await this.generateTokens(updatedUser);
    const { passwordHash: _, activationToken: __, ...sanitizedUser } = updatedUser;

    return { ...tokens, user: sanitizedUser as any };
  }

  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload = {
      sub: user.id,
      authVersion: user.authVersion ?? 0,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId || null,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.accessSecret') as string,
      expiresIn: (this.configService.get<string>('app.jwt.accessExpiresIn') || '7d') as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.refreshSecret') as string,
      expiresIn: (this.configService.get<string>('app.jwt.refreshExpiresIn') || '30d') as any,
    });

    // Lưu refresh token vào database
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 ngày tính bằng giây
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
