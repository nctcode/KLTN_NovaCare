# V1 Experimental Reproducibility Readiness

## 1. Phạm vi và trạng thái an toàn

Báo cáo này là audit read-only đối với source snapshot V1. Trong bước này không sửa source V1, không chạy migration, không kết nối hoặc ghi vào database hiện tại, không chạy harness/thực nghiệm mới, không thay đổi Git branch/commit và không ghi đè CSV/JSON cũ.

### Kết luận tổng quát

**Ready with prerequisites** cho việc chuẩn bị tái lập. Việc chạy lại chính xác 210 trials vẫn **Blocked for execution** cho đến khi có database PostgreSQL mới, cô lập hoàn toàn, được xác minh đúng target và có sự cho phép rõ ràng.

## 2. Source snapshot

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Source path | Ready | `C:\Users\trinh\.copilot\session-state\c430313c-a6ee-4b4e-b2b7-aac21ab492db\v1-source\nova-care-backend` |
| Git branch | `develop` | Provenance audit |
| Git HEAD | `585dcd8db9d612b4d35d758fe7d285b4762298b6` | Provenance audit |
| `package.json`, lockfile | Có, lockfile v3 | Source snapshot |
| Prisma schema | Có: `prisma/schema.prisma` | Source snapshot |
| Prisma migrations | Có 10 migration directories | `prisma/migrations/` |
| V1 harness | Có: `test/occupancy-v1.harness.ts` | Source snapshot |
| Config/build files | Có | `tsconfig*.json`, `test/jest-e2e.json`, Docker files |

## 3. SHA-256 đối chiếu

Các hash sau được tính lại từ source snapshot và khớp với các hash đã ghi trong artifact/provenance record.

| File V1 quan trọng | SHA-256 | Trạng thái |
|---|---|---|
| `prisma/schema.prisma` | `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5` | Khớp |
| `src/modules/appointments/appointments.service.ts` | `a1125e0cad2989aba91cd98fc9c648fccaa6be58efe9ef9c9e7e5bb33bf4aaf5` | Khớp |
| `src/modules/appointments/occupancy-claim.ts` | `4dbb1d0706f780b1cad36df21cd2dec6fefd11c7e23f388a1da7a30adf06d92c` | Khớp |
| `src/modules/pre-exam/pre-exam.service.ts` | `b66f45cfa912fe9c1c61efe5fd7948c6c82df301b6e299eb878fff07148bd09f` | Khớp |
| `src/modules/pre-exam/pre-exam.module.ts` | `91d2b81845055140e36d5a3de8478627d2d590afd0249e861a8737d4b96fa54d` | Khớp |
| `src/modules/schedules/slot-status.service.ts` | `efaeeb3bfe8f3260b7dc13e9347893cd70829cb7ef8600ecedb96f43e11098e2` | Khớp |
| `test/occupancy-v1.harness.ts` | `66708f13419bf049d93e9c9702e490071b12e5f760dcd5be423eb576e32d6d0d` | Khớp theo provenance record |

## 4. Dependency và runtime

| Thành phần | Phiên bản/evidence | Phân loại |
|---|---|---|
| Node.js | Dockerfile dùng `node:22-alpine`; host audit có `v22.18.0` | Ready with prerequisites |
| npm | Host audit có `10.9.3`; phải cài theo lockfile | Ready with prerequisites |
| `@prisma/client` | Lockfile `6.2.1`; package yêu cầu `^6.2.1` | Ready |
| `prisma` CLI | Lockfile `6.2.1` | Ready |
| NestJS common | Lockfile `11.1.28` | Ready |
| TypeScript | Lockfile `5.9.3` | Ready |
| ts-node | Lockfile `10.9.2` | Ready |
| PostgreSQL | Artifact ghi server `16.14`; compose chỉ ghi `postgres:16-alpine` | Ready with prerequisites |

Không thấy `.nvmrc` hoặc `engines` bắt buộc phiên bản Node. Node 22 là phiên bản được chỉ dẫn bởi Dockerfile.

## 5. DATABASE_URL và database cô lập

Harness yêu cầu `DATABASE_URL` và từ chối ghi nếu URL không trỏ đến:

```text
host = 127.0.0.1
port = 55440
database = novacare_occupancy_v1_test
```

Mẫu an toàn, không ghi mật khẩu:

```text
postgresql://<isolated-user>:<secret>@127.0.0.1:55440/novacare_occupancy_v1_test?schema=public
```

Artifact V1 ghi nhận PostgreSQL `16.14`, database `novacare_occupancy_v1_test`, target loopback port `55440`, synthetic-only và kiểm tra identity trước mỗi service call/fixture write.

Source có `docker-compose.yml`, nhưng compose mặc định dùng database `nova_care`, port `5432` và volume persistent `postgres_data`. Đây không phải target harness V1 và không được dùng với database KLTN đang phát triển. Compose còn chứa biến cấu hình nhạy cảm; các giá trị đó không được sao chép vào báo cáo.

Chưa tạo database mới và chưa kiểm tra kết nối trong audit, nên hạng mục database là **Ready with prerequisites**; việc chạy thực nghiệm hiện tại là **Blocked**.

## 6. Quy trình tái lập dự kiến

Chỉ thực hiện sau khi được cho phép rõ ràng và sau khi xác minh database mới hoàn toàn:

1. Dùng đúng source snapshot và commit `585dcd8db9d612b4d35d758fe7d285b4762298b6`.
2. Dùng Node 22 và cài dependency bằng `npm ci` từ `package-lock.json` trong thư mục cô lập.
3. Khởi tạo PostgreSQL 16.x trong container/volume mới, chỉ bind loopback port `55440`, tạo database `novacare_occupancy_v1_test`.
4. Áp dụng đúng Prisma migrations/schema vào database mới. Bước này chưa chạy trong audit.
5. Đặt `DATABASE_URL` theo target bắt buộc và `V1_REPETITIONS=30`.
6. Ghi metadata provenance (`V1_GIT_HEAD`, branch, hash V0 và đường dẫn kết quả V0) chỉ khi giá trị còn tồn tại; không đoán giá trị thiếu.
7. Chạy `test/occupancy-v1.harness.ts` bằng runtime TypeScript tương thích. Package scripts không khai báo riêng script V1, nên phải xác nhận lệnh chính xác trước khi chạy.
8. Ghi vào thư mục output mới qua `V1_OUTPUT_DIR`; không ghi đè CSV/JSON cũ.

## 7. E1, E2, E6 và fault injection

| Nhóm | Cấu hình | Trials |
|---|---|---:|
| E1 | concurrent create | 30 |
| E2 | normal vs AI baseline | 30 |
| E2 | normal first | 30 |
| E2 | pre-exam first | 30 |
| E2 | barrier release | 30 |
| E6 | multi-slot success | 30 |
| E6 | multi-slot fault rollback | 30 |
| **Tổng** |  | **210** |

Fault injection thuộc harness V1 và được dùng trong nhánh E6 rollback. Quy trình phải giữ nguyên hook/barrier/fault-injection của source V1.

## 8. Điều kiện còn thiếu để tái lập chính xác 210 trials

1. Database PostgreSQL mới, cô lập, đúng `127.0.0.1:55440/novacare_occupancy_v1_test`.
2. Xác nhận server thực tế là PostgreSQL 16.14 hoặc ghi rõ sai khác patch version.
3. Áp dụng migrations/schema vào database mới và xác nhận không có dữ liệu phát triển.
4. Cài dependency bằng đúng lockfile và xác nhận Prisma generated artifacts.
5. Xác nhận các biến provenance V0/V1 nếu harness dùng để ghi metadata.
6. Xác nhận lệnh harness và thư mục output mới.
7. Có quyền chạy thực nghiệm rõ ràng sau khi kiểm tra database isolation.
8. Giữ nguyên 30 repetitions mỗi nhóm và không trộn kết quả với lần chạy khác.

## 9. Đối chiếu với workspace hiện tại

Workspace hiện tại không được xem là source tái lập V1:

| Thành phần | Source V1 | Workspace hiện tại |
|---|---|---|
| Shared occupancy helper | Có `occupancy-claim.ts` | Chưa có bản tương ứng đã xác nhận |
| Normal service hash | `a1125e...` | `0de987d...` |
| AI service hash | `b66f45...` | `8b3fc7...` |
| Pre-exam module hash | `91d2b8...` | `3aa606...` |
| Harness | V1 hash ở mục 3 | Harness V0 khác |
| Database target | loopback `55440`, DB test riêng | Không được dùng workspace DB |

Không được chạy lại V1 bằng code hiện tại rồi suy luận tương đương.

## 10. Mức độ xác minh và bằng chứng còn thiếu

| Thành phần | Mức độ xác minh | Bằng chứng còn thiếu |
|---|---|---|
| Source path/commit | Đã xác minh qua provenance record | Không thiếu cho nhận dạng snapshot |
| File structure | Đã xác minh read-only | Chưa build lại |
| SHA-256 | Khớp các file cốt lõi | Không thiếu đối với danh sách đã kiểm tra |
| Dependency versions | Đã đọc package/lockfile | Chưa `npm ci`/build trong audit |
| Database target guard | Đã đọc harness | Chưa tạo và kiểm tra DB mới |
| Migration reproducibility | Có migration chain | Chưa áp dụng vào DB mới |
| E1/E2/E6 procedure | Có trong harness/artifact | Chưa chạy lại |
| Exact 210 trials | 7 nhóm x 30 | Chưa tạo output mới vì chưa được phép chạy |

## 11. Kết luận

Source V1 và các hash cốt lõi đủ mạnh để chuẩn bị một lần tái lập có kiểm soát. Kết luận đúng ở thời điểm audit là **Ready with prerequisites**, không phải “đã tái lập thành công”. Bước tiếp theo chỉ được thực hiện sau khi tạo và xác minh database cô lập, xác nhận lệnh harness và nhận sự cho phép rõ ràng để chạy thực nghiệm.

**Trạng thái thực nghiệm trong audit này: chưa chạy.**
