import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AppointmentsController (Integration)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login để lấy token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'user@novacare.vn',
        password: 'Password123!',
      });
    accessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/appointments', () => {
    it('should create appointment successfully', async () => {
      // 1. Lấy danh sách doctor workplaces
      const workplacesResponse = await request(app.getHttpServer())
        .get('/api/v1/doctor-workplaces')
        .expect(200);
      const workplaceId = workplacesResponse.body.data[0]?.id;

      if (!workplaceId) {
        console.warn('No doctor workplace found, skipping test');
        return;
      }

      // 2. Lấy slot trống cho ngày mai
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const slotsResponse = await request(app.getHttpServer())
        .get('/api/v1/appointment-slots/available')
        .query({
          doctorWorkplaceId: workplaceId,
          date: tomorrowStr,
        })
        .expect(200);

      const slotId = slotsResponse.body.data[0]?.id;
      if (!slotId) {
        console.warn(`No available slot found for workplace ${workplaceId} on ${tomorrowStr}, skipping test`);
        return;
      }

      // 3. Lấy patient profile
      const profileResponse = await request(app.getHttpServer())
        .get('/api/v1/patient-profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const profileId = profileResponse.body.data[0]?.id;

      // 4. Tạo lịch hẹn
      const response = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          patientProfileId: profileId,
          slotId,
          reason: 'Đau ngực',
          symptoms: 'Đau sau khi vận động',
          idempotencyKey: `idempotent-${Date.now()}`,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('bookingCode');
      expect(response.body.data.status).toBe('AWAITING_PAYMENT');
    });
  });

  describe('GET /api/v1/appointments/me', () => {
    it('should return user appointments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/appointments/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
