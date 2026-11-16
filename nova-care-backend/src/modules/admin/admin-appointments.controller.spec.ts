import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AdminAppointmentsController } from './admin-appointments.controller';

describe('AdminAppointmentsController permissions', () => {
  const service = {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    checkIn: jest.fn(),
    revertNoShow: jest.fn(),
    recordContactLog: jest.fn(),
  };
  let controller: AdminAppointmentsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminAppointmentsController(service as any);
  });

  it('limits appointment mutations to hospital administrators', () => {
    const handlers = ['updateStatus', 'checkIn', 'revertNoShow', 'recordContactLog'] as const;

    for (const handler of handlers) {
      expect(
        Reflect.getMetadata(ROLES_KEY, AdminAppointmentsController.prototype[handler])
      ).toEqual(['HOSPITAL_ADMIN']);
    }
  });

  it('rejects a hospital administrator operating on another hospital appointment', async () => {
    service.findOne.mockResolvedValue({
      slot: { doctorWorkplace: { hospitalId: 'hospital-2' } },
    });

    await expect(
      controller.updateStatus(
        'appointment-1',
        AppointmentStatus.CONFIRMED,
        '',
        { user: { id: 'admin-1', role: 'HOSPITAL_ADMIN', hospitalId: 'hospital-1' } },
        '127.0.0.1',
        'test-agent'
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('allows the system administrator to read appointment details', async () => {
    const appointment = { id: 'appointment-1' };
    service.findOne.mockResolvedValue(appointment);

    await expect(
      controller.findOne('appointment-1', {
        user: { id: 'admin-1', role: 'ADMIN' },
      })
    ).resolves.toBe(appointment);
  });
});
