import { expect, test as setup } from '@playwright/test';

const adminUsername = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;
const authFile = 'playwright/.auth/admin.json';

setup('đăng nhập ADMIN một lần và lưu phiên', async ({ page }) => {
  setup.setTimeout(90_000);
  expect(adminUsername, 'Thiếu TEST_ADMIN_EMAIL').toBeTruthy();
  expect(adminPassword, 'Thiếu TEST_ADMIN_PASSWORD').toBeTruthy();

  await page.goto('/dang-nhap', { waitUntil: 'domcontentloaded' });
  // Next.js dev server đôi khi cần một lần reload sau khi vừa biên dịch.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.locator('#username').waitFor({ state: 'visible', timeout: 20_000 });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }
  await page.locator('#username').fill(adminUsername!);
  await page.locator('#password').fill(adminPassword!);

  const loginResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/v1/auth/login'),
  );
  await page.getByRole('button', { name: /Đăng nhập/i }).click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status(), await loginResponse.text()).toBe(200);
  await expect.poll(
    () => page.evaluate(() => window.localStorage.getItem('auth-storage')),
    { timeout: 10_000 },
  ).toBeTruthy();

  // Một số bản Next.js dev không hoàn tất router.push sau mutation,
  // nhưng phiên đăng nhập đã được lưu hợp lệ. Điều hướng lại để kiểm tra UI admin.
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin/);

  await page.context().storageState({ path: authFile });
});
