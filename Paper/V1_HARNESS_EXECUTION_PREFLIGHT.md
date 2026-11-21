# V1 Harness Execution Preflight

## Kết luận

**READY** — môi trường V1 đã sẵn sàng để chạy harness 210 trials sau khi có xác nhận chạy riêng. Trong bước này chỉ thực hiện kiểm tra preflight và build; harness chưa được chạy.

## 1. Database/container verification

| Hạng mục | Kết quả thực tế | Trạng thái |
|---|---|---|
| Container | `novacare_v1_experimental_postgres`, running | PASS |
| Image | `postgres:16.14` | PASS |
| Mapping | `127.0.0.1:55408->5432/tcp` | PASS |
| Volume | `novacare_v1_experimental_pgdata` → `/var/lib/postgresql/data` | PASS |
| PostgreSQL | `16.14` | PASS |
| Database | `novacare_occupancy_v1_test` | PASS |
| User | `novacare_v1_user` | PASS |
| Applied migrations | `10` finished, `0` rolled back | PASS |
| Public tables | `32` | PASS |
| Occupancy rows | appointments `0`, slots `0`, memberships `0` | PASS |

Không sử dụng `nova_care` hoặc `novacare_postgres_data`.

## 2. Harness source and configuration

Source:

`C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated`

Harness:

`test/occupancy-v1.harness.ts`

Kết quả đọc source:

- Harness có 494 dòng.
- `V1_DB_PORT` được đọc bởi guard, mặc định `55408`.
- `V1_REPETITIONS` được đọc bởi harness, mặc định `30` và giới hạn 1–30.
- Harness xác nhận hostname `127.0.0.1`, port bằng `V1_DB_PORT` và database `novacare_occupancy_v1_test` trước khi thực hiện writes.
- Harness dùng Prisma Client trực tiếp và gọi service, không chạy HTTP server.
- Harness ghi output qua `V1_OUTPUT_DIR`, mặc định là current working directory.

Giá trị chạy dự kiến:

```text
V1_DB_PORT=55408
V1_REPETITIONS=30
```

## 3. Scenario accounting

Đọc toàn bộ harness xác nhận vòng lặp `trial = 1..repetitions`; mỗi trial tạo đúng 7 record scenario:

| Scenario | Số trials |
|---|---:|
| `E1_concurrent_create` | 30 |
| `E2_normal_vs_ai_baseline` | 30 |
| `E2_normal_first` | 30 |
| `E2_pre_exam_first` | 30 |
| `E2_barrier_release` | 30 |
| `E6_multi_slot_success` | 30 |
| `E6_multi_slot_fault_rollback` | 30 |
| **Tổng** | **210** |

Các nhánh E6 fault rollback giữ nguyên hook fault injection sau occupancy write đầu tiên và kiểm tra rollback appointment/status history. Không có thay đổi logic implementation trong preflight.

## 4. Output isolation

Output directory mới được chọn:

```text
C:\Users\trinh\AppData\Local\Temp\novacare-v1-harness-run-20261110
```

Kết quả kiểm tra: directory **chưa tồn tại** tại thời điểm preflight. Khi chạy thật, truyền `V1_OUTPUT_DIR` tới directory này để tránh ghi đè `V1_EXPERIMENT_RESULTS.json`, CSV hoặc artifact cũ.

## 5. Build and dependency prerequisites

| Kiểm tra | Kết quả |
|---|---|
| `npm ci` trong source copy độc lập | Đã hoàn tất trước đó |
| Prisma Client | `6.2.1` |
| Prisma CLI | `6.2.1` |
| ts-node | `10.9.2` |
| TypeScript | `5.9.3` |
| `npm run build` | PASS, exit code `0` |
| Prisma migrations | 10/10 đã hoàn tất |
| Database rows trước harness | 0 trong ba bảng occupancy chính |

## 6. Exact command cần chạy

Chạy từ source copy độc lập, với password lấy từ secret local và không ghi vào báo cáo/terminal log dùng chung:

```powershell
$env:DATABASE_URL = 'postgresql://<v1-user>:<secret>@127.0.0.1:55408/novacare_occupancy_v1_test?schema=public'
$env:V1_DB_PORT = '55408'
$env:V1_REPETITIONS = '30'
$env:V1_OUTPUT_DIR = 'C:\Users\trinh\AppData\Local\Temp\novacare-v1-harness-run-20261110'
npx ts-node -r tsconfig-paths/register --transpile-only test/occupancy-v1.harness.ts
```

Đây là command trực tiếp vì `package.json` không khai báo script riêng cho V1 harness. Không dùng `npm run db:reset`, `db:push`, `migrate dev`, seed hoặc Docker Compose migration.

## 7. Expected output

Harness dự kiến tạo:

- `V1_EXPERIMENT_RESULTS.json` trong output directory mới.
- `V1_EXPERIMENT_RESULTS.csv` trong output directory mới.
- Metadata source hashes và database identity trong JSON.

Không được đổi `V1_OUTPUT_DIR` sang thư mục artifact cũ và không được chạy lại nếu chưa xử lý lỗi giữa chừng.

## 7A. Điều kiện dừng khi lỗi

Nếu harness gặp lỗi trong bất kỳ fixture creation, service call, barrier, fault injection hoặc readback nào, phải giữ nguyên process output và dừng xử lý tiếp theo. Không chạy lại tự động, không reset database, không xóa bảng/dữ liệu, không chạy migration/db push/seed để sửa lỗi. Cần lưu stderr/stdout, kiểm tra read-only trạng thái `_prisma_migrations` và row counts, sau đó báo cáo scenario/trial lỗi để chờ hướng dẫn.

## 8. PASS / BLOCKED

| Hạng mục | Kết quả |
|---|---|
| Container/volume/database identity | PASS |
| 10 migrations | PASS |
| `V1_DB_PORT=55408` | PASS |
| `V1_REPETITIONS=30` | PASS |
| Scenario accounting 210 trials | PASS |
| Output directory mới | PASS |
| Build/prerequisites | PASS |
| Harness execution in this step | Chưa chạy |

## Kết luận cuối

**READY** để chạy chính xác 210 trials với command ở mục 6, sau khi người dùng xác nhận riêng việc bắt đầu harness. Preflight đã dừng đúng yêu cầu; không migration lại, không reset, không db push, không seed và không chạy bất kỳ trial nào.
