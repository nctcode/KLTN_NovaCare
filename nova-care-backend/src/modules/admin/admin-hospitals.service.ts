import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class AdminHospitalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.hospital.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branches: { where: { deletedAt: null } },
          services: true,
          _count: { select: { workPlaces: true } },
        },
      }),
      this.prisma.hospital.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      include: {
        branches: { where: { deletedAt: null } },
        services: true,
        workPlaces: { include: { doctor: true, specialty: true } },
      },
    });
    if (!hospital || hospital.deletedAt) throw new NotFoundException('Bệnh viện không tồn tại');
    return hospital;
  }

  async create(data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const hospital = await this.prisma.hospital.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
        logoUrl: data.logoUrl,
        website: data.website,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'CREATE_HOSPITAL',
      entityType: 'Hospital',
      entityId: hospital.id,
      newValue: hospital,
      ipAddress,
      userAgent,
    });

    return hospital;
  }

  async update(id: string, data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.hospital.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Bệnh viện không tồn tại');

    const updated = await this.prisma.hospital.update({
      where: { id },
      data,
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'UPDATE_HOSPITAL',
      entityType: 'Hospital',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async delete(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.hospital.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Bệnh viện không tồn tại');

    await this.prisma.hospital.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'DELETE_HOSPITAL',
      entityType: 'Hospital',
      entityId: id,
      oldValue: existing,
      ipAddress,
      userAgent,
    });

    return { message: 'Đã xóa bệnh viện thành công' };
  }
}
