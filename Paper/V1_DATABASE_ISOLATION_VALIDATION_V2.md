# V1 Database Isolation Validation V2

## Phạm vi

Đã xóa và tạo lại duy nhất container `novacare_v1_experimental_postgres` theo sự đồng ý rõ ràng. Volume `novacare_v1_experimental_pgdata` được giữ nguyên. Không dừng/xóa/sửa container hoặc volume NovaCare hiện tại.

Không chạy migration, `prisma db push`, harness, E1/E2/E6 hoặc bất kỳ trial nào.

## Kết luận

**PASS** — container V1 đã khởi động đúng cấu hình `127.0.0.1:55408:5432`; database mới cô lập, đúng PostgreSQL 16.14, đúng database/user và chưa có bảng nghiệp vụ.

## 1. Container và volume

| Hạng mục | Bằng chứng thực tế | Kết quả |
|---|---|---|
| Docker daemon | Docker Server `29.2.1`, Docker Desktop engine hoạt động | PASS |
| Container V1 | `novacare_v1_experimental_postgres`, image `postgres:16.14`, trạng thái `running` | PASS |
| Host mapping | `127.0.0.1:55408->5432/tcp` | PASS |
| Volume | `novacare_v1_experimental_pgdata` mounted vào `/var/lib/postgresql/data` | PASS |
| Volume NovaCare | Không dùng `novacare_postgres_data` | PASS |
| Database NovaCare | Không dùng `nova_care` | PASS |
| Container NovaCare | `novacare_postgres` vẫn chạy trên port 5432, không bị thay đổi | PASS |

Container cũ mapping `55440` đã được xóa theo yêu cầu của người dùng; volume V1 không bị xóa và được tái sử dụng.

## 2. Port và excluded ranges

| Kiểm tra | Kết quả |
|---|---|
| TCP listener `127.0.0.1:55408` trước start | Không có listener xung đột |
| Windows excluded range | `55409–55508`; `55408` nằm ngoài range |
| TCP connectivity sau start | `Test-NetConnection 127.0.0.1 -Port 55408` trả về `True` |

## 3. PostgreSQL/database verification

Truy vấn chỉ đọc đã thực hiện trong database V1:

```text
PostgreSQL 16.14 (Debian 16.14-1.pgdg13+1)
database: novacare_occupancy_v1_test
user: novacare_v1_user
internal PostgreSQL port: 5432
public table count: 0
```

Kết quả xác nhận:

- PostgreSQL server version chính xác: **PASS — 16.14**.
- Database name: **PASS — `novacare_occupancy_v1_test`**.
- User riêng V1: **PASS — `novacare_v1_user`**.
- Host port: **PASS — host TCP `127.0.0.1:55408` reachable**.
- Container port: **PASS — PostgreSQL nội bộ `5432`**.
- Volume mount: **PASS — `novacare_v1_experimental_pgdata`**.
- Public schema: **PASS — 0 bảng**.
- Dữ liệu nghiệp vụ NovaCare cũ: **PASS theo kiểm tra bảng public rỗng**.

DATABASE_URL mục tiêu đã được dùng theo dạng riêng V1, không ghi password vào báo cáo:

```text
postgresql://<v1-user>:<secret>@127.0.0.1:55408/novacare_occupancy_v1_test?schema=public
```

## 4. Các bước chưa thực hiện

| Hạng mục | Trạng thái |
|---|---|
| Prisma migration | Chưa chạy |
| `prisma db push` | Chưa chạy |
| Prisma schema application | Chưa chạy |
| V1 harness | Chưa chạy |
| E1/E2/E6 | Chưa chạy |
| Trial | Chưa chạy |

## 5. Tổng hợp PASS / FAIL / BLOCKED

| Hạng mục | Kết quả |
|---|---|
| Docker daemon | PASS |
| Container V1 đúng image/config | PASS |
| Volume V1 riêng và được giữ nguyên | PASS |
| Host port `127.0.0.1:55408` | PASS |
| PostgreSQL 16.14 | PASS |
| Database/user/host validation | PASS |
| Database chưa có bảng nghiệp vụ | PASS |
| Không dùng NovaCare database/volume | PASS |
| Migration/db push/harness/trials | PASS — chưa thực hiện |
| Blocker còn lại | Không có trong phạm vi isolation validation |

**Đã dừng sau bước xác minh database isolation.**
