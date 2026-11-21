import { DoctorsService } from './doctors.service';

describe('DoctorsService.getAvailableSlots', () => {
  it('does not expose slots assigned to service or after-hours clinic rooms', async () => {
    const slot = {
      id: 'doctor-slot',
      startTime: new Date('2099-01-05T01:00:00.000Z'),
      endTime: new Date('2099-01-05T01:30:00.000Z'),
    };
    const prisma = {
      doctorSchedule: {
        findFirst: jest.fn().mockResolvedValue({
          startTime: '08:00',
          endTime: '17:00',
          breakStart: null,
          breakEnd: null,
        }),
      },
      appointmentSlot: {
        findMany: jest.fn().mockResolvedValue([slot]),
        createMany: jest.fn(),
      },
    };
    const service = new DoctorsService(prisma as any);

    const result = await service.getAvailableSlots('doctor-id', 'workplace-id', '2099-01-05');

    expect(result).toHaveLength(1);
    expect(prisma.appointmentSlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ roomSession: null }),
      }),
    );
  });
});
