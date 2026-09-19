import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateHospitalAdminDto } from './dto/create-hospital-admin.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(params.role ? { role: params.role } : {}),
    };

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          isActive: true,
          hospitalId: true,
          hospital: {
            select: { id: true, name: true },
          },
          lastLoginAt: true,
          createdAt: true,
          patientProfiles: true,
          _count: {
            select: { patientProfiles: true, appointments: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createHospitalAdmin(
    dto: CreateHospitalAdminDto,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Kiểm tra bệnh viện có tồn tại không
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: dto.hospitalId },
    });
    if (!hospital) {
      throw new NotFoundException('Cơ sở y tế không tồn tại');
    }

    // 2. Kiểm tra email đã được đăng ký chưa
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email này đã được sử dụng trong hệ thống');
    }

    // 3. Hash mật khẩu
    const passwordHash = await argon2.hash(dto.password);

    // 4. Tạo User role HOSPITAL_ADMIN
    const newUser = await this.prisma.user.create({
      data: {
        fullName: dto.fullName?.trim() || `Quản Trị Viện - ${hospital.name}`,
        email: dto.email,
        phone: dto.phone || null,
        passwordHash,
        role: Role.HOSPITAL_ADMIN,
        hospitalId: dto.hospitalId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        hospitalId: true,
        hospital: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    // 5. Audit Log
    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'CREATE_HOSPITAL_ADMIN',
      entityType: 'User',
      entityId: newUser.id,
      newValue: {
        email: newUser.email,
        role: newUser.role,
        hospitalId: newUser.hospitalId,
      },
      ipAddress,
      userAgent,
    });

    return newUser;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        patientProfiles: true,
        appointments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            patientProfile: true,
            payment: true,
            slot: {
              include: {
                doctorWorkplace: {
                  include: { doctor: true, hospital: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const { passwordHash: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async toggleStatus(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: updated.isActive ? 'UNLOCK_USER' : 'LOCK_USER',
      entityType: 'User',
      entityId: id,
      oldValue: { isActive: user.isActive },
      newValue: { isActive: updated.isActive },
      ipAddress,
      userAgent,
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      isActive: updated.isActive,
      message: updated.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
    };
  }

  async updateRole(id: string, role: Role, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'UPDATE_USER_ROLE',
      entityType: 'User',
      entityId: id,
      oldValue: { role: user.role },
      newValue: { role: updated.role },
      ipAddress,
      userAgent,
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      role: updated.role,
      message: 'Cập nhật quyền người dùng thành công',
    };
  }

  async getUserAppointments(id: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { userId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patientProfile: true,
          payment: true,
          slot: {
            include: {
              doctorWorkplace: {
                include: { doctor: true, hospital: true },
              },
            },
          },
        },
      }),
      this.prisma.appointment.count({ where: { userId: id } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
