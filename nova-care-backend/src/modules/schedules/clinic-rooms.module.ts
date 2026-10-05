import { BadRequestException, Body, Controller, Get, Module, Post, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsInt, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { PrismaService } from '@/database/prisma.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

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

@Controller('api/v1/clinic-rooms')
@UseGuards(JwtAuthGuard)
export class ClinicRoomsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('catalog')
  async catalog(@Query('hospitalId') hospitalId: string, @Query('mode') mode: string) {
    if (!hospitalId || !['SERVICE', 'AFTER_HOURS'].includes(mode)) throw new BadRequestException('Thiếu cơ sở hoặc hình thức khám');
    const sessions = await this.prisma.clinicRoomSession.findMany({
      where: { mode, room: { hospitalId, isActive: true }, service: { isActive: true },
        slot: { startTime: { gt: new Date() }, status: 'AVAILABLE', isActive: true, isAvailable: true } },
      include: { room: true, service: { include: { specialty: true } }, slot: { include: { doctorWorkplace: { include: { doctor: true, hospital: true, specialty: true } } } } },
      orderBy: { slot: { startTime: 'asc' } },
    });
    return { statusCode: 200, data: sessions.filter(s => s.slot.bookedCount < s.slot.capacity && (mode !== 'AFTER_HOURS' || [0, 6].includes(new Date(s.slot.startTime.getTime() + 25200000).getUTCDay()))) };
  }

  @Post()
  @UseGuards(RolesGuard) @Roles('ADMIN')
  async create(@Body() dto: RoomDto) {
    const linked = await this.prisma.hospitalSpecialty.findFirst({ where: { hospitalId: dto.hospitalId, specialtyId: dto.specialtyId, isActive: true } });
    if (!linked) throw new BadRequestException('Chuyên khoa không thuộc cơ sở');
    return { data: await this.prisma.clinicRoom.create({ data: dto }) };
  }

  @Post('sessions')
  @UseGuards(RolesGuard) @Roles('ADMIN')
  async assign(@Body() dto: RoomSessionDto) {
    return this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM clinic_rooms WHERE id = ${dto.roomId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM appointment_slots WHERE id = ${dto.slotId} FOR UPDATE`;
      const room = await tx.clinicRoom.findUnique({ where: { id: dto.roomId } });
      const service = await tx.medicalService.findUnique({ where: { id: dto.medicalServiceId } });
      const slot = await tx.appointmentSlot.findUnique({ where: { id: dto.slotId }, include: { doctorWorkplace: true } });
      if (slot && (!slot.isActive || !slot.isAvailable || slot.status !== 'AVAILABLE')) throw new BadRequestException('Khung giờ không mở đặt khám');
      if (!room?.isActive || !service?.isActive || !slot || slot.bookedCount || slot.startTime <= new Date()) throw new BadRequestException('Phòng, dịch vụ hoặc khung giờ không hợp lệ');
      if (service.hospitalId !== room.hospitalId || service.specialtyId !== room.specialtyId || slot.doctorWorkplace.hospitalId !== room.hospitalId || slot.doctorWorkplace.specialtyId !== room.specialtyId) throw new BadRequestException('Lịch trực, dịch vụ và phòng phải cùng cơ sở/chuyên khoa');
      if (slot.endTime.getTime() - slot.startTime.getTime() !== service.duration * 60000) throw new BadRequestException('Thời lượng khung giờ phải khớp dịch vụ');
      if (dto.mode === 'AFTER_HOURS' && ![0, 6].includes(new Date(slot.startTime.getTime() + 25200000).getUTCDay())) throw new BadRequestException('Khám ngoài giờ chỉ nhận lịch cuối tuần');
      const overlap = await tx.clinicRoomSession.findFirst({ where: { roomId: room.id, slot: { startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime } } } });
      if (overlap) throw new BadRequestException('Phòng đã có lịch trùng thời gian');
      await tx.appointmentSlot.update({ where: { id: slot.id }, data: { capacity: dto.capacity } });
      return { data: await tx.clinicRoomSession.create({ data: { roomId: dto.roomId, medicalServiceId: dto.medicalServiceId, slotId: dto.slotId, mode: dto.mode } }) };
    });
  }
}

@Module({ controllers: [ClinicRoomsController] })
export class ClinicRoomsModule {}
