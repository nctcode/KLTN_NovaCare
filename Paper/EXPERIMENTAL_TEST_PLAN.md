# Kế hoạch thực nghiệm kiểm thử tranh chấp suất khám

**Trạng thái:** kế hoạch, chưa thực thi. Không có số liệu đo trong tài liệu này.  
**Căn cứ vấn đề:** [SYSTEM_ARCHITECTURE_AUDIT.md](./SYSTEM_ARCHITECTURE_AUDIT.md#5-các-tình-huống-tranh-chấp-và-bằng-chứng).

## 1. Nguyên tắc thiết kế thử nghiệm

- Chạy trên môi trường thử nghiệm cô lập và PostgreSQL cùng phiên bản/cấu hình dự kiến đánh giá; tuyệt đối không dùng dữ liệu bệnh nhân thật.
- Mỗi scenario ghi commit/build, schema migration, DB/connection-pool config, số API instance/worker, seed, machine resources, thời gian chạy và trạng thái Redis/queue.
- So sánh baseline hiện tại (đóng băng theo commit) với từng phương án xử lý, không thay đổi nhiều yếu tố trong cùng một lượt.
- Mỗi lượt bắt đầu từ fixture sạch; đồng hồ dùng UTC và điều khiển thời gian test cho expiry/callback.
- Mức đồng thời đề xuất: **1, 2, 10, 50, 100 request** cho một slot/cụm slot; điều chỉnh theo năng lực môi trường trước khi chạy. Các giá trị là cấu hình thí nghiệm dự kiến, không phải kết quả hay giới hạn production.
- Lặp ít nhất 30 lượt độc lập cho mỗi tổ hợp cấu hình để ước lượng độ biến thiên; báo cả phân phối/CI phù hợp thay vì chỉ trung bình. Nếu chi phí môi trường giới hạn số lượt, ghi rõ giới hạn.
- Correctness oracle: dựng lại occupancy từ reservation/slot membership theo policy đã chốt; so sánh với `bookedCount`, appointment states và payment states.
- Không bật Redis lock/outbox/WS “chung một lần” nếu mục tiêu là so sánh công nghệ: mỗi biến thể cần cấu hình và kết quả riêng.

## 2. Ma trận kịch bản

| ID / vấn đề từ audit | Điều kiện ban đầu | Tải đồng thời đề xuất | Kết quả mong đợi | Chỉ số cần đo | Tiêu chí thành công |
|---|---|---:|---|---|---|
| E1: Hai người cùng đặt slot, capacity 1 | Một slot `AVAILABLE`, count 0; hai profile khác nhau; cùng gửi create. | 2; sau đó 10/50/100 để khảo sát tải. | Tối đa 1 reservation chiếm suất; request còn lại conflict rõ ràng. | Success/409/5xx, latency p50/p95/p99, DB lock wait, counter, active reservation count. | Không có overbook; count bằng occupancy tính lại; không 5xx không giải thích được. |
| E2: Nhiều request, capacity > 1 | Slot capacity C (ví dụ fixture C=10), count 0; request nhiều hơn C. | C+1 và 2C; concurrency 10/50/100. | Đúng C request tối đa được giữ nếu không có failure injection. | Số hold/confirmed, conflict, count, latency, throughput. | `0 <= occupied <= C`, count khớp ledger; mọi thất bại giải thích được. |
| E3: Cửa sổ multi-slot | Một dịch vụ duration N slots × 15 phút; capacity đồng nhất; cửa sổ hợp lệ. | 10/50/100 cửa sổ cùng start. | Mỗi appointment chiếm đủ N slot hoặc không slot nào; không có partial reservation. | Junction per appointment, count trên từng slot, rollback rate, lock wait/deadlock. | Mỗi appointment active có đúng N membership liền kề; mọi slot count trong capacity. |
| E4: Cửa sổ giao nhau / lock ordering | Tạo các start time khác nhau có cửa sổ N slot chồng lấn. | 10/50 lệnh xen kẽ start time; đảo thứ tự phát request qua các lượt. | Không overbook; transaction hoàn tất hoặc conflict; deadlock nếu có được retry bounded. | SQLSTATE deadlock/serialization, retry count, completion/409, latency tail. | Không treo; sau retry đạt E1/E3 invariants; lỗi retry exhaustion được phân loại. |
| E5: Create cạnh tranh reschedule | Slot đích gần đầy; một lịch cũ reschedulable; create khác tranh suất đích. | 2, 10, 50 lệnh trộn; phân bố create/reschedule ghi rõ. | Tổng occupancy không vượt capacity; reschedule thất bại giữ nguyên slot cũ; thành công chuyển toàn bộ. | Occupancy cũ/mới, trạng thái lịch, 409, rollback, latency. | Không mất reservation cũ khi target không đủ; không counter drift. |
| E6: Hủy lặp / double release | Một appointment chiếm 1 và một appointment chiếm nhiều slot. | 2/10 requests cùng hủy một appointment; biến thể hủy + expiry cùng lúc. | Chỉ một transition giải phóng; lệnh lặp idempotent hoặc trả trạng thái cuối. | CAS winners, số lần decrement, count từng slot, trạng thái cuối. | Mỗi slot bị decrement đúng 1 lần mỗi reservation; không count âm/giảm sai. |
| E7: Hủy đối đầu booking mới | Một appointment occupying trên slot; song song cancel và create slot vừa giải phóng. | 2, 10, 50 request; đổi thứ tự barrier/timing. | Linearizable outcome: booking mới nhận suất sau khi release commit; hoặc nhận conflict trước commit rồi retry client. Không ghi đè increment/decrement. | Thứ tự commit, count, active ledger, conflict, lock wait. | Counter cuối khớp ledger, không double booking, không lost update. |
| E8: Hủy qua nhiều kênh quản trị | Appointment multi-slot; gọi patient/admin/hospital-admin cancellation trong fixture được phân quyền. | 2/10/50 lệnh tổng hợp, cùng appointment. | Cùng một policy/status transition và release tất cả slot đúng một lần, bất kể endpoint. | Status/history/audit, count/membership, response per channel. | Không có endpoint làm lệch occupancy; unauthorized command không đổi DB. |
| E9: Expiry worker trùng nhau | N holds quá hạn, nhiều slot; chạy nhiều worker/sweep replica. | 2/4 workers; batch 1/10/100; chạy 2 lần lặp. | Mỗi hold expire đúng một lần; release mọi slot; job retry an toàn. | Processed count, duplicate claim, count delta, worker throughput, errors. | Sau mọi lần, active holds=0 (ngoại trừ payment thắng); count khớp oracle. |
| E10: Payment/expiry race | Hold gần tới hạn; callback success đồng thời sweeper; chạy nhiều thứ tự interleaving. | 2 requests cho một appointment; sau đó 10 callbacks lặp. | Kết quả tuân chính sách paid_at/grace/refund đã phê duyệt; không `PAID` nếu không có quyền suất theo policy; không release lặp. | Provider event idempotency, appointment/payment/reservation state, refund/review, count. | Trạng thái cuối hợp lệ theo truth table đã duyệt; không có charge bị bỏ quên hay overbook. |
| E11: Thanh toán callback trùng/thất lạc | Payment transaction tạo trước; gửi cùng provider event nhiều lần; mô phỏng crash quanh commit/outbox publish. | 2/10/50 IPN cùng event; worker restart. | Payment và appointment cập nhật một lần; duplicate trả response phù hợp; outbox eventually delivered. | Duplicate event count, outbox age/retry, notification duplicate, state/history. | Một logical transition; không duplicate side effect không idempotent. |
| E12: Idempotency create | Cùng actor, cùng payload và key; biến thể cùng key khác payload/actor. | 2/10/50/100 retries song song. | Cùng request trả cùng appointment; key reuse sai payload/actor bị từ chối; không duplicate appointment/slot membership. | Unique violations, logical response IDs, booking count, 4xx/5xx. | Chính xác một appointment theo key; replay đúng hợp đồng API. |
| E13: Hai slot khác nhau cùng bệnh nhân nhưng giao nhau | Cùng patient profile; hai cửa sổ thời gian khác slot ID nhưng overlap. | 2/10 request đồng thời; biến thể patient profile khác cùng user nếu policy áp dụng. | Tối đa lịch phù hợp policy overlap đã phê duyệt. | Overlap count, CAS/profile lock wait, conflict. | Không có overlap trái policy. |
| E14: Thay đổi capacity/block trong lúc booking | Slot gần đầy; admin giảm capacity hoặc block/disable trong khi create/reschedule. | 2, 10 lệnh; chạy cả hai thứ tự khóa. | Policy điều chỉnh slot được tôn trọng; không claim vượt capacity; admin không giảm dưới occupancy nếu bị cấm. | Version/CAS conflict, count/capacity, booking result. | Sau commit luôn thỏa invariant hoặc slot ở trạng thái ngoại lệ đã audit. |
| E15: Counter reconciliation | Tạo fixture có counter đúng và một fixture cố ý lệch trong môi trường test. | N/A hoặc cùng create/cancel load khi chạy reconciler. | Chế độ audit phát hiện lệch; chế độ sửa chỉ bật khi có duyệt và transaction an toàn. | Drift count/magnitude, detection time, false-positive, repair audit. | Mọi lệch fixture được phát hiện; không sửa âm thầm hoặc phá lịch sử. |

## 3. Truth table cần khóa trước test payment/status

Hoàn thiện trước E8–E11:

| Trạng thái reservation/appointment | Chiếm capacity? | Hủy được? | Expiry? | Callback paid |
|---|---|---|---|---|
| `AWAITING_PAYMENT` trước hạn | **Cần xác nhận**; code hiện tăng count | Có trong source | Chưa tới hạn | Chấp nhận nếu hợp lệ |
| `AWAITING_PAYMENT` quá hạn | **Cần xác nhận**; hold dự kiến hết hạn | Có | Có | Quy tắc thanh toán muộn cần xác nhận |
| `CONFIRMED` / `PAID` | **Cần xác nhận**; đề xuất vẫn giữ chỗ | Tùy deadline/role | Không | Duplicate callback idempotent |
| `CANCELLED` / `EXPIRED` | Đề xuất không chiếm | Đã kết thúc | Đã kết thúc | Refund/review; không update vô điều kiện |
| `COMPLETED` / `NO_SHOW` | **Cần xác nhận**: historical count hay free capacity | Không theo source chung | Không | Không áp dụng |
| `PENDING` / `FAILED` / `REFUNDED` | **Cần xác nhận** | Theo policy | Theo policy | Theo payment lifecycle |

Không bắt đầu báo cáo benchmark về race payment trước khi truth table và quy tắc timestamp provider được duyệt.

## 4. So sánh phương án thí nghiệm

| Variant | Cơ chế | Điều kiện giữ nguyên |
|---|---|---|
| V0 — Audit baseline | Snapshot hiện tại, không chỉnh sửa | Cùng data fixture, cấu hình DB, load generator; ghi rõ lỗi/hạn chế hiện hữu. |
| V1 — DB row locks | Transaction + khóa toàn bộ slot theo thứ tự + kiểm tra sau khóa | Cùng trạng thái/transition và API. |
| V2 — DB locks + CAS/guards | V1 + guarded counter update + appointment/reservation CAS | Cùng indexes/connection pool; chỉ khác guard để so sánh. |
| V3 — Redis-assisted | V2 + Redis lock có token/fencing/TTL được tài liệu hóa | Cùng DB/load/worker; đo thêm Redis failover, lease expiry, Redis outage. |

V3 chỉ nên chạy sau khi V1/V2 đạt correctness và có lý do đo lường để thêm Redis. Không diễn giải Redis lock thành đóng góp khoa học tự thân.

## 5. Chỉ số và cách báo cáo

### Correctness

- Số appointment/reservation active và số slot membership.
- `bookedCount`, `capacity`, `status` cho từng slot.
- Sai khác `bookedCount - occupancy_recomputed`.
- Overbook count (`occupancy > capacity`), count âm, release lặp, partial multi-slot, appointment trùng patient-time trái policy.
- Payment đã thu nhưng booking không hợp lệ; số case refund/review.

### Hiệu năng/vận hành

- Throughput (request/s và transaction/s); latency p50/p95/p99.
- HTTP success/409/4xx/5xx/timeout theo endpoint.
- DB pool saturation, transaction duration, row-lock wait, deadlocks, serialization retries.
- Queue/outbox lag, duplicate deliveries, expiry lag (thời điểm xử lý trừ thời hạn).
- Redis lock wait/acquire timeout/lease expiry/fencing rejection nếu V3 chạy.

### Tiêu chí kết luận

- Correctness là cổng bắt buộc: **0 overbooking, 0 negative count, 0 duplicate release, 0 partial multi-slot commit** theo oracle/policy của scenario. Một vi phạm làm variant thất bại, bất kể throughput.
- Mọi conflict phải có mã/response dự kiến; không quy lỗi capacity hợp lệ thành 5xx.
- Báo cáo performance bằng số liệu đo và phân phối/CI, kèm môi trường; không tuyên bố variant nhanh hơn nếu khoảng bất định chồng lấp/thiết kế chưa đủ lực thống kê.
- Tách kết quả controlled DB test khỏi kết quả deployed system và production workload.

## 6. Quy trình tái lập

1. Ghi commit hash, trạng thái working tree và migration version; xác nhận không đưa secrets vào báo cáo.
2. Dựng DB test, migrate, sinh fixture tổng hợp và kiểm tra occupancy oracle trước tải.
3. Warm-up riêng rồi chạy từng tổ hợp variant × concurrency × scenario; randomize thứ tự variant để giảm hiệu ứng nhiệt/cache.
4. Giữ log request correlation ID và event ID; không log tên, hồ sơ hoặc nội dung y tế.
5. Sau lượt tải, chạy reconciler chỉ đọc; lưu CSV thô, cấu hình và kết quả tổng hợp.
6. Phân tích correctness trước performance; ghi mọi lần thất bại và không loại bỏ outlier nếu chưa có lý do xác định trước.

## 7. Giới hạn và quyết định cần xác nhận

- Nguồn occupancy/oracle phụ thuộc trạng thái nào chiếm capacity; xem truth table.
- Cần provider sandbox hoặc callback giả lập có timestamp/event identity đáng tin cậy để test payment muộn.
- Cần xác minh số replica/worker và cách expiry hiện được kích hoạt trong triển khai.
- Cần phê duyệt tải concurrency tối đa trên môi trường test để không ảnh hưởng dịch vụ dùng chung.
- Đây là test plan, chưa có số đo hay kết luận hiệu năng.
