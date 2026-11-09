# EVIDENCE–CASE MAPPING – EX-01 ĐẾN EX-10

**Ngày:** 09/11/2026  
**Nguyên tắc:** Mapping này giữ nguyên `NEEDS_REVIEW`; không tự duyệt triage taxonomy hoặc specialty label.

| Case | Triage reference | Specialty applicability | Evidence và locator | Evidence excerpt | Rationale/directness | Labeling status | Cần adjudication |
|---|---|---|---|---|---|---|---|
| EX-01 | `EMERGENCY` đề xuất | `DEFERRED_AFTER_TRIAGE` | DOC-BYT-ACS-2019, mục 1.2.1.b; DOC-AHA-CHEST-2021, Top Things #1/#3; DOC-NICE-CHEST-CG95 1.2.1.3, 1.2.1.7 | Xem excerpt nguyên bản đã khóa tại DOC-BYT-ACS-2019 trong registry | Symptom DIRECT; emergency action DIRECT từ AHA/NICE. Specialty outpatient không được thực thi | `NEEDS_REVIEW` | Duyệt mapping emergency terminology và safety override policy |
| EX-02 | `EMERGENCY` đề xuất | `DEFERRED_AFTER_TRIAGE` | DOC-CDC-STROKE-2026, Signs and symptoms; DOC-NICE-NEURO-NG127 1.7.1; DOC-BYT-STROKE-2024 chưa khóa locator | “Sudden confusion, trouble speaking, or difficulty understanding speech.” | Symptom và call-emergency DIRECT từ CDC; NG127 dẫn stroke pathway. BYT chưa qua gate | `NEEDS_REVIEW` | Xác minh BYT Stroke; duyệt mapping sang EMERGENCY |
| EX-03 | `EMERGENCY` đề xuất | `DEFERRED_AFTER_TRIAGE` | DOC-AAFP-HEADACHE-2022, Abstract red flags; DOC-CDC-STROKE-2026, Signs and symptoms | “acute thunderclap headache”; “warrant immediate evaluation.” | Thunderclap/immediate evaluation DIRECT; không hỗ trợ Neurology outpatient duy nhất | `NEEDS_REVIEW` | Cố vấn an toàn xác nhận taxonomy; không chấm specialty |
| EX-04 | `CONSULT` đề xuất | `APPLICABLE` đề xuất | DOC-BYT-COPD-2023 1.2.1–1.2.2; DOC-GOLD-COPD-2026 Ch.2 pp.21–22; DOC-NICE-COPD-NG115 1.1.28–1.1.30/Table 5 | “dyspnea, chronic cough or sputum production”; “refer people for specialist advice.” | Pulmonary assessment DIRECT; referral specialist DIRECT nhưng Pulmonology code PARTIAL | `NEEDS_REVIEW` | Duyệt code/catalog và việc chronic symptom cluster đủ cho specialty label chưa |
| EX-05 | `CONSULT` đề xuất | `APPLICABLE` đề xuất | DOC-ACG-GERD-2022, Diagnosis rec.1/4/6; DOC-NICE-GERD-CG184 1.4.1, 1.11.1 | “classic GERD symptoms of heartburn and regurgitation”; “non-responsive to treatment or unexplained” | GERD assessment DIRECT; EX-05 chưa thỏa điều kiện specialist referral của CG184 | `NEEDS_REVIEW` | Có chấp nhận Gastroenterology khi evidence chỉ hỗ trợ assessment/initial care không |
| EX-06 | `CONSULT` đề xuất | `APPLICABLE` đề xuất | DOC-BYT-MSK pp.134–136, mục 3.1/3.3; DOC-NICE-LBP-NG59 1.1.1 | “đau xuất hiện đột ngột sau bê vật nặng, sau hoạt động sai tư thế”. | Mechanical pattern DIRECT; Orthopedics routing PARTIAL | `NEEDS_REVIEW` | Khóa equivalence `orthopedics` ↔ Cơ xương khớp; duyệt referral threshold |
| EX-07 | `EMERGENCY` đề xuất | `DEFERRED_AFTER_TRIAGE` | DOC-AHA-CHEST-2021 slide pp.22, 28–31; DOC-NICE-CHEST-CG95 1.2.2.8 | “other potential cardiac, pulmonary, and thoracic causes of symptoms.” | Acute dyspnea/pleuritic pain cần loại trừ PE/pneumothorax; domain multi nhưng specialty decision deferred | `NEEDS_REVIEW` | Xác nhận red-flag formulation; không dùng multi-specialty làm scored label |
| EX-08 | `URGENT` đề xuất | `NEEDS_REVIEW` | DOC-NICE-CHEST-CG95 1.3.3.1; DOC-ACG-GERD-2022 rec.4; DOC-NICE-GERD-CG184 1.3.3 | “precipitated by physical exertion”; “Think about the possibility of cardiac or biliary disease”. | Evidence yêu cầu đánh giá cardiac differential; thời gian/đặc điểm hiện tại chưa đủ gắn URGENT hoặc two-specialty label | `NEEDS_REVIEW` | Bác sĩ duyệt triage; có thể bổ sung câu hỏi thay vì gắn nhãn |
| EX-09 | `REVIEW_REQUIRED` theo protocol | `NEEDS_REVIEW` | DOC-AHA-CHEST-2021 slide p.20; DOC-NICE-CHEST-CG95 1.3.2.1; protocol V1.1 | “Take a detailed clinical history”. | Evidence hỗ trợ cần thu thập thêm; `REVIEW_REQUIRED` là protocol-defined, không phải clinical label | `NEEDS_REVIEW` | Duyệt minimum information set và expected ask-more behavior |
| EX-10 | `EMERGENCY` đề xuất | `DEFERRED_AFTER_TRIAGE` | DOC-NICE-NEURO-NG127 1.7.3; DOC-BYT-MSK p.135 về rối loạn cơ tròn | “Refer immediately ... new-onset perineal numbness”. | Immediate referral DIRECT; mapping sang EMERGENCY và đích specialty chưa được duyệt | `NEEDS_REVIEW` | Chuyên gia xác nhận triage mapping; không ép Neurology/Orthopedics |

## Kết luận theo ca

- EX-01, EX-02, EX-03, EX-07 và EX-10 có căn cứ mạnh cho safety action, nhưng không đủ căn cứ để chấm specialty output sau safety override.
- EX-04, EX-05 và EX-06 có căn cứ assessment theo lĩnh vực; routing tới đúng mã specialty vẫn cần adjudication.
- EX-08 chưa đủ căn cứ cho `URGENT` hoặc multi-specialty reference.
- EX-09 phù hợp làm ca ask-more/protocol behavior, không phải literature-supported clinical triage.
