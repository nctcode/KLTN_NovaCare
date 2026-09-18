import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class DoctorSchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateScheduleDto) {
    // 1. Kiểm tra DoctorWorkplace
    const workplace = await this.prisma.doctorWorkplace.findUnique({
      where: { id: createDto.doctorWorkplaceId },
    });
    if (!workplace || !workplace.isActive) {
      throw new ConflictException('Nơi công tác không tồn tại hoặc đã ngừng hoạt động');
    }

    // 2. Validate thời gian
    if (createDto.startTime >= createDto.endTime) {
      throw new ConflictException('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
    }

    if (createDto.breakStart || createDto.breakEnd) {
      if (!createDto.breakStart || !createDto.breakEnd) {
        throw new ConflictException('Phải nhập đầy đủ giờ bắt đầu và kết thúc nghỉ giữa ca');
      }
      if (createDto.breakStart >= createDto.breakEnd) {
        throw new ConflictException('Giờ bắt đầu nghỉ phải nhỏ hơn giờ kết thúc nghỉ');
      }
      if (createDto.breakStart < createDto.startTime || createDto.breakEnd > createDto.endTime) {
        throw new ConflictException('Giờ nghỉ trưa phải nằm trong khoảng giờ làm việc');
      }
    }

    // 3. Kiểm tra trùng lặp
    const existing = await this.prisma.doctorSchedule.findUnique({
      where: {
        doctorWorkplaceId_dayOfWeek: {
          doctorWorkplaceId: createDto.doctorWorkplaceId,
          dayOfWeek: createDto.dayOfWeek,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Nơi công tác này đã có lịch làm việc cho ngày này trong tuần');
    }

    return this.prisma.doctorSchedule.create({
      data: createDto,
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            hospital: true,
            branch: true,
            specialty: true,
          },
        },
      },
    });
  }

  async findAll(params?: {
    search?: string;
    hospitalId?: string;
    branchId?: string;
    specialtyId?: string;
    doctorId?: string;
    isActive?: boolean | string;
    dayOfWeek?: number;
  }) {
    const where: any = {};

    if (params?.isActive !== undefined && params?.isActive !== '') {
      where.isActive = params.isActive === 'true' || params.isActive === true;
    }

    if (params?.dayOfWeek !== undefined && !isNaN(Number(params.dayOfWeek))) {
      where.dayOfWeek = Number(params.dayOfWeek);
    }

    const workplaceWhere: any = {};
    if (params?.hospitalId) workplaceWhere.hospitalId = params.hospitalId;
    if (params?.branchId) workplaceWhere.branchId = params.branchId;
    if (params?.specialtyId) workplaceWhere.specialtyId = params.specialtyId;
    if (params?.doctorId) workplaceWhere.doctorId = params.doctorId;

    if (Object.keys(workplaceWhere).length > 0) {
      where.doctorWorkplace = workplaceWhere;
    }

    if (params?.search) {
      where.doctorWorkplace = {
        ...where.doctorWorkplace,
        doctor: {
          fullName: { contains: params.search, mode: 'insensitive' },
        },
      };
    }

    return this.prisma.doctorSchedule.findMany({
      where,
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            hospital: true,
            branch: true,
            specialty: true,
          },
        },
      },
      orderBy: [
        { doctorWorkplace: { doctor: { fullName: 'asc' } } },
        { dayOfWeek: 'asc' },
      ],
    });
  }

  async findByWorkplace(doctorWorkplaceId: string) {
    return this.prisma.doctorSchedule.findMany({
      where: { doctorWorkplaceId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async findByDoctor(doctorId: string) {
    return this.prisma.doctorSchedule.findMany({
      where: {
        doctorWorkplace: { doctorId },
        isActive: true,
      },
      include: {
        doctorWorkplace: {
          include: {
            hospital: true,
            branch: true,
            specialty: true,
          },
        },
      },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id },
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            hospital: true,
            branch: true,
            specialty: true,
          },
        },
      },
    });
    if (!schedule) {
      throw new NotFoundException('Lịch làm việc không tồn tại');
    }
    return schedule;
  }

  async update(id: string, updateDto: UpdateScheduleDto) {
    const schedule = await this.findOne(id);

    const startTime = updateDto.startTime || schedule.startTime;
    const endTime = updateDto.endTime || schedule.endTime;
    const breakStart = updateDto.breakStart !== undefined ? updateDto.breakStart : schedule.breakStart;
    const breakEnd = updateDto.breakEnd !== undefined ? updateDto.breakEnd : schedule.breakEnd;

    if (startTime >= endTime) {
      throw new ConflictException('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
    }

    if (breakStart || breakEnd) {
      if (!breakStart || !breakEnd) {
        throw new ConflictException('Phải nhập đầy đủ giờ bắt đầu và kết thúc nghỉ giữa ca');
      }
      if (breakStart >= breakEnd) {
        throw new ConflictException('Giờ bắt đầu nghỉ phải nhỏ hơn giờ kết thúc nghỉ');
      }
      if (breakStart < startTime || breakEnd > endTime) {
        throw new ConflictException('Giờ nghỉ trưa phải nằm trong khoảng giờ làm việc');
      }
    }

    if (updateDto.doctorWorkplaceId && updateDto.dayOfWeek !== undefined) {
      const existing = await this.prisma.doctorSchedule.findUnique({
        where: {
          doctorWorkplaceId_dayOfWeek: {
            doctorWorkplaceId: updateDto.doctorWorkplaceId,
            dayOfWeek: updateDto.dayOfWeek,
          },
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Nơi làm việc đã có lịch làm việc cho ngày này trong tuần');
      }
    }

    const updated = await this.prisma.doctorSchedule.update({
      where: { id },
      data: updateDto,
      include: {
        doctorWorkplace: {
          include: {
            doctor: true,
            hospital: true,
            branch: true,
            specialty: true,
          },
        },
      },
    });

    // Đồng bộ: Vô hiệu hóa các slot chưa đặt trong tương lai khi Admin thay đổi lịch
    await this.purgeFutureUnbookedSlots(schedule.doctorWorkplaceId, schedule.dayOfWeek);

    return updated;
  }

  async remove(id: string) {
    const schedule = await this.findOne(id);
    await this.prisma.doctorSchedule.update({
      where: { id },
      data: { isActive: false },
    });

    // Đồng bộ: Vô hiệu hóa các slot chưa đặt trong tương lai khi Admin xóa/tắt ca
    await this.purgeFutureUnbookedSlots(schedule.doctorWorkplaceId, schedule.dayOfWeek);
  }

  private async purgeFutureUnbookedSlots(doctorWorkplaceId: string, dayOfWeek: number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureSlots = await this.prisma.appointmentSlot.findMany({
        where: {
          doctorWorkplaceId,
          startTime: { gte: today },
          bookedCount: 0,
        },
      });

      const slotIdsToDeactivate = futureSlots
        .filter((slot) => {
          const slotDate = new Date(slot.startTime);
          return slotDate.getDay() === dayOfWeek;
        })
        .map((s) => s.id);

      if (slotIdsToDeactivate.length > 0) {
        await this.prisma.appointmentSlot.updateMany({
          where: { id: { in: slotIdsToDeactivate } },
          data: {
            isActive: false,
            isAvailable: false,
          },
        });
      }
    } catch (e) {
      console.error('Error purging future unbooked slots:', e);
    }
  }
}
