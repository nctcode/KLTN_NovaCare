import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Role } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

const APPOINTMENT_STATUSES = new Set(Object.values(AppointmentStatus));

@Injectable()
export class DoctorPortalService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDoctorOrThrow(userId: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { userId, isActive: true, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, phone: true, fullName: true, role: true } },
        workPlaces: {
          where: { isActive: true },
          include: { hospital: true, branch: true, specialty: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!doctor) {
      throw new ForbiddenException('Tài khoản bác sĩ chưa được liên kết với hồ sơ chuyên môn đang hoạt động');
    }
    return doctor;
  }

  private parseDateRange(startDate?: string, endDate?: string, defaultDays = 7) {
    const todayInVietnam = new Date(Date.now() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const fromText = startDate || todayInVietnam;
    const defaultEnd = new Date(`${fromText}T00:00:00+07:00`);
    defaultEnd.setUTCDate(defaultEnd.getUTCDate() + defaultDays - 1);
    const toText = endDate || new Date(defaultEnd.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromText) || !/^\d{4}-\d{2}-\d{2}$/.test(toText)) {
      throw new BadRequestException('Ngày phải có định dạng YYYY-MM-DD');
    }
    const from = new Date(`${fromText}T00:00:00+07:00`);
    const to = new Date(`${toText}T23:59:59.999+07:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      throw new BadRequestException('Khoảng ngày không hợp lệ');
    }
    if (to.getTime() - from.getTime() > 93 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Khoảng thời gian tối đa là 93 ngày');
    }
    return { from, to, startDate: fromText, endDate: toText };
  }

  async getProfile(userId: string) {
    return this.getDoctorOrThrow(userId);
  }

  async updateProfile(userId: string, dto: UpdateDoctorProfileDto) {
    const doctor = await this.getDoctorOrThrow(userId);
    return this.prisma.$transaction(async (tx) => {
      if (dto.fullName && dto.fullName.trim() !== doctor.fullName) {
        await tx.user.update({ where: { id: userId }, data: { fullName: dto.fullName.trim() } });
      }
      return tx.doctor.update({
        where: { id: doctor.id },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
          ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl.trim() || null } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio.trim() || null } : {}),
        },
        include: {
          user: { select: { id: true, email: true, phone: true, fullName: true, role: true } },
          workPlaces: {
            where: { isActive: true },
            include: { hospital: true, branch: true, specialty: true },
          },
        },
      });
    });
  }

  async getSchedules(userId: string, startDate?: string, endDate?: string) {
    const doctor = await this.getDoctorOrThrow(userId);
    const range = this.parseDateRange(startDate, endDate);
    const workplaceIds = doctor.workPlaces.map((workplace) => workplace.id);
    const [recurringSchedules, slots] = await Promise.all([
      this.prisma.doctorSchedule.findMany({
        where: {
          doctorWorkplaceId: { in: workplaceIds },
          isActive: true,
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: range.to } }] },
            { OR: [{ effectiveTo: null }, { effectiveTo: { gte: range.from } }] },
          ],
        },
        include: {
          doctorWorkplace: { include: { hospital: true, branch: true, specialty: true } },
          scheduleServices: { include: { medicalService: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),
      this.prisma.appointmentSlot.findMany({
        where: {
          doctorWorkplaceId: { in: workplaceIds },
          isActive: true,
          startTime: { gte: range.from, lte: range.to },
        },
        include: {
          doctorWorkplace: { include: { hospital: true, branch: true, specialty: true } },
          roomSession: { include: { room: true, service: true } },
          _count: {
            select: {
              primaryAppointments: {
                where: { status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.EXPIRED] } },
              },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);
    return { ...range, workplaces: doctor.workPlaces, recurringSchedules, slots };
  }

  async getAppointments(
    userId: string,
    query: { startDate?: string; endDate?: string; status?: string; page?: string; limit?: string },
  ) {
    const doctor = await this.getDoctorOrThrow(userId);
    const range = this.parseDateRange(query.startDate, query.endDate, 30);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    if (query.status && !APPOINTMENT_STATUSES.has(query.status as AppointmentStatus)) {
      throw new BadRequestException('Trạng thái lịch hẹn không hợp lệ');
    }
    const where = {
      slot: {
        doctorWorkplace: { doctorId: doctor.id },
        startTime: { gte: range.from, lte: range.to },
      },
      ...(query.status ? { status: query.status as AppointmentStatus } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patientProfile: true,
          medicalService: true,
          consultation: { select: { id: true, channel: true, status: true } },
          payment: { select: { status: true, paymentMethod: true, paidAt: true } },
          preExamSession: {
            select: { id: true, status: true, riskLevel: true, recommendations: true, completedAt: true },
          },
          slot: {
            include: {
              doctorWorkplace: { include: { hospital: true, branch: true, specialty: true } },
              roomSession: { include: { room: true, service: true } },
            },
          },
        },
        orderBy: { slot: { startTime: 'asc' } },
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { ...range, items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAppointment(userId: string, appointmentId: string) {
    const doctor = await this.getDoctorOrThrow(userId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        slot: { doctorWorkplace: { doctorId: doctor.id } },
      },
      include: {
        patientProfile: true,
        medicalService: true,
        consultation: { select: { id: true, channel: true, status: true } },
        payment: { select: { status: true, paymentMethod: true, paidAt: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        preExamSession: {
          select: { id: true, status: true, riskLevel: true, recommendations: true, completedAt: true },
        },
        slot: {
          include: {
            doctorWorkplace: { include: { hospital: true, branch: true, specialty: true } },
            roomSession: { include: { room: true, service: true } },
          },
        },
      },
    });
    if (!appointment) throw new NotFoundException('Lịch hẹn không tồn tại trong phạm vi được phân công');
    return appointment;
  }

  async getSharedRecords(userId: string, appointmentId: string) {
    const appointment = await this.getAppointment(userId, appointmentId);
    const targetHospitalId = appointment.slot.doctorWorkplace.hospitalId;
    const consents = await this.prisma.patientConsent.findMany({
      where: {
        patientProfileId: appointment.patientProfileId,
        targetHospitalId,
        status: 'GRANTED',
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    const permissions = new Map<string, Set<string>>();
    for (const consent of consents) {
      const scope = consent.scope as { encounterIds?: unknown; allowedSections?: unknown } | null;
      if (!Array.isArray(scope?.encounterIds) || !Array.isArray(scope?.allowedSections)) continue;
      const sections = scope.allowedSections.filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().toUpperCase());
      for (const id of scope.encounterIds) {
        if (typeof id !== 'string') continue;
        const allowed = permissions.get(id) || new Set<string>();
        sections.forEach((section) => allowed.add(section));
        permissions.set(id, allowed);
      }
    }
    if (!permissions.size) return [];
    const records = await this.prisma.medicalEncounter.findMany({
      where: { id: { in: [...permissions.keys()] }, patientProfileId: appointment.patientProfileId },
      include: { hospital: { select: { name: true } }, diagnoses: true, observations: true,
        prescription: { include: { items: true } } },
      orderBy: { encounterDate: 'desc' },
    });
    return records.map((record) => {
      const sections = permissions.get(record.id)!;
      return {
        id: record.id,
        encounterDate: record.encounterDate,
        hospitalName: record.hospital.name,
        specialtyName: record.specialtyName,
        doctorName: record.doctorName,
        chiefComplaint: sections.has('SUMMARY') ? record.chiefComplaint : null,
        clinicalSummary: sections.has('SUMMARY') ? record.clinicalSummary : null,
        treatmentPlan: sections.has('SUMMARY') ? record.treatmentPlan : null,
        conclusion: sections.has('SUMMARY') ? record.conclusion : null,
        initialDiagnosis: sections.has('DIAGNOSES') ? record.initialDiagnosis : null,
        diagnoses: sections.has('DIAGNOSES')
          ? record.diagnoses.map((item) => ({ diseaseName: item.diseaseName, icdCode: item.icdCode }))
          : [],
        observations: sections.has('OBSERVATIONS')
          ? record.observations.map((item) => ({ name: item.name, value: item.value, unit: item.unit }))
          : [],
        prescription:
          sections.has('PRESCRIPTIONS') && record.prescription
            ? {
                note: record.prescription.note,
                items: (record.prescription.items || []).map((item) => ({
                  drugName: item.drugName,
                  dosage: item.dosage,
                  usageInstruction: item.usageInstruction,
                  duration: item.duration,
                })),
              }
            : null,
      };
    });
  }

  async getDashboard(userId: string) {
    const doctor = await this.getDoctorOrThrow(userId);
    const todayText = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const range = this.parseDateRange(todayText, todayText);
    const appointmentScope = {
      slot: {
        doctorWorkplace: { doctorId: doctor.id },
        startTime: { gte: range.from, lte: range.to },
      },
    };
    const [totalToday, upcomingToday, completedToday, slotsToday, unreadNotifications, nextAppointments] =
      await Promise.all([
        this.prisma.appointment.count({ where: appointmentScope }),
        this.prisma.appointment.count({
          where: {
            ...appointmentScope,
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] },
          },
        }),
        this.prisma.appointment.count({
          where: { ...appointmentScope, status: AppointmentStatus.COMPLETED },
        }),
        this.prisma.appointmentSlot.count({
          where: {
            doctorWorkplace: { doctorId: doctor.id },
            isActive: true,
            startTime: { gte: range.from, lte: range.to },
          },
        }),
        this.prisma.notification.count({ where: { userId, isRead: false } }),
        this.prisma.appointment.findMany({
          where: {
            slot: { doctorWorkplace: { doctorId: doctor.id }, startTime: { gte: new Date() } },
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.PAID] },
          },
          take: 5,
          include: {
            patientProfile: true,
            medicalService: true,
            preExamSession: { select: { id: true, riskLevel: true, status: true } },
            slot: {
              include: {
                doctorWorkplace: { include: { hospital: true, branch: true, specialty: true } },
                roomSession: { include: { room: true } },
              },
            },
          },
          orderBy: { slot: { startTime: 'asc' } },
        }),
      ]);
    return {
      date: todayText,
      doctor,
      stats: { totalToday, upcomingToday, completedToday, slotsToday, unreadNotifications },
      nextAppointments,
    };
  }
}
