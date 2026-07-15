import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSpecialtyDto) {
    const existing = await this.prisma.specialty.findUnique({
      where: { name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(`Chuyên khoa "${createDto.name}" đã tồn tại`);
    }
    return this.prisma.specialty.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
    });
    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại');
    }
    return specialty;
  }

  async update(id: string, updateDto: UpdateSpecialtyDto) {
    await this.findOne(id);
    if (updateDto.name) {
      const existing = await this.prisma.specialty.findUnique({
        where: { name: updateDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Chuyên khoa "${updateDto.name}" đã tồn tại`);
      }
    }
    return this.prisma.specialty.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.specialty.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
