# PROTOCOL REVIEW REPORT – V1.0 → V1.1

**Ngày phản biện:** 09/11/2026  
**Đối tượng:** `RESEARCH_PROTOCOL_V1.md` và khả năng thực thi của Smart Screening V3.

## 1. Kết luận phản biện

Protocol V1.0 có nền tảng tốt về phân biệt nhãn tài liệu với chẩn đoán lâm sàng, chống leakage và paired evaluation. Tuy nhiên, chưa thể dùng trực tiếp để tạo locked test vì bốn vấn đề chính: directness dùng chung cho hai nhiệm vụ khác nhau; ca safety override vẫn mang specialty label như một dự đoán có thể chấm; evidence registry chưa được xác minh đồng đều; và locked test 30 ca quá nhỏ cho diễn giải ổn định theo 5 specialty.

## 2. Ma trận vấn đề và xử lý

| ID | Vấn đề phương pháp V1.0 | Tại sao ảnh hưởng kết luận | Xử lý trong V1.1 | Trạng thái |
|---|---|---|---|---|
| PR-01 | Một trường evidence directness cho cả triage và specialty | Guideline có thể hỗ trợ cấp cứu nhưng không hỗ trợ routing ngoại trú | Tách bốn loại directness; audit lại 11 nguồn | Đã xử lý thiết kế; chờ verifier thứ hai |
| PR-02 | EX-01/02/03/07/10 gắn specialty dù safety gate phải chặn | Dễ tính specialty accuracy cho quyết định chưa hề được thực thi | Thêm `specialtyApplicability`; các ca này là `DEFERRED_AFTER_TRIAGE` | Đã xử lý |
| PR-03 | `LITERATURE_SUPPORTED` dùng cho một số specialty chỉ có bằng chứng theo lĩnh vực | Thổi phồng độ chắc chắn của nhãn | Hạ xuống `NEEDS_REVIEW`/`PROVISIONAL`; yêu cầu direct routing hoặc adjudication | Đã xử lý quy tắc |
| PR-04 | EX-09 gọi nhu cầu hỏi thêm là literature-supported | `REVIEW_REQUIRED` là nhãn vận hành của protocol, không phải khuyến nghị y khoa nguyên văn | Thêm `labelBasis=PROTOCOL_DEFINED`; không gọi ground truth | Đã xử lý |
| PR-05 | GOLD 2025 không còn là phiên bản hiện hành | Lệch phiên bản evidence | Supersede bằng GOLD 2026, giữ dấu vết provenance | Đã xử lý registry draft |
| PR-06 | DOC-BYT-STROKE-2024 dùng bản toàn văn bên thứ ba và chưa khóa locator | Khó tái lập và kiểm chứng | `NEEDS_REVIEW` cho đến khi lưu bản chính thức và có verifier thứ hai | Còn mở |
| PR-07 | Bốn nhóm ca có thể bị hiểu là các tập chồng lấn | Tổng và denominator không ổn định | Dùng `primaryCohort` độc quyền và `scenarioTags` chồng lấn | Đã xử lý |
| PR-08 | Tỷ lệ 60/20/20 tạo locked test 30 ca, khoảng 18 ca specialty-eligible | Macro F1 của 5 specialty rất bất ổn; CI rộng | Đề xuất 40/20/40 theo 50 family × 3 ca; 60/20/20 vẫn khả thi kỹ thuật | Chờ duyệt |
| PR-09 | Agreement chưa quy định metric theo loại nhãn | Không tái lập quy trình adjudication | Kappa cho triage/sufficiency, exact set + Jaccard cho specialty; báo prevalence | Đã xử lý |
| PR-10 | Phương án một người chưa đủ rõ | Hai lượt của cùng người không phải inter-rater reliability | Trạng thái `PROVISIONAL_SINGLE_ANNOTATOR`, không vào locked test | Đã xử lý |
| PR-11 | `HYBRID vs LLM_RAG` được mô tả như cô lập hoàn toàn rule effect | Hybrid thay đổi shortlist, retrieval scope và fusion cùng lúc | Gọi đây là hiệu ứng của gói rule integration; ghi confounding | Đã xử lý |
| PR-12 | Provider failure bị loại khỏi specialty metric chính | Có thể làm arm phụ thuộc provider trông tốt hơn | Primary intention-to-evaluate tính failure là không có dự đoán; conditional metric báo phụ | Đã xử lý |
| PR-13 | Denominator metrics chưa hoàn toàn định nghĩa | Các báo cáo có thể dùng mẫu số khác nhau | Thêm metric dictionary và cohort flow | Đã xử lý |
| PR-14 | Chưa có power calculation, nhưng có nhiều kiểm định | Nguy cơ overclaim và multiple comparisons | Gọi 150 ca là pilot; CI là chính, Holm cho contrasts xác nhận nếu đủ điều kiện | Đã xử lý; power vẫn mở |

## 3. Audit EX-01 đến EX-10

| Case ID | Triage label / ưu tiên | Specialty label được chấp nhận trong V1.1 | Evidence ID | Directness triage / specialty | Vấn đề | Đề xuất |
|---|---|---|---|---|---|---|
| EX-01 | `EMERGENCY` / xử lý ngay | Không chấm specialty; candidate domain Tim mạch chỉ để mô tả | DOC-BYT-ACS-2019; DOC-AHA-CHEST-2021 | DIRECT / CONTEXTUAL | Bằng chứng cấp cứu không đồng nghĩa routing ngoại trú Tim mạch | Giữ triage; `DEFERRED_AFTER_TRIAGE`; bỏ khỏi specialty denominator |
| EX-02 | `EMERGENCY` / xử lý ngay | Không chấm specialty; domain Thần kinh | DOC-BYT-STROKE-2024; DOC-CDC-STROKE-2026 | DIRECT / CONTEXTUAL | Nguồn CDC không phải routing; nguồn BYT còn thiếu locator chính thức | Giữ triage; `DEFERRED_AFTER_TRIAGE`; evidence BYT `NEEDS_REVIEW` |
| EX-03 | `EMERGENCY` / đánh giá ngay | Không chấm specialty | DOC-AAFP-HEADACHE-2022 | DIRECT / PARTIAL | Thunderclap hỗ trợ immediate evaluation, không chứng minh mọi ca vào Neurology outpatient | Giữ triage; `DEFERRED_AFTER_TRIAGE` |
| EX-04 | `CONSULT` / khám có kế hoạch | `pulmonology` tạm thời | DOC-BYT-COPD-2023; DOC-GOLD-COPD-2026 | PARTIAL / PARTIAL | Hỗ trợ đánh giá COPD/hô hấp và hô hấp ký, chưa đủ routing theo mã NovaCare | `APPLICABLE` nhưng label `NEEDS_REVIEW`; cần nguồn referral trực tiếp hoặc adjudication |
| EX-05 | `CONSULT` / khám có kế hoạch | `gastroenterology` tạm thời | DOC-ACG-GERD-2022 | PARTIAL / PARTIAL | Guideline hỗ trợ đánh giá GERD; không biến triệu chứng điển hình thành routing bắt buộc | `APPLICABLE`, `NEEDS_REVIEW`; giữ phủ định red flags |
| EX-06 | `CONSULT` / tự chăm sóc hoặc khám không khẩn tùy diễn biến | `orthopedics` tạm thời | DOC-NICE-LBP-NG59; DOC-BYT-MSK | PARTIAL / PARTIAL | NICE dùng MSK interface/specialist setting, không chỉ Orthopedics; tên catalog là Cơ xương khớp | `APPLICABLE`, `NEEDS_REVIEW`; chuẩn hóa code/catalog trước locked test |
| EX-07 | `EMERGENCY` / loại trừ đe dọa tính mạng | Không chấm specialty | DOC-AHA-CHEST-2021 | DIRECT / CONTEXTUAL | Tim–phổi là differential domains, không phải acceptable outpatient specialties khi safety override | Giữ triage; `DEFERRED_AFTER_TRIAGE` |
| EX-08 | `URGENT` đang đề xuất | cardiology/gastroenterology đang đề xuất | DOC-AHA-CHEST-2021; DOC-ACG-GERD-2022 | PARTIAL / PARTIAL | Chưa đủ chi tiết để phân tầng; “ưu tiên loại trừ tim” không tự tạo specialty multi-label | `NEEDS_REVIEW` cho cả triage và applicability; không vào locked test trước adjudication |
| EX-09 | `REVIEW_REQUIRED` / hỏi thêm | `[]` | DOC-AHA-CHEST-2021 + quy tắc protocol | CONTEXTUAL / NONE | `REVIEW_REQUIRED` là quyết định vận hành, không phải nhãn y khoa trực tiếp | Giữ; `specialtyApplicability=NEEDS_REVIEW`; `labelBasis=PROTOCOL_DEFINED` |
| EX-10 | `EMERGENCY` theo mapping “refer immediately” | Không chấm specialty | DOC-NICE-NEURO-NG127; DOC-NICE-LBP-NG59 | DIRECT cho immediate referral / CONTEXTUAL | Không được ép Neurology hoặc Orthopedics; mapping sang `EMERGENCY` cần duyệt lâm sàng | `DEFERRED_AFTER_TRIAGE`; triage mapping `NEEDS_REVIEW` bởi chuyên gia |

## 4. Kiểm tra tính khả thi với Smart Screening V3

- V3 có safety gate chạy trước provider và chặn tuổi dưới 18; vì vậy protocol giới hạn người lớn phù hợp với code hiện tại.
- Catalog/routing hiện có mapping cho năm lĩnh vực được chọn, nhưng mapping code không phải bằng chứng y khoa cho reference label.
- Safety gate chung khiến Red-flag Sensitivity chủ yếu đánh giá gate, không phải năng lực specialty của LLM.
- Provider failure phải được giữ nguyên trạng thái; không được fallback âm thầm giữa arms.
- Evidence corpus/path và provider authentication phải qua quality gate trước experiment; “có cấu hình” không được xem là bằng chứng chạy thành công.

## 5. Đánh giá thiết kế split

### 5.1. Khả thi kỹ thuật

`60/20/20 = 90/30/30` khả thi chính xác nếu dùng 50 `templateFamilyId`, mỗi family có 3 ca và phân 30/10/10 family. Không có family nào xuất hiện ở hai tập.

### 5.2. Hạn chế thống kê

Với phân bổ cohort đều, locked test 30 ca chỉ có khoảng 18 ca đánh giá specialty, chia cho 5 specialty và multi-label. Macro metrics sẽ rất nhạy với một vài ca. V1.1 đề xuất `40/20/40 = 60/30/60`, tương ứng 20/10/20 family. Đây vẫn là pilot; không bảo đảm power.

## 6. Phản biện bốn arms

| Contrast | Câu hỏi trả lời được | Điều kiện | Giới hạn |
|---|---|---|---|
| LLM_RAG − LLM_ONLY | Evidence retrieval thay đổi kết quả bao nhiêu? | Cùng model, decoding, catalog, prompt khung; chỉ thêm evidence | Prompt dài hơn và latency/cost là phần của treatment |
| HYBRID − LLM_RAG | Gói tích hợp rules đem lại giá trị gì? | Cùng corpus/model/safety | Không cô lập riêng specialty ranking vì shortlist, retrieval filtering và fusion cùng đổi |
| HYBRID − RULE_ONLY | Hybrid có hơn baseline rules không? | Cùng input/catalog/safety và versions khóa | Khác chi phí, provider availability và khả năng abstain |
| Mỗi arm so với reference | Hiệu năng tuyệt đối trong pilot | Paired cases, ITE denominator | Nhãn literature-based không phải clinical ground truth |

## 7. Kết luận readiness

Protocol V1.1 đủ làm khung cho Evidence Registry chính thức, nhưng chưa đủ điều kiện sinh Dataset Pilot cho đến khi: người nghiên cứu duyệt split; verifier thứ hai kiểm tra nguồn; mapping specialty catalog được khóa; EX-04/05/06/08/10 được adjudicate; và tiêu chí safety do người có thẩm quyền lâm sàng xác nhận.
