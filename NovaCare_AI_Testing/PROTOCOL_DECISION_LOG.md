# PROTOCOL DECISION LOG – NOVACARE V1.1

**Quy tắc:** chỉ người có thẩm quyền nêu trong cột xác nhận mới chuyển trạng thái. `APPROVED` bên dưới chỉ áp dụng cho hai quyết định được người nghiên cứu yêu cầu rõ trong nhiệm vụ ngày 09/11/2026.

| ID | Quyết định | Khuyến nghị | Lý do | Rủi ro nếu không chốt | Người cần xác nhận | Trạng thái |
|---|---|---|---|---|---|---|
| DL-01 | Quy mô 150 ca | Giữ 150 cho pilot | Người nghiên cứu yêu cầu giữ mục tiêu | Scope trôi, không lập được family plan | Người nghiên cứu | `APPROVED` |
| DL-02 | Số experimental arms | Giữ RULE_ONLY, LLM_ONLY, LLM_RAG, HYBRID | Người nghiên cứu yêu cầu giữ bốn arms | Không đo riêng tác động RAG | Người nghiên cứu | `APPROVED` |
| DL-03 | Phạm vi 5 specialty | Tim mạch, Thần kinh, Hô hấp, Tiêu hóa, Cơ xương khớp | Mapping V3 có hỗ trợ tương đối và có nguồn nền | Quá rộng làm nhãn yếu; quá hẹp giảm giá trị | Người nghiên cứu + cố vấn chuyên môn | `OPEN` |
| DL-04 | Tuổi nghiên cứu | Chỉ ca giả lập từ 18 tuổi | Phù hợp safety policy V3 hiện tại | Ca bị gate chặn không đo đúng method | Người nghiên cứu | `OPEN` |
| DL-05 | Split ratio | Dùng 40/20/40 (60/30/60) theo 50 family ×3 | Tăng locked test specialty-eligible; vẫn có validation | 60/20/20 cho test quá nhỏ; 40/20/40 giảm dev | Người nghiên cứu/thống kê | `OPEN` |
| DL-06 | Định nghĩa family | Ba ca cùng family phải khác nhau bằng yếu tố lâm sàng có ý nghĩa, không chỉ paraphrase/demographic | Giảm duplicate và leakage | CI giả hẹp, memorization template | Người nghiên cứu | `OPEN` |
| DL-07 | Safety override | `DEFERRED_AFTER_TRIAGE`, không chấm specialty | Quyết định specialty không được thực thi | Đánh giá sai năng lực LLM/rules | Người nghiên cứu + bác sĩ/cố vấn an toàn | `OPEN` |
| DL-08 | Mapping “refer immediately” → EMERGENCY | Phê duyệt bảng mapping thuật ngữ guideline sang triage labels | Đây là biến đổi protocol, không phải câu chữ nguồn | Over/under-triage reference | Bác sĩ/cố vấn an toàn | `NEEDS_REVIEW` |
| DL-09 | EX-08 | Tạm `NEEDS_REVIEW`; bổ sung dữ kiện hoặc adjudicate | Dữ kiện hiện tại chưa đủ phân tầng | Nhãn URGENT tùy ý | Bác sĩ/cố vấn an toàn | `NEEDS_REVIEW` |
| DL-10 | EX-04/05/06 specialty | Chỉ đưa locked test khi có referral evidence hoặc adjudication | Evidence hiện tại chủ yếu theo lĩnh vực | Gọi nhãn yếu là literature-supported | Hai annotator + adjudicator | `NEEDS_REVIEW` |
| DL-11 | EX-10 triage | Giữ immediate safety action; xác nhận label `EMERGENCY` | NICE nói refer immediately, không dùng chính taxonomy protocol | Sai ánh xạ triage | Bác sĩ/cố vấn an toàn | `NEEDS_REVIEW` |
| DL-12 | Evidence BYT Stroke 2024 | Lưu bản chính thức, locator và verifier thứ hai | Bản hiện có chưa đủ provenance | Không tái lập | Evidence reviewers | `NEEDS_REVIEW` |
| DL-13 | GOLD version | Dùng DOC-GOLD-COPD-2026, supersede 2025 | Bản 2026 hiện hành tại ngày audit | Version drift | Evidence reviewers | `OPEN` |
| DL-14 | Hai annotator | Bắt buộc cho locked test; một người chỉ tạo provisional pilot | Dual-pass không phải independent agreement | Overstate reliability | Người nghiên cứu/người hướng dẫn | `OPEN` |
| DL-15 | Agreement thresholds | Không đặt ngưỡng tùy ý trước pilot; báo kappa/Jaccard và CI, rồi duyệt gate | Chưa có prevalence/effect data | Gate không thực tế hoặc post hoc | Người nghiên cứu/thống kê | `OPEN` |
| DL-16 | Primary estimand | ITE utility là chính; conditional-on-success là phụ | Provider reliability là một phần vận hành | Selection bias nếu chỉ tính successful calls | Người nghiên cứu/thống kê | `OPEN` |
| DL-17 | Multiple testing | Chọn ba contrasts chính, CI ưu tiên; Holm nếu kiểm định xác nhận | Giảm false positive | Cherry-picking | Người nghiên cứu/thống kê | `OPEN` |
| DL-18 | Model reproducibility | Khóa provider/model snapshot, prompt, temperature/seed nếu hỗ trợ; chạy lặp subset | LLM có tính ngẫu nhiên/version drift | Không tái lập | Người nghiên cứu/AI engineer | `OPEN` |
| DL-19 | Specialty catalog snapshot | Khóa ID, code, name, aliases và hash trước labeling | Source mapping và DB có thể đổi | Nhãn/prediction dùng catalog khác nhau | Người nghiên cứu/AI engineer | `OPEN` |
| DL-20 | Clinical claim boundary | Chỉ gọi literature-based reference; không gọi clinical accuracy/ground truth | Không có bác sĩ xác nhận toàn bộ | Kết luận khoa học vượt bằng chứng | Người nghiên cứu/người hướng dẫn | `OPEN` |
