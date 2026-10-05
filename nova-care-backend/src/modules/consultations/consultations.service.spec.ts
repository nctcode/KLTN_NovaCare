import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import {
  ConsultationChannel,
  ConsultationRequestMode,
  ConsultationStatus,
} from '@prisma/client';
import { ConsultationsService } from './consultations.service';

describe('ConsultationsService', () => {
  const prisma: any = {
    consultationSession: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    consultationMessage: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    appointment: { findFirst: jest.fn() },
    doctorSchedule: { findMany: jest.fn() },
  };
  const config: any = { get: jest.fn() };
  const notifications: any = { createNotification: jest.fn().mockResolvedValue(undefined) };
  const audit: any = { logAction: jest.fn().mockResolvedValue(undefined) };
  const service = new ConsultationsService(prisma, config, notifications, audit);

  const baseSession = {
    id: 'consultation-id',
    createdByUserId: 'patient-user',
    status: ConsultationStatus.ACCEPTED,
    chatOpenAt: new Date(Date.now() - 1000),
    patientProfile: { id: 'profile-id', userId: 'patient-user', fullName: 'Bệnh nhân' },
    doctor: { id: 'doctor-id', userId: 'doctor-user', fullName: 'Bác sĩ' },
    doctorWorkplace: { id: 'workplace-id', hospital: { id: 'hospital-id', name: 'Bệnh viện' }, specialty: { id: 'specialty-id', name: 'Nội khoa' } },
    appointment: null,
  };

  beforeEach(() => jest.clearAllMocks());

  it('rejects a forged image MIME type before writing a file', async () => {
    prisma.consultationSession.findUnique.mockResolvedValue(baseSession);
    await expect(service.sendAttachment('consultation-id', 'patient-user', 'file-1', {
      buffer: Buffer.from('<html>not an image</html>'),
      size: 25, mimetype: 'image/png', originalname: 'image.png',
    } as Express.Multer.File)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('includes the id tie-breaker when paginating equal timestamps', async () => {
    const createdAt = new Date('2026-10-05T03:00:00Z');
    prisma.consultationSession.findUnique.mockResolvedValue(baseSession);
    prisma.consultationMessage.findFirst.mockResolvedValue({ createdAt });
    prisma.consultationMessage.findMany.mockResolvedValue([]);
    await service.listMessages('consultation-id', 'patient-user', 'message-b', 30);
    expect(prisma.consultationMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { consultationId: 'consultation-id', OR: [
        { createdAt: { lt: createdAt } },
        { createdAt, id: { lt: 'message-b' } },
      ] },
    }));
  });

  it('không giả lập tư vấn ngay khi backend chưa có availability thật', async () => {
    prisma.consultationSession.findUnique.mockResolvedValue(null);
    await expect(service.create('patient-user', {
      appointmentId: '8c5b719f-36fb-4ddd-b6c5-fd725f2f5f0f',
      requestMode: ConsultationRequestMode.ON_DEMAND,
      channel: ConsultationChannel.CHAT,
      topic: 'Đau đầu',
      description: 'Đau đầu từ hôm qua và muốn hỏi bác sĩ',
      consentAccepted: true,
      idempotencyKey: 'request-1',
    })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.appointment.findFirst).not.toHaveBeenCalled();
  });

  it('từ chối người không tham gia phiên', async () => {
    prisma.consultationSession.findUnique.mockResolvedValue(baseSession);
    await expect(service.findOne('consultation-id', 'stranger-user')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('chỉ bác sĩ được phân công mới được nhận phiên', async () => {
    prisma.consultationSession.findUnique.mockResolvedValue({ ...baseSession, status: ConsultationStatus.SCHEDULED });
    await expect(service.accept('consultation-id', 'patient-user')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.consultationSession.update).not.toHaveBeenCalled();
  });

  it('khóa gửi tin trước thời điểm chatOpenAt do server quy định', async () => {
    prisma.consultationSession.findUnique.mockResolvedValue({ ...baseSession, chatOpenAt: new Date(Date.now() + 60_000) });
    await expect(service.sendText('consultation-id', 'patient-user', {
      clientMessageId: 'client-message-1',
      text: 'Xin chào bác sĩ',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.consultationMessage.create).not.toHaveBeenCalled();
  });

  it('retry cùng clientMessageId trả lại tin cũ và không tạo trùng', async () => {
    const existing = { id: 'message-id', consultationId: 'consultation-id', clientMessageId: 'client-message-1', attachments: [] };
    prisma.consultationSession.findUnique.mockResolvedValue(baseSession);
    prisma.consultationMessage.findUnique.mockResolvedValue(existing);
    await expect(service.sendText('consultation-id', 'patient-user', {
      clientMessageId: 'client-message-1',
      text: 'Xin chào bác sĩ',
    })).resolves.toBe(existing);
    expect(prisma.consultationMessage.create).not.toHaveBeenCalled();
  });

  it('từ chối loại tệp không thuộc danh sách y tế được hỗ trợ', async () => {
    prisma.consultationSession.findUnique.mockResolvedValue(baseSession);
    const file = {
      buffer: Buffer.from('unsafe'),
      size: 6,
      mimetype: 'application/x-msdownload',
      originalname: 'malware.exe',
    } as Express.Multer.File;
    await expect(service.sendAttachment(
      'consultation-id',
      'patient-user',
      'attachment-client-id',
      file,
    )).rejects.toBeInstanceOf(BadRequestException);
  });
});
