import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class AdminDoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) { }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    externalId?: string;
    hospitalId?: string;
    specialtyId?: string;
    isActive?: boolean | string;
    gender?: string;
    source?: string;
  }) {
    const page = params.page ? Number(params.page) : 1;
    const limit = params.limit ? Number(params.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { qualification: { contains: params.search, mode: 'insensitive' } },
        { externalId: { contains: params.search, mode: 'insensitive' } },
        { title: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.externalId) {
      where.externalId = { contains: params.externalId, mode: 'insensitive' };
    }

    if (params.gender) {
      where.gender = params.gender;
    }

    if (params.source) {
      where.source = params.source;
    }

    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '') {
      where.isActive = String(params.isActive) === 'true';
    }

    if (params.hospitalId || params.specialtyId) {
      where.workPlaces = {
        some: {
          ...(params.hospitalId ? { hospitalId: params.hospitalId } : {}),
          ...(params.specialtyId ? { specialtyId: params.specialtyId } : {}),
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workPlaces: {
            include: {
              hospital: true,
              branch: true,
              specialty: true,
              schedules: { orderBy: { dayOfWeek: 'asc' } },
            },
          },
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
        workPlaces: {
          include: {
            hospital: true,
            branch: true,
            specialty: true,
            schedules: { orderBy: { dayOfWeek: 'asc' } },
            slots: { take: 10 },
          },
        },
      },
    });
    if (!doctor || doctor.deletedAt) throw new NotFoundException('Bác sĩ không tồn tại');
    return doctor;
  }

  async create(data: any, adminUserId?: string, ipAddress?: string, userAgent?: string) {
    const doctor = await this.prisma.doctor.create({
      data: {
        fullName: data.fullName,
        title: data.title || null,
        qualification: data.qualification || 'Bác sĩ chuyên khoa',
        yearsOfExperience: data.yearsOfExperience !== undefined ? Number(data.yearsOfExperience) : 0,
        gender: data.gender || null,
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || null,
        externalId: data.externalId || null,
        source: data.source || 'MANUAL',
        rating: 0,
        reviewCount: 0,
        consultationCount: 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });

    if (data.hospitalId && data.specialtyId) {
      if (data.isPrimary) {
        await this.prisma.doctorWorkplace.updateMany({
          where: { doctorId: doctor.id },
          data: { isPrimary: false },
        });
      }
      await this.prisma.doctorWorkplace.create({
        data: {
          doctorId: doctor.id,
          hospitalId: data.hospitalId,
          branchId: data.branchId || null,
          specialtyId: data.specialtyId,
          consultationFee: data.consultationFee !== undefined ? Number(data.consultationFee) : 300000,
          position: data.position || null,
          joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
          isPrimary: data.isPrimary !== undefined ? Boolean(data.isPrimary) : true,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        },
      });
    }

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'CREATE_DOCTOR',
        entityType: 'Doctor',
        entityId: doctor.id,
        newValue: doctor,
        ipAddress,
        userAgent,
      });
    }

    return this.findOne(doctor.id);
  }

  async update(id: string, data: any, adminUserId?: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.doctor.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Bác sĩ không tồn tại');

    // Prevent changing stats via normal edit if passed
    const { rating, reviewCount, consultationCount, ...cleanData } = data;

    if (cleanData.yearsOfExperience !== undefined) {
      cleanData.yearsOfExperience = Number(cleanData.yearsOfExperience);
    }

    const updated = await this.prisma.doctor.update({
      where: { id },
      data: cleanData,
    });

    if (adminUserId) {
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
    }

    return this.findOne(id);
  }

  async delete(id: string, adminUserId?: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.doctor.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new NotFoundException('Bác sĩ không tồn tại');

    await this.prisma.doctor.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'DELETE_DOCTOR',
        entityType: 'Doctor',
        entityId: id,
        oldValue: existing,
        ipAddress,
        userAgent,
      });
    }

    return { message: 'Đã xóa bác sĩ thành công' };
  }

  // Doctor Workplace Methods
  async createWorkplace(doctorId: string, data: any) {
    const existing = await this.prisma.doctorWorkplace.findFirst({
      where: {
        doctorId,
        hospitalId: data.hospitalId,
        specialtyId: data.specialtyId,
      },
    });
    if (existing) {
      throw new ConflictException('Bác sĩ này đã được thêm vào bệnh viện.');
    }

    if (data.isPrimary) {
      await this.prisma.doctorWorkplace.updateMany({
        where: { doctorId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.doctorWorkplace.create({
      data: {
        doctorId,
        hospitalId: data.hospitalId,
        branchId: data.branchId || null,
        specialtyId: data.specialtyId,
        consultationFee: data.consultationFee !== undefined ? Number(data.consultationFee) : 300000,
        position: data.position || null,
        joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
        isPrimary: data.isPrimary !== undefined ? Boolean(data.isPrimary) : false,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
      include: { hospital: true, branch: true, specialty: true },
    });
  }

  async updateWorkplace(workplaceId: string, data: any) {
    const existing = await this.prisma.doctorWorkplace.findUnique({ where: { id: workplaceId } });
    if (!existing) throw new NotFoundException('Nơi làm việc không tồn tại');

    if (data.isPrimary) {
      await this.prisma.doctorWorkplace.updateMany({
        where: { doctorId: existing.doctorId, id: { not: workplaceId } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.doctorWorkplace.update({
      where: { id: workplaceId },
      data,
      include: { hospital: true, branch: true, specialty: true },
    });
  }

  async deleteWorkplace(workplaceId: string) {
    const existing = await this.prisma.doctorWorkplace.findUnique({ where: { id: workplaceId } });
    if (!existing) throw new NotFoundException('Nơi làm việc không tồn tại');

    return this.prisma.doctorWorkplace.update({
      where: { id: workplaceId },
      data: { isActive: false },
    });
  }

  // Doctor Schedule Methods
  async createSchedule(workplaceId: string, data: any) {
    const existing = await this.prisma.doctorSchedule.findUnique({
      where: {
        doctorWorkplaceId_dayOfWeek: {
          doctorWorkplaceId: workplaceId,
          dayOfWeek: Number(data.dayOfWeek),
        },
      },
    });
    if (existing) {
      throw new ConflictException('Nơi làm việc này đã có ca khám vào ngày này.');
    }

    return this.prisma.doctorSchedule.create({
      data: {
        doctorWorkplaceId: workplaceId,
        dayOfWeek: Number(data.dayOfWeek),
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart || null,
        breakEnd: data.breakEnd || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateSchedule(scheduleId: string, data: any) {
    return this.prisma.doctorSchedule.update({
      where: { id: scheduleId },
      data,
    });
  }

  async deleteSchedule(scheduleId: string) {
    return this.prisma.doctorSchedule.delete({
      where: { id: scheduleId },
    });
  }
}

