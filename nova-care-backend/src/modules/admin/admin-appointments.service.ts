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
        preExamSession: {
          select: { id: true, status: true, riskLevel: true, completedAt: true },
        },
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

    const hasCheckedIn = Boolean(appt.checkInAt);
    const hasEncounter = Boolean(appt.medicalEncounter && appt.medicalEncounter.status !== 'CANCELLED');
    const isOverdue = now.getTime() >= graceTime.getTime();
    const contactCount = appt.contactLogs.length;
    const lastContact = contactCount > 0 ? appt.contactLogs[contactCount - 1] : null;

    let intervalPassed = false;
    if (minContactAttempts <= 1) {
      intervalPassed = contactCount >= minContactAttempts;
    } else if (contactCount >= 2) {
      const prev = appt.contactLogs[contactCount - 2];
      const diffMinutes = (lastContact!.contactedAt.getTime() - prev.contactedAt.getTime()) / (60 * 1000);
      intervalPassed = diffMinutes >= minContactIntervalMinutes;
    }

    const details = {
      isOverdue,
      gracePeriodMinutes,
      gracePeriodEndsAt: graceTime.toISOString(),
      hasCheckedIn,
      hasEncounter,
      contactCount,
      minContactAttempts,
      intervalPassed,
      minIntervalMinutes: minContactIntervalMinutes,
      lastContactAt: lastContact ? lastContact.contactedAt.toISOString() : null,
    };

    const reasons: string[] = [];

    if (appt.status === AppointmentStatus.NO_SHOW) {
      return {
        eligible: false,
        isAlreadyNoShow: true,
        reasons: ['Lịch khám đã được xác nhận không đến khám (NO_SHOW) trước đó.'],
        gracePeriodMinutes,
        graceTime,
        minContactAttempts,
        contactAttempts: contactCount,
        remainingGraceMinutes: 0,
        details,
      };
    }

    if (!([AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] as AppointmentStatus[]).includes(appt.status)) {
      reasons.push(`Không thể xác nhận NO_SHOW từ trạng thái ${appt.status}`);
    }

    if (hasCheckedIn) {
      reasons.push(`Bệnh nhân đã làm thủ tục check-in tại quầy lúc ${new Date(appt.checkInAt!).toLocaleTimeString('vi-VN')}`);
    }

    if (hasEncounter) {
      reasons.push('Bệnh nhân đã được tiếp nhận và có hồ sơ khám bệnh');
    }

    if (!isOverdue) {
      const remainingMinutes = Math.ceil((graceTime.getTime() - now.getTime()) / (60 * 1000));
      reasons.push(`Chưa hết thời gian ân hạn (${gracePeriodMinutes} phút sau giờ hẹn). Cần chờ thêm ${remainingMinutes} phút (sau ${graceTime.toLocaleTimeString('vi-VN')})`);
    }

    if (contactCount < minContactAttempts) {
      reasons.push(`Chưa đủ số lần liên hệ tối thiểu theo chính sách (yêu cầu: ${minContactAttempts} lần, hiện có: ${contactCount} lần)`);
    } else if (contactCount >= 2 && !intervalPassed) {
      reasons.push(`Khoảng cách giữa 2 lần liên hệ gần nhất chưa đủ ${minContactIntervalMinutes} phút`);
    }

    const remainingGraceMinutes = Math.max(0, Math.ceil((graceTime.getTime() - now.getTime()) / (60 * 1000)));

    return {
      eligible: reasons.length === 0,
      isAlreadyNoShow: false,
      reasons,
      gracePeriodMinutes,
      graceTime,
      minContactAttempts,
      contactAttempts: contactCount,
      remainingGraceMinutes,
      details,
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
    const trimmedReason = dto?.reason?.trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      throw new BadRequestException('Vui lòng nhập lý do khôi phục rõ ràng (tối thiểu 5 ký tự)');
    }

    const existing = await this.prisma.appointment.findUnique({
      where: { id },
      include: { payment: true, slot: true },
    });

    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');
    if (existing.status !== AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(`Lịch khám không ở trạng thái NO_SHOW (hiện tại: ${existing.status}). Không thể khôi phục.`);
    }

    const restoredStatus: AppointmentStatus = AppointmentStatus.CONFIRMED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: {
          status: restoredStatus,
          noShowAt: null,
        },
      });

      if (existing.slotId && tx.appointmentSlot) {
        const updatedSlot = await tx.appointmentSlot.update({
          where: { id: existing.slotId },
          data: { bookedCount: { increment: 1 } },
        });
        if (updatedSlot && updatedSlot.bookedCount >= updatedSlot.capacity && updatedSlot.isAvailable) {
          await tx.appointmentSlot.update({
            where: { id: existing.slotId },
            data: { isAvailable: false },
          });
        }
      }

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          status: restoredStatus,
          note: `Khôi phục lịch khám: ${trimmedReason}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: existing.userId,
          type: 'SYSTEM',
          title: 'Khôi phục lịch khám',
          content: `Lịch hẹn ${existing.bookingCode} đã được cơ sở tiếp nhận và khôi phục trạng thái. Lý do: ${trimmedReason}`,
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
        newValue: { status: updated.status, reason: trimmedReason },
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
        payment: true,
      },
    });
    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');

    // Idempotent no-op when target status equals current status
    if (status === existing.status) {
      return existing;
    }

    // Enforce valid state machine transitions
    const allowedTransitions: Record<string, AppointmentStatus[]> = {
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.PENDING],
      [AppointmentStatus.COMPLETED]: [AppointmentStatus.CONFIRMED, AppointmentStatus.PAID],
      [AppointmentStatus.CANCELLED]: [
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.PAID,
      ],
      [AppointmentStatus.NO_SHOW]: [AppointmentStatus.CONFIRMED, AppointmentStatus.PAID],
    };

    if (!allowedTransitions[status]?.includes(existing.status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái lịch hẹn từ ${existing.status} sang ${status}`,
      );
    }

    const trimmedNote = note?.trim();

    if (status === AppointmentStatus.CANCELLED) {
      if (!trimmedNote) {
        throw new BadRequestException('Vui lòng nhập lý do hủy lịch hẹn');
      }
      if (existing.medicalEncounter && existing.medicalEncounter.status !== 'CANCELLED') {
        throw new BadRequestException(
          'Không thể hủy lịch đã phát sinh hồ sơ khám; cần xử lý hồ sơ theo quy trình riêng',
        );
      }
    }

    if (status === AppointmentStatus.NO_SHOW) {
      const eligibility = await this.validateNoShowEligibility(id);
      if (!eligibility.eligible) {
        throw new BadRequestException(`Không đủ điều kiện xác nhận NO_SHOW: ${eligibility.reasons.join('. ')}`);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const appt = await tx.appointment.update({
        where: { id },
        data: {
          status,
          noShowAt: status === AppointmentStatus.NO_SHOW ? now : existing.noShowAt,
          completedAt: status === AppointmentStatus.COMPLETED ? now : existing.completedAt,
          cancelledAt: status === AppointmentStatus.CANCELLED ? now : existing.cancelledAt,
        },
      });

      // Release slot capacity when appointment is cancelled or marked NO_SHOW
      if (
        (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.NO_SHOW) &&
        existing.slotId &&
        tx.appointmentSlot
      ) {
        await tx.appointmentSlot.updateMany({
          where: { id: existing.slotId, bookedCount: { gt: 0 } },
          data: { bookedCount: { decrement: 1 } },
        });
        const refreshedSlot = await tx.appointmentSlot.findUnique({
          where: { id: existing.slotId },
        });
        if (refreshedSlot && refreshedSlot.bookedCount < refreshedSlot.capacity && !refreshedSlot.isAvailable) {
          await tx.appointmentSlot.update({
            where: { id: existing.slotId },
            data: { isAvailable: true },
          });
        }
      }

      const historyNote =
        status === AppointmentStatus.CANCELLED
          ? `Hủy lịch hẹn: ${trimmedNote}`
          : status === AppointmentStatus.NO_SHOW
            ? trimmedNote || 'Xác nhận bệnh nhân không đến khám (đã quá giờ ân hạn và hoàn tất liên hệ)'
            : status === AppointmentStatus.CONFIRMED
              ? trimmedNote || 'Cơ sở y tế đã xác nhận lịch hẹn'
              : status === AppointmentStatus.COMPLETED
                ? trimmedNote || 'Đã hoàn thành khám bệnh'
                : trimmedNote || `Admin cập nhật trạng thái lịch khám sang ${status}`;

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          status,
          note: historyNote,
        },
      });

      if (status === AppointmentStatus.COMPLETED) {
        if (existing.payment?.status !== 'PAID') {
          await tx.paymentTransaction.upsert({
            where: { appointmentId: id },
            update: {
              status: 'PAID',
              paidAt: now,
            },
            create: {
              appointmentId: id,
              amount: existing.totalPrice,
              paymentMethod: 'CASH',
              transactionCode: `CASH-${existing.bookingCode}`,
              status: 'PAID',
              paidAt: now,
            },
          });
        }
      }

      const notificationTitle =
        status === AppointmentStatus.CANCELLED
          ? 'Lịch khám đã bị hủy'
          : status === AppointmentStatus.CONFIRMED
            ? 'Lịch khám đã được xác nhận'
            : status === AppointmentStatus.COMPLETED
              ? 'Hoàn thành buổi khám'
              : status === AppointmentStatus.NO_SHOW
                ? 'Thông báo lịch khám'
                : 'Cập nhật lịch khám';

      const notificationContent =
        status === AppointmentStatus.NO_SHOW
          ? `Cơ sở y tế đã ghi nhận bạn không đến khám theo lịch hẹn ${existing.bookingCode}. Nếu có nhầm lẫn hoặc cần hỗ trợ, vui lòng liên hệ cơ sở y tế.`
          : status === AppointmentStatus.CANCELLED
            ? `Lịch hẹn ${existing.bookingCode} đã bị hủy bởi cơ sở y tế. Lý do: ${trimmedNote}.`
            : status === AppointmentStatus.CONFIRMED
              ? `Lịch hẹn ${existing.bookingCode} của bạn đã được cơ sở y tế xác nhận.`
              : status === AppointmentStatus.COMPLETED
                ? `Lịch hẹn ${existing.bookingCode} đã hoàn thành khám. Cảm ơn bạn đã sử dụng dịch vụ của NovaCare.`
                : `Lịch ${existing.bookingCode} đã được cập nhật: ${trimmedNote || status}.`;

      await tx.notification.create({
        data: {
          userId: existing.userId,
          type:
            status === AppointmentStatus.CANCELLED
              ? 'CANCELLED'
              : status === AppointmentStatus.CONFIRMED
                ? 'BOOKING_CONFIRMED'
                : 'SYSTEM',
          title: notificationTitle,
          content: notificationContent,
          data: { appointmentId: id, status },
        },
      });

      return appt;
    });

    if (adminUserId) {
      await this.auditLogService.logAction({
        userId: adminUserId,
        action: 'UPDATE_APPOINTMENT_STATUS',
        entityType: 'Appointment',
        entityId: id,
        oldValue: { status: existing.status },
        newValue: { status: updated.status, note: trimmedNote },
        ipAddress,
        userAgent,
      });
    }

    return updated;
  }

}
