import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateMedicalServiceDto } from './dto/create-medical-service.dto';
import { UpdateMedicalServiceDto } from './dto/update-medical-service.dto';

@Injectable()
export class MedicalServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateMedicalServiceDto) {
    const { hospitalId, name, description, price, duration, isActive } = createDto;
    return this.prisma.medicalService.create({
      data: {
        hospitalId,
        name,
        description,
        price: price !== undefined ? price : undefined,
        duration: duration !== undefined ? duration : undefined,
        isActive,
      },
      include: { hospital: true },
    });
  }

  async findAll() {
    return this.prisma.medicalService.findMany({
      where: { isActive: true },
      include: { hospital: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByHospital(hospitalId: string) {
    return this.prisma.medicalService.findMany({
      where: { hospitalId, isActive: true },
      include: { hospital: true },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.medicalService.findUnique({
      where: { id },
      include: { hospital: true },
    });
    if (!service) {
      throw new NotFoundException('Dịch vụ khám không tồn tại');
    }
    return service;
  }

  async update(id: string, updateDto: UpdateMedicalServiceDto) {
    await this.findOne(id);
    const { hospitalId, name, description, price, duration, isActive } = updateDto;
    return this.prisma.medicalService.update({
      where: { id },
      data: {
        hospitalId,
        name,
        description,
        price: price !== undefined ? price : undefined,
        duration: duration !== undefined ? duration : undefined,
        isActive,
      },
      include: { hospital: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.medicalService.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
