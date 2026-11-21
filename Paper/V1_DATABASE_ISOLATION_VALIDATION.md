# V1 Database Isolation Validation

## Phạm vi và trạng thái

Kiểm tra được thực hiện với source copy độc lập và Docker inventory. Không dừng, xóa hoặc sửa container/volume hiện có; không tạo container/volume mới; không kết nối database; không chạy migration, `db push`, harness hoặc trial.

## Kết luận

**BLOCKED** — container V1 tồn tại nhưng port mapping thực tế là `127.0.0.1:55440:5432`, không khớp cấu hình đã chuyển sang host port `55408`. Theo yêu cầu, không được tự ý sửa hoặc tạo lại container nên phải dừng tại đây.

## 1. Docker và inventory

| Hạng mục | Bằng chứng thực tế | Kết quả |
|---|---|---|
| Docker daemon | Docker Server `29.2.1`, Docker Desktop, engine hoạt động | PASS |
| Container NovaCare hiện tại | `novacare_postgres` vẫn dùng port `5432` | PASS — không can thiệp |
| Volume NovaCare hiện tại | `novacare_postgres_data` tồn tại | PASS — không dùng |
| Container V1 | `novacare_v1_experimental_postgres`, image `postgres:16.14`, trạng thái `Created` | PASS |
| Volume V1 | `novacare_v1_experimental_pgdata` tồn tại | PASS |
| Port 55408 listener | Không phát hiện listener | PASS |
| Excluded range | `55409–55508`; port `55408` nằm ngoài range | PASS |

## 2. Cấu hình container V1 thực tế

| Thuộc tính | Giá trị quan sát được | Kết quả |
|---|---|---|
| Image | `postgres:16.14` | PASS |
| Container port | `5432/tcp` | PASS |
| Host IP | `127.0.0.1` | PASS |
| Host port | `55440` | **FAIL — cần 55408** |
| Volume mount | `novacare_v1_experimental_pgdata` → `/var/lib/postgresql/data` | PASS |
| Database cấu hình | `novacare_occupancy_v1_test` | PASS theo container config |
| User cấu hình | `novacare_v1_user` | PASS theo container config |
| NovaCare volume/database | Không mount `novacare_postgres_data`; không dùng `nova_care` | PASS |

Mật khẩu không được đưa vào báo cáo.

## 3. Quyết định an toàn

Không thực hiện `docker start` vì container hiện có nếu start sẽ dùng mapping `55440`, trái với yêu cầu `55408`. Không thực hiện `docker update`, `docker rm`, `docker run`, đổi port, đổi volume hoặc tạo container thay thế.

Do container chưa chạy, các kiểm tra sau không thể thực hiện:

- PostgreSQL server version qua kết nối thực tế.
- Host/port kết nối thực tế.
- Database name qua query.
- User qua query.
- Kiểm tra database không chứa dữ liệu nghiệp vụ cũ.
- Kiểm tra tình trạng database qua `DATABASE_URL` riêng V1.

Các mục trên được đánh dấu **BLOCKED**, không phải PASS dựa trên biến môi trường/container metadata.

## 4. DATABASE_URL dự kiến

Chưa sử dụng hoặc kết nối bằng URL. URL đúng cho cấu hình yêu cầu phải có dạng:

```text
postgresql://<v1-user>:<secret>@127.0.0.1:55408/novacare_occupancy_v1_test?schema=public
```

## 5. Tổng hợp PASS / FAIL / BLOCKED

| Hạng mục | Kết quả |
|---|---|
| Docker daemon | PASS |
| Inventory trước thao tác | PASS |
| Container/volume V1 tồn tại | PASS |
| Container dùng đúng image | PASS |
| Volume mount đúng và riêng biệt | PASS |
| Port 55408 không listener/excluded | PASS |
| Port mapping container đúng `127.0.0.1:55408:5432` | **FAIL** |
| Khởi động container | BLOCKED — không start cấu hình sai |
| PostgreSQL/database/user thực tế | BLOCKED |
| Database rỗng và không có dữ liệu cũ | BLOCKED |
| Migration/db push/harness/trials | PASS — chưa chạy |

## Kết luận cuối

Container hiện có cần được tạo lại hoặc được cấp một cấu hình port mới để sử dụng `127.0.0.1:55408:5432`, nhưng việc đó nằm ngoài quyền tự động của bước này vì yêu cầu cấm sửa/xóa/recreate khi cấu hình không đúng. Không có xác nhận database isolation runtime nào được thực hiện.
