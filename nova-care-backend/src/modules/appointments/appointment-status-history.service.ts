import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentStatusHistoryService {
  constructor(private prisma: PrismaService) {}

  async findByAppointment(appointmentId: string) {
    return this.prisma.appointmentStatusHistory.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTimeline(appointmentId: string) {
    const histories = await this.prisma.appointmentStatusHistory.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });

    // Chuyển đổi thành timeline với màu sắc tương ứng
    return histories.map((h) => ({
      status: h.status,
      statusLabel: this.getStatusLabel(h.status),
      color: this.getStatusColor(h.status),
      note: h.note,
      createdAt: h.createdAt,
    }));
  }

  private getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      PENDING: 'Chờ xác nhận',
      AWAITING_PAYMENT: 'Chờ thanh toán',
      CONFIRMED: 'Đã xác nhận',
      PAID: 'Đã thanh toán',
      COMPLETED: 'Đã hoàn thành',
      CANCELLED: 'Đã hủy',
      EXPIRED: 'Đã hết hạn',
      NO_SHOW: 'Không đến khám',
      FAILED: 'Không thành công',
      REFUNDED: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  }

  private getStatusColor(status: AppointmentStatus): string {
    const colors: Record<AppointmentStatus, string> = {
      PENDING: '#FFC107',
      AWAITING_PAYMENT: '#FF9800',
      CONFIRMED: '#66FF33',
      PAID: '#4CAF50',
      COMPLETED: '#2196F3',
      CANCELLED: '#F44336',
      EXPIRED: '#9E9E9E',
      NO_SHOW: '#795548',
      FAILED: '#F44336',
      REFUNDED: '#9C27B0',
    };
    return colors[status] || '#000000';
  }
}
