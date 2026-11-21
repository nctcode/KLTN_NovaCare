# V1 Migration Preflight Audit

## Phạm vi và kết luận

Đây là audit read-only trên source copy V1:

`C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated`

Không chạy `prisma migrate deploy`, `migrate dev`, `db push`, seed, harness hoặc trial. Không sửa source/migration và không truy cập database NovaCare hiện tại.

### Kết luận tổng quát: **BLOCKED pending explicit migration approval**

Source có migration chain đầy đủ và database V1 đang rỗng. Tuy nhiên preflight chưa được phép áp dụng migration. Migration chain có các thao tác ghi/backfill và một số `DROP` có điều kiện, nên không thể coi migration là read-only.

## 1. Migration inventory và execution order

Có **10 migration directories**, Prisma sẽ thực thi theo thứ tự timestamp tăng dần:

| # | Migration |
|---:|---|
| 1 | `20260715034437_init` |
| 2 | `20260919072000_add_security_pin_to_patient_profile` |
| 3 | `20260919163000_add_scheduling_and_availability_engine` |
| 4 | `20261001190000_add_scoped_patient_consent` |
| 5 | `20261005090000_add_telemedicine_consultations` |
| 6 | `20261005180000_clinic_rooms` |
| 7 | `20261006090000_password_reset` |
| 8 | `20261008090000_registration_and_reset_otp_steps` |
| 9 | `20261009000000_add_no_show_contact_logs_and_policies` |
| 10 | `20261010143000_add_partner_requests_and_activation` |

`prisma/migrations/migration_lock.toml` xác nhận provider là `postgresql`.

## 2. Các bảng và constraint liên quan V1

### `20260715034437_init`

Migration khởi tạo tạo `appointments` và `appointment_slots`. `appointment_slots.bookedCount` được tạo là:

```sql
"bookedCount" INTEGER NOT NULL DEFAULT 0
```

Migration này cũng tạo các unique indexes và foreign keys nền tảng, bao gồm quan hệ của appointments tới patient profile, user và appointment slot.

### `20260919163000_add_scheduling_and_availability_engine`

Đây là migration trực tiếp liên quan occupancy V1:

- Tạo `appointment_slot_bookings`.
- Tạo index trên `appointment_slot_bookings.slotId`.
- Tạo unique index `appointment_slot_bookings_appointmentId_slotId_key` trên `(appointmentId, slotId)`.
- Tạo foreign key `appointmentId` tới `appointments(id)` với `ON DELETE CASCADE`.
- Tạo foreign key `slotId` tới `appointment_slots(id)` với `ON DELETE RESTRICT`.
- Dùng `bookedCount` và `capacity` để backfill trạng thái slot.
- Backfill membership từ `appointments.slotId` sang `appointment_slot_bookings`.

### Đối chiếu với `prisma/schema.prisma`

| Thành phần | Schema | Migration evidence | Đánh giá |
|---|---|---|---|
| `Appointment` | model `Appointment` | init migration | Khớp |
| `AppointmentSlot` | model `AppointmentSlot` | init migration | Khớp |
| `AppointmentSlotBooking` | model `AppointmentSlotBooking` | scheduling migration | Khớp |
| `bookedCount` | `Int @default(0)` | init migration | Khớp |
| Unique membership | `@@unique([appointmentId, slotId])` | unique index trong scheduling migration | Khớp |
| Appointment → slot | relation tới `AppointmentSlot` | foreign key init migration | Khớp |
| Membership → appointment | `onDelete: Cascade` | scheduling migration | Khớp |
| Membership → slot | `onDelete: Restrict` | scheduling migration | Khớp |

Automated `prisma migrate diff --from-migrations ... --to-schema-datamodel ...` bị Prisma từ chối vì migration directory cần `--shadow-database-url`. Đây là giới hạn của công cụ trong chế độ không cung cấp shadow database; đánh giá consistency trên là static/manual cho các thành phần V1.

## 3. Destructive operation assessment

Không thấy `TRUNCATE`, `DELETE FROM` trong các migration SQL. Tuy nhiên migration `20260919163000_add_scheduling_and_availability_engine` có:

- `DROP INDEX IF EXISTS`.
- `DROP CONSTRAINT IF EXISTS` rồi tạo lại constraint.
- `ALTER TABLE ... DROP COLUMN IF EXISTS "doctorId"`.
- `UPDATE appointment_slots ...` để backfill date/status.
- `INSERT INTO appointment_slot_bookings ... SELECT ...` để backfill membership.

Đây không phải reset toàn database, nhưng vẫn là DDL/DML ghi và có thể thay đổi dữ liệu nếu database không rỗng hoặc schema không đúng trạng thái kỳ vọng.

Package scripts không được dùng trong bước này:

- `db:reset`: `prisma migrate reset --force && npm run db:seed`.
- `db:push`: `prisma db push`.
- `db:migrate`: `prisma migrate dev`.
- `docker:migrate`: `docker-compose exec api npx prisma migrate dev`.

## 4. Exact migration command đề xuất

Sau khi nhận xác nhận riêng và xác minh lại `DATABASE_URL`, lệnh production-style phù hợp là:

```powershell
$env:DATABASE_URL = 'postgresql://<v1-user>:<secret>@127.0.0.1:55408/novacare_occupancy_v1_test?schema=public'
npx prisma migrate deploy
```

Hoặc script tương đương:

```powershell
npm run db:migrate:prod
```

Các lệnh trên **chưa chạy** trong audit này. Không dùng `migrate dev`, `db push`, `migrate reset`, seed hoặc Docker Compose development.

## 5. Environment variables

### Bắt buộc cho Prisma migration

```text
DATABASE_URL=postgresql://<v1-user>:<secret>@127.0.0.1:55408/novacare_occupancy_v1_test?schema=public
```

Password phải được truyền qua environment/secret local, không ghi vào báo cáo.

### Liên quan harness nhưng không cần cho migration

```text
V1_DB_PORT=55408
```

`V1_DB_PORT` được dùng bởi harness guard; Prisma CLI chỉ cần `DATABASE_URL` và datasource trong schema.

## 6. Quy trình migration an toàn đề xuất

1. Xác nhận container V1 đúng `127.0.0.1:55408:5432` và volume `novacare_v1_experimental_pgdata`.
2. Xác nhận `DATABASE_URL` chỉ trỏ `127.0.0.1:55408/novacare_occupancy_v1_test`.
3. Kiểm tra database vẫn rỗng hoặc đúng trạng thái pre-migration; không dùng database `nova_care`.
4. Kiểm tra migration directory và `migration_lock.toml` không bị sửa.
5. Chạy `npx prisma migrate deploy` trong source copy độc lập.
6. Nếu lệnh thất bại, dừng và lưu log; không chạy reset, db push hoặc seed để sửa trạng thái.
7. Chạy các truy vấn read-only bên dưới để xác minh schema.
8. Chỉ sau khi schema verification PASS mới cân nhắc chạy harness V1 theo bước được phê duyệt riêng.

## 7. Read-only verification checklist sau migration

Các truy vấn sau chỉ đọc và chưa được chạy trong audit này:

```sql
SELECT version(), current_database(), current_user, inet_server_port();

SELECT tablename FROM pg_catalog.pg_tables
WHERE schemaname = 'public' ORDER BY tablename;

SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('appointments', 'appointment_slots', 'appointment_slot_bookings')
ORDER BY table_name, ordinal_position;

SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid::regclass::text IN ('appointments', 'appointment_slots', 'appointment_slot_bookings')
ORDER BY table_name, conname;

SELECT indexname, tablename, indexdef FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('appointments', 'appointment_slots', 'appointment_slot_bookings')
ORDER BY tablename, indexname;

SELECT COUNT(*) AS appointment_count FROM appointments;
SELECT COUNT(*) AS slot_count FROM appointment_slots;
SELECT COUNT(*) AS membership_count FROM appointment_slot_bookings;
```

Expected pre-harness state for a fresh synthetic database is zero application rows; expected schema objects are present after all migrations.

## 8. PASS / FAIL / BLOCKED

| Hạng mục | Kết quả |
|---|---|
| Migration inventory/order | PASS |
| PostgreSQL provider/lockfile | PASS |
| V1 table/constraint mapping | PASS — static/manual |
| Full automated migration-to-schema diff | BLOCKED — cần shadow database |
| Destructive-operation audit | PASS — đã phát hiện DDL/DML backfill cần kiểm soát |
| Exact migration command | PASS — `npx prisma migrate deploy` |
| Environment requirements | PASS |
| Post-migration checklist | PASS |
| Migration execution in this task | PASS — chưa chạy |
| Điều kiện thực hiện migration ngay | BLOCKED — chờ xác nhận riêng |

## Kết luận cuối

Source V1 có đủ 10 migrations theo đúng thứ tự. Các migration liên quan `Appointment`, `AppointmentSlot`, `AppointmentSlotBooking`, `bookedCount`, unique membership và foreign keys được đối chiếu khớp với schema ở mức static/manual. Database V1 đã cô lập nhưng chưa có schema vì migration chưa chạy.

**Chưa đủ điều kiện tự động thực hiện migration trong bước này. Cần xác nhận riêng trước khi chạy `npx prisma migrate deploy`.**
