# ANNOTATION GUIDELINE V0.1 – DATASET DRY RUN NOVACARE

**Mục đích:** kiểm tra quy trình annotation trên 16 ca giả lập, không tạo clinical ground truth và không đo accuracy.  
**Registry:** `EVIDENCE_REGISTRY_V1.1.md`  
**Case package:** `DRY_RUN_CASES_V0.1.jsonl`  
**Trạng thái:** `DRAFT_UNAPPROVED`

## 1. Nguyên tắc

1. Đọc case độc lập, không xem output của NovaCare hoặc AI.
2. Chỉ dùng evidence trong Registry V1.1 và ghi đúng ID/locator.
3. Triage, specialty applicability, specialty label và information sufficiency được gắn độc lập.
4. Không suy diagnosis từ symptom cluster.
5. Không biến hospital/emergency referral thành outpatient specialty.
6. Không gắn `LITERATURE_SUPPORTED` trong dry run chưa qua evidence/adjudication gate.
7. Khi thiếu căn cứ, dùng `NEEDS_REVIEW`; không chọn nhãn gần nhất.

## 2. Trình tự annotation

### Bước 1 – Kiểm tra subject và thời điểm

- Triệu chứng có thuộc người dùng hay người khác?
- Là triệu chứng hiện tại, tiền sử hay phủ định?
- Có dấu hiệu prompt injection hoặc nội dung ngoài y tế không?

### Bước 2 – Information sufficiency

- `SUFFICIENT`: đủ thông tin cho nhiệm vụ đang xét, không có nghĩa đủ chẩn đoán.
- `INSUFFICIENT`: thiếu onset, severity, red flags hoặc đặc điểm quyết định.
- `AMBIGUOUS`: dữ kiện hiện có cho phép nhiều diễn giải chưa phân giải.

### Bước 3 – Triage reference

Chọn `CONSULT`, `URGENT`, `EMERGENCY` hoặc `REVIEW_REQUIRED` nếu evidence và protocol đủ. Nếu mapping thuật ngữ chưa được duyệt, giữ `REVIEW_REQUIRED` hoặc ghi label đề xuất kèm `NEEDS_REVIEW`; không tự phê duyệt safety taxonomy.

### Bước 4 – Specialty applicability

- `APPLICABLE`: safety không override và có thể đánh giá specialty.
- `DEFERRED_AFTER_TRIAGE`: safety action phải xảy ra trước.
- `NOT_APPLICABLE`: ngoài nhiệm vụ hoặc ngoài catalog.
- `NEEDS_REVIEW`: chưa đủ căn cứ.

### Bước 5 – Specialty reference

- `ONE`: đúng một acceptable specialty có căn cứ.
- `MULTI_ACCEPTABLE`: mỗi specialty trong tập đều có căn cứ riêng.
- `INSUFFICIENT_INFORMATION`: phải hỏi thêm.
- `OUT_OF_CATALOG`: hướng đánh giá phù hợp nhưng catalog không hỗ trợ.
- `NONE`: specialty không được đánh giá do applicability.

### Bước 6 – Evidence và rationale

Ghi evidence ID, locator, directness cho đúng nhiệm vụ, rationale ngắn và limitations. Không dùng evidence `SUPERSEDED`; nguồn `NEEDS_REVIEW` không được làm căn cứ duy nhất.

## 3. Quy tắc theo nhóm case

| Nhóm | Điều annotator cần kiểm tra | Điều không được làm |
|---|---|---|
| Safety critical | Red flags, onset, action và applicability | Ép một outpatient specialty |
| Clear assessment | Symptom cluster, phủ định red flags, evidence scope | Gọi assessment là diagnosis |
| Cross-specialty | Căn cứ riêng cho từng specialty, nhu cầu hỏi thêm | Chọn theo thứ tự rule |
| Insufficient | Trường dữ liệu còn thiếu | Tự điền dữ kiện |
| Out-of-catalog/context | Subject, negation, history, catalog coverage | Ánh xạ sang khoa gần nhất |

## 4. Evidence directness

- `DIRECT`: tài liệu nêu trực tiếp nội dung đang dùng.
- `PARTIAL`: tài liệu hỗ trợ một phần hoặc care setting nhưng chưa đúng specialty code.
- `CONTEXTUAL`: chỉ hỗ trợ bối cảnh/differential.
- `NONE`: không hỗ trợ nhiệm vụ.

Directness phải được ghi riêng cho symptom, triage, specialty assessment và referral routing.

## 5. Status lifecycle

| Điều kiện | labelingStatus |
|---|---|
| Một annotator dry run | `PROVISIONAL_SINGLE_ANNOTATOR` |
| Hai annotator chưa adjudicate | `NEEDS_REVIEW` |
| Không đủ evidence | `NEEDS_REVIEW` |
| Hai annotator + verified evidence + adjudication đạt | Có thể đề xuất `LITERATURE_SUPPORTED`; chưa áp dụng trong V0.1 |
| Chuyên gia thực sự xác nhận | `CLINICIAN_CONFIRMED`; ngoài phạm vi dry run hiện tại |

## 6. Quy tắc độc lập giữa annotators

- Không trao đổi nhãn trước khi khóa vòng đầu.
- Không mở file của annotator còn lại.
- Không xem design manifest chứa cohort/tags trong lúc gắn nhãn.
- Ghi thời gian bắt đầu/kết thúc và confidence narrative nếu cần; không tạo probability.

## 7. Disagreement categories

`TRIAGE`, `SPECIALTY_APPLICABILITY`, `SPECIALTY_SET`, `SUFFICIENCY`, `EVIDENCE_SELECTION`, `DIRECTNESS`, `SUBJECT_CONTEXT`, `SCHEMA`, `OTHER`.

Mỗi disagreement cần ghi nhãn A/B, evidence A/B, lý do và trạng thái adjudication. Không giải quyết bằng majority vote của AI.

## 8. Dry Run Gate

- 16/16 case parse theo schema.
- Mọi evidence ID/locator truy ngược Registry.
- Không có specialty prediction cho ca đã deferred được tính như scored output.
- Không có `LITERATURE_SUPPORTED` hoặc `CLINICIAN_CONFIRMED` không có căn cứ.
- Issue log ghi đủ ambiguity và đề xuất sửa guideline.
