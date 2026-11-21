# So sánh phương án kỹ thuật xử lý tranh chấp

**Phạm vi:** ba nhóm lựa chọn theo yêu cầu. Nhận định là phân tích kiến trúc, không phải kết quả benchmark. Xem [SYSTEM_ARCHITECTURE_AUDIT.md](./SYSTEM_ARCHITECTURE_AUDIT.md) để biết hiện trạng.

## 1. Các phương án

### A. PostgreSQL transaction + row-level locking

Trong một transaction, khóa các hàng slot cần thiết (`SELECT ... FOR UPDATE`), đọc lại capacity/trạng thái sau khóa, cập nhật appointment, slot membership và counter. Với multi-slot, khóa đầy đủ các slot theo một thứ tự toàn cục.

Ưu điểm là quyết định suất ở cùng DB lưu trạng thái; rollback nguyên tử; lock được giải phóng khi transaction kết thúc; không cần dịch vụ lock thứ hai. NovaCare đã dùng mẫu này ở `AppointmentsService.create()`. Hạn chế là contention trên slot “nóng”, thời gian chờ lock và deadlock nếu thứ tự khóa không nhất quán; transaction dài làm tăng thời gian giữ lock.

### B. Conditional update / optimistic concurrency

Claim capacity bằng một lệnh atomic có predicate như `bookedCount < capacity`, đồng thời tăng `version`; thành công khi đúng một hàng được cập nhật. Có thể dùng CAS (`WHERE version = expectedVersion`) để phát hiện stale write. Mọi thay đổi appointment/counter vẫn phải ở cùng PostgreSQL transaction. Với multi-slot, thực hiện guarded updates theo thứ tự cố định và rollback tất cả nếu bất kỳ slot nào thất bại.

Ưu điểm là guard nằm sát dữ liệu, hạn chế lost update và có thể rút gọn read-check-write. Khi contention cao, nhiều request có thể nhận 0 rows và trả conflict thay vì chờ lâu (tùy lock/DB scheduler). Hạn chế: logic CAS/retry và xử lý multi-slot phức tạp hơn; “optimistic” không có nghĩa DB không khóa ở tầng thấp; nếu chỉ bảo vệ counter mà không transition trạng thái idempotently vẫn có thể double-release.

### C. Redis distributed lock + PostgreSQL transaction

Trước thao tác DB, lấy lock theo slot hoặc tập slot bằng token duy nhất/TTL; thực hiện PostgreSQL transaction; sau đó release lock an toàn bằng token. Muốn chịu pause dài/lease hết hạn cần fencing token được DB kiểm tra, không chỉ TTL. Multi-slot cần thứ tự lấy lock và xử lý partial acquisition/release.

Ưu điểm tiềm năng là điều phối ứng dụng nhiều process trước khi DB contention, có thể hữu ích nếu tài nguyên nằm ngoài một DB hoặc cần admission control. Hạn chế: hai hệ thống trạng thái không cùng transaction; lock có thể hết hạn khi client còn chạy; Redis outage/partition, clock/TTL và crash tạo trạng thái khó; cần fencing token và recovery; lock không thay DB constraints/transaction. Với cùng PostgreSQL làm nguồn sự thật, thêm Redis lock tăng chi phí vận hành mà không tự giải quyết double-release/status race.

## 2. Ma trận so sánh định tính

| Tiêu chí | PostgreSQL row lock + transaction | Conditional update / optimistic CAS | Redis lock + PostgreSQL |
|---|---|---|---|
| Tính nhất quán | Cao nếu mọi mutation dùng cùng transaction và thứ tự khóa | Cao khi CAS/guard, state transition và counter cùng transaction | DB vẫn nhất quán nếu mọi write được bảo vệ ở DB; Redis lock riêng không tạo atomic commit liên hệ thống |
| Chống overbooking | Cao trong phạm vi các row được khóa và kiểm tra lại | Cao cho slot được cập nhật bằng predicate `count < capacity`; multi-slot cần rollback nguyên tử | Chỉ phụ trợ; không thay guard ở PostgreSQL. TTL/lease sai có thể để hai holder cùng chạy |
| Double release | Cần CAS trạng thái reservation cộng decrement trong cùng transaction | CAS transition và decrement guarded phù hợp; counter guard đơn lẻ chưa đủ | Redis lock có thể serialize nhưng retry/callback duplicate vẫn đòi idempotency DB |
| Xử lý đồng thời | Request cùng slot tuần tự hóa, phù hợp mô hình capacity | Conflict thua được phát hiện bằng số hàng cập nhật/version mismatch; có thể retry chọn lọc | Có thể giảm request cùng key vào DB, nhưng có thêm contention/coordination ở Redis |
| Phục hồi khi process lỗi | DB rollback và tự giải phóng row locks khi connection kết thúc | DB rollback/CAS; state chỉ commit nguyên tử | Cần xử lý lock TTL, release sau crash, fencing và consistency với transaction DB |
| Multi-slot | Khóa toàn bộ slot theo thứ tự cố định rồi commit một lần | Guard từng slot theo thứ tự cố định; rollback nếu một slot thất bại | Cần acquire cả bộ lock và xử lý partial lock; DB transaction vẫn bắt buộc |
| Deadlock/retry | Deadlock có thể có; thứ tự toàn cục và retry bounded | Có thể vẫn chờ/đụng deadlock; conflict CAS khác deadlock | Có thể thêm lock-order deadlock/timeout ngoài deadlock DB |
| Độ phức tạp triển khai | Thấp-vừa; pattern phù hợp với Prisma/PostgreSQL hiện tại | Vừa; cần thiết kế CAS, error mapping, multi-slot và retry rõ ràng | Cao; thêm Redis availability, lease, token/fencing, alerting và recovery |
| Chi phí vận hành | Thấp nhất: dùng DB hiện có | Thấp-vừa; cùng DB, thêm metric/reconciliation | Cao hơn: Redis HA/monitoring, lock debugging và vận hành liên hệ thống |
| Phù hợp NovaCare | Cao cho correctness ban đầu; tận dụng create đã có | Cao như lớp bảo vệ bổ sung/đường tối ưu sau khi đo | Chưa nên là cơ chế correctness mặc định; cân nhắc khi chứng minh DB là bottleneck |

“Cao” là đánh giá thiết kế có điều kiện, không phải lời khẳng định hệ thống hiện tại đã thỏa tiêu chí. Nếu bất kỳ endpoint nào vẫn ghi counter trực tiếp ngoài service thống nhất, mọi phương án đều suy yếu.

## 3. Khuyến nghị kết hợp

**Khuyến nghị:** PostgreSQL transaction + row lock theo thứ tự toàn cục làm serialization authority; conditional update/CAS làm guard sát dữ liệu; reservation transition idempotent đảm bảo release một lần; reconciliation phát hiện counter drift. Message queue/outbox phục vụ việc phụ trợ sau commit. Không dùng Redis lock cho đường cấp suất ở phiên bản đầu.

Lý do:

1. Dữ liệu appointment, slot và counter hiện ở PostgreSQL, nên PostgreSQL là điểm duy nhất có thể commit toàn bộ thay đổi liên quan cùng nhau.
2. Create đã dùng row-level locking, nên cách này gần với mã nguồn và ít thay đổi vận hành nhất.
3. Conditional update bổ sung phòng vệ nếu code gọi nhầm/đọc stale, nhưng không thay row lock/lifecycle transaction.
4. Redis lock không xử lý được transaction cross-system hay payment callback semantics; cần có bằng chứng contention DB là nút thắt trước khi thêm nó.
5. Outbox/queue thích hợp cho hiệu ứng phụ, không cho quyết định cạnh tranh ai nhận suất.

## 4. Khi nào xem xét Redis lock?

Chỉ làm thử nghiệm riêng nếu đo được một hoặc nhiều tình huống: row-lock wait kéo dài ở tải thực tế, DB connection pool bị bão hòa, chi phí conflict retry cao, hoặc phải phối hợp một tài nguyên ngoài PostgreSQL. Khi đó:

- Định nghĩa key, phạm vi lock, thứ tự multi-key, lease/renewal, ownership token, fencing token và hành vi khi Redis lỗi.
- Giữ conditional capacity guard và transaction DB làm hàng rào cuối.
- So sánh baseline PostgreSQL với Redis+PostgreSQL ở cùng tải, cấu hình, data set và correctness oracle.
- Báo cáo cả p95/p99, throughput, conflict, lock wait, Redis outage/lease-expiry recovery, không chỉ latency bình thường.

## 5. Lựa chọn theo giai đoạn

| Giai đoạn | Lựa chọn |
|---|---|
| Đạt đúng nghiệp vụ | Chuẩn hóa lifecycle/reservation; chuyển mọi kênh qua một service; row lock + transaction + CAS/conditional counter. |
| Đạt khả năng phục hồi | Outbox, idempotent workers, expiry sweeper DB có thể chạy nhiều replica; reconciliation. |
| Tối ưu trải nghiệm | Cache read-only slot availability và WS/SSE sau commit; client luôn xác nhận bằng API. |
| Tối ưu khi có bằng chứng tải | Benchmark DB-only; chỉ sau đó thử Redis lock như một biến độc lập. |

Ma trận kiểm thử: [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md). Các quy tắc chưa chốt: [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md#4-invariants-và-chính-sách-cần-xác-nhận).
