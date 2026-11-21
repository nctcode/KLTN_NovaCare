# IEEE Manuscript Finalization Audit — V1 Evidence-Aware Review

## Phạm vi và kết luận

Audit chỉ đọc trên `main.tex`, bản Markdown, report V0/V1, JSON/CSV và assets hình. Không sửa manuscript, không tạo số liệu, không biên dịch và không ghi đè PDF.

**Kết luận: NOT READY — READY FOR FINAL REVISION.**

Bản thảo hiện khá nhất quán về số liệu chính và đã tránh các tuyên bố production/distributed quá mức. Tuy nhiên còn vấn đề quan trọng về provenance schema: manuscript đang mô tả schema synchronization của V1 như một thực tế đã xác minh trực tiếp, trong khi audit provenance chỉ có bằng chứng trực tiếp cho quy trình tương tự ở V0; exact V1 terminal log và catalog database gốc không còn.

## 1. Critical issues

### C1 — Mô tả schema preparation V1 mạnh hơn bằng chứng

- **Vị trí:** `main.tex:134`, tương ứng `NOVACARE_FULL_PAPER_DRAFT.md:94`.
- **Hiện trạng:** viết rằng database rỗng, migrations được áp dụng và Prisma schema synchronization được thực hiện.
- **Vấn đề:** `prisma db push --accept-data-loss` được ghi trực tiếp ở checkpoint V0; exact V1 command không có terminal log trực tiếp. Không còn dump/catalog gốc để xác nhận toàn bộ schema thực tế.
- **Đề xuất:** viết rằng V1 reports mô tả quy trình tương ứng với V0: repository migrations rồi Prisma schema synchronization trên fresh isolated test database; exact V1 synchronization command và complete original catalog không được lưu.

### C2 — Phân biệt historical artifact với independent reproduction

- **Vị trí:** Abstract `main.tex:40`, Results `main.tex:181,224,249`, Conclusion `main.tex:317`.
- **Vấn đề:** các từ “confirmed/ensured” dễ khiến người đọc hiểu đây là lần tái lập độc lập mới. Lần chạy lại mới bị chặn bởi `P2022` trước trial đầu tiên.
- **Đề xuất:** dùng “the preserved V1 run recorded...” hoặc “in the original V1 artifact...” và nêu rõ không phải independent reproduction.

### C3 — Schema hash không chứng minh catalog đầy đủ

- **Vị trí:** `main.tex:134` và bản Markdown dòng 94.
- **Đề xuất:** nói rõ hash xác nhận Prisma source snapshot khớp artifact; không xác nhận database catalog có đủ mọi table/column/enum/constraint.

## 2. Major issues

### M1 — Số liệu chính khớp artifacts

Đối chiếu JSON/CSV/report với `main.tex` cho kết quả **MATCH**:

- V0: 240 trials, 450 service calls, 8 scenarios × 30.
- V1: 210 trials, 360 service calls, 7 scenarios × 30.
- V1 E2: 120 trials, 60 successes và 60 conflicts, 0 over-capacity.
- V1 fault injection: 30/30 intentional failures, rollback được ghi nhận.
- V1 inventory: 180 appointments, 270 slots, 210 membership rows.
- E1 latency: V0 49.08/45.66/70.41/139.54; V1 42.17/38.43/54.37/119.12.
- E2 baseline latency: V0 49.13/44.12/76.77/117.06; V1 22.03/19.70/39.81/44.94.
- E6 success latency: V0 47.11/41.52/60.76/122.97; V1 44.64/42.51/55.49/60.46.

Các latency trên là mean/P50/P95/maximum và khớp request-level JSON theo nearest-rank.

### M2 — Latency comparison cần giữ chú thích workload khác nhau

`main.tex:263–276` đã cảnh báo đúng rằng E2 V0 có hai success còn V1 có một success và một conflict; E1/E6 chỉ là mô tả, không phải benchmark. Nên bổ sung cụm “historical single-run descriptive measurements” và tuyệt đối không thêm TPS/throughput vì chưa đo.

### M3 — Tách ba lớp schema

`main.tex:132–136` cần phân biệt rõ:

1. Prisma declared schema;
2. schema do 10 repository migrations tạo;
3. schema thực tế của original synchronized database.

10 migrations không đủ tái tạo Prisma snapshot; original PostgreSQL catalog/dump không còn.

### M4 — Internal references không đủ cho reproducibility độc lập

References `[9]–[11]` là internal/unpublished artifacts. Có thể giữ để truy xuất nội bộ, nhưng nên thêm version/hash và “available upon request” nếu venue cho phép; không trình bày như peer-reviewed references.

### M5 — Synthetic data cần mô tả sát hơn

`main.tex:132` và bản Markdown đã nêu synthetic-only, không dùng patient/payment/production data, direct service invocation và fixture theo scenario. Nên bổ sung fixture được tạo bởi harness, reset theo trial, không đại diện traffic hoặc phân phối người dùng thật; payment payload synthetic chỉ thuộc V0.

## 3. Minor issues

- `main.tex:157`: đổi “under high contention” thành “under the tested concurrent contention scenarios”.
- `main.tex:40`: thêm “preserved artifact” để tránh hiểu là run mới.
- `main.tex:132`: chú thích port 55440 là original artifact target, không phải port reproduction hiện tại.
- `main.tex:154`: giữ rõ latency là service-call latency; controlled-barrier và fault-injection bị loại khỏi comparable latency.
- Hai assets `img/latency_comparison.pdf` và `img/overcapacity_comparison.pdf` tồn tại; cần kiểm tra bằng mắt sau khi sửa, nhưng audit này không biên dịch.
- `main.tex:17,33`: `hidelinks` nhưng email được tô xanh/gạch dưới thủ công; cần rà soát nhất quán với mẫu IEEE.

## 4. Nội dung cần sửa

### Abstract

Thay “V1 successfully ensured...” bằng “The preserved V1 run recorded one accepted request and one conflict in each of 120 cross-workflow trials...”

### Methodology

Nêu: database rỗng và cô lập; repository migrations được áp dụng; reports mô tả bước Prisma schema synchronization; exact V1 command không còn; original catalog/dump không còn; kết quả là historical artifact, không phải independent reproduction.

### Results and Discussion

Giữ nguyên số liệu. Gắn “recorded in the preserved artifact” ở các đoạn correctness/rollback. Giữ cảnh báo E2 latency không apples-to-apples.

### Threats and Limitations

Bổ sung thiếu original dump/catalog, exact V1 synchronization command chưa xác minh trực tiếp, migration-only source hiện tại không tái tạo đầy đủ schema snapshot, và không gọi kết quả là independently reproduced.

### Conclusion

Giới hạn claim ở “supports feasibility for the preserved source snapshot and tested fixtures”. Không dùng “proved”, “guarantees”, “production-ready”, “distributed correctness” hoặc “performance improvement”.

## 5. Nội dung đã đạt

- Cấu trúc IEEEtran, abstract, keywords, sections, tables, figures và bibliography đã có.
- Số liệu chính V0/V1 trong `main.tex` khớp JSON/CSV/report.
- Bảng P50/P95/maximum E1, E2 baseline và E6 khớp request-level JSON.
- E2 latency đã được cảnh báo là không apples-to-apples.
- Không có tuyên bố TPS/throughput trong manuscript.
- Đã tránh claim production readiness, multi-instance correctness và distributed validation.
- Synthetic data, direct NestJS calls và giới hạn HTTP đã được nêu.
- Threats to Validity và Limitations đã có.
- Hai hình được tham chiếu và assets tồn tại.
- Citation keys trong Related Work khớp các `bibitem` tương ứng.

## 6. Việc cuối cùng trước khi gửi IEEE

1. Sửa provenance wording ở Abstract, Methodology, Results và Conclusion.
2. Gắn V1 claims với preserved historical artifact, không gọi independent reproduction.
3. Bổ sung giới hạn thiếu original dump/catalog và exact V1 synchronization command.
4. Thêm mô tả synthetic fixture generation, reset scope và giới hạn đại diện dữ liệu.
5. Giữ nguyên JSON/CSV; không chỉnh sửa artifacts cũ.
6. Rà soát references `[9]–[11]` theo yêu cầu venue.
7. Sau khi sửa nội dung mới biên dịch XeLaTeX và kiểm tra overflow, bảng, hình, hyperlink, citation/bibliography.
8. Đọc proof cuối như reviewer, không suy rộng sang throughput, production, multi-node hoặc toàn bộ lifecycle.

## Kết luận cuối

**NOT READY — READY FOR FINAL REVISION.** Bản thảo đạt phần lớn yêu cầu số liệu và giới hạn khoa học, nhưng phải sửa provenance wording và phân biệt historical V1 evidence với independent reproducibility trước khi gửi IEEE.
