import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { CreateSpecialtyDto } from '../specialties/dto/create-specialty.dto';
import { UpdateSpecialtyDto } from '../specialties/dto/update-specialty.dto';

@Injectable()
export class AdminSpecialtiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(params: { page?: number; limit?: number; search?: string; status?: string }) {
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

    if (params.status && params.status !== 'ALL') {
      if (params.status === 'ACTIVE' || params.status === 'Hoạt động') {
        where.isActive = true;
      } else if (params.status === 'PAUSED' || params.status === 'INACTIVE' || params.status === 'Tạm ngưng') {
        where.isActive = false;
      }
    }

    const [items, total, allSpecialties, totalHospitalSpecialties] = await Promise.all([
      this.prisma.specialty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          hospitalSpecialties: {
            where: { isActive: true },
            select: { id: true, hospitalId: true },
          },
          _count: {
            select: {
              hospitalSpecialties: true,
              workPlaces: true,
            },
          },
        },
      }),
      this.prisma.specialty.count({ where }),
      this.prisma.specialty.findMany({ select: { isActive: true } }),
      this.prisma.hospitalSpecialty.count({ where: { isActive: true } }),
    ]);

    const formattedItems = items.map((spec) => ({
      id: spec.id,
      name: spec.name,
      description: spec.description || '',
      icon: spec.icon || '',
      coverImageUrl: spec.coverImageUrl || '',
      isActive: spec.isActive,
      hospitalCount: spec.hospitalSpecialties.length || spec._count.hospitalSpecialties,
      createdAt: spec.createdAt,
      updatedAt: spec.updatedAt,
    }));

    const stats = {
      totalSpecialties: allSpecialties.length,
      activeSpecialties: allSpecialties.filter((s) => s.isActive).length,
      inactiveSpecialties: allSpecialties.filter((s) => !s.isActive).length,
      totalHospitalsUsing: totalHospitalSpecialties,
    };

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
      include: {
        hospitalSpecialties: {
          include: {
            hospital: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                city: true,
                address: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại');
    }

    const appliedHospitals = (specialty.hospitalSpecialties || []).map((hs) => ({
      id: hs.id,
      hospitalId: hs.hospitalId,
      hospitalName: hs.hospital?.name || 'Bệnh viện',
      hospitalLogoUrl: hs.hospital?.logoUrl || '',
      hospitalCity: hs.hospital?.city || '',
      hospitalAddress: hs.hospital?.address || '',
      hospitalStatus: hs.hospital?.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng',
      isActive: hs.isActive,
      createdAt: hs.createdAt,
    }));

    return {
      id: specialty.id,
      name: specialty.name,
      description: specialty.description,
      icon: specialty.icon,
      coverImageUrl: specialty.coverImageUrl,
      isActive: specialty.isActive,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt,
      hospitalCount: appliedHospitals.length,
      appliedHospitals,
    };
  }

  async create(data: CreateSpecialtyDto, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.specialty.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictException(`Chuyên khoa "${data.name}" đã tồn tại trong hệ thống`);
    }

    const specialty = await this.prisma.specialty.create({
      data: {
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        coverImageUrl: data.coverImageUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'CREATE_SPECIALTY',
        entityType: 'Specialty',
        entityId: specialty.id,
        newValue: specialty,
        ipAddress,
        userAgent,
      });
    }

    return specialty;
  }

  async update(id: string, data: UpdateSpecialtyDto, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.specialty.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Chuyên khoa không tồn tại');
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await this.prisma.specialty.findUnique({
        where: { name: data.name },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Chuyên khoa "${data.name}" đã tồn tại trong hệ thống`);
      }
    }

    // Prevent modifying createdAt
    const { ...updatePayload } = data as any;
    delete updatePayload.createdAt;

    const updated = await this.prisma.specialty.update({
      where: { id },
      data: updatePayload,
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'UPDATE_SPECIALTY',
        entityType: 'Specialty',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        ipAddress,
        userAgent,
      });
    }

    return updated;
  }

  async toggleStatus(id: string, isActive: boolean, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.specialty.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Chuyên khoa không tồn tại');
    }

    const updated = await this.prisma.specialty.update({
      where: { id },
      data: { isActive },
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: isActive ? 'ACTIVATE_SPECIALTY' : 'DEACTIVATE_SPECIALTY',
        entityType: 'Specialty',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        ipAddress,
        userAgent,
      });
    }

    return updated;
  }
}
