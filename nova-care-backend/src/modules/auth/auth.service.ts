import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
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
  user: Omit<User, 'passwordHash'>;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, phone, fullName, password } = registerDto;

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

    // Tạo user
    const user = await this.usersService.create({ email, phone, fullName, password });

    // Lấy lại user đầy đủ (có passwordHash để tạo token)
    const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
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
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('app.jwt.refreshSecret') as string,
      });

      // Kiểm tra token trong database
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!storedToken || storedToken.isRevoked) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }
      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token đã hết hạn');
      }

      const user = storedToken.user;
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

  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.accessSecret') as string,
      expiresIn: (this.configService.get<string>('app.jwt.accessExpiresIn') || '15m') as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.refreshSecret') as string,
      expiresIn: (this.configService.get<string>('app.jwt.refreshExpiresIn') || '7d') as any,
    });

    // Lưu refresh token vào database
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 phút tính bằng giây
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
