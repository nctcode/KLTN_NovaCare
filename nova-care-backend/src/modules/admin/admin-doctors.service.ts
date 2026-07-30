import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class AdminDoctorsService {
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
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { qualification: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workPlaces: { include: { hospital: true, specialty: true } },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        workPlaces: { include: { hospital: true, specialty: true, slots: { take: 10 } } },
        schedules: true,
      },
    });
    if (!doctor || doctor.deletedAt) throw new NotFoundException('Bác sĩ không tồn tại');
    return doctor;
  }

  async create(data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const doctor = await this.prisma.doctor.create({
      data: {
        fullName: data.fullName,
        qualification: data.qualification || 'Bác sĩ chuyên khoa',
        experience: data.experience || '5 năm kinh nghiệm',
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        rating: 5.0,
        reviewCount: 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'CREATE_DOCTOR',
      entityType: 'Doctor',
      entityId: doctor.id,
      newValue: doctor,
      ipAddress,
      userAgent,
    });

    return doctor;
  }

  async update(id: string, data: any, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.doctor.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Bác sĩ không tồn tại');

    const updated = await this.prisma.doctor.update({
      where: { id },
      data,
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'UPDATE_DOCTOR',
      entityType: 'Doctor',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  async delete(id: string, adminUserId: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.doctor.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Bác sĩ không tồn tại');

    await this.prisma.doctor.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'DELETE_DOCTOR',
      entityType: 'Doctor',
      entityId: id,
      oldValue: existing,
      ipAddress,
      userAgent,
    });

    return { message: 'Đã xóa bác sĩ thành công' };
  }
}
