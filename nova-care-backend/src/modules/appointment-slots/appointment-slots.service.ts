import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { AppointmentSlot } from '@prisma/client';

@Injectable()
export class AppointmentSlotsService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách tất cả các khung giờ (Admin query có bộ lọc theo Ngày, Bệnh viện, Bác sĩ, Chuyên khoa, v.v.)
  async findAll(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    doctorWorkplaceId?: string;
    doctorId?: string;
    hospitalId?: string;
    specialtyId?: string;
    isActive?: string;
    isAvailable?: string;
    search?: string;
  }): Promise<any[]> {
    const where: any = {};

    if (params?.date) {
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    } else if (params?.startDate || params?.endDate) {
      where.startTime = {};
      if (params.startDate) {
        const s = new Date(params.startDate);
        s.setHours(0, 0, 0, 0);
        where.startTime.gte = s;
      }
      if (params.endDate) {
        const e = new Date(params.endDate);
        e.setHours(23, 59, 59, 999);
        where.startTime.lte = e;
      }
    }

    if (params?.isActive !== undefined && params?.isActive !== '') {
      where.isActive = String(params.isActive) === 'true';
    }

    if (params?.isAvailable !== undefined && params?.isAvailable !== '') {
      where.isAvailable = String(params.isAvailable) === 'true';
    }

    const workplaceWhere: any = {};
    if (params?.doctorWorkplaceId) workplaceWhere.id = params.doctorWorkplaceId;
    if (params?.doctorId) workplaceWhere.doctorId = params.doctorId;
    if (params?.hospitalId) workplaceWhere.hospitalId = params.hospitalId;
    if (params?.specialtyId) workplaceWhere.specialtyId = params.specialtyId;

    if (params?.search) {
      workplaceWhere.doctor = {
        fullName: { contains: params.search, mode: 'insensitive' },
      };
    }

    if (Object.keys(workplaceWhere).length > 0) {
      where.doctorWorkplace = workplaceWhere;
    }

    return this.prisma.appointmentSlot.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            hospital: true,
            branch: true,
            specialty: true,
          },
        },
        _count: {
          select: {
            appointments: {
              where: { status: { notIn: ['CANCELLED', 'EXPIRED'] } },
            },
          },
        },
      },
    });
  }

  // Tạo một slot đơn lẻ
  async create(createDto: CreateSlotDto): Promise<AppointmentSlot> {
    const workplace = await this.prisma.doctorWorkplace.findUnique({
      where: { id: createDto.doctorWorkplaceId },
    });
    if (!workplace) {
      throw new NotFoundException('Nơi làm việc không tồn tại');
    }

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
            branch: true,
            specialty: true,
          },
        },
      },
    });
  }

  // Tự động tạo slots từ lịch làm việc của bác sĩ trong khoảng ngày (Hỗ trợ theo cơ sở đơn lẻ hoặc hàng loạt)
  async generateSlots(
    doctorId?: string,
    workplaceId?: string,
    hospitalId?: string,
    startDate: Date = new Date(),
    endDate: Date = new Date(),
    slotDuration: number = 30, // phút
    capacity: number = 1
  ): Promise<{ created: number; failed: number }> {
    // 1. Xác định danh sách workplaceId cần sinh slot
    let workplacesToProcess: { id: string }[] = [];

    if (workplaceId) {
      workplacesToProcess = [{ id: workplaceId }];
    } else {
      const wpWhere: any = { isActive: true };
      if (doctorId) wpWhere.doctorId = doctorId;
      if (hospitalId) wpWhere.hospitalId = hospitalId;

      workplacesToProcess = await this.prisma.doctorWorkplace.findMany({
        where: wpWhere,
        select: { id: true },
      });
    }

    if (workplacesToProcess.length === 0) {
      throw new BadRequestException('Không tìm thấy nơi công tác phù hợp để sinh khung giờ.');
    }

    let totalCreated = 0;
    let totalFailed = 0;

    for (const wp of workplacesToProcess) {
      const schedules = await this.prisma.doctorSchedule.findMany({
        where: {
          doctorWorkplaceId: wp.id,
          isActive: true,
        },
      });
      if (schedules.length === 0) continue;

      const scheduleMap = new Map();
      schedules.forEach((s) => scheduleMap.set(s.dayOfWeek, s));

      const currentDate = new Date(startDate);
      const endLimit = new Date(endDate);

      while (currentDate <= endLimit) {
        const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday...
        const schedule = scheduleMap.get(dayOfWeek);

        if (schedule) {
          const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
          const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

          let slotStart = new Date(currentDate);
          slotStart.setHours(startHour, startMinute, 0, 0);
          const slotEnd = new Date(currentDate);
          slotEnd.setHours(endHour, endMinute, 0, 0);

          while (slotStart < slotEnd) {
            const slotEndTime = new Date(slotStart.getTime() + slotDuration * 60000);
            if (slotEndTime > slotEnd) break;

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
                // Kiểm tra nếu slot đã tồn tại thì bỏ qua tránh lỗi duplicate key
                const exists = await this.prisma.appointmentSlot.findUnique({
                  where: {
                    doctorWorkplaceId_startTime: {
                      doctorWorkplaceId: wp.id,
                      startTime: new Date(slotStart),
                    },
                  },
                });

                if (!exists) {
                  await this.prisma.appointmentSlot.create({
                    data: {
                      doctorWorkplaceId: wp.id,
                      startTime: new Date(slotStart),
                      endTime: new Date(slotEndTime),
                      capacity,
                      bookedCount: 0,
                      isAvailable: true,
                      isActive: true,
                    },
                  });
                  totalCreated++;
                }
              } catch (error) {
                totalFailed++;
              }
            }
            slotStart = new Date(slotEndTime);
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return { created: totalCreated, failed: totalFailed };
  }

  // Cập nhật slot (Capacity, Khóa/Mở slot, Bật/Tắt)
  async updateSlot(id: string, data: UpdateSlotDto): Promise<AppointmentSlot> {
    const slot = await this.prisma.appointmentSlot.findUnique({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Khung giờ không tồn tại');
    }

    const updateData: any = {};
    if (data.capacity !== undefined) {
      if (data.capacity < slot.bookedCount) {
        throw new BadRequestException(
          `Sức chứa mới (${data.capacity}) không thể nhỏ hơn số lượng đã đặt (${slot.bookedCount})`
        );
      }
      updateData.capacity = Number(data.capacity);
      updateData.isAvailable = slot.bookedCount < updateData.capacity;
    }
    if (data.isAvailable !== undefined) {
      updateData.isAvailable = Boolean(data.isAvailable);
    }
    if (data.isActive !== undefined) {
      updateData.isActive = Boolean(data.isActive);
    }

    return this.prisma.appointmentSlot.update({
      where: { id },
      data: updateData,
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            hospital: true,
            branch: true,
            specialty: true,
          },
        },
      },
    });
  }

  // Lấy danh sách slot trống theo ngày (Public cho Bệnh nhân)
  async getAvailableSlots(doctorWorkplaceId: string, date: Date): Promise<AppointmentSlot[]> {
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
