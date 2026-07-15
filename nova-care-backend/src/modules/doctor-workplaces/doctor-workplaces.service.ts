import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateWorkplaceDto } from './dto/create-workplace.dto';
import { UpdateWorkplaceDto } from './dto/update-workplace.dto';

@Injectable()
export class DoctorWorkplacesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateWorkplaceDto) {
    // Kiểm tra trùng lặp
    const existing = await this.prisma.doctorWorkplace.findUnique({
      where: {
        doctorId_hospitalId_specialtyId: {
          doctorId: createDto.doctorId,
          hospitalId: createDto.hospitalId,
          specialtyId: createDto.specialtyId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Bác sĩ đã làm việc tại chuyên khoa này của cơ sở');
    }

    return this.prisma.doctorWorkplace.create({
      data: createDto,
      include: {
        doctor: true,
        hospital: true,
        specialty: true,
      },
    });
  }

  async findAll() {
    return this.prisma.doctorWorkplace.findMany({
      where: { isActive: true },
      include: {
        doctor: true,
        hospital: true,
        specialty: true,
      },
    });
  }

  async findByDoctor(doctorId: string) {
    return this.prisma.doctorWorkplace.findMany({
      where: { doctorId, isActive: true },
      include: {
        hospital: true,
        specialty: true,
        slots: {
          where: {
            isActive: true,
            isAvailable: true,
            startTime: { gte: new Date() },
          },
          take: 10,
        },
      },
    });
  }

  async findByHospital(hospitalId: string) {
    return this.prisma.doctorWorkplace.findMany({
      where: { hospitalId, isActive: true },
      include: {
        doctor: true,
        specialty: true,
      },
    });
  }

  async findOne(id: string) {
    const workplace = await this.prisma.doctorWorkplace.findUnique({
      where: { id },
      include: {
        doctor: true,
        hospital: true,
        specialty: true,
        slots: {
          where: {
            isActive: true,
            isAvailable: true,
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 30,
        },
      },
    });
    if (!workplace) {
      throw new NotFoundException('Nơi làm việc không tồn tại');
    }
    return workplace;
  }

  async update(id: string, updateDto: UpdateWorkplaceDto) {
    await this.findOne(id);
    return this.prisma.doctorWorkplace.update({
      where: { id },
      data: updateDto,
      include: {
        doctor: true,
        hospital: true,
        specialty: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.doctorWorkplace.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
