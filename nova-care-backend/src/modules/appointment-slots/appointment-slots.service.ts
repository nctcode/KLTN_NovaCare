import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { AppointmentSlot } from '@prisma/client';

@Injectable()
export class AppointmentSlotsService {
  constructor(private prisma: PrismaService) {}

  // Tạo một slot đơn lẻ
  async create(createDto: CreateSlotDto): Promise<AppointmentSlot> {
    // Kiểm tra workplace tồn tại
    const workplace = await this.prisma.doctorWorkplace.findUnique({
      where: { id: createDto.doctorWorkplaceId },
    });
    if (!workplace) {
      throw new NotFoundException('Nơi làm việc không tồn tại');
    }

    // Kiểm tra slot trùng
    const existing = await this.prisma.appointmentSlot.findUnique({
      where: {
        doctorWorkplaceId_startTime: {
          doctorWorkplaceId: createDto.doctorWorkplaceId,
          startTime: new Date(createDto.startTime),
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Khung giờ này đã tồn tại');
    }

    return this.prisma.appointmentSlot.create({
      data: {
        ...createDto,
        startTime: new Date(createDto.startTime),
        endTime: new Date(createDto.endTime),
        isAvailable: true,
        bookedCount: 0,
      },
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            hospital: true,
            specialty: true,
          },
        },
      },
    });
  }

  // Tự động tạo slots từ lịch làm việc của bác sĩ trong khoảng ngày
  async generateSlots(
    doctorId: string,
    workplaceId: string,
    startDate: Date,
    endDate: Date,
    slotDuration: number = 30, // phút
    capacity: number = 1
  ): Promise<{ created: number; failed: number }> {
    // Lấy lịch làm việc của bác sĩ
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        isActive: true,
      },
    });
    if (schedules.length === 0) {
      throw new BadRequestException('Bác sĩ chưa có lịch làm việc cố định');
    }

    // Tạo map dayOfWeek -> schedule
    const scheduleMap = new Map();
    schedules.forEach((s) => scheduleMap.set(s.dayOfWeek, s));

    let created = 0;
    let failed = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ...
      const schedule = scheduleMap.get(dayOfWeek);

      if (schedule) {
        // Parse giờ làm việc
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);
        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        // Tạo các slot trong khoảng thời gian làm việc
        while (slotStart < slotEnd) {
          const endTime = new Date(slotStart.getTime() + slotDuration * 60000);
          if (endTime > slotEnd) break;

          // Kiểm tra break nếu có
          let isBreak = false;
          if (schedule.breakStart && schedule.breakEnd) {
            const [breakStartHour, breakStartMinute] = schedule.breakStart.split(':').map(Number);
            const [breakEndHour, breakEndMinute] = schedule.breakEnd.split(':').map(Number);

            const breakStart = new Date(slotStart);
            breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
            const breakEnd = new Date(slotStart);
            breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

            if (slotStart >= breakStart && slotStart < breakEnd) {
              isBreak = true;
            }
          }

          if (!isBreak) {
            try {
              await this.prisma.appointmentSlot.create({
                data: {
                  doctorWorkplaceId: workplaceId,
                  startTime: new Date(slotStart),
                  endTime: new Date(endTime),
                  capacity,
                  bookedCount: 0,
                  isAvailable: true,
                },
              });
              created++;
            } catch (error) {
              failed++;
            }
          }
          slotStart = new Date(endTime);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return { created, failed };
  }

  // Lấy danh sách slot trống theo ngày
  async getAvailableSlots(
    doctorWorkplaceId: string,
    date: Date
  ): Promise<AppointmentSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.appointmentSlot.findMany({
      where: {
        doctorWorkplaceId,
        startTime: { gte: startOfDay, lte: endOfDay },
        isAvailable: true,
        isActive: true,
        bookedCount: { lt: this.prisma.appointmentSlot.fields.capacity },
      },
      orderBy: { startTime: 'asc' },
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            specialty: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<AppointmentSlot> {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id },
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            hospital: true,
            specialty: true,
          },
        },
        appointments: {
          where: { status: { notIn: ['CANCELLED', 'EXPIRED'] } },
        },
      },
    });
    if (!slot) {
      throw new NotFoundException('Khung giờ khám không tồn tại');
    }
    return slot;
  }

  // Cập nhật số lượng đã đặt (tăng/giảm)
  async updateBookedCount(id: string, increment: number): Promise<AppointmentSlot> {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id },
    });
    if (!slot) {
      throw new NotFoundException('Khung giờ khám không tồn tại');
    }

    const newBookedCount = slot.bookedCount + increment;
    if (newBookedCount < 0) {
      throw new BadRequestException('Số lượng đã đặt không thể âm');
    }
    if (newBookedCount > slot.capacity) {
      throw new BadRequestException('Khung giờ đã hết chỗ');
    }

    return this.prisma.appointmentSlot.update({
      where: { id },
      data: {
        bookedCount: newBookedCount,
        isAvailable: newBookedCount < slot.capacity,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const slot = await this.findOne(id);

    // Kiểm tra có lịch hẹn nào đang hoạt động (chưa hủy, chưa hoàn thành)
    const hasActiveAppointments = await this.prisma.appointment.count({
      where: {
        slotId: id,
        status: { notIn: ['CANCELLED', 'EXPIRED', 'COMPLETED'] },
      },
    });
    if (hasActiveAppointments > 0) {
      throw new BadRequestException('Không thể xóa khung giờ đã có lịch hẹn chưa hoàn thành');
    }

    await this.prisma.appointmentSlot.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
