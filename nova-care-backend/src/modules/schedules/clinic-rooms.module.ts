import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Module,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ArrayUnique, IsArray, IsIn, IsInt, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { PrismaService } from '@/database/prisma.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { contiguousSlotWindow } from './contiguous-slot-window';
import {
  AFTER_HOURS_DURATION,
  AFTER_HOURS_PRICE,
  AFTER_HOURS_SERVICE_NAME,
} from './after-hours.constants';

class RoomDto {
  @IsUUID() hospitalId: string;
  @IsUUID() specialtyId: string;
  @IsString() @MinLength(1) code: string;
  @IsString() @MinLength(1) name: string;
}

class RoomSessionDto {
  @IsUUID() roomId: string;
  @IsUUID() medicalServiceId: string;
  @IsUUID() slotId: string;
  @IsIn(['SERVICE', 'AFTER_HOURS']) mode: string;
  @IsInt() @Min(1) @Max(100) capacity: number;
}

class AfterHoursSpecialtiesDto {
  @IsUUID() hospitalId: string;
  @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) specialtyIds: string[];
}

@Controller('api/v1/clinic-rooms')
@UseGuards(JwtAuthGuard)
export class ClinicRoomsController {
  constructor(private readonly prisma: PrismaService) {}

  private scopedHospitalId(req: any, requested?: string): string {
    if (req.user?.role === 'HOSPITAL_ADMIN') {
      if (!req.user.hospitalId) throw new ForbiddenException('Tài khoản chưa liên kết với cơ sở y tế');
      if (requested && requested !== req.user.hospitalId) throw new ForbiddenException('Không có quyền quản lý cơ sở này');
      return req.user.hospitalId;
    }
    if (!requested) throw new BadRequestException('Thiếu cơ sở y tế');
    return requested;
  }

  private async ensureAfterHoursService(tx: any, hospitalId: string, specialtyId: string) {
    const existing = await tx.medicalService.findFirst({
      where: { hospitalId, specialtyId, name: AFTER_HOURS_SERVICE_NAME },
    });
    if (existing) {
      return tx.medicalService.update({
        where: { id: existing.id },
        data: { price: AFTER_HOURS_PRICE, duration: AFTER_HOURS_DURATION, isActive: true },
      });
    }
    return tx.medicalService.create({
      data: {
        hospitalId,
        specialtyId,
        name: AFTER_HOURS_SERVICE_NAME,
        description: 'Dịch vụ khám ngoài giờ áp dụng thứ bảy và chủ nhật.',
        price: AFTER_HOURS_PRICE,
        duration: AFTER_HOURS_DURATION,
        isActive: true,
      },
    });
  }

  @Get('catalog')
  async catalog(@Query('hospitalId') hospitalId: string, @Query('mode') mode: string) {
    if (!hospitalId || !['SERVICE', 'AFTER_HOURS'].includes(mode)) {
      throw new BadRequestException('Thiếu cơ sở hoặc hình thức khám');
    }
    const enabledSpecialtyIds = mode === 'AFTER_HOURS'
      ? (await this.prisma.afterHoursSpecialtyConfig.findMany({
          where: { hospitalId, isActive: true },
          select: { specialtyId: true },
        })).map((item) => item.specialtyId)
      : undefined;
    if (mode === 'AFTER_HOURS' && enabledSpecialtyIds?.length === 0) {
      return { statusCode: 200, data: [] };
    }
    const sessions = await this.prisma.clinicRoomSession.findMany({
      where: {
        mode,
        room: {
          hospitalId,
          isActive: true,
          ...(enabledSpecialtyIds ? { specialtyId: { in: enabledSpecialtyIds } } : {}),
        },
        service: {
          isActive: true,
          ...(mode === 'AFTER_HOURS' ? { name: AFTER_HOURS_SERVICE_NAME, price: AFTER_HOURS_PRICE } : {}),
        },
        slot: { startTime: { gt: new Date() }, status: 'AVAILABLE', isActive: true, isAvailable: true },
      },
      include: {
        room: true,
        service: { include: { specialty: true } },
        slot: { include: { doctorWorkplace: { include: { doctor: true, hospital: true, specialty: true } } } },
      },
      orderBy: { slot: { startTime: 'asc' } },
    });
    return {
      statusCode: 200,
      data: sessions
        .filter((session) =>
          session.slot.bookedCount < session.slot.capacity &&
          (mode !== 'AFTER_HOURS' || [0, 6].includes(new Date(session.slot.startTime.getTime() + 25_200_000).getUTCDay())),
        )
        .map((session) => ({
          ...session,
          slot: {
            ...session.slot,
            endTime: new Date(session.slot.startTime.getTime() + session.service.duration * 60_000),
          },
        })),
    };
  }

  @Get('management')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'HOSPITAL_ADMIN')
  async management(
    @Req() req: any,
    @Query('hospitalId') requestedHospitalId?: string,
    @Query('mode') requestedMode = 'SERVICE',
  ) {
    if (!['SERVICE', 'AFTER_HOURS'].includes(requestedMode)) {
      throw new BadRequestException('Hình thức quản lý phòng khám không hợp lệ');
    }
    const hospitalId = this.scopedHospitalId(req, requestedHospitalId);
    const mode = requestedMode as 'SERVICE' | 'AFTER_HOURS';
    const [hospital, hospitalSpecialties, configs, rooms, services, sessions, candidateSlots] = await Promise.all([
      this.prisma.hospital.findUnique({ where: { id: hospitalId }, select: { id: true, name: true } }),
      this.prisma.hospitalSpecialty.findMany({
        where: { hospitalId, isActive: true, specialty: { isActive: true } },
        include: { specialty: true },
        orderBy: { specialty: { name: 'asc' } },
      }),
      this.prisma.afterHoursSpecialtyConfig.findMany({ where: { hospitalId, isActive: true } }),
      this.prisma.clinicRoom.findMany({ where: { hospitalId, isActive: true }, orderBy: { code: 'asc' } }),
      this.prisma.medicalService.findMany({
        where: {
          hospitalId,
          isActive: true,
          ...(mode === 'AFTER_HOURS'
            ? { name: AFTER_HOURS_SERVICE_NAME, price: AFTER_HOURS_PRICE, duration: AFTER_HOURS_DURATION }
            : { NOT: { name: AFTER_HOURS_SERVICE_NAME } }),
        },
        include: { specialty: true },
        orderBy: [{ specialty: { name: 'asc' } }, { name: 'asc' }],
      }),
      this.prisma.clinicRoomSession.findMany({
        where: { mode, room: { hospitalId }, slot: { startTime: { gt: new Date() } } },
        include: {
          room: true,
          service: { include: { specialty: true } },
          slot: { include: { doctorWorkplace: { include: { doctor: true, specialty: true } } } },
        },
        orderBy: { slot: { startTime: 'asc' } },
      }),
      this.prisma.appointmentSlot.findMany({
        where: {
          startTime: { gt: new Date() }, status: 'AVAILABLE', isActive: true, isAvailable: true,
          roomSession: null,
          doctorWorkplace: { hospitalId, isActive: true },
        },
        include: { doctorWorkplace: { include: { doctor: true, specialty: true } } },
        orderBy: { startTime: 'asc' },
        take: 1000,
      }),
    ]);
    const enabled = new Set(configs.map((item) => item.specialtyId));
    const allowedSpecialties = mode === 'AFTER_HOURS'
      ? hospitalSpecialties.filter((item) => enabled.has(item.specialtyId))
      : hospitalSpecialties;
    const allowedIds = new Set(allowedSpecialties.map((item) => item.specialtyId));
    const slotsByWorkplace = new Map<string, typeof candidateSlots>();
    candidateSlots.forEach((slot) => {
      const group = slotsByWorkplace.get(slot.doctorWorkplaceId) || [];
      group.push(slot);
      slotsByWorkplace.set(slot.doctorWorkplaceId, group);
    });
    const compatibleSlots = candidateSlots.flatMap((slot) => {
      if (!allowedIds.has(slot.doctorWorkplace.specialtyId)) return [];
      const localDay = new Date(slot.startTime.getTime() + 25_200_000).getUTCDay();
      if (mode === 'AFTER_HOURS' && ![0, 6].includes(localDay)) return [];
      const workplaceSlots = slotsByWorkplace.get(slot.doctorWorkplaceId) || [];
      const startIndex = workplaceSlots.findIndex((item) => item.id === slot.id);
      const compatibleServiceIds = services
        .filter((service) => service.specialtyId === slot.doctorWorkplace.specialtyId)
        .filter((service) => contiguousSlotWindow(workplaceSlots.slice(startIndex), service.duration).length > 0)
        .map((service) => service.id);
      return compatibleServiceIds.length ? [{ ...slot, compatibleServiceIds }] : [];
    });
    return {
      statusCode: 200,
      data: {
        hospital,
        mode,
        fixedPrice: AFTER_HOURS_PRICE,
        duration: AFTER_HOURS_DURATION,
        specialties: hospitalSpecialties.map((item) => ({
          ...item.specialty,
          enabled: mode === 'SERVICE' || enabled.has(item.specialtyId),
        })),
        rooms,
        services,
        sessions,
        candidateSlots: compatibleSlots,
      },
    };
  }

  @Get('after-hours-config')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'HOSPITAL_ADMIN')
  async afterHoursConfig(@Req() req: any, @Query('hospitalId') requestedHospitalId?: string) {
    return this.management(req, requestedHospitalId, 'AFTER_HOURS');
  }

  @Post('after-hours-config')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'HOSPITAL_ADMIN')
  async saveAfterHoursConfig(@Req() req: any, @Body() dto: AfterHoursSpecialtiesDto) {
    const hospitalId = this.scopedHospitalId(req, dto.hospitalId);
    const linked = await this.prisma.hospitalSpecialty.findMany({
      where: { hospitalId, specialtyId: { in: dto.specialtyIds }, isActive: true },
      select: { specialtyId: true },
    });
    if (linked.length !== dto.specialtyIds.length) throw new BadRequestException('Có chuyên khoa không thuộc cơ sở');
    await this.prisma.$transaction(async (tx) => {
      await tx.afterHoursSpecialtyConfig.updateMany({ where: { hospitalId }, data: { isActive: false } });
      for (const specialtyId of dto.specialtyIds) {
        await tx.afterHoursSpecialtyConfig.upsert({
          where: { hospitalId_specialtyId: { hospitalId, specialtyId } },
          create: { hospitalId, specialtyId, isActive: true },
          update: { isActive: true },
        });
        await this.ensureAfterHoursService(tx, hospitalId, specialtyId);
      }
    });
    return this.afterHoursConfig(req, hospitalId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'HOSPITAL_ADMIN')
  async create(@Req() req: any, @Body() dto: RoomDto) {
    const hospitalId = this.scopedHospitalId(req, dto.hospitalId);
    const linked = await this.prisma.hospitalSpecialty.findFirst({
      where: { hospitalId, specialtyId: dto.specialtyId, isActive: true },
    });
    if (!linked) throw new BadRequestException('Chuyên khoa không thuộc cơ sở');
    return { data: await this.prisma.clinicRoom.create({ data: { ...dto, hospitalId } }) };
  }

  @Post('sessions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'HOSPITAL_ADMIN')
  async assign(@Req() req: any, @Body() dto: RoomSessionDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM clinic_rooms WHERE id = ${dto.roomId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM appointment_slots WHERE id = ${dto.slotId} FOR UPDATE`;
      const room = await tx.clinicRoom.findUnique({ where: { id: dto.roomId } });
      if (!room) throw new BadRequestException('Phòng khám không tồn tại');
      this.scopedHospitalId(req, room.hospitalId);
      const service = await tx.medicalService.findUnique({ where: { id: dto.medicalServiceId } });
      const slot = await tx.appointmentSlot.findUnique({
        where: { id: dto.slotId }, include: { doctorWorkplace: true },
      });
      if (slot && (!slot.isActive || !slot.isAvailable || slot.status !== 'AVAILABLE')) {
        throw new BadRequestException('Khung giờ không mở đặt khám');
      }
      if (!room.isActive || !service?.isActive || !slot || slot.bookedCount || slot.startTime <= new Date()) {
        throw new BadRequestException('Phòng, dịch vụ hoặc khung giờ không hợp lệ');
      }
      if (service.hospitalId !== room.hospitalId || service.specialtyId !== room.specialtyId ||
          slot.doctorWorkplace.hospitalId !== room.hospitalId || slot.doctorWorkplace.specialtyId !== room.specialtyId) {
        throw new BadRequestException('Lịch trực, dịch vụ và phòng phải cùng cơ sở/chuyên khoa');
      }
      const workplaceSlots = await tx.appointmentSlot.findMany({
        where: {
          doctorWorkplaceId: slot.doctorWorkplaceId,
          startTime: { gte: slot.startTime },
          isActive: true,
          isAvailable: true,
          status: 'AVAILABLE',
        },
        orderBy: { startTime: 'asc' },
        take: 96,
      });
      const requiredSlots = contiguousSlotWindow(workplaceSlots, service.duration);
      if (!requiredSlots.length) {
        throw new BadRequestException('Không đủ khung giờ liên tiếp cho thời lượng dịch vụ');
      }
      const occupiedContinuation = await tx.clinicRoomSession.findFirst({
        where: { slotId: { in: requiredSlots.slice(1).map((item) => item.id) } },
      });
      if (occupiedContinuation) {
        throw new BadRequestException('Khung giờ liên tiếp đã được phân cho dịch vụ khác');
      }
      if (dto.mode === 'AFTER_HOURS') {
        const day = new Date(slot.startTime.getTime() + 25_200_000).getUTCDay();
        if (![0, 6].includes(day)) throw new BadRequestException('Khám ngoài giờ chỉ nhận lịch thứ bảy và chủ nhật');
        const enabled = await tx.afterHoursSpecialtyConfig.findFirst({
          where: { hospitalId: room.hospitalId, specialtyId: room.specialtyId, isActive: true },
        });
        if (!enabled) throw new BadRequestException('Chuyên khoa chưa được bật khám ngoài giờ');
        if (service.name !== AFTER_HOURS_SERVICE_NAME || Number(service.price) !== AFTER_HOURS_PRICE) {
          throw new BadRequestException('Dịch vụ ngoài giờ phải dùng mức giá chung 270.000đ');
        }
      }
      const overlap = await tx.clinicRoomSession.findFirst({
        where: { roomId: room.id, slot: { startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime } } },
      });
      if (overlap) throw new BadRequestException('Phòng đã có lịch trùng thời gian');
      await tx.appointmentSlot.update({ where: { id: slot.id }, data: { capacity: dto.capacity } });
      return {
        data: await tx.clinicRoomSession.create({
          data: { roomId: dto.roomId, medicalServiceId: dto.medicalServiceId, slotId: dto.slotId, mode: dto.mode },
        }),
      };
    });
  }

  @Delete('sessions/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'HOSPITAL_ADMIN')
  async removeSession(@Req() req: any, @Param('id') id: string) {
    const session = await this.prisma.clinicRoomSession.findUnique({
      where: { id }, include: { room: true, slot: true },
    });
    if (!session) throw new BadRequestException('Lịch ngoài giờ không tồn tại');
    this.scopedHospitalId(req, session.room.hospitalId);
    if (session.slot.bookedCount > 0 || session.slot.startTime <= new Date()) {
      throw new BadRequestException('Không thể xóa lịch đã có người đặt hoặc đã diễn ra');
    }
    await this.prisma.clinicRoomSession.delete({ where: { id } });
    return { statusCode: 200, message: 'Đã xóa lịch ngoài giờ' };
  }
}

@Module({ controllers: [ClinicRoomsController] })
export class ClinicRoomsModule {}
