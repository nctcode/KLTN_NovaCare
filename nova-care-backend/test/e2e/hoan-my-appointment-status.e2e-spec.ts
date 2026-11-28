import * as dotenv from 'dotenv';
import * as path from 'path';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, AppointmentStatus } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Automated E2E Test Suite: Thay đổi trạng thái lịch hẹn — BỆNH VIỆN ĐA KHOA QUỐC TẾ HOÀN MỸ
 *
 * Kiểm thử trực tiếp toàn bộ luồng nghiệp vụ qua HTTP API (NestJS đang chạy) + xác minh dữ liệu thật trên PostgreSQL:
 *  1. Phân quyền RBAC & cô lập dữ liệu cơ sở y tế (HOSPITAL_ADMIN Hoàn Mỹ vs bệnh viện khác vs ADMIN nền tảng)
 *  2. Luồng chuẩn: PENDING -> CONFIRMED -> Check-in -> COMPLETED (+ PaymentTransaction CASH/PAID) & chặn chuyển ngược
 *  3. Luồng Hủy lịch: bắt buộc lý do, chặn hủy khi đã có hồ sơ khám (MedicalEncounter), ghi cancelledAt & giải phóng AppointmentSlot
 *  4. Luồng Vắng mặt (NO_SHOW): kiểm tra cấu trúc `details` cho NoShowConfirmModal, chặn khi chưa đủ điều kiện,
 *     ghi nhật ký liên hệ, chuyển NO_SHOW + giải phóng slot, và khôi phục revert-no-show luôn về CONFIRMED (không về PAID)
 *
 * Tất cả dữ liệu test tạm (`TEST-HM-...`) được tự động dọn sạch trong `afterAll`.
 *
 * Cách chạy:
 *   cd nova-care-backend
 *   npm run test:e2e -- --runInBand test/e2e/hoan-my-appointment-status.e2e-spec.ts
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DB_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/nova_care?schema=public';

const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } },
});

const unwrap = <T = any>(body: any): T => (body?.data ?? body) as T;

describe('BỆNH VIỆN ĐA KHOA QUỐC TẾ HOÀN MỸ — E2E Thay đổi trạng thái lịch hẹn', () => {
  let hoanMyHospital: { id: string; name: string; externalId: string | null };
  let hoanMyAdmin: { id: string; email: string | null; fullName: string; authVersion: number };
  let hoanMyToken: string;
  let platformAdminToken: string | null = null;
  let hoanMyWorkplaceId: string;
  let otherHospitalWorkplaceId: string | null = null;
  let patientProfile: { id: string; userId: string };

  const createdAppointmentIds: string[] = [];
  const createdSlotIds: string[] = [];
  const createdEncounterIds: string[] = [];

  const runTag = `HM${Date.now().toString().slice(-6)}`;

  async function signUserToken(user: { id: string; email: string | null; authVersion?: number }) {
    const secret = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
    const jwt = new JwtService({ secret });
    return jwt.sign({
      sub: user.id,
      email: user.email || '',
      authVersion: user.authVersion ?? 0,
    });
  }

  async function createTestAppointment(opts: {
    workplaceId: string;
    status: AppointmentStatus;
    startTime: Date;
    bookedCount?: number;
    capacity?: number;
    isAvailable?: boolean;
    suffix: string;
  }) {
    const startTime = opts.startTime;
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    const capacity = opts.capacity ?? 1;
    const bookedCount = opts.bookedCount ?? 1;
    const isAvailable = opts.isAvailable ?? bookedCount < capacity;

    const slot = await prisma.appointmentSlot.create({
      data: {
        doctorWorkplaceId: opts.workplaceId,
        startTime,
        endTime,
        capacity,
        bookedCount,
        isAvailable,
        isActive: true,
      },
    });
    createdSlotIds.push(slot.id);

    const appt = await prisma.appointment.create({
      data: {
        bookingCode: `TEST-${runTag}-${opts.suffix}`,
        userId: patientProfile.userId,
        patientProfileId: patientProfile.id,
        slotId: slot.id,
        status: opts.status,
        totalPrice: 250000,
        symptoms: 'Automated E2E test — Bệnh viện Hoàn Mỹ',
      },
    });
    createdAppointmentIds.push(appt.id);

    return { slot, appt };
  }

  beforeAll(async () => {
    const hospital = await prisma.hospital.findFirst({
      where: {
        OR: [
          { externalId: { contains: 'HOANMY', mode: 'insensitive' } },
          { name: { contains: 'Hoàn Mỹ', mode: 'insensitive' } },
          { name: { contains: 'Hoàng Mỹ', mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, externalId: true },
    });

    if (!hospital) {
      throw new Error('Không tìm thấy Bệnh viện Hoàn Mỹ (HIS_BV_HOANMY) trong cơ sở dữ liệu!');
    }
    hoanMyHospital = hospital;

    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'HOSPITAL_ADMIN',
        hospitalId: hospital.id,
        isActive: true,
      },
      select: { id: true, email: true, fullName: true, authVersion: true },
    });

    if (!adminUser) {
      throw new Error(`Không tìm thấy tài khoản HOSPITAL_ADMIN đang hoạt động cho ${hospital.name}`);
    }
    hoanMyAdmin = adminUser;

    // Login via credentials if provided, otherwise sign a valid JWT using backend JWT_ACCESS_SECRET
    if (process.env.TEST_HOSPITAL_ADMIN_EMAIL && process.env.TEST_HOSPITAL_ADMIN_PASSWORD) {
      const loginRes = await request(BASE_URL).post('/api/v1/auth/login').send({
        email: process.env.TEST_HOSPITAL_ADMIN_EMAIL,
        password: process.env.TEST_HOSPITAL_ADMIN_PASSWORD,
      });
      expect([200, 201]).toContain(loginRes.status);
      const data = unwrap(loginRes.body);
      hoanMyToken = data?.accessToken || data?.access_token;
    } else {
      hoanMyToken = await signUserToken(hoanMyAdmin);
    }
    expect(hoanMyToken).toBeTruthy();

    const platformAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, email: true, authVersion: true },
    });
    if (platformAdmin) {
      platformAdminToken = await signUserToken(platformAdmin);
    }

    const workplace = await prisma.doctorWorkplace.findFirst({
      where: { hospitalId: hospital.id, isActive: true },
      select: { id: true },
    });
    if (!workplace) {
      throw new Error(`Bệnh viện ${hospital.name} chưa có DoctorWorkplace để tạo lịch test`);
    }
    hoanMyWorkplaceId = workplace.id;

    const otherWorkplace = await prisma.doctorWorkplace.findFirst({
      where: { hospitalId: { not: hospital.id }, isActive: true },
      select: { id: true },
    });
    otherHospitalWorkplaceId = otherWorkplace?.id ?? null;

    const profile = await prisma.patientProfile.findFirst({
      select: { id: true, userId: true },
    });
    if (!profile) {
      throw new Error('Chưa có PatientProfile trong DB để tạo lịch test');
    }
    patientProfile = profile;
  }, 30000);

  afterAll(async () => {
    try {
      if (createdAppointmentIds.length > 0) {
        await prisma.auditLog.deleteMany({
          where: { entityType: 'Appointment', entityId: { in: createdAppointmentIds } },
        });
        await prisma.notification.deleteMany({
          where: {
            userId: patientProfile?.userId,
            OR: createdAppointmentIds.map((id) => ({
              data: { path: ['appointmentId'], equals: id },
            })),
          },
        });
        await prisma.appointmentContactLog.deleteMany({
          where: { appointmentId: { in: createdAppointmentIds } },
        });
        await prisma.appointmentStatusHistory.deleteMany({
          where: { appointmentId: { in: createdAppointmentIds } },
        });
        await prisma.paymentTransaction.deleteMany({
          where: { appointmentId: { in: createdAppointmentIds } },
        });
      }
      if (createdEncounterIds.length > 0) {
        await prisma.medicalEncounter.deleteMany({
          where: { id: { in: createdEncounterIds } },
        });
      }
      if (createdAppointmentIds.length > 0) {
        await prisma.appointment.deleteMany({
          where: { id: { in: createdAppointmentIds } },
        });
      }
      if (createdSlotIds.length > 0) {
        await prisma.appointmentSlot.deleteMany({
          where: { id: { in: createdSlotIds } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  }, 30000);

  describe('1. Phân quyền RBAC & Cô lập dữ liệu Bệnh viện Hoàn Mỹ', () => {
    it('TC1.1 - Danh sách lịch hẹn chỉ trả về lịch thuộc Bệnh viện Hoàn Mỹ', async () => {
      const res = await request(BASE_URL)
        .get('/api/v1/admin/appointments')
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      const data = unwrap(res.body);
      expect(Array.isArray(data.items)).toBe(true);
      for (const item of data.items) {
        expect(item.slot?.doctorWorkplace?.hospitalId).toBe(hoanMyHospital.id);
      }
    });

    it('TC1.2 - Chặn HOSPITAL_ADMIN Hoàn Mỹ đổi trạng thái lịch của bệnh viện khác (403)', async () => {
      if (!otherHospitalWorkplaceId) return;

      const { appt: otherAppt } = await createTestAppointment({
        workplaceId: otherHospitalWorkplaceId,
        status: AppointmentStatus.PENDING,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        suffix: 'OTHER',
      });

      const res = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${otherAppt.id}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.CONFIRMED });

      expect(res.status).toBe(403);
    });

    it('TC1.3 - Chặn ADMIN nền tảng gọi API đổi trạng thái lịch hẹn (403)', async () => {
      if (!platformAdminToken) return;

      const { appt } = await createTestAppointment({
        workplaceId: hoanMyWorkplaceId,
        status: AppointmentStatus.PENDING,
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        suffix: 'RBAC',
      });

      const res = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ status: AppointmentStatus.CONFIRMED });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Luồng chuẩn: PENDING -> CONFIRMED -> Check-in -> COMPLETED', () => {
    let flowApptId: string;

    beforeAll(async () => {
      const { appt } = await createTestAppointment({
        workplaceId: hoanMyWorkplaceId,
        status: AppointmentStatus.PENDING,
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        suffix: 'FLOW',
      });
      flowApptId = appt.id;
    });

    it('TC2.1 - Chuyển PENDING -> CONFIRMED thành công và ghi lịch sử + thông báo', async () => {
      const res = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${flowApptId}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.CONFIRMED });

      expect(res.status).toBe(200);
      const updated = unwrap(res.body);
      expect(updated.status).toBe(AppointmentStatus.CONFIRMED);

      const dbAppt = await prisma.appointment.findUnique({
        where: { id: flowApptId },
        include: { statusHistory: true },
      });
      expect(dbAppt?.status).toBe(AppointmentStatus.CONFIRMED);
      expect(dbAppt?.statusHistory.some((h) => h.status === AppointmentStatus.CONFIRMED)).toBe(true);
    });

    it('TC2.2 - Check-in bệnh nhân tại quầy tiếp đón thành công', async () => {
      const res = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${flowApptId}/check-in`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ note: 'Tiếp đón tại quầy Bệnh viện Hoàn Mỹ' });

      expect(res.status).toBe(200);
      const updated = unwrap(res.body);
      expect(updated.checkInAt).toBeTruthy();
      expect(updated.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('TC2.3 - Chuyển CONFIRMED -> COMPLETED thành công & tự động tạo PaymentTransaction PAID', async () => {
      const res = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${flowApptId}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.COMPLETED });

      expect(res.status).toBe(200);
      const updated = unwrap(res.body);
      expect(updated.status).toBe(AppointmentStatus.COMPLETED);
      expect(updated.completedAt).toBeTruthy();

      const payment = await prisma.paymentTransaction.findUnique({
        where: { appointmentId: flowApptId },
      });
      expect(payment).toBeTruthy();
      expect(payment?.status).toBe('PAID');
      expect(payment?.paymentMethod).toBe('CASH');
    });

    it('TC2.4 - Chặn chuyển trạng thái ngược từ COMPLETED sang CANCELLED hoặc CONFIRMED (400)', async () => {
      const cancelRes = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${flowApptId}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.CANCELLED, note: 'Thử hủy lịch đã khám xong' });

      expect(cancelRes.status).toBe(400);

      const revertRes = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${flowApptId}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.CONFIRMED });

      expect(revertRes.status).toBe(400);
    });
  });

  describe('3. Luồng Hủy lịch (CANCELLED) & Giải phóng suất khám', () => {
    it('TC3.1 - Từ chối hủy lịch nếu thiếu lý do (400)', async () => {
      const { appt } = await createTestAppointment({
        workplaceId: hoanMyWorkplaceId,
        status: AppointmentStatus.CONFIRMED,
        startTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
        suffix: 'CANC1',
      });

      const res = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.CANCELLED, note: '   ' });

      expect(res.status).toBe(400);
      expect(res.body?.message).toContain('lý do hủy');
    });

    it('TC3.2 - Chặn hủy lịch đã phát sinh hồ sơ khám bệnh (MedicalEncounter đang hoạt động)', async () => {
      const { appt } = await createTestAppointment({
        workplaceId: hoanMyWorkplaceId,
        status: AppointmentStatus.CONFIRMED,
        startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        suffix: 'CANC2',
      });

      const workplace = await prisma.doctorWorkplace.findUniqueOrThrow({
        where: { id: hoanMyWorkplaceId },
        select: {
          hospitalId: true,
          doctor: { select: { fullName: true } },
          specialty: { select: { name: true } },
        },
      });

      const encounter = await prisma.medicalEncounter.create({
        data: {
          appointmentId: appt.id,
          patientProfileId: patientProfile.id,
          hospitalId: workplace.hospitalId,
          encounterCode: `ENC-${runTag}-CANC2`,
          doctorName: workplace.doctor.fullName,
          specialtyName: workplace.specialty.name,
          status: 'IN_PROGRESS',
          chiefComplaint: 'Test encounter chặn hủy lịch',
        },
      });
      createdEncounterIds.push(encounter.id);

      const res = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.CANCELLED, note: 'Thử hủy khi đã có bệnh án' });

      expect(res.status).toBe(400);
      expect(res.body?.message).toContain('hồ sơ khám');
    });

    it('TC3.3 - Hủy lịch hợp lệ: ghi cancelledAt, giải phóng slot (bookedCount 1 -> 0, isAvailable -> true) & chặn đổi ngược', async () => {
      const { appt, slot } = await createTestAppointment({
        workplaceId: hoanMyWorkplaceId,
        status: AppointmentStatus.CONFIRMED,
        startTime: new Date(Date.now() + 7 * 60 * 60 * 1000),
        bookedCount: 1,
        capacity: 1,
        isAvailable: false,
        suffix: 'CANC3',
      });

      const res = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({
          status: AppointmentStatus.CANCELLED,
          note: 'Bác sĩ có lịch công tác đột xuất tại Bệnh viện Hoàn Mỹ',
        });

      expect(res.status).toBe(200);
      const updated = unwrap(res.body);
      expect(updated.status).toBe(AppointmentStatus.CANCELLED);
      expect(updated.cancelledAt).toBeTruthy();

      const refreshedSlot = await prisma.appointmentSlot.findUnique({ where: { id: slot.id } });
      expect(refreshedSlot?.bookedCount).toBe(0);
      expect(refreshedSlot?.isAvailable).toBe(true);

      // Chặn đổi ngược từ CANCELLED -> CONFIRMED
      const reopenRes = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.CONFIRMED });

      expect(reopenRes.status).toBe(400);
    });
  });

  describe('4. Luồng Vắng mặt (NO_SHOW), Kiểm tra `details` & Khôi phục (revert-no-show)', () => {
    it('TC4.1 - Lịch chưa quá giờ ân hạn: no-show-eligibility trả về đầy đủ `details` và chặn NO_SHOW (400)', async () => {
      const { appt } = await createTestAppointment({
        workplaceId: hoanMyWorkplaceId,
        status: AppointmentStatus.CONFIRMED,
        startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 giờ nữa mới đến giờ khám
        suffix: 'NS1',
      });

      const eligRes = await request(BASE_URL)
        .get(`/api/v1/admin/appointments/${appt.id}/no-show-eligibility`)
        .set('Authorization', `Bearer ${hoanMyToken}`);

      expect(eligRes.status).toBe(200);
      const elig = unwrap(eligRes.body);
      expect(elig.eligible).toBe(false);
      expect(elig.details).toBeDefined();
      expect(elig.details.isOverdue).toBe(false);
      expect(elig.details.hasCheckedIn).toBe(false);
      expect(elig.details.hasEncounter).toBe(false);
      expect(elig.details.contactCount).toBe(0);
      expect(elig.details.intervalPassed).toBe(false);

      const noShowRes = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.NO_SHOW });

      expect(noShowRes.status).toBe(400);
    });

    it('TC4.2 & TC4.3 - Đủ điều kiện NO_SHOW -> giải phóng slot -> Khôi phục (kể cả đã PAID) luôn về CONFIRMED & giữ lại slot', async () => {
      // Tạo lịch đã quá giờ hẹn 40 phút (vượt mốc ân hạn mặc định 15 phút)
      const pastStart = new Date(Date.now() - 40 * 60 * 1000);
      const { appt, slot } = await createTestAppointment({
        workplaceId: hoanMyWorkplaceId,
        status: AppointmentStatus.CONFIRMED,
        startTime: pastStart,
        bookedCount: 1,
        capacity: 1,
        isAvailable: false,
        suffix: 'NS2',
      });

      // Tạo lần liên hệ 1 cách đây 10 phút
      await prisma.appointmentContactLog.create({
        data: {
          appointmentId: appt.id,
          staffId: hoanMyAdmin.id,
          staffName: hoanMyAdmin.fullName,
          channel: 'PHONE',
          outcome: 'NO_ANSWER',
          note: 'Gọi lần 1 không bắt máy',
          contactedAt: new Date(Date.now() - 10 * 60 * 1000),
        },
      });

      // Tạo lần liên hệ 2 qua HTTP API (cách lần 1 khoảng 10 phút >= 5 phút)
      const contactRes = await request(BASE_URL)
        .post(`/api/v1/admin/appointments/${appt.id}/contact-logs`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({
          channel: 'PHONE',
          outcome: 'UNREACHABLE',
          note: 'Gọi lần 2 thuê bao không liên lạc được',
        });
      expect([200, 201]).toContain(contactRes.status);

      // Kiểm tra eligibility phải đủ 100% điều kiện và trả `details` chính xác
      const eligRes = await request(BASE_URL)
        .get(`/api/v1/admin/appointments/${appt.id}/no-show-eligibility`)
        .set('Authorization', `Bearer ${hoanMyToken}`);
      expect(eligRes.status).toBe(200);
      const elig = unwrap(eligRes.body);
      expect(elig.eligible).toBe(true);
      expect(elig.details.isOverdue).toBe(true);
      expect(elig.details.hasCheckedIn).toBe(false);
      expect(elig.details.hasEncounter).toBe(false);
      expect(elig.details.contactCount).toBe(2);
      expect(elig.details.intervalPassed).toBe(true);
      expect(elig.details.lastContactAt).toBeTruthy();

      // Đánh dấu NO_SHOW
      const noShowRes = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ status: AppointmentStatus.NO_SHOW });
      expect(noShowRes.status).toBe(200);
      const noShowData = unwrap(noShowRes.body);
      expect(noShowData.status).toBe(AppointmentStatus.NO_SHOW);
      expect(noShowData.noShowAt).toBeTruthy();

      // Xác minh slot đã được giải phóng
      const slotAfterNoShow = await prisma.appointmentSlot.findUnique({ where: { id: slot.id } });
      expect(slotAfterNoShow?.bookedCount).toBe(0);
      expect(slotAfterNoShow?.isAvailable).toBe(true);

      // Gắn giao dịch thanh toán PAID để xác minh revert-no-show KHÔNG gán nhầm status = PAID
      await prisma.paymentTransaction.create({
        data: {
          appointmentId: appt.id,
          amount: 250000,
          paymentMethod: 'VNPAY',
          transactionCode: `VNP-${runTag}-NS2`,
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Chặn khôi phục nếu lý do quá ngắn (< 5 ký tự)
      const shortReasonRes = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/revert-no-show`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({ reason: 'abc' });
      expect(shortReasonRes.status).toBe(400);

      // Khôi phục hợp lệ -> phải về CONFIRMED (không về PAID) và cộng lại slot bookedCount = 1
      const revertRes = await request(BASE_URL)
        .patch(`/api/v1/admin/appointments/${appt.id}/revert-no-show`)
        .set('Authorization', `Bearer ${hoanMyToken}`)
        .send({
          reason: 'Bệnh nhân đến muộn 20 phút do mưa lớn, bác sĩ Hoàn Mỹ đồng ý khám bù',
        });
      expect(revertRes.status).toBe(200);
      const reverted = unwrap(revertRes.body);
      expect(reverted.status).toBe(AppointmentStatus.CONFIRMED);
      expect(reverted.noShowAt).toBeNull();

      const slotAfterRevert = await prisma.appointmentSlot.findUnique({ where: { id: slot.id } });
      expect(slotAfterRevert?.bookedCount).toBe(1);
      expect(slotAfterRevert?.isAvailable).toBe(false);
    });
  });
});
