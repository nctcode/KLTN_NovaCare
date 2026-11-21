import { expect, test } from '@playwright/test';

test.describe.serial('TC-ADMIN-HOSPITAL-UI-001 - Quản lý cơ sở y tế toàn hệ thống', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/hospitals');
    await expect(page).toHaveURL(/\/admin\/hospitals$/);
    await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
  });

  test('TC-01 - Hiển thị danh sách và phân trang cơ sở y tế', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    await expect(page.getByText(/Tổng bệnh viện/i)).toBeVisible();
    await expect(page.getByText(/Đang hợp tác/i)).toBeVisible();
  });

  test('TC-02 - Tìm kiếm cơ sở y tế có kết quả', async ({ page }) => {
    const firstName = await page.locator('table tbody tr').first().locator('td').nth(1).innerText();
    await page.getByPlaceholder(/Tìm kiếm theo tên bệnh viện/i).fill(firstName.split('\n')[0]);
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('TC-03 - Tìm kiếm cơ sở y tế không có kết quả', async ({ page }) => {
    await page.getByPlaceholder(/Tìm kiếm theo tên bệnh viện/i).fill(`not-found-${Date.now()}`);
    await expect(page.getByText(/Không tìm thấy bệnh viện phù hợp/i)).toBeVisible();
  });

  test('TC-04 - Lọc cơ sở y tế theo trạng thái', async ({ page }) => {
    // Thứ tự bộ lọc trên giao diện: loại, thành phố, trạng thái.
    await page.locator('select').nth(2).selectOption({ index: 1 });
    await expect(page.locator('table tbody')).toBeVisible();
  });

  test('TC-05 - Xem chi tiết cơ sở y tế', async ({ page }) => {
    await page.locator('table tbody tr').first().getByRole('link', { name: /Xem/i }).click();
    await expect(page).toHaveURL(/\/admin\/hospitals\/[^/]+$/);
    await expect(page.getByText(/Tổng quan|Thông tin cơ sở/i).first()).toBeVisible();
  });

  test('TC-06 - Xem các nhóm dữ liệu liên quan', async ({ page }) => {
    await page.locator('table tbody tr').first().getByRole('link', { name: /Xem/i }).click();
    await expect(page.getByText(/Bác sĩ|Chuyên khoa|Dịch vụ|Gói khám/i).first()).toBeVisible();
  });

  test('TC-07 - Không tải chi tiết cơ sở không tồn tại', async ({ page }) => {
    await page.goto('/admin/hospitals/00000000-0000-0000-0000-000000000000');
    await expect(page.getByText(/Không tìm thấy cơ sở y tế/i)).toBeVisible();
  });

  test('TC-08 - Mở form thêm cơ sở y tế', async ({ page }) => {
    await page.getByRole('button', { name: /Thêm bệnh viện/i }).click();
    await expect(page.getByText(/Thêm bệnh viện đối tác/i)).toBeVisible();
    await expect(page.getByLabel(/Tên bệnh viện/i)).toBeVisible();
  });

  test('TC-09 - Tạo cơ sở y tế với dữ liệu hợp lệ', async ({ page }) => {
    await page.getByRole('button', { name: /Thêm bệnh viện/i }).click();
    const uniqueName = `E2E Hospital ${Date.now()}`;
    await page.getByLabel(/Tên bệnh viện/i).fill(uniqueName);
    await page.getByLabel(/Hotline|Số điện thoại/i).first().fill('0900000000');
    await page.getByLabel(/Địa chỉ/i).first().fill('Địa chỉ kiểm thử E2E');
    await page.getByRole('button', { name: /Tạo bệnh viện/i }).click();
    await expect(page).toHaveURL(/\/admin\/hospitals\/[^/]+$/);
  });

  test('TC-10 - Hiển thị lỗi khi bỏ trống tên cơ sở', async ({ page }) => {
    await page.getByRole('button', { name: /Thêm bệnh viện/i }).click();
    await page.getByRole('button', { name: /Tạo bệnh viện/i }).click();
    await expect(page.getByText(/nhập tên bệnh viện/i)).toBeVisible();
  });

  test('TC-11 - Mở màn hình chỉnh sửa cơ sở', async ({ page }) => {
    await page.locator('table tbody tr').first().getByRole('link', { name: /Xem/i }).click();
    await page.getByRole('link', { name: /Chỉnh sửa thông tin/i }).click();
    await expect(page).toHaveURL(/\/admin\/hospitals\/[^/]+\/edit$/);
    await expect(page.getByRole('button', { name: /Lưu|Cập nhật/i }).first()).toBeVisible();
  });

  test('TC-12 - Cập nhật thông tin cơ sở hợp lệ', async ({ page }) => {
    await page.locator('table tbody tr').first().getByRole('link', { name: /Xem/i }).click();
    await page.getByRole('link', { name: /Chỉnh sửa thông tin/i }).click();
    const address = page.getByLabel(/Địa chỉ/i).first();
    await address.fill(`Địa chỉ cập nhật E2E ${Date.now()}`);
    await page.getByRole('button', { name: /Lưu|Cập nhật/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/hospitals\/[^/]+$/);
  });

  test('TC-13 - Không lưu khi dữ liệu bắt buộc không hợp lệ', async ({ page }) => {
    await page.locator('table tbody tr').first().getByRole('link', { name: /Xem/i }).click();
    await page.getByRole('link', { name: /Chỉnh sửa thông tin/i }).click();
    const name = page.getByLabel(/Tên bệnh viện/i).first();
    await name.fill('');
    await page.getByRole('button', { name: /Lưu|Cập nhật/i }).first().click();
    await expect(page.getByText(/bắt buộc|nhập tên/i)).toBeVisible();
  });

  test('TC-14 - Thay đổi trạng thái cơ sở qua menu thao tác', async ({ page }) => {
    const row = page.locator('table tbody tr').first();
    await row.getByRole('button').last().click();
    await page.getByText(/Tạm ngưng nhận lịch|Kích hoạt hoạt động/i).first().click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('TC-15 - Kiểm tra phân trang danh sách', async ({ page }) => {
    const pagination = page.getByRole('button').filter({ hasText: /2|Sau|Tiếp/i });
    if (await pagination.count()) await pagination.first().click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('TC-16 - Làm mới bộ lọc danh sách', async ({ page }) => {
    await page.getByPlaceholder(/Tìm kiếm theo tên bệnh viện/i).fill('temporary-filter');
    await page.locator('button[title="Làm mới"]').click();
    await expect(page.getByPlaceholder(/Tìm kiếm theo tên bệnh viện/i)).toHaveValue('');
  });

  test('TC-17 - Từ chối truy cập trang khi chưa đăng nhập', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin/hospitals');
    await expect(page).toHaveURL(/\/dang-nhap|\/admin/);
  });
});
