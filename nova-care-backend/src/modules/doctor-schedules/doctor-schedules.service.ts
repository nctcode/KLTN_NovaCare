import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class DoctorSchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateScheduleDto) {
    // Kiểm tra trùng lặp
    const existing = await this.prisma.doctorSchedule.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId: createDto.doctorId,
          dayOfWeek: createDto.dayOfWeek,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Bác sĩ đã có lịch làm việc cho ngày này');
    }

    return this.prisma.doctorSchedule.create({
      data: createDto,
      include: { doctor: true },
    });
  }

  async findByDoctor(doctorId: string) {
    return this.prisma.doctorSchedule.findMany({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id },
      include: { doctor: true },
    });
    if (!schedule) {
      throw new NotFoundException('Lịch làm việc không tồn tại');
    }
    return schedule;
  }

  async update(id: string, updateDto: UpdateScheduleDto) {
    await this.findOne(id);
    if (updateDto.doctorId && updateDto.dayOfWeek !== undefined) {
      const existing = await this.prisma.doctorSchedule.findUnique({
        where: {
          doctorId_dayOfWeek: {
            doctorId: updateDto.doctorId,
            dayOfWeek: updateDto.dayOfWeek,
          },
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Bác sĩ đã có lịch làm việc cho ngày này');
      }
    }

    return this.prisma.doctorSchedule.update({
      where: { id },
      data: updateDto,
      include: { doctor: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.doctorSchedule.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
