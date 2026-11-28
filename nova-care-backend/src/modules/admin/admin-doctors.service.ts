import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { DataSource, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateDoctorAccountDto } from './dto/create-doctor-account.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';

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

  async create(data: CreateDoctorDto, adminUserId?: string, ipAddress?: string, userAgent?: string) {
    const fullName = data.fullName?.trim();
    if (!fullName) {
      throw new BadRequestException('Vui lòng nhập họ và tên bác sĩ');
    }

    const externalId = data.externalId?.trim() || null;
    if (externalId) {
      const existingByExternalId = await this.prisma.doctor.findUnique({
        where: { externalId },
        select: { id: true },
      });
      if (existingByExternalId) {
        throw new ConflictException(`Mã bác sĩ "${externalId}" đã tồn tại trong hệ thống`);
      }
    }

    if (data.hospitalId && data.specialtyId) {
      const [specialty, branch] = await Promise.all([
        this.prisma.specialty.findUnique({
          where: { id: data.specialtyId },
          select: { id: true },
        }),
        data.branchId
          ? this.prisma.hospitalBranch.findFirst({
              where: { id: data.branchId, hospitalId: data.hospitalId },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);
      if (!specialty) {
        throw new BadRequestException('Chuyên khoa không tồn tại trong hệ thống');
      }
      if (data.branchId && !branch) {
        throw new BadRequestException('Chi nhánh không thuộc cơ sở y tế hiện tại');
      }
    }

    const doctor = await this.prisma.$transaction(async (tx) => {
      const created = await tx.doctor.create({
        data: {
          fullName,
          title: data.title?.trim() || null,
          qualification: data.qualification?.trim() || 'Bác sĩ chuyên khoa',
          yearsOfExperience: data.yearsOfExperience !== undefined ? Number(data.yearsOfExperience) : 0,
          gender: data.gender || null,
          bio: data.bio?.trim() || null,
          avatarUrl: data.avatarUrl?.trim() || null,
          externalId,
          source: data.source || DataSource.MANUAL,
          rating: 0,
          reviewCount: 0,
          consultationCount: 0,
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        },
      });

      if (data.hospitalId && data.specialtyId) {
        await tx.hospitalSpecialty.upsert({
          where: {
            hospitalId_specialtyId: {
              hospitalId: data.hospitalId,
              specialtyId: data.specialtyId,
            },
          },
          update: { isActive: true },
          create: {
            hospitalId: data.hospitalId,
            specialtyId: data.specialtyId,
            isActive: true,
          },
        });

        await tx.doctorWorkplace.create({
          data: {
            doctorId: created.id,
            hospitalId: data.hospitalId,
            branchId: data.branchId || null,
            specialtyId: data.specialtyId,
            consultationFee: data.consultationFee !== undefined ? Number(data.consultationFee) : 300000,
            position: data.position?.trim() || null,
            joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
            isPrimary: data.isPrimary !== undefined ? Boolean(data.isPrimary) : true,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
          },
        });
      }

      return created;
    });

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

  async createAccount(
    doctorId: string,
    data: CreateDoctorAccountDto,
    adminUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.deletedAt) throw new NotFoundException('Bác sĩ không tồn tại');
    if (doctor.userId) throw new ConflictException('Bác sĩ đã có tài khoản đăng nhập');
    const email = data.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, ...(data.phone ? [{ phone: data.phone }] : [])] },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          phone: data.phone,
          passwordHash: await argon2.hash(data.password),
          fullName: doctor.fullName,
          role: Role.DOCTOR,
          isActive: true,
        },
        select: { id: true, email: true, phone: true, fullName: true, role: true, isActive: true },
      });
      await tx.doctor.update({ where: { id: doctorId }, data: { userId: created.id } });
      return created;
    });
    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'CREATE_DOCTOR_ACCOUNT',
        entityType: 'Doctor',
        entityId: doctorId,
        newValue: { doctorUserId: user.id, role: user.role },
        ipAddress,
        userAgent,
      });
    }
    return user;
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
  async createSchedule(workplaceId: string, data: any, scopedHospitalId?: string) {
    const workplace = await this.prisma.doctorWorkplace.findUnique({
      where: { id: workplaceId },
    });
    if (!workplace || !workplace.isActive) {
      throw new NotFoundException('Nơi công tác không tồn tại hoặc đã ngừng hoạt động');
    }
    if (scopedHospitalId && workplace.hospitalId !== scopedHospitalId) {
      throw new ForbiddenException('Bạn không có quyền thêm lịch làm việc cho cơ sở y tế khác');
    }

    const dayOfWeek = Number(data.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('Ngày làm việc trong tuần không hợp lệ (0 - 6)');
    }

    const startTime = String(data.startTime || '').trim();
    const endTime = String(data.endTime || '').trim();
    if (!startTime || !endTime || startTime >= endTime) {
      throw new BadRequestException('Giờ bắt đầu làm việc phải sớm hơn giờ kết thúc');
    }

    const breakStart = data.breakStart ? String(data.breakStart).trim() : null;
    const breakEnd = data.breakEnd ? String(data.breakEnd).trim() : null;
    if (breakStart || breakEnd) {
      if (!breakStart || !breakEnd) {
        throw new BadRequestException('Phải nhập đầy đủ giờ bắt đầu và kết thúc nghỉ giữa ca');
      }
      if (breakStart >= breakEnd) {
        throw new BadRequestException('Giờ bắt đầu nghỉ phải sớm hơn giờ kết thúc nghỉ');
      }
      if (breakStart < startTime || breakEnd > endTime) {
        throw new BadRequestException('Khoảng thời gian nghỉ phải nằm trong khung giờ làm việc');
      }
    }

    const existing = await this.prisma.doctorSchedule.findFirst({
      where: {
        doctorWorkplaceId: workplaceId,
        dayOfWeek,
      },
    });
    if (existing) {
      throw new ConflictException('Nơi làm việc này đã có ca khám vào ngày này.');
    }

    return this.prisma.doctorSchedule.create({
      data: {
        doctorWorkplaceId: workplaceId,
        dayOfWeek,
        startTime,
        endTime,
        breakStart,
        breakEnd,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateSchedule(scheduleId: string, data: any, scopedHospitalId?: string) {
    const existing = await this.prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
      include: { doctorWorkplace: true },
    });
    if (!existing) {
      throw new NotFoundException('Ca làm việc không tồn tại');
    }
    if (scopedHospitalId && existing.doctorWorkplace.hospitalId !== scopedHospitalId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật ca làm việc của cơ sở y tế khác');
    }

    const startTime = data.startTime !== undefined ? String(data.startTime).trim() : existing.startTime;
    const endTime = data.endTime !== undefined ? String(data.endTime).trim() : existing.endTime;
    if (startTime >= endTime) {
      throw new BadRequestException('Giờ bắt đầu làm việc phải sớm hơn giờ kết thúc');
    }

    const breakStart = data.breakStart !== undefined ? (data.breakStart || null) : existing.breakStart;
    const breakEnd = data.breakEnd !== undefined ? (data.breakEnd || null) : existing.breakEnd;
    if (breakStart || breakEnd) {
      if (!breakStart || !breakEnd) {
        throw new BadRequestException('Phải nhập đầy đủ giờ bắt đầu và kết thúc nghỉ giữa ca');
      }
      if (breakStart >= breakEnd) {
        throw new BadRequestException('Giờ bắt đầu nghỉ phải sớm hơn giờ kết thúc nghỉ');
      }
      if (breakStart < startTime || breakEnd > endTime) {
        throw new BadRequestException('Khoảng thời gian nghỉ phải nằm trong khung giờ làm việc');
      }
    }

    return this.prisma.doctorSchedule.update({
      where: { id: scheduleId },
      data,
    });
  }

  async deleteSchedule(scheduleId: string, scopedHospitalId?: string) {
    const existing = await this.prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
      include: { doctorWorkplace: true },
    });
    if (!existing) {
      throw new NotFoundException('Ca làm việc không tồn tại');
    }
    if (scopedHospitalId && existing.doctorWorkplace.hospitalId !== scopedHospitalId) {
      throw new ForbiddenException('Bạn không có quyền xóa ca làm việc của cơ sở y tế khác');
    }

    return this.prisma.doctorSchedule.delete({
      where: { id: scheduleId },
    });
  }
}

