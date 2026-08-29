import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { PatientProfile } from '@prisma/client';

@Injectable()
export class PatientProfilesService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createDto: CreatePatientProfileDto): Promise<PatientProfile> {
    // Nếu đặt isDefault = true, cập nhật các hồ sơ khác thành false
    if (createDto.isDefault) {
      await this.prisma.patientProfile.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Nếu là hồ sơ đầu tiên, tự động set isDefault = true
    const count = await this.prisma.patientProfile.count({
      where: { userId, deletedAt: null },
    });

    try {
      const profile = await this.prisma.patientProfile.create({
        data: {
          ...createDto,
          userId,
          isDefault: createDto.isDefault ?? count === 0,
          dateOfBirth: createDto.dateOfBirth ? new Date(createDto.dateOfBirth) : null,
        },
      });

      return profile;
    } catch (error: any) {
      // Prisma P2002: Unique constraint violation
      if (error.code === 'P2002') {
        const fields = error.meta?.target?.join(', ') || 'unknown';
        throw new BadRequestException(
          `Thông tin đã tồn tại trong hệ thống: ${fields}. Vui lòng kiểm tra lại số CCCD/CMND hoặc các thông tin định danh.`
        );
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<PatientProfile[]> {
    return this.prisma.patientProfile.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, userId: string): Promise<PatientProfile> {
    const profile = await this.prisma.patientProfile.findFirst({
      where: { id, deletedAt: null },
    });

    if (!profile) {
      throw new NotFoundException('Hồ sơ không tồn tại');
    }

    // Kiểm tra quyền sở hữu
    if (profile.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem hồ sơ này');
    }

    return profile;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdatePatientProfileDto
  ): Promise<PatientProfile> {
    // Kiểm tra quyền sở hữu
    await this.findOne(id, userId);

    // Nếu đặt isDefault = true, cập nhật các hồ sơ khác
    if (updateDto.isDefault) {
      await this.prisma.patientProfile.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const profile = await this.prisma.patientProfile.update({
      where: { id },
      data: {
        ...updateDto,
        dateOfBirth: updateDto.dateOfBirth ? new Date(updateDto.dateOfBirth) : undefined,
      },
    });

    return profile;
  }

  async remove(id: string, userId: string): Promise<void> {
    const profile = await this.findOne(id, userId);

    // Không cho phép xóa hồ sơ mặc định nếu có nhiều hồ sơ
    if (profile.isDefault) {
      const count = await this.prisma.patientProfile.count({
        where: { userId, deletedAt: null },
      });
      if (count > 1) {
        throw new BadRequestException('Không thể xóa hồ sơ mặc định. Hãy đặt hồ sơ khác làm mặc định trước');
      }
    }

    await this.prisma.patientProfile.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        identityNumber: profile.identityNumber ? `${profile.identityNumber}_del_${Date.now()}` : null,
      },
    });
  }

  async setDefault(id: string, userId: string): Promise<PatientProfile> {
    await this.findOne(id, userId);

    // Cập nhật tất cả hồ sơ khác thành false
    await this.prisma.patientProfile.updateMany({
      where: { userId, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });

    return this.prisma.patientProfile.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
