import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DoctorPortalService } from './doctor-portal.service';

describe('DoctorPortalService', () => {
  const doctor = {
    id: 'doctor-a',
    userId: 'user-a',
    fullName: 'Doctor A',
    workPlaces: [{ id: 'workplace-a' }],
    user: { id: 'user-a', role: 'DOCTOR' },
  };

  function createPrisma() {
    return {
      doctor: { findFirst: jest.fn().mockResolvedValue(doctor), update: jest.fn() },
      appointment: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn(),
      },
      doctorSchedule: { findMany: jest.fn().mockResolvedValue([]) },
      appointmentSlot: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      notification: { count: jest.fn().mockResolvedValue(0) },
      user: { update: jest.fn() },
      $transaction: jest.fn(),
    };
  }

  it('scopes appointment listing to the Doctor profile derived from current user', async () => {
    const prisma = createPrisma();
    const service = new DoctorPortalService(prisma as any);

    await service.getAppointments('user-a', {
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    });

    expect(prisma.doctor.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-a' }),
    }));
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        slot: expect.objectContaining({ doctorWorkplace: { doctorId: 'doctor-a' } }),
      }),
    }));
  });

  it('rejects a Doctor account without an active linked profile', async () => {
    const prisma = createPrisma();
    prisma.doctor.findFirst.mockResolvedValueOnce(null as any);
    const service = new DoctorPortalService(prisma as any);

    await expect(service.getProfile('unlinked-user')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not return an appointment assigned to another Doctor', async () => {
    const prisma = createPrisma();
    prisma.appointment.findFirst.mockResolvedValueOnce(null as any);
    const service = new DoctorPortalService(prisma as any);

    await expect(service.getAppointment('user-a', 'appointment-of-doctor-b'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'appointment-of-doctor-b',
        slot: { doctorWorkplace: { doctorId: 'doctor-a' } },
      },
    }));
  });
});
