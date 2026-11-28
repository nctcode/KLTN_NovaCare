import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService - RBAC Identity Separation & Scope Transfer', () => {
  let service: AdminUsersService;
  let prisma: any;
  let auditLogService: any;
  let emailService: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      hospital: {
        findUnique: jest.fn(),
      },
    };
    auditLogService = { logAction: jest.fn() };
    emailService = { sendHospitalActivationEmail: jest.fn() };
    service = new AdminUsersService(prisma, auditLogService, emailService);
  });

  describe('updateRole (Điều chuyển phạm vi cơ sở cho HOSPITAL_ADMIN)', () => {
    it('chặn ADMIN tự thay đổi quyền chính tài khoản đang đăng nhập', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: Role.ADMIN,
        deletedAt: null,
      });

      await expect(
        service.updateRole('admin-1', Role.HOSPITAL_ADMIN, 'hosp-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('chặn chuyển đổi vai trò ngang đối với PATIENT hoặc DOCTOR (Identity Separation)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'patient-1',
        role: Role.PATIENT,
        deletedAt: null,
      });

      await expect(
        service.updateRole('patient-1', Role.HOSPITAL_ADMIN, 'hosp-1', 'admin-1'),
      ).rejects.toThrow('tách bạch danh tính y tế');
    });

    it('chặn nâng HOSPITAL_ADMIN sang ADMIN toàn hệ thống', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'ha-1',
        role: Role.HOSPITAL_ADMIN,
        hospitalId: 'hosp-1',
        deletedAt: null,
      });

      await expect(
        service.updateRole('ha-1', Role.ADMIN, null, 'admin-1'),
      ).rejects.toThrow('Không cho phép chuyển đổi chéo vai trò');
    });

    it('chặn điều chuyển nếu chọn trùng cơ sở hiện tại hoặc cơ sở đã ngừng hợp tác', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'ha-1',
        role: Role.HOSPITAL_ADMIN,
        hospitalId: 'hosp-1',
        deletedAt: null,
      });

      await expect(
        service.updateRole('ha-1', Role.HOSPITAL_ADMIN, 'hosp-1', 'admin-1'),
      ).rejects.toThrow('hiện đã phụ trách cơ sở y tế được chọn');

      prisma.hospital.findUnique.mockResolvedValue({
        id: 'hosp-2',
        name: 'BV Ngừng hợp tác',
        status: 'TERMINATED',
        deletedAt: null,
      });

      await expect(
        service.updateRole('ha-1', Role.HOSPITAL_ADMIN, 'hosp-2', 'admin-1'),
      ).rejects.toThrow('đã ngừng hợp tác');
    });

    it('điều chuyển HOSPITAL_ADMIN sang cơ sở mới thành công, tăng authVersion và ghi AuditLog', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'ha-1',
        fullName: 'Quản trị Hoàn Mỹ',
        email: 'ha@hoanmy.vn',
        role: Role.HOSPITAL_ADMIN,
        hospitalId: 'hosp-1',
        hospital: { id: 'hosp-1', name: 'Bệnh viện Hoàn Mỹ' },
        deletedAt: null,
      });
      prisma.hospital.findUnique.mockResolvedValue({
        id: 'hosp-2',
        name: 'Bệnh viện Hoàng Yến',
        status: 'ACTIVE',
        deletedAt: null,
      });
      prisma.user.update.mockResolvedValue({
        id: 'ha-1',
        email: 'ha@hoanmy.vn',
        fullName: 'Quản trị Hoàn Mỹ',
        role: Role.HOSPITAL_ADMIN,
        hospitalId: 'hosp-2',
        authVersion: 2,
        hospital: { id: 'hosp-2', name: 'Bệnh viện Hoàng Yến' },
      });

      const res = await service.updateRole('ha-1', Role.HOSPITAL_ADMIN, 'hosp-2', 'admin-1', '127.0.0.1', 'jest');

      expect(res.hospitalId).toBe('hosp-2');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ha-1' },
          data: expect.objectContaining({
            role: Role.HOSPITAL_ADMIN,
            hospitalId: 'hosp-2',
            authVersion: { increment: 1 },
          }),
        }),
      );
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE_USER_ROLE',
          entityId: 'ha-1',
          newValue: expect.objectContaining({
            hospitalId: 'hosp-2',
            sessionRevoked: true,
          }),
        }),
      );
    });
  });

  describe('createHospitalAdmin (Cấp tài khoản quản trị cơ sở bổ sung)', () => {
    it('từ chối cấp tài khoản cho cơ sở đã ngừng hợp tác hoặc email trùng', async () => {
      prisma.hospital.findUnique.mockResolvedValue({
        id: 'hosp-closed',
        name: 'BV Đã đóng',
        status: 'TERMINATED',
        deletedAt: null,
      });
      await expect(
        service.createHospitalAdmin(
          { hospitalId: 'hosp-closed', email: 'a@b.vn', fullName: 'Test' },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);

      prisma.hospital.findUnique.mockResolvedValue({
        id: 'hosp-1',
        name: 'BV Hoàn Mỹ',
        status: 'ACTIVE',
        deletedAt: null,
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-1' });
      await expect(
        service.createHospitalAdmin(
          { hospitalId: 'hosp-1', email: 'dup@hoanmy.vn', fullName: 'Test' },
          'admin-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('cấp tài khoản HOSPITAL_ADMIN mới (isActive=false), gửi email kích hoạt 24h và ghi AuditLog', async () => {
      prisma.hospital.findUnique.mockResolvedValue({
        id: 'hosp-1',
        name: 'Bệnh viện Hoàn Mỹ',
        status: 'ACTIVE',
        deletedAt: null,
      });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-ha-1',
        email: 'dieuphoi@hoanmy.vn',
        fullName: 'Nguyễn Minh Anh',
        phone: null,
        role: Role.HOSPITAL_ADMIN,
        hospitalId: 'hosp-1',
        hospital: { id: 'hosp-1', name: 'Bệnh viện Hoàn Mỹ' },
        createdAt: new Date(),
      });

      const res = await service.createHospitalAdmin(
        { hospitalId: 'hosp-1', email: 'dieuphoi@hoanmy.vn', fullName: 'Nguyễn Minh Anh' },
        'admin-1',
      );

      expect(res.role).toBe(Role.HOSPITAL_ADMIN);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: Role.HOSPITAL_ADMIN,
            hospitalId: 'hosp-1',
            isActive: false,
            activationToken: expect.any(String),
            activationExpiresAt: expect.any(Date),
          }),
        }),
      );
      expect(emailService.sendHospitalActivationEmail).toHaveBeenCalledTimes(1);
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE_HOSPITAL_ADMIN', entityId: 'new-ha-1' }),
      );
    });
  });

  describe('findAll với bộ lọc roles nhiều giá trị', () => {
    it('lọc đúng danh sách nhóm quản trị (ADMIN, HOSPITAL_ADMIN)', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ roles: [Role.ADMIN, Role.HOSPITAL_ADMIN] });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: { in: [Role.ADMIN, Role.HOSPITAL_ADMIN] },
          }),
        }),
      );
    });
  });
});
