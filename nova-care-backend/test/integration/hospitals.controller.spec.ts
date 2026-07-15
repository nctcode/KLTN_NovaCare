import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('HospitalsController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/hospitals', () => {
    it('should return list of hospitals', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/hospitals')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter hospitals by search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/hospitals?query=NovaCare')
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/hospitals/:id', () => {
    it('should return hospital details', async () => {
      // Lấy danh sách để có ID
      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/hospitals');
      const hospitalId = listResponse.body.data[0]?.id;

      if (hospitalId) {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/hospitals/${hospitalId}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('id', hospitalId);
        expect(response.body.data).toHaveProperty('name');
      }
    });

    it('should return 404 for non-existent hospital', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/hospitals/b8d85f76-8b2b-4567-bf0e-6f8d0ab9c9e8') // Use valid UUID format to avoid parse/validation error, since it expects a valid UUID
        .expect(404);
    });
  });
});
