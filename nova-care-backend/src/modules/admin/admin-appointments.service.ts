import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AdminAppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [todayTotal, confirmed, completed, cancelled] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          slot: {
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      }),
      this.prisma.appointment.count({
        where: {
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] },
        },
      }),
      this.prisma.appointment.count({
        where: { status: AppointmentStatus.COMPLETED },
      }),
      this.prisma.appointment.count({
        where: { status: AppointmentStatus.CANCELLED },
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

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    note?: string,
    adminUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.appointment.findUnique({ where: { id }, include: { slot: true, medicalEncounter: true } });
    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');
    if (status === 'NO_SHOW' && (
      !['PENDING', 'CONFIRMED', 'PAID'].includes(existing.status) ||
      existing.slot.startTime > new Date() || existing.medicalEncounter
    )) throw new BadRequestException('Chỉ xác nhận không đến khám khi đã qua giờ hẹn và chưa tiếp nhận.');

    const updated = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id },
        data: {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : existing.completedAt,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          status,
          note: note || `Admin cập nhật trạng thái lịch khám sang ${status}`,
        },
      });

      if (status !== existing.status) await tx.notification.create({ data: {
        userId: existing.userId,
        type: status === 'CANCELLED' ? 'CANCELLED' : 'SYSTEM',
        title: 'Cập nhật lịch khám',
        content: status === 'NO_SHOW'
          ? `Cơ sở đã xác nhận bạn không đến khám lịch ${existing.bookingCode}. Nếu thông tin chưa đúng, vui lòng liên hệ cơ sở. Thanh toán được xử lý riêng theo chính sách của cơ sở.`
          : `Lịch ${existing.bookingCode} đã được cập nhật: ${note || status}.`,
        data: { appointmentId: id },
      } });
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
