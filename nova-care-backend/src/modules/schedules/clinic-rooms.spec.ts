import { ClinicRoomsController } from './clinic-rooms.module';
import { AFTER_HOURS_SERVICE_NAME } from './after-hours.constants';

describe('Clinic room scheduling', () => {
  const room = { id: 'room', hospitalId: 'hospital', specialtyId: 'specialty', isActive: true };
  const service = { id: 'service', hospitalId: 'hospital', specialtyId: 'specialty', isActive: true, duration: 60, name: AFTER_HOURS_SERVICE_NAME, price: 270000 };
  const dto = { roomId: 'room', medicalServiceId: 'service', slotId: 'slot', mode: 'AFTER_HOURS', capacity: 3 };
  const req = { user: { role: 'ADMIN' } };
  function setup(start: string, overrides = {}) {
    const slot = { id: 'slot', startTime: new Date(start), endTime: new Date(new Date(start).getTime() + 3600000), bookedCount: 0, isActive: true, isAvailable: true, status: 'AVAILABLE', doctorWorkplace: { hospitalId: 'hospital', specialtyId: 'specialty' }, ...overrides };
    const tx = { $queryRaw: jest.fn(), clinicRoom: { findUnique: jest.fn().mockResolvedValue(room) }, medicalService: { findUnique: jest.fn().mockResolvedValue(service) }, appointmentSlot: { findUnique: jest.fn().mockResolvedValue(slot), findMany: jest.fn().mockResolvedValue([slot]), update: jest.fn() }, afterHoursSpecialtyConfig: { findFirst: jest.fn().mockResolvedValue({ id: 'config' }) }, clinicRoomSession: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'session' }) } };
    const prisma = { $transaction: (fn: any) => fn(tx) };
    return { controller: new ClinicRoomsController(prisma as any), tx };
  }
  it('accepts an existing Saturday session and sets capacity', async () => {
    const { controller, tx } = setup('2099-10-10T01:00:00Z');
    // Pick a Saturday without depending on the current year.
    const saturday = new Date('2099-10-10T01:00:00Z');
    saturday.setUTCDate(saturday.getUTCDate() + (6 - saturday.getUTCDay() + 7) % 7);
    tx.appointmentSlot.findUnique.mockResolvedValue({ ...(await tx.appointmentSlot.findUnique()), startTime: saturday, endTime: new Date(saturday.getTime() + 3600000) });
    await expect(controller.assign(req, dto)).resolves.toEqual({ data: { id: 'session' } });
    expect(tx.appointmentSlot.update).toHaveBeenCalledWith({ where: { id: 'slot' }, data: { capacity: 3 } });
  });
  it('rejects weekdays for after-hours', async () => {
    const { controller } = setup('2099-10-05T01:00:00Z'); // Monday
    await expect(controller.assign(req, dto)).rejects.toThrow();
  });
  it('rejects occupied slots', async () => {
    const { controller } = setup('2099-10-10T01:00:00Z', { bookedCount: 1 });
    await expect(controller.assign(req, dto)).rejects.toThrow();
  });
  it('rejects overlapping room sessions', async () => {
    const { controller, tx } = setup('2099-10-10T01:00:00Z');
    tx.clinicRoomSession.findFirst.mockResolvedValue({ id: 'other' } as any);
    await expect(controller.assign(req, { ...dto, mode: 'SERVICE' })).rejects.toThrow();
  });
  it('rejects a workplace from a different hospital', async () => {
    const { controller } = setup('2099-10-10T01:00:00Z', { doctorWorkplace: { hospitalId: 'other', specialtyId: 'specialty' } });
    await expect(controller.assign(req, { ...dto, mode: 'SERVICE' })).rejects.toThrow();
  });

  it('returns only persistent room sessions and never creates virtual rooms', async () => {
    const startTime = new Date('2099-10-05T01:00:00Z');
    const workplace = {
      id: 'workplace',
      hospitalId: 'hospital',
      specialtyId: 'specialty',
      position: 'Phòng khám Tim mạch',
      doctor: { title: 'BS.', fullName: 'Nguyễn An' },
      hospital: { id: 'hospital', name: 'Nova Central' },
      specialty: { id: 'specialty', name: 'Tim mạch' },
    };
    const slot = {
      id: 'slot',
      doctorWorkplaceId: workplace.id,
      startTime,
      endTime: new Date(startTime.getTime() + 30 * 60 * 1000),
      bookedCount: 0,
      capacity: 1,
      doctorWorkplace: workplace,
    };
    const catalogService = {
      id: 'service',
      hospitalId: 'hospital',
      specialtyId: 'specialty',
      name: 'Khám Tim mạch',
      duration: 30,
      price: 200000,
      isActive: true,
      specialty: workplace.specialty,
    };
    const persistentSession = { id: 'session', mode: 'SERVICE', room, service: catalogService, slot };
    const prisma = { clinicRoomSession: { findMany: jest.fn().mockResolvedValue([persistentSession]) } };

    const response = await new ClinicRoomsController(prisma as any).catalog('hospital', 'SERVICE');

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({ id: 'session', room: { id: 'room' }, service: { id: 'service' }, slot: { id: 'slot' } });
  });
});
