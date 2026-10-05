import { AppointmentsService } from './appointments.service';

describe('Patient cancellation deadline', () => {
  const start = new Date('2026-10-02T07:00:00Z'); // 14:00 Vietnam
  let service: AppointmentsService;
  let appointment: any;
  let db: any;

  beforeEach(() => {
    jest.useFakeTimers();
    appointment = { id: 'a', userId: 'u', bookingCode: 'TEST', status: 'PAID', slotId: 's', slot: { startTime: start }, medicalEncounter: null };
    db = {
      appointment: { findUnique: jest.fn(async () => appointment), update: jest.fn(async () => ({ ...appointment, status: 'CANCELLED' })) },
      appointmentSlotBooking: { findMany: jest.fn(async () => []) },
      appointmentSlot: { findUnique: jest.fn(async () => null) },
      appointmentStatusHistory: { create: jest.fn() },
      notification: { create: jest.fn() },
    };
    db.$transaction = jest.fn((fn) => fn(db));
    service = new AppointmentsService(db, {} as any);
  });
  afterEach(() => jest.useRealTimers());

  it.each(['2026-10-02T04:59:59Z', '2026-10-02T05:00:00Z'])('allows cancellation at %s and records a notification', async (time) => {
    jest.setSystemTime(new Date(time));
    await expect(service.cancel('a', 'u', { reason: 'Changed plans' })).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(db.notification.create).toHaveBeenCalledTimes(1);
  });

  it.each(['2026-10-02T05:00:01Z', '2026-10-02T08:24:00Z'])('rejects cancellation at %s without notification or mutation', async (time) => {
    jest.setSystemTime(new Date(time));
    await expect(service.cancel('a', 'u', { reason: 'Changed plans' })).rejects.toThrow('2 giờ');
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it('rejects cancellation after clinical reception even before the deadline', async () => {
    jest.setSystemTime(new Date('2026-10-02T04:00:00Z'));
    appointment.medicalEncounter = { status: 'IN_PROGRESS' };
    await expect(service.cancel('a', 'u', { reason: 'Changed plans' })).rejects.toThrow('tiếp nhận');
  });

  it('retains the existing unpaid reservation exception', async () => {
    jest.setSystemTime(new Date('2026-10-02T06:00:00Z'));
    appointment.status = 'AWAITING_PAYMENT';
    await expect(service.cancel('a', 'u', { reason: 'Changed plans' })).resolves.toMatchObject({ status: 'CANCELLED' });
  });
});
