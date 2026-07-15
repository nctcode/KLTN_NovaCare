import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/modules/users/users.service';
import { PrismaService } from '@/database/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@novacare.vn',
    phone: '0123456789',
    passwordHash: 'hashed_password',
    fullName: 'Test User',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('nên tạo user thành công', async () => {
      const createDto = {
        email: 'test@novacare.vn',
        phone: '0123456789',
        fullName: 'Test User',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', mockUser.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('nên throw ConflictException nếu email đã tồn tại', async () => {
      const createDto = {
        email: 'test@novacare.vn',
        fullName: 'Test User',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('nên trả về user nếu tìm thấy', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      const result = await service.findById('user-uuid-1');
      expect(result).toEqual(mockUser);
    });

    it('nên trả về null nếu không tìm thấy', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      const result = await service.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('nên throw NotFoundException nếu user không tồn tại', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(service.findByIdOrThrow('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
