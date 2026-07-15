import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from '../../src/modules/appointments/appointments.service';
import { PrismaService } from '../../src/database/prisma.service';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: PrismaService;

  const mockUserId = 'user-1';
  const mockSlotId = 'slot-1';
  const mockPatientProfileId = 'profile-1';

  const mockSlot = {
    id: mockSlotId,
    capacity: 1,
    bookedCount: 0,
    isAvailable: true,
    isActive: true,
    startTime: new Date('2026-07-20T08:00:00'),
    endTime: new Date('2026-07-20T08:30:00'),
    doctorWorkplaceId: 'workplace-1',
  };

  const mockProfile = {
    id: mockPatientProfileId,
    userId: mockUserId,
    fullName: 'Test Patient',
    deletedAt: null,
  };

  const mockWorkplace = {
    id: 'workplace-1',
    consultationFee: 200000,
    doctor: { id: 'doctor-1', fullName: 'Dr. Test' },
    hospital: { id: 'hospital-1', name: 'Test Hospital' },
    specialty: { id: 'specialty-1', name: 'Test Specialty' },
  };

  const mockAppointment = {
    id: 'appointment-1',
    bookingCode: 'NOVA-20260715-0001',
    patientProfileId: mockPatientProfileId,
    slotId: mockSlotId,
    status: 'AWAITING_PAYMENT',
    totalPrice: 200000,
    consultationFee: 200000,
    serviceFee: 0,
    idempotencyKey: 'idempotent-1',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    patientProfile: {
      findFirst: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    appointmentSlot: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    doctorWorkplace: {
      findUnique: jest.fn(),
    },
    medicalService: {
      findUnique: jest.fn(),
    },
    appointmentStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create appointment successfully', async () => {
      const createDto = {
        patientProfileId: mockPatientProfileId,
        slotId: mockSlotId,
        reason: 'Đau ngực',
        symptoms: 'Đau sau khi vận động',
        idempotencyKey: 'idempotent-1',
      };

      mockPrismaService.patientProfile.findFirst.mockResolvedValue(mockProfile);
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([mockSlot]);
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      mockPrismaService.doctorWorkplace.findUnique.mockResolvedValue(mockWorkplace);
      mockPrismaService.appointment.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.appointment.create.mockResolvedValue(mockAppointment);
      mockPrismaService.appointmentSlot.update.mockResolvedValue({ ...mockSlot, bookedCount: 1 });
      mockPrismaService.$executeRaw.mockResolvedValue(1);

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(mockAppointment);
      expect(mockPrismaService.patientProfile.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if profile not owned', async () => {
      const createDto = {
        patientProfileId: mockPatientProfileId,
        slotId: mockSlotId,
        idempotencyKey: 'idempotent-1',
      };

      mockPrismaService.patientProfile.findFirst.mockResolvedValue(null);

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if slot is full', async () => {
      const createDto = {
        patientProfileId: mockPatientProfileId,
        slotId: mockSlotId,
        idempotencyKey: 'idempotent-1',
      };

      const fullSlot = { ...mockSlot, bookedCount: 1, capacity: 1, isAvailable: false };

      mockPrismaService.patientProfile.findFirst.mockResolvedValue(mockProfile);
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([fullSlot]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel appointment successfully', async () => {
      const appointmentWithSlot = {
        ...mockAppointment,
        slot: mockSlot,
        userId: mockUserId,
        status: 'CONFIRMED',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(appointmentWithSlot);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.appointment.update.mockResolvedValue({
        ...appointmentWithSlot,
        status: 'CANCELLED',
        cancelledAt: new Date(),
      });
      mockPrismaService.appointmentSlot.findUnique.mockResolvedValue(mockSlot);
      mockPrismaService.appointmentSlot.update.mockResolvedValue(mockSlot);
      mockPrismaService.$executeRaw.mockResolvedValue(1);

      const result = await service.cancel(
        'appointment-1',
        mockUserId,
        { reason: 'Bận đột xuất' },
      );

      expect(result.status).toBe('CANCELLED');
      expect(mockPrismaService.appointment.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      const appointmentWithSlot = {
        ...mockAppointment,
        slot: mockSlot,
        userId: 'other-user',
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(appointmentWithSlot);

      await expect(
        service.cancel('appointment-1', mockUserId, { reason: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
