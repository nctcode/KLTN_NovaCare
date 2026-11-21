# Thiết kế cơ chế giải quyết tranh chấp suất khám

**Trạng thái:** thiết kế, chưa triển khai. Đọc cùng [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md) và [SYSTEM_ARCHITECTURE_AUDIT.md](./SYSTEM_ARCHITECTURE_AUDIT.md).

## 1. Phạm vi cơ chế

Một `BookingCommandService` trong backend điều phối mọi thay đổi ảnh hưởng occupancy: create, reschedule, cancel, expiry, payment-success/late-payment và admin cancellation. Controller chỉ xác thực/ủy quyền, chuẩn hóa command và gọi service. Không export helper để các module tự increment/decrement `bookedCount`.

Service không cần là distributed microservice: để chung process với API và dùng PostgreSQL transaction giảm số thành phần có thể lỗi. Các payment gateway, queue và realtime nằm ngoài transaction database.

## 2. Định nghĩa occupancy: tách khái niệm khỏi appointment status

Thiết kế cần một predicate duy nhất `consumesCapacity(appointment/reservation)`; không rải `notIn: [...]` khác nhau trong các query.

**Ứng viên khái niệm:** reservation được tạo ở `HELD`, chuyển thành `BOOKED` khi điều kiện xác nhận thanh toán/đặt khám đạt; transition cuối cùng là `RELEASED` khi hủy/thất bại/hết hạn hợp lệ hoặc `CONSUMED` sau khi kết thúc. `HELD` và `BOOKED` chiếm capacity; `RELEASED` không chiếm; `CONSUMED` cần được định nghĩa rõ là chiếm historical count nhưng không phải suất tương lai. Đây là mô hình đề xuất, không khẳng định tương đương enum hiện tại.

Giữ appointment status để phục vụ nghiệp vụ/giao diện; trạng thái reservation (có thể là cột/domain record mới) biểu diễn vòng đời occupancy. Nếu chưa thêm bảng, có thể khởi đầu bằng transition table tập trung và junction + count trong cùng transaction, nhưng cần migration/quy trình backfill để đảm bảo count khớp dữ liệu cũ.

## 3. Thứ tự khóa và transaction chung

### Quy tắc thứ tự

1. Với command hiện có appointment: khóa hàng appointment trước (`SELECT ... FOR UPDATE` hoặc CAS tương đương).
2. Đọc toàn bộ slot membership của appointment trong khi appointment đã khóa.
3. Tập hợp mọi slot liên quan (slot cũ, slot mới, tất cả slot multi-slot); khóa theo một thứ tự toàn cục cố định, ví dụ `(startTime, id)` tăng dần. Với cùng một tập slot, mọi đường command dùng cùng thứ tự.
4. Đọc lại appointment, slot, membership và capacity sau khi khóa; không dùng snapshot ngoài transaction làm căn cứ cập nhật.
5. Chỉ sau khi kiểm tra toàn bộ invariants mới ghi membership/counter/status/history/outbox; commit một lần.

Create chưa có appointment row để khóa: tính ứng viên slot, khóa toàn bộ tập slot theo thứ tự chung trong một query/chuỗi khóa, đọc lại và xác nhận cửa sổ liền kề. Sau khi xác nhận, insert appointment và membership rồi cập nhật count trong cùng transaction. Tránh khóa riêng primary slot trước rồi sau đó khóa phần còn lại theo thứ tự khác như hiện tại.

Mọi slot được điều chỉnh trong một transaction. Không gọi payment provider, Redis, queue, email hoặc websocket trong transaction đang giữ row locks.

### Guard cho counter

Row lock cung cấp serialization dễ hiểu; thêm conditional update để chống sai sót ở tầng ứng dụng:

```sql
UPDATE appointment_slots
SET "bookedCount" = "bookedCount" + 1,
    version = version + 1
WHERE id = $1
  AND "bookedCount" < capacity
  AND "isActive" = true
  AND status = 'AVAILABLE'
RETURNING id, "bookedCount", capacity, version;
```

Nếu số hàng trả về khác 1, cả reservation multi-slot phải rollback và trả conflict. Decrement dùng guard `bookedCount > 0`; nếu một slot không decrement được, rollback toàn transaction và báo invariant/data inconsistency, không tiếp tục với giá trị clamp thành 0. Tùy chính sách BLOCKED/FULL, logic `status` cần đồng bộ bằng một helper/policy sau counter update; không đặt `AVAILABLE` tuyệt đối khi còn block thủ công.

Counter vẫn là dữ liệu dẫn xuất. Nên có truy vấn đối soát để tính occupancy từ reservation/membership và cảnh báo sai khác. Có thể bắt đầu reconciliation ở chế độ chỉ đọc trước khi tự sửa dữ liệu.

## 4. Luồng lệnh

### Create

1. Xác thực profile ownership, service, workplace, trạng thái slot và idempotency key.
2. Trong transaction: nếu key đã hoàn thành, trả đúng kết quả đã lưu; nếu key đang được xử lý, chờ/đọc kết quả theo chính sách. Unique constraint là lớp chặn cuối.
3. Tìm cửa sổ N slot cần thiết cho duration; khóa tất cả slot theo thứ tự cố định; đọc lại và xác nhận liên tiếp, active, status cho phép và `count < capacity` trên từng slot.
4. Kiểm tra xung đột bệnh nhân dưới một chính sách đã chốt. Chỉ query overlap không khóa không đủ để ngăn hai lệnh cùng bệnh nhân ở các slot khác nhau; nếu phải bảo đảm, serialize theo patient profile (lock row profile) hoặc dùng ràng buộc/ledger phù hợp.
5. Tạo appointment/hold, `expiresAt`, toàn bộ membership, tăng counters guard từng slot, ghi history và outbox event. Mọi thay đổi commit hoặc rollback cùng nhau.
6. Commit; trả confirmation. Gửi thông báo/URL thanh toán sau commit.

### Reschedule

1. Khóa appointment; xác minh quyền, status có thể đổi và idempotency command.
2. Đọc toàn bộ slot cũ qua junction. Tính toàn bộ slot mới theo duration; khóa hợp của slot cũ + slot mới theo thứ tự chung.
3. Đọc lại availability và kiểm tra capacity của tập slot mới. Slot giao nhau giữa cũ/mới được tính theo occupancy hiện có của appointment: không tự giải phóng rồi để request khác chen vào.
4. Cập nhật slot membership, counters chỉ cho phần chênh lệch: `old \ new` decrement; `new \ old` guarded increment; `old ∩ new` giữ nguyên. Với thay đổi status/cost/payment, áp dụng chính sách reschedule đã xác nhận.
5. Cập nhật appointment/history/outbox trong cùng transaction. Nếu một slot mới không claim được, rollback hoàn toàn và giữ nguyên lịch cũ.

### Cancel từ patient/admin/hospital

1. Xác thực actor, quyền, điều kiện hủy và policy hoàn tiền ngoài phần occupancy.
2. Khóa appointment rồi các slot membership theo thứ tự cố định.
3. Chuyển trạng thái chỉ bằng compare-and-set từ trạng thái hiện đọc được sang trạng thái hủy. Nếu đã hủy/expired thì trả trạng thái cuối cùng mà không release lần nữa (idempotent); nếu state không cho phép, trả conflict/business error.
4. Chỉ khi reservation thực sự chuyển từ occupying sang released mới giảm count từng slot trong membership. Nếu membership không có dữ liệu theo schema legacy, dùng fallback đã kiểm toán và ghi metric/alert; không âm thầm coi chỉ primary slot là đủ.
5. Ghi history, audit actor, notification/outbox trong transaction. Chính sách refund/provider call xử lý sau commit qua outbox/idempotent job.

### Expiry

1. Scheduler/worker chọn các hold đến hạn theo batch. Có thể dùng `FOR UPDATE SKIP LOCKED` để các worker lấy các nhóm khác nhau; đây chỉ là phân phối việc, không thay transaction xác nhận.
2. Với từng appointment (hoặc batch nhỏ), khóa appointment; kiểm tra lại `status = AWAITING_PAYMENT`, `expiresAt <= now` và payment state chưa thành công. Candidate đọc trước không có giá trị quyết định.
3. Khóa mọi slot junction theo thứ tự cố định; CAS trạng thái reservation sang released/appointment sang expired; giảm từng slot đúng một lần.
4. Ghi history/outbox trong cùng transaction. Nếu payment đã thắng lock/transition, expiry thành no-op. Nếu expiry thắng, payment callback đi qua quy tắc callback muộn.
5. Job lặp hoặc at-least-once không gây double release nhờ transition CAS và idempotency.

### Payment IPN/callback

1. Ngoài transaction: xác thực chữ ký theo đặc tả nhà cung cấp, transaction reference, amount/currency và callback event. Lưu ý source hiện tại đã kiểm tra chữ ký, nhưng các kiểm tra còn lại phải xác minh/bổ sung theo đặc tả thực tế.
2. Transaction: khóa appointment trước, khóa slot membership có thứ tự, đọc payment/appointment state mới nhất; ghi payment event idempotently bằng provider event/transaction ID unique.
3. Chuyển appointment/reservation chỉ nếu trạng thái hiện tại và thời điểm thanh toán thỏa policy. Không chuyển một `EXPIRED`/`CANCELLED` thành `PAID` bằng update vô điều kiện.
4. Nếu callback trùng: trả response thành công/no-op nếu event đã được áp dụng, không ghi history hay phát notification lặp.
5. Ghi outbox cho receipt, cập nhật giao diện và refund/manual review; commit trước khi gọi hệ thống ngoài.

### Admin cập nhật trạng thái

Các trạng thái không ảnh hưởng occupancy (ví dụ note/check-in) có thể dùng service riêng, nhưng state transition nào có thể giải phóng hoặc giữ capacity phải gọi cùng transition API/domain method với patient cancel/expiry/payment. Không cho phép generic `updateStatus(status)` tự đổi status mà bỏ qua occupancy policy.

## 5. Deadlock, lỗi và retry

- Deadlock có thể xảy ra dù khóa theo quy ước nếu một luồng cũ còn dùng thứ tự khác; thứ tự toàn cục giảm nguy cơ chứ không chứng minh deadlock không thể xảy ra.
- Bắt retry có giới hạn cho SQLSTATE PostgreSQL `40P01` (deadlock detected) và `40001` (serialization failure nếu dùng SERIALIZABLE), với exponential backoff ngắn có jitter; mỗi lần retry chạy lại **toàn bộ** transaction và đọc/kiểm tra lại trạng thái.
- Không retry lỗi nghiệp vụ conflict, capacity, validation, authorization hoặc lỗi unique idempotency một cách mù quáng. Với unique idempotency, đọc lại kết quả đã commit theo key/actor/payload.
- Giới hạn transaction ngắn; không chờ queue/payment/network khi đang giữ lock.
- Ghi metric `booking_conflict`, `deadlock_retry`, `serialization_retry`, `idempotency_replay`, `counter_invariant_violation`, transaction duration và lock wait; không ghi dữ liệu bệnh nhân nhạy cảm vào log nghiên cứu.

## 6. Thanh toán callback muộn — cần xác nhận

Source hiện tạo hold 15 phút và IPN thành công cập nhật appointment sang `PAID` mà không đối chiếu trạng thái/expiry. Đây là chỗ cần chính sách được phê duyệt trước khi code.

**Chính sách ứng viên cần chủ nghiệp vụ xác nhận:**

- Dùng thời điểm thanh toán do provider xác thực (`paid_at`) thay vì thời gian IPN đến để phân biệt thanh toán thực hiện trước hay sau hạn; phải xác minh provider cung cấp timestamp đáng tin cậy.
- Callback được chấp nhận idempotently và xác thực đúng amount/currency/order.
- Nếu callback tới sau expiry nhưng reservation vẫn còn và chưa ai lấy slot, transaction có thể khôi phục reservation sau khi claim lại toàn bộ slot thành công.
- Nếu slot đã được cấp cho booking khác, không ép `PAID` gây overbooking; đánh dấu payment đã thu nhưng booking cần refund/manual review, phát outbox cho quy trình bù trừ.
- Nếu provider báo thanh toán sau hạn, mặc định không tự xác nhận lịch; refund hoặc chuyển xử lý thủ công theo policy.

Các lựa chọn có thể khác nhau về luật hợp đồng/hoàn tiền. Cần xác nhận grace period, ai chịu trách nhiệm refund, và response code IPN nào khiến provider ngừng retry.

## 7. Multi-slot và schema

- Mỗi appointment giữ toàn bộ slot trong `AppointmentSlotBooking`; `Appointment.slotId` chỉ là slot chính/đầu cửa sổ.
- Tạo: tất cả membership/counter increments commit nguyên tử.
- Hủy/expiry: duyệt toàn bộ junction, không chỉ `slotId`.
- Đổi lịch: membership biểu diễn tập slot mới sau commit; cập nhật chênh lệch old/new trong transaction; giữ lịch cũ nếu bất kỳ slot mới nào thất bại.
- Khuyến nghị bổ sung reservation lifecycle hoặc `releasedAt/releaseReason`/versioned hold record nếu cần kiểm toán chính xác; chọn một schema sau khi chốt semantics và cách backfill. Bảng junction hiện tại không có trạng thái release riêng.
- Thêm DB-level check `bookedCount >= 0` và `bookedCount <= capacity` nếu phù hợp với lịch sử count; lưu ý constraint không tự giải quyết double-release hay semantics trạng thái.
- Thay đổi `capacity` phải khóa slot và cấm capacity mới thấp hơn occupancy đang có, trừ khi có quy trình ngoại lệ được phê duyệt.

## 8. Outbox, queue và realtime

Trong transaction nghiệp vụ, thêm row outbox với event ID duy nhất, aggregate ID/version, event type và payload tối thiểu. Dispatcher đọc event chưa phát, publish sau commit, sau đó đánh dấu; nếu crash giữa publish và mark, consumer dedupe theo event ID. Không publish trước khi transaction commit.

Expiry có thể dùng một scheduler định kỳ DB làm nguồn chân lý và enqueue delayed job như tối ưu độ trễ. Cả hai đường gọi cùng expiry command idempotent. Nếu Redis/queue tạm ngừng, sweep DB vẫn xử lý được.

WebSocket/SSE chỉ phát `slot_availability_changed`/`appointment_status_changed` sau commit. Client nhận event để refresh; reconnect mất event phải khôi phục bằng REST snapshot/version. Không dùng socket message làm xác nhận suất.

## 9. Giao kèo phản hồi API

- Thành công create/reschedule: trả appointment, trạng thái reservation, expiry nếu là hold, và version/ETag tùy API.
- Hết suất hoặc race thua: HTTP 409, mã lỗi ổn định (`SLOT_FULL`, `SLOT_CHANGED`, `APPOINTMENT_STATE_CHANGED`), không trả thành công giả.
- Idempotency replay: trả cùng logical result với request ban đầu.
- Payment đã nhận nhưng không thể cấp suất: trả/ghi nhận trạng thái `PAYMENT_REVIEW` hoặc tương đương theo schema/policy; không gộp nó với booking đã xác nhận.

Chi tiết kịch bản xác nhận và kiểm thử: [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md).
