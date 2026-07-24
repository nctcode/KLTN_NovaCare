import { Test, TestingModule } from '@nestjs/testing';
import { MedicalPassportService } from '@/modules/medical-passport/medical-passport.service';
import { PrismaService } from '@/database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('MedicalPassportService', () => {
  let service: MedicalPassportService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPassportId = 'passport-uuid-1';
  const mockUserId = 'user-uuid-1';
  const mockShareId = 'share-uuid-1';
  const mockToken = 'abc-token-xyz';

  const mockPassport = {
    id: mockPassportId,
    userId: mockUserId,
    summary: {
      chiefComplaint: 'Đau đầu',
      symptoms: ['đau đầu'],
      allergies: ['Penicillin'],
      medications: [],
      medicalHistory: [],
      lastUpdated: '2026-07-22T00:00:00.000Z',
    },
    version: 1,
    updatedAt: new Date(),
    shares: [],
  };

  const mockShare = {
    id: mockShareId,
    passportId: mockPassportId,
    shareToken: mockToken,
    qrCode: 'qrcode-hash',
    pinCode: '1234',
    allowedSections: ['summary', 'allergies'],
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    lastAccessedAt: null,
    accessCount: 0,
    sharedWith: 'Bệnh viện A',
    createdAt: new Date(),
    revokedAt: null,
    medicalPassport: mockPassport,
    accessLogs: [],
  };

  const mockPrisma = {
    medicalPassport: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    medicalPassportShare: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    medicalPassportAccessLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalPassportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MedicalPassportService>(MedicalPassportService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('getMyPassport', () => {
    it('should return passport for valid user', async () => {
      mockPrisma.medicalPassport.findUnique.mockResolvedValue(mockPassport);
      const result = await service.getMyPassport(mockUserId);
      expect(result).toEqual(mockPassport);
      expect(mockPrisma.medicalPassport.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: mockUserId } }),
      );
    });

    it('should throw NotFoundException when no passport exists', async () => {
      mockPrisma.medicalPassport.findUnique.mockResolvedValue(null);
      await expect(service.getMyPassport(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createShare', () => {
    it('should create a share with QR code and PIN', async () => {
      mockPrisma.medicalPassport.findUnique.mockResolvedValue(mockPassport);
      mockPrisma.medicalPassportShare.create.mockResolvedValue(mockShare);

      const result = await service.createShare(mockUserId, {
        allowedSections: ['summary', 'allergies'],
        validDays: 7,
        sharedWith: 'Bệnh viện A',
      });

      expect(result).toHaveProperty('shareUrl');
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('pinCode');
      expect(result.shareUrl).toContain('novacare.vn/share/');
      expect(result.pinCode).toHaveLength(4);
    });

    it('should throw NotFoundException when no passport exists', async () => {
      mockPrisma.medicalPassport.findUnique.mockResolvedValue(null);
      await expect(
        service.createShare(mockUserId, { allowedSections: ['summary'] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('accessSharedPassport', () => {
    it('should grant access with valid token and PIN', async () => {
      mockPrisma.medicalPassportShare.findUnique.mockResolvedValue(mockShare);
      mockPrisma.medicalPassportAccessLog.create.mockResolvedValue({});
      mockPrisma.medicalPassportShare.update.mockResolvedValue({ ...mockShare, accessCount: 1 });

      const result = await service.accessSharedPassport(mockToken, '1234', '127.0.0.1', 'Mozilla');
      expect(result.accessGranted).toBe(true);
      expect(result.data).toHaveProperty('summary');
      expect(result.data).toHaveProperty('allergies');
    });

    it('should throw ForbiddenException for wrong PIN', async () => {
      mockPrisma.medicalPassportShare.findUnique.mockResolvedValue(mockShare);
      await expect(
        service.accessSharedPassport(mockToken, '9999', '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for invalid token', async () => {
      mockPrisma.medicalPassportShare.findUnique.mockResolvedValue(null);
      await expect(
        service.accessSharedPassport('bad-token', '', '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for revoked share', async () => {
      mockPrisma.medicalPassportShare.findUnique.mockResolvedValue({
        ...mockShare,
        isActive: false,
        revokedAt: new Date(),
      });
      await expect(
        service.accessSharedPassport(mockToken, '1234', '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for expired share', async () => {
      mockPrisma.medicalPassportShare.findUnique.mockResolvedValue({
        ...mockShare,
        validUntil: new Date(Date.now() - 1000), // expired
      });
      await expect(
        service.accessSharedPassport(mockToken, '1234', '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revokeShare', () => {
    it('should revoke share successfully', async () => {
      mockPrisma.medicalPassportShare.findUnique.mockResolvedValue(mockShare);
      mockPrisma.medicalPassportShare.update.mockResolvedValue({ ...mockShare, isActive: false });

      const result = await service.revokeShare(mockShareId, mockUserId);
      expect(result.message).toContain('thành công');
    });

    it('should throw ForbiddenException when user does not own passport', async () => {
      mockPrisma.medicalPassportShare.findUnique.mockResolvedValue({
        ...mockShare,
        medicalPassport: { ...mockPassport, userId: 'other-user' },
      });
      await expect(service.revokeShare(mockShareId, mockUserId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent share', async () => {
      mockPrisma.medicalPassportShare.findUnique.mockResolvedValue(null);
      await expect(service.revokeShare('non-existent', mockUserId)).rejects.toThrow(NotFoundException);
    });
  });
});
