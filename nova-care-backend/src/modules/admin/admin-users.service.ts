import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { Role } from '@prisma/client';

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
    };

    if (params.role) {
      where.role = params.role;
    }

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
          lastLoginAt: true,
          createdAt: true,
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
