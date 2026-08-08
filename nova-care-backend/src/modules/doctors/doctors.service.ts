import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor, AppointmentSlot } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

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

  // Lấy khung giờ trống của bác sĩ theo ngày và nơi làm việc
  async getAvailableSlots(
    doctorId: string,
    doctorWorkplaceId: string,
    date: Date
  ): Promise<AppointmentSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let slots = await this.prisma.appointmentSlot.findMany({
      where: {
        doctorWorkplaceId,
        doctorWorkplace: {
          doctorId,
        },
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

    // If no slots exist for this workplace on this date, generate them on-the-fly
    if (slots.length === 0) {
      const times = [
        { start: '07:30', end: '08:00' },
        { start: '08:00', end: '08:30' },
        { start: '08:30', end: '09:00' },
        { start: '09:00', end: '09:30' },
        { start: '09:30', end: '10:00' },
        { start: '10:00', end: '10:30' },
        { start: '10:30', end: '11:00' },
        { start: '13:30', end: '14:00' },
        { start: '14:00', end: '14:30' },
        { start: '14:30', end: '15:00' },
        { start: '15:00', end: '15:30' },
        { start: '15:30', end: '16:00' },
        { start: '16:00', end: '16:30' },
        { start: '17:30', end: '18:00' },
        { start: '18:00', end: '18:30' },
        { start: '18:30', end: '19:00' },
      ];

      const newSlotsData: any[] = [];
      const baseDate = new Date(date);

      for (const t of times) {
        const [sH, sM] = t.start.split(':').map(Number);
        const [eH, eM] = t.end.split(':').map(Number);

        const startTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), sH, sM);
        const endTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), eH, eM);

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

      await this.prisma.appointmentSlot.createMany({
        data: newSlotsData,
      });

      // Query generated slots
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

    return slots;
  }
}
