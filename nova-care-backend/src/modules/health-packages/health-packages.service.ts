import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateHealthPackageDto } from './dto/create-health-package.dto';
import { UpdateHealthPackageDto } from './dto/update-health-package.dto';

@Injectable()
export class HealthPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateHealthPackageDto) {
    return this.prisma.healthPackage.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        price: createDto.price,
        duration: createDto.duration || 60,
        hospitalId: createDto.hospitalId,
        services: createDto.services || [],
        isActive: createDto.isActive ?? true,
      },
      include: {
        hospital: true,
      },
    });
  }

  async findAll() {
    return this.prisma.healthPackage.findMany({
      where: { isActive: true },
      include: {
        hospital: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByHospital(hospitalId: string) {
    return this.prisma.healthPackage.findMany({
      where: { hospitalId, isActive: true },
      include: {
        hospital: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pkg = await this.prisma.healthPackage.findUnique({
      where: { id },
      include: {
        hospital: true,
      },
    });
    if (!pkg) {
      throw new NotFoundException('Không tìm thấy gói khám');
    }
    return pkg;
  }

  async update(id: string, updateDto: UpdateHealthPackageDto) {
    await this.findOne(id);
    return this.prisma.healthPackage.update({
      where: { id },
      data: updateDto,
      include: {
        hospital: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.healthPackage.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
