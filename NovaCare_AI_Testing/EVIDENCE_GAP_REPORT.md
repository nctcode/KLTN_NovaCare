# EVIDENCE GAP REPORT – NOVACARE REGISTRY V1.0

**Ngày:** 09/11/2026

## 1. Mức hoàn thành registry

| Hạng mục | Kết quả |
|---|---|
| 11 nguồn V1.0 được audit | 11/11 |
| Nguồn thay thế phiên bản | GOLD 2026 thay GOLD 2025 |
| Nguồn bổ sung có mục tiêu | NICE CG95, NG115, CG184 |
| Tổng record | 15, gồm 1 SUPERSEDED |
| Authoritative/DOI full-text locator đã mở và kiểm nội dung | 11 |
| Official metadata có, nhưng locator nội dung chỉ đọc qua mirror | 2 |
| Official source chưa mở được/locator chưa khóa | 1 |
| Record superseded không dùng locator | 1 |
| VERIFIED | 6 |
| VERIFIED_WITH_LIMITATION | 7 |
| NEEDS_REVIEW | 1 |
| SUPERSEDED | 1 |
| Independent verification hoàn thành | 0 |

Các con số trên mô tả verification của người lập registry; chưa đạt evidence gate hai người.

**Phương pháp đếm locator:** một record chỉ vào nhóm 11 khi người lập registry đã mở được nguồn authoritative hoặc DOI/PMC/NLM chính thức và đọc đúng section/page/recommendation chứa nội dung. DOC-BYT-ACS-2019 và DOC-BYT-COPD-2023 chỉ vào nhóm mirror; DOC-BYT-STROKE-2024 thuộc nhóm chưa khóa locator; DOC-GOLD-COPD-2025 thuộc nhóm superseded. Bốn nhóm loại trừ nhau và cộng lại thành 15 record.

## 2. Gap theo nguồn

| Gap ID | Evidence/case | Khoảng trống | Hành động cần thiết | Chủ thể |
|---|---|---|---|---|
| EG-01 | DOC-BYT-STROKE-2024 / EX-02 | Chưa khóa được trang/mục/excerpt chính thức về symptom recognition và acute action | Tải bản chính thức, lưu version, trích locator ngắn và review độc lập | Evidence reviewer |
| EG-02 | DOC-BYT-ACS-2019 | Excerpt hiện dựa trên mirror, không phải PDF chính thức trực tiếp | Lấy PDF Cục KCB/BYT và kiểm pagination | Evidence reviewer |
| EG-03 | DOC-BYT-COPD-2023 | Endpoint Bộ Y tế trả lỗi khi audit | Lưu bản chính thức có checksum; kiểm trang tương ứng mục 1.2 | Evidence reviewer |
| EG-04 | DOC-BYT-MSK | Tài liệu ban hành 2014, bản in 2016; chưa rà soát văn bản thay thế mới hơn | Search/citation update có kiểm soát | Evidence reviewer + MSK advisor |
| EG-05 | Tất cả | Chưa có verifier thứ hai | Hoàn thành checklist độc lập | Người nghiên cứu bố trí reviewer |

## 3. Gap theo specialty

| Specialty | Assessment evidence | Referral evidence | Gap còn lại |
|---|---|---|---|
| Cardiology | Mạnh | Mạnh cho hospital/ED pathway | Không đủ để coi ED referral là outpatient Cardiology routing |
| Neurology | Mạnh cho red flags | NG127 có neurological/local pathways | BYT Stroke chưa qua gate; nhiều ca emergency phải deferred |
| Pulmonology | Mạnh cho COPD assessment | Specialist advice/cơ sở có spirometry | Chưa ánh xạ trực tiếp “specialist” thành code Pulmonology |
| Gastroenterology | Mạnh cho GERD assessment | Specialist referral khi non-response/unexplained | EX-05 chưa đáp ứng referral criteria; có thể chỉ phù hợp primary care ban đầu |
| Orthopedics/MSK | Mạnh cho mechanical LBP assessment | Surgical/specialist referral theo điều kiện | Orthopedics, rheumatology, rehabilitation và spine services có thể giao thoa; catalog chưa khóa |

## 4. Gap theo case

| Case | Triage | Specialty | Readiness |
|---|---|---|---|
| EX-01 | Evidence mạnh, taxonomy chưa duyệt | Deferred | Chờ safety mapping approval |
| EX-02 | CDC/NICE mạnh; BYT chưa đủ locator | Deferred | Chờ BYT verification và safety mapping |
| EX-03 | Evidence mạnh | Deferred | Chờ safety mapping |
| EX-04 | CONSULT chưa được chuyên gia duyệt | Pulmonology chỉ PARTIAL routing | Chờ adjudication |
| EX-05 | CONSULT chưa được chuyên gia duyệt | Gastroenterology referral chưa thỏa | Chờ adjudication |
| EX-06 | CONSULT chưa được chuyên gia duyệt | Orthopedics code chưa khóa | Chờ adjudication/catalog |
| EX-07 | Evidence differential mạnh | Deferred | Chờ red-flag policy |
| EX-08 | URGENT chưa đủ căn cứ | Multi-specialty chưa đủ | Không dùng làm scored case |
| EX-09 | Protocol-defined | Không có specialty | Dùng cho ask-more dry run sau khi minimum input được duyệt |
| EX-10 | Immediate referral rõ; `EMERGENCY` mapping chưa duyệt | Deferred | Chờ chuyên gia an toàn |

## 5. Quyết định còn mở ảnh hưởng trực tiếp

| Decision Log | Nội dung | Tác động tới bước tiếp theo |
|---|---|---|
| DL-03 | Phạm vi 5 specialty | Không thể khóa sampling frame/catalog |
| DL-04 | Tuổi ≥18 | Không thể khóa minAge/maxAge corpus và case eligibility |
| DL-05 | 40/20/40 hay 60/20/20 | Chưa ảnh hưởng pilot nhỏ, nhưng ảnh hưởng family planning |
| DL-07–DL-08 | Safety override và referral→triage mapping | Không thể khóa triage labels/specialty applicability |
| DL-09–DL-11 | EX-04/05/06/08/10 | Không thể chuyển các ca này sang literature-supported |
| DL-14 | Hai annotator | Chưa đạt label gate |
| DL-16 | Primary ITE estimand | Cần trước evaluation, chưa chặn evidence review |
| DL-19 | Catalog snapshot | Không thể duyệt specialtyCodes/routingCriteria |

## 6. Readiness cho Dataset Pilot 10–20 ca

### Kết luận

**Chưa đủ điều kiện bắt đầu pilot có chấm điểm hoặc gắn `LITERATURE_SUPPORTED`.** Evidence Registry đã đạt mức **single-reviewer verified draft**: đủ để người thứ hai kiểm tra và đủ để thiết kế một annotation dry run, nhưng chưa qua evidence gate hai người và chưa có phê duyệt safety/catalog.

### Có thể làm ngay

- Chuẩn bị 10–20 case skeleton không có reference label cuối.
- Chạy thử biểu mẫu annotation với trạng thái `PROVISIONAL_SINGLE_ANNOTATOR`.
- Kiểm tra khả năng truy ngược evidence ID/locator và độ rõ của hướng dẫn gắn nhãn.
- Không chạy bốn arms để báo accuracy từ các nhãn provisional.

### Điều kiện tối thiểu trước pilot chính thức

1. Người thứ hai hoàn tất verification cho mọi nguồn dùng trong pilot.
2. Người nghiên cứu xác nhận năm specialty, tuổi và catalog snapshot.
3. Cố vấn an toàn duyệt bảng mapping referral terminology → triage labels và safety override.
4. Adjudicate EX-04, EX-05, EX-06, EX-08 và EX-10 hoặc loại chúng khỏi scored pilot.
5. Các evidence chunks runtime, nếu dùng RAG, phải được human-approved và qua hash/schema checks; không tự chuyển registry Markdown thành corpus `APPROVED`.

## 7. Khuyến nghị phạm vi pilot đầu tiên

Sau khi hoàn thành các gate trên, pilot nên có 10–20 ca cân bằng giữa: safety-only/deferred; clear assessment; ask-more; và cross-specialty. Chỉ các ca `APPLICABLE` có acceptable specialty đã adjudicate mới được tính specialty metrics. Các ca safety override chỉ tính safety/triage behavior.
