# V1 Migration Execution Report

## 1. Phạm vi và authorization

Migration được thực hiện trên source copy độc lập:

`C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated`

Database duy nhất được sử dụng là PostgreSQL V1 cô lập trên `127.0.0.1:55408`. Không sử dụng database `nova_care` hoặc volume `novacare_postgres_data`.

Không chạy `migrate dev`, `migrate reset`, `db push`, seed, Docker Compose migration, harness, E1/E2/E6 hoặc trial.

## 2. Pre-execution verification

| Kiểm tra | Bằng chứng | Kết quả |
|---|---|---|
| Container | `novacare_v1_experimental_postgres`, running | PASS |
| Image | `postgres:16.14` | PASS |
| Mapping | `127.0.0.1:55408->5432/tcp` | PASS |
| Volume | `novacare_v1_experimental_pgdata` mounted at `/var/lib/postgresql/data` | PASS |
| Database/user | `novacare_occupancy_v1_test` / `novacare_v1_user` | PASS |
| PostgreSQL | `16.14` | PASS |
| Public tables before migration | `0` | PASS |
| Migration directories | `10` | PASS |
| Schema hash | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` | PASS |

Migration SQL files và schema được kiểm tra hash trước khi chạy; không phát hiện thay đổi ngoài cấu hình port harness đã được phê duyệt.

## 3. Migration command thực tế

Đã chạy trong source copy V1:

```text
npx prisma migrate deploy
```

`DATABASE_URL` được thiết lập trong process environment tới host port `55408`; password không được ghi vào báo cáo hoặc output.

## 4. Migration execution result

Prisma báo `10 migrations found` và áp dụng thành công toàn bộ:

| # | Migration | Trạng thái |
|---:|---|---|
| 1 | `20260715034437_init` | PASS |
| 2 | `20260919072000_add_security_pin_to_patient_profile` | PASS |
| 3 | `20260919163000_add_scheduling_and_availability_engine` | PASS |
| 4 | `20261001190000_add_scoped_patient_consent` | PASS |
| 5 | `20261005090000_add_telemedicine_consultations` | PASS |
| 6 | `20261005180000_clinic_rooms` | PASS |
| 7 | `20261006090000_password_reset` | PASS |
| 8 | `20261008090000_registration_and_reset_otp_steps` | PASS |
| 9 | `20261009000000_add_no_show_contact_logs_and_policies` | PASS |
| 10 | `20261010143000_add_partner_requests_and_activation` | PASS |

Không có migration thất bại và không cần retry/reset.

## 5. PostgreSQL/database identity

Read-only query sau migration trả về:

```text
server: PostgreSQL 16.14 (Debian 16.14-1.pgdg13+1)
database: novacare_occupancy_v1_test
user: novacare_v1_user
host port: 127.0.0.1:55408
container port: 5432
```

## 6. Migration metadata

Read-only query trên `_prisma_migrations`:

```text
applied_migrations: 10
finished_migrations: 10
rolled_back_migrations: 0
```

Tất cả 10 migration có `finished_at` và đều hoàn tất theo đúng thứ tự timestamp.

## 7. Schema verification

### Public tables

Sau migration có **32 public tables**, gồm:

`appointments`, `appointment_slots`, `appointment_slot_bookings`, `appointment_status_histories`, `appointment_contact_logs`, `users`, `patient_profiles`, `doctor_workplaces`, `doctors`, `medical_services` và các bảng được tạo bởi các migration tiếp theo.

### Occupancy columns

| Bảng | Cột | Kiểu/default |
|---|---|---|
| `appointment_slots` | `capacity` | integer, default `1` |
| `appointment_slots` | `bookedCount` | integer, default `0` |
| `appointment_slots` | `isAvailable` | boolean, default `true` |
| `appointment_slots` | `isActive` | boolean, default `true` |
| `appointment_slots` | `status` | enum, default `AVAILABLE` |
| `appointment_slot_bookings` | `appointmentId` | text |
| `appointment_slot_bookings` | `slotId` | text |

### Constraints và indexes

Đã xác nhận read-only:

- Primary keys trên cả ba bảng occupancy.
- Unique index `appointment_slot_bookings_appointmentId_slotId_key` trên `(appointmentId, slotId)`.
- Index `appointment_slot_bookings_slotId_idx`.
- Unique index `appointment_slots_doctorWorkplaceId_startTime_key`.
- Foreign key membership → appointment với `ON DELETE CASCADE`.
- Foreign key membership → slot với `ON DELETE RESTRICT`.
- Foreign key appointment → slot với `ON DELETE RESTRICT`.
- Foreign key slot → doctor workplace với `ON DELETE RESTRICT`.

## 8. Row counts

| Bảng | Rows |
|---|---:|
| `appointments` | 0 |
| `appointment_slots` | 0 |
| `appointment_slot_bookings` | 0 |

Database mới chưa chứa dữ liệu nghiệp vụ cũ và không có dữ liệu NovaCare development.

## 9. Warnings

Prisma in thông báo có phiên bản mới hơn `6.2.1`. Đây chỉ là update notice; không nâng cấp dependency trong bước này và không ảnh hưởng kết quả migration.

## 10. PASS / FAIL / BLOCKED

| Hạng mục | Kết quả |
|---|---|
| Pre-execution isolation checks | PASS |
| Migration command | PASS |
| 10/10 migrations | PASS |
| PostgreSQL/database identity | PASS |
| Occupancy schema/constraints/indexes | PASS |
| Empty application tables | PASS |
| Migration failure handling | Không kích hoạt |
| Harness/trials | PASS — chưa chạy |

## Kết luận

**PASS** — Prisma migrations V1 đã được áp dụng thành công trên database cô lập. Schema occupancy và migration metadata đã được xác minh bằng truy vấn chỉ đọc; database vẫn chưa có dữ liệu nghiệp vụ.

Theo strict stopping condition, quy trình đã dừng tại đây. Chưa chạy harness, E1/E2/E6 hoặc 210 trials. Không sửa source V1 và không thay đổi kết quả thực nghiệm cũ.
