# RESEARCH DECISION APPROVAL RECORD – HYBRID AI NOVACARE

**Ngày tạo biểu mẫu:** 09/11/2026  
**Trạng thái:** `AWAITING_REVIEW`  
**Quy tắc:** Biểu mẫu này không thay thế `PROTOCOL_DECISION_LOG.md`. Chỉ người có thẩm quyền mới được ghi quyết định, họ tên, ngày và căn cứ.

## 1. Quyết định chặn Annotation Dry Run

| Decision | Nội dung cần xác nhận | Khuyến nghị hiện tại | Lựa chọn | Người xác nhận | Ngày | Căn cứ/ghi chú |
|---|---|---|---|---|---|---|
| DL-03 | Phạm vi specialty | 5 specialty: Tim mạch, Thần kinh, Hô hấp, Tiêu hóa, Cơ xương khớp | ☐ APPROVE ☐ REVISE ☐ DEFER |  |  |  |
| DL-04 | Tuổi nghiên cứu | Chỉ ca giả lập từ 18 tuổi | ☐ APPROVE ☐ REVISE ☐ DEFER |  |  |  |
| DL-07 | Safety override | `DEFERRED_AFTER_TRIAGE`; không chấm specialty | ☐ APPROVE ☐ REVISE ☐ DEFER |  |  |  |
| DL-08 | Referral terminology → triage | Dùng bảng mapping riêng và cần cố vấn an toàn duyệt | ☐ APPROVE ☐ REVISE ☐ DEFER |  |  |  |
| DL-14 | Số annotator | Dry run có thể provisional; scored pilot bắt buộc hai annotator | ☐ APPROVE ☐ REVISE ☐ DEFER |  |  |  |
| DL-19 | Catalog snapshot | Khóa ID/code/name/aliases/active/hash trước scored pilot | ☐ APPROVE ☐ REVISE ☐ DEFER |  |  |  |
| DL-20 | Ranh giới tuyên bố | Chỉ gọi literature-based reference label | ☐ APPROVE ☐ REVISE ☐ DEFER |  |  |  |

## 2. Quyết định cần chốt trước Scored Dataset Pilot

| Decision | Nội dung | Khuyến nghị | Lựa chọn/người xác nhận/ngày |
|---|---|---|---|
| DL-05 | Split | `40/20/40` nếu ưu tiên locked evaluation |  |
| DL-06 | Template family | Khác nhau bằng yếu tố lâm sàng, không chỉ paraphrase |  |
| DL-09 | EX-08 | Giữ `NEEDS_REVIEW` hoặc bổ sung thông tin |  |
| DL-10 | EX-04/05/06 | Chỉ scored khi referral evidence/adjudication đủ |  |
| DL-11 | EX-10 | Chuyên gia xác nhận mapping “refer immediately” |  |
| DL-15 | Agreement | Báo metric + CI, chưa đặt threshold tùy ý |  |
| DL-16 | Primary estimand | ITE primary, conditional-on-success secondary |  |
| DL-17 | Multiple testing | Ba contrast chính; Holm nếu kiểm định xác nhận |  |
| DL-18 | Reproducibility | Khóa model/prompt/config và chạy lặp subset |  |

## 3. Sign-off

- **Người nghiên cứu:** ____________________  **Ngày:** __________
- **Người hướng dẫn:** ____________________  **Ngày:** __________
- **Cố vấn y tế/an toàn:** ____________________  **Ngày:** __________
- **AI engineer/catalog owner:** ____________________  **Ngày:** __________
- **Ghi chú chung:**

> Chưa có chữ ký hoặc controlled electronic approval thì mọi mục vẫn giữ trạng thái trong Decision Log hiện tại.
