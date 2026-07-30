import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class AdminHealthPackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.healthPackage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { hospital: true },
      }),
      this.prisma.healthPackage.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const pkg = await this.prisma.healthPackage.findUnique({
      where: { id },
      include: { hospital: true },
    });
    if (!pkg) throw new NotFoundException('Gói khám không tồn tại');
    return pkg;
  }

  async create(data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const pkg = await this.prisma.healthPackage.create({
      data: {
        hospitalId: data.hospitalId || null,
        name: data.name,
        description: data.description,
        price: data.price || 0,
        duration: data.duration || 60,
        services: data.services || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'CREATE_HEALTH_PACKAGE',
      entityType: 'HealthPackage',
      entityId: pkg.id,
      newValue: pkg,
      ipAddress,
      userAgent,
    });

    return pkg;
  }

  async update(id: string, data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.healthPackage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gói khám không tồn tại');

    const updated = await this.prisma.healthPackage.update({
      where: { id },
      data,
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'UPDATE_HEALTH_PACKAGE',
      entityType: 'HealthPackage',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async delete(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.healthPackage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gói khám không tồn tại');

    await this.prisma.healthPackage.delete({
      where: { id },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'DELETE_HEALTH_PACKAGE',
      entityType: 'HealthPackage',
      entityId: id,
      oldValue: existing,
      ipAddress,
      userAgent,
    });

    return { message: 'Đã xóa gói khám thành công' };
  }
}
