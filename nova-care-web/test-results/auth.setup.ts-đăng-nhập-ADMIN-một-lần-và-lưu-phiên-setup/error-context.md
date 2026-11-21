# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> đăng nhập ADMIN một lần và lưu phiên
- Location: e2e\auth.setup.ts:7:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.waitForResponse: Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e3]:
    - generic [ref=f1e4]:
      - generic [ref=f1e11]:
        - generic [ref=f1e12]:
          - text: NovaCare
          - generic [ref=f1e13]: Healthcare
        - paragraph [ref=f1e14]: Hệ thống Y tế & Đặt khám Trực tuyến
      - generic [ref=f1e15]:
        - generic [ref=f1e16]: Nền tảng chăm sóc sức khỏe thế hệ mới
        - heading "Chăm sóc sức khỏe thông minh & dễ dàng hơn" [level=1] [ref=f1e20]
        - paragraph [ref=f1e21]: Đặt lịch khám tại các cơ sở y tế hàng đầu, quản lý hồ sơ bệnh án tập trung và nhận tư vấn định hướng chuyên khoa từ AI an toàn.
        - generic [ref=f1e22]:
          - generic [ref=f1e27]:
            - paragraph [ref=f1e28]: Đặt khám nhanh chóng & chủ động
            - paragraph [ref=f1e29]: Tiết kiệm thời gian chờ đợi với mạng lưới bệnh viện và phòng khám uy tín.
          - generic [ref=f1e35]:
            - paragraph [ref=f1e36]: Hồ sơ sức khỏe & Bệnh án số
            - paragraph [ref=f1e37]: Lưu trữ kết quả khám, đơn thuốc và chỉ số sức khỏe bảo mật trọn đời.
          - generic [ref=f1e43]:
            - paragraph [ref=f1e44]: Bảo mật dữ liệu chuẩn liên thông y tế
            - paragraph [ref=f1e45]: Kiểm soát hoàn toàn quyền chia sẻ thông tin cho các bác sĩ điều trị.
        - generic [ref=f1e46]:
          - generic [ref=f1e47]:
            - generic [ref=f1e48]: Lịch khám sắp tới
            - generic [ref=f1e51]: Đã xác nhận
          - generic [ref=f1e52]:
            - generic [ref=f1e53]:
              - generic [ref=f1e58]: PGS.TS Hoàng Nha Quỳnh
              - generic [ref=f1e59]: · Cơ xương khớp
            - generic [ref=f1e60]: Bệnh viện Y Dược NovaCare Chợ Lớn
            - generic [ref=f1e66]: 09:00 · Thứ Tư, 15/10/2026
      - generic [ref=f1e70]:
        - generic [ref=f1e71]: © 2026 NovaCare. Nền tảng Y tế Số
        - generic [ref=f1e72]: Bảo mật chuẩn Bộ Y Tế
    - generic [ref=f1e77]:
      - generic [ref=f1e79]:
        - generic [ref=f1e80]:
          - generic [ref=f1e81]: NovaCare Portal
          - heading "Chào mừng trở lại" [level=1] [ref=f1e83]
          - paragraph [ref=f1e84]: Đăng nhập để tiếp tục quản lý hồ sơ và đặt khám cùng NovaCare.
        - generic [ref=f1e85]:
          - generic [ref=f1e86]:
            - generic [ref=f1e87]: Email hoặc số điện thoại *
            - textbox "Email hoặc số điện thoại *" [ref=f1e89]:
              - /placeholder: Nhập email hoặc số điện thoại
          - generic [ref=f1e90]:
            - generic [ref=f1e91]: Mật khẩu *
            - generic [ref=f1e93]:
              - textbox "Mật khẩu *" [ref=f1e94]:
                - /placeholder: Nhập mật khẩu của bạn
              - button "Hiển thị mật khẩu" [ref=f1e95] [cursor=pointer]
          - link "Quên mật khẩu?" [ref=f1e100] [cursor=pointer]:
            - /url: /quen-mat-khau
          - button "Đăng nhập" [ref=f1e102] [cursor=pointer]
          - generic [ref=f1e104]:
            - text: Chưa có tài khoản?
            - link "Đăng ký ngay" [ref=f1e105] [cursor=pointer]:
              - /url: /dang-ky
        - generic [ref=f1e106]: Thông tin của bạn được bảo vệ theo chính sách bảo mật NovaCare
      - generic [ref=f1e111]: © 2026 NovaCare Medical Platform. All rights reserved.
  - region "Notifications alt+T"
  - button "Open Tanstack query devtools" [ref=f1e162] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=f1e216] [cursor=pointer]
  - alert [ref=f1e220]
```

# Test source

```ts
  1  | import { expect, test as setup } from '@playwright/test';
  2  | 
  3  | const adminUsername = process.env.TEST_ADMIN_EMAIL;
  4  | const adminPassword = process.env.TEST_ADMIN_PASSWORD;
  5  | const authFile = 'playwright/.auth/admin.json';
  6  | 
  7  | setup('đăng nhập ADMIN một lần và lưu phiên', async ({ page }) => {
  8  |   setup.setTimeout(90_000);
  9  |   expect(adminUsername, 'Thiếu TEST_ADMIN_EMAIL').toBeTruthy();
  10 |   expect(adminPassword, 'Thiếu TEST_ADMIN_PASSWORD').toBeTruthy();
  11 | 
  12 |   await page.goto('/dang-nhap', { waitUntil: 'domcontentloaded' });
  13 |   // Next.js dev server đôi khi cần một lần reload sau khi vừa biên dịch.
  14 |   for (let attempt = 0; attempt < 3; attempt += 1) {
  15 |     try {
  16 |       await page.locator('#username').waitFor({ state: 'visible', timeout: 20_000 });
  17 |       break;
  18 |     } catch (error) {
  19 |       if (attempt === 2) throw error;
  20 |       await page.reload({ waitUntil: 'domcontentloaded' });
  21 |     }
  22 |   }
  23 |   await page.locator('#username').fill(adminUsername!);
  24 |   await page.locator('#password').fill(adminPassword!);
  25 | 
> 26 |   const loginResponsePromise = page.waitForResponse(
     |                                     ^ Error: page.waitForResponse: Test timeout of 90000ms exceeded.
  27 |     (response) => response.url().includes('/api/v1/auth/login'),
  28 |   );
  29 |   await page.getByRole('button', { name: /Đăng nhập/i }).click();
  30 |   const loginResponse = await loginResponsePromise;
  31 |   expect(loginResponse.status(), await loginResponse.text()).toBe(200);
  32 |   await expect.poll(
  33 |     () => page.evaluate(() => window.localStorage.getItem('auth-storage')),
  34 |     { timeout: 10_000 },
  35 |   ).toBeTruthy();
  36 | 
  37 |   // Một số bản Next.js dev không hoàn tất router.push sau mutation,
  38 |   // nhưng phiên đăng nhập đã được lưu hợp lệ. Điều hướng lại để kiểm tra UI admin.
  39 |   await page.goto('/admin');
  40 |   await expect(page).toHaveURL(/\/admin/);
  41 | 
  42 |   await page.context().storageState({ path: authFile });
  43 | });
  44 | 
```