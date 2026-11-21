# V1 Port Configuration Audit

## Phạm vi và an toàn

Audit chỉ đọc source copy độc lập:

`C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated`

Không sửa source/harness, không khởi động container, không chạy migration, không chạy trials và không can thiệp Windows excluded port ranges.

## Kết luận

**BLOCKED nếu giữ nguyên source hiện tại:** harness V1 hard-code port `55440` ở hai chỗ kiểm tra và ghi metadata. `DATABASE_URL` có thể mang port khác, nhưng harness sẽ từ chối chạy.

**PASS về khả năng cấu hình:** có thể đổi sang port khác mà không thay đổi logic thực nghiệm, với thay đổi tối thiểu chỉ ở cấu hình/guard của harness và Docker port mapping.

## 1. Truy vết port 55440

Kết quả tìm toàn bộ source copy, loại trừ `node_modules` và `dist`:

| File | Vị trí | Cách sử dụng |
|---|---:|---|
| `test/occupancy-v1.harness.ts` | dòng 17 | So sánh `parsedDatabaseUrl.port !== '55440'` |
| `test/occupancy-v1.harness.ts` | dòng 20 | Thông báo/refusal yêu cầu `127.0.0.1:55440/...` |
| `test/occupancy-v1.harness.ts` | dòng 428 | Ghi `connectionTarget: '127.0.0.1:55440/novacare_occupancy_v1_test'` |

Không tìm thấy `55440` trong `prisma/schema.prisma`, package scripts hoặc các file Docker khác. `docker-compose.yml` hiện tại chỉ cấu hình hệ thống phát triển với port `5432` và database `nova_care`; không được dùng cho V1.

## 2. DATABASE_URL và hard-code

Harness đọc `process.env.DATABASE_URL`, parse bằng `new URL(databaseUrl)` và dùng hostname, port, pathname để kiểm tra database target. Prisma schema cũng đọc `env("DATABASE_URL")`.

Vì vậy:

- `DATABASE_URL` là nguồn cấu hình kết nối Prisma.
- Hostname `127.0.0.1` và database `novacare_occupancy_v1_test` đang được hard-code trong guard.
- Port `55440` đang bị hard-code trong guard và metadata artifact.
- Chỉ đổi port trong `DATABASE_URL` bằng environment variable là **không đủ**; harness sẽ fail trước khi tạo `PrismaClient`.

## 3. Port đề xuất

Port đề xuất: **55408/TCP**.

Lý do:

- Nằm ngay ngoài excluded range đã cung cấp `55409–55508`.
- Không nằm trong IPv4 hoặc IPv6 excluded range nêu trong yêu cầu.
- Kiểm tra read-only hiện không thấy listener Windows trên port `55408`.
- Không trùng port `5432` của NovaCare.
- Không trùng port `55440` đang bị Windows từ chối bind.

Đây là đề xuất theo excluded ranges được cung cấp. Trước khi start container vẫn phải kiểm tra lại port `55408` tại thời điểm triển khai.

## 4. Docker và Prisma

Prisma không hard-code port; Prisma nhận toàn bộ host/port từ `DATABASE_URL` trong `prisma/schema.prisma`. Vì vậy Prisma hỗ trợ port `55408` mà không cần sửa schema.

Docker hỗ trợ port tùy ý ở host mapping:

```text
127.0.0.1:55408:5432
```

`postgres:16.14` vẫn lắng nghe port `5432` bên trong container; chỉ host port đổi thành `55408`. Không cần đổi port PostgreSQL nội bộ.

`docker-compose.yml` trong source copy là cấu hình NovaCare development (`5432`, `nova_care`, volume `novacare_postgres_data`) nên không phù hợp cho V1. Nên giữ container V1 bằng mapping riêng, không chạy compose development.

## 5. Thay đổi tối thiểu chính xác

### Phương án nên dùng

Không thay đổi logic transaction, locking, occupancy, fault injection hoặc scenario. Chỉ thay đổi cấu hình target port:

1. Khai báo biến môi trường, ví dụ `V1_DB_PORT=55408`.
2. Trong `test/occupancy-v1.harness.ts`, dùng giá trị đó cho điều kiện port thay vì literal `55440`.
3. Dùng cùng giá trị đó trong thông báo refusal.
4. Dùng cùng giá trị đó khi ghi `connectionTarget` vào JSON artifact.
5. Đặt `DATABASE_URL` với host port `55408`:

```text
postgresql://<v1-user>:<secret>@127.0.0.1:55408/novacare_occupancy_v1_test?schema=public
```

6. Khởi động container với mapping `127.0.0.1:55408:5432` và volume V1 riêng.

### Mức thay đổi

Thay đổi tối thiểu là **3 điểm trong một file harness** (guard, error text, metadata) cộng với port mapping Docker và `DATABASE_URL`. Không cần đổi Prisma schema, migration, service implementation hay logic thực nghiệm.

## 6. Đánh giá PASS / BLOCKED

| Hạng mục | Kết quả |
|---|---|
| Truy vết toàn bộ `55440` | PASS |
| Xác định `DATABASE_URL` | PASS |
| Xác định hard-code trong harness | PASS |
| Đổi port chỉ bằng DATABASE_URL, không sửa harness | BLOCKED |
| Đổi port bằng biến môi trường mới + thay đổi guard/metadata | PASS về kỹ thuật |
| Port đề xuất ngoài `55409–55508` | PASS: `55408` |
| Prisma hỗ trợ port mới | PASS |
| Docker hỗ trợ mapping port mới | PASS |
| Xác minh port mới ngay trước khi start | Chưa thực hiện trong audit này |
| Sửa source/chạy container/migration/trials | PASS — chưa thực hiện |

## Kết luận cuối

V1 hiện **BLOCKED** khi bắt buộc port `55440`. Có thể khắc phục an toàn bằng cách cấu hình port `55408` qua một environment variable dùng chung cho guard và metadata của harness, đồng thời đổi host mapping Docker và `DATABASE_URL`. Thay đổi này không làm thay đổi logic thực nghiệm; cần ghi nhận port mới trong artifact để provenance chính xác.
