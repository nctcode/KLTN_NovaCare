import { PrismaClient, SlotStatus } from '@prisma/client';

const prisma = new PrismaClient();

const AFTER_HOURS_SERVICE_NAME = 'Khám dịch vụ ngoài giờ';
const AFTER_HOURS_PRICE = 270_000;
const AFTER_HOURS_DURATION = 60;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7
const DAYS_AHEAD = 14;
const ROOM_SESSION_CAPACITY = 5;

type TimedSlot = { id: string; startTime: Date; endTime: Date };

function contiguousSlotWindow<T extends TimedSlot>(slots: T[], durationMinutes: number): T[] {
  if (!slots.length || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return [];
  const selected: T[] = [];
  let coveredMs = 0;
  for (const slot of slots) {
    if (selected.length && selected[selected.length - 1].endTime.getTime() !== slot.startTime.getTime()) {
      return [];
    }
    const lengthMs = slot.endTime.getTime() - slot.startTime.getTime();
    if (lengthMs <= 0) return [];
    selected.push(slot);
    coveredMs += lengthMs;
    if (coveredMs >= durationMinutes * 60_000) return selected;
  }
  return [];
}

function vnDateParts(date: Date) {
  const vn = new Date(date.getTime() + VN_OFFSET_MS);
  return {
    year: vn.getUTCFullYear(),
    month: vn.getUTCMonth(),
    day: vn.getUTCDate(),
    dow: vn.getUTCDay(), // 0 = Sun, 6 = Sat
  };
}

function vnDateTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0) - VN_OFFSET_MS);
}

function vnDayKey(date: Date): string {
  const p = vnDateParts(date);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

async function main() {
  console.log('🏥 Bắt đầu khởi tạo phòng khám & phiên khám Dịch vụ / Ngoài giờ cho toàn bộ bệnh viện...');

  const hospitals = await prisma.hospital.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  if (!hospitals.length) {
    console.log('⚠️ Không tìm thấy bệnh viện nào đang hoạt động.');
    return;
  }

  const now = new Date();
  const baseVn = vnDateParts(now);

  // Build list of upcoming 14 VN dates (starting from tomorrow so every slot is strictly > now)
  const upcomingDays: Array<{ year: number; month: number; day: number; dow: number; dateOnly: Date }> = [];
  for (let offset = 1; offset <= DAYS_AHEAD; offset++) {
    const dt = new Date(Date.UTC(baseVn.year, baseVn.month, baseVn.day + offset, 0, 0, 0, 0));
    upcomingDays.push({
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth(),
      day: dt.getUTCDate(),
      dow: dt.getUTCDay(),
      dateOnly: dt,
    });
  }

  let totalRooms = 0;
  let totalAfterHoursConfigs = 0;
  let totalAfterHoursServices = 0;
  let totalCreatedSlots = 0;
  let totalServiceSessions = 0;
  let totalAfterHoursSessions = 0;

  for (const hospital of hospitals) {
    const hospitalSpecialties = await prisma.hospitalSpecialty.findMany({
      where: { hospitalId: hospital.id, isActive: true, specialty: { isActive: true } },
      include: { specialty: true },
      orderBy: { specialty: { name: 'asc' } },
    });

    let hospRooms = 0;
    let hospServiceSessions = 0;
    let hospAfterHoursSessions = 0;

    for (let sIdx = 0; sIdx < hospitalSpecialties.length; sIdx++) {
      const { specialtyId, specialty } = hospitalSpecialties[sIdx];
      const specCode = String(sIdx + 1).padStart(2, '0');

      // 1. Enable AfterHoursSpecialtyConfig for every specialty in hospital
      await prisma.afterHoursSpecialtyConfig.upsert({
        where: { hospitalId_specialtyId: { hospitalId: hospital.id, specialtyId } },
        create: { hospitalId: hospital.id, specialtyId, isActive: true },
        update: { isActive: true },
      });
      totalAfterHoursConfigs++;

      // 2. Ensure AFTER_HOURS MedicalService (270.000đ, 60 phút)
      const existingAfterHoursSvc = await prisma.medicalService.findFirst({
        where: { hospitalId: hospital.id, specialtyId, name: AFTER_HOURS_SERVICE_NAME },
      });
      const afterHoursService = existingAfterHoursSvc
        ? await prisma.medicalService.update({
            where: { id: existingAfterHoursSvc.id },
            data: {
              price: AFTER_HOURS_PRICE,
              duration: AFTER_HOURS_DURATION,
              description: 'Dịch vụ khám ngoài giờ áp dụng thứ bảy và chủ nhật.',
              isActive: true,
            },
          })
        : await prisma.medicalService.create({
            data: {
              hospitalId: hospital.id,
              specialtyId,
              name: AFTER_HOURS_SERVICE_NAME,
              description: 'Dịch vụ khám ngoài giờ áp dụng thứ bảy và chủ nhật.',
              price: AFTER_HOURS_PRICE,
              duration: AFTER_HOURS_DURATION,
              isActive: true,
            },
          });
      totalAfterHoursServices++;

      // 3. Ensure at least one standard SERVICE MedicalService for this specialty
      let standardServices = await prisma.medicalService.findMany({
        where: {
          hospitalId: hospital.id,
          specialtyId,
          isActive: true,
          NOT: { name: AFTER_HOURS_SERVICE_NAME },
        },
        orderBy: { name: 'asc' },
      });
      if (!standardServices.length) {
        const createdSvc = await prisma.medicalService.create({
          data: {
            hospitalId: hospital.id,
            specialtyId,
            name: `Khám dịch vụ ${specialty.name}`,
            description: `Khám và tư vấn chuyên sâu chuyên khoa ${specialty.name} theo yêu cầu.`,
            price: 250_000,
            duration: 30,
            isActive: true,
          },
        });
        standardServices = [createdSvc];
      }

      // 4. Upsert 2 ClinicRooms per (hospital, specialty): 1 for SERVICE, 1 for AFTER_HOURS
      const serviceRoom = await prisma.clinicRoom.upsert({
        where: { hospitalId_code: { hospitalId: hospital.id, code: `DV-${specCode}-01` } },
        create: {
          hospitalId: hospital.id,
          specialtyId,
          code: `DV-${specCode}-01`,
          name: `Phòng khám Dịch vụ ${specialty.name} 01`,
          isActive: true,
        },
        update: {
          specialtyId,
          name: `Phòng khám Dịch vụ ${specialty.name} 01`,
          isActive: true,
        },
      });

      const afterHoursRoom = await prisma.clinicRoom.upsert({
        where: { hospitalId_code: { hospitalId: hospital.id, code: `NG-${specCode}-01` } },
        create: {
          hospitalId: hospital.id,
          specialtyId,
          code: `NG-${specCode}-01`,
          name: `Phòng khám Ngoài giờ ${specialty.name} 01`,
          isActive: true,
        },
        update: {
          specialtyId,
          name: `Phòng khám Ngoài giờ ${specialty.name} 01`,
          isActive: true,
        },
      });
      hospRooms += 2;
      totalRooms += 2;

      // 5. Find active DoctorWorkplaces for this (hospital, specialty)
      const workplaces = await prisma.doctorWorkplace.findMany({
        where: { hospitalId: hospital.id, specialtyId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!workplaces.length) continue;

      // Use primary workplace for SERVICE room and second (or same) workplace for AFTER_HOURS room
      const serviceWorkplace = workplaces[0];
      const afterHoursWorkplace = workplaces.length > 1 ? workplaces[1] : workplaces[0];

      // 6. Ensure contiguous 30-min slots exist for upcoming 14 days (weekdays for serviceWorkplace, weekends for afterHoursWorkplace)
      const slotsToCreate: Array<{
        doctorWorkplaceId: string;
        date: Date;
        startTime: Date;
        endTime: Date;
        capacity: number;
        bookedCount: number;
        isAvailable: boolean;
        isActive: boolean;
        status: SlotStatus;
      }> = [];

      const slotStartTimes: Array<[number, number]> = [
        [8, 0], [8, 30], [9, 0], [9, 30], [10, 0], [10, 30], [11, 0], [11, 30],
        [13, 30], [14, 0], [14, 30], [15, 0], [15, 30], [16, 0], [16, 30], [17, 0],
      ];

      for (const d of upcomingDays) {
        const isWeekend = d.dow === 0 || d.dow === 6;
        const targetWp = isWeekend ? afterHoursWorkplace : serviceWorkplace;
        for (const [hh, mm] of slotStartTimes) {
          const startTime = vnDateTimeToUtc(d.year, d.month, d.day, hh, mm);
          const endTime = new Date(startTime.getTime() + 30 * 60_000);
          slotsToCreate.push({
            doctorWorkplaceId: targetWp.id,
            date: d.dateOnly,
            startTime,
            endTime,
            capacity: ROOM_SESSION_CAPACITY,
            bookedCount: 0,
            isAvailable: true,
            isActive: true,
            status: SlotStatus.AVAILABLE,
          });
        }
      }

      if (slotsToCreate.length) {
        const created = await prisma.appointmentSlot.createMany({
          data: slotsToCreate,
          skipDuplicates: true,
        });
        totalCreatedSlots += created.count;
      }

      // Helper to assign non-overlapping room sessions for a given mode
      const assignModeSessions = async (
        mode: 'SERVICE' | 'AFTER_HOURS',
        roomId: string,
        workplaceId: string,
        servicesPool: typeof standardServices,
        maxPerDay: number,
      ): Promise<number> => {
        const candidateSlots = await prisma.appointmentSlot.findMany({
          where: {
            doctorWorkplaceId: workplaceId,
            startTime: { gt: new Date() },
            status: SlotStatus.AVAILABLE,
            isActive: true,
            isAvailable: true,
            bookedCount: 0,
          },
          include: { roomSession: true },
          orderBy: { startTime: 'asc' },
        });

        const existingRoomSessions = await prisma.clinicRoomSession.findMany({
          where: { roomId, slot: { startTime: { gt: new Date() } } },
          include: { slot: true, service: true },
        });
        const occupiedRoomIntervals: Array<{ start: number; end: number }> = existingRoomSessions.map((s) => ({
          start: s.slot.startTime.getTime(),
          end: s.slot.startTime.getTime() + s.service.duration * 60_000,
        }));

        const occupiedSlotIds = new Set<string>(
          candidateSlots.filter((s) => s.roomSession !== null).map((s) => s.id),
        );

        // Group candidate slots by VN day
        const byDay = new Map<string, typeof candidateSlots>();
        for (const slot of candidateSlots) {
          const dow = vnDateParts(slot.startTime).dow;
          const isWeekend = dow === 0 || dow === 6;
          if (mode === 'AFTER_HOURS' && !isWeekend) continue;
          if (mode === 'SERVICE' && isWeekend) continue;
          const key = vnDayKey(slot.startTime);
          const list = byDay.get(key) || [];
          list.push(slot);
          byDay.set(key, list);
        }

        let createdCount = 0;
        let svcCursor = 0;
        const sessionsToInsert: Array<{
          roomId: string;
          medicalServiceId: string;
          slotId: string;
          mode: string;
        }> = [];
        const slotIdsToSetCapacity: string[] = [];

        for (const [, daySlots] of byDay) {
          let dayAssigned = 0;
          let i = 0;
          while (i < daySlots.length && dayAssigned < maxPerDay) {
            const service = servicesPool[svcCursor % servicesPool.length];
            const windowSlots = contiguousSlotWindow(daySlots.slice(i), service.duration);
            if (!windowSlots.length) {
              i++;
              continue;
            }
            const hasOccupiedSlot = windowSlots.some((w) => occupiedSlotIds.has(w.id));
            const winStart = windowSlots[0].startTime.getTime();
            const winEnd = winStart + service.duration * 60_000;
            const hasRoomOverlap = occupiedRoomIntervals.some((iv) => iv.start < winEnd && iv.end > winStart);

            if (hasOccupiedSlot || hasRoomOverlap) {
              i++;
              continue;
            }

            sessionsToInsert.push({
              roomId,
              medicalServiceId: service.id,
              slotId: windowSlots[0].id,
              mode,
            });
            slotIdsToSetCapacity.push(windowSlots[0].id);
            windowSlots.forEach((w) => occupiedSlotIds.add(w.id));
            occupiedRoomIntervals.push({ start: winStart, end: winEnd });

            dayAssigned++;
            createdCount++;
            svcCursor++;
            // Advance past all slots consumed by this session + leave 1 gap slot so schedule looks natural
            i += windowSlots.length;
          }
        }

        if (slotIdsToSetCapacity.length) {
          await prisma.appointmentSlot.updateMany({
            where: { id: { in: slotIdsToSetCapacity }, bookedCount: 0 },
            data: { capacity: ROOM_SESSION_CAPACITY },
          });
        }
        if (sessionsToInsert.length) {
          await prisma.clinicRoomSession.createMany({
            data: sessionsToInsert,
            skipDuplicates: true,
          });
        }
        return createdCount;
      };

      // Assign SERVICE sessions (6 sessions/weekday) & AFTER_HOURS sessions (6 sessions/weekend day)
      const svcCount = await assignModeSessions('SERVICE', serviceRoom.id, serviceWorkplace.id, standardServices, 6);
      const ahCount = await assignModeSessions('AFTER_HOURS', afterHoursRoom.id, afterHoursWorkplace.id, [afterHoursService], 6);

      hospServiceSessions += svcCount;
      hospAfterHoursSessions += ahCount;
      totalServiceSessions += svcCount;
      totalAfterHoursSessions += ahCount;
    }

    console.log(
      `✅ ${hospital.name}: ${hospRooms} phòng khám | +${hospServiceSessions} phiên Dịch vụ | +${hospAfterHoursSessions} phiên Ngoài giờ`,
    );
  }

  console.log('\n🎉 HOÀN TẤT KHỞI TẠO DỮ LIỆU PHÒNG KHÁM DỊCH VỤ & NGOÀI GIỜ:');
  console.log(`   - Tổng bệnh viện: ${hospitals.length}`);
  console.log(`   - Tổng phòng khám đã thiết lập: ${totalRooms}`);
  console.log(`   - Chuyên khoa bật ngoài giờ: ${totalAfterHoursConfigs}`);
  console.log(`   - Dịch vụ ngoài giờ (270.000đ / 60p): ${totalAfterHoursServices}`);
  console.log(`   - Slot bổ sung (bao gồm Thứ 7 & Chủ nhật): ${totalCreatedSlots}`);
  console.log(`   - Phiên khám Dịch vụ (SERVICE) mới: ${totalServiceSessions}`);
  console.log(`   - Phiên khám Ngoài giờ (AFTER_HOURS) mới: ${totalAfterHoursSessions}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khởi tạo phòng khám:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
