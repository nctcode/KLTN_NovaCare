import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class AdminHospitalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(params: { page?: number; limit?: number; search?: string; type?: string; city?: string; status?: string; hospitalId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (params.hospitalId) {
      where.id = params.hospitalId;
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.type && params.type !== 'ALL') {
      const typeMap: Record<string, string> = { 'Công': 'PUBLIC', 'Tư nhân': 'PRIVATE', 'Quốc tế': 'INTERNATIONAL' };
      where.type = typeMap[params.type] || params.type;
    }
    if (params.city && params.city !== 'ALL') {
      where.city = params.city;
    }
    if (params.status && params.status !== 'ALL') {
      const statusMap: Record<string, string> = { 'Hoạt động': 'ACTIVE', 'Tạm ngưng': 'PAUSED', 'Ngừng hợp tác': 'TERMINATED' };
      where.status = statusMap[params.status] || params.status;
    }

    const statsWhere: any = { deletedAt: null };
    const doctorStatsWhere: any = { isActive: true };
    if (params.hospitalId) {
      statsWhere.id = params.hospitalId;
      doctorStatsWhere.hospitalId = params.hospitalId;
    }

    const [items, total, allHospitalsForStats, totalDoctorsCount] = await Promise.all([
      this.prisma.hospital.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branches: { where: { deletedAt: null } },
          integrationConfig: {
            select: {
              endpointUrl: true,
              authType: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              services: true,
            },
          },
          workPlaces: {
            select: {
              doctorId: true,
              specialtyId: true,
              doctor: {
                select: {
                  source: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.hospital.count({ where }),
      this.prisma.hospital.findMany({
        where: statsWhere,
        select: { status: true },
      }),
      this.prisma.doctorWorkplace.count({ where: doctorStatsWhere }),
    ]);

    const hospitalIds = items.map((item) => item.id);
    const syncLogs = hospitalIds.length > 0
      ? await this.prisma.auditLog.findMany({
          where: {
            entityType: 'Hospital',
            entityId: { in: hospitalIds },
            action: 'HIS_CATALOG_SYNC',
          },
          orderBy: { createdAt: 'desc' },
          take: hospitalIds.length * 5,
          include: {
            user: { select: { fullName: true, email: true } },
          },
        })
      : [];

    const syncLogsByHospital = new Map<string, any[]>();
    for (const log of syncLogs) {
      if (!log.entityId) continue;
      const list = syncLogsByHospital.get(log.entityId) || [];
      if (list.length < 5) {
        list.push(log);
        syncLogsByHospital.set(log.entityId, list);
      }
    }

    const formattedItems = items.map((item) => {
      const uniqueSpecialties = new Set(item.workPlaces.map((wp) => wp.specialtyId).filter(Boolean));
      const count = uniqueSpecialties.size || item.workPlaces.length;
      const apiDoctorCount = item.workPlaces.filter((wp) => wp.doctor?.source === 'API').length;
      const manualDoctorCount = item.workPlaces.length - apiDoctorCount;
      const hospitalSyncLogs = syncLogsByHospital.get(item.id) || [];
      const latestSync = hospitalSyncLogs[0] || null;
      const syncPayload = (latestSync?.newValue || {}) as Record<string, any>;
      const recentSyncLogs = hospitalSyncLogs.map((log) => {
        const p = (log.newValue || {}) as Record<string, any>;
        return {
          id: log.id,
          createdAt: log.createdAt,
          success: log.success,
          errorMessage: !log.success ? (log.description || p.errorMessage || null) : null,
          endpointUrl: p.endpointUrl || item.integrationConfig?.endpointUrl || null,
          createdCount: Number(p.createdCount ?? 0),
          updatedCount: Number(p.updatedCount ?? 0),
          unchangedCount: Number(p.unchangedCount ?? 0),
          totalSynced: Number(p.totalSynced ?? 0),
          durationMs: typeof p.durationMs === 'number' ? p.durationMs : null,
          actorName: log.user?.fullName || log.user?.email || 'Quản trị cơ sở',
        };
      });
      return {
        id: item.id,
        name: item.name,
        hospitalCode: item.hospitalCode || null,
        hotline: item.phone || item.hotline || '028 1234 5678',
        logoUrl: item.logoUrl || '',
        type: item.type === 'PUBLIC' ? 'Công' : item.type === 'PRIVATE' ? 'Tư nhân' : 'Quốc tế',
        rawType: item.type,
        city: item.city || 'TP. Hồ Chí Minh',
        address: item.address || 'TP. Hồ Chí Minh, Việt Nam',
        email: item.email || 'contact@novacare.vn',
        website: item.website || '',
        emergencyHotline: item.emergencyHotline || item.hotline || item.phone || '115',
        operatingHours: item.operatingHours || '07:00 - 17:00 (Thứ 2 - Thứ 7)',
        bedCount: item.bedCount || null,
        establishedYear: item.establishedYear || null,
        doctorCount: item.workPlaces.length,
        apiDoctorCount,
        manualDoctorCount,
        serviceCount: item._count?.services ?? 0,
        specialtyCount: count,
        status: item.status === 'ACTIVE' ? 'Hoạt động' : item.status === 'PAUSED' ? 'Tạm ngưng' : 'Ngừng hợp tác',
        rawStatus: item.status,
        source: item.source,
        externalId: item.externalId,
        integrationConfig: item.integrationConfig || null,
        lastSyncAt: latestSync?.createdAt || null,
        lastSyncStatus: latestSync ? (latestSync.success ? 'SUCCESS' : 'FAILED') : null,
        lastSyncDurationMs: typeof syncPayload.durationMs === 'number' ? syncPayload.durationMs : null,
        lastSyncError: latestSync && !latestSync.success ? (latestSync.description || syncPayload.errorMessage || null) : null,
        recentSyncLogs,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const stats = {
      totalHospitals: allHospitalsForStats.length,
      activeHospitals: allHospitalsForStats.filter((h) => h.status === 'ACTIVE').length,
      pausedHospitals: allHospitalsForStats.filter((h) => h.status === 'PAUSED').length,
      totalDoctors: totalDoctorsCount,
    };

    return { items: formattedItems, total, page, limit, totalPages: Math.ceil(total / limit), stats };
  }

  async findOne(id: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      include: {
        branches: { where: { deletedAt: null } },
        services: true,
        workPlaces: { include: { doctor: true, specialty: true } },
        hospitalSpecialties: { include: { specialty: true } },
      },
    });
    if (!hospital || hospital.deletedAt) throw new NotFoundException('Bệnh viện không tồn tại');

    const specMap = new Map();
    (hospital.hospitalSpecialties || []).forEach((hs: any) => {
      if (hs.specialty && hs.isActive) {
        specMap.set(hs.specialty.id, hs.specialty);
      }
    });

    // Fallback to workPlaces specialties if hospitalSpecialties is empty
    if (specMap.size === 0) {
      (hospital.workPlaces || []).forEach((wp: any) => {
        if (wp.specialty) {
          specMap.set(wp.specialty.id, wp.specialty);
        }
      });
    }

    return {
      ...hospital,
      specialties: Array.from(specMap.values()),
    };
  }

  async create(data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const { specialtyIds, coverImageUrl, ...createPayload } = data || {};
    const existingCodes = await this.prisma.hospital.findMany({
      where: { hospitalCode: { not: null } },
      select: { hospitalCode: true },
    });
    const usedCodes = new Set(existingCodes.map((item) => item.hospitalCode));
    let codeNumber = 1;
    while (usedCodes.has(`BV-${String(codeNumber).padStart(3, '0')}`)) codeNumber += 1;
    const generatedHospitalCode = `BV-${String(codeNumber).padStart(3, '0')}`;

    const hospital = await this.prisma.hospital.create({
      data: {
        name: createPayload.name,
        hospitalCode: generatedHospitalCode,
        externalId: createPayload.externalId || null,
        type: createPayload.type || 'PUBLIC',
        establishedYear: createPayload.establishedYear ? Number(createPayload.establishedYear) : undefined,
        bedCount: createPayload.bedCount ? Number(createPayload.bedCount) : undefined,
        logoUrl: createPayload.logoUrl || null,
        coverImageUrl: coverImageUrl || createPayload.coverImage || null,
        images: Array.isArray(createPayload.images) ? createPayload.images : [],
        description: createPayload.description || null,
        hotline: createPayload.hotline || null,
        emergencyHotline: createPayload.emergencyHotline || null,
        phone: createPayload.phone || createPayload.hotline || null,
        email: createPayload.email || null,
        website: createPayload.website || null,
        city: createPayload.city || null,
        address: createPayload.address || null,
        googleMapUrl: createPayload.googleMapUrl || null,
        latitude: createPayload.latitude ? Number(createPayload.latitude) : undefined,
        longitude: createPayload.longitude ? Number(createPayload.longitude) : undefined,
        operatingHours: createPayload.operatingHours || null,
        status: createPayload.status || 'ACTIVE',
        rating: 0,
        reviewCount: 0,
        isActive: createPayload.isActive !== undefined ? createPayload.isActive : true,
      },
    });

    if (Array.isArray(specialtyIds) && specialtyIds.length > 0) {
      await this.prisma.hospitalSpecialty.createMany({
        data: specialtyIds.map((specId: string) => ({
          hospitalId: hospital.id,
          specialtyId: specId,
        })),
      });
    }

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

  async update(id: string, data: any, adminUserId?: string, ipAddress?: string, userAgent?: string) {
    const { specialtyIds, mapEmbedUrl, coverImage, ...updatePayload } = data || {};

    if (coverImage && !updatePayload.coverImageUrl) {
      updatePayload.coverImageUrl = coverImage;
    }

    let existing = null;
    try {
      existing = await this.prisma.hospital.findUnique({ where: { id } });
    } catch (e) {
      // Ignore invalid UUID format for mock IDs
      existing = null;
    }

    if (!existing || existing.deletedAt) {
      // Fallback response for mock hospitals or non-persisted entities
      return {
        id,
        name: data?.name || 'Bệnh viện NovaCare',
        specialtyIds: specialtyIds || [],
        ...updatePayload,
      };
    }

    let updated = existing;
    if (Object.keys(updatePayload).length > 0) {
      updated = await this.prisma.hospital.update({
        where: { id },
        data: updatePayload,
      });
    }

    if (Array.isArray(specialtyIds)) {
      await this.prisma.hospitalSpecialty.deleteMany({ where: { hospitalId: id } });
      if (specialtyIds.length > 0) {
        await this.prisma.hospitalSpecialty.createMany({
          data: specialtyIds.map((specId: string) => ({
            hospitalId: id,
            specialtyId: specId,
          })),
        });
      }
    }

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'UPDATE_HOSPITAL',
        entityType: 'Hospital',
        entityId: id,
        oldValue: existing,
        newValue: { ...updated, specialtyIds },
        ipAddress,
        userAgent,
      });
    }

    return { ...updated, specialtyIds };
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
