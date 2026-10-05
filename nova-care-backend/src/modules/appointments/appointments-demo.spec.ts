import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';

describe('Demo medical record access', () => {
  it('checks ownership before allowing mock fulfillment', async () => {
    const service = { findOne: jest.fn().mockRejectedValue(new Error('forbidden')), mockFulfill: jest.fn() };
    const controller = new AppointmentsController(service as any, {} as any);
    await expect(controller.mockFulfill('other-appointment', { id: 'patient' } as any)).rejects.toThrow();
    expect(service.mockFulfill).not.toHaveBeenCalled();
  });
  it('does not allow patients to call the completion endpoint', async () => {
    const service = { complete: jest.fn() };
    const controller = new AppointmentsController(service as any, {} as any);
    await expect(controller.complete('a', { role: 'PATIENT' } as any)).rejects.toThrow();
    expect(service.complete).not.toHaveBeenCalled();
  });
  it('returns an existing record without overwriting clinical data', async () => {
    const record = { id: 'clinical-record', status: 'PUBLISHED' };
    const db = { appointment: { findUnique: jest.fn().mockResolvedValue({ medicalEncounter: record }) }, $transaction: jest.fn() };
    const service = new AppointmentsService(db as any, {} as any);
    await expect(service.mockFulfill('a')).resolves.toMatchObject({ medicalEncounter: record, encounterId: record.id });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it.each(['CANCELLED', 'EXPIRED', 'NO_SHOW', 'AWAITING_PAYMENT', 'FAILED', 'REFUNDED'])('rejects %s appointments', async (status) => {
    const db = { appointment: { findUnique: jest.fn().mockResolvedValue({ status, medicalEncounter: null }) }, $transaction: jest.fn() };
    await expect(new AppointmentsService(db as any, {} as any).mockFulfill('a')).rejects.toThrow();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
