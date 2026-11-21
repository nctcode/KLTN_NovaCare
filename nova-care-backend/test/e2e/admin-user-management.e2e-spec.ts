import request from 'supertest';

/**
 * TC-ADMIN-USER-001
 * Quản lý danh sách và trạng thái người dùng.
 *
 * Cấu hình PowerShell:
 *   $env:TEST_BASE_URL = 'http://localhost:3000'
 *   $env:TEST_ADMIN_EMAIL = 'admin@example.com'
 *   $env:TEST_ADMIN_PASSWORD = 'password'
 *
 * Chạy:
 *   npm run test:e2e -- --runInBand test/e2e/admin-user-management.e2e-spec.ts
 */

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

type User = {
  id: string;
  email?: string;
  fullName?: string;
  role?: string;
  isActive?: boolean;
};

type ApiBody<T = any> = {
  data?: T;
  items?: T;
};

const getData = <T>(body: ApiBody<T>): T =>
  (body.data ?? body.items ?? body) as T;

describe('TC-ADMIN-USER-001 - Quản lý danh sách và trạng thái người dùng', () => {
  let accessToken: string;
  let users: User[] = [];
  let selectedUser: User;

  beforeAll(async () => {
    if (!adminEmail || !adminPassword) {
      throw new Error(
        'Thiếu TEST_ADMIN_EMAIL hoặc TEST_ADMIN_PASSWORD. ' +
          'Hãy cấu hình tài khoản ADMIN trước khi chạy test.',
      );
    }

    const loginResponse = await request(baseUrl)
      .post('/api/v1/auth/login')
      .send({
        username: adminEmail,
        password: adminPassword,
      });

    expect(loginResponse.status).toBe(200);

    accessToken =
      loginResponse.body?.data?.accessToken ||
      loginResponse.body?.data?.access_token;

    expect(accessToken).toBeTruthy();
  });

  describe('Trường hợp 1 - Xem danh sách người dùng', () => {
    it('hiển thị danh sách người dùng và thông tin phân trang', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);

      const data = getData<any>(response.body);
      users = data.items || data || [];

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

    it('tìm kiếm người dùng theo từ khóa hợp lệ', async () => {
      if (users.length === 0) return;

      const searchableUser = users.find(
        (user) => user.email || user.fullName,
      );
      const search = searchableUser?.email || searchableUser?.fullName;

      const response = await request(baseUrl)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ search, page: 1, limit: 10 });

      expect(response.status).toBe(200);
      const data = getData<any>(response.body);
      expect(Array.isArray(data.items || data)).toBe(true);
    });

    it('trả về danh sách rỗng khi không tìm thấy người dùng', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          search: `user-not-found-${Date.now()}@example.com`,
          page: 1,
          limit: 10,
        });

      expect(response.status).toBe(200);
      const data = getData<any>(response.body);
      expect(data.items || data).toEqual([]);
    });

    it('lọc người dùng theo vai trò và trạng thái', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          role: 'HOSPITAL_ADMIN',
          isActive: true,
          page: 1,
          limit: 10,
        });

      expect(response.status).toBe(200);
      const data = getData<any>(response.body);
      const filteredUsers: User[] = data.items || data || [];

      expect(filteredUsers.every((user) => user.role === 'HOSPITAL_ADMIN')).toBe(
        true,
      );
      expect(filteredUsers.every((user) => user.isActive === true)).toBe(true);
    });

    it('từ chối truy cập danh sách khi không có JWT', async () => {
      const response = await request(baseUrl).get('/api/v1/admin/users');

      expect(response.status).toBe(401);
    });

    it('trả về đúng dữ liệu phân trang', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 1 });

      expect(response.status).toBe(200);
      const data = getData<any>(response.body);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(1);
      expect(typeof data.total).toBe('number');
      expect(typeof data.totalPages).toBe('number');
    });

    it('lọc riêng tài khoản đang hoạt động', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ isActive: true, page: 1, limit: 10 });

      expect(response.status).toBe(200);
      const data = getData<any>(response.body);
      const activeUsers: User[] = data.items || data || [];
      expect(activeUsers.every((user) => user.isActive === true)).toBe(true);
    });

    it('lọc riêng tài khoản theo vai trò HOSPITAL_ADMIN', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ role: 'HOSPITAL_ADMIN', page: 1, limit: 10 });

      expect(response.status).toBe(200);
      const data = getData<any>(response.body);
      const hospitalAdmins: User[] = data.items || data || [];
      expect(hospitalAdmins.every((user) => user.role === 'HOSPITAL_ADMIN')).toBe(
        true,
      );
    });
  });

  describe('Trường hợp 2 - Xem chi tiết người dùng', () => {
    beforeAll(() => {
      selectedUser = users.find((user) => user.id) || users[0];
    });

    it('hiển thị thông tin chi tiết tài khoản', async () => {
      if (!selectedUser) return;

      const response = await request(baseUrl)
        .get(`/api/v1/admin/users/${selectedUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      const user = getData<User>(response.body);
      expect(user).toEqual(
        expect.objectContaining({
          id: selectedUser.id,
          email: expect.any(String),
          role: expect.any(String),
          isActive: expect.any(Boolean),
        }),
      );
    });

    it('chi tiết người dùng có các nhóm dữ liệu liên quan', async () => {
      if (!selectedUser) return;

      const response = await request(baseUrl)
        .get(`/api/v1/admin/users/${selectedUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const user: any = getData<any>(response.body);
      expect(Array.isArray(user.patientProfiles)).toBe(true);
      expect(Array.isArray(user.appointments)).toBe(true);
      expect(Array.isArray(user.auditLogs)).toBe(true);
    });

    it('không trả về passwordHash trong chi tiết người dùng', async () => {
      if (!selectedUser) return;

      const response = await request(baseUrl)
        .get(`/api/v1/admin/users/${selectedUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const user: any = getData<any>(response.body);
      expect(user.passwordHash).toBeUndefined();
    });

    it('trả về 404 khi người dùng không tồn tại', async () => {
      const response = await request(baseUrl)
        .get('/api/v1/admin/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Trường hợp 3 - Khóa hoặc mở khóa tài khoản', () => {
    it('khóa rồi mở khóa tài khoản và khôi phục trạng thái ban đầu', async () => {
      if (!selectedUser) return;

      const originalStatus = selectedUser.isActive;

      const lockResponse = await request(baseUrl)
        .patch(`/api/v1/admin/users/${selectedUser.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(lockResponse.status).toBe(200);
      const lockedUser = getData<User>(lockResponse.body);
      expect(lockedUser.isActive).toBe(!originalStatus);
      expect((lockResponse.body?.message || '').toLowerCase()).toContain('khóa');

      const unlockResponse = await request(baseUrl)
        .patch(`/api/v1/admin/users/${selectedUser.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(unlockResponse.status).toBe(200);
      const unlockedUser = getData<User>(unlockResponse.body);
      expect(unlockedUser.isActive).toBe(originalStatus);
      expect((unlockResponse.body?.message || '').toLowerCase()).toContain('mở');
    });

    it('không cho phép thao tác với người dùng không tồn tại', async () => {
      const response = await request(baseUrl)
        .patch('/api/v1/admin/users/00000000-0000-0000-0000-000000000000/status')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('trạng thái tài khoản được giữ đúng sau khi cập nhật', async () => {
      if (!selectedUser) return;

      const response = await request(baseUrl)
        .get(`/api/v1/admin/users/${selectedUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const currentUser = getData<User>(response.body);
      expect(currentUser.isActive).toBe(selectedUser.isActive);
    });
  });
});

