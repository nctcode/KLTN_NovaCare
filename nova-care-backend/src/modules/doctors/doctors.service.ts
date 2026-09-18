import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor, AppointmentSlot } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateDoctorDto): Promise<Doctor> {
    return this.prisma.doctor.create({
      data: createDto,
    });
  }

  async findAll(): Promise<Doctor[]> {
    return this.prisma.doctor.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        workPlaces: {
          where: { isActive: true },
          include: {
            hospital: true,
            specialty: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findFiltered(params: {
    q?: string;
    hospitalId?: string;
    specialtyId?: string;
  }): Promise<Doctor[]> {
    const { q, hospitalId, specialtyId } = params;

    const conditions: any[] = [{ deletedAt: null }, { isActive: true }];

    if (q) {
      conditions.push({
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { qualification: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (hospitalId && hospitalId !== 'all') {
      conditions.push({
        workPlaces: {
          some: {
            hospitalId,
            isActive: true,
          },
        },
      });
    }

    if (specialtyId && specialtyId !== 'all') {
      conditions.push({
        workPlaces: {
          some: {
            specialtyId,
            isActive: true,
          },
        },
      });
    }

    return this.prisma.doctor.findMany({
      where: {
        AND: conditions,
      },
      include: {
        workPlaces: {
          where: { isActive: true },
          include: {
            hospital: true,
            specialty: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, deletedAt: null },
      include: {
        workPlaces: {
          where: { isActive: true },
          include: {
            hospital: true,
            specialty: true,
          },
        },
      },
    });
    if (!doctor) {
      throw new NotFoundException('Bác sĩ không tồn tại');
    }
    return doctor;
  }

  async findOneWithWorkplaces(id: string): Promise<any> {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, deletedAt: null },
      include: {
        workPlaces: {
          where: { isActive: true },
          include: {
            hospital: true,
            specialty: true,
            schedules: {
              where: { isActive: true },
            },
          },
        },
      },
    });
    if (!doctor) {
      throw new NotFoundException('Bác sĩ không tồn tại');
    }
    return doctor;
  }

  async update(id: string, updateDto: UpdateDoctorDto): Promise<Doctor> {
    await this.findOne(id);
    return this.prisma.doctor.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.doctor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async search(query: string): Promise<Doctor[]> {
    return this.findFiltered({ q: query });
  }

  async findByHospital(hospitalId: string): Promise<Doctor[]> {
    return this.findFiltered({ hospitalId });
  }

  async findBySpecialty(specialtyId: string): Promise<Doctor[]> {
    return this.findFiltered({ specialtyId });
  }

  async findByHospitalAndSpecialty(hospitalId: string, specialtyId: string): Promise<Doctor[]> {
    return this.findFiltered({ hospitalId, specialtyId });
  }

  // Lấy khung giờ trống của bác sĩ theo ngày và nơi làm việc (Chuẩn múi giờ GMT+7, hoàn toàn phụ thuộc vào DoctorSchedule)
  async getAvailableSlots(
    doctorId: string,
    doctorWorkplaceId: string,
    dateInput: Date | string
  ): Promise<any[]> {
    let dateStr: string;
    if (typeof dateInput === 'string') {
      dateStr = dateInput.split('T')[0];
    } else if (dateInput instanceof Date) {
      dateStr = dateInput.toISOString().split('T')[0];
    } else {
      dateStr = String(dateInput).split('T')[0];
    }

    const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59+07:00`);

    // 1. Xác định Day of Week của dateStr (0: Chủ Nhật, 1: Thứ 2, ..., 6: Thứ 7)
    const targetDate = new Date(`${dateStr}T12:00:00+07:00`);
    const dayOfWeek = targetDate.getDay();

    // 2. Query DoctorSchedule mẫu của Admin cho nơi làm việc & thứ này
    const scheduleTemplate = await this.prisma.doctorSchedule.findFirst({
      where: {
        doctorWorkplaceId,
        dayOfWeek,
        isActive: true,
      },
    });

    // BÁC SĨ KHÔNG CÓ LỊCH LÀM VIỆC NGÀY NÀY -> Trả về rỗng, TUYỆT ĐỐI KHÔNG HARD-CODE SLOT!
    if (!scheduleTemplate) {
      return [];
    }

    // 3. Query các slot thực tế hiện có trong DB cho ngày này
    let slots = await this.prisma.appointmentSlot.findMany({
      where: {
        doctorWorkplaceId,
        startTime: { gte: startOfDay, lte: endOfDay },
        isAvailable: true,
        isActive: true,
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

    // 4. Nếu chưa có slot thực tế trong DB, sinh slot ĐÚNG THEO THỜI GIAN TRONG DoctorSchedule
    if (slots.length === 0) {
      const [startHour, startMin] = scheduleTemplate.startTime.split(':').map(Number);
      const [endHour, endMin] = scheduleTemplate.endTime.split(':').map(Number);

      let breakStartMinutes = -1;
      let breakEndMinutes = -1;
      if (scheduleTemplate.breakStart && scheduleTemplate.breakEnd) {
        const [bsH, bsM] = scheduleTemplate.breakStart.split(':').map(Number);
        const [beH, beM] = scheduleTemplate.breakEnd.split(':').map(Number);
        breakStartMinutes = bsH * 60 + bsM;
        breakEndMinutes = beH * 60 + beM;
      }

      const slotDurationMinutes = 30; // Mỗi slot 30 phút
      let currentMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;

      const newSlotsData: any[] = [];

      while (currentMinutes + slotDurationMinutes <= endTotalMinutes) {
        const slotStartMins = currentMinutes;
        const slotEndMins = currentMinutes + slotDurationMinutes;

        // Bỏ qua khung giờ rơi vào giờ nghỉ trưa (Break Time)
        const isOverlapBreak =
          breakStartMinutes !== -1 &&
          breakEndMinutes !== -1 &&
          slotStartMins < breakEndMinutes &&
          slotEndMins > breakStartMinutes;

        if (!isOverlapBreak) {
          const sH = String(Math.floor(slotStartMins / 60)).padStart(2, '0');
          const sM = String(slotStartMins % 60).padStart(2, '0');
          const eH = String(Math.floor(slotEndMins / 60)).padStart(2, '0');
          const eM = String(slotEndMins % 60).padStart(2, '0');

          const startTime = new Date(`${dateStr}T${sH}:${sM}:00+07:00`);
          const endTime = new Date(`${dateStr}T${eH}:${eM}:00+07:00`);

          newSlotsData.push({
            doctorWorkplaceId,
            startTime,
            endTime,
            capacity: 1,
            bookedCount: 0,
            isAvailable: true,
            isActive: true,
          });
        }

        currentMinutes += slotDurationMinutes;
      }

      if (newSlotsData.length > 0) {
        await this.prisma.appointmentSlot.createMany({
          data: newSlotsData,
        });

        slots = await this.prisma.appointmentSlot.findMany({
          where: {
            doctorWorkplaceId,
            startTime: { gte: startOfDay, lte: endOfDay },
            isAvailable: true,
            isActive: true,
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
    }

    // Gắn metadata sessionType (MORNING / AFTERNOON / EVENING)
    return slots.map((slot) => {
      const start = new Date(slot.startTime);
      const hour = start.getHours();
      let sessionType = 'MORNING';
      if (hour >= 12 && hour < 17) sessionType = 'AFTERNOON';
      else if (hour >= 17) sessionType = 'EVENING';

      return {
        ...slot,
        sessionType,
      };
    });
  }

  // Lấy danh sách trạng thái khả dụng cho khoảng ngày (Ví dụ: 14 ngày tới)
  async getAvailableDates(
    doctorId: string,
    doctorWorkplaceId: string,
    startDateStr: string,
    endDateStr: string
  ): Promise<any[]> {
    const start = new Date(`${startDateStr}T00:00:00+07:00`);
    const end = new Date(`${endDateStr}T23:59:59+07:00`);

    // Lấy tất cả mẫu lịch tuần active của nơi làm việc này
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorWorkplaceId,
        isActive: true,
      },
    });

    const activeDaysOfWeek = new Set(schedules.map((s) => s.dayOfWeek));

    const result: any[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dStr = current.toISOString().split('T')[0];
      const targetDate = new Date(`${dStr}T12:00:00+07:00`);
      const dayOfWeek = targetDate.getDay();

      let hasAvailableSlots = false;
      let availableSlotCount = 0;

      if (activeDaysOfWeek.has(dayOfWeek)) {
        const slots = await this.getAvailableSlots(doctorId, doctorWorkplaceId, dStr);
        availableSlotCount = slots.filter((s) => s.isAvailable && s.bookedCount < s.capacity).length;
        hasAvailableSlots = availableSlotCount > 0;
      }

      result.push({
        date: dStr,
        dayOfWeek,
        hasAvailableSlots,
        availableSlotCount,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }
}
