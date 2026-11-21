# V1 Schema–Migration Provenance Audit

## Phạm vi và trạng thái an toàn

Audit chỉ đọc trên source copy:

`C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated`

Database chỉ được truy vấn read-only. Không sửa `schema.prisma`, migration, source implementation hoặc artifact; không chạy migration, `db push`, reset, seed hay harness.

## Kết luận ngắn

**BLOCKED** — `schema.prisma` hiện tại không phải schema được tạo đầy đủ bởi 10 migration đã áp dụng. `Hospital.images` chỉ là mismatch đầu tiên làm harness fail; Prisma diff read-only cho thấy nhiều enum, cột, bảng, index và foreign key khác cũng thiếu trong PostgreSQL.

Không có Git history trong source copy hoặc source snapshot provenance để xác định commit chính xác đã thêm `Hospital.images`. Vì vậy không thể chứng minh một migration thứ 11 cụ thể từ local evidence hiện có.

## 1. Ba lớp schema được phân biệt

### 1.1 Prisma schema khai báo

Tại `prisma/schema.prisma:506`, model `Hospital` bắt đầu. Tại `prisma/schema.prisma:517` có:

```prisma
images String[] @default([])
```

Schema cũng khai báo nhiều field/model mới khác, ví dụ các enum `HospitalType`, `PartnershipStatus`, `DataSource`, các field mở rộng của `Hospital`, `User`, `PatientProfile`, `Appointment` và các model như `HealthPackage`, `MedicalPassport`, `MedicalEncounter`.

### 1.2 Schema được tạo bởi 10 migration

Migration `20260715034437_init/migration.sql:183` tạo bảng `hospitals`, nhưng định nghĩa chỉ có các cột:

`id`, `name`, `address`, `phone`, `description`, `logoUrl`, `rating`, `isActive`, `createdAt`, `updatedAt`, `deletedAt`.

Không có `images` trong migration này. Tìm kiếm toàn bộ 10 file migration không tìm thấy thao tác `ADD COLUMN`, `DROP COLUMN` hoặc `CREATE TABLE` cho cột tên `images`.

### 1.3 PostgreSQL thực tế

Read-only inspection sau 10/10 migrations cho thấy bảng `hospitals` thực tế có đúng nhóm cột của migration init và không có `images`:

```text
id, name, address, phone, description, logoUrl, rating,
isActive, createdAt, updatedAt, deletedAt
```

Database identity đã xác nhận:

```text
database: novacare_occupancy_v1_test
user: novacare_v1_user
PostgreSQL: 16.14
migrations finished: 10
```

## 2. Thời điểm/commit của `Hospital.images`

### Bằng chứng có thể xác định

- Field hiện diện ở `prisma/schema.prisma:517` trong source copy.
- Source copy không chứa `.git`.
- Source snapshot provenance được cung cấp cũng không chứa `.git`.
- Không có local Git log/blame để truy ra commit hoặc thời điểm thêm field.

### Kết luận provenance

Chỉ có thể kết luận `images` thuộc **schema snapshot hiện tại**, nhưng không xác định được commit/schema version đã thêm nó. Không có bằng chứng local đủ để nói field này được thêm trong một migration cụ thể hoặc trong migration thứ 11.

## 3. Kiểm tra toàn bộ 10 migration về `images`

| Phạm vi | Kết quả |
|---|---|
| Tìm literal `images` trong 10 `migration.sql` | Không tìm thấy |
| Migration tạo `hospitals` | `20260715034437_init` |
| Migration add `images` | Không có |
| Migration rename `images` | Không có |
| Migration drop `images` | Không có |

Do đó lỗi không phải do migration đã tạo rồi bị xóa; bằng chứng hiện có phù hợp hơn với việc schema hiện tại tiến lên trước migration snapshot.

## 4. Các mismatch khác ngoài `Hospital.images`

Đã chạy `prisma migrate diff` ở chế độ read-only từ database hiện tại tới `schema.prisma`. Diff không ghi dữ liệu và cho thấy các nhóm mismatch sau:

### Enum thiếu

- `HospitalType`
- `PartnershipStatus`
- `DataSource`
- `EncounterStatus`
- `ObservationCategory`
- `MatchingStatus`
- Các giá trị mới `MOMO`, `VIETQR`, `CARD` của `PaymentMethod`

### Cột thiếu/khác

- `hospitals`: `city`, `hotline`, `emergencyHotline`, `coverImageUrl`, `images`, `website`, `email`, `operatingHours`, `googleMapUrl`, `latitude`, `longitude`, `establishedYear`, `bedCount`, `externalId`, `hospital_code`, `reviewCount`, `source`, `status`, `type`.
- `appointment_slots`: `version`.
- `appointments`: `expiresAt`, `idempotencyKey`, `medicalServiceId`, `reminderCount`, `reminderSentAt`.
- `doctor_workplaces`: `branchId`, `isPrimary`, `joinedAt`, `position`.
- `doctors`: `consultationCount`, `externalId`, `gender`, `reviewCount`, `source`, `title`, `yearsOfExperience`; schema diff cũng đề xuất bỏ `experience`.
- `medical_services`: `specialtyId` và default khác của `price`/`duration`.
- `notifications`: `channel`, `externalId`.
- `patient_profiles`: các field BHYT, mã địa bàn, dân tộc, quốc tịch, tiền sử, guardian và field code mở rộng.
- `specialties`: `coverImageUrl`.
- `users`: `hospitalId`, `resetPasswordExpiresAt`, `resetPasswordToken`.

### Bảng thiếu

Diff cũng đề xuất tạo các bảng chưa có trong database, gồm `notification_logs`, `hospital_specialties`, `health_packages`, `pre_exam_sessions`, `pre_exam_questions`, `screening_media`, `medical_passports`, `medical_passport_shares`, `medical_passport_access_logs`, `medical_encounters`, `diagnoses`, `observations`, `prescriptions`, `prescription_items`, `patient_hospital_links` và các quan hệ/index tương ứng.

Đây là mismatch schema rộng, không chỉ một cột `images`.

## 5. Có migration thứ 11 bị thiếu không?

### Điều đã xác minh

- Source copy có đúng 10 migration directories.
- `_prisma_migrations` trong PostgreSQL có 10 migration hoàn tất.
- Không có `.git` trong source copy hoặc snapshot để truy ngược branch/commit.
- Không có file migration thứ 11 trong thư mục source hiện tại.

### Đánh giá

Có hai khả năng chính:

1. **Schema hiện tại thuộc snapshot mới hơn migration chain** — phù hợp với diff rộng và việc schema có nhiều model/field mới.
2. **Một hoặc nhiều migration đã bị bỏ khỏi source snapshot** — không thể loại trừ tuyệt đối vì không có Git history/manifest đầy đủ.

Không đủ bằng chứng để khẳng định một “migration thứ 11” cụ thể. Chắc chắn hơn là: **10 migration hiện tại không đủ để tạo `schema.prisma` hiện tại**.

## 6. Hash chứng minh source không bị thay đổi

Hash được đọc lại trong audit; không có thao tác ghi source:

| File | SHA-256 sau audit |
|---|---|
| `prisma/schema.prisma` | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` |
| `prisma/migrations/20260715034437_init/migration.sql` | `a6abcb0ea0e10b5edb77464e9b385263d0af7c838d83f25b820095d55a8261b6` |
| `prisma/migrations/20260919163000_add_scheduling_and_availability_engine/migration.sql` | `245fb532fd044ff1bdd5ec7c97a544e11ce2509a8147604b843d73dc2075c7db` |

`schema.prisma` hash vẫn khớp provenance trước đó. Không có “hash trước/sau” khác trong cùng audit vì audit chỉ đọc; trạng thái sau bằng trạng thái provenance đã xác nhận.

## 7. Ảnh hưởng đến harness và tái lập

Harness fail ngay tại `test/occupancy-v1.harness.ts:301`, khi gọi `prisma.hospital.create()`, do Prisma Client đọc field `images` nhưng PostgreSQL không có cột tương ứng.

Ảnh hưởng:

- E1 chưa bắt đầu.
- E2 baseline/normal-first/pre-exam-first/barrier chưa bắt đầu.
- E6 success/fault rollback chưa bắt đầu.
- Không có latency, success/conflict/failure, over-capacity hoặc rollback metric hợp lệ.
- Không thể coi kết quả cũ là tái lập được từ source + 10 migration hiện tại nếu chưa giải quyết provenance mismatch.

## 8. Phương án khắc phục đề xuất

Không thực hiện trong audit này. Cần người phụ trách xác định một trong các hướng sau:

1. Tìm đúng migration snapshot/commit tương ứng với `schema.prisma` hiện tại, đặc biệt migration tạo `images` và các bảng/cột mới.
2. Nếu migration bị thiếu, khôi phục migration chính thức từ đúng source provenance; không tự viết migration chỉ để vượt qua lỗi harness.
3. Nếu V1 thực nghiệm thực sự dùng schema cũ, dùng đúng schema/migration snapshot cũ tương ứng với implementation V1 thay vì dùng `schema.prisma` hiện tại.
4. Chỉ sau khi source–migration pair được xác định mới xem xét migration bổ sung trên database V1 cô lập.
5. Sau schema verification mới được chạy lại harness; không dùng `db push`, không thêm cột thủ công và không chỉnh database để che mismatch.

## 9. PASS / BLOCKED

| Hạng mục | Kết quả |
|---|---|
| Phân biệt Prisma schema / migration schema / PostgreSQL schema | PASS |
| Xác định `Hospital.images` trong schema | PASS |
| Tìm `images` trong toàn bộ 10 migrations | PASS — không có |
| Xác định commit/thời điểm chính xác | BLOCKED — không có Git history |
| Xác định migration thứ 11 cụ thể | BLOCKED — không có snapshot evidence |
| Tìm các mismatch khác | PASS — mismatch rộng được xác nhận bằng read-only diff |
| Đánh giá ảnh hưởng harness | PASS — fail trước trial đầu tiên |
| Source integrity | PASS — hash không đổi |
| Đủ điều kiện sửa/chạy lại | BLOCKED |

## Kết luận cuối

Root cause có độ chắc chắn **cao** ở mức snapshot mismatch: `schema.prisma` hiện tại mới hơn hoặc không cùng provenance với 10 migration đã áp dụng. Root cause chính xác ở mức commit/migration bị thiếu là **chưa xác định được** vì không có Git history hoặc source manifest tương ứng.

**BLOCKED — cần xác định đúng source–migration provenance trước mọi thay đổi và trước khi chạy lại V1 harness.**
