# DRY RUN IMPLEMENTATION REPORT – NOVACARE

**Ngày:** 09/11/2026  
**Phạm vi thực hiện:** Chuẩn bị P0/P2; chưa tiến hành annotation, adjudication, LLM run hoặc scored evaluation.

## 1. Artifact đã tạo

| Artifact | Trạng thái | Ghi chú |
|---|---|---|
| RESEARCH_DECISION_APPROVAL_RECORD.md | READY | Mọi lựa chọn/chữ ký để trống |
| ANNOTATION_GUIDELINE_V0.1.md | DRAFT_UNAPPROVED | Không chứa clinical approval |
| DRY_RUN_CASE_SCHEMA_V0.1.json | READY | Schema input giả lập từ 18 tuổi theo scope đề xuất |
| DRY_RUN_LABEL_SCHEMA_V0.1.json | READY | Chỉ cho phép provisional/needs-review statuses |
| DRY_RUN_CASES_V0.1.jsonl | READY | 16 ca, không chứa reference labels |
| DRY_RUN_LABEL_TEMPLATE_V0.1.jsonl | READY | 16 annotation records trống |
| DRY_RUN_DESIGN_MANIFEST_V0.1.json | INTERNAL_ONLY | Không đưa cho annotator |
| SPECIALTY_CATALOG_SNAPSHOT_DRAFT.json | DRAFT_UNAPPROVED | 5 code từ V3; database IDs/active chưa khóa |
| DRY_RUN_ISSUE_LOG.md | READY | Chưa có issue annotation |
| DRY_RUN_DISAGREEMENT_REPORT.md | PENDING | Chờ annotator A/B |
| DRY_RUN_FILE_HASHES.sha256 | READY | Hash cho package cốt lõi |
| DRY_RUN_PACKAGE_README.md | READY | Quy trình vận hành package |

## 2. Kiểm tra cấu trúc

| Check | Kết quả |
|---|---|
| JSON cases parse được | 16/16 |
| Case IDs duy nhất | 16/16 |
| Label template parse được | 16/16 |
| Case IDs khớp label template | PASS |
| Case IDs khớp design manifest | PASS |
| Specialty entries trong catalog draft | 5 |
| Candidate evidence IDs tồn tại trong Registry V1.1 | PASS |
| Final triage/specialty labels được điền trước | 0 |
| LLM/API được gọi | 0 |

## 3. Phân bổ dry run

| Cohort | Số ca |
|---|---:|
| SAFETY_CRITICAL | 4 |
| CLEAR_ASSESSMENT | 5 |
| CROSS_SPECIALTY_AMBIGUOUS | 3 |
| INSUFFICIENT_INFORMATION | 2 |
| OUT_OF_CATALOG_CONTEXT | 2 |
| **Tổng** | **16** |

## 4. Những việc chưa thực hiện

- Chưa chỉ định hoặc giả lập independent reviewer.
- Chưa gắn nhãn bất kỳ case nào.
- Chưa tính agreement hoặc accuracy.
- Chưa adjudicate safety taxonomy hoặc specialty routing.
- Chưa truy vấn/chỉnh database để lấy specialty IDs.
- Chưa sửa source code, API hoặc runtime RAG corpus.
- Chưa chạy bốn experimental arms.

## 5. Blockers trước khi bắt đầu annotation thật

1. Người nghiên cứu xem và xác nhận tối thiểu scope/age/safety handling trong `RESEARCH_DECISION_APPROVAL_RECORD.md`.
2. Chỉ định annotator A; nếu muốn đo agreement, chỉ định annotator B độc lập.
3. Quyết định annotator có được xem catalog draft hay chỉ dùng Registry.
4. Xác nhận 16 ca dry run sẽ không được tái sử dụng trong locked test.
5. Sao chép label template thành file riêng cho từng annotator và ghi `annotatorId`.

## 6. Readiness

- **Package preparation:** PASS.
- **Ready for researcher review:** YES.
- **Ready for independent annotation:** CONDITIONAL, sau khi hoàn thành các blocker mục 5.
- **Ready for scored Dataset Pilot:** NO.
