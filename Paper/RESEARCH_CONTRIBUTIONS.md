# Định hướng đóng góp nghiên cứu

**Đề tài:** “Giải pháp thiết kế kiến trúc phân tán đa kênh và xử lý tranh chấp suất khám thời gian thực trong hệ thống y tế số.”  
**Trạng thái:** các đóng góp dưới đây là giả thuyết/định hướng nghiên cứu; chưa có kết quả thực nghiệm để xác nhận tính mới hoặc hiệu quả.

## 1. Bối cảnh kỹ thuật đã quan sát

NovaCare có web và Android cùng gọi backend REST; PostgreSQL lưu appointment, slot và payment. Create chính đã khóa slot bằng row-level lock trong transaction, trong khi đổi lịch, hủy, expiry, callback thanh toán và cập nhật quản trị có các luồng xử lý khác nhau. Lịch dịch vụ dài có junction nhiều slot. Bằng chứng và giới hạn snapshot nằm trong [SYSTEM_ARCHITECTURE_AUDIT.md](./SYSTEM_ARCHITECTURE_AUDIT.md).

Các kỹ thuật riêng lẻ như transaction, row lock, optimistic concurrency, Redis lock, outbox, queue hay WebSocket đều là kỹ thuật đã biết. **Không nên tuyên bố từng kỹ thuật đó tự thân là đóng góp mới.**

## 2. Đóng góp có thể bảo vệ nếu được triển khai và đo

### C1. Mô hình hóa invariant đặt khám đa kênh

Định nghĩa chính thức capacity, occupancy, hold, release, consume, idempotency và trạng thái thanh toán cho một hệ thống có nhiều API writer. Điểm có thể nghiên cứu là chuyển các quy tắc vốn bị phân tán giữa patient/admin/payment/expiry thành một transition model có thể kiểm tra và đối chiếu với database.

**Bằng chứng cần có:** bảng transition được chuyên gia nghiệp vụ phê duyệt; invariant được biểu diễn bằng test/property-based test; mọi endpoint được map vào transition; không còn đường ghi occupancy ngoài service thống nhất.

### C2. Giao thức reservation nguyên tử cho slot liên tiếp

Đề xuất quy trình claim/release nhiều slot trong cùng transaction, theo thứ tự khóa xác định; đổi lịch dùng phép chênh lệch giữa tập slot cũ/mới; expiry/hủy giải phóng toàn bộ membership đúng một lần. Đây là đóng góp ứng dụng vào domain multi-slot, không phải phát minh row locking.

**Bằng chứng cần có:** test concurrency trên PostgreSQL thật; oracle khôi phục occupancy; 0 partial commit/overbooking/double release trong ma trận xác định trước; báo cáo deadlock/retry.

### C3. Giải quyết cạnh tranh payment–expiry–rebooking

Định nghĩa một policy dùng provider event/time, idempotency và kiểm tra lại capacity khi callback tới muộn; khi slot đã bán lại, không ghi `PAID` như booking đã được cấp mà chuyển qua refund/review theo policy. Điểm nghiên cứu là tính nhất quán của workflow phân tán và tác động của chính sách timestamp/grace period.

**Bằng chứng cần có:** truth table được nghiệp vụ duyệt; test mọi thứ tự interleaving; đo tỷ lệ callback duplicate/late, reservation hợp lệ, refund/review và sai lệch trạng thái.

### C4. So sánh thực nghiệm các lớp bảo vệ

So sánh DB row lock, conditional/CAS và phương án kết hợp; Redis lock là baseline/variant có điều kiện, không mặc định tốt nhất. Đo đồng thời correctness, tail latency, lock wait, throughput và phục hồi khi Redis/worker lỗi.

**Bằng chứng cần có:** variant thay đổi một yếu tố; môi trường, seed, fixture, code commit và phân phối được công bố; không chỉ báo số trung bình hoặc một lượt chạy.

### C5. Reconciliation và quan sát được tính đúng

Xây dựng phương pháp đối chiếu `bookedCount` với reservation membership/state và metric cho drift, double release, expiry lag và payment review. Đây có thể là đóng góp thực nghiệm về phát hiện sai lệch trong kiến trúc đa writer.

**Bằng chứng cần có:** fixture lỗi cố ý, độ bao phủ phát hiện, độ trễ phát hiện, false positives; chế độ sửa tự động phải được đánh giá riêng và có audit trail.

## 3. Giả thuyết nghiên cứu có thể kiểm chứng

- **H1:** Chuẩn hóa tất cả thay đổi occupancy qua một command path PostgreSQL transaction và CAS giảm vi phạm invariants so với snapshot baseline trong các kịch bản đồng thời được kiểm soát.
- **H2:** Khóa slot theo thứ tự toàn cục kết hợp guarded updates giữ đúng capacity cho booking nhiều slot, đồng thời cho phép đo định lượng trade-off về lock wait/deadlock/retry.
- **H3:** Idempotent transition + provider event identity xử lý callback/expiry lặp mà không release hoặc phát side effect hai lần.
- **H4:** Redis lock không làm tăng mức đảm bảo correctness nếu DB transaction/CAS đã là authority; giá trị của nó (nếu có) phải được chứng minh ở chỉ số contention/latency và khả năng phục hồi, sau khi tính overhead.

Đây là giả thuyết, không phải kết quả. H1–H4 cần được sửa dựa trên thiết kế thử nghiệm và related work.

## 4. Phạm vi tuyên bố được phép

Có thể tuyên bố “trong môi trường thử nghiệm X, trên workload Y, biến thể Z quan sát được...” nếu có artifact và phương pháp tái lập. Không tuyên bố:

- “Redis lock là mới” hoặc “database transaction giải quyết được mọi race”.
- “Zero overbooking trong mọi hệ thống/production” từ số lượt thử hạn chế.
- “Thời gian thực” nếu chỉ đo API HTTP mà không định nghĩa SLA/freshness/event delay.
- “Hệ thống phân tán đa kênh” theo nghĩa mọi HIS/đối tác đã được nối nếu source/triển khai chưa xác minh.
- Ưu thế hiệu năng nếu không có khoảng bất định/kiểm soát môi trường.

## 5. Câu hỏi nghiên cứu gợi ý

1. Khi các writer khác nhau (patient, admin, expiry worker, payment callback) cùng thay đổi reservation, invariant nào bị vi phạm trong baseline và tại thứ tự xen kẽ nào?
2. Với capacity contention và dịch vụ nhiều slot, row locking hay guarded CAS có trade-off correctness/latency/lock contention nào trong workload được kiểm soát?
3. Khi callback thanh toán và expiry đến bất kỳ thứ tự nào, chính sách provider timestamp + idempotency + re-claim/refund giữ trạng thái appointment/payment/occupancy nhất quán ra sao?
4. Outbox và realtime event ảnh hưởng thế nào đến độ trễ đồng bộ UI mà không tham gia quyết định cấp suất?
5. Có thể phát hiện counter drift từ reservation ledger với độ bao phủ/độ trễ nào?

## 6. Thiết kế đánh giá để hỗ trợ bài báo

- Đối chiếu V0 baseline, V1 DB locks, V2 locks+CAS, và V3 Redis-assisted (nếu có lý do).
- Dùng correctness oracle làm điều kiện tiên quyết; sau đó mới so hiệu năng.
- Bao gồm multi-slot, expiry/payment race, đa kênh hủy, idempotency và failure injection.
- Báo p50/p95/p99, throughput, lock waits, deadlocks, retries, conflict/error classes, queue lag, occupancy drift và refund/review outcomes.
- Công bố giới hạn: môi trường test, số worker/replica, dataset tổng hợp, số lượt, provider sandbox, và khác biệt production.

Chi tiết kiểm thử: [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md); so sánh kỹ thuật: [TECHNOLOGY_COMPARISON.md](./TECHNOLOGY_COMPARISON.md).

## 7. Quyết định cần xác nhận trước bài báo

1. Định nghĩa capacity cho `PENDING`, `AWAITING_PAYMENT`, `CONFIRMED`, `PAID`, `COMPLETED`, `NO_SHOW`, `FAILED`, `REFUNDED`.
2. Thời hạn hold, grace period và timestamp có thẩm quyền cho thanh toán.
3. Chính sách refund/manual review nếu slot đã được cấp lại trước IPN thành công.
4. Dịch vụ nhiều slot: độ dài, granularity, khả năng đổi cửa sổ và capacity khác nhau.
5. Hủy/đổi lịch bởi từng vai trò và nghĩa vụ hoàn phí.
6. Phạm vi dữ liệu: slot count là chỗ đang active hay thống kê lịch sử.
7. Kênh/HIS nào thực sự nằm trong phạm vi “đa kênh” của luận văn.

