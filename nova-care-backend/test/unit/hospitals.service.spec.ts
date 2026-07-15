import { Test, TestingModule } from '@nestjs/testing';
import { HospitalsService } from '../../src/modules/hospitals/hospitals.service';
import { PrismaService } from '../../src/database/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('HospitalsService', () => {
  let service: HospitalsService;

  const mockHospital = {
    id: 'hospital-1',
    name: 'Bệnh viện Test',
    address: '123 Test Street',
    phone: '0123456789',
    description: 'Test hospital',
    rating: 4.5,
    reviewCount: 10,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    hospital: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HospitalsService>(HospitalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a hospital successfully', async () => {
      const createDto = {
        name: 'Bệnh viện Test',
        address: '123 Test Street',
        phone: '0123456789',
      };

      mockPrismaService.hospital.findUnique.mockResolvedValue(null);
      mockPrismaService.hospital.create.mockResolvedValue(mockHospital);

      const result = await service.create(createDto);

      expect(result).toEqual(mockHospital);
      expect(mockPrismaService.hospital.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should throw ConflictException if name already exists', async () => {
      const createDto = {
        name: 'Bệnh viện Test',
        address: '123 Test Street',
      };

      mockPrismaService.hospital.findUnique.mockResolvedValue(mockHospital);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a hospital if found', async () => {
      mockPrismaService.hospital.findFirst.mockResolvedValue(mockHospital);

      const result = await service.findOne('hospital-1');

      expect(result).toEqual(mockHospital);
    });

    it('should throw NotFoundException if hospital not found', async () => {
      mockPrismaService.hospital.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
