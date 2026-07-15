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
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, deletedAt: null },
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
          },
        },
        schedules: {
          where: { isActive: true },
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
    return this.prisma.doctor.findMany({
      where: {
        AND: [
          { deletedAt: null },
          { isActive: true },
          {
            OR: [
              { fullName: { contains: query, mode: 'insensitive' } },
              { qualification: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 20,
    });
  }

  async findByHospital(hospitalId: string): Promise<Doctor[]> {
    return this.prisma.doctor.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        workPlaces: {
          some: {
            hospitalId,
            isActive: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findBySpecialty(specialtyId: string): Promise<Doctor[]> {
    return this.prisma.doctor.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        workPlaces: {
          some: {
            specialtyId,
            isActive: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findByHospitalAndSpecialty(hospitalId: string, specialtyId: string): Promise<Doctor[]> {
    return this.prisma.doctor.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        workPlaces: {
          some: {
            hospitalId,
            specialtyId,
            isActive: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
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
