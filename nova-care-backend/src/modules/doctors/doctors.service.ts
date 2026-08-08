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

    return this.prisma.appointmentSlot.findMany({
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
  }
}
