# EVIDENCE SPECIALTY MATRIX – NOVACARE

**Ngày:** 09/11/2026  
**Chú ý:** Năm specialty vẫn `OPEN`. Ma trận mô tả mức hỗ trợ của tài liệu, không phê duyệt phạm vi hoặc routing policy.

## 1. Ma trận nguồn theo nhiệm vụ

| Evidence ID | Specialty/domain | Nội dung hỗ trợ | Symptom | Triage | Specialty assessment | Referral routing | Status |
|---|---|---|---|---|---|---|---|
| DOC-BYT-ACS-2019 | Cardiology | Đau ngực kiểu đè/siết, lan hàm/tay, triệu chứng kèm | DIRECT | PARTIAL | DIRECT | NONE | VERIFIED_WITH_LIMITATION |
| DOC-AHA-CHEST-2021 | Cardiology + pulmonary/GI differential | Chest-pain equivalents, immediate care, risk pathways | DIRECT | DIRECT | DIRECT | PARTIAL | VERIFIED |
| DOC-NICE-CHEST-CG95 | Cardiology/hospital pathway | ACS symptoms; emergency và same-day hospital referral; specialty code vẫn cần mapping | DIRECT | DIRECT | DIRECT | PARTIAL | VERIFIED |
| DOC-BYT-STROKE-2024 | Neurology | Scope đột quỵ; chưa khóa excerpt phù hợp | NONE | NONE | CONTEXTUAL | NONE | NEEDS_REVIEW |
| DOC-CDC-STROKE-2026 | Neurology/safety | Yếu một bên, nói khó, đau đầu đột ngột; gọi cấp cứu | DIRECT | DIRECT | CONTEXTUAL | NONE | VERIFIED_WITH_LIMITATION |
| DOC-AAFP-HEADACHE-2022 | Neurology/safety | Thunderclap và red flags cần đánh giá ngay | DIRECT | DIRECT | PARTIAL | NONE | VERIFIED_WITH_LIMITATION |
| DOC-NICE-NEURO-NG127 | Neurology/spine | Sudden weakness; cauda equina pattern; immediate referral | DIRECT | DIRECT | DIRECT | PARTIAL | VERIFIED |
| DOC-BYT-COPD-2023 | Pulmonology | Cough/sputum/dyspnea/risk; cơ sở có spirometry | DIRECT | NONE | DIRECT | PARTIAL | VERIFIED_WITH_LIMITATION |
| DOC-GOLD-COPD-2026 | Pulmonology | COPD indicators và yêu cầu spirometry | DIRECT | NONE | DIRECT | NONE | VERIFIED |
| DOC-NICE-COPD-NG115 | Pulmonology/referral | Spirometry; specialist advice trực tiếp nhưng không định danh mã Pulmonology | DIRECT | NONE | DIRECT | PARTIAL | VERIFIED |
| DOC-GOLD-COPD-2025 | Pulmonology | Phiên bản cũ | NONE | NONE | NONE | NONE | SUPERSEDED |
| DOC-ACG-GERD-2022 | Gastroenterology | Heartburn/regurgitation; cardiac exclusion trước GERD testing | DIRECT | PARTIAL | DIRECT | NONE | VERIFIED_WITH_LIMITATION |
| DOC-NICE-GERD-CG184 | Gastroenterology/referral | Dyspepsia/GORD; triage DIRECT chỉ cho acute GI bleeding; specialist referral không tự định danh mã khoa | DIRECT | DIRECT | DIRECT | PARTIAL | VERIFIED |
| DOC-NICE-LBP-NG59 | MSK/spine | Alternative diagnoses; specialist/surgical referral conditions | DIRECT | PARTIAL | DIRECT | PARTIAL | VERIFIED_WITH_LIMITATION |
| DOC-BYT-MSK | MSK | Mechanical low-back pattern và dấu hiệu bất thường | DIRECT | PARTIAL | DIRECT | PARTIAL | VERIFIED_WITH_LIMITATION |

## 2. Khả năng hỗ trợ theo specialty

| Specialty dự kiến | Evidence assessment mạnh nhất | Evidence referral mạnh nhất | Có đủ cho ca rõ? | Giới hạn chính |
|---|---|---|---|---|
| Cardiology | AHA Chest 2021; NICE CG95; BYT ACS 2019 | NICE CG95 tới hospital pathway | Có cho nhận diện/triage; routing outpatient còn điều kiện | Safety override phải deferred; hospital không đồng nghĩa Cardiology clinic |
| Neurology | NICE NG127; CDC Stroke; AAFP Headache | NG127 tới neurological/local pathway trong một số scenario | Có cho red flags; chưa đủ cho mọi symptom | BYT Stroke 2024 chưa qua gate; emergency không chấm specialty |
| Pulmonology | BYT COPD; GOLD 2026; NICE NG115 | NG115 specialist advice; BYT cơ sở có spirometry | Có điều kiện cho chronic COPD-like cluster | “Specialist” không ghi mã Pulmonology; EX-04 chưa có diagnosis |
| Gastroenterology | ACG GERD; NICE CG184 | CG184 specialist service khi non-responsive/unexplained | Có cho assessment; EX-05 routing chưa đủ | Typical reflux có thể quản lý ban đầu, không mặc định specialist |
| Orthopedics/MSK | BYT MSK; NICE NG59 | NG59 surgical opinion; BYT cơ sở chuyên khoa khi nghiêm trọng | Có cho MSK assessment | Catalog gọi Cơ xương khớp nhưng research code là orthopedics; referral có thể đa ngành |

## 3. Assessment và referral không tương đương

| Tình huống | Điều evidence cho phép kết luận | Điều không được kết luận |
|---|---|---|
| Đau ngực lan hàm/tay | Pattern cần đánh giá cấp cứu/cardiac pathway | Đặt lịch ngoại trú Tim mạch là output duy nhất |
| Yếu một bên/nói khó | Stroke-like pattern cần hành động khẩn | Mọi ca phải được chấm specialty Neurology |
| Ho đờm, khó thở, hút thuốc | Cần đánh giá COPD và spirometry | Đã mắc COPD hoặc bắt buộc khám Pulmonology |
| Heartburn/regurgitation | Phù hợp đánh giá GERD nếu không có alarm/cardiac concern | Mọi reflux symptom cần specialist Gastroenterology |
| Đau lưng sau bê nặng | Phù hợp pattern cơ học sau khi xét red flags | Orthopedics là specialty duy nhất |

## 4. Yêu cầu chuyển sang corpus V3

Mỗi evidence chunk runtime phải được tạo sau verification và có ít nhất: `id`, `title`, `section`, `sourceUrl`, `version`, đoạn `text` ngắn, `regionIds`, `specialtyCodes`, `minAge`, `maxAge`, `expiresAt`, SHA-256 `contentHash`, review metadata và `routingCriteria` đã duyệt.

Không tạo `routingCriteria` chỉ từ cột directness. Các criteria phải nêu đúng triệu chứng, polarity, specialty code và quote xuất hiện trong chunk; ca safety-only không được biến thành rule routing specialty.
