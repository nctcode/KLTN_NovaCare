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

  async findAll(params: { page?: number; limit?: number; search?: string; status?: string; hospitalId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];

    if (params.search) {
      andConditions.push({
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      });
    }

    if (params.status && params.status !== 'ALL') {
      if (params.status === 'ACTIVE' || params.status === 'Hoạt động') {
        if (params.hospitalId) {
          andConditions.push({
            hospitalSpecialties: {
              some: {
                hospitalId: params.hospitalId,
                isActive: true,
              },
            },
          });
        } else {
          andConditions.push({ isActive: true });
        }
      } else if (params.status === 'PAUSED' || params.status === 'INACTIVE' || params.status === 'Tạm ngưng') {
        if (params.hospitalId) {
          andConditions.push({
            hospitalSpecialties: {
              some: {
                hospitalId: params.hospitalId,
                isActive: false,
              },
            },
          });
        } else {
          andConditions.push({ isActive: false });
        }
      }
    }

    // Filter by Hospital: Specialty must be linked to the hospital via HospitalSpecialty or DoctorWorkplace
    if (params.hospitalId) {
      andConditions.push({
        OR: [
          {
            hospitalSpecialties: {
              some: {
                hospitalId: params.hospitalId,
              },
            },
          },
          {
            workPlaces: {
              some: {
                hospitalId: params.hospitalId,
              },
            },
          },
        ],
      });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [items, total] = await Promise.all([
      this.prisma.specialty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          hospitalSpecialties: params.hospitalId
            ? {
                where: { hospitalId: params.hospitalId },
                select: { id: true, hospitalId: true, isActive: true },
              }
            : {
                where: { isActive: true },
                select: { id: true, hospitalId: true, isActive: true },
              },
          workPlaces: params.hospitalId
            ? {
                where: { hospitalId: params.hospitalId, isActive: true },
                select: { id: true, doctorId: true },
              }
            : false,
          _count: {
            select: {
              hospitalSpecialties: true,
              workPlaces: true,
            },
          },
        },
      }),
      this.prisma.specialty.count({ where }),
    ]);

    let stats;
    if (params.hospitalId) {
      // Calculate stats specifically for the requested hospital
      const hospitalSpecialtiesAll = await this.prisma.specialty.findMany({
        where: {
          OR: [
            {
              hospitalSpecialties: {
                some: {
                  hospitalId: params.hospitalId,
                },
              },
            },
            {
              workPlaces: {
                some: {
                  hospitalId: params.hospitalId,
                },
              },
            },
          ],
        },
        include: {
          hospitalSpecialties: {
            where: { hospitalId: params.hospitalId },
            select: { isActive: true },
          },
          workPlaces: {
            where: { hospitalId: params.hospitalId, isActive: true },
            select: { id: true },
          },
        },
      });

      const totalDoctorsInHospital = hospitalSpecialtiesAll.reduce(
        (sum, s) => sum + s.workPlaces.length,
        0
      );

      const activeCount = hospitalSpecialtiesAll.filter((s) => {
        const hs = s.hospitalSpecialties[0];
        return hs ? hs.isActive : s.isActive;
      }).length;

      stats = {
        totalSpecialties: hospitalSpecialtiesAll.length,
        activeSpecialties: activeCount,
        inactiveSpecialties: hospitalSpecialtiesAll.length - activeCount,
        totalDoctorsUsing: totalDoctorsInHospital,
        totalHospitalsUsing: 1,
      };
    } else {
      const [allSpecialties, totalHospitalSpecialties] = await Promise.all([
        this.prisma.specialty.findMany({ select: { isActive: true } }),
        this.prisma.hospitalSpecialty.count({ where: { isActive: true } }),
      ]);

      stats = {
        totalSpecialties: allSpecialties.length,
        activeSpecialties: allSpecialties.filter((s) => s.isActive).length,
        inactiveSpecialties: allSpecialties.filter((s) => !s.isActive).length,
        totalHospitalsUsing: totalHospitalSpecialties,
      };
    }

    const formattedItems = items.map((spec) => {
      const hospitalLink = params.hospitalId
        ? spec.hospitalSpecialties.find((hs: any) => hs.hospitalId === params.hospitalId)
        : null;

      const isHospitalActive = hospitalLink ? hospitalLink.isActive : spec.isActive;

      return {
        id: spec.id,
        name: spec.name,
        description: spec.description || '',
        icon: spec.icon || '',
        coverImageUrl: spec.coverImageUrl || '',
        isActive: params.hospitalId ? isHospitalActive : spec.isActive,
        isHospitalActive,
        hospitalSpecialtyId: hospitalLink?.id || null,
        hospitalCount: spec.hospitalSpecialties.length || spec._count?.hospitalSpecialties || 0,
        doctorCount: params.hospitalId && (spec as any).workPlaces
          ? (spec as any).workPlaces.length
          : spec._count?.workPlaces || 0,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      };
    });

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  async findOne(id: string, hospitalId?: string) {
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
        workPlaces: hospitalId
          ? {
              where: { hospitalId, isActive: true },
              include: {
                doctor: {
                  select: {
                    id: true,
                    fullName: true,
                    title: true,
                    avatarUrl: true,
                    rating: true,
                    consultationCount: true,
                  },
                },
              },
            }
          : false,
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

    const hospitalDoctors = (specialty as any).workPlaces?.map((wp: any) => ({
      ...wp.doctor,
      consultationFee: wp.consultationFee,
    })) || [];

    const hospitalLink = hospitalId
      ? specialty.hospitalSpecialties.find((hs) => hs.hospitalId === hospitalId)
      : null;

    return {
      id: specialty.id,
      name: specialty.name,
      description: specialty.description,
      icon: specialty.icon,
      coverImageUrl: specialty.coverImageUrl,
      isActive: hospitalId && hospitalLink ? hospitalLink.isActive : specialty.isActive,
      isHospitalActive: hospitalLink ? hospitalLink.isActive : specialty.isActive,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt,
      hospitalCount: appliedHospitals.length,
      appliedHospitals,
      hospitalDoctors,
    };
  }

  async toggleHospitalStatus(specialtyId: string, hospitalId: string, isActive: boolean) {
    const existing = await this.prisma.hospitalSpecialty.findUnique({
      where: {
        hospitalId_specialtyId: {
          hospitalId,
          specialtyId,
        },
      },
    });

    if (!existing) {
      return await this.prisma.hospitalSpecialty.create({
        data: {
          hospitalId,
          specialtyId,
          isActive,
        },
      });
    }

    return await this.prisma.hospitalSpecialty.update({
      where: {
        hospitalId_specialtyId: {
          hospitalId,
          specialtyId,
        },
      },
      data: { isActive },
    });
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
