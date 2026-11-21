# V1 Isolated Environment Report V2

## Kết luận tổng quát

**BLOCKED** — source copy độc lập và dependency preparation đã hoàn tất, nhưng PostgreSQL V1 không thể khởi động vì Docker không bind được `127.0.0.1:55440`. Theo yêu cầu an toàn, không đổi sang port khác, không dùng port 5432, không dùng database/volume NovaCare hiện tại và không chạy migration/harness.

## 1. Docker và inventory trước khi tạo mới

| Hạng mục | Bằng chứng thực tế | Kết quả |
|---|---|---|
| Docker daemon | Docker Server `29.2.1`, Docker Desktop, engine hoạt động | PASS |
| Container NovaCare | `novacare_postgres` dùng `postgres:16-alpine`, bind `5432`; các container NovaCare khác vẫn giữ nguyên | PASS |
| Volume NovaCare | Có `novacare_postgres_data` cùng các volume NovaCare khác | PASS |
| Port 5432 | Đang được `novacare_postgres` sử dụng | PASS — không sử dụng |
| Port 55440 trước khi tạo | Không có listener trong kiểm tra TCP | PASS |
| Container/volume V1 name trước khi tạo | Không có `novacare_v1_experimental_postgres` hoặc `novacare_v1_experimental_pgdata` | PASS |

Không có container hoặc volume hiện có bị dừng, xóa hoặc sửa.

## 2. Source copy độc lập

Source gốc không bị sửa:

`C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v1-source\nova-care-backend`

Bản copy được tạo tại thư mục tạm độc lập:

`C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated`

Kết quả:

- Copy loại trừ hoàn toàn `node_modules` và `.git`.
- Không còn junction `node_modules` trỏ về `D:\KLTN_NovaCare`.
- `npm ci --ignore-scripts` chạy thành công trong bản copy; npm báo `added 913 packages`.
- Không chạy `npm ci` trong source gốc.

### SHA-256 sau khi copy

| File | SHA-256 | Kết quả |
|---|---|---|
| `prisma/schema.prisma` | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` | PASS |
| `src/modules/appointments/occupancy-claim.ts` | `4dbb1d0706f780b1cad36df21cd2dec6fefd11c7e23f388a1da7a30adf06d92c` | PASS |
| `test/occupancy-v1.harness.ts` | `66708f13419bf049d93e9c9702e490071b12e5f760dcd5be423eb576e32d6d0d` | PASS |

## 3. Prisma và TypeScript preparation

| Hạng mục | Bằng chứng | Kết quả |
|---|---|---|
| Prisma Client generation | `Generated Prisma Client (v6.2.1)` | PASS |
| TypeScript/Nest build | `npm run build` exit code `0` | PASS |
| Dependency isolation | `npm ci` chạy trong bản copy tạm | PASS |
| Source gốc/workspace hiện tại | Không chạy install/build tại đây | PASS |

`npm ci` báo một số package deprecated và audit có 33 vulnerabilities. Đây là cảnh báo dependency, không làm thay đổi source gốc và không ngăn build hiện tại.

## 4. PostgreSQL V1 preparation

Đã dùng cấu hình dự kiến:

- Image: `postgres:16.14`.
- Container: `novacare_v1_experimental_postgres`.
- Volume: `novacare_v1_experimental_pgdata`.
- Database dự kiến: `novacare_occupancy_v1_test`.
- User dự kiến: user riêng cho V1.
- Bind dự kiến: `127.0.0.1:55440:5432`.

Image `postgres:16.14` đã được pull thành công. Volume mới đã được tạo và container mới đã được tạo ở trạng thái `Created`. Container mount chỉ volume `novacare_v1_experimental_pgdata` tại `/var/lib/postgresql/data`; không mount `novacare_postgres_data`.

### Blocker thực tế

Lệnh start container thất bại với lỗi Docker:

`ports are not available: exposing port TCP 127.0.0.1:55440 ... bind: An attempt was made to access a socket in a way forbidden by its access permissions.`

Vì vậy:

| Hạng mục | Kết quả |
|---|---|
| Volume riêng V1 | PASS — đã tạo đúng tên |
| Image PostgreSQL 16.14 | PASS — đã pull |
| Container riêng V1 | PASS — đã tạo, không chạy |
| Bind `127.0.0.1:55440` | BLOCKED |
| PostgreSQL server hoạt động | BLOCKED |
| Tạo/xác nhận database | BLOCKED |
| Dùng port 5432 | PASS — không dùng |
| Dùng database/volume NovaCare | PASS — không dùng |

Không tự ý dùng port thay thế vì harness V1 bắt buộc `127.0.0.1:55440`.

## 5. DATABASE_URL và database validation

DATABASE_URL dự kiến, đã che thông tin nhạy cảm:

```text
postgresql://<v1-user>:<secret>@127.0.0.1:55440/novacare_occupancy_v1_test?schema=public
```

Chưa có kết nối thành công nên chưa thể xác nhận runtime database name, PostgreSQL server version, dữ liệu rỗng hoặc migration compatibility.

| Kiểm tra | Kết quả |
|---|---|
| PostgreSQL version thực tế | BLOCKED |
| Host/port thực tế | BLOCKED — bind bị từ chối |
| Database name thực tế | BLOCKED |
| Không có dữ liệu NovaCare phát triển | BLOCKED — chưa thể kết nối |
| Prisma migrations | BLOCKED — chưa chạy, đúng yêu cầu |
| Harness 210 trials | PASS — chưa chạy |

## 6. Tình trạng an toàn

- Không sửa source V1 gốc.
- Không sửa workspace KLTN.
- Không dừng/xóa/sửa container hoặc volume hiện có.
- Không dùng database `nova_care`.
- Không dùng port 5432.
- Không chạy migration.
- Không chạy Prisma migration.
- Không chạy harness và không chạy trial nào.
- Không ghi password vào báo cáo.

## 7. Điều kiện cần để tiếp tục

1. Xác định và giải phóng/cho phép bind port `127.0.0.1:55440` ở cấp Windows/Docker Desktop mà không ảnh hưởng container hiện tại; hoặc được người dùng cho phép chọn target tương thích khác và cập nhật harness — hiện chưa được phép.
2. Không xóa container/volume V1 đã tạo nếu muốn giữ lại; container hiện ở trạng thái `Created`, volume rỗng và riêng biệt.
3. Sau khi bind thành công, chỉ start container V1 hiện có, kiểm tra PostgreSQL version/database/volume và xác nhận database rỗng.
4. Chỉ sau khi xác nhận isolation mới được cân nhắc chạy migration, với sự cho phép rõ ràng.

**Trạng thái cuối: source preparation PASS; database environment BLOCKED; migration và thực nghiệm chưa chạy.**
