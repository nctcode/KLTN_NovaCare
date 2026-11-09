# Báo cáo kiểm tra Smart Screening NovaCare

**Thời điểm chạy:** 08-11-2026 (UTC trong file kết quả: `2026-11-08T09:02:36Z`)  
**Phiên bản catalog:** `192ebcf08a7bf1f8`  
**Phạm vi:** luồng smartphone V3, catalog câu hỏi, bộ điều phối, luật nguy cơ, định tuyến chuyên khoa, tích hợp LLM và danh mục chuyên khoa đang hoạt động.

## 1. Kết luận điều hành

Smart Screening V3 là luồng **lai giữa luật xác định và LLM**. Các dấu hiệu khẩn cấp được đánh giá bằng luật trước, trả hướng dẫn ngay và không chờ LLM. Với trường hợp không bị dừng sớm, LLM được gọi để trích xuất dữ kiện từ lời kể; dữ kiện hợp lệ được thêm vào tập facts để xếp hạng chuyên khoa. LLM đề xuất chuyên khoa chỉ được gọi nếu kho bằng chứng lâm sàng trả về tài liệu phù hợp.

Trong cấu hình chạy lần này, 31 lời gọi trích xuất LLM đều kết thúc với `AUTH_FAILED`; không có lời gọi LLM nào thành công trong 60 ca. Luồng vẫn chạy fallback luật/câu trả lời catalog. Kho bằng chứng chưa được cấu hình (`SCREENING_KNOWLEDGE_PATH` không có), nên **không có bước LLM đề xuất chuyên khoa dựa trên evidence trong lượt chạy này**. Vì vậy, không thể xem kết quả batch là kiểm chứng chất lượng LLM.

Trong 36 ca được dùng chấm gợi ý chuyên khoa (loại ca có red flag kỳ vọng và toàn bộ Nhi khoa), 9 ca khớp nhãn kỳ vọng (**25%**). Hệ thống nâng nguy cơ cho cả 21 ca red flag kỳ vọng, nhưng có thêm 5 ca không được đánh dấu red flag trong dữ liệu kiểm thử bị nâng thành EMERGENCY/URGENT. Đây là đối chiếu với bộ nhãn tổng hợp có sẵn trong workspace, không phải chuẩn vàng do bác sĩ xác nhận.

## 2. Kiến trúc và luồng thực thi

1. Frontend lấy catalog có phiên bản và gửi vùng cơ thể, mô tả triệu chứng, tuổi, câu trả lời, đau/thời gian; dữ liệu ảnh/giọng nói có quy tắc đồng ý riêng.
2. `POST /api/v1/pre-exam-v2/analyze-smartphone` gọi `PreExamV2Service.analyzeSmartphoneInputs`, sau đó `AiScreeningOrchestratorService.orchestrateScreening`.
3. `normalizeScreeningInput` xác thực phiên bản catalog, vùng cơ thể, câu hỏi thuộc vùng được chọn, dữ liệu bắt buộc và chuyển câu trả lời thành facts/red flags.
4. `ClinicalFeatureExtractorService` và `RedFlagEngineService` rút trích dấu hiệu; các luật khẩn cấp/khẩn được áp dụng trước mọi lời gọi LLM. `painLevel >= 8` cũng có thể tạo mức URGENT.
5. Trường hợp tuổi dưới 18 chuyển `REVIEW_REQUIRED`; câu trả lời bắt buộc thiếu hoặc vùng cơ thể mâu thuẫn cũng dừng trước gợi ý.
6. Với ca còn lại, facts từ câu trả lời và luật văn bản được kết hợp với trích xuất narrative LLM; bộ xếp hạng chỉ chọn trong các chuyên khoa `isActive` lấy từ Prisma.
7. Nếu có shortlist và kho evidence trả chunks, hệ thống mới gọi LLM `propose`; kết quả chỉ được nhận nếu specialty ID, fact IDs và citations đều khớp. Nếu kho rỗng, nguồn gợi ý là `QUESTIONNAIRE_RULES`.

Luồng cấp cứu không phụ thuộc LLM: trong batch, các ca dừng bằng luật có thời gian 0–1 ms; không gọi provider. Không có thao tác ghi dữ liệu được thực hiện bởi harness. Runner gọi trực tiếp cùng orchestrator để tránh giới hạn 10 request/phút của route; danh mục chuyên khoa được đọc từ database qua Prisma.

## 3. Bằng chứng về LLM và cách dùng kết quả

| Hạng mục | Bằng chứng/kết quả |
|---|---|
| Vị trí gọi | `ScreeningLLMService.extractNarrative` được gọi từ `ai-screening-orchestrator.service.ts`; `propose` ở cùng service chỉ gọi khi `retrieved.chunks.length > 0`. |
| Model | Cấu hình runtime đọc `OPENAI_MODEL_CHAT`/`OPENAI_MODEL_VISION`; môi trường được khảo sát ghi model chat/vision `gpt-5.4`, transcription `whisper-1`. Không ghi API key vào báo cáo. |
| Input narrative | Nội dung triệu chứng hoặc transcript đã xác nhận; prompt yêu cầu trích quote, specialty code, polarity. |
| Dùng kết quả | Fact trả về được kiểm tra quote/polarity/chuyên khoa hỗ trợ, thêm vào `input.facts`, rồi `rankSpecialties` dùng các facts đó. Đây là đường dữ liệu sử dụng thực, không chỉ gọi bỏ. |
| LLM đề xuất cuối | Nhận specialty, fact IDs và citation IDs; orchestrator kiểm tra candidate, facts và citations. Nhánh này không chạy khi evidence corpus rỗng. |
| Lỗi trong batch | 31/31 lời gọi narrative ghi `providerErrors: [{stage: "NARRATIVE", code: "AUTH_FAILED"}]`; 0 thành công; không có lỗi làm hỏng request. Nguyên nhân cụ thể phía provider không thể xác định chỉ từ mã lỗi này (có thể cần xác minh quyền/key/base URL/model ở cấu hình triển khai). |
| Nguy cơ telemetry | `aiStatus` khởi đầu là `NOT_RUN`; khi gọi narrative lỗi đổi thành `EXTRACTION_UNAVAILABLE`, nhưng code không đặt trạng thái thành “đã trích xuất thành công”. Một lần probe HTTP riêng trước batch trả về facts text nhưng vẫn `aiStatus: NOT_RUN`. Trường này vì vậy không đủ để chứng minh thành công/thất bại của extraction. |

## 4. Danh mục chuyên khoa thực tế

Danh sách đang hoạt động được lấy từ endpoint `/api/v1/specialties` trong phiên khảo sát và đối chiếu với dữ liệu seed; có 12 chuyên khoa. Dataset có 5 tình huống mỗi chuyên khoa.

| Mã nhóm ca | Chuyên khoa |
|---|---|
| CARDIO | Tim mạch |
| NEURO | Thần kinh |
| ENDO | Nội tiết |
| PED | Nhi khoa |
| OBGYN | Sản phụ khoa |
| ORTHO | Cơ xương khớp |
| ENT | Tai Mũi Họng |
| EYE | Mắt |
| DENTAL | Răng Hàm Mặt |
| DERM | Da liễu |
| GASTRO | Tiêu hóa |
| PULMO | Hô hấp |

## 5. Kết quả chạy thực tế

| Chỉ số | Kết quả |
|---|---:|
| Tổng tình huống | 60 (12 chuyên khoa × 5) |
| Gợi ý chuyên khoa đúng | 9/36 ca được chấm = **25,0%** |
| Gợi ý sai/không khớp kỳ vọng | 27/36 ca được chấm |
| Red flag kỳ vọng được nâng EMERGENCY/URGENT | 21/21 |
| Red flag dương tính giả theo nhãn dataset | 5 |
| Mức nguy cơ khớp chính xác | 48/57 = **84,2%**; loại 3 nhãn `MONITOR` vì V3 không xuất mức đó |
| LLM được gọi | 31 |
| LLM gọi thành công trong batch | 0 |
| LLM lỗi xác thực | 31 (`AUTH_FAILED`) |
| Không gọi LLM | 29 (cấp cứu/khẩn hoặc dừng REVIEW_REQUIRED) |
| Lỗi request/exception toàn ca | 0 |
| Thời gian orchestrator | min 0 ms; median 360 ms; max 792 ms; mean 207 ms |

**Các ca red flag dương tính giả theo nhãn dữ liệu:** `TC-CARDIO-03`, `TC-ORTHO-02`, `TC-DENTAL-01`, `TC-DERM-03`, `TC-PULMO-04`. 21 ca red flag kỳ vọng đều được nâng nguy cơ, nhưng trong số này một số được xếp URGENT thay vì EMERGENCY; vì thế “phát hiện nguy cơ” không đồng nghĩa “đúng mức độ”.

| Chuyên khoa kỳ vọng | Đúng / ca được chấm | Ghi chú |
|---|---:|---|
| Tim mạch | 0/3 | 2 ca red flag được chấm ở chỉ số nguy cơ |
| Thần kinh | 2/3 | 2 ca red flag |
| Nội tiết | 1/4 | 1 ca red flag |
| Nhi khoa | — | 0 ca được chấm; luồng tuổi <18 trả `REVIEW_REQUIRED` |
| Sản phụ khoa | 0/4 | 1 ca red flag |
| Cơ xương khớp | 2/4 | 1 ca red flag |
| Tai Mũi Họng | 2/3 | 2 ca red flag |
| Mắt | 0/3 | 2 ca red flag |
| Răng Hàm Mặt | 0/4 | 1 ca red flag; mapping specialty code còn thiếu |
| Da liễu | 0/4 | 1 ca red flag |
| Tiêu hóa | 1/2 | 3 ca red flag |
| Hô hấp | 1/2 | 3 ca red flag |

Một smoke probe qua HTTP trước batch trả HTTP 200 và có dữ kiện text trích xuất trong response; lần đó không được tính vào bảng 60 ca vì không thuộc lượt chạy batch. Batch gọi cùng service lại nhận `AUTH_FAILED`, nên cần xem trạng thái provider là không ổn định giữa hai context chạy; không dùng probe riêng để nâng số thành công của batch.

### Giới hạn phép đo

- Bộ `test_cases.json` đã tồn tại trước khi chạy lượt này. Tôi giữ nguyên file đó, tạo `test_cases_v3.json` với input theo schema catalog và dùng nhãn cũ làm expected. Nhãn kỳ vọng và lời giải thích trong bộ đó chưa được xác nhận y khoa độc lập.
- Gợi ý chuyên khoa tính trên ca không kỳ vọng red flag và loại toàn bộ Nhi khoa, do flow dưới 18 tuổi cố ý trả `REVIEW_REQUIRED`, không chọn chuyên khoa. Các ca kỳ vọng red flag được chấm trong chỉ số an toàn riêng.
- Red flag “đúng” ở đây nghĩa là kết quả thuộc EMERGENCY/URGENT; dương tính giả tính theo `is_red_flag` của bộ synthetic. Không suy rộng thành độ nhạy/đặc hiệu lâm sàng.
- V3 chỉ có `CONSULT`, `URGENT`, `EMERGENCY` trong output orchestrator; nhãn cũ `MONITOR` không thể so sánh một cách hợp lệ.

## 6. Vấn đề tìm thấy

| Mức | Vấn đề | Tác động/bằng chứng |
|---|---|---|
| Cao | Provider narrative lỗi xác thực ở 31 lần gọi | Không có LLM extraction cho phần lớn ca cần tư vấn; luồng chuyển sang luật/câu trả lời catalog. API Key có cấu hình nhưng provider từ chối xác thực; không thể khẳng định sâu hơn nguyên nhân. |
| Cao | Độ khớp chuyên khoa thấp trong tập ca này | 9/36 (25%); một số ca CONSULT trả chuyên khoa khác hoặc không gợi ý. Chỉ số cần được diễn giải với giới hạn nhãn synthetic. |
| Cao | Chuyên khoa Răng Hàm Mặt không có alias/code trong `screening-routing.ts` | Danh sách alias có nha khoa trong seed/database nhưng code mapping không có code `dental`/`odontology`; việc xếp hạng và narrative facts không thể đại diện nhất quán chuyên khoa này. |
| Trung bình | 5 ca không red flag theo expected bị nâng EMERGENCY/URGENT | Liệt kê ở trên; có thể do luật rộng, ngưỡng đau, hoặc tình huống synthetic không khớp semantics của rule. Cần kiểm tra từng rule/wording trước khi đổi ngưỡng. |
| Trung bình | `aiStatus` không biểu đạt thành công của extraction | `NOT_RUN` vẫn có thể xuất hiện sau khi LLM trả kết quả; khó quan sát vận hành. |
| Trung bình | Không có knowledge corpus trong cấu hình hiện tại | `ClinicalEvidenceService` trả evidence rỗng; `propose` LLM không được gọi, nên hiện tại LLM không quyết định chuyên khoa cuối qua nhánh evidence. |
| Trung bình | Nhi khoa luôn dừng ở `REVIEW_REQUIRED` với tuổi <18 sau khi qua red flag | Không tạo gợi ý Nhi khoa cho nhóm trẻ em; đây là giới hạn được code chủ ý nêu, không phải lỗi phân loại tự động. |
| Trung bình | Ba expected `MONITOR` không có mức tương ứng ở output orchestrator V3 | Không thể tính accuracy mức nguy cơ trên toàn bộ labels nếu không thống nhất taxonomy/version. |

## 7. Đề xuất cải thiện

1. Kiểm tra quyền API key, base URL và quyền truy cập model bằng health check không chứa dữ liệu sức khỏe; ghi mã lỗi có thể hành động nhưng tuyệt đối không log secret.
2. Sửa telemetry `aiStatus` theo trạng thái riêng cho narrative extraction và evidence-based proposal; phân biệt `CALLED/SUCCEEDED/FAILED/SKIPPED`.
3. Bổ sung mapping chuyên khoa Răng Hàm Mặt dựa trên code thống nhất với catalog/database, sau đó thêm test định tuyến riêng.
4. Rà lại từng false positive red flag bằng test rule có input tối thiểu và đáp án chuẩn được người có chuyên môn duyệt; không giảm độ nhạy cấp cứu chỉ để tăng accuracy chung.
5. Chuẩn hóa bộ nhãn nguy cơ giữa phiên bản cũ và V3 (`MONITOR`, `CONSULT`, `URGENT`, `EMERGENCY`) và dùng một expected dataset đã được chuyên gia thẩm định.
6. Với Nhi khoa, nếu sản phẩm muốn gợi ý chuyên khoa dưới 18 tuổi, cần quy trình/guardrail được kiểm định riêng; trạng thái hiện tại chủ động yêu cầu review.

## 8. Tệp đầu ra và mã nguồn đối chiếu

- Bộ 60 ca có input tái sử dụng theo V3: `test_cases_v3.json`.
- Kết quả thực thi từng ca, response quan sát được, thời gian, trạng thái LLM và tổng hợp: `test_results_actual.json`.
- Runner tái chạy cùng orchestrator: `run_actual_tests.ts` (lệnh chạy nằm trong phần sau).
- Giữ nguyên các file có trước `test_cases.json`, `test_results.json`, `BAO_CAO_KIEM_THU_AI_SANG_LOC.md`.

Nguồn code chính: `nova-care-backend/src/modules/pre-exam-v2/pre-exam-v2.controller.ts`, `pre-exam-v2.service.ts`, `ai/ai-screening-orchestrator.service.ts`, `normalization/screening-input.ts`, `engines/red-flag-engine.service.ts`, `engines/screening-routing.ts`, `modules/ai/services/screening-llm.service.ts`, `modules/ai/services/clinical-evidence.service.ts`, `prisma/seed.ts`; frontend gọi route từ `nova-care-web/src/services/screening/bookingScreening.ts`.

Chạy lại từ thư mục `nova-care-backend` (cần provider credentials hiện hành):

```powershell
$env:NODE_PATH = (Resolve-Path node_modules).Path
$env:TS_NODE_TRANSPILE_ONLY = 'true'
$env:TS_NODE_PROJECT = (Resolve-Path tsconfig.json).Path
npx ts-node -r tsconfig-paths/register ../NovaCare_AI_Testing/run_actual_tests.ts
```

Runner ghi đè hai file đầu ra phiên bản mới `test_cases_v3.json` và `test_results_actual.json`; nó không ghi database. Không chạy lại nếu chưa muốn thực hiện thêm lời gọi provider.
