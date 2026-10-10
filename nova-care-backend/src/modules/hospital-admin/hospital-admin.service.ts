import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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
      status?: AppointmentStatus | 'OVERDUE';
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
      ...(params?.status === 'OVERDUE' ? {
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] },
        medicalEncounter: { is: null },
        checkInAt: null,
        AND: [{ slot: { startTime: { lt: new Date() } } }],
      } : params?.status ? { status: params.status } : {}),
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
          contactLogs: {
            orderBy: { contactedAt: 'desc' },
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
        checkInAt: a.checkInAt,
        noShowAt: a.noShowAt,
        contactCount: a.contactLogs.length,
        contactLogs: a.contactLogs,
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
   * Kiểm tra điều kiện xác nhận NO_SHOW thuộc phạm vi bệnh viện
   */
  async validateNoShowEligibility(hospitalId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        slot: { doctorWorkplace: { hospitalId } },
      },
      include: {
        slot: true,
        medicalEncounter: true,
        contactLogs: { orderBy: { contactedAt: 'asc' } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại hoặc không thuộc cơ sở y tế của bạn');
    }

    const config = await this.prisma.hospitalBookingConfig.findFirst({
      where: { hospitalId },
    });

    const gracePeriodMinutes = config?.gracePeriodMinutes ?? 15;
    const minContactAttempts = config?.minContactAttempts ?? 2;
    const minContactIntervalMinutes = config?.minContactIntervalMinutes ?? 5;

    const slotStartTime = new Date(appointment.slot.startTime);
    const graceTime = new Date(slotStartTime.getTime() + gracePeriodMinutes * 60 * 1000);
    const now = new Date();

    const reasons: string[] = [];

    if (appointment.status === AppointmentStatus.NO_SHOW) {
      return {
        eligible: false,
        isAlreadyNoShow: true,
        reasons: ['Lịch khám đã được xác nhận không đến khám (NO_SHOW) trước đó.'],
        gracePeriodMinutes,
        graceTime,
        minContactAttempts,
        contactAttempts: appointment.contactLogs.length,
        remainingGraceMinutes: 0,
      };
    }

    if (!([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] as AppointmentStatus[]).includes(appointment.status)) {
      reasons.push(`Không thể xác nhận NO_SHOW từ trạng thái ${appointment.status}`);
    }

    if (appointment.checkInAt) {
      reasons.push(`Bệnh nhân đã làm thủ tục check-in tại quầy lúc ${new Date(appointment.checkInAt).toLocaleTimeString('vi-VN')}`);
    }

    if (appointment.medicalEncounter && appointment.medicalEncounter.status !== 'CANCELLED') {
      reasons.push('Bệnh nhân đã được tiếp nhận và có hồ sơ khám bệnh');
    }

    if (now.getTime() < graceTime.getTime()) {
      const remainingMinutes = Math.ceil((graceTime.getTime() - now.getTime()) / (60 * 1000));
      reasons.push(`Chưa hết thời gian ân hạn (${gracePeriodMinutes} phút sau giờ hẹn). Cần chờ thêm ${remainingMinutes} phút (sau ${graceTime.toLocaleTimeString('vi-VN')})`);
    }

    if (appointment.contactLogs.length < minContactAttempts) {
      reasons.push(`Chưa đủ số lần liên hệ tối thiểu theo chính sách viện (yêu cầu: ${minContactAttempts} lần, hiện có: ${appointment.contactLogs.length} lần)`);
    } else if (appointment.contactLogs.length >= 2) {
      const last = appointment.contactLogs[appointment.contactLogs.length - 1];
      const prev = appointment.contactLogs[appointment.contactLogs.length - 2];
      const diffMinutes = (last.contactedAt.getTime() - prev.contactedAt.getTime()) / (60 * 1000);
      if (diffMinutes < minContactIntervalMinutes) {
        reasons.push(`Khoảng cách giữa 2 lần liên hệ gần nhất chưa đủ ${minContactIntervalMinutes} phút`);
      }
    }

    const remainingGraceMinutes = Math.max(0, Math.ceil((graceTime.getTime() - now.getTime()) / (60 * 1000)));

    return {
      eligible: reasons.length === 0,
      isAlreadyNoShow: false,
      reasons,
      gracePeriodMinutes,
      graceTime,
      minContactAttempts,
      contactAttempts: appointment.contactLogs.length,
      remainingGraceMinutes,
    };
  }

  /**
   * Ghi nhận lịch sử liên hệ bệnh nhân thuộc viện mình
   */
  async recordContactLog(
    hospitalId: string,
    appointmentId: string,
    dto: { channel: string; outcome: string; note?: string },
    staffUserId?: string,
    staffName?: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        slot: { doctorWorkplace: { hospitalId } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại hoặc không thuộc cơ sở y tế của bạn');
    }

    return this.prisma.appointmentContactLog.create({
      data: {
        appointmentId,
        staffId: staffUserId,
        staffName: staffName || 'Nhân viên cơ sở y tế',
        channel: dto.channel || 'PHONE',
        outcome: dto.outcome || 'NO_ANSWER',
        note: dto.note,
        contactedAt: new Date(),
      },
    });
  }

  /**
   * Check-in bệnh nhân tại quầy tiếp đón của viện
   */
  async checkIn(
    hospitalId: string,
    appointmentId: string,
    dto: { note?: string },
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        slot: { doctorWorkplace: { hospitalId } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại hoặc không thuộc cơ sở y tế của bạn');
    }

    if (['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(appointment.status)) {
      throw new BadRequestException(`Không thể tiếp đón lịch khám ở trạng thái ${appointment.status}`);
    }

    if (appointment.checkInAt) {
      return appointment; // Idempotent
    }

    const checkInTime = new Date();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: { checkInAt: checkInTime },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId,
          status: appointment.status,
          note: dto.note || `Tiếp đón bệnh nhân tại viện lúc ${checkInTime.toLocaleTimeString('vi-VN')}`,
        },
      });

      return updated;
    });
  }

  /**
   * Khôi phục lịch khám bị ghi nhận nhầm tại viện
   */
  async revertNoShow(
    hospitalId: string,
    appointmentId: string,
    dto: { reason: string },
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        slot: { doctorWorkplace: { hospitalId } },
      },
      include: { payment: true },
    });

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại hoặc không thuộc cơ sở y tế của bạn');
    }

    if (appointment.status !== AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(`Lịch khám không ở trạng thái NO_SHOW (hiện tại: ${appointment.status}). Không thể khôi phục.`);
    }

    const restoredStatus: AppointmentStatus =
      appointment.payment?.status === 'PAID' ? AppointmentStatus.PAID : AppointmentStatus.CONFIRMED;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: restoredStatus,
          noShowAt: null,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId,
          status: restoredStatus,
          note: `Khôi phục lịch khám: ${dto.reason}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: appointment.userId,
          type: 'SYSTEM',
          title: 'Khôi phục lịch khám',
          content: `Lịch hẹn ${appointment.bookingCode} đã được cơ sở tiếp nhận và khôi phục trạng thái. Lý do: ${dto.reason}`,
          data: { appointmentId },
        },
      });

      return updated;
    });
  }

  /**
   * 6. Cập nhật trạng thái lịch hẹn (Xác nhận / Hoàn thành / Hủy / Không đến khám)
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
      include: { slot: true, medicalEncounter: true },
    });

    if (!appointment) {
      throw new NotFoundException(
        'Lịch hẹn không tồn tại hoặc không thuộc cơ sở y tế của bạn'
      );
    }

    if (newStatus === AppointmentStatus.NO_SHOW) {
      if (appointment.status === AppointmentStatus.NO_SHOW) {
        return appointment; // Idempotent no-op
      }
      const eligibility = await this.validateNoShowEligibility(hospitalId, appointmentId);
      if (!eligibility.eligible) {
        throw new BadRequestException(`Không đủ điều kiện xác nhận NO_SHOW: ${eligibility.reasons.join('. ')}`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: newStatus,
          noShowAt: newStatus === AppointmentStatus.NO_SHOW ? new Date() : appointment.noShowAt,
          ...(newStatus === AppointmentStatus.COMPLETED
            ? { completedAt: new Date() }
            : {}),
          ...(newStatus === AppointmentStatus.CANCELLED
            ? { cancelledAt: new Date() }
            : {}),
        },
      });

      // Lưu vết lịch sử trạng thái
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId,
          status: newStatus,
          note: note || (newStatus === AppointmentStatus.NO_SHOW
            ? 'Xác nhận bệnh nhân không đến khám (đã quá giờ ân hạn và hoàn tất liên hệ)'
            : `Cập nhật bởi Quản trị viên Bệnh viện`),
        },
      });

      if (newStatus !== appointment.status) {
        await tx.notification.create({
          data: {
            userId: appointment.userId,
            type: newStatus === AppointmentStatus.CANCELLED ? 'CANCELLED' : 'SYSTEM',
            title: newStatus === AppointmentStatus.NO_SHOW ? 'Thông báo lịch khám' : 'Cơ sở cập nhật lịch khám',
            content: newStatus === AppointmentStatus.NO_SHOW
              ? `Cơ sở y tế đã ghi nhận bạn không đến khám theo lịch hẹn ${appointment.bookingCode}. Nếu có nhầm lẫn hoặc cần hỗ trợ, vui lòng liên hệ cơ sở y tế.`
              : `Lịch ${appointment.bookingCode} đã được cập nhật: ${note || newStatus}.`,
            data: { appointmentId, status: newStatus },
          },
        });
      }
      return updated;
    });
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
