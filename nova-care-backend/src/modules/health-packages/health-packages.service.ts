import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateHealthPackageDto } from './dto/create-health-package.dto';
import { UpdateHealthPackageDto } from './dto/update-health-package.dto';

@Injectable()
export class HealthPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateHealthPackageDto) {
    if (!createDto.hospitalId) {
      throw new BadRequestException('ID Bệnh viện là bắt buộc');
    }

    const hospital = await this.prisma.hospital.findUnique({
      where: { id: createDto.hospitalId },
    });
    if (!hospital) {
      throw new NotFoundException('Bệnh viện không tồn tại');
    }

    if (createDto.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: createDto.specialtyId },
      });
      if (!specialty) {
        throw new NotFoundException('Chuyên khoa không tồn tại');
      }
    }

    return this.prisma.healthPackage.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        thumbnailUrl: createDto.thumbnailUrl,
        price: createDto.price,
        originalPrice: createDto.originalPrice,
        duration: createDto.duration || 60,
        hospitalId: createDto.hospitalId,
        specialtyId: createDto.specialtyId || null,
        services: createDto.services || [],
        preparationNote: createDto.preparationNote,
        estimatedResultTime: createDto.estimatedResultTime,
        isActive: createDto.isActive ?? true,
      },
      include: {
        hospital: true,
        specialty: true,
      },
    });
  }

  async findAll(query?: { hospitalId?: string; specialtyId?: string; search?: string }) {
    const where: any = { isActive: true };

    if (query?.hospitalId) {
      where.hospitalId = query.hospitalId;
    }

    if (query?.specialtyId) {
      where.specialtyId = query.specialtyId;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.healthPackage.findMany({
      where,
      include: {
        hospital: true,
        specialty: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByHospital(hospitalId: string) {
    return this.prisma.healthPackage.findMany({
      where: { hospitalId, isActive: true },
      include: {
        hospital: true,
        specialty: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pkg = await this.prisma.healthPackage.findUnique({
      where: { id },
      include: {
        hospital: true,
        specialty: true,
      },
    });
    if (!pkg) {
      throw new NotFoundException('Không tìm thấy gói khám');
    }
    return pkg;
  }

  async update(id: string, updateDto: UpdateHealthPackageDto) {
    await this.findOne(id);

    if (updateDto.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: updateDto.hospitalId },
      });
      if (!hospital) {
        throw new NotFoundException('Bệnh viện không tồn tại');
      }
    }

    if (updateDto.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: updateDto.specialtyId },
      });
      if (!specialty) {
        throw new NotFoundException('Chuyên khoa không tồn tại');
      }
    }

    return this.prisma.healthPackage.update({
      where: { id },
      data: updateDto,
      include: {
        hospital: true,
        specialty: true,
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
