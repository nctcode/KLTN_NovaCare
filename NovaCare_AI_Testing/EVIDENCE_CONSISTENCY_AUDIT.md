# EVIDENCE CONSISTENCY AUDIT – NOVACARE HYBRID AI

**Ngày audit:** 09/11/2026  
**Phạm vi:** 5 tài liệu Evidence V1.0, Research Protocol V1.1 và Protocol Decision Log  
**Kết quả consistency sau sửa:** `PASS` cho Registry/Case Mapping V1.1 cùng Specialty Matrix và Gap Report đã hiệu chỉnh  
**Evidence gate hai người:** `NOT PASSED`

## 1. Phương pháp

1. So sánh tập 15 Evidence ID trong Registry, Specialty Matrix và Verification Checklist.
2. So khớp metadata/status giữa bảng danh mục và hồ sơ nguồn.
3. Truy từng Evidence ID, locator và excerpt của EX-01–EX-10 về Registry.
4. So sánh bốn directness fields giữa Registry và Specialty Matrix.
5. Kiểm tra `SUPERSEDED`, `NEEDS_REVIEW`, independent verification và các quyết định `OPEN`.
6. Mở lại nguồn CDC và official AHA slide set cho EX-02/EX-07; không dựa vào diễn giải cũ.

## 2. Kết quả inventory

| Kiểm tra | Kết quả |
|---|---|
| Evidence ID trong Registry V1.1 | 15 |
| Evidence ID trong Specialty Matrix | 15, trùng hoàn toàn Registry |
| Evidence ID trong Verification Checklist | 15, trùng hoàn toàn Registry |
| Evidence ID được Case Mapping V1.1 sử dụng | 14 active records; không dùng GOLD 2025 |
| ID lạ hoặc thiếu hồ sơ | 0 |
| `SUPERSEDED` dùng làm evidence case | 0 |
| `NEEDS_REVIEW` bị mô tả như approved | 0 |
| Independent reviewer bị tự điền | 0 |
| Case được nâng thành `LITERATURE_SUPPORTED` | 0 |

## 3. Các lỗi phát hiện và xử lý

| ID | Severity | Tài liệu/case | Lỗi V1.0 | Cách xử lý | Trạng thái |
|---|---|---|---|---|---|
| EC-01 | HIGH | DOC-CDC-STROKE-2026 / EX-02 | Mapping dùng excerpt “Sudden confusion…” nhưng Registry chỉ lưu excerpt unilateral weakness | Xác minh trên CDC “Signs and symptoms” lines 41–47; bổ sung locator và excerpt vào Registry V1.1 | FIXED |
| EC-02 | HIGH | DOC-AHA-CHEST-2021 / EX-07 | Excerpt “other potential cardiac, pulmonary…” nằm ở slide p.35 nhưng mapping khai pp.22, 28–31 | Thay excerpt case bằng câu PE/dyspnea/pain-with-inspiration tại p.29; ghi p.35 riêng trong Registry | FIXED |
| EC-03 | MEDIUM | DOC-AHA-CHEST-2021 / EX-07, EX-09 | Registry locator thiếu p.20, p.22, pp.28–30 và p.35 đang được dùng để giải thích case | Mở rộng locator trong Registry V1.1, thêm excerpt p.20 và p.29 | FIXED |
| EC-04 | MEDIUM | DOC-NICE-CHEST-CG95 / EX-07–EX-09 | Mapping dùng 1.2.2.8 và 1.3.2.1 nhưng Registry chưa liệt kê; excerpt exertion/history chưa có | Bổ sung locator 1.2.2.8, 1.3.2.1 và hai excerpt đã xác minh | FIXED |
| EC-05 | MEDIUM | DOC-NICE-GERD-CG184 / EX-08 | Excerpt cardiac/biliary differential có trong 1.3.3 nhưng chưa có trong Registry | Bổ sung locator 1.3.3 và excerpt nguyên bản | FIXED |
| EC-06 | MEDIUM | Specialty Matrix / DOC-NICE-GERD-CG184 | Triage dùng giá trị `scenario-dependent`, ngoài enum protocol | Chuẩn hóa thành `DIRECT`; ghi rõ chỉ áp dụng acute GI bleeding, không áp dụng uncomplicated reflux | FIXED |
| EC-07 | MEDIUM | Matrix/Registry / NICE CG95, NG115, CG184 | Referral cell trộn “DIRECT care setting” với “PARTIAL specialty code”, gây nhầm assessment/routing | Chuẩn hóa `REFERRAL_ROUTING=PARTIAL` đối với mã NovaCare; care-setting referral được ghi riêng trong mô tả | FIXED |
| EC-08 | LOW | EX-01 | Cột excerpt chỉ trỏ “xem Registry”, chưa chứa excerpt truy ngược trực tiếp | Mapping V1.1 ghi excerpt BYT ACS và locator cụ thể | FIXED |
| EC-09 | MEDIUM | Evidence Gap Report | Số “official/DOI locator đọc được = 12” không nêu mẫu số/phương pháp và không tái lập được | Đếm lại thành 11 authoritative/DOI full-text locators; tách 2 mirror, 1 unavailable, 1 superseded | FIXED |
| EC-10 | LOW | DOC-NICE-NEURO-NG127 / EX-10 | Excerpt rút gọn bằng ellipsis không trùng chuỗi excerpt Registry | Dùng cùng excerpt đã lưu trong Registry V1.1 | FIXED |

## 4. Audit directness sau sửa

| Evidence ID | Symptom | Triage | Specialty assessment | Referral routing đến mã NovaCare | Ghi chú |
|---|---|---|---|---|---|
| DOC-BYT-ACS-2019 | DIRECT | PARTIAL | DIRECT | NONE | Mirror limitation |
| DOC-AHA-CHEST-2021 | DIRECT | DIRECT | DIRECT | PARTIAL | ED/EMS pathway không phải outpatient specialty |
| DOC-BYT-STROKE-2024 | NONE | NONE | CONTEXTUAL | NONE | NEEDS_REVIEW |
| DOC-CDC-STROKE-2026 | DIRECT | DIRECT | CONTEXTUAL | NONE | Public guidance |
| DOC-AAFP-HEADACHE-2022 | DIRECT | DIRECT | PARTIAL | NONE | Clinical review |
| DOC-BYT-COPD-2023 | DIRECT | NONE | DIRECT | PARTIAL | Facility with spirometry |
| DOC-GOLD-COPD-2025 | NONE | NONE | NONE | NONE | SUPERSEDED |
| DOC-GOLD-COPD-2026 | DIRECT | NONE | DIRECT | NONE | Diagnostic assessment only |
| DOC-ACG-GERD-2022 | DIRECT | PARTIAL | DIRECT | NONE | Cardiac exclusion condition |
| DOC-NICE-LBP-NG59 | DIRECT | PARTIAL | DIRECT | PARTIAL | Specialist/surgical path not unique code |
| DOC-NICE-NEURO-NG127 | DIRECT | DIRECT | DIRECT | PARTIAL | Local/neurological assessment path |
| DOC-BYT-MSK | DIRECT | PARTIAL | DIRECT | PARTIAL | “Cơ sở chuyên khoa” not unique |
| DOC-NICE-CHEST-CG95 | DIRECT | DIRECT | DIRECT | PARTIAL | Hospital referral is directly supported |
| DOC-NICE-COPD-NG115 | DIRECT | NONE | DIRECT | PARTIAL | Specialist advice direct, code not named |
| DOC-NICE-GERD-CG184 | DIRECT | DIRECT* | DIRECT | PARTIAL | `*` only acute GI bleeding; uncomplicated reflux is NONE |

## 5. Case-level consistency conclusion

| Case | Symptom evidence | Triage evidence | Specialty assessment | Referral routing | Inference bắt buộc giữ riêng | Status |
|---|---|---|---|---|---|---|
| EX-01 | Có | Có | Có | Hospital only | EMERGENCY taxonomy; no outpatient route | NEEDS_REVIEW |
| EX-02 | Có | Có | Contextual | Không | BYT locator; EMERGENCY taxonomy | NEEDS_REVIEW |
| EX-03 | Có | Có | Partial | Không | Neurology route | NEEDS_REVIEW |
| EX-04 | Có | Không cho CONSULT | Có | Partial | CONSULT + Pulmonology code | NEEDS_REVIEW |
| EX-05 | Có | Không cho CONSULT | Có | Không áp dụng trực tiếp | CONSULT + Gastroenterology route | NEEDS_REVIEW |
| EX-06 | Có | Không cho CONSULT | Có | Không áp dụng trực tiếp | CONSULT + Orthopedics equivalence | NEEDS_REVIEW |
| EX-07 | Có | Có cho urgent ED review | Differential only | ED only | EMERGENCY taxonomy; no multi-specialty score | NEEDS_REVIEW |
| EX-08 | Có | Chưa đủ cho URGENT | Có theo hai differential domains | Chưa thỏa điều kiện | URGENT + multi-specialty | NEEDS_REVIEW |
| EX-09 | Có cho ask-more | Protocol-defined only | Chưa đủ | Không | Minimum information policy | NEEDS_REVIEW |
| EX-10 | Có | Immediate referral | Contextual | Local pathway | EMERGENCY mapping + specialty route | NEEDS_REVIEW |

## 6. Kiểm tra giới hạn nghiên cứu

| Guardrail | Kết quả |
|---|---|
| Không đồng nhất assessment và referral | PASS |
| Không chuyển emergency referral thành outpatient specialty | PASS |
| Không chuyển assessment thành diagnosis | PASS |
| Không tự phê duyệt safety taxonomy | PASS |
| Không chuyển label thành `LITERATURE_SUPPORTED` | PASS |
| Không đánh dấu runtime evidence `APPROVED` | PASS |
| Không dùng `SUPERSEDED` làm evidence | PASS |
| `NEEDS_REVIEW` vẫn được giữ | PASS |

## 7. Lỗi và blocker còn lại

- **Consistency errors chưa sửa:** 0.
- **Evidence gap chưa thể xử lý:** DOC-BYT-STROKE-2024 chưa có locator/excerpt từ bản chính thức.
- **Governance blockers:** independent reviewer chưa thực hiện; DL-03, DL-04, DL-07, DL-08, DL-10, DL-11, DL-14 và DL-19 chưa được phê duyệt.
- **Clinical adjudication:** EX-04, EX-05, EX-06, EX-08 và EX-10 chưa đủ điều kiện làm scored reference labels.

## 8. Readiness

**PASS về consistency cho bộ tài liệu V1.1.** Có thể chuyển sang **Dataset Annotation Dry Run** 10–20 case skeleton ở chế độ không chấm điểm, với nhãn `PROVISIONAL_SINGLE_ANNOTATOR` hoặc `NEEDS_REVIEW`. Chưa được chuyển sang scored Dataset Pilot, locked test hoặc runtime RAG corpus `APPROVED`.
