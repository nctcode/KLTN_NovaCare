# DATASET ANNOTATION DRY RUN PACKAGE V0.1

## Trạng thái

`READY_FOR_RESEARCHER_REVIEW` – chưa được phép chấm điểm hoặc coi là Dataset Pilot chính thức.

## Thành phần

| File | Vai trò | Có đưa cho annotator? |
|---|---|---|
| `ANNOTATION_GUIDELINE_V0.1.md` | Hướng dẫn gắn nhãn | Có |
| `DRY_RUN_CASES_V0.1.jsonl` | 16 ca giả lập, không chứa nhãn | Có |
| `DRY_RUN_LABEL_TEMPLATE_V0.1.jsonl` | Biểu mẫu annotation trống | Sao chép riêng cho từng annotator |
| `DRY_RUN_CASE_SCHEMA_V0.1.json` | Schema case | Có |
| `DRY_RUN_LABEL_SCHEMA_V0.1.json` | Schema label | Có |
| `DRY_RUN_DESIGN_MANIFEST_V0.1.json` | Cohort/tags/evidence hints | **Không**; chỉ study designer |
| `SPECIALTY_CATALOG_SNAPSHOT_DRAFT.json` | Catalog draft | Chỉ dùng nếu người nghiên cứu cho phép |
| `DRY_RUN_ISSUE_LOG.md` | Ghi lỗi quy trình | Có |
| `DRY_RUN_DISAGREEMENT_REPORT.md` | Tổng hợp sau hai annotation | Không đưa trước khi khóa vòng đầu |
| `RESEARCH_DECISION_APPROVAL_RECORD.md` | Biểu mẫu quyết định | Người phê duyệt, không phải annotator |

## Quy trình vận hành

1. Người nghiên cứu duyệt package và ghi các quyết định đủ điều kiện.
2. Chỉ định annotator A và, nếu có, annotator B.
3. Tạo hai bản sao riêng của label template; không chia sẻ giữa annotators.
4. Annotator đọc Registry V1.1 và guideline, sau đó gắn nhãn độc lập.
5. Khóa file annotation bằng hash trước khi so sánh.
6. Tạo disagreement report; không tự adjudicate bằng AI.
7. Cập nhật guideline và decision log theo quy trình phê duyệt.

## Guardrails

- Không chạy NovaCare/LLM trên 16 ca ở giai đoạn này.
- Không tính accuracy, F1 hoặc agreement nếu chỉ có một annotator.
- Không dùng design manifest để gợi ý label cho annotator.
- Không đổi `NEEDS_REVIEW` thành `LITERATURE_SUPPORTED` nếu chưa qua gate.
- Không đưa ca dry run vào locked test sau này nếu đã dùng để sửa guideline.

## Kết quả mong đợi

Dry run chỉ trả lời: schema có rõ không, evidence có truy ngược được không, annotators có hiểu giống nhau không và protocol còn thiếu quy tắc nào.
