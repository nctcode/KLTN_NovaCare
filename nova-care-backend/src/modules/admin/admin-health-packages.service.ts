import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class AdminHealthPackagesService {
  constructor(private readonly prisma: PrismaService, private readonly auditLogService: AuditLogService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    hospitalId?: string;
    specialtyId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.hospitalId) {
      where.hospitalId = params.hospitalId;
    }
    if (params.specialtyId) {
      where.specialtyId = params.specialtyId;
    }
    if (params.status && params.status !== 'ALL') {
      where.isActive = params.status === 'ACTIVE' || params.status === 'true';
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const sortField = params.sortBy || 'updatedAt';
    const sortDirection = params.sortOrder || 'desc';
    const orderBy: any = {};
    orderBy[sortField] = sortDirection;

    const [items, total, totalPackages, activePackages, inactivePackages, hospitalsCount] = await Promise.all([
      this.prisma.healthPackage.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { hospital: true, specialty: true },
      }),
      this.prisma.healthPackage.count({ where }),
      this.prisma.healthPackage.count(),
      this.prisma.healthPackage.count({ where: { isActive: true } }),
      this.prisma.healthPackage.count({ where: { isActive: false } }),
      this.prisma.hospital.count({ where: { packages: { some: {} } } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalPackages,
        activePackages,
        inactivePackages,
        totalHospitalsOffering: hospitalsCount,
      },
    };
  }

  async findOne(id: string) {
    const pkg = await this.prisma.healthPackage.findUnique({
      where: { id },
      include: { hospital: true, specialty: true },
    });
    if (!pkg) throw new NotFoundException('Gói khám không tồn tại');
    return pkg;
  }

  async create(data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    if (!data.hospitalId) {
      throw new BadRequestException('ID Bệnh viện là bắt buộc đối với gói khám');
    }

    const hospital = await this.prisma.hospital.findUnique({ where: { id: data.hospitalId } });
    if (!hospital) {
      throw new NotFoundException('Bệnh viện không tồn tại');
    }

    if (data.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({ where: { id: data.specialtyId } });
      if (!specialty) {
        throw new NotFoundException('Chuyên khoa không tồn tại');
      }
    }

    const pkg = await this.prisma.healthPackage.create({
      data: {
        hospitalId: data.hospitalId,
        specialtyId: data.specialtyId || null,
        name: data.name,
        thumbnailUrl: data.thumbnailUrl || null,
        price: data.price || 0,
        originalPrice: data.originalPrice || null,
        description: data.description || null,
        duration: data.duration || 60,
        services: data.services || [],
        preparationNote: data.preparationNote || null,
        estimatedResultTime: data.estimatedResultTime || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: { hospital: true, specialty: true },
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

    if (data.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({ where: { id: data.hospitalId } });
      if (!hospital) {
        throw new NotFoundException('Bệnh viện không tồn tại');
      }
    }

    if (data.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({ where: { id: data.specialtyId } });
      if (!specialty) {
        throw new NotFoundException('Chuyên khoa không tồn tại');
      }
    }

    const updated = await this.prisma.healthPackage.update({
      where: { id },
      data,
      include: { hospital: true, specialty: true },
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

  async toggleStatus(id: string, isActive: boolean, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.healthPackage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gói khám không tồn tại');

    const updated = await this.prisma.healthPackage.update({
      where: { id },
      data: { isActive },
      include: { hospital: true, specialty: true },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: isActive ? 'ACTIVATE_HEALTH_PACKAGE' : 'DEACTIVATE_HEALTH_PACKAGE',
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
