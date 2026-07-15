import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { HospitalBranch } from '@prisma/client';

@Injectable()
export class HospitalBranchesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateBranchDto): Promise<HospitalBranch> {
    // Kiểm tra hospitalId tồn tại
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: createDto.hospitalId },
    });
    if (!hospital) {
      throw new NotFoundException('Cơ sở y tế không tồn tại');
    }

    return this.prisma.hospitalBranch.create({
      data: createDto,
    });
  }

  async findAll(): Promise<HospitalBranch[]> {
    return this.prisma.hospitalBranch.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findByHospital(hospitalId: string): Promise<HospitalBranch[]> {
    return this.prisma.hospitalBranch.findMany({
      where: { hospitalId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<HospitalBranch> {
    const branch = await this.prisma.hospitalBranch.findFirst({
      where: { id, deletedAt: null },
    });
    if (!branch) {
      throw new NotFoundException('Chi nhánh không tồn tại');
    }
    return branch;
  }

  async update(id: string, updateDto: UpdateBranchDto): Promise<HospitalBranch> {
    await this.findOne(id);
    return this.prisma.hospitalBranch.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.hospitalBranch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
