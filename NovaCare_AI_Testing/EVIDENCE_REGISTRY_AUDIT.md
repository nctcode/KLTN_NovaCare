# EVIDENCE REGISTRY AUDIT – NOVACARE PROTOCOL V1.1

**Ngày audit:** 09/11/2026  
**Phạm vi:** 11 nguồn trong Protocol V1.0. Audit này kiểm tra metadata, nội dung liên quan và loại kết luận mà nguồn thực sự hỗ trợ. Nó không phải xác nhận của bác sĩ.

## 1. Quy tắc audit

- `DIRECT`: khuyến nghị nêu trực tiếp dấu hiệu, mức khẩn cấp hoặc referral đang được gắn nhãn.
- `PARTIAL`: nguồn hỗ trợ đánh giá trong một lĩnh vực nhưng không chỉ định đúng specialty trong catalog NovaCare.
- `CONTEXTUAL`: nguồn giúp giải thích chẩn đoán phân biệt nhưng không đủ để gắn nhãn.
- `VERIFIED_WITH_LIMITATION`: metadata và nội dung liên quan đã kiểm tra, nhưng không hỗ trợ toàn bộ nhãn đang dùng.
- `NEEDS_REVIEW`: thiếu bản chính thức, vị trí chính xác, phiên bản hoặc người kiểm tra thứ hai.
- Một nguồn có thể `DIRECT` cho triage và chỉ `PARTIAL/CONTEXTUAL` cho specialty.

## 2. Kết quả theo tài liệu

| Document ID | Metadata và liên kết đã kiểm tra | Mục liên quan | Nhận diện triệu chứng | Triage | Đánh giá tại lĩnh vực | Referral/routing specialty | Kết luận audit |
|---|---|---|---|---|---|---|---|
| DOC-BYT-ACS-2019 | Bộ Y tế, Quyết định 2187/QĐ-BYT, 03/06/2019, *Hướng dẫn chẩn đoán và xử trí hội chứng mạch vành cấp*. [Thư viện Cục KCB](https://kcb.vn/van-ban/thu-vien-huong-dan-chan-doan-dieu-tri.html); [bản PDF đối chiếu](https://bvhongduc.vn/public/userfiles/HDDT_BYT/HDDT-Hoi-chung-mach-vanh-cap-2187-QD-BYT-2019.pdf) | Đại cương, tiếp cận hội chứng mạch vành cấp; cần ghi trang sau khi khóa PDF | DIRECT | DIRECT cho tính cấp cứu | DIRECT cho đánh giá tim mạch cấp | Không chứng minh routing ngoại trú Tim mạch sau safety gate | `VERIFIED_WITH_LIMITATION`; specialty `CONTEXTUAL` |
| DOC-AHA-CHEST-2021 | Gulati và cộng sự; AHA/ACC/ASE/CHEST/SAEM/SCCT/SCMR, 2021. DOI `10.1161/CIR.0000000000001029`. [AHA hub](https://professional.heart.org/en/guidelines-statements/2021-ahaaccasechestsaemscctscmr-guideline-for-the-evaluation-and-diagnosis-ofcir0000000000001029) | Section 4, initial evaluation of acute chest pain | DIRECT | DIRECT: ưu tiên loại trừ nguyên nhân đe dọa tính mạng | DIRECT cho đánh giá đau ngực; nêu nhiều nhóm nguyên nhân | Không hỗ trợ một specialty duy nhất; PE và ACS tạo nhiều hướng | `VERIFIED_WITH_LIMITATION`; specialty `CONTEXTUAL` |
| DOC-BYT-STROKE-2024 | Bộ Y tế, Quyết định 3312/QĐ-BYT, 05/11/2024, *Hướng dẫn chẩn đoán và điều trị đột quỵ não*. [Toàn văn tham chiếu](https://thuvienphapluat.vn/van-ban/the-thao-y-te/Quyet-dinh-3312-QD-BYT-2024-tai-lieu-chuyen-mon-Huong-dan-chan-doan-dieu-tri-dot-quy-nao-651734.aspx); [tin Bộ Y tế](https://adminmoh.moh.gov.vn/web/guest/hoat-dong-cua-lanh-dao-bo/-/asset_publisher/TW6LTp1ZtwaN/content/cap-nhat-va-trien-khai-cac-chien-luoc-phong-ngua-cap-cuu-va-ieu-tri-ot-quy-mot-cach-toan-dien) | Cấp cứu ban đầu/đột quỵ cấp; chưa khóa trang và bản PDF chính thức | DIRECT về hội chứng đột quỵ | DIRECT về xử trí sớm, nhưng vị trí trích dẫn cần xác minh lần hai | DIRECT cho đơn vị đột quỵ | Không tương đương gợi ý khám ngoại trú Thần kinh | `NEEDS_REVIEW` cho registry chính thức; chưa đủ hai verifier |
| DOC-CDC-STROKE-2026 | CDC, *Signs and Symptoms of Stroke*, web version 19/05/2026. [CDC](https://www.cdc.gov/stroke/signs-symptoms/) | Danh sách dấu hiệu và hành động khẩn cấp | DIRECT | DIRECT: gọi cấp cứu | CONTEXTUAL | Không hỗ trợ specialty routing | `VERIFIED_WITH_LIMITATION`; nguồn giáo dục sức khỏe, không phải guideline routing |
| DOC-AAFP-HEADACHE-2022 | Viera AM, Antono TJ. *Acute Headache in Adults: A Diagnostic Approach*. Am Fam Physician. 2022;106(3):260-268. PMID `36126007`. [PubMed](https://pubmed.ncbi.nlm.nih.gov/36126007/) | Abstract và phần red flags; cần khóa trang từ full text | DIRECT cho thunderclap/red flags | DIRECT cho immediate evaluation | PARTIAL cho đánh giá thần kinh | Không chỉ định routing ngoại trú Neurology cho mọi thunderclap headache | `VERIFIED_WITH_LIMITATION`; là bài tổng quan chẩn đoán, không gọi là clinical guideline; không có DOI đã xác minh |
| DOC-BYT-COPD-2023 | Bộ Y tế, Quyết định 2767/QĐ-BYT, 04/07/2023, *Hướng dẫn chẩn đoán và điều trị bệnh phổi tắc nghẽn mạn tính*. [PDF Bộ Y tế](https://emohbackup.moh.gov.vn/publish/attach/getfile/409988) | Chẩn đoán định hướng, triệu chứng và hô hấp ký | DIRECT | Không trực tiếp cho triage của ca ổn định | DIRECT cho đánh giá hô hấp/COPD | Có hỗ trợ chuyển cơ sở có hô hấp ký; tên specialty NovaCare chỉ được hỗ trợ PARTIAL | `VERIFIED_WITH_LIMITATION`; specialty `PARTIAL` |
| DOC-GOLD-COPD-2025 | ID/phiên bản V1.0 đã lỗi thời so với thời điểm audit | Thay bằng `DOC-GOLD-COPD-2026`: GOLD 2026 Report, v1.3, 08/12/2025. [GOLD 2026](https://goldcopd.org/2026-gold-report-and-pocket-guide/) | DIRECT cho biểu hiện và đánh giá COPD | Không phải căn cứ duy nhất cho triage | DIRECT cho đánh giá COPD | Không trực tiếp ánh xạ sang mã specialty NovaCare | `EXCLUDED_AS_SUPERSEDED`; thay ID mới, cần annotator thứ hai xác minh mục/trang |
| DOC-ACG-GERD-2022 | Katz PO và cộng sự. *ACG Clinical Guideline for the Diagnosis and Management of Gastroesophageal Reflux Disease*. Am J Gastroenterol. 2022;117(1):27-56. DOI `10.14309/ajg.0000000000001538`. [PubMed](https://pubmed.ncbi.nlm.nih.gov/34807007/) | Diagnosis/management recommendations | DIRECT cho triệu chứng điển hình | PARTIAL; đau ngực cần đánh giá nguyên nhân tim trước khi quy GERD | DIRECT cho đánh giá tiêu hóa/GERD | Không phải quy tắc chuyển mọi ợ nóng sang Gastroenterology | `VERIFIED_WITH_LIMITATION`; specialty `PARTIAL` |
| DOC-NICE-LBP-NG59 | NICE NG59, *Low back pain and sciatica in over 16s: assessment and management*, 30/11/2016, updated 11/12/2020. [Recommendations](https://www.nice.org.uk/guidance/ng59/chapter/Recommendations) | 1.1 assessment/risk stratification; specialist setting | DIRECT cho low back pain assessment | PARTIAL; yêu cầu loại trừ nguyên nhân nghiêm trọng | DIRECT cho MSK pathway/specialist interface | Không chỉ định Orthopedics là đích duy nhất | `VERIFIED_WITH_LIMITATION`; specialty `PARTIAL` |
| DOC-NICE-NEURO-NG127 | NICE NG127, *Suspected neurological conditions: recognition and referral*, 01/05/2019, updated 02/10/2023. [Adult recommendations](https://www.nice.org.uk/guidance/ng127/chapter/recommendations-for-adults-aged-over-16) | 1.7.1 sudden weakness; 1.7.3 severe low back pain + bladder/bowel/sexual disturbance or perineal numbness | DIRECT | DIRECT cho immediate referral; ánh xạ sang `EMERGENCY` là quy tắc protocol cần duyệt | DIRECT cho neurological/cauda equina assessment | Nêu local pathway, không hỗ trợ ngoại trú Neurology/Orthopedics duy nhất | `VERIFIED_WITH_LIMITATION`; specialty `CONTEXTUAL` |
| DOC-BYT-MSK | Bộ Y tế, Quyết định 361/QĐ-BYT, 25/01/2014, *Hướng dẫn chẩn đoán và điều trị các bệnh cơ xương khớp*. [Cục KCB](https://kcb.vn/van-ban/huong-dan-chan-doan-va-dieu-tri-cac-benh-co-xuong-khop.html); [PDF](https://kcb.vn/upload/2005611/20210723//HD%C4%90T-C%C6%A1-X%C6%B0%C6%A1ng-Kh%E1%BB%9Bp.pdf) | Phần đau cột sống thắt lưng; PDF hiển thị khoảng trang 136, cần khóa trang theo bản lưu | DIRECT cho bệnh cảnh cơ học | PARTIAL cho loại trừ nguyên nhân nghiêm trọng | DIRECT cho lĩnh vực cơ xương khớp | Không chứng minh mã `orthopedics` là lựa chọn duy nhất; catalog dùng tên Cơ xương khớp | `VERIFIED_WITH_LIMITATION`; specialty `PARTIAL` |

## 3. Thay đổi bắt buộc so với V1.0

1. Không dùng cột `Directness` chung cho cả triage và specialty. Registry chính thức phải có `symptomDirectness`, `triageDirectness`, `specialtyAssessmentDirectness` và `referralDirectness`.
2. Thay `DOC-GOLD-COPD-2025` bằng `DOC-GOLD-COPD-2026`; không sửa lịch sử bản ghi cũ mà đánh dấu `supersededBy`.
3. `DOC-BYT-STROKE-2024` chưa đạt gate để dùng cho locked test cho đến khi có bản lưu chính thức, mục/trang và verifier thứ hai.
4. Không nguồn cấp cứu nào ở trên tự động tạo một specialty ngoại trú duy nhất.
5. Mọi excerpt phải là đoạn trích ngắn được người gắn nhãn chép từ tài liệu, có locator và kiểm tra bản quyền; không dùng diễn giải do AI làm evidence.

## 4. Schema registry V1.1

```json
{
  "documentId": "DOC-...",
  "title": "...",
  "issuerOrAuthors": ["..."],
  "publicationYear": 2026,
  "version": "...",
  "url": "https://...",
  "doi": null,
  "accessedAt": "2026-11-09",
  "locator": { "section": "...", "recommendation": "...", "page": null },
  "evidenceExcerpt": "verbatim excerpt entered by a human reviewer",
  "symptomGroups": ["..."],
  "supportedTriageLabels": ["..."],
  "supportedSpecialtyCodes": ["..."],
  "symptomDirectness": "DIRECT",
  "triageDirectness": "DIRECT",
  "specialtyAssessmentDirectness": "PARTIAL",
  "referralDirectness": "CONTEXTUAL",
  "verificationStatus": "NEEDS_REVIEW",
  "verifiedBy": [],
  "supersededBy": null,
  "limitations": ["..."]
}
```

## 5. Gate để dùng nguồn trong dataset

- Metadata, URL/DOI và phiên bản đã kiểm tra.
- Locator đủ để người khác tìm lại nội dung.
- Hai người xác minh excerpt và loại bằng chứng.
- Specialty label chỉ được `LITERATURE_SUPPORTED` khi `specialtyAssessmentDirectness` hoặc `referralDirectness` đủ trực tiếp cho đúng mã catalog.
- Nguồn `NEEDS_REVIEW`, `EXCLUDED` hoặc chỉ `CONTEXTUAL` không được dùng một mình để tạo reference specialty trong locked test.
