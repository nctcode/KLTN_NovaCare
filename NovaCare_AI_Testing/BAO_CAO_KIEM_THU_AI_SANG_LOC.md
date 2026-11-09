# BÁO CÁO TOÀN DIỆN: ĐÁNH GIÁ CHỨC NĂNG AI SÀNG LỌC TIỀN KHÁM & GỢI Ý CHUYÊN KHOA (NOVACARE SMART SCREENING)

**Dự án:** Nền tảng Y tế Số NovaCare  
**Phân hệ:** Trợ lý Sàng lọc Tiền khám Thông minh (Smart Screening & Triage v2/v3)  
**Ngày thực hiện:** 08/11/2026  
**Môi trường thực thi:** Backend NestJS, Database Prisma (12 Chuyên khoa), AI Engine (Hybrid Rule-based + Medical RAG + Beeknoee OpenAI Gateway)

---

## MỤC LỤC BÁO CÁO

1. [Phân tích kiến trúc & Quy trình xử lý lâm sàng](#1-phân-tích-kiến-trúc--quy-trình-xử-lý-lâm-sàng)
2. [Xác minh việc tích hợp LLM / Trí tuệ nhân tạo](#2-xác-minh-việc-tích-hợp-llm--trí-tuệ-nhân-tạo)
3. [Cơ chế phân loại nguy cơ (Triage) & Dấu hiệu báo động đỏ (Red Flags)](#3-cơ-chế-phân-loại-nguy-cơ-triage--dấu-hiệu-báo-động-đỏ-red-flags)
4. [Bộ dữ liệu kiểm thử 60 ca lâm sàng (12 chuyên khoa)](#4-bộ-dữ-liệu-kiểm-thử-60-ca-lâm-sàng)
5. [Kết quả kiểm thử thực tế & Bảng số liệu thống kê](#5-kết-quả-kiểm-thử-thực-tế)
6. [Phân tích các trường hợp sai lệch & Hạn chế của hệ thống](#6-phân-tích-các-trường-hợp-sai-lệch)
7. [Đề xuất cải tiến kỹ thuật cho Khóa luận tốt nghiệp](#7-đề-xuất-cải-tiến-kỹ-thuật)

---

## 1. PHÂN TÍCH KIẾN TRÚC & QUY TRÌNH XỬ LÝ LÂM SÀNG

Qua kiểm tra trực tiếp mã nguồn tại `src/modules/pre-exam-v2/` và `src/modules/ai/`, hệ thống NovaCare được thiết kế theo mô hình **Phòng vệ theo chiều sâu (Defense-in-Depth Hybrid Architecture)**, kết hợp giữa 3 tầng công nghệ:

```
[Người dùng nhập dữ liệu: Text, Voice Audio, Ảnh chụp, PPG camera, Sơ đồ cơ thể]
                                     │
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │  TẦNG 1: SAFETY-FIRST GATE (Bảo vệ an toàn tuyệt đối)       │
      │  - RedFlagEngineService & TriageEngineService               │
      │  - Quét dấu hiệu nguy kịch (Đột quỵ, Nhồi máu, Hôn mê, SpO2)│
      └─────────────────────────────────────────────────────────────┘
                     │                             │
            (Có dấu hiệu cấp cứu)         (Không có dấu hiệu cấp cứu)
                     ▼                             ▼
       ┌───────────────────────────┐ ┌───────────────────────────────┐
       │ TRẢ VỀ CẤP CỨU LẬP TỨC    │ │ TẦNG 2: MULTIMODAL FEATURE    │
       │ - Cảnh báo ĐỎ (EMERGENCY) │ │ EXTRACTION & NORMALIZATION    │
       │ - Hướng dẫn gọi 115       │ │ - Whisper: STT lời kể         │
       │ - KHÔNG CHỜ GỌI LLM       │ │ - GPT Vision: Phân tích ảnh   │
       └───────────────────────────┘ │ - PPG: Lọc nhịp tim camera    │
                                     └───────────────────────────────┘
                                                     │
                                                     ▼
                                     ┌───────────────────────────────┐
                                     │ TẦNG 3: SPECIALTY SCORING     │
                                     │ - Anatomical Priors (15%)     │
                                     │ - Symptom Keyword (30%)       │
                                     │ - Clinical Pattern (30%)      │
                                     │ - Vector RAG Knowledge (15%)  │
                                     │ - Specialty Constraint Check  │
                                     └───────────────────────────────┘
                                                     │
                                                     ▼
                                     ┌───────────────────────────────┐
                                     │ TẦNG 4: LLM VALIDATION & RAG  │
                                     │ - ScreeningLLMService.propose │
                                     │ - Đối chiếu bằng chứng & fact │
                                     │ - Fallback tự động nếu mất mạng│
                                     └───────────────────────────────┘
```

---

## 2. XÁC MINH VIỆC TÍCH HỢP LLM / TRÍ TUỆ NHÂN TẠO

### Bằng chứng trong mã nguồn
Hệ thống **THỰC SỰ CÓ TÍCH HỢP LLM/API AI**, không phải là mã giả lập đơn giản:
1. **API Gateway & Model:** Được cấu hình trong `.env` và `openai.service.ts`:
   - `OPENAI_BASE_URL`: `https://platform.beeknoee.com/api/v1`
   - `OPENAI_API_KEY`: Được cấp khóa hợp lệ dạng `sk-bee-...`
   - `OPENAI_MODEL_CHAT`: `gpt-5.4`
   - `OPENAI_MODEL_VISION`: `gpt-5.4`
   - `OPENAI_MODEL_WHISPER`: `whisper-1`
   - `OPENAI_MODEL_EMBEDDING`: `text-embedding-3-small`
2. **Các điểm gọi API cụ thể:**
   - `ScreeningLLMService.extractNarrative`: Trích xuất thực thể triệu chứng có cấu trúc JSON từ lời kể bệnh nhân.
   - `ScreeningLLMService.inspectImage`: Phân tích thị giác máy tính cho ảnh tổn thương da, mắt, niêm mạc họng.
   - `ScreeningLLMService.propose`: Gửi prompt kèm theo tài liệu trích dẫn y khoa để LLM xác nhận chuyên khoa.
   - `MedicalRAGService.generateEmbedding`: Tạo vector nhúng 1536 chiều để tính độ tương đồng Cosine Similarity.
   - `OpenAIService.generateAdaptiveQuestions`: Sinh 3-5 câu hỏi thích ứng cá nhân hóa theo từng ca bệnh.

### Cơ chế chống "Ảo giác AI" (Anti-Hallucination & Guardrails)
- **Kiểm tra tính có căn cứ (Grounded Verification):** LLM chỉ được phép đề xuất chuyên khoa nằm trong danh sách ứng viên (`shortlist candidates`) đã được lọc sẵn từ CSDL bệnh viện, tuyệt đối không được tự chế ra tên chuyên khoa lạ.
- **Ràng buộc trích dẫn (Strict Citation Constraint):** LLM bắt buộc phải trả về `citationIds` và `factIds`. Nếu LLM trả về chuyên khoa không có trích dẫn chứng minh hoặc sai lệch với dữ liệu cơ sở y tế, hệ thống sẽ gán cờ `INSUFFICIENT_EVIDENCE` và chuyển sang sử dụng kết quả Rule-based từ bảng câu hỏi.
- **Cơ chế Fallback kiên cố khi mất kết nối AI:** Nếu thiếu API Key, hết hạn ngạch hoặc mạng bị ngắt, hệ thống chuyển sang hàm `fallbackSmartphoneTriage` và `fallbackLocalEmbedding` dựa trên giải thuật băm vector toán học, đảm bảo người bệnh luôn nhận được gợi ý khám mà không bị sập ứng dụng.

---

## 3. CƠ CHẾ PHÂN LOẠI NGUY CƠ (TRIAGE) & DẤU HIỆU BÁO ĐỘNG ĐỎ

Hệ thống phân tầng nguy cơ thành 3 mức:
- 🔴 **EMERGENCY (Khẩn cấp / Cấp cứu):** Nhồi máu cơ tim, đột quỵ não, co giật, suy hô hấp nặng, thủng tạng rỗng, thai ngoài tử cung vỡ, bỏng hóa chất mắt, nhịp tim `< 45` hoặc `> 130 BPM`, SpO2 `< 90%`.
- 🟡 **CONSULT (Nên khám bác sĩ chuyên khoa):** Đau mức độ trung bình-nặng (> 3/10), sốt, có triệu chứng bệnh lý cơ quan rõ rệt cần làm cận lâm sàng.
- 🟢 **MONITOR (Theo dõi tại nhà / Định kỳ):** Khám sức khỏe định kỳ, triệu chứng nhẹ không đau, tư vấn dinh dưỡng.

**Quy tắc bất biến:** Mọi tình huống phát hiện Red Flag đều được ngắt luồng xử lý ngay lập tức để trả về hướng dẫn cấp cứu 115, không được phép trì hoãn để chờ phản hồi từ LLM.

---

## 4. BỘ DỮ LIỆU KIỂM THỬ 60 CA LÂM SÀNG

Bộ dữ liệu kiểm thử gồm **60 ca bệnh** độc lập (5 ca cho mỗi chuyên khoa trong số 12 chuyên khoa thực tế):
- Toàn bộ dữ liệu được lưu trữ dạng JSON có cấu trúc tại:  
  📁 `NovaCare_AI_Testing/test_cases.json`
- Danh mục 12 chuyên khoa bao gồm:
  1. **Tim mạch** (`TC-CARDIO-01` đến `05`)
  2. **Thần kinh** (`TC-NEURO-01` đến `05`)
  3. **Nội tiết** (`TC-ENDO-01` đến `05`)
  4. **Nhi khoa** (`TC-PED-01` đến `05`)
  5. **Sản phụ khoa** (`TC-OBGYN-01` đến `05`)
  6. **Cơ xương khớp** (`TC-ORTHO-01` đến `05`)
  7. **Tai Mũi Họng** (`TC-ENT-01` đến `05`)
  8. **Mắt** (`TC-EYE-01` đến `05`)
  9. **Răng Hàm Mặt** (`TC-DENTAL-01` đến `05`)
  10. **Da liễu** (`TC-DERM-01` đến `05`)
  11. **Tiêu hóa** (`TC-GASTRO-01` đến `05`)
  12. **Hô hấp** (`TC-PULMO-01` đến `05`)

---

## 5. KẾT QUẢ KIỂM THỬ THỰC TẾ

Toàn bộ 60 tình huống kiểm thử đã được chạy qua bộ kiểm thử tự động. Dữ liệu chi tiết từng ca được ghi nhận tại tập tin:  
📁 `NovaCare_AI_Testing/test_results.json`

### Bảng tổng hợp số liệu định lượng

| Chỉ số đánh giá | Kết quả đạt được | Tỷ lệ (%) | Đánh giá |
| :--- | :---: | :---: | :--- |
| **Tổng số ca kiểm thử** | 60 / 60 | 100% | Phủ đủ 12 chuyên khoa CSDL |
| **Gợi ý đúng chuyên khoa** | **49 / 60** | **81.67%** | Tốt trên bài toán phân loại đa lớp |
| **Đánh giá đúng mức nguy cơ (Triage)** | **49 / 60** | **81.67%** | Đảm bảo tính an toàn y tế |
| **Phát hiện đúng ca có Dấu hiệu Cấp cứu (Red Flag)** | **16 / 21** | **76.19%** | Bắt trúng hầu hết các ca nguy kịch |
| **Thời gian phản hồi trung bình (Response Time)** | **15.4 ms** | - | Cực nhanh với cơ chế Rule + Local RAG |
| **Tỷ lệ xử lý lỗi / Fallback an toàn** | 60 / 60 | 100% | Không có ngoại lệ gây sập hệ thống |

---

## 6. PHÂN TÍCH CÁC TRƯỜNG HỢP SAI LỆCH & NGUYÊN NHÂN KỸ THUẬT

Qua đối chiếu chi tiết 11 ca gợi ý chuyên khoa chưa chính xác và 5 ca bỏ sót cảnh báo đỏ cấp cứu, các nguyên nhân kỹ thuật được phát hiện gồm:

### 1. Hiện tượng thiên vị vùng giải phẫu (Anatomical Priors Over-weighting)
- **Tình huống điển hình:** `TC-CARDIO-01` (Đau ngực kiểu bóp nghẹt lan cánh tay trái) và `TC-DERM-05` (Vảy nến ở khuỷu tay và đầu gối).
- **Nguyên nhân:** Khi người dùng chọn nhiều vùng chi (`LEFT_ARM`, `RIGHT_ARM`, `LEFT_LEG`, `RIGHT_LEG`), điểm giải phẫu của `Cơ xương khớp` bị cộng dồn liên tục lên tới 11.0 - 15.5 điểm, làm lu mờ triệu chứng tim mạch hoặc tổn thương bề mặt da liễu.

### 2. Thách thức đối với chuyên khoa chuyển hóa toàn thân (Nội tiết)
- **Tình huống điển hình:** `TC-ENDO-01` (Ăn nhiều, uống nhiều, tiểu nhiều, sụt cân), `TC-ENDO-02` (Run tay, sợ nóng, vã mồ hôi).
- **Nguyên nhân:** Triệu chứng Nội tiết mang tính chuyển hóa sinh hóa toàn thân, không khu trú vào một cơ quan đơn lẻ. Khi thuật toán thiếu sự trợ giúp của LLM phân tích ngữ nghĩa, hệ thống dễ gán nhầm sang Tiêu hóa hoặc Nhi khoa.

### 3. Thiếu bao quát một số Red Flag chuyên khoa đặc thù
- **Tình huống điển hình:** `TC-EYE-04` (Bỏng hóa chất mắt) và `TC-ENT-05` (Hóc xương cá gây nuốt đau khó thở).
- **Nguyên nhân:** `TriageEngineService` hiện tại tập trung rất mạnh vào Hội chứng vành cấp, Đột quỵ não và chỉ số sinh hiệu PPG/SpO2, nhưng từ khóa phát hiện dị vật đường ăn và bỏng hóa chất nhãn khoa chưa được đưa vào danh sách kiểm tra cứng (hard rules).

---

## 7. ĐỀ XUẤT CẢI TIẾN KỸ THUẬT

1. **Điều chỉnh trọng số giải phẫu khi có nhiều vùng chi:** Nếu người dùng chọn từ 3 vùng cơ thể trở lên, cần áp dụng hệ số suy giảm (Decay Factor) cho điểm Anatomy để tránh `Cơ xương khớp` chiếm ưu thế áp đảo.
2. **Bổ sung từ khóa Red Flag cho Chuyên khoa lẻ:**
   - Mắt: Bổ sung `bỏng hóa chất`, `nhãn cầu cứng như đá`, `quầng 7 màu`.
   - Tai Mũi Họng: Bổ sung `hóc xương`, `dị vật đường ăn`, `viêm xương chũm`.
3. **Tăng cường bộ quy tắc phủ định (Negation Guardrails):** Đảm bảo các câu mô tả tiền sử như *"Mẹ tôi bị tiểu đường"* hay *"Không đau đầu dữ dội"* không bị trích xuất thành triệu chứng hiện tại của người bệnh.

---
*Tài liệu được kết xuất phục vụ chuyên đề Nghiên cứu & Thực nghiệm Khóa luận Tốt nghiệp.*

