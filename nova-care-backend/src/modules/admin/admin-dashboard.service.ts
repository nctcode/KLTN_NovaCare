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
      totalPatients,
      totalDoctors,
      totalHospitals,
      todayAppointments,
      totalAppointments,
      todayRevenueRaw,
      totalRevenueRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
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
      totalPatients,
      totalDoctors,
      totalHospitals,
      todayAppointments,
      totalAppointments,
      todayRevenue,
      totalRevenue,
    };
  }

  async getAppointmentsByDay() {
    const result: {
      date: string;
      label: string;
      count: number;
      total: number;
      completed: number;
      confirmed: number;
      pending: number;
      cancelled: number;
      awaitingPayment: number;
      paid: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;

      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const appts = await this.prisma.appointment.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { status: true },
      });

      let completed = 0;
      let confirmed = 0;
      let pending = 0;
      let cancelled = 0;
      let awaitingPayment = 0;
      let paid = 0;

      for (const a of appts) {
        if (a.status === 'COMPLETED') completed++;
        else if (a.status === 'CONFIRMED') confirmed++;
        else if (a.status === 'PENDING') pending++;
        else if (a.status === 'CANCELLED') cancelled++;
        else if (a.status === 'AWAITING_PAYMENT') awaitingPayment++;
        else if (a.status === 'PAID') paid++;
      }

      result.push({
        date: dateStr,
        label: dayLabel,
        count: appts.length,
        total: appts.length,
        completed,
        confirmed,
        pending,
        cancelled,
        awaitingPayment,
        paid,
      });
    }

    return result;
  }

  async getAppointmentStatusDistribution() {
    const statusGroups = await this.prisma.appointment.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const labelMap: Record<string, { label: string; color: string }> = {
      COMPLETED: { label: 'Đã hoàn thành', color: '#10b981' },
      CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6' },
      PENDING: { label: 'Chờ duyệt / khám', color: '#f59e0b' },
      AWAITING_PAYMENT: { label: 'Chờ thanh toán', color: '#8b5cf6' },
      PAID: { label: 'Đã thanh toán', color: '#06b6d4' },
      CANCELLED: { label: 'Đã hủy', color: '#ef4444' },
    };

    const total = statusGroups.reduce((acc, cur) => acc + cur._count.id, 0);

    return statusGroups
      .map((item) => {
        const config = labelMap[item.status] || {
          label: item.status,
          color: '#94a3b8',
        };
        const count = item._count.id;
        const percentage =
          total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;

        return {
          status: item.status,
          label: config.label,
          count,
          percentage,
          color: config.color,
        };
      })
      .sort((a, b) => b.count - a.count);
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
      include: {
        workPlaces: {
          include: {
            specialty: true,
            hospital: { select: { name: true } },
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
        const hospitalNames = new Set<string>();

        doc.workPlaces.forEach((wp) => {
          if (wp.specialty) specialtyNames.add(wp.specialty.name);
          if (wp.hospital) hospitalNames.add(wp.hospital.name);
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
          hospitals: Array.from(hospitalNames).join(', '),
          appointmentCount,
        };
      })
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 5);
  }

  async getTopHospitals() {
    const hospitals = await this.prisma.hospital.findMany({
      where: { deletedAt: null },
      include: {
        workPlaces: {
          include: {
            slots: {
              include: {
                appointments: {
                  select: { id: true, status: true },
                },
              },
            },
          },
        },
        services: {
          include: {
            appointments: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    const totalAllAppointments = await this.prisma.appointment.count();

    const list = hospitals.map((hosp) => {
      const appointmentIds = new Set<string>();

      hosp.workPlaces.forEach((wp) => {
        wp.slots.forEach((slot) => {
          slot.appointments.forEach((apt) => appointmentIds.add(apt.id));
        });
      });

      hosp.services.forEach((srv) => {
        srv.appointments.forEach((apt) => appointmentIds.add(apt.id));
      });

      const appointmentCount = appointmentIds.size;
      const percentage =
        totalAllAppointments > 0
          ? Number(((appointmentCount / totalAllAppointments) * 100).toFixed(1))
          : 0;

      return {
        id: hosp.id,
        name: hosp.name,
        address: hosp.address,
        city: hosp.city,
        logoUrl: hosp.logoUrl,
        type: hosp.type,
        appointmentCount,
        percentage,
      };
    });

    list.sort((a, b) => b.appointmentCount - a.appointmentCount);
    return list.slice(0, 5);
  }

  async getAuditLogs(page = 1, limit = 20, search?: string) {
    return this.auditLogService.getLogs(page, limit, search);
  }
}
