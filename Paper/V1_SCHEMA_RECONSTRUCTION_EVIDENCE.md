# V1 Original Schema Reconstruction Evidence Audit

## 1. Phạm vi và trạng thái an toàn

Đây là audit chỉ đọc. Không sửa source, Prisma schema, migration, database, container, volume hoặc artifact; không chạy migration, `db push`, reset, seed, harness hay trial. Trong audit này không kết nối database và không ghi dữ liệu.

Nguồn chính được kiểm tra:

- `C:\Users\trinh\AppData\Local\Temp\vscode-agent-codex-sandbox-awSb2c\novacare-v1-repro-isolated`
- `D:\KLTN_NovaCare\V1_EXPERIMENT_RESULTS.json`, CSV và các báo cáo V1
- `C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\checkpoints`

## 2. Kết luận điều hành

**B — Partially reconstructable.**

Có thể xác định khá chắc source/schema snapshot, migration chain, occupancy core và phương pháp schema synchronization đã được mô tả trong hồ sơ thực nghiệm. Tuy nhiên chưa có PostgreSQL dump, catalog snapshot, volume snapshot hoặc log trực tiếp của lần chạy V1 cũ để chứng minh toàn bộ schema thực tế và thứ tự từng lệnh. Vì vậy không thể tuyên bố tái dựng chính xác 100% database ban đầu.

Điểm quan trọng nhất: 10 migration hiện có không tạo đầy đủ `schema.prisma`. `Hospital.images` chỉ là lỗi đầu tiên được harness phát hiện; các mismatch còn lại rộng hơn nhiều.

## 3. Bằng chứng về artifacts và source cũ

| Thành phần | Bằng chứng | Phân loại |
|---|---|---|
| Database cũ | Artifact ghi `novacare_occupancy_v1_test`, PostgreSQL `16.14`, target cũ `127.0.0.1:55440` | CONFIRMED |
| Quy mô thử nghiệm | Artifact có 210 rows, 7 scenario, mỗi scenario 30 repetitions | CONFIRMED |
| Git provenance được ghi trong artifact | HEAD `585dcd8db9d612b4d35d758fe7d285b4762298b6`, branch `develop` | CONFIRMED |
| Schema hash lúc chạy | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` | CONFIRMED |
| Implementation hashes | Artifact ghi hash của các service/helper/harness đã chạy | CONFIRMED |
| Git history local | Source copy và snapshot hiện không có `.git` | CONFIRMED |
| Dump/volume snapshot cũ | Không tìm thấy file dump/backup hoặc volume snapshot riêng có thể phục hồi | NOT FOUND; không đồng nghĩa tuyệt đối không tồn tại |

## 4. Bằng chứng về schema synchronization cũ

### 4.1 Bằng chứng trực tiếp

Checkpoint `004-running-v0-occupancy-experimen.md` ghi rõ quy trình trên database thử nghiệm mới:

1. áp dụng repository migrations;
2. phát hiện migration-created schema không đầy đủ so với working-tree schema;
3. dùng `prisma db push --accept-data-loss` **chỉ trên fresh, dedicated test DB** để đồng bộ.

`V0_EXPERIMENT_REPORT.md` cũng ghi cùng quy trình. Đây là bằng chứng trực tiếp cho V0.

### 4.2 Liên hệ với V1

`V1_IMPLEMENTATION_REPORT.md` và `V1_EXPERIMENT_REPORT.md` ghi V1 dùng quy trình tương ứng với V0: migration trên database rỗng, sau đó Prisma schema synchronization trên database cô lập. Vì vậy phương pháp V1 là **LIKELY** giống `migrate deploy` rồi `prisma db push --accept-data-loss`, nhưng exact V1 terminal log không còn trong dữ liệu hiện có.

| Kết luận | Trạng thái |
|---|---|
| Migration rồi schema synchronization đã được dùng trong hồ sơ V1 | LIKELY, có report hỗ trợ |
| Exact V1 command `prisma db push --accept-data-loss` | LIKELY; exact command được ghi trực tiếp cho V0 và V1 report nói “matching V0 procedure” |
| Có migration thứ 11 cụ thể đã chạy | UNKNOWN |
| Hai SQL rời đã được chạy trong V1 | UNKNOWN |

Không được suy diễn rằng SQL còn thiếu đã được áp dụng chỉ từ việc file tồn tại.

## 5. Đối chiếu schema với 10 migration

Migration chain hiện có gồm 10 thư mục đánh số. Migration tạo `hospitals` là `20260715034437_init/migration.sql`; migration occupancy/scheduling là `20260919163000_add_scheduling_and_availability_engine/migration.sql`.

| Thành phần | Schema hiện tại yêu cầu | Migration/SQL xử lý | Trạng thái |
|---|---|---|---|
| `Hospital.images` | `String[] @default([])` tại `schema.prisma:517` | Không có trong 10 migration; `add_missing_cols.sql` cũng không có | MISSING |
| `hospitals` legacy columns | id, name, address, phone, description, logoUrl, rating, isActive, timestamps, deletedAt | Có trong init | MATCH |
| `hospitals` extended columns | city, hotline, emergencyHotline, coverImageUrl, images, website, email, operatingHours, map, coordinates, externalId, code, reviewCount, source, status, type | Chỉ `externalId`, `source` có trong `add_missing_cols.sql`; phần còn lại không có | DIFFERENT/MISSING |
| `Appointment` | Có thêm expiry, idempotency, medical service, reminder fields | Core appointment tạo bởi numbered migrations; các field mở rộng không đầy đủ | DIFFERENT |
| `AppointmentSlot` | Capacity, `bookedCount`, status và `version` | Occupancy/scheduling migration tạo core; `version` không được tạo | DIFFERENT |
| `AppointmentSlotBooking` | Membership giữa appointment và slot, unique/FK | Occupancy/scheduling migration tạo bảng và ràng buộc core | MATCH cho occupancy core |
| `User` | Thêm `hospitalId` và reset-password fields | Không thấy trong 10 migration hoặc `add_missing_cols.sql` | MISSING |
| `PatientProfile` | Nhiều field BHYT, guardian, history, demographic và security | Một phần có trong `add_missing_cols.sql`, nhiều field vẫn thiếu | DIFFERENT |
| `Doctor` / `DoctorWorkplace` | Các field mở rộng về source, review, workplace/branch | Không đầy đủ trong numbered migrations | DIFFERENT |
| `MedicalService` | `specialtyId`, default price/duration theo schema | `specialtyId` thiếu; defaults khác | DIFFERENT |
| `Notifications` / `Specialties` | channel, externalId, cover image | Không đầy đủ | MISSING |
| Expanded medical/pre-exam models | Các bảng pre-exam, passport, encounter, diagnosis, observation, prescription | Không có trong schema được tạo bởi 10 migration theo diff đã ghi nhận | MISSING |
| Enums | `HospitalType`, `PartnershipStatus`, `DataSource`, `EncounterStatus`, `ObservationCategory`, `MatchingStatus`; PaymentMethod thêm MOMO/VIETQR/CARD | Không đầy đủ trong migration chain | MISSING |

### 5.1 Danh sách bảng được báo cáo là thiếu

`notification_logs`, `hospital_specialties`, `health_packages`, `pre_exam_sessions`, `pre_exam_questions`, `screening_media`, `medical_passports`, `medical_passport_shares`, `medical_passport_access_logs`, `medical_encounters`, `diagnoses`, `observations`, `prescriptions`, `prescription_items`, `patient_hospital_links`, cùng index/FK liên quan.

### 5.2 Constraint, index và quan hệ

Các constraint/index/FK của occupancy core (`AppointmentSlot`, `AppointmentSlotBooking`, counter/capacity và quan hệ appointment-slot) được tạo trong scheduling migration và khớp ở mức core. Với các model mở rộng, diff đã ghi nhận thiếu bảng hoặc thiếu cột nên các FK/index tương ứng cũng không thể xem là đầy đủ. Không có catalog snapshot của database cũ để xác nhận các chi tiết ngoài chain.

## 6. Phân tích hai SQL bổ sung

### `prisma/migrations/add_missing_cols.sql`

File này dùng `ALTER TABLE` để bổ sung:

- `hospitals.externalId`, `hospitals.source`;
- `diagnoses.diagnosisType`, `diagnoses.isComplication`;
- nhiều field cho `medical_encounters`;
- một nhóm field cho `patient_profiles`.

File **không** thêm `hospitals.images`, không tạo các enum/bảng mở rộng và không phải numbered Prisma migration. Nó là bằng chứng về một schema repair/ad-hoc synchronization path, nhưng không chứng minh đã chạy trong lần V1 cũ.

### `prisma/migrations/rename_col.sql`

File này đổi tên `users.hospitalid` thành `users.hospitalId`. Đây cũng là SQL rời, không nằm trong 10 migration được `migrate deploy` quản lý. Không có log trực tiếp chứng minh file đã chạy trên database V1 cũ.

## 7. Những gì có thể tái dựng chắc chắn

1. Nội dung/schema snapshot hiện tại bằng hash `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5`.
2. 10 migration hiện có và thứ tự của chúng.
3. Occupancy core: slot capacity/booked count, booking membership và các ràng buộc chính do scheduling migration tạo.
4. Database identity, target cũ và 210-row artifact structure.
5. Source implementation provenance được artifact ghi bằng HEAD và file hashes.
6. Phương pháp đồng bộ schema được hồ sơ mô tả: migration trên DB rỗng rồi schema synchronization trên DB cô lập.

## 8. Những gì chưa thể xác định

- Commit thực sự thêm `Hospital.images` và các field mở rộng.
- Exact SQL/catalog của database đã sinh ra 210 trials.
- Các SQL rời nào đã được chạy, theo thứ tự nào và trên database nào.
- Database cũ được tạo chính xác bằng command nào nếu chỉ yêu cầu bằng chứng trực tiếp của V1.
- Enum values, defaults, indexes và FK ngoài 10 migration mà không có dump/catalog snapshot.
- Volume snapshot hoặc backup đủ để khởi động lại đúng môi trường ban đầu.

## 9. Ảnh hưởng đến khả năng tái lập

Artifacts cũ chứng minh một môi trường có schema đủ để chạy 210 trials, nhưng source snapshot + 10 migration hiện tại không tái tạo được môi trường đó bằng migration-only. Lỗi `P2022` tại `Hospital.images` là bằng chứng thực nghiệm đầu tiên; các mismatch đã liệt kê cho thấy sửa riêng một cột sẽ không chứng minh schema đầy đủ.

Do đó kết quả cũ có thể được dùng như historical artifact, nhưng chưa thể gọi là reproduced từ source hiện tại. Cần xác định source–schema–database provenance trước khi chạy lại.

## 10. Hash và tính toàn vẹn

Các hash đã có trong provenance/artifact:

| File | SHA-256 |
|---|---|
| `prisma/schema.prisma` | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` |
| `20260919163000_add_scheduling_and_availability_engine/migration.sql` | `245fb532fd044ff1bdd5ec7c97a544e11ce2509a8147604b843d73dc2075c7db` |

Audit chỉ đọc; không có hash “sau thay đổi” vì không có thay đổi. Hash schema khớp hash được ghi trong artifact V1.

## 11. Đề xuất bước tiếp theo (chưa thực hiện)

1. Tìm lại terminal/session log hoặc backup chứa schema synchronization trực tiếp của V1.
2. Tìm `pg_dump`, schema-only dump hoặc volume snapshot của database cũ.
3. Tìm source/migration commit tương ứng với schema hash và implementation hashes trong artifact.
4. Nếu không tìm được bằng chứng mới, ghi rõ trong reproducibility protocol rằng môi trường gốc dùng migration chain cộng schema synchronization, nhưng không khẳng định catalog đầy đủ.
5. Chỉ sau khi được phê duyệt riêng mới lập kế hoạch khôi phục schema; không tự viết SQL dựa trên suy đoán và không dùng `db push` để che mismatch.

## 12. Kết luận

**B — Partially reconstructable.** Có đủ bằng chứng để tái dựng một phần có kiểm soát và giải thích vì sao migration-only hiện tại không khớp. Chưa có đủ bằng chứng trực tiếp để tái dựng chính xác toàn bộ schema/database đã tạo ra 210 trials V1.

