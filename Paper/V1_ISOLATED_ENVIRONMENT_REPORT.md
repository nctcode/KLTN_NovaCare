# V1 Isolated Environment Report

## Phạm vi an toàn

Audit/preparation này không sửa source V1, không sửa workspace KLTN, không chạy migration, không chạy harness E1/E2/E6, không xóa container/volume và không kết nối database phát triển.

## Kết luận tổng quát

**BLOCKED** — chưa thể tạo và xác nhận môi trường PostgreSQL cô lập vì Docker daemon hiện không chạy. Ngoài ra, `node_modules` trong source V1 là junction trỏ về `D:\KLTN_NovaCare\nova-care-backend\node_modules`; vì vậy không chạy `npm ci` trực tiếp để tránh làm thay đổi workspace hiện tại.

## PHASE 1 — Environment inspection

| Hạng mục | Kết quả | Kết luận |
|---|---|---|
| Docker CLI | Có, version `29.2.1` | PASS |
| Docker daemon | Không kết nối được tới Docker Desktop Linux engine | BLOCKED |
| Container/volume inventory | Không thể đọc vì daemon không chạy | BLOCKED |
| Port `55440` | Không có listener | PASS |
| Port `5432` | Đang được dùng bởi process Windows PID `7904` | PASS cho điều kiện dừng; không được dùng port này |
| Xác nhận kết nối DB phát triển | Không mở kết nối DB nào trong audit; không thể xác nhận container inventory do daemon down | PASS về hành vi audit, BLOCKED về inventory đầy đủ |

Port 5432 không được dừng hoặc thay đổi. Vì port harness yêu cầu là 55440 và port này đang trống, chưa phát hiện xung đột port V1; tuy nhiên database chưa được tạo.

## PHASE 2 — Isolated database preparation

Chưa thực hiện vì Docker daemon không sẵn sàng.

Cấu hình đề xuất sau khi Docker được bật:

- PostgreSQL image/version: `postgres:16.14` hoặc image PostgreSQL 16.14 tương đương đã xác minh.
- Bind address: `127.0.0.1:55440:5432`.
- Database: `novacare_occupancy_v1_test`.
- Volume mới, dễ nhận diện: `novacare_v1_experimental_pgdata`.
- Không mount volume hiện tại và không dùng database `nova_care`.
- `DATABASE_URL` chỉ được giữ trong environment/secret local; báo cáo này không chứa password.

| Hạng mục | Kết luận |
|---|---|
| Đề xuất PostgreSQL 16.14 | PASS |
| Chỉ bind 127.0.0.1:55440 | READY, chưa triển khai |
| Volume riêng V1 experimental | BLOCKED — Docker daemon chưa chạy |
| Tạo database test | BLOCKED |
| Không dùng volume hiện tại | PASS về kế hoạch, chưa thể kiểm tra volume inventory |

## PHASE 3 — Source preparation

Source path được kiểm tra:

`C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v1-source\nova-care-backend`

### SHA-256

Các file cốt lõi vẫn giữ hash đã xác nhận trong provenance audit:

| File | Hash | Kết luận |
|---|---|---|
| `prisma/schema.prisma` | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` | PASS |
| `src/modules/appointments/occupancy-claim.ts` | `4dbb1d0706f780b1cad36df21cd2dec6fefd11c7e23f388a1da7a30adf06d92c` | PASS |
| `test/occupancy-v1.harness.ts` | `66708f13419bf049d93e9c9702e490071b12e5f760dcd5be423eb576e32d6d0d` | PASS |

### Dependency safety finding

`source V1\node_modules` là junction tới:

`D:\KLTN_NovaCare\nova-care-backend\node_modules`

Do đó không chạy `npm ci` trong source V1 ở bước này. Chạy lệnh đó có thể sửa/xóa dependency trong workspace hiện tại, trái với yêu cầu độc lập và an toàn.

| Hạng mục | Kết luận |
|---|---|
| SHA-256 source | PASS |
| `npm ci` trong môi trường độc lập | BLOCKED — cần bản copy/worktree tạm độc lập trước |
| Prisma Client generation | BLOCKED — chưa được chạy trên dependency tree độc lập |
| TypeScript build | BLOCKED — chưa được chạy trên dependency tree độc lập |
| Harness command | READY FOR NEXT STEP — file harness tồn tại; package không có script riêng cho V1, cần chạy từ môi trường cô lập |

Package/lockfile đã ghi nhận Prisma `6.2.1`; source dùng Node 22 theo Dockerfile.

## PHASE 4 — Database validation

Chưa thực hiện bất kỳ bước nào dưới đây vì chưa có DB cô lập:

- PostgreSQL server version thực tế: BLOCKED.
- Database/host/port thực tế: BLOCKED.
- Kiểm tra database không có dữ liệu NovaCare: BLOCKED.
- Áp dụng Prisma migrations trên database mới: BLOCKED.
- Chạy harness 210 trials: **PASS về việc chưa chạy**, không phải xác nhận kết quả.

## Điều kiện để tiếp tục

1. Người dùng khởi động Docker Desktop/Linux engine.
2. Xác nhận lại Docker daemon hoạt động bằng `docker info`.
3. Kiểm tra lại container và volume inventory; nếu phát hiện volume/port trùng thì dừng.
4. Tạo một thư mục copy/worktree tạm của source V1, không dùng junction `node_modules` hiện tại.
5. Chạy `npm ci`, Prisma generation và build chỉ trong thư mục copy đó.
6. Tạo volume `novacare_v1_experimental_pgdata` và PostgreSQL 16.14 trên `127.0.0.1:55440`.
7. Xác minh database name, server version và dữ liệu rỗng trước khi migrations.
8. Chỉ sau khi xác minh isolation và có cho phép rõ ràng mới áp dụng migrations; vẫn chưa chạy harness trong bước chuẩn bị này.

## Tóm tắt PASS / FAIL / BLOCKED

| Nhóm | Trạng thái |
|---|---|
| Docker CLI và port 55440 | PASS |
| Docker daemon và database creation | BLOCKED |
| Không đụng database/volume hiện tại | PASS |
| Volume V1 riêng | BLOCKED |
| Source hash integrity | PASS |
| `npm ci`, Prisma generation, TypeScript build | BLOCKED vì source đang dùng junction tới workspace |
| Database validation | BLOCKED |
| Không chạy thực nghiệm | PASS |

**Chưa chạy migration và chưa chạy thực nghiệm E1/E2/E6.**
