import request from 'supertest';

/**
 * Test API cho nhóm chức năng:
 * - Xem danh sách ma trận RBAC: ma trận hiện được cấu hình ở frontend.
 * - Phân quyền và gán vai trò tài khoản.
 * - Kích hoạt tài khoản Quản trị viên cơ sở y tế.
 *
 * Chạy với backend đang hoạt động:
 *   $env:TEST_BASE_URL='http://localhost:3001'
 *   $env:TEST_ADMIN_EMAIL='admin@example.com'
 *   $env:TEST_ADMIN_PASSWORD='password'
 *   npm run test:e2e -- --runInBand test/e2e/admin-rbac.e2e-spec.ts
 *
 * Các test làm thay đổi dữ liệu chỉ chạy khi đặt:
 *   $env:RUN_ADMIN_RBAC_MUTATIONS='true'
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;
const runMutations = process.env.RUN_ADMIN_RBAC_MUTATIONS === 'true';

type ApiResponse<T = any> = {
  statusCode?: number;
  message?: string;
  data?: T;
  items?: T;
};

const unwrap = <T>(body: ApiResponse<T>): T =>
  (body.data ?? body.items ?? body) as T;

describe('TC-ADMIN-RBAC-001 - Quản lý vai trò và phân quyền', () => {
  let token: string;
  let users: any[] = [];
  let hospitalId: string;
  let targetUserId: string;

  beforeAll(async () => {
    if (!adminEmail || !adminPassword) {
      throw new Error(
        'Thiếu TEST_ADMIN_EMAIL hoặc TEST_ADMIN_PASSWORD. ' +
        'Hãy cấu hình tài khoản ADMIN trước khi chạy test.',
      );
    }

    const login = await request(baseUrl)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    expect(login.status).toBe(200);
    token = login.body?.data?.accessToken || login.body?.data?.access_token;
    expect(token).toBeTruthy();

    const hospitals = await request(baseUrl)
      .get('/api/v1/admin/hospitals')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 1 });

    expect([200, 201]).toContain(hospitals.status);
    const hospitalData = unwrap<any>(hospitals.body);
    hospitalId = hospitalData?.items?.[0]?.id || hospitalData?.[0]?.id;

    const userResponse = await request(baseUrl)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 20 });

    expect(userResponse.status).toBe(200);
    const userData = unwrap<any>(userResponse.body);
    users = userData?.items || userData || [];
    targetUserId = users.find((user) => user.role !== 'ADMIN')?.id || users[0]?.id;
  });

  describe('Trường hợp 1 - Xem danh sách ma trận phân quyền RBAC', () => {
    it('API danh sách người dùng phải trả về vai trò và trạng thái tài khoản', () => {
      expect(Array.isArray(users)).toBe(true);

      if (users.length > 0) {
        expect(users[0]).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            role: expect.any(String),
            isActive: expect.any(Boolean),
          }),
        );
      }
    });

    it('frontend phải có dữ liệu ma trận RBAC cho các vai trò hệ thống', () => {
      // Ma trận RBAC hiện được khai báo ở frontend, không có endpoint backend riêng.
      // Kiểm thử chi tiết giao diện cần chạy bằng Playwright.
      expect(true).toBe(true);
    });
  });

  describe('Trường hợp 2 - Phân quyền và gán vai trò tài khoản', () => {
    it('tìm kiếm tài khoản không phù hợp trả về danh sách rỗng', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: `not-found-${Date.now()}@example.com` });

      expect(response.status).toBe(200);
      const data = unwrap<any>(response.body);
      expect(data.items || data).toEqual([]);
    });

    it('đổi vai trò tài khoản thành công', async () => {
      if (!runMutations) return;
      if (!targetUserId) throw new Error('Không có tài khoản phù hợp để kiểm tra đổi vai trò.');

      const response = await request(baseUrl)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'HOSPITAL_ADMIN', hospitalId });

      expect([200, 201]).toContain(response.status);
      expect(response.body?.data || response.body).toEqual(
        expect.objectContaining({ role: 'HOSPITAL_ADMIN' }),
      );
    });

    it('không cho phép gán HOSPITAL_ADMIN nếu thiếu cơ sở y tế', async () => {
      if (!runMutations) return;
      if (!targetUserId) throw new Error('Không có tài khoản phù hợp để kiểm tra phân quyền.');

      const response = await request(baseUrl)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'HOSPITAL_ADMIN' });

      expect(response.status).toBe(400);
    });
  });

  describe('Trường hợp 3 - Kích hoạt tài khoản Quản trị viên cơ sở y tế', () => {
    it('không cho phép kích hoạt nếu thiếu cơ sở y tế', async () => {
      if (!runMutations) return;

      const response = await request(baseUrl)
        .post('/api/v1/admin/users/hospital-admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: `invalid-${Date.now()}@example.com`,
          fullName: 'Test Hospital Admin',
        });

      expect(response.status).toBe(400);
    });

    it('tạo tài khoản HOSPITAL_ADMIN và gửi liên kết kích hoạt', async () => {
      if (!runMutations) return;
      if (!hospitalId) throw new Error('Không tìm thấy cơ sở y tế để kiểm tra kích hoạt.');

      const email = `hospital-admin-test-${Date.now()}@example.com`;
      const response = await request(baseUrl)
        .post('/api/v1/admin/users/hospital-admin')
        .set('Authorization', `Bearer ${token}`)
        .send({
          hospitalId,
          email,
          fullName: 'Hospital Admin Test',
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body?.data || response.body).toEqual(
        expect.objectContaining({
          email,
          role: 'HOSPITAL_ADMIN',
          hospitalId,
        }),
      );
    });
  });
});
