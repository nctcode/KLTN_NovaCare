import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AdminAppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) { }

  async getStats(hospitalId?: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const baseWhere: any = {};
    if (hospitalId) {
      baseWhere.slot = { doctorWorkplace: { hospitalId } };
    }

    const [todayTotal, confirmed, completed, cancelled] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          ...baseWhere,
          slot: {
            ...(baseWhere.slot || {}),
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...baseWhere,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...baseWhere,
          status: AppointmentStatus.COMPLETED,
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...baseWhere,
          status: AppointmentStatus.CANCELLED,
        },
      }),
    ]);

    return { todayTotal, confirmed, completed, cancelled };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AppointmentStatus | 'OVERDUE';
    hospitalId?: string;
    branchId?: string;
    doctorId?: string;
    specialtyId?: string;
    medicalServiceId?: string;
    date?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status === 'OVERDUE') {
      where.status = { in: ['PENDING', 'CONFIRMED', 'PAID'] };
      where.medicalEncounter = { is: null };
      where.checkInAt = null;
      where.AND = [{ slot: { startTime: { lt: new Date() } } }];
    } else if (params.status) {
      where.status = params.status;
    }

    if (params.medicalServiceId) {
      where.medicalServiceId = params.medicalServiceId;
    }

    const workplaceWhere: any = {};
    if (params.hospitalId) workplaceWhere.hospitalId = params.hospitalId;
    if (params.branchId) workplaceWhere.branchId = params.branchId;
    if (params.doctorId) workplaceWhere.doctorId = params.doctorId;
    if (params.specialtyId) workplaceWhere.specialtyId = params.specialtyId;

    if (Object.keys(workplaceWhere).length > 0) {
      where.slot = { doctorWorkplace: workplaceWhere };
    }

    if (params.date) {
      const selectedDate = new Date(params.date);
      const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
      where.slot = {
        ...where.slot,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    }

    if (params.search) {
      where.OR = [
        { bookingCode: { contains: params.search, mode: 'insensitive' } },
        { patientProfile: { fullName: { contains: params.search, mode: 'insensitive' } } },
        { patientProfile: { phone: { contains: params.search, mode: 'insensitive' } } },
        { user: { fullName: { contains: params.search, mode: 'insensitive' } } },
        { slot: { doctorWorkplace: { doctor: { fullName: { contains: params.search, mode: 'insensitive' } } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patientProfile: true,
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          payment: true,
          medicalService: true,
          medicalEncounter: { select: { status: true } },
          contactLogs: { orderBy: { contactedAt: 'desc' } },
          slot: {
            include: {
              doctorWorkplace: {
                include: { doctor: true, hospital: true, branch: true, specialty: true },
              },
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        payment: true,
        medicalService: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        contactLogs: { orderBy: { contactedAt: 'desc' } },
        slot: {
          include: {
            doctorWorkplace: {
              include: { doctor: true, hospital: true, branch: true, specialty: true },
            },
          },
        },
      },
    });

    if (!appointment) throw new NotFoundException('Lịch khám không tồn tại');
    return appointment;
  }

  /**
   * Kiểm tra điều kiện xác nhận NO_SHOW theo chính sách cơ sở y tế
   */
  async validateNoShowEligibility(id: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        slot: { include: { doctorWorkplace: true } },
        medicalEncounter: true,
        contactLogs: { orderBy: { contactedAt: 'asc' } },
      },
    });

    if (!appt) throw new NotFoundException('Lịch khám không tồn tại');

    const hospitalId = appt.slot?.doctorWorkplace?.hospitalId;
    const config = hospitalId
      ? await this.prisma.hospitalBookingConfig.findFirst({ where: { hospitalId } })
      : null;

    const gracePeriodMinutes = config?.gracePeriodMinutes ?? 15;
    const minContactAttempts = config?.minContactAttempts ?? 2;
    const minContactIntervalMinutes = config?.minContactIntervalMinutes ?? 5;

    const slotStartTime = new Date(appt.slot.startTime);
    const graceTime = new Date(slotStartTime.getTime() + gracePeriodMinutes * 60 * 1000);
    const now = new Date();

    const reasons: string[] = [];

    if (appt.status === AppointmentStatus.NO_SHOW) {
      return {
        eligible: false,
        isAlreadyNoShow: true,
        reasons: ['Lịch khám đã được xác nhận không đến khám (NO_SHOW) trước đó.'],
        gracePeriodMinutes,
        graceTime,
        minContactAttempts,
        contactAttempts: appt.contactLogs.length,
        remainingGraceMinutes: 0,
      };
    }

    if (!([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] as AppointmentStatus[]).includes(appt.status)) {
      reasons.push(`Không thể xác nhận NO_SHOW từ trạng thái ${appt.status}`);
    }

    if (appt.checkInAt) {
      reasons.push(`Bệnh nhân đã làm thủ tục check-in tại quầy lúc ${new Date(appt.checkInAt).toLocaleTimeString('vi-VN')}`);
    }

    if (appt.medicalEncounter && appt.medicalEncounter.status !== 'CANCELLED') {
      reasons.push('Bệnh nhân đã được tiếp nhận và có hồ sơ khám bệnh');
    }

    if (now.getTime() < graceTime.getTime()) {
      const remainingMinutes = Math.ceil((graceTime.getTime() - now.getTime()) / (60 * 1000));
      reasons.push(`Chưa hết thời gian ân hạn (${gracePeriodMinutes} phút sau giờ hẹn). Cần chờ thêm ${remainingMinutes} phút (sau ${graceTime.toLocaleTimeString('vi-VN')})`);
    }

    if (appt.contactLogs.length < minContactAttempts) {
      reasons.push(`Chưa đủ số lần liên hệ tối thiểu theo chính sách (yêu cầu: ${minContactAttempts} lần, hiện có: ${appt.contactLogs.length} lần)`);
    } else if (appt.contactLogs.length >= 2) {
      const last = appt.contactLogs[appt.contactLogs.length - 1];
      const prev = appt.contactLogs[appt.contactLogs.length - 2];
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
      contactAttempts: appt.contactLogs.length,
      remainingGraceMinutes,
    };
  }

  /**
   * Ghi nhận lịch sử liên hệ bệnh nhân
   */
  async recordContactLog(
    id: string,
    dto: { channel: string; outcome: string; note?: string },
    adminUserId?: string,
    staffName?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');

    const contactLog = await this.prisma.appointmentContactLog.create({
      data: {
        appointmentId: id,
        staffId: adminUserId,
        staffName: staffName || 'Nhân viên quản trị/tiếp đón',
        channel: dto.channel || 'PHONE',
        outcome: dto.outcome || 'NO_ANSWER',
        note: dto.note,
        contactedAt: new Date(),
      },
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'RECORD_PATIENT_CONTACT',
        entityType: 'Appointment',
        entityId: id,
        oldValue: null,
        newValue: { channel: contactLog.channel, outcome: contactLog.outcome, note: contactLog.note },
        ipAddress,
        userAgent,
      });
    }

    return contactLog;
  }

  /**
   * Check-in / Tiếp nhận bệnh nhân tại quầy
   */
  async checkIn(
    id: string,
    dto: { note?: string },
    adminUserId?: string,
    staffName?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');

    if (['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(existing.status)) {
      throw new BadRequestException(`Không thể tiếp đón lịch khám ở trạng thái ${existing.status}. Vui lòng khôi phục lịch trước.`);
    }

    if (existing.checkInAt) {
      return existing; // Idempotent
    }

    const checkInTime = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: { checkInAt: checkInTime },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          status: existing.status,
          note: dto.note || `Tiếp đón bệnh nhân có mặt tại cơ sở lúc ${checkInTime.toLocaleTimeString('vi-VN')}`,
        },
      });

      return appt;
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'CHECK_IN_APPOINTMENT',
        entityType: 'Appointment',
        entityId: id,
        oldValue: { checkInAt: null },
        newValue: { checkInAt: checkInTime, note: dto.note },
        ipAddress,
        userAgent,
      });
    }

    return updated;
  }

  /**
   * Khôi phục lịch khám bị ghi nhận nhầm hoặc bệnh nhân đến muộn
   */
  async revertNoShow(
    id: string,
    dto: { reason: string },
    adminUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');
    if (existing.status !== AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(`Lịch khám không ở trạng thái NO_SHOW (hiện tại: ${existing.status}). Không thể khôi phục.`);
    }

    const restoredStatus: AppointmentStatus =
      existing.payment?.status === 'PAID' ? AppointmentStatus.PAID : AppointmentStatus.CONFIRMED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: {
          status: restoredStatus,
          noShowAt: null,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          status: restoredStatus,
          note: `Khôi phục lịch khám: ${dto.reason}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: existing.userId,
          type: 'SYSTEM',
          title: 'Khôi phục lịch khám',
          content: `Lịch hẹn ${existing.bookingCode} đã được cơ sở tiếp nhận và khôi phục trạng thái. Lý do: ${dto.reason}`,
          data: { appointmentId: id },
        },
      });

      return appt;
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'REVERT_NO_SHOW_APPOINTMENT',
        entityType: 'Appointment',
        entityId: id,
        oldValue: { status: AppointmentStatus.NO_SHOW },
        newValue: { status: updated.status, reason: dto.reason },
        ipAddress,
        userAgent,
      });
    }

    return updated;
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    note?: string,
    adminUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        slot: { include: { doctorWorkplace: true } },
        medicalEncounter: true,
      },
    });
    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');

    if (status === AppointmentStatus.NO_SHOW) {
      if (existing.status === AppointmentStatus.NO_SHOW) {
        return existing; // Idempotent no-op
      }
      const eligibility = await this.validateNoShowEligibility(id);
      if (!eligibility.eligible) {
        throw new BadRequestException(`Không đủ điều kiện xác nhận NO_SHOW: ${eligibility.reasons.join('. ')}`);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: {
          status,
          noShowAt: status === AppointmentStatus.NO_SHOW ? new Date() : existing.noShowAt,
          completedAt: status === AppointmentStatus.COMPLETED ? new Date() : existing.completedAt,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          status,
          note: note || (status === AppointmentStatus.NO_SHOW
            ? 'Xác nhận bệnh nhân không đến khám (đã quá giờ ân hạn và hoàn tất liên hệ)'
            : `Admin cập nhật trạng thái lịch khám sang ${status}`),
        },
      });

      if (status !== existing.status) {
        await tx.notification.create({
          data: {
            userId: existing.userId,
            type: status === AppointmentStatus.CANCELLED ? 'CANCELLED' : 'SYSTEM',
            title: status === AppointmentStatus.NO_SHOW ? 'Thông báo lịch khám' : 'Cập nhật lịch khám',
            content: status === AppointmentStatus.NO_SHOW
              ? `Cơ sở y tế đã ghi nhận bạn không đến khám theo lịch hẹn ${existing.bookingCode}. Nếu có nhầm lẫn hoặc cần hỗ trợ, vui lòng liên hệ cơ sở y tế.`
              : `Lịch ${existing.bookingCode} đã được cập nhật: ${note || status}.`,
            data: { appointmentId: id, status },
          },
        });
      }
      return appt;
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'UPDATE_APPOINTMENT_STATUS',
        entityType: 'Appointment',
        entityId: id,
        oldValue: { status: existing.status },
        newValue: { status: updated.status, note },
        ipAddress,
        userAgent,
      });
    }

    return updated;
  }

  async cancelAppointment(
    id: string,
    reason: string,
    adminUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');
    if (existing.status === 'CANCELLED') {
      throw new BadRequestException('Lịch khám đã bị hủy trước đó');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Free up slot count
      if (existing.slotId) {
        await tx.appointmentSlot.update({
          where: { id: existing.slotId },
          data: {
            bookedCount: { decrement: 1 },
            isAvailable: true,
          },
        });
      }

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          status: 'CANCELLED',
          note: `Admin hủy lịch khám: ${reason || 'Không có lý do'}`,
        },
      });

      // Xóa bệnh án mồ côi nếu có
      const orphanedEncounter = await tx.medicalEncounter.findUnique({
        where: { appointmentId: id },
        include: { prescription: true },
      });
      if (orphanedEncounter) {
        await tx.diagnosis.deleteMany({ where: { encounterId: orphanedEncounter.id } });
        await tx.observation.deleteMany({ where: { encounterId: orphanedEncounter.id } });
        if (orphanedEncounter.prescription) {
          await tx.prescriptionItem.deleteMany({ where: { prescriptionId: orphanedEncounter.prescription.id } });
          await tx.prescription.delete({ where: { id: orphanedEncounter.prescription.id } });
        }
        await tx.medicalEncounter.delete({ where: { id: orphanedEncounter.id } });
      }

      return appt;
    });

    await this.auditLogService.logAction({
      userId: adminUserId,
      action: 'CANCEL_APPOINTMENT_ADMIN',
      entityType: 'Appointment',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: 'CANCELLED', reason },
      ipAddress,
      userAgent,
    });

    return updated;
  }
}
