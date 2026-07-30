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

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: AppointmentStatus;
    hospitalId?: string;
    doctorId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.hospitalId) {
      where.slot = { doctorWorkplace: { hospitalId: params.hospitalId } };
    }

    if (params.doctorId) {
      where.slot = { doctorWorkplace: { doctorId: params.doctorId } };
    }

    if (params.search) {
      where.OR = [
        { bookingCode: { contains: params.search, mode: 'insensitive' } },
        { patientProfile: { fullName: { contains: params.search, mode: 'insensitive' } } },
        { patientProfile: { phone: { contains: params.search, mode: 'insensitive' } } },
        { user: { fullName: { contains: params.search, mode: 'insensitive' } } },
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
          slot: {
            include: {
              doctorWorkplace: {
                include: { doctor: true, hospital: true },
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
        statusHistory: { orderBy: { createdAt: 'desc' } },
        slot: {
          include: {
            doctorWorkplace: {
              include: { doctor: true, hospital: true },
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
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lịch khám không tồn tại');

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
