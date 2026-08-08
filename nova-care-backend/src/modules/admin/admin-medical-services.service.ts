import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class AdminMedicalServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    hospitalId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.hospitalId) {
      where.hospitalId = params.hospitalId;
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

    const [items, total, totalServices, activeServices, inactiveServices, hospitalsCount] = await Promise.all([
      this.prisma.medicalService.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { hospital: true },
      }),
      this.prisma.medicalService.count({ where }),
      this.prisma.medicalService.count(),
      this.prisma.medicalService.count({ where: { isActive: true } }),
      this.prisma.medicalService.count({ where: { isActive: false } }),
      this.prisma.hospital.count({ where: { services: { some: {} } } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalServices,
        activeServices,
        inactiveServices,
        totalHospitalsOffering: hospitalsCount,
      },
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.medicalService.findUnique({
      where: { id },
      include: { hospital: true },
    });
    if (!service) throw new NotFoundException('Dịch vụ y tế không tồn tại');
    return service;
  }

  async create(data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    if (!data.hospitalId) {
      throw new BadRequestException('ID Bệnh viện là bắt buộc đối với dịch vụ y tế');
    }
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Tên dịch vụ y tế không được để trống');
    }
    if (data.price !== undefined && Number(data.price) < 0) {
      throw new BadRequestException('Giá dịch vụ không được nhỏ hơn 0');
    }
    if (data.duration !== undefined && Number(data.duration) <= 0) {
      throw new BadRequestException('Thời gian thực hiện phải lớn hơn 0');
    }

    const hospital = await this.prisma.hospital.findUnique({ where: { id: data.hospitalId } });
    if (!hospital) {
      throw new NotFoundException('Bệnh viện được chọn không tồn tại');
    }

    const service = await this.prisma.medicalService.create({
      data: {
        hospitalId: data.hospitalId,
        name: data.name.trim(),
        description: data.description || null,
        price: data.price !== undefined ? Number(data.price) : 0,
        duration: data.duration !== undefined ? Number(data.duration) : 30,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
      include: { hospital: true },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'CREATE_MEDICAL_SERVICE',
      entityType: 'MedicalService',
      entityId: service.id,
      newValue: service,
      ipAddress,
      userAgent,
    });

    return service;
  }

  async update(id: string, data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.medicalService.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Dịch vụ y tế không tồn tại');

    if (data.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({ where: { id: data.hospitalId } });
      if (!hospital) {
        throw new NotFoundException('Bệnh viện được chọn không tồn tại');
      }
    }
    if (data.name !== undefined && (!data.name || !data.name.trim())) {
      throw new BadRequestException('Tên dịch vụ y tế không được để trống');
    }
    if (data.price !== undefined && Number(data.price) < 0) {
      throw new BadRequestException('Giá dịch vụ không được nhỏ hơn 0');
    }
    if (data.duration !== undefined && Number(data.duration) <= 0) {
      throw new BadRequestException('Thời gian thực hiện phải lớn hơn 0');
    }

    const updated = await this.prisma.medicalService.update({
      where: { id },
      data: {
        hospitalId: data.hospitalId || undefined,
        name: data.name ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description : undefined,
        price: data.price !== undefined ? Number(data.price) : undefined,
        duration: data.duration !== undefined ? Number(data.duration) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
      include: { hospital: true },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'UPDATE_MEDICAL_SERVICE',
      entityType: 'MedicalService',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async toggleStatus(id: string, isActive: boolean, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.medicalService.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Dịch vụ y tế không tồn tại');

    const updated = await this.prisma.medicalService.update({
      where: { id },
      data: { isActive },
      include: { hospital: true },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: isActive ? 'ACTIVATE_MEDICAL_SERVICE' : 'DEACTIVATE_MEDICAL_SERVICE',
      entityType: 'MedicalService',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async delete(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.medicalService.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Dịch vụ y tế không tồn tại');

    await this.prisma.medicalService.delete({
      where: { id },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'DELETE_MEDICAL_SERVICE',
      entityType: 'MedicalService',
      entityId: id,
      oldValue: existing,
      ipAddress,
      userAgent,
    });

    return { message: 'Đã xóa dịch vụ y tế thành công' };
  }
}
