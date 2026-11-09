# EVIDENCE VERIFICATION CHECKLIST – SECOND REVIEWER

**Mục đích:** biểu mẫu cho người xác minh thứ hai. Tất cả ô xác nhận để trống; người lập registry không ký thay.

## 1. Hướng dẫn

Người xác minh phải truy cập nguồn độc lập, không chỉ đọc registry. Với mỗi nguồn:

- kiểm tra title, issuer/authors, year, version, DOI/official URL;
- mở đúng chapter/section/recommendation/page;
- so sánh excerpt từng chữ và đảm bảo ngữ cảnh không bị đảo nghĩa;
- chấm riêng bốn task directness;
- ghi conflict và không sửa trạng thái thành `VERIFIED` nếu không mở được toàn văn;
- không phê duyệt `routingCriteria` nếu không có thẩm quyền chuyên môn.

## 2. Checklist theo nguồn

| Evidence ID | Metadata checked | Official/full text opened | Locator checked | Excerpt exact | Task directness agreed | Version current | Conflict/notes | Reviewer | Date | Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| DOC-BYT-ACS-2019 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-AHA-CHEST-2021 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-BYT-STROKE-2024 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-CDC-STROKE-2026 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-AAFP-HEADACHE-2022 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-BYT-COPD-2023 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-GOLD-COPD-2025 | ☐ | ☐ | ☐ | n/a | ☐ | ☐ | Expected SUPERSEDED |  |  |  |
| DOC-GOLD-COPD-2026 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-ACG-GERD-2022 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-NICE-LBP-NG59 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-NICE-NEURO-NG127 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-BYT-MSK | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-NICE-CHEST-CG95 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-NICE-COPD-NG115 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |
| DOC-NICE-GERD-CG184 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |  |  |  |  |

## 3. Checklist excerpt và quyền sử dụng

| Check | Reviewer entry |
|---|---|
| Mỗi excerpt là đoạn ngắn, nguyên bản và tìm lại được | ☐ |
| Không excerpt nào do AI tạo hoặc dịch ngược thành “nguyên bản” | ☐ |
| Bản dịch/tóm tắt tiếng Việt không thay thế excerpt | ☐ |
| Locator dùng đúng pagination/version của URL lưu | ☐ |
| Đã ghi hạn chế khi nguồn chỉ có abstract hoặc mirror | ☐ |
| Không dùng nguồn superseded cho label mới | ☐ |

## 4. Checklist case mapping

| Case | Triage evidence sufficient? | Specialty evidence sufficient? | Applicability agreed? | Mapping terminology clinically approved? | Notes/reviewer/date |
|---|---|---|---|---|---|
| EX-01 | ☐ | ☐ | ☐ | ☐ |  |
| EX-02 | ☐ | ☐ | ☐ | ☐ |  |
| EX-03 | ☐ | ☐ | ☐ | ☐ |  |
| EX-04 | ☐ | ☐ | ☐ | ☐ |  |
| EX-05 | ☐ | ☐ | ☐ | ☐ |  |
| EX-06 | ☐ | ☐ | ☐ | ☐ |  |
| EX-07 | ☐ | ☐ | ☐ | ☐ |  |
| EX-08 | ☐ | ☐ | ☐ | ☐ |  |
| EX-09 | ☐ | ☐ | ☐ | ☐ |  |
| EX-10 | ☐ | ☐ | ☐ | ☐ |  |

## 5. Runtime corpus gate

Chỉ sau evidence review mới lập evidence chunks. Reviewer runtime kiểm tiếp:

| Runtime check | Result |
|---|---|
| ID duy nhất và truy ngược registry record | ☐ |
| `text` giữ đúng quote/context và không quá 8.000 ký tự | ☐ |
| `sourceUrl`, `version`, `section` chính xác | ☐ |
| `minAge/maxAge`, `regionIds`, `specialtyCodes` được duyệt | ☐ |
| `contentHash` khớp exact text | ☐ |
| `expiresAt` và lịch review được định nghĩa | ☐ |
| `reviewedBy/reviewedAt` là người thực, không tự động điền | ☐ |
| Mỗi `routingCriteria.evidenceQuote` tồn tại nguyên văn trong chunk | ☐ |
| `anySymptoms` không vượt nội dung quote | ☐ |
| Safety-only evidence không biến thành specialty routing criterion | ☐ |

## 6. Sign-off

- **Independent reviewer:** ____________________
- **Affiliation/role:** ____________________
- **Review date:** ____________________
- **Conflicts of interest:** ____________________
- **Overall decision:** `ACCEPT` / `ACCEPT_WITH_LIMITATION` / `RETURN_FOR_REVISION` / `EXCLUDE`
- **Signature or controlled electronic approval:** ____________________
