import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital } from '@prisma/client';

@Injectable()
export class HospitalsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateHospitalDto): Promise<Hospital> {
    const existing = await this.prisma.hospital.findUnique({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Cơ sở y tế "${createDto.name}" đã tồn tại`);
    }
    return this.prisma.hospital.create({
      data: createDto,
    });
  }

  async findAll(includeInactive: boolean = false): Promise<Hospital[]> {
    const where = includeInactive ? {} : { isActive: true, deletedAt: null };
    return this.prisma.hospital.findMany({
      where,
      orderBy: { rating: 'desc' },
    });
  }

  async findOne(id: string): Promise<Hospital> {
    const hospital = await this.prisma.hospital.findFirst({
      where: { id, deletedAt: null },
      include: {
        branches: {
          where: { isActive: true, deletedAt: null },
        },
        workPlaces: {
          where: { isActive: true },
          include: {
            doctor: true,
            specialty: true,
          },
        },
        services: {
          where: { isActive: true },
        },
      },
    });
    if (!hospital) {
      throw new NotFoundException('Cơ sở y tế không tồn tại');
    }
    return hospital;
  }

  async update(id: string, updateDto: UpdateHospitalDto): Promise<Hospital> {
    await this.findOne(id);
    if (updateDto.name) {
      const existing = await this.prisma.hospital.findUnique({
        where: { name: updateDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Cơ sở y tế "${updateDto.name}" đã tồn tại`);
      }
    }
    return this.prisma.hospital.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    // Xóa mềm
    await this.prisma.hospital.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async search(query: string): Promise<Hospital[]> {
    return this.prisma.hospital.findMany({
      where: {
        AND: [
          { deletedAt: null },
          { isActive: true },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { address: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 20,
    });
  }

  async findBySpecialty(specialtyId: string): Promise<Hospital[]> {
    return this.prisma.hospital.findMany({
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
      distinct: ['id'],
    });
  }

  async getAvailableSpecialties(hospitalId: string): Promise<any[]> {
    return this.prisma.specialty.findMany({
      where: {
        workPlaces: {
          some: {
            hospitalId,
            isActive: true,
          },
        },
      },
    });
  }
}
