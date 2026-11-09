# EVIDENCE CHANGELOG V1.1

**Ngày:** 09/11/2026  
**Nguồn gốc:** Evidence Consistency Audit

## 1. Thay đổi theo tệp

| Change ID | Tệp | Thay đổi | Lý do | Nguồn xác minh |
|---|---|---|---|---|
| CH-01 | EVIDENCE_REGISTRY_V1.1.md | Tạo bản V1.1 từ V1.0; giữ nguyên 15 ID và statuses | Bảo toàn lịch sử V1.0 | Registry V1.0 |
| CH-02 | EVIDENCE_REGISTRY_V1.1.md | Thêm CDC speech/confusion excerpt và locator web lines 41–47, FAST lines 58–67 | EX-02 dùng excerpt chưa có trong Registry | CDC *Signs and Symptoms of Stroke*, 19/05/2026 |
| CH-03 | EVIDENCE_REGISTRY_V1.1.md | Mở rộng AHA locator p.20, p.22, pp.28–31, p.35; thêm excerpt p.20 và p.29 | Sửa traceability EX-07/EX-09 | Official 2021 AHA/ACC Chest Pain Guideline Slide Set |
| CH-04 | EVIDENCE_REGISTRY_V1.1.md | Thêm NICE CG95 1.2.2.8, 1.3.2.1 và excerpts exertion/history | Mapping EX-07–EX-09 dùng các mục này | NICE CG95 Recommendations |
| CH-05 | EVIDENCE_REGISTRY_V1.1.md | Thêm NICE CG184 1.3.3 và cardiac/biliary differential excerpt | EX-08 dùng excerpt chưa có trong Registry | NICE CG184 Recommendations |
| CH-06 | Registry V1.1 + Specialty Matrix | Chuẩn hóa referral directness của NICE CG95/NG115/CG184 thành `PARTIAL` đối với mã specialty NovaCare | Care-setting referral không tương đương specialty routing | Protocol V1.1 directness rules |
| CH-07 | EVIDENCE_SPECIALTY_MATRIX.md | Thay `scenario-dependent` bằng `DIRECT` có scope acute GI bleeding; ghi uncomplicated reflux là ngoài scope triage đó | Giá trị cũ ngoài enum | NICE CG184 1.3.1 và Protocol V1.1 |
| CH-08 | EVIDENCE_CASE_MAPPING_V1.1.md | Tạo bảng tách bốn evidence tasks và inference cho EX-01–EX-10 | Tránh gộp assessment/routing | Protocol V1.1 |
| CH-09 | EVIDENCE_CASE_MAPPING_V1.1.md | EX-07 dùng excerpt AHA p.29 thay câu p.35 bị locator mismatch | Đảm bảo excerpt-locator exact | AHA slide p.29 |
| CH-10 | EVIDENCE_CASE_MAPPING_V1.1.md | Đồng bộ exact excerpts EX-01, EX-02, EX-08, EX-09, EX-10 với Registry V1.1 | Traceability gate | Các nguồn tương ứng |
| CH-11 | EVIDENCE_GAP_REPORT.md | Thay count 12 bằng breakdown 11 authoritative/DOI + 2 mirror + 1 unavailable + 1 superseded | Làm rõ mẫu số và phương pháp đếm | Audit 15 records |

## 2. Trạng thái không thay đổi

- DOC-BYT-STROKE-2024 vẫn `NEEDS_REVIEW`.
- DOC-GOLD-COPD-2025 vẫn `SUPERSEDED`.
- Không nguồn nào được independent reviewer xác nhận.
- Không case nào được nâng thành `LITERATURE_SUPPORTED`.
- Không decision `OPEN` hoặc `NEEDS_REVIEW` trong Protocol Decision Log được đổi trạng thái.
- Không runtime evidence chunk nào được tạo hoặc đánh dấu `APPROVED`.

## 3. Vấn đề chưa giải quyết

1. Cần mở được bản chính thức DOC-BYT-STROKE-2024 và khóa locator/excerpt.
2. Cần independent reviewer hoàn thành checklist cho các nguồn dùng trong dry run/pilot.
3. Cần phê duyệt phạm vi năm specialty, tuổi và catalog snapshot.
4. Cần chuyên gia duyệt referral terminology → triage taxonomy và safety override.
5. Cần adjudicate EX-04, EX-05, EX-06, EX-08 và EX-10 trước scored pilot.

## 4. Compatibility

V1.0 Registry và Mapping được giữ nguyên làm lịch sử. Các công việc mới phải tham chiếu `EVIDENCE_REGISTRY_V1.1.md` và `EVIDENCE_CASE_MAPPING_V1.1.md`; Specialty Matrix và Gap Report đã được hiệu chỉnh tại chỗ để phản ánh semantics V1.1.
