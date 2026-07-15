import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const { email, phone, password, fullName } = createUserDto;

    // Kiểm tra trùng lặp email
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new ConflictException('Email đã được đăng ký');
      }
    }

    // Kiểm tra trùng lặp phone
    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được đăng ký');
      }
    }

    // Hash password với Argon2id
    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        fullName,
        isActive: true,
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findByIdOrThrow(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existing) {
        throw new ConflictException('Email đã được sử dụng bởi tài khoản khác');
      }
    }

    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: updateUserDto.phone },
      });
      if (existing) {
        throw new ConflictException('Số điện thoại đã được sử dụng bởi tài khoản khác');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }

  async softDelete(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
