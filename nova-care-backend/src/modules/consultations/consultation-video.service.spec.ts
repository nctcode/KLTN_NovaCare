import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConsultationVideoService } from './consultation-video.service';

const mockGrant = jest.fn();
const mockCreateRoom = jest.fn();
const mockDeleteRoom = jest.fn();
const mockListRooms = jest.fn();
const mockRemove = jest.fn();
const mockReceive = jest.fn();
jest.mock('livekit-server-sdk', () => ({
  AccessToken: jest.fn().mockImplementation(() => ({ addGrant: mockGrant, toJwt: async () => 'test-token' })),
  RoomServiceClient: jest.fn().mockImplementation(() => ({ createRoom: mockCreateRoom, deleteRoom: mockDeleteRoom, listRooms: mockListRooms, removeParticipant: mockRemove })),
  WebhookReceiver: jest.fn().mockImplementation(() => ({ receive: mockReceive })),
}));

describe('ConsultationVideoService', () => {
  const configValues = { LIVEKIT_ENABLED: 'true', LIVEKIT_URL: 'wss://test.livekit.cloud', LIVEKIT_API_KEY: 'test-key', LIVEKIT_API_SECRET: 'test-secret' };
  const config: any = { get: jest.fn((key: string) => configValues[key as keyof typeof configValues]) };
  const prisma: any = { consultationSession: { findUnique: jest.fn() }, auditLog: { findFirst: jest.fn() } };
  const audit: any = { logAction: jest.fn() };
  const service = new ConsultationVideoService(config, prisma, audit);
  const session = () => ({ id: 'test', videoEnabled: true, status: 'ACCEPTED', createdByUserId: 'patient',
    patientProfile: { userId: 'patient' }, doctor: { userId: 'doctor', user: { isActive: true } },
    appointment: { status: 'PAID' }, scheduledStartAt: new Date(Date.now() - 60000), scheduledEndAt: new Date(Date.now() + 600000) });
  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string) => configValues[key as keyof typeof configValues]);
    prisma.consultationSession.findUnique.mockResolvedValue(session());
    mockListRooms.mockResolvedValue([]);
    mockReceive.mockReset();
  });
  it('issues room-scoped tokens for the patient and assigned doctor only', async () => {
    for (const user of ['patient', 'doctor']) expect((await service.join('test', user)).participantToken).toBe('test-token');
    expect(mockGrant).toHaveBeenCalledWith(expect.objectContaining({ room: 'novacare-consultation-test', roomJoin: true, canPublishData: false }));
    expect(mockCreateRoom).toHaveBeenCalledWith(expect.objectContaining({ maxParticipants: 2 }));
    await expect(service.join('test', 'stranger')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it.each(['COMPLETED', 'CANCELLED', 'EXPIRED', 'SCHEDULED'])('denies session status %s', async status => {
    prisma.consultationSession.findUnique.mockResolvedValue({ ...session(), status });
    await expect(service.join('test', 'patient')).rejects.toBeInstanceOf(BadRequestException);
    expect(mockCreateRoom).not.toHaveBeenCalled();
  });
  it.each(['PENDING', 'CANCELLED', 'NO_SHOW', 'COMPLETED'])('denies invalid appointment %s', async status => {
    prisma.consultationSession.findUnique.mockResolvedValue({ ...session(), appointment: { status } });
    await expect(service.join('test', 'patient')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects joining before start and at the end boundary', async () => {
    prisma.consultationSession.findUnique.mockResolvedValue({ ...session(), scheduledStartAt: new Date(Date.now() + 60000) });
    await expect(service.join('test', 'patient')).rejects.toBeInstanceOf(BadRequestException);
    prisma.consultationSession.findUnique.mockResolvedValue({ ...session(), scheduledEndAt: new Date() });
    await expect(service.join('test', 'patient')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('does not fake availability without credentials', async () => {
    config.get.mockReturnValue(undefined);
    expect(service.isConfigured()).toBe(false);
    await expect(service.join('test', 'patient')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('denies disabled video and inactive doctors', async () => {
    prisma.consultationSession.findUnique.mockResolvedValue({ ...session(), videoEnabled: false });
    await expect(service.join('test', 'patient')).rejects.toBeInstanceOf(BadRequestException);
    prisma.consultationSession.findUnique.mockResolvedValue({ ...session(), doctor: { userId: 'doctor', user: { isActive: false } } });
    await expect(service.join('test', 'patient')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects unsigned webhooks', async () => {
    mockReceive.mockRejectedValue(new Error('invalid signature'));
    await expect(service.webhook('{}')).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockRemove).not.toHaveBeenCalled();
  });
  it('ejects participants replaying a token after completion', async () => {
    mockReceive.mockResolvedValue({ event: 'participant_joined', room: { name: 'novacare-consultation-test' }, participant: { identity: 'patient' } });
    prisma.consultationSession.findUnique.mockResolvedValue({ ...session(), status: 'COMPLETED' });
    await service.webhook('{}', 'signed');
    expect(mockRemove).toHaveBeenCalledWith('novacare-consultation-test', 'patient');
  });
  it('does not complete a consultation on participant disconnect', async () => {
    mockReceive.mockResolvedValue({ event: 'participant_left', room: { name: 'novacare-consultation-test' }, participant: { identity: 'patient' } });
    await service.webhook('{}', 'signed');
    expect(prisma.consultationSession.findUnique).not.toHaveBeenCalled();
  });
  it('reconciles expired rooms after restarts, without changing clinical status', async () => {
    mockListRooms.mockResolvedValue([{ name: 'novacare-consultation-test' }, { name: 'unrelated-room' }]);
    prisma.consultationSession.findUnique.mockResolvedValue({ ...session(), scheduledEndAt: new Date(Date.now() - 1) });
    await service.reconcile();
    expect(mockDeleteRoom).toHaveBeenCalledTimes(1);
    expect(mockDeleteRoom).toHaveBeenCalledWith('novacare-consultation-test');
  });
});
