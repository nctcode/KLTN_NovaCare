# Prompt phân tích NovaCare và đề xuất đề tài nghiên cứu khoa học

Sao chép toàn bộ nội dung dưới đây để sử dụng với AI:

```text
Bạn là chuyên gia nghiên cứu khoa học trong lĩnh vực Hệ thống thông tin y tế, trí tuệ nhân tạo ứng dụng và kỹ nghệ phần mềm.

Hãy đọc và phân tích toàn bộ source code của dự án NovaCare trong workspace hiện tại trước khi đề xuất đề tài nghiên cứu. Đồng thời đọc tài liệu sitemap tại:

NovaCare_AI_Testing/NOVACARE_SITE_MAP.md

Mục tiêu là đề xuất một số đề tài nghiên cứu khoa học phù hợp, có thể phát triển thành khóa luận hoặc bài báo quy mô sinh viên ngành Hệ thống thông tin.

## 1. Phạm vi cần khảo sát

Khảo sát đầy đủ các thành phần sau:

1. Frontend:
   - Các route/page trong `nova-care-web/src/app`.
   - Các component đặt lịch, Smart Screening, tư vấn trực tuyến, hồ sơ bệnh nhân và quản trị.
   - Cấu hình navigation/sidebar và cơ chế phân quyền giao diện.
2. Backend:
   - Các NestJS module, controller, service và guard trong `nova-care-backend/src`.
   - Các API liên quan đến xác thực, bệnh nhân, bác sĩ, cơ sở y tế, chuyên khoa, lịch hẹn, thanh toán, tư vấn, đánh giá, thông báo và liên thông bệnh án.
3. AI và Smart Screening:
   - `PreExamScreening`, `AIHealthAssessmentWizard`, `ScreeningStep2`, `ScreeningSummary`.
   - `AiScreeningOrchestratorService`.
   - `RedFlagEngineService`, `RiskScoringEngineService`, `ClinicalFeatureExtractorService`, `SpecialtyRecommendationEngineService`.
   - `ScreeningLLMService`, `ClinicalEvidenceService`, `MedicalRAGService` và các cấu hình OpenAI.
   - Luồng phối hợp giữa rule-based, LLM, dữ liệu câu hỏi và dữ liệu chuyên khoa.
4. Database:
   - `nova-care-backend/prisma/schema.prisma`.
   - `prisma/seed.ts` và các model User, PatientProfile, Hospital, Specialty, Doctor, Appointment, Consultation, MedicalPassport, MedicalEncounter, Prescription, Review, Payment và Notification.
5. Tích hợp:
   - HIS/API, medical passport, consent, identity matching, QD4750, LiveKit/video và thanh toán.
6. Kiểm thử:
   - Đọc `NovaCare_AI_Testing/run_actual_tests.ts`, `test_cases_v3.json` và `test_results_actual.json` nếu có.
   - Phân biệt rõ bằng chứng tĩnh từ source với kết quả chạy thực tế.

## 2. Nguyên tắc bắt buộc

- Không đề xuất chức năng hoặc công nghệ mà source không có cơ sở liên quan.
- Không mặc định hệ thống có dữ liệu bệnh nhân thật.
- Không biến một lỗi phần mềm đơn thuần thành tuyên bố y khoa.
- Không kết luận LLM hoạt động thành công nếu source hoặc log không chứng minh được.
- Khi nói về độ chính xác, phải ghi rõ bộ dữ liệu, số lượng mẫu, cách tính và giới hạn của phép đo.
- Không dùng thông tin cá nhân hoặc dữ liệu nhạy cảm thật trong ví dụ nghiên cứu.
- Mọi nhận định quan trọng phải kèm đường dẫn file và số dòng hoặc tên class/function làm bằng chứng.
- Phân biệt ba nhóm:
  1. Chức năng đã tồn tại trong source.
  2. Vấn đề/khoảng trống có thể nghiên cứu.
  3. Ý tưởng mở rộng cần phát triển thêm.
- Nếu không đủ bằng chứng, ghi `Chưa xác định từ source`, không tự suy diễn.

## 3. Phân tích hiện trạng trước khi đề xuất đề tài

Hãy lập báo cáo hiện trạng theo các mục sau:

### 3.1. Bản đồ hệ thống

Tóm tắt các actor, phân hệ, luồng nghiệp vụ và quan hệ giữa frontend, backend, database, AI và hệ thống tích hợp.

### 3.2. Các điểm có tiềm năng nghiên cứu

Tìm các vấn đề có thể đo lường hoặc cải tiến, ví dụ:

- Độ chính xác và khả năng giải thích của Smart Screening.
- So sánh rule-based, LLM và mô hình lai rule-based + LLM.
- Phát hiện red flag và ưu tiên xử lý cấp cứu.
- Gợi ý chuyên khoa từ triệu chứng, vùng cơ thể và câu trả lời sàng lọc.
- Xử lý lỗi khi LLM không khả dụng, API key lỗi hoặc evidence corpus rỗng.
- Độ nhất quán giữa dữ liệu chuyên khoa trong database, alias/code định tuyến và kết quả gợi ý.
- Chất lượng dữ liệu câu hỏi, mất cân bằng nhãn và xây dựng bộ dữ liệu kiểm thử tổng hợp.
- Bảo vệ quyền riêng tư, consent và kiểm soát truy cập hồ sơ y tế.
- Liên thông bệnh án giữa NovaCare và HIS.
- Tối ưu lựa chọn cơ sở, bác sĩ, lịch khám và slot.
- Hiệu quả quy trình tư vấn trực tuyến/video.
- Khả năng quan sát, audit và truy vết quyết định của hệ thống.

Chỉ đưa một hướng vào danh sách đề tài nếu tìm thấy module, API, model, component, test hoặc dữ liệu liên quan trong source.

### 3.3. Các bằng chứng hiện có

Lập bảng gồm:

| Vấn đề | Bằng chứng trong source/runtime | Tác động | Khả năng đo lường |
|---|---|---|---|

Không tự tạo số liệu. Nếu sử dụng số liệu từ `test_results_actual.json`, phải ghi rõ đó là bộ dữ liệu tổng hợp và nêu giới hạn.

## 4. Đề xuất đề tài nghiên cứu

Đề xuất từ 6 đến 10 đề tài, sắp xếp theo mức độ phù hợp với khóa luận ngành Hệ thống thông tin. Ưu tiên đề tài có thể thực hiện trong 3–6 tháng và không yêu cầu xây dựng lại toàn bộ NovaCare.

Với mỗi đề tài, trình bày bảng có các cột:

1. Mã đề tài.
2. Tên đề tài bằng tiếng Việt.
3. Tên tiếng Anh.
4. Phân hệ/source làm căn cứ.
5. Vấn đề nghiên cứu.
6. Câu hỏi nghiên cứu.
7. Mục tiêu.
8. Đối tượng và phạm vi.
9. Phương pháp nghiên cứu.
10. Dữ liệu cần sử dụng hoặc xây dựng.
11. Biến đầu vào và đầu ra.
12. Baseline để so sánh.
13. Chỉ số đánh giá.
14. Kết quả kỳ vọng có thể đo lường.
15. Đóng góp khoa học.
16. Đóng góp thực tiễn cho NovaCare.
17. Mức độ khả thi: Cao, Trung bình hoặc Thấp.
18. Rủi ro, giới hạn và vấn đề đạo đức.
19. File/class/function làm bằng chứng.

## 5. Yêu cầu ưu tiên cho đề tài AI y tế

Nếu đề tài liên quan đến AI hoặc Smart Screening, bắt buộc mô tả:

- Rule-based đang làm gì.
- LLM đang làm gì.
- Thành phần nào quyết định risk level.
- Thành phần nào quyết định specialty.
- Cách ưu tiên red flag trước LLM.
- Fallback khi LLM lỗi hoặc không có API key.
- Cách kiểm tra hallucination, unsupported fact và citation.
- Cách đánh giá false negative, false positive, sensitivity, specificity, precision, recall, F1 và latency nếu dữ liệu cho phép.
- Cách tránh xem kết quả sàng lọc là chẩn đoán bệnh.
- Cách xây dựng bộ dữ liệu synthetic/anonymized và quy trình chuyên gia duyệt nhãn.

## 6. Chọn đề tài phù hợp nhất

Sau bảng đề xuất, hãy chọn 3 đề tài tốt nhất bằng tiêu chí:

- Có vấn đề thực tế trong source.
- Có dữ liệu hoặc có thể xây dựng dữ liệu hợp lệ.
- Có baseline để so sánh.
- Có chỉ số đánh giá rõ ràng.
- Có khả năng tạo ra kết quả mới, không chỉ mô tả phần mềm.
- Phù hợp với thời gian và năng lực sinh viên.
- Không cần sử dụng dữ liệu bệnh nhân thật.

Với mỗi đề tài được chọn, viết thêm:

1. Tên đề tài hoàn chỉnh.
2. Lý do chọn.
3. Giả thuyết nghiên cứu.
4. Mô hình khái niệm hoặc quy trình nghiên cứu.
5. Các bước thực hiện theo tuần.
6. Kiến trúc thử nghiệm.
7. Thiết kế bộ dữ liệu.
8. Thiết kế thực nghiệm và nhóm đối chứng/baseline.
9. Bảng chỉ số cần thu thập.
10. Tiêu chí kết luận đề tài thành công.
11. Các chương dự kiến của khóa luận.

## 7. Định dạng đầu ra

Trả lời bằng tiếng Việt, theo cấu trúc:

1. Tóm tắt hệ thống đã đọc.
2. Các actor và phân hệ liên quan.
3. Các vấn đề có bằng chứng trong source.
4. Bảng 6–10 đề tài đề xuất.
5. Top 3 đề tài được khuyến nghị.
6. Đề cương sơ bộ cho Top 1.
7. Danh sách file/source evidence.
8. Các điểm chưa thể kết luận do thiếu dữ liệu hoặc thiếu runtime evidence.

Mỗi đề tài phải trả lời được câu hỏi: “Nếu thực hiện nghiên cứu này, cần đo cái gì, so sánh với cái gì và kết quả mới nằm ở đâu?”.
```

## Gợi ý các hướng mà prompt sẽ khai thác từ source

Các hướng dưới đây không phải kết luận cuối cùng; AI cần kiểm chứng lại bằng source:

1. Đánh giá mô hình lai Rule-based + LLM cho Smart Screening.
2. Đánh giá độ chính xác và khả năng giải thích của gợi ý chuyên khoa.
3. Phát hiện và ưu tiên red flag trong sàng lọc tiền khám.
4. Xây dựng bộ dữ liệu synthetic để kiểm thử hệ thống AI y tế.
5. Cơ chế fallback và khả năng chịu lỗi khi LLM/API không khả dụng.
6. Chuẩn hóa mapping chuyên khoa giữa catalog, database và AI routing.
7. Bảo vệ quyền riêng tư và kiểm soát chia sẻ hồ sơ bệnh án.
8. Liên thông hồ sơ bệnh án giữa nền tảng đặt khám và HIS.
9. Tối ưu quy trình lựa chọn cơ sở, bác sĩ và lịch khám.
10. Đánh giá hiệu quả tư vấn trực tuyến/video trong hệ thống y tế số.
