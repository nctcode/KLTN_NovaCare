import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getOverview() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      totalDoctors,
      totalHospitals,
      todayAppointments,
      totalAppointments,
      todayRevenueRaw,
      totalRevenueRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, role: 'PATIENT' } }),
      this.prisma.doctor.count({ where: { deletedAt: null } }),
      this.prisma.hospital.count({ where: { deletedAt: null } }),
      this.prisma.appointment.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.appointment.count(),
      this.prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidAt: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
    ]);

    const todayRevenue = Number(todayRevenueRaw._sum.amount || 0);
    const totalRevenue = Number(totalRevenueRaw._sum.amount || 0);

    return {
      totalUsers,
      totalDoctors,
      totalHospitals,
      todayAppointments,
      totalAppointments,
      todayRevenue,
      totalRevenue,
    };
  }

  async getAppointmentsByDay() {
    const result: { date: string; label: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;

      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const count = await this.prisma.appointment.count({
        where: { createdAt: { gte: start, lte: end } },
      });

      result.push({ date: dateStr, label: dayLabel, count });
    }

    return result;
  }

  async getRevenueByMonth() {
    const result: { month: string; label: string; revenue: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = `T${d.getMonth() + 1}/${d.getFullYear()}`;

      const agg = await this.prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidAt: { gte: start, lte: end } },
      });

      result.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: monthLabel,
        revenue: Number(agg._sum.amount || 0),
      });
    }

    return result;
  }

  async getTopDoctors() {
    const doctors = await this.prisma.doctor.findMany({
      where: { deletedAt: null },
      take: 5,
      include: {
        workPlaces: {
          include: {
            specialty: true,
            slots: {
              include: {
                appointments: true,
              },
            },
          },
        },
      },
    });

    return doctors
      .map((doc) => {
        let appointmentCount = 0;
        const specialtyNames = new Set<string>();

        doc.workPlaces.forEach((wp) => {
          if (wp.specialty) specialtyNames.add(wp.specialty.name);
          wp.slots.forEach((slot) => {
            appointmentCount += slot.appointments.length;
          });
        });

        return {
          id: doc.id,
          fullName: doc.fullName,
          avatarUrl: doc.avatarUrl,
          qualification: doc.qualification,
          specialties: Array.from(specialtyNames).join(', '),
          appointmentCount,
        };
      })
      .sort((a, b) => b.appointmentCount - a.appointmentCount);
  }

  async getTopHospitals() {
    const hospitals = await this.prisma.hospital.findMany({
      where: { deletedAt: null },
      take: 5,
      include: {
        workPlaces: {
          include: {
            slots: {
              include: {
                appointments: true,
              },
            },
          },
        },
      },
    });

    return hospitals
      .map((hosp) => {
        let appointmentCount = 0;
        hosp.workPlaces.forEach((wp) => {
          wp.slots.forEach((slot) => {
            appointmentCount += slot.appointments.length;
          });
        });

        return {
          id: hosp.id,
          name: hosp.name,
          address: hosp.address,
          logoUrl: hosp.logoUrl,
          appointmentCount,
        };
      })
      .sort((a, b) => b.appointmentCount - a.appointmentCount);
  }

  async getAuditLogs(page = 1, limit = 20, search?: string) {
    return this.auditLogService.getLogs(page, limit, search);
  }
}
