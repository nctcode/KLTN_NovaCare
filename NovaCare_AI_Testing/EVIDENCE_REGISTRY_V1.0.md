# EVIDENCE REGISTRY V1.0 – HYBRID AI NOVACARE

**Ngày lập:** 09/11/2026  
**Phạm vi dự kiến:** Cardiology, Neurology, Pulmonology, Gastroenterology, Orthopedics  
**Trạng thái phạm vi:** `OPEN` theo Decision Log; registry không phê duyệt thay người nghiên cứu  
**Ngày truy cập chung:** 09/11/2026

## 1. Mục đích và quy tắc sử dụng

Registry này phục vụ bốn nhiệm vụ độc lập: `SYMPTOM_RECOGNITION`, `TRIAGE`, `SPECIALTY_ASSESSMENT`, `REFERRAL_ROUTING`. Directness được chấm riêng cho từng nhiệm vụ bằng `DIRECT`, `PARTIAL`, `CONTEXTUAL`, `NONE`.

`VERIFIED` chỉ có nghĩa metadata, toàn văn liên quan và locator đã được người lập registry kiểm tra. Nó không có nghĩa đã có hai người xác minh. Cột xác minh độc lập vẫn để trống trong `EVIDENCE_VERIFICATION_CHECKLIST.md`.

Registry Markdown này chưa phải corpus runtime. Smart Screening V3 yêu cầu evidence chunk có `contentHash`, giới hạn tuổi/vùng, specialty code, hạn dùng, review metadata và `routingCriteria`. Không được chuyển nội dung dưới đây thành `reviewStatus=APPROVED` hoặc tự tạo `routingCriteria` trước khi hoàn thành human review.

## 2. Danh mục nguồn

| Evidence ID | Tên rút gọn | Specialty/domain | Loại nguồn | Status |
|---|---|---|---|---|
| DOC-BYT-ACS-2019 | BYT hội chứng mạch vành cấp | Cardiology/safety | Hướng dẫn Bộ Y tế | `VERIFIED_WITH_LIMITATION` |
| DOC-AHA-CHEST-2021 | AHA/ACC chest pain | Cardiology + differential | Clinical practice guideline | `VERIFIED` |
| DOC-BYT-STROKE-2024 | BYT đột quỵ não | Neurology/safety | Hướng dẫn Bộ Y tế | `NEEDS_REVIEW` |
| DOC-CDC-STROKE-2026 | CDC stroke signs | Neurology/safety | Government health guidance | `VERIFIED_WITH_LIMITATION` |
| DOC-AAFP-HEADACHE-2022 | Acute headache diagnostic approach | Neurology/safety | Peer-reviewed clinical review | `VERIFIED_WITH_LIMITATION` |
| DOC-BYT-COPD-2023 | BYT COPD | Pulmonology | Hướng dẫn Bộ Y tế | `VERIFIED_WITH_LIMITATION` |
| DOC-GOLD-COPD-2025 | GOLD 2025 | Pulmonology | Strategy report | `SUPERSEDED` |
| DOC-GOLD-COPD-2026 | GOLD 2026 | Pulmonology | Strategy report | `VERIFIED` |
| DOC-ACG-GERD-2022 | ACG GERD | Gastroenterology | Clinical guideline | `VERIFIED_WITH_LIMITATION` |
| DOC-NICE-LBP-NG59 | NICE low back pain | MSK/spine | NICE guideline | `VERIFIED_WITH_LIMITATION` |
| DOC-NICE-NEURO-NG127 | NICE neurological referral | Neurology/spine | NICE guideline | `VERIFIED` |
| DOC-BYT-MSK | BYT cơ xương khớp | Musculoskeletal | Hướng dẫn Bộ Y tế | `VERIFIED_WITH_LIMITATION` |
| DOC-NICE-CHEST-CG95 | NICE recent-onset chest pain | Cardiology/safety | NICE guideline | `VERIFIED` |
| DOC-NICE-COPD-NG115 | NICE COPD | Pulmonology/referral | NICE guideline | `VERIFIED` |
| DOC-NICE-GERD-CG184 | NICE GORD/dyspepsia | Gastroenterology/referral | NICE guideline | `VERIFIED` |

## 3. Hồ sơ từng nguồn

### DOC-BYT-ACS-2019

- **Tên:** *Hướng dẫn chẩn đoán và xử trí hội chứng mạch vành cấp*.
- **Tổ chức/năm:** Bộ Y tế Việt Nam, Quyết định 2187/QĐ-BYT ngày 03/06/2019.
- **Phiên bản:** Quyết định 2187/QĐ-BYT; chưa xác định văn bản thay thế trên thư viện Cục KCB tại ngày truy cập.
- **URL:** [Thư viện Cục KCB](https://kcb.vn/van-ban/thu-vien-huong-dan-chan-doan-dieu-tri.html); [bản toàn văn đối chiếu](https://vnras.com/huong-dan-chan-doan-va-xu-tri-hoi-chung-mach-vanh-cap-theo-bo-y-te-quyet-dinh-so-2187-qd-byt-ngay-03-06-2019/).
- **Locator:** Phần Nhồi máu cơ tim cấp có ST chênh lên, mục 1.2.1.b “Triệu chứng cơ năng”.
- **Excerpt:** “Đau sau xương ức hoặc đau ngực trái”; “Lan lên cổ, hàm dưới, vai trái hoặc bờ trụ tay trái.”
- **Tóm tắt:** Mô tả kiểu đau, lan đau và triệu chứng kèm của nhồi máu cơ tim; hỗ trợ nhận diện cụm triệu chứng nguy hiểm.
- **Tasks/directness:** symptom `DIRECT`; triage `PARTIAL`; specialty assessment `DIRECT`; referral routing `NONE`.
- **Giới hạn:** Metadata có nguồn chính thức, nhưng excerpt được kiểm tra trên bản tái bản pháp lý, không phải PDF chính thức truy cập trực tiếp. Không chứng minh routing ngoại trú Tim mạch.
- **Status:** `VERIFIED_WITH_LIMITATION`.

### DOC-AHA-CHEST-2021

- **Tên:** *2021 AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR Guideline for the Evaluation and Diagnosis of Chest Pain*.
- **Tác giả/tổ chức:** Gulati M, Levy PD, Mukherjee D và cộng sự; ACC/AHA Joint Committee on Clinical Practice Guidelines.
- **Năm/phiên bản:** 2021; Circulation guideline và official slide set.
- **DOI/URL:** `10.1161/CIR.0000000000001029`; [AHA hub](https://professional.heart.org/en/guidelines-statements/2021-ahaaccasechestsaemscctscmr-guideline-for-the-evaluation-and-diagnosis-ofcir0000000000001029).
- **Locator:** Top Things to Know #1 và #3; slide set pp. 4, 6, 27, 31.
- **Excerpt:** “Patients with acute chest pain or chest pain equivalent symptoms should seek medical care immediately by calling 9-1-1.”
- **Tóm tắt:** Định nghĩa rộng chest-pain equivalents; yêu cầu chăm sóc ngay và loại trừ nguyên nhân đe dọa tính mạng.
- **Tasks/directness:** symptom `DIRECT`; triage `DIRECT`; specialty assessment `DIRECT`; referral routing `PARTIAL`.
- **Giới hạn:** Referral là ED/EMS và cardiac diagnostic pathway, không phải gợi ý một khoa ngoại trú duy nhất.
- **Status:** `VERIFIED`.

### DOC-BYT-STROKE-2024

- **Tên:** *Hướng dẫn chẩn đoán và điều trị đột quỵ não*.
- **Tổ chức/năm:** Bộ Y tế Việt Nam, Quyết định 3312/QĐ-BYT ngày 05/11/2024.
- **Phiên bản:** Thay thế Quyết định 5331/QĐ-BYT năm 2020.
- **URL:** [PDF trên cổng Y dược cổ truyền Bộ Y tế](https://ydct.moh.gov.vn/static/files/uploads/bec97baf7acd25948bb814f6c5c2990f16f46ee453f0d23dd0b83fa8b85622ba.pdf); [toàn văn tham chiếu](https://thuvienphapluat.vn/van-ban/the-thao-y-te/Quyet-dinh-3312-QD-BYT-2024-tai-lieu-chuyen-mon-Huong-dan-chan-doan-dieu-tri-dot-quy-nao-651734.aspx).
- **Locator:** Chưa khóa được chapter/page cho nhận diện FAST và referral ban đầu từ bản chính thức.
- **Excerpt:** **Không ghi**; PDF chính thức timeout trong đợt xác minh và bản HTML thứ cấp không cung cấp locator phù hợp cho EX-02.
- **Tóm tắt:** Metadata và phạm vi tài liệu đã xác định; chưa đủ evidence gate cho nhãn EX-02.
- **Tasks/directness:** symptom `NONE` tại registry hiện tại; triage `NONE`; specialty assessment `CONTEXTUAL`; referral routing `NONE`.
- **Giới hạn:** Cần người xác minh tải được bản chính thức, khóa trang/mục và excerpt.
- **Status:** `NEEDS_REVIEW`.

### DOC-CDC-STROKE-2026

- **Tên:** *Signs and Symptoms of Stroke*.
- **Tổ chức/năm:** Centers for Disease Control and Prevention, 19/05/2026.
- **Phiên bản/URL:** Current web version; [CDC](https://www.cdc.gov/stroke/signs-symptoms/).
- **Locator:** “Signs and symptoms”, lines/items về unilateral weakness và speech; “When to seek emergency help”.
- **Excerpt:** “Sudden numbness or weakness in the face, arm, or leg, especially on one side of the body.”
- **Tóm tắt:** Hỗ trợ nhận diện yếu/tê một bên, rối loạn nói và hành động gọi cấp cứu.
- **Tasks/directness:** symptom `DIRECT`; triage `DIRECT`; specialty assessment `CONTEXTUAL`; referral routing `NONE`.
- **Giới hạn:** Trang giáo dục sức khỏe cho công chúng Hoa Kỳ, không phải guideline routing chuyên khoa.
- **Status:** `VERIFIED_WITH_LIMITATION`.

### DOC-AAFP-HEADACHE-2022

- **Tên:** *Acute Headache in Adults: A Diagnostic Approach*.
- **Tác giả/năm:** Anthony J. Viera, Brian Antono; *American Family Physician* 2022;106(3):260–268.
- **Identifier/URL:** PMID `36126007`; không ghi DOI vì chưa xác minh có DOI. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36126007/).
- **Locator:** Abstract, dòng về red flags và emergent evaluations; p. 260–268 trong full article.
- **Excerpt:** “acute thunderclap headache”; “warrant immediate evaluation.”
- **Tóm tắt:** Thunderclap headache và một số red flags cần đánh giá ngay; hỗ trợ safety của EX-03.
- **Tasks/directness:** symptom `DIRECT`; triage `DIRECT`; specialty assessment `PARTIAL`; referral routing `NONE`.
- **Giới hạn:** Bài clinical review, không phải clinical practice guideline; không chỉ định mọi ca thunderclap tới Neurology outpatient.
- **Status:** `VERIFIED_WITH_LIMITATION`.

### DOC-BYT-COPD-2023

- **Tên:** *Hướng dẫn chẩn đoán và điều trị bệnh phổi tắc nghẽn mạn tính*.
- **Tổ chức/năm:** Bộ Y tế Việt Nam, Quyết định 2767/QĐ-BYT ngày 04/07/2023.
- **Phiên bản:** QĐ 2767, thay thế QĐ 3874/QĐ-BYT năm 2018.
- **URL:** [File Bộ Y tế](https://emohbackup.moh.gov.vn/publish/attach/getfile/409988); [toàn văn đối chiếu](https://luatvietnam.vn/y-te/quyet-dinh-2767-qd-byt-2023-chan-doan-dieu-tri-benh-phoi-tac-nghen-man-tinh-258230-d1.html).
- **Locator:** Mục 1.2.1, bảng 1.1 và đoạn trước mục 1.2.2; bản HTML lines 638–652.
- **Excerpt:** “nên được giới thiệu tới cơ sở y tế có đo chức năng hô hấp”.
- **Tóm tắt:** Ho, khạc đờm, khó thở và hút thuốc tạo chỉ định đánh giá thêm, trong đó hô hấp ký là trọng tâm.
- **Tasks/directness:** symptom `DIRECT`; triage `NONE`; specialty assessment `DIRECT`; referral routing `PARTIAL`.
- **Giới hạn:** Referral tới cơ sở có năng lực đo chức năng hô hấp, chưa trực tiếp nói mã `pulmonology`; endpoint chính thức lỗi 502 khi audit.
- **Status:** `VERIFIED_WITH_LIMITATION`.

### DOC-GOLD-COPD-2025

- **Tên:** *Global Strategy for Prevention, Diagnosis and Management of COPD: 2025 Report*.
- **Tổ chức/năm:** Global Initiative for Chronic Obstructive Lung Disease, 2025.
- **URL:** [GOLD 2025](https://goldcopd.org/2025-Gold-Report/).
- **Locator/excerpt:** Không dùng trong V1.0 chính thức.
- **Status:** `SUPERSEDED` bởi `DOC-GOLD-COPD-2026`.

### DOC-GOLD-COPD-2026

- **Tên:** *Global Strategy for the Diagnosis, Management, and Prevention of Chronic Obstructive Pulmonary Disease: 2026 Report*.
- **Tổ chức/năm:** GOLD; 2026 Report, version 1.3, 08/12/2025.
- **URL:** [GOLD 2026 report page](https://goldcopd.org/2026-gold-report-and-pocket-guide/); [PDF v1.3](https://goldcopd.org/wp-content/uploads/2026/01/GOLD-REPORT-2026-v1.3-8Dec2025_WMV2.pdf).
- **Locator:** Chapter 2, “Diagnosis, Assessment and Monitoring”, pp. 21–22; Figure 2.1.
- **Excerpt:** “A diagnosis of COPD should be considered in any patient who has dyspnea, chronic cough or sputum production”.
- **Tóm tắt:** Cụm triệu chứng và phơi nhiễm cho phép cân nhắc COPD, nhưng cần hô hấp ký để xác lập chẩn đoán.
- **Tasks/directness:** symptom `DIRECT`; triage `NONE`; specialty assessment `DIRECT`; referral routing `NONE`.
- **Giới hạn:** Tài liệu chẩn đoán/management, không định tuyến theo mã specialty NovaCare.
- **Status:** `VERIFIED`.

### DOC-ACG-GERD-2022

- **Tên:** *ACG Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease*.
- **Tác giả/năm:** Philip O. Katz và cộng sự; American College of Gastroenterology; *Am J Gastroenterol*. 2022;117(1):27–56.
- **DOI/URL:** `10.14309/ajg.0000000000001538`; [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC8754510/).
- **Locator:** Diagnosis of GERD, Recommendations 1, 4 và 6; Table 1.
- **Excerpt:** “classic GERD symptoms of heartburn and regurgitation who have no alarm symptoms”.
- **Tóm tắt:** Hỗ trợ nhận diện heartburn/regurgitation; chest pain chỉ được đánh giá GERD sau khi đã đánh giá tim phù hợp.
- **Tasks/directness:** symptom `DIRECT`; triage `PARTIAL`; specialty assessment `DIRECT`; referral routing `NONE`.
- **Giới hạn:** Guideline về đánh giá và điều trị GERD, không phải routing mọi triệu chứng reflux tới Gastroenterology.
- **Status:** `VERIFIED_WITH_LIMITATION`.

### DOC-NICE-LBP-NG59

- **Tên:** *Low back pain and sciatica in over 16s: assessment and management*.
- **Tổ chức/năm:** NICE NG59; 30/11/2016, cập nhật 11/12/2020.
- **URL:** [Recommendations](https://www.nice.org.uk/guidance/ng59/chapter/Recommendations).
- **Locator:** 1.1.1 “Alternative diagnoses”; 1.3.2 và 1.3.7–1.3.8 về referral/surgical opinion.
- **Excerpt:** “Think about alternative diagnoses when examining or reviewing people with low back pain”.
- **Tóm tắt:** Yêu cầu loại trừ nguyên nhân đặc hiệu và mô tả các điều kiện referral can thiệp; không mặc định Orthopedics cho đau lưng cơ học.
- **Tasks/directness:** symptom `DIRECT`; triage `PARTIAL`; specialty assessment `DIRECT`; referral routing `PARTIAL`.
- **Giới hạn:** “specialist/surgical opinion” không đồng nghĩa duy nhất với mã `orthopedics` của NovaCare.
- **Status:** `VERIFIED_WITH_LIMITATION`.

### DOC-NICE-NEURO-NG127

- **Tên:** *Suspected neurological conditions: recognition and referral*.
- **Tổ chức/năm:** NICE NG127; 01/05/2019, cập nhật 02/10/2023.
- **URL:** [Adult recommendations](https://www.nice.org.uk/guidance/ng127/chapter/recommendations-for-adults-aged-over-16).
- **Locator:** 1.7.1 sudden-onset limb weakness; 1.7.3 severe low back pain with bladder/bowel/sexual dysfunction or perineal numbness.
- **Excerpt:** “Refer immediately ... new-onset disturbance of bladder, bowel or sexual function, or new-onset perineal numbness”.
- **Tóm tắt:** Hỗ trợ immediate referral cho cauda equina pattern và nhận diện sudden weakness theo stroke pathway.
- **Tasks/directness:** symptom `DIRECT`; triage `DIRECT` cho hành động “refer immediately”; specialty assessment `DIRECT`; referral routing `PARTIAL`.
- **Giới hạn:** Đích là local pathway/assessment, không duy nhất Neurology hoặc Orthopedics; mapping sang `EMERGENCY` vẫn cần chuyên gia duyệt.
- **Status:** `VERIFIED`.

### DOC-BYT-MSK

- **Tên:** *Hướng dẫn chẩn đoán và điều trị các bệnh cơ xương khớp*.
- **Tổ chức/năm:** Bộ Y tế, Quyết định 361/QĐ-BYT ngày 25/01/2014; bản NXB Y học Hà Nội 2016.
- **URL:** [Cục KCB](https://kcb.vn/van-ban/huong-dan-chan-doan-va-dieu-tri-cac-benh-co-xuong-khop.html); [PDF](https://kcb.vn/upload/2005611/20210723//HD%C4%90T-C%C6%A1-X%C6%B0%C6%A1ng-Kh%E1%BB%9Bp.pdf).
- **Locator:** “Hội chứng đau thắt lưng”, pp. 134–136, mục 3.1 và 3.3.
- **Excerpt:** “đau xuất hiện đột ngột sau bê vật nặng, sau hoạt động sai tư thế”.
- **Tóm tắt:** Hỗ trợ pattern đau lưng cơ học và yêu cầu tìm nguyên nhân khi có dấu hiệu bất thường.
- **Tasks/directness:** symptom `DIRECT`; triage `PARTIAL`; specialty assessment `DIRECT`; referral routing `PARTIAL`.
- **Giới hạn:** Tài liệu cũ; “cơ sở chuyên khoa” không chỉ định duy nhất specialty; code NovaCare vẫn `OPEN`.
- **Status:** `VERIFIED_WITH_LIMITATION`.

### DOC-NICE-CHEST-CG95

- **Tên:** *Recent-onset chest pain of suspected cardiac origin: assessment and diagnosis*.
- **Tổ chức/năm:** NICE CG95; 24/03/2010, cập nhật 30/11/2016.
- **URL:** [Recommendations](https://www.nice.org.uk/guidance/cg95/chapter/recommendations).
- **Locator:** 1.2.1.3 triệu chứng ACS; 1.2.1.7–1.2.1.11 emergency/urgent referral; 1.3.3.1 stable angina features.
- **Excerpt:** “Refer people to hospital as an emergency if an ACS is suspected”.
- **Tóm tắt:** Cung cấp tiêu chí symptom cluster và referral theo thời gian/onset, hữu ích cho EX-01 và EX-08.
- **Tasks/directness:** symptom `DIRECT`; triage `DIRECT`; specialty assessment `DIRECT`; referral routing `DIRECT` tới hospital pathway, `PARTIAL` cho Cardiology outpatient.
- **Giới hạn:** Không được biến hospital referral thành specialty label khi safety gate override.
- **Status:** `VERIFIED`.

### DOC-NICE-COPD-NG115

- **Tên:** *Chronic obstructive pulmonary disease in over 16s: diagnosis and management*.
- **Tổ chức/năm:** NICE NG115; 05/12/2018, cập nhật 26/07/2019; reviewed 12/01/2022.
- **URL:** [Recommendations](https://www.nice.org.uk/guidance/ng115/chapter/Recommendations).
- **Locator:** 1.1.28–1.1.30; Table 5 “Reasons for referral”.
- **Excerpt:** “When clinically indicated, refer people for specialist advice.”
- **Tóm tắt:** Hỗ trợ spirometry và referral khi chẩn đoán không chắc, bệnh nặng hoặc cần đánh giá chuyên sâu.
- **Tasks/directness:** symptom `DIRECT`; triage `NONE`; specialty assessment `DIRECT`; referral routing `DIRECT` tới specialist advice, `PARTIAL` cho mã Pulmonology.
- **Giới hạn:** Không quy định tên khoa theo catalog NovaCare.
- **Status:** `VERIFIED`.

### DOC-NICE-GERD-CG184

- **Tên:** *Gastro-oesophageal reflux disease and dyspepsia in adults: investigation and management*.
- **Tổ chức/năm:** NICE CG184; 03/09/2014, cập nhật 18/10/2019.
- **URL:** [Recommendations](https://www.nice.org.uk/guidance/cg184/chapter/Recommendations).
- **Locator:** 1.3.1–1.3.4; 1.4.1; 1.11.1 “Referral to a specialist service”.
- **Excerpt:** “gastro-oesophageal symptoms that are non-responsive to treatment or unexplained”.
- **Tóm tắt:** Phân biệt self/primary care với specialist referral, nhắc cân nhắc bệnh tim trong differential.
- **Tasks/directness:** symptom `DIRECT`; triage `DIRECT` cho acute GI bleeding, `NONE` cho reflux không biến chứng; specialty assessment `DIRECT`; referral routing `DIRECT` tới specialist service, `PARTIAL` cho Gastroenterology code.
- **Giới hạn:** EX-05 chưa có non-response/unexplained treatment history nên nguồn không tự động chứng minh referral chuyên khoa.
- **Status:** `VERIFIED`.

## 4. Evidence đủ điều kiện hiện tại

- **Đủ để chuẩn bị triage evidence:** DOC-AHA-CHEST-2021, DOC-CDC-STROKE-2026, DOC-AAFP-HEADACHE-2022, DOC-NICE-NEURO-NG127, DOC-NICE-CHEST-CG95.
- **Đủ cho specialty assessment nhưng chưa luôn đủ routing code:** DOC-GOLD-COPD-2026, DOC-ACG-GERD-2022, DOC-NICE-LBP-NG59, DOC-BYT-MSK, DOC-NICE-COPD-NG115, DOC-NICE-GERD-CG184.
- **Chưa dùng làm evidence chính:** DOC-BYT-STROKE-2024.
- **Không dùng:** DOC-GOLD-COPD-2025 vì đã `SUPERSEDED`.

Tất cả nguồn vẫn chờ independent verification. Không nguồn nào trong registry tự động cấp trạng thái `LITERATURE_SUPPORTED` cho case label.
