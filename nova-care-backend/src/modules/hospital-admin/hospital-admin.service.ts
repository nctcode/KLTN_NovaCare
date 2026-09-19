import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { UpdateMyHospitalDto } from './dto/update-my-hospital.dto';

@Injectable()
export class HospitalAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Lấy thông tin chi tiết bệnh viện của mình
   */
  async getMyHospital(hospitalId: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        _count: {
          select: {
            workPlaces: { where: { isActive: true } },
            services: { where: { isActive: true } },
            packages: { where: { isActive: true } },
          },
        },
      },
    });

    if (!hospital) {
      throw new NotFoundException('Không tìm thấy cơ sở y tế');
    }

    return hospital;
  }

  /**
   * 2. Cập nhật thông tin bệnh viện của mình
   */
  async updateMyHospital(hospitalId: string, dto: UpdateMyHospitalDto) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new NotFoundException('Không tìm thấy cơ sở y tế');
    }

    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        hotline: dto.hotline ?? hospital.hotline,
        phone: dto.phone ?? hospital.phone,
        emergencyHotline: dto.emergencyHotline ?? hospital.emergencyHotline,
        address: dto.address ?? hospital.address,
        operatingHours: dto.operatingHours ?? hospital.operatingHours,
        description: dto.description ?? hospital.description,
        website: dto.website ?? hospital.website,
        email: dto.email ?? hospital.email,
      },
    });
  }

  /**
   * 3. Lấy danh sách bác sĩ thuộc bệnh viện của mình (DATA ISOLATION)
   */
  async getMyDoctors(
    hospitalId: string,
    params?: {
      search?: string;
      specialtyId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DoctorWorkplaceWhereInput = {
      hospitalId,
      ...(params?.specialtyId ? { specialtyId: params.specialtyId } : {}),
      ...(params?.search
        ? {
            doctor: {
              OR: [
                { fullName: { contains: params.search, mode: 'insensitive' } },
                { externalId: { contains: params.search, mode: 'insensitive' } },
                { qualification: { contains: params.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.doctorWorkplace.count({ where }),
      this.prisma.doctorWorkplace.findMany({
        where,
        skip,
        take: limit,
        include: {
          doctor: true,
          specialty: true,
          schedules: {
            where: { isActive: true },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: items.map((wp) => ({
        workplaceId: wp.id,
        doctorId: wp.doctorId,
        externalId: wp.doctor.externalId,
        source: wp.doctor.source,
        fullName: wp.doctor.fullName,
        title: wp.doctor.title,
        qualification: wp.doctor.qualification,
        avatarUrl: wp.doctor.avatarUrl,
        gender: wp.doctor.gender,
        yearsOfExperience: wp.doctor.yearsOfExperience,
        specialty: wp.specialty.name,
        specialtyId: wp.specialtyId,
        consultationFee: Number(wp.consultationFee),
        isActive: wp.isActive,
        schedules: wp.schedules,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 4. Chỉnh sửa giá khám hoặc bật/tắt bác sĩ tại viện mình
   */
  async updateDoctorWorkplace(
    hospitalId: string,
    workplaceId: string,
    data: { consultationFee?: number; isActive?: boolean }
  ) {
    const workplace = await this.prisma.doctorWorkplace.findFirst({
      where: { id: workplaceId, hospitalId },
    });

    if (!workplace) {
      throw new NotFoundException(
        'Không tìm thấy bác sĩ tại cơ sở y tế của bạn'
      );
    }

    return this.prisma.doctorWorkplace.update({
      where: { id: workplaceId },
      data: {
        ...(data.consultationFee !== undefined
          ? { consultationFee: data.consultationFee }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: { doctor: true, specialty: true },
    });
  }

  /**
   * 5. Lấy danh sách lịch hẹn tại bệnh viện của mình (DATA ISOLATION)
   */
  async getMyAppointments(
    hospitalId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: AppointmentStatus;
      search?: string;
    }
  ) {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      slot: {
        doctorWorkplace: {
          hospitalId,
        },
      },
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.search
        ? {
            OR: [
              { bookingCode: { contains: params.search, mode: 'insensitive' } },
              {
                patientProfile: {
                  fullName: { contains: params.search, mode: 'insensitive' },
                },
              },
              {
                slot: {
                  doctorWorkplace: {
                    doctor: {
                      fullName: { contains: params.search, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          patientProfile: {
            select: {
              fullName: true,
              phone: true,
              gender: true,
              dateOfBirth: true,
            },
          },
          slot: {
            include: {
              doctorWorkplace: {
                include: {
                  doctor: { select: { fullName: true, title: true } },
                  specialty: { select: { name: true } },
                },
              },
            },
          },
          payment: { select: { status: true, amount: true, paymentMethod: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: items.map((a) => ({
        id: a.id,
        bookingCode: a.bookingCode,
        patientName: a.patientProfile.fullName,
        patientPhone: a.patientProfile.phone,
        doctorName: `${a.slot.doctorWorkplace.doctor.title || ''} ${a.slot.doctorWorkplace.doctor.fullName}`.trim(),
        specialty: a.slot.doctorWorkplace.specialty.name,
        startTime: a.slot.startTime,
        endTime: a.slot.endTime,
        status: a.status,
        totalPrice: Number(a.totalPrice),
        paymentStatus: a.payment?.status || 'PENDING',
        createdAt: a.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 6. Cập nhật trạng thái lịch hẹn (Xác nhận / Hoàn thành / Hủy)
   */
  async updateAppointmentStatus(
    hospitalId: string,
    appointmentId: string,
    newStatus: AppointmentStatus,
    note?: string
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        slot: { doctorWorkplace: { hospitalId } },
      },
    });

    if (!appointment) {
      throw new NotFoundException(
        'Lịch hẹn không tồn tại hoặc không thuộc cơ sở y tế của bạn'
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: newStatus,
        ...(newStatus === AppointmentStatus.COMPLETED
          ? { completedAt: new Date() }
          : {}),
        ...(newStatus === AppointmentStatus.CANCELLED
          ? { cancelledAt: new Date() }
          : {}),
      },
    });

    // Lưu vết lịch sử trạng thái
    await this.prisma.appointmentStatusHistory.create({
      data: {
        appointmentId,
        status: newStatus,
        note: note || `Cập nhật bởi Quản trị viên Bệnh viện`,
      },
    });

    return updated;
  }

  /**
   * 7. Thống kê tổng quan cho Dashboard của viện
   */
  async getDashboardOverview(hospitalId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalDoctors,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
    ] = await Promise.all([
      this.prisma.doctorWorkplace.count({
        where: { hospitalId, isActive: true },
      }),
      this.prisma.appointment.count({
        where: {
          slot: {
            doctorWorkplace: { hospitalId },
            startTime: { gte: today, lt: tomorrow },
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          slot: { doctorWorkplace: { hospitalId } },
          status: AppointmentStatus.COMPLETED,
        },
      }),
      this.prisma.appointment.count({
        where: {
          slot: { doctorWorkplace: { hospitalId } },
          status: AppointmentStatus.PENDING,
        },
      }),
    ]);

    return {
      totalDoctors,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
    };
  }

  /**
   * 8. Lấy danh mục chuyên khoa và số lượng bác sĩ của viện mình
   */
  async getMySpecialties(hospitalId: string) {
    const workplaces = await this.prisma.doctorWorkplace.findMany({
      where: { hospitalId, isActive: true },
      include: {
        specialty: true,
        doctor: {
          select: { id: true, fullName: true, title: true, avatarUrl: true },
        },
      },
    });

    // Group by specialty
    const specialtyMap = new Map<string, any>();
    for (const wp of workplaces) {
      if (!specialtyMap.has(wp.specialtyId)) {
        specialtyMap.set(wp.specialtyId, {
          id: wp.specialty.id,
          name: wp.specialty.name,
          description: wp.specialty.description,
          icon: wp.specialty.icon,
          doctorCount: 0,
          doctors: [],
        });
      }
      const item = specialtyMap.get(wp.specialtyId);
      item.doctorCount += 1;
      item.doctors.push(wp.doctor);
    }

    return Array.from(specialtyMap.values());
  }

  /**
   * 9. Lấy danh sách lịch trực / làm việc của bác sĩ trong viện
   */
  async getMySchedules(hospitalId: string) {
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorWorkplace: {
          hospitalId,
          isActive: true,
        },
      },
      include: {
        doctorWorkplace: {
          include: {
            doctor: { select: { id: true, fullName: true, title: true } },
            specialty: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      breakStart: s.breakStart,
      breakEnd: s.breakEnd,
      isActive: s.isActive,
      doctor: s.doctorWorkplace.doctor,
      specialty: s.doctorWorkplace.specialty,
      consultationFee: s.doctorWorkplace.consultationFee,
    }));
  }
}
