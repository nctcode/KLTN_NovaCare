import { AdminAppointmentsService } from './admin-appointments.service';
import { AppointmentStatus } from '@prisma/client';

describe('AdminAppointmentsService - NO_SHOW Workflow & Policy Enforcement', () => {
  let service: AdminAppointmentsService;
  let db: any;
  let auditLogService: any;

  const baseStartTime = new Date('2026-10-09T08:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    auditLogService = { logAction: jest.fn() };
    db = {
      appointment: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      hospitalBookingConfig: {
        findFirst: jest.fn().mockResolvedValue({
          gracePeriodMinutes: 15,
          minContactAttempts: 2,
          minContactIntervalMinutes: 5,
        }),
      },
      appointmentContactLog: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      appointmentStatusHistory: {
        create: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(db)),
    };
    service = new AdminAppointmentsService(db, auditLogService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects NO_SHOW when appointment time has not arrived yet', async () => {
    // Current time: 07:50 (10 minutes before slot start)
    jest.setSystemTime(new Date('2026-10-09T07:50:00.000Z'));

    db.appointment.findUnique.mockResolvedValue({
      id: 'apt-1',
      bookingCode: 'NOVA-101',
      status: AppointmentStatus.CONFIRMED,
      checkInAt: null,
      medicalEncounter: null,
      contactLogs: [],
      slot: {
        startTime: baseStartTime,
        doctorWorkplace: { hospitalId: 'hosp-1' },
      },
    });

    const eligibility = await service.validateNoShowEligibility('apt-1');
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons.some((r: string) => r.includes('thời gian ân hạn'))).toBe(true);

    await expect(service.updateStatus('apt-1', AppointmentStatus.NO_SHOW)).rejects.toThrow(
      'Không đủ điều kiện xác nhận NO_SHOW'
    );
  });

  it('rejects NO_SHOW during the grace period (e.g. 10 mins into a 15-min grace period)', async () => {
    // Current time: 08:10 (slot start was 08:00, grace is 15m, grace end is 08:15)
    jest.setSystemTime(new Date('2026-10-09T08:10:00.000Z'));

    db.appointment.findUnique.mockResolvedValue({
      id: 'apt-2',
      bookingCode: 'NOVA-102',
      status: AppointmentStatus.CONFIRMED,
      checkInAt: null,
      medicalEncounter: null,
      contactLogs: [
        { id: 'c1', contactedAt: new Date('2026-10-09T08:02:00.000Z') },
        { id: 'c2', contactedAt: new Date('2026-10-09T08:08:00.000Z') },
      ],
      slot: {
        startTime: baseStartTime,
        doctorWorkplace: { hospitalId: 'hosp-1' },
      },
    });

    const eligibility = await service.validateNoShowEligibility('apt-2');
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons.some((r: string) => r.includes('Chưa hết thời gian ân hạn'))).toBe(true);

    await expect(service.updateStatus('apt-2', AppointmentStatus.NO_SHOW)).rejects.toThrow('Chưa hết thời gian ân hạn');
  });

  it('rejects NO_SHOW if patient has checked in at reception', async () => {
    // Current time: 08:30 (past grace period)
    jest.setSystemTime(new Date('2026-10-09T08:30:00.000Z'));

    db.appointment.findUnique.mockResolvedValue({
      id: 'apt-3',
      bookingCode: 'NOVA-103',
      status: AppointmentStatus.CONFIRMED,
      checkInAt: new Date('2026-10-09T08:05:00.000Z'),
      medicalEncounter: null,
      contactLogs: [
        { id: 'c1', contactedAt: new Date('2026-10-09T08:16:00.000Z') },
        { id: 'c2', contactedAt: new Date('2026-10-09T08:22:00.000Z') },
      ],
      slot: {
        startTime: baseStartTime,
        doctorWorkplace: { hospitalId: 'hosp-1' },
      },
    });

    const eligibility = await service.validateNoShowEligibility('apt-3');
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons.some((r: string) => r.includes('check-in'))).toBe(true);

    await expect(service.updateStatus('apt-3', AppointmentStatus.NO_SHOW)).rejects.toThrow('check-in');
  });

  it('rejects NO_SHOW if minimum contact attempts requirement is not met', async () => {
    // Past grace period: 08:20, but only 1 call made (min requires 2)
    jest.setSystemTime(new Date('2026-10-09T08:20:00.000Z'));

    db.appointment.findUnique.mockResolvedValue({
      id: 'apt-4',
      bookingCode: 'NOVA-104',
      status: AppointmentStatus.CONFIRMED,
      checkInAt: null,
      medicalEncounter: null,
      contactLogs: [
        { id: 'c1', contactedAt: new Date('2026-10-09T08:16:00.000Z') },
      ],
      slot: {
        startTime: baseStartTime,
        doctorWorkplace: { hospitalId: 'hosp-1' },
      },
    });

    const eligibility = await service.validateNoShowEligibility('apt-4');
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons.some((r: string) => r.includes('Chưa đủ số lần liên hệ'))).toBe(true);
  });

  it('rejects NO_SHOW if interval between contact attempts is too short (< 5 mins)', async () => {
    jest.setSystemTime(new Date('2026-10-09T08:20:00.000Z'));

    db.appointment.findUnique.mockResolvedValue({
      id: 'apt-5',
      bookingCode: 'NOVA-105',
      status: AppointmentStatus.CONFIRMED,
      checkInAt: null,
      medicalEncounter: null,
      contactLogs: [
        { id: 'c1', contactedAt: new Date('2026-10-09T08:16:00.000Z') },
        { id: 'c2', contactedAt: new Date('2026-10-09T08:18:00.000Z') }, // only 2 mins later
      ],
      slot: {
        startTime: baseStartTime,
        doctorWorkplace: { hospitalId: 'hosp-1' },
      },
    });

    const eligibility = await service.validateNoShowEligibility('apt-5');
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons.some((r: string) => r.includes('Khoảng cách giữa 2 lần liên hệ'))).toBe(true);
  });

  it('successfully transitions to NO_SHOW when all policy conditions are met', async () => {
    // Current time: 08:30 (past 15-min grace period)
    jest.setSystemTime(new Date('2026-10-09T08:30:00.000Z'));

    const mockAppt = {
      id: 'apt-6',
      bookingCode: 'NOVA-106',
      status: AppointmentStatus.CONFIRMED,
      userId: 'user-patient',
      checkInAt: null,
      noShowAt: null,
      medicalEncounter: null,
      contactLogs: [
        { id: 'c1', contactedAt: new Date('2026-10-09T08:16:00.000Z') },
        { id: 'c2', contactedAt: new Date('2026-10-09T08:24:00.000Z') },
      ],
      slot: {
        startTime: baseStartTime,
        doctorWorkplace: { hospitalId: 'hosp-1' },
      },
    };

    db.appointment.findUnique.mockResolvedValue(mockAppt);
    db.appointment.update.mockResolvedValue({ ...mockAppt, status: AppointmentStatus.NO_SHOW });

    const result = await service.updateStatus('apt-6', AppointmentStatus.NO_SHOW, 'Liên hệ 2 lần không nhấc máy', 'admin-1');

    expect(result.status).toBe(AppointmentStatus.NO_SHOW);
    expect(db.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-6' },
        data: expect.objectContaining({
          status: AppointmentStatus.NO_SHOW,
          noShowAt: expect.any(Date),
        }),
      })
    );
    expect(db.appointmentStatusHistory.create).toHaveBeenCalled();
    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-patient',
          title: 'Thông báo lịch khám',
          content: expect.stringContaining('Cơ sở y tế đã ghi nhận bạn không đến khám'),
        }),
      })
    );
    expect(auditLogService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE_APPOINTMENT_STATUS',
        entityId: 'apt-6',
      })
    );
  });

  it('is idempotent when confirming NO_SHOW twice', async () => {
    db.appointment.findUnique.mockResolvedValue({
      id: 'apt-7',
      bookingCode: 'NOVA-107',
      status: AppointmentStatus.NO_SHOW,
      slot: { startTime: baseStartTime, doctorWorkplace: { hospitalId: 'hosp-1' } },
    });

    const result = await service.updateStatus('apt-7', AppointmentStatus.NO_SHOW);
    expect(result.status).toBe(AppointmentStatus.NO_SHOW);
    expect(db.appointment.update).not.toHaveBeenCalled();
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it('allows reverting NO_SHOW back to active status with mandatory audit reason', async () => {
    const noShowAppt = {
      id: 'apt-8',
      bookingCode: 'NOVA-108',
      status: AppointmentStatus.NO_SHOW,
      userId: 'user-patient',
      payment: { status: 'PAID' },
    };
    db.appointment.findUnique.mockResolvedValue(noShowAppt);
    db.appointment.update.mockResolvedValue({ ...noShowAppt, status: AppointmentStatus.PAID, noShowAt: null });

    const restored = await service.revertNoShow('apt-8', { reason: 'Bệnh nhân đến muộn do tai nạn kẹt xe, tiếp nhận khám bù' }, 'admin-1');

    expect(restored.status).toBe(AppointmentStatus.PAID);
    expect(db.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-8' },
        data: expect.objectContaining({
          status: AppointmentStatus.PAID,
          noShowAt: null,
        }),
      })
    );
    expect(db.appointmentStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          note: expect.stringContaining('Khôi phục lịch khám: Bệnh nhân đến muộn'),
        }),
      })
    );
    expect(auditLogService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REVERT_NO_SHOW_APPOINTMENT',
        entityId: 'apt-8',
      })
    );
  });

  it('records contact logs accurately with channel, outcome and timestamp', async () => {
    db.appointment.findUnique.mockResolvedValue({ id: 'apt-9' });
    db.appointmentContactLog.create.mockResolvedValue({
      id: 'log-1',
      appointmentId: 'apt-9',
      channel: 'PHONE',
      outcome: 'NO_ANSWER',
      note: 'Chuông reo 30s không bắt máy',
      contactedAt: new Date(),
    });

    const log = await service.recordContactLog(
      'apt-9',
      { channel: 'PHONE', outcome: 'NO_ANSWER', note: 'Chuông reo 30s không bắt máy' },
      'staff-1',
      'Y tá Hương'
    );

    expect(log.channel).toBe('PHONE');
    expect(log.outcome).toBe('NO_ANSWER');
    expect(db.appointmentContactLog.create).toHaveBeenCalled();
    expect(auditLogService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RECORD_PATIENT_CONTACT',
        entityId: 'apt-9',
      })
    );
  });

  it('records check-in timestamp idempotently', async () => {
    db.appointment.findUnique.mockResolvedValue({
      id: 'apt-10',
      status: AppointmentStatus.CONFIRMED,
      checkInAt: null,
    });
    db.appointment.update.mockResolvedValue({
      id: 'apt-10',
      status: AppointmentStatus.CONFIRMED,
      checkInAt: new Date(),
    });

    const result = await service.checkIn('apt-10', { note: 'Quẹt mã QR tại sảnh' }, 'staff-1', 'Lễ tân Lan');

    expect(db.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'apt-10' },
        data: expect.objectContaining({ checkInAt: expect.any(Date) }),
      })
    );
    expect(auditLogService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CHECK_IN_APPOINTMENT' })
    );
  });
});
