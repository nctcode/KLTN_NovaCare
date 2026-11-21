# V1 Final Original Environment Evidence Search

## Phạm vi và an toàn

Audit chỉ đọc. Không kết nối PostgreSQL, không chạy SQL/Prisma/Docker, không sửa source/schema/migration, không chạy migration, `db push`, reset, seed hoặc harness, không xóa/ghi đè artifact.

Đã kiểm tra `D:\KLTN_NovaCare`, `C:\Users\trinh\.copilot\session-state`, PowerShell PSReadLine history, VS Code User/workspace storage và các thư mục Temp liên quan NovaCare/V1.

## Kết luận

**PARTIAL** — Đã tìm được thêm bằng chứng về phương pháp schema synchronization và quy trình tạo artifact, nhưng chưa tìm thấy dump, catalog export hoặc volume snapshot đủ để khôi phục chính xác database PostgreSQL gốc đã tạo ra 210 trials.

## Bằng chứng tìm được

| Đường dẫn | Nội dung | Thời điểm | Đánh giá |
|---|---|---|---|
| `C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\checkpoints\004-running-v0-occupancy-experimen.md` | Ghi trực tiếp: áp dụng repository migrations, sau đó dùng `prisma db push --accept-data-loss` trên fresh dedicated test DB để đồng bộ working-tree schema | Checkpoint session | CONFIRMED cho V0; hỗ trợ quy trình tương ứng của V1 |
| `D:\KLTN_NovaCare\V0_EXPERIMENT_REPORT.md` | Migrations-only schema không khớp working-tree schema; schema synchronization được thực hiện trên DB thử nghiệm mới | Report V0 | CONFIRMED cho V0 |
| `D:\KLTN_NovaCare\V1_IMPLEMENTATION_REPORT.md` | V1 dùng DB `novacare_occupancy_v1_test`, PostgreSQL 16.14, target cũ port 55440; mô tả migration rồi schema synchronization theo V0 | Report V1 | LIKELY cho exact V1 procedure |
| `D:\KLTN_NovaCare\V1_EXPERIMENT_REPORT.md` | Ghi V1 chạy trên isolated database, repository migrations rồi Prisma schema synchronization | Report V1 | LIKELY/indirect |
| `D:\KLTN_NovaCare\V1_EXPERIMENT_RESULTS.json` | 210 rows, 7 scenario, 30 repetitions; database identity, source hash, schema hash, Git HEAD/branch | `2026-11-09T07:53:46.588Z` | CONFIRMED |
| `D:\KLTN_NovaCare\V1_EXPERIMENT_RESULTS.csv` | Bản CSV tương ứng của kết quả V1 | Cùng đợt artifact | CONFIRMED |
| `C:\Users\trinh\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt` | Có `prisma db push` tại dòng 7073, 7084, 7162; có lệnh đọc/hash `V1_EXPERIMENT_RESULTS.json` tại các dòng 7226–7383 | History không có timestamp từng entry | CONFIRMED là history tồn tại; UNKNOWN lệnh nào thuộc V1 cũ |
| `C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\events.jsonl` | Có session/tool records tham chiếu V1 artifact và kiểm tra kết quả; không có terminal output trực tiếp chứng minh exact V1 `db push` | Session 2026-11-09 | LIKELY/indirect |

## Phân biệt các lệnh trong PowerShell history

History chứng minh máy từng chạy `prisma db push`, nhưng context xung quanh gắn với `docker compose`, backend development và thao tác branch chung. Không có DATABASE_URL, database name, port 55440 hoặc output đi kèm để gắn chắc dòng 7073/7084/7162 với database V1 cũ.

- `prisma db push` từng được dùng trên máy: **CONFIRMED**.
- `prisma db push --accept-data-loss` được ghi trực tiếp trong checkpoint V0: **CONFIRMED cho V0**.
- Exact V1 terminal command có `--accept-data-loss`: **LIKELY**, không phải CONFIRMED trực tiếp.
- History chứng minh schema thực tế của V1 cũ: **UNKNOWN**.

Các lệnh đọc/hash `V1_EXPERIMENT_RESULTS.json` là hoạt động phân tích artifact sau chạy, không phải bằng chứng tạo database.

## Backup, dump và snapshot

Đã tìm thấy các file migration SQL và SQL bổ sung (`add_missing_cols.sql`, `rename_col.sql`), cùng các sơ đồ `.puml`/SVG của workspace. Không tìm thấy:

- `.dump`, `.backup`, schema-only dump hoặc archive PostgreSQL của database V1 cũ;
- output `pg_dump` có database `novacare_occupancy_v1_test`;
- PostgreSQL catalog export gồm table/column/enum/constraint;
- volume snapshot/metadata xác định volume cũ trên port 55440.

Hướng dẫn production có ví dụ `pg_dump`, nhưng không có backup thực tế của database V1. Volume V1 hiện tại là môi trường tái lập mới, không phải bằng chứng trực tiếp của volume đã tạo 210 trials.

Trạng thái nhóm backup/snapshot: **UNKNOWN/NOT FOUND trong các vùng đã kiểm tra**.

## Metadata schema thực tế còn có

Artifact V1 ghi:

- database `novacare_occupancy_v1_test`;
- PostgreSQL `16.14`;
- target cũ `127.0.0.1:55440`;
- schema hash `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5`;
- Git HEAD `585dcd8db9d612b4d35d758fe7d285b4762298b6`;
- branch `develop`.

Các metadata này xác định identity và source snapshot ở mức artifact, nhưng không chứa catalog thực tế, `_prisma_migrations` snapshot, enum values đầy đủ, defaults, indexes, FKs hoặc thứ tự SQL bổ sung.

## Đối chiếu với audit trước

[V1_SCHEMA_RECONSTRUCTION_EVIDENCE.md](./V1_SCHEMA_RECONSTRUCTION_EVIDENCE.md) đã xác định 10 migration không tạo đầy đủ `schema.prisma`, trong đó `Hospital.images` và nhiều schema component khác bị thiếu. Lần tìm kiếm cuối không tìm được migration thứ 11, dump hoặc catalog snapshot để loại bỏ mismatch.

Kết quả được củng cố:

1. `schema.prisma` có hash trùng hash artifact V1.
2. 10 migration hiện tại không đủ để tạo schema hiện tại.
3. Hồ sơ cho thấy schema synchronization từng được dùng trên DB thử nghiệm cô lập.
4. Không thể chứng minh exact catalog cũ chỉ từ source, report và result JSON/CSV.

## Bằng chứng còn thiếu

| Bằng chứng | Trạng thái | Ảnh hưởng |
|---|---|---|
| Exact V1 terminal log của `migrate deploy` và `db push` | Chưa tìm thấy | Không xác nhận command sequence trực tiếp |
| `pg_dump --schema-only` hoặc full dump | Chưa tìm thấy | Không phục hồi catalog cũ |
| Old Docker volume/snapshot trên port 55440 | Chưa tìm thấy | Không khởi động lại DB gốc |
| PostgreSQL catalog manifest | Chưa tìm thấy | Không xác nhận toàn bộ schema |
| Commit chứa migration/schema đồng bộ | Artifact có HEAD nhưng source local không có `.git` | Không truy được migration bị thiếu |
| Log chứng minh SQL bổ sung đã chạy trên V1 | Chưa tìm thấy | Không được tự động áp dụng SQL |

## Phân loại kết luận

- Database identity và 210-trial artifact: **CONFIRMED**.
- Schema/source hash trong artifact: **CONFIRMED**.
- V1 dùng database cô lập: **CONFIRMED/strongly supported**.
- Migration rồi schema synchronization: **LIKELY** cho V1; **CONFIRMED** trực tiếp cho V0.
- Exact V1 `prisma db push --accept-data-loss`: **LIKELY**.
- Exact database catalog cũ: **UNKNOWN**.
- Backup/volume snapshot cũ: **UNKNOWN/NOT FOUND**.
- Khôi phục chính xác toàn bộ môi trường: **NOT CONFIRMED**.

## Kết luận cuối

**PARTIAL** — Đã tìm được bằng chứng bổ sung quan trọng về schema synchronization, PowerShell history, session records, artifact identity và thời điểm tạo kết quả. Tuy nhiên chưa tìm thấy bằng chứng gốc đủ để khôi phục chính xác PostgreSQL environment đã tạo ra 210 V1 trials.

Không thực hiện bước khôi phục. Không được dùng SQL/migration suy đoán để tự tái tạo schema và gọi đó là môi trường gốc.
