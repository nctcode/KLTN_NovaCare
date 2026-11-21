# Đánh giá mức độ sẵn sàng triển khai

**Trạng thái:** ĐÁNH GIÁ TĨNH — chưa sửa source, chưa chạy migration/database command, chưa triển khai hoặc kiểm thử giải pháp.  
**Kết luận:** **Chưa sẵn sàng triển khai thay đổi nghiệp vụ/schema lên luồng booking.** Có thể bắt đầu chuẩn bị không thay đổi hành vi (pin snapshot, kiểm kê dữ liệu, xác minh provider/worker) và xin phê duyệt policy.  
**Căn cứ:** bảy tài liệu thiết kế/chính sách được liệt kê ở cuối; source NovaCare trong working tree hiện tại.  
**Giới hạn snapshot:** working tree có thay đổi chưa commit trong các file admin/hospital-admin và migration. Nhận định source là về snapshot đã đọc, không khẳng định trạng thái production. Phải chốt commit baseline và xem diff các file liên quan trước khi dùng kết quả làm kế hoạch migration.

## 1. Kết luận điều hành

Kiến trúc kỹ thuật cấp cao đã có hướng nhất quán: giữ PostgreSQL làm authority; dùng transaction, khóa slot theo thứ tự, conditional update/CAS; chuyển writers về một command path nội bộ; xử lý multi-slot cùng transaction; chỉ dùng Redis/queue/realtime làm thành phần phụ trợ.

Tuy vậy, các tài liệu [BUSINESS_RULES_DECISIONS.md](./BUSINESS_RULES_DECISIONS.md) và [APPROVED_BOOKING_POLICY_DRAFT.md](./APPROVED_BOOKING_POLICY_DRAFT.md) đều ghi rõ **chưa được phê duyệt**. Không có bằng chứng về phê duyệt riêng của chủ dự án cho D1–D10. Do đó chưa thể đóng băng:

- predicate xác định reservation nào chiếm capacity;
- thời hạn/biên hết hold và xử lý payment `PROCESSING`;
- hủy, hoàn tất, no-show, refund;
- callback đến muộn và response IPN;
- overlap bệnh nhân;
- giảm capacity/block slot đã có reservation.

Đây là blocker cho semantics, data backfill, DB constraints và correctness oracle. Không nên thêm enum, CHECK constraint hoặc backfill occupancy trước khi các mục này được duyệt.

## 2. Trạng thái quyết định nghiệp vụ

### Đã xác nhận

**Không tìm thấy quyết định nghiệp vụ D1–D10 nào được ghi là đã phê duyệt** trong bảy tài liệu được đọc. Những nội dung sau chỉ là sự kiện kỹ thuật đã thấy trong source, không phải approval:

- `create()` đặt trạng thái `AWAITING_PAYMENT`, tăng bộ đếm trong transaction và đặt `expiresAt` sau 15 phút.
- Patient cancel có giới hạn 2 giờ đối với một số trạng thái.
- Reschedule hiện cho `CONFIRMED`/`PAID`.
- Một số luồng cập nhật dùng transaction, row lock hoặc compare-and-set.

### Chưa xác nhận — tất cả D1–D10

| ID | Nội dung cần duyệt | Vì sao chặn triển khai |
|---|---|---|
| D1 | Mapping toàn bộ `AppointmentStatus` sang reservation lifecycle; `COMPLETED`/`NO_SHOW` khi nào ngừng chiếm chỗ. | Không xác định được occupancy oracle, backfill, hay thời điểm decrement. |
| D2 | TTL hold, thời điểm bắt đầu, expiry boundary (`<` hay `<=`), grace period/gia hạn, xử lý `PROCESSING`. | Không thể viết điều kiện thống nhất cho create/payment/expiry hoặc test boundary. |
| D3 | Deadline hủy, unpaid exception, role override, hủy sau tiếp nhận, phí/refund. | Các kênh hiện áp dụng quy tắc khác nhau. |
| D4 | Reschedule paid, thay đổi giá/dịch vụ/thời lượng/phòng, giới hạn thời gian. | Ảnh hưởng status/payment và tập slot cần claim. |
| D5 | Granularity, thời lượng, capacity khác nhau giữa các slot, xử lý cửa sổ thiếu slot/room session. | Không thể xác định tập membership hợp lệ và expected result. |
| D6 | Thời điểm thanh toán có thẩm quyền, callback muộn, re-claim, ưu tiên khi slot đã bán lại, response IPN. | Tránh ghi nhận `PAID` nhưng không cấp được lịch; quyết định acknowledgment/retry của provider. |
| D7 | Auto-refund/manual review, full/partial, SLA, quyền duyệt và lỗi provider. | Chưa có contract xử lý tiền đã thu khi booking không thể cấp. |
| D8 | Overlap theo patient profile hay user; hold có block lịch khác; override. | Chưa xác định cách serialize hoặc oracle xung đột bệnh nhân. |
| D9 | Giảm capacity dưới occupancy, block/disable slot đã đặt, ưu tiên/chuyển lịch. | Có thể làm capacity thấp hơn số reservation hiện hữu hoặc làm mất cam kết với bệnh nhân. |
| D10 | `bookedCount` là active occupancy hay số tích lũy; consume/no-show timing. | Ảnh hưởng tất cả counter logic, backfill và CHECK constraints. |

`D11` trong decision record là lựa chọn schema/owner quyết định (có cần lifecycle, event ledger, outbox, idempotency metadata hay không); cũng chưa xác nhận. “Reservation lifecycle” là khái niệm được đề xuất, chưa phải enum hiện có hoặc schema đã duyệt.

## 3. Mapping endpoint/service sang command path dự kiến

`BookingCommandService` trong các tài liệu là **service nội bộ trong backend**, không mặc định là microservice hoặc API mới. Bảng dưới đây chỉ định tuyến trách nhiệm tương lai; chưa triển khai.

| API/service hiện tại | Chức năng hiện tại | Vấn đề đã xác minh trong tài liệu/source | Command/component dự kiến | Thay đổi cần thiết |
|---|---|---|---|---|
| `POST /api/v1/appointments` → `AppointmentsService.create()` | Tạo `AWAITING_PAYMENT`; kiểm slot, lock các candidate slots, tạo junction và tăng count trong transaction. | Đây là luồng có row lock/capacity recheck tốt nhất. Idempotency lookup ở ngoài transaction; profile overlap query không serialize; khóa primary trước rồi khóa candidate set cần xem lại về thứ tự toàn cục/deadlock. | `createBooking(command, actor)` | Giữ URL/DTO trước mắt; chuẩn hóa idempotency replay, khóa toàn bộ tập slot theo thứ tự chung, kiểm tra sau khóa, transaction hóa history/outbox nếu dùng. D8 quyết định có profile lock hay không. |
| `PATCH /api/v1/appointments/:id/reschedule` → `AppointmentsService.reschedule()` | Đổi primary slot và cập nhật count old/new. | Check slot mới ở ngoài transaction; không có capacity guard trong transaction; không cập nhật `AppointmentSlotBooking`; multi-slot có thể lệch. | `rescheduleBooking(command, actor)` | Khóa appointment rồi hợp tập old/new slots; claim đủ target trước khi release; cập nhật junction, primary reference và count theo chênh lệch cùng transaction. D4/D5 quyết định phạm vi. |
| `PATCH /api/v1/appointments/:id/cancel` → `AppointmentsService.cancel()` | Patient cancel; ghi `CANCELLED`; giải phóng junction nếu có. | Status update không CAS; đọc count rồi ghi giá trị tuyệt đối; chính sách 2 giờ và encounter check nằm riêng; cần đảm bảo các slot release một lần. | `cancelBooking(command, actor)` | Chuyển reservation bằng CAS/idempotent transition; release toàn bộ membership/counter nguyên tử; audit actor/reason; refund sau commit theo D3/D7. |
| `PATCH /api/v1/appointments/:id/confirm` → `AppointmentsService.confirm()` | Chuyển `AWAITING_PAYMENT` sang `CONFIRMED`. | Controller đánh dấu `@Public`; service không kiểm payment row/expiry trong đoạn đã đọc. | `confirmBooking(command, source)` hoặc giữ/bỏ route theo policy | Quy định quyền gọi và điều kiện xác nhận; nếu giữ, mọi transition phải dùng state machine chung. Không mặc định confirm đồng nghĩa đã thu tiền. |
| `POST /api/v1/appointments/expire-pending` → `expirePendingAppointments()` | Sweep `AWAITING_PAYMENT` quá hạn, đặt `EXPIRED`, giảm count slot chính. | Không CAS trạng thái sau lần đọc danh sách; có thể xử lý trùng; chỉ giảm primary slot; trigger/scheduler thật chưa xác minh. | `expireDueReservations(batch)` | Gọi từ sweeper/worker được xác minh; reread/CAS trong transaction; release toàn bộ memberships; retry-safe. Cần xác định endpoint có còn cần và quyền bảo vệ. |
| `POST /api/v1/payments/create` → `PaymentsService.createPaymentUrl()` | Tạo URL, upsert `PaymentTransaction`; chấp nhận appointment `PENDING`/`AWAITING_PAYMENT`. | Đoạn đã đọc chưa đối chiếu sở hữu appointment/reservation expiry đầy đủ; payment attempt và hold lifecycle chưa được tách rõ. | `validatePaymentAttempt()` + payment adapter | Không thay occupancy khi tạo URL; xác minh actor/appointment/reservation theo policy và idempotency payment attempt. |
| VNPay `GET/POST /api/v1/payments/vnpay-ipn` → `PaymentsService.handleIpn()` | Xác minh chữ ký; cập nhật payment; callback success đổi appointment sang `PAID`. | Kiểm tra PAID trước transaction; không đọc lại trạng thái/expiry/capacity trong transaction trước update; event id/amount/currency/time semantics cần xác minh. | `applyPaymentEvent(event)` | Adapter xác minh theo provider contract; transaction lock appointment/slots; dedupe; áp dụng D6/D7; chỉ tạo side effects sau commit. |
| `POST /api/v1/payments/simulate-success` → `simulatePaymentSuccess()` | Đường mô phỏng public ghi payment/appointment PAID. | Không gate theo hold/expiry trong đoạn đã đọc; có thể bỏ qua policy của callback thật. | Payment test/demo adapter gọi cùng transition | Quy định môi trường, authorization và disable production; không để simulator tạo đường ghi trạng thái riêng. |
| `PATCH /api/v1/admin/appointments/:id/status` → `AdminAppointmentsService.updateStatus()` | Admin cập nhật trạng thái tổng quát. | Nhánh status update đổi appointment status nhưng không release counter trong đoạn đã đọc; file có thay đổi chưa commit. | `changeAppointmentState(command, adminActor)` | Whitelist transitions; các trạng thái ảnh hưởng occupancy đi qua cancel/consume/restore command; bảo toàn scope, audit/history. |
| `PATCH /api/v1/hospital-admin/appointments/:id/status` → `HospitalAdminService.updateAppointmentStatus()` | Hospital-admin cập nhật trạng thái; CANCELLED có CAS và decrement. | Nhánh cancel chỉ cập nhật slot chính; file có thay đổi chưa commit. | `changeAppointmentState(command, hospitalActor)` | Giữ kiểm tra hospital scope; release tất cả junction qua command; ghi actor/reason và transaction nhất quán. |
| `PATCH /api/v1/appointments/:id/complete` → `AppointmentsService.complete()` | Đặt `COMPLETED`, tạo medical encounter. | Không decrement counter trong đoạn đọc; D10 chưa quyết định consume. | `completeBooking(command, actor)` | Clinical effects và occupancy transition phải theo D1/D10; không release nếu policy chưa được duyệt. |
| Admin NO_SHOW / revert NO_SHOW | Ghi `NO_SHOW`, có thể revert sang `PAID`/`CONFIRMED`. | Occupancy không có một transition nhất quán; revert cần reservation còn hiệu lực hoặc re-claim theo policy. | `changeAppointmentState()` / `restoreNoShow()` | Định nghĩa NO_SHOW terminal/grace và kiểm tra reservation trước khi khôi phục. |
| `PATCH /api/v1/appointment-slots/:id` → `AppointmentSlotsService.updateSlot()` | Sửa capacity, availability, active flag. | Check rồi update không cùng khóa/transaction; không luôn resolve `SlotStatus`; đọc public lọc boolean nhưng create còn kiểm enum. | `updateSlotPolicy(command, actor)` | Khóa slot, kiểm tra occupancy, dùng một availability resolver; quyết định D9 trước khi cho giảm/block. |
| `AppointmentSlotsService.updateBookedCount()` | Đọc count hiện tại, tính và ghi absolute value. | Có thể lost update nếu được gọi đồng thời; chưa xác định call site trong API khảo sát. | Internal `claimSlots` / `releaseSlots` duy nhất | Tìm toàn bộ call sites trước cutover; không cho endpoint/service khác ghi count độc lập. |
| `GET /api/v1/appointment-slots/available` | Đọc danh sách slot khả dụng. | Lọc `isAvailable`, `isActive`, count; không filter `SlotStatus` trực tiếp như create. Snapshot không giữ chỗ. | `AvailabilityQueryService` (read path) | Dùng cùng eligibility predicate; vẫn yêu cầu claim qua command và xử lý conflict khi dữ liệu thay đổi. |

Source anchors để kiểm tra các luồng trong bảng: [appointments.service.ts create/confirm/cancel/reschedule/expiry/complete](./nova-care-backend/src/modules/appointments/appointments.service.ts#L26), [payments.service.ts](./nova-care-backend/src/modules/payments/payments.service.ts#L17), [admin-appointments.service.ts](./nova-care-backend/src/modules/admin/admin-appointments.service.ts#L427), [hospital-admin.service.ts](./nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L527), [appointment-slots.service.ts](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L263), [schema.prisma enums and booking models](./nova-care-backend/prisma/schema.prisma#L26). Endpoint declarations are in [appointments.controller.ts](./nova-care-backend/src/modules/appointments/appointments.controller.ts#L24), [payments.controller.ts](./nova-care-backend/src/modules/payments/payments.controller.ts#L34), [admin-appointments.controller.ts](./nova-care-backend/src/modules/admin/admin-appointments.controller.ts#L98), [hospital-admin.controller.ts](./nova-care-backend/src/modules/hospital-admin/hospital-admin.controller.ts#L143), and [appointment-slots.controller.ts](./nova-care-backend/src/modules/appointment-slots/appointment-slots.controller.ts#L81). These are source anchors, not assertions about production deployment.

Các luồng web/mobile hiện gọi chung API; giữ nguyên route/response trong giai đoạn chuyển đổi là lựa chọn tương thích, không phải yêu cầu bất biến. Cần xem version/API consumers trước khi đổi DTO, status code hoặc authentication.

## 4. Đánh giá thiết kế database

Phân loại: **Bắt buộc về hành vi** nghĩa là cần có khả năng nghiệp vụ/đảm bảo đó; không nhất thiết đồng nghĩa phải tạo bảng mới. “Tùy chọn” phụ thuộc yêu cầu độ bền/vận hành. “Cần xác minh” nghĩa là chọn schema sau data/provider/consumer inventory.

| Thành phần | Hiện có | Mức cần thiết | Khuyến nghị và điều kiện |
|---|---|---|---|
| Reservation lifecycle | Chưa có lifecycle riêng trong `Appointment`; các status enum tồn tại nhưng mapping occupancy không nhất quán. | **Bắt buộc về hành vi; cách lưu cần xác minh.** | Cần một lifecycle/predicate duy nhất sau khi D1/D2/D10 được duyệt. Có thể lưu bằng cột trên Appointment, bảng reservation riêng, hoặc transition ledger; không mặc định phải tạo enum hoặc bảng mới. Chọn theo yêu cầu audit, retry, legacy backfill và một appointment–một reservation hay không. |
| `AppointmentSlotBooking` | Đã có bảng junction unique `(appointmentId, slotId)`, index `slotId`; create multi-slot đang dùng. | **Bắt buộc tái sử dụng cho multi-slot; bảng mới không cần theo thiết kế hiện tại.** | Inventory và reconciliation membership trước cutover; sửa command writers để create/reschedule/cancel/expiry/admin đồng bộ membership và primary `slotId`. Chỉ thay schema nếu yêu cầu lịch sử release/partial occupancy không thể biểu diễn bằng junction hiện có. |
| Idempotency | `Appointment.idempotencyKey` nullable unique; có lookup ở create. | **Bắt buộc về hành vi cho retry-safe commands; bổ sung schema cần xác minh.** | Dùng key hiện có trước nếu đáp ứng replay; kiểm tra key scope, payload mismatch, actor ownership và race unique. Payload hash/actor scope/bảng `IdempotencyRequest` chỉ thêm nếu hợp đồng yêu cầu. Payment event idempotency cần đánh giá riêng. |
| Payment event | `PaymentTransaction` unique theo appointment và transactionCode; có response fields/callbackData, không thấy event ledger riêng. | **Idempotent payment transition bắt buộc; event table tùy contract/provider.** | Xác minh VNPay event/transaction identity, settlement timestamp, retry, amount/currency. Có thể CAS/transaction trên payment row hiện tại đủ cho callback một logical transaction; thêm bảng event nếu cần lưu nhiều event, dedupe từng event, audit/refund/reconciliation. Không lưu raw callback nhạy cảm nếu không cần. |
| Outbox | Không thấy outbox đặt lịch trong source; QueueModule wiring chưa xác minh. | **Không bắt buộc cho core occupancy transaction; tùy chọn/được khuyến nghị cho side effects bền vững.** | Nếu email, refund, integration hoặc realtime phải được giao bền vững sau commit, dùng outbox; nếu chưa yêu cầu, có thể triển khai occupancy trước với side effects ngoài transaction và ghi rõ failure mode. Không tạo bảng chỉ vì queue dependency đã có. |
| Audit/history | `AppointmentStatusHistory` có sẵn; có `AuditLog` model/service và một số admin actions ghi log. | **History transition bắt buộc; bảng mới tùy chọn.** | Tái sử dụng history cho trạng thái appointment; xác minh cần bổ sung reservation lifecycle, actor, reason, idempotency/event reference và slot-set changes. `AuditLog`/history hiện có có thể không đủ thông tin occupancy; mở rộng hiện có trước khi tạo audit table mới. |
| Counter constraints/indexes | `capacity`, `bookedCount`, `version`; không xác minh được CHECK `0 <= count <= capacity` trong schema/migration đã khảo sát. | **Kiểm soát invariant bắt buộc; constraint migration chỉ sau reconcile.** | Trước hết xác định `bookedCount` semantics, tính lại drift và xử lý dữ liệu. CHECK constraint/index expiry là ứng viên sau khi xác minh dữ liệu/query plan; không chạy trước policy/backfill. |
| Refund/manual-review ledger | Payment/appointment enum có `REFUNDED`; chưa thấy workflow đầy đủ. | **Phụ thuộc D7; ledger bền vững cần thiết nếu quyết định workflow durable/auditable.** | Xác minh yêu cầu pháp lý/vận hành/provider trước khi chọn fields/table; không xem enum `REFUNDED` là ledger đầy đủ. |

**Kết luận DB:** trước hết phải chốt state semantics và đối soát dữ liệu. Có thể không cần bảng `AppointmentSlotBooking` mới, không nhất thiết cần bảng idempotency riêng, payment-event riêng hay outbox cho mọi bản triển khai. Không thêm mọi bảng được nêu trong design notes một cách mặc định.

## 5. Thứ tự triển khai và dependency giữa công việc

Không bắt đầu schema cutover trước khi hoàn thành các prerequisite nghiệp vụ và data inventory.

| Thứ tự | Công việc | Dependency / điều kiện vào | Kết quả cần có |
|---:|---|---|---|
| 0 | Pin baseline: chọn commit/source snapshot; phân loại thay đổi chưa commit; xác minh deploy version, API consumers, Postgres/Prisma version. | Không có. | Baseline tái lập được và danh sách file đang dirty được chấp nhận. |
| 1 | Phê duyệt D1–D10 và D11; hoàn thành state transition table, callback/refund contract, hủy/overlap/slot policy. | Bước 0. | Quy tắc nghiệp vụ có owner, ngày duyệt, ngoại lệ rõ. |
| 2 | Kiểm kê dữ liệu hiện có: AppointmentStatus, PaymentStatus, `slotId`, junction, capacity/count, expiry, payment/callbacks, audit/history. Chạy chỉ đọc trong giai đoạn chuẩn bị. | Bước 1 để tính occupancy đúng; có thể lập kế hoạch query trước. | Mismatch report; số bản ghi không xác định được; migration/backfill decision. |
| 3 | Chốt logical model và schema tối thiểu: lifecycle representation, membership, idempotency, payment events, outbox, audit fields. | Bước 1–2. | Data model/ERD, nullable/default/backfill/rollback strategy. |
| 4 | Định nghĩa API transition contracts/error codes và authorization cho từng writer; quyết định giữ route/DTO hiện tại. | Bước 1 và 3. | Contract cho create/reschedule/cancel/expiry/payment/admin/slot policy. |
| 5 | Thiết kế migration expand/backfill/reconciliation/rollback; kiểm tra indexes, constraint rollout và lock duration trên clone. | Bước 2–3. | Plan được DB owner duyệt; chưa áp dụng production. |
| 6 | Xây `BookingCommandService` core + transaction/locking/CAS + state machine; test unit/transaction contract. | Bước 1, 3, 4. | Một đường ghi booking/occupancy; chưa bật mọi writer. |
| 7 | Chuyển writers theo dependency: create → reschedule → patient/admin/hospital cancel/status/complete → expiry → payment/IPN/simulator → slot capacity/block. | Bước 6; thứ tự cần rollout strategy vì mọi writer cùng chia sẻ counter. | Không còn direct occupancy writes; audit/authorization giữ nguyên. Có thể dùng adapter/feature gate nếu cần coexistence tạm thời. |
| 8 | Deploy migration expand/backfill ở môi trường test; shadow reconciliation; verify legacy records và rollback. | Bước 5–7. | Sai lệch đã giải thích/khắc phục theo phê duyệt; không tự sửa ambiguity. |
| 9 | Chạy concurrency/correctness suite E1–E15 trên PostgreSQL thật và failure injection; hiệu chỉnh test oracle theo policy đã duyệt. | Tất cả writer đã chuyển; truth table đã duyệt; schema fixture ổn định. | Không overbook/double-release/partial multi-slot theo tiêu chí; lỗi/retry được phân loại. |
| 10 | Cutover theo feature flag/endpoint rollout; theo dõi metrics và reconciliation; bật CHECK constraints sau khi dữ liệu sạch. | Bước 8–9, sign-off owner. | Rollout/rollback runbook, dashboard/alert, constraint gate. |
| 11 | Outbox/queue/realtime và performance benchmark, nếu được yêu cầu. Redis lock chỉ nếu có số đo làm rõ nhu cầu. | Core correctness đạt; side-effect SLA được chốt. | Thử nghiệm tách biến, chưa gộp thành yêu cầu core booking. |

**Dependency bắt buộc:** D1/D10 → occupancy oracle và lifecycle → backfill/CHECK; D2/D6 → expiry/payment transition; D4/D5 → junction migration/reconciliation; D3/D7 → cancel/refund workflow; D8 → patient serialization; D9 → slot update transaction; toàn bộ writer mapping → correctness suite/cutover.

## 6. Rủi ro migration, dữ liệu cũ và API compatibility

### Dữ liệu và migration

- **Counter drift:** không thể tin `bookedCount` làm ground truth cho backfill trước khi so với appointment/reservation state và slot junction.
- **Legacy multi-slot:** create ghi `AppointmentSlotBooking`, nhưng source hiện tại reschedule đổi primary `slotId` mà không cập nhật junction; expiry/hospital-admin cancel chỉ decrement primary slot. Dữ liệu đã phát sinh có thể mang junction cũ hoặc count sai. Không tự suy ra slot đúng từ primary reference duy nhất.
- **Status không đủ để tái dựng reservation:** payment `PAID` có thể đi kèm appointment đã `EXPIRED`/`CANCELLED`; `NO_SHOW`, `FAILED`, `REFUNDED` không có mapping occupancy được xác nhận.
- **Hold quá hạn:** chưa xác minh sweep/worker production; có thể tồn tại `AWAITING_PAYMENT` cũ đã quá `expiresAt` nhưng counter chưa release.
- **CHECK constraint:** bật trước reconcile có thể fail do dữ liệu cũ; nếu semantics count thay đổi, constraint đúng về range nhưng vẫn không chứng minh count khớp membership.
- **DDL/Prisma enums:** thêm lifecycle enum/column/table có thể yêu cầu expand-first, ứng dụng tương thích schema cũ/mới, backfill theo batch và rollback không xóa lịch sử. Không đổi/drop enum trước khi consumer inventory hoàn thành.
- **Changed working tree:** các migrations và admin/hospital services đang dirty. Không dựa trên migration ordering hoặc source behavior chưa được chủ repository xác nhận.

### Tương thích API

- Các client web/mobile hiện gọi route chung; giữ route và response hiện có, rồi chuyển nội bộ sang command service là lộ trình ít ảnh hưởng nhất. Nhưng lỗi race hiện có thể được biểu diễn khác nhau; thay bằng mã HTTP 409 ổn định cần rà soát client handling.
- Không đổi DTO idempotency, expiry fields, appointment status hoặc payment response cho tới khi inventory frontend/mobile/HIS consumers hoàn tất.
- `confirm` và các payment simulation/status endpoint có `@Public` trong controller được khảo sát; kiểm tra auth/security/deployment contract riêng, tránh command service làm mất scope/actor context.
- Endpoint expiry hiện nằm trong appointments controller có JWT guard ở cấp controller nhưng không thấy role check tại method trong đoạn khảo sát; nếu đổi thành worker-only, rà soát caller/scheduler trước khi vô hiệu hóa route.
- WebSocket/SSE chưa phải API hiện có cho booking; đây là optional contract mới, không nên đưa vào compatibility blocker của core booking.

## 7. Rủi ro và blocker readiness

| Mức | Rủi ro/blocker | Điều kiện tháo gỡ |
|---|---|---|
| **Blocker** | Không có D1–D10 được phê duyệt; status-to-capacity/late payment chưa chốt. | Phê duyệt bằng văn bản state table và policy. |
| **Blocker** | Snapshot source dirty; một số kết luận audit/design có thể khác file hiện tại/production. | Pin commit, review diffs, xác nhận deploy snapshot. |
| **Blocker** | Data baseline occupancy/junction chưa đối soát; reschedule legacy có junction mismatch. | Chạy inventory chỉ đọc trên DB clone/backup và phê duyệt cách xử lý record ambiguous. |
| **High** | Writer hiện phân tán giữa patient, admin, hospital, payment, expiry, slot update. | Chứng minh mapping/call-site audit bao phủ tất cả direct writes trước cutover. |
| **High** | Expiry worker/queue trigger và callback provider contract chưa xác minh. | Xác minh scheduler, số replicas, retry semantics, event ID/time/amount/response requirements. |
| **High** | Migration tùy chọn (lifecycle/outbox/payment ledger) chưa được thu hẹp. | Chốt logical model và chọn schema tối thiểu; không tạo toàn bộ bảng mặc định. |
| **Medium** | Test plan correctness oracle chưa thể hoàn thiện trước policy approval; V1/V2/V3 outbox setup chưa khóa. | Policy sign-off, cố định outbox trong so sánh hoặc thiết kế thí nghiệm riêng. |
| **Medium** | Redis/queue/realtime có dependency/config nhưng runtime wiring chưa chứng minh. | Xác minh deployment; không coi là blocker cho PostgreSQL-only correctness core. |

## 8. Tính nhất quán của bảy tài liệu

### Nhất quán

- Cả [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md), [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md), [TECHNOLOGY_COMPARISON.md](./TECHNOLOGY_COMPARISON.md), [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md), [RESEARCH_CONTRIBUTIONS.md](./RESEARCH_CONTRIBUTIONS.md), [BUSINESS_RULES_DECISIONS.md](./BUSINESS_RULES_DECISIONS.md) và [APPROVED_BOOKING_POLICY_DRAFT.md](./APPROVED_BOOKING_POLICY_DRAFT.md) đều xem các chính sách D1–D10 là chưa được duyệt; draft có tên “APPROVED” nhưng nội dung đầu tài liệu và mọi D đều ghi CHƯA ĐƯỢC PHÊ DUYỆT.
- Hướng kỹ thuật nhất quán: PostgreSQL authority; row lock + CAS/conditional update; một command path; transaction multi-slot; Redis lock không phải mặc định; không có benchmark result.
- Các tài liệu không yêu cầu mặc định phải tách microservice; BookingCommandService là service in-process.

### Mâu thuẫn/thiếu cần làm rõ trước code

1. **Hold equality:** source expiry dùng `< now`; conflict design đề nghị `<= now`; Business Rules có ghi khác biệt; policy draft nghiêng về `>=`. Chọn và duyệt một rule.
2. **Lifecycle vs appointment:** `HELD/BOOKED/RELEASED/CONSUMED` là mô hình đề xuất, nhưng mapping các enum còn một số nhánh “tùy/chưa chốt”. Không thể dùng test oracle hoặc backfill cho đến khi mapping hoàn tất.
3. **Reservation physical schema:** một số tài liệu nói thêm lifecycle/reservation hoặc event ledger; tài liệu khác cho phép transition policy trên appointment + junction. Đây là lựa chọn schema còn mở, không phải mâu thuẫn nghiệp vụ. Cần chọn mô hình tối thiểu sau inventory.
4. **Outbox:** kiến trúc/technology khuyến nghị outbox; test variants chưa cố định outbox có mặt giống nhau ở mọi variant. Nếu benchmark correctness, cố định side effects/outbox để chỉ thay biến concurrency; event latency cần experiment riêng.
5. **Expiry trigger:** có cả DB sweeper và delayed queue, nhưng trigger/backup chưa chốt. Không để queue là authority; chọn một sweeper an toàn làm source of work và quy định vai trò queue.
6. **Payment callback ACK:** cần xác định response cho callback hợp lệ đã thu tiền nhưng không cấp được slot; các tài liệu hiện để owner/provider xác nhận.
7. **Multi-slot experiments:** E3 bao phủ create; cần đảm bảo E5/E6/E8/E9 kiểm đầy đủ membership sau reschedule, cancellation quản trị và expiry, như Business Rules phát hiện.
8. **Operational source version:** audit và policy lưu ý working tree dirty; chưa có snapshot baseline duy nhất được mọi tài liệu chốt.

**Không xem là mâu thuẫn:** outbox là lựa chọn kiến trúc được khuyến nghị nhưng không bắt buộc cho transaction occupancy; đó là quyết định scope/reliability còn mở. Tương tự, `AppointmentSlotBooking` đã có nên “multi-slot bắt buộc” không đồng nghĩa “phải tạo bảng junction mới”.

## 9. Checklist trước khi cho phép sửa code

### Governance / nghiệp vụ

- [ ] Pin commit/source snapshot và xác nhận các file dirty/backend migration đã được review.
- [ ] D1–D10 có owner và phê duyệt; mọi ngoại lệ/role được ghi rõ.
- [ ] Có truth table hoàn chỉnh cho `AppointmentStatus` × `PaymentStatus` × reservation lifecycle.
- [ ] Chốt hold TTL, thời điểm bắt đầu, equality/grace, payment processing, expiry trigger.
- [ ] Chốt late payment: timestamp, re-claim, slot đã bán lại, refund/manual review, response IPN.
- [ ] Chốt cancellation/reschedule/complete/no-show/overlap/capacity-block rules.

### Dữ liệu / database

- [ ] Đã kiểm tra appointment, status history, payment, primary slot, toàn bộ slot junction và counters trên snapshot an toàn.
- [ ] Đã định lượng mismatch/legacy/ambiguous records; có phê duyệt manual resolution/backfill.
- [ ] Đã chọn lifecycle storage và xác định có cần bảng/cột mới không.
- [ ] Đã xác định `AppointmentSlotBooking` được tái sử dụng; unique/index hiện có đáp ứng use cases.
- [ ] Đã chọn idempotency scope/payload behavior; xác minh provider event identity trước khi thêm event table.
- [ ] Outbox/refund ledger chỉ được đưa vào schema nếu reliability/operations contract yêu cầu.
- [ ] DDL expand/backfill/constraint/rollback được DB owner duyệt; chưa bật CHECK trước reconciliation.

### Thiết kế/API và triển khai

- [ ] Endpoint/service mapping bao phủ mọi writer; code search xác nhận không còn direct `bookedCount` mutation ngoài command path.
- [ ] Xác định authorization cho public confirm, payment simulate, expiry endpoint và admin/hospital commands.
- [ ] Hợp đồng API/client (web, Android, admin, provider, scheduler) được rà soát; status/error/idempotency compatible.
- [ ] Thứ tự khóa, multi-slot set, retry code, isolation level, transaction timeout và deadlock policy được cụ thể hóa.
- [ ] Plan rollout theo pha bảo đảm writer cũ/mới không cùng cập nhật occupancy mà không phối hợp.
- [ ] Expiry worker/runtime wiring, queue/Redis usage và số replica đã xác minh trên deployment target.

### Kiểm chứng trước cutover

- [ ] Test oracle được tạo từ chính sách đã duyệt, không suy đoán status.
- [ ] Có integration/concurrency tests PostgreSQL cho E1–E15 và kiểm membership multi-slot.
- [ ] Có test callback trùng/muộn, expiry worker trùng, admin/patient cancellation race và rollback.
- [ ] Có reconciliation/metrics/alerts và runbook xử lý counter drift/payment review.
- [ ] Rollback application/schema không kích hoạt lại writer cũ gây occupancy drift.
- [ ] Correctness đạt trước benchmark; mọi performance claim chỉ dựa trên kết quả đo sau này.

## 10. Cổng readiness

| Hạng mục | Trạng thái |
|---|---|
| Hướng kiến trúc ở mức khái niệm | Có thể tiếp tục review; chưa phải triển khai đã xác minh |
| Quy tắc nghiệp vụ D1–D10 | **Chưa sẵn sàng — cần phê duyệt** |
| Logical/physical database model | **Chưa sẵn sàng — phụ thuộc policy và data inventory** |
| API/service mapping | Có bản mapping; cần xác minh toàn bộ call sites/consumer và source baseline |
| Migration/backfill plan | Có nhóm migration mô tả; **chưa đủ để chạy** |
| Correctness test plan | Có kịch bản; oracle phụ thuộc policy chưa duyệt |
| Benchmark/performance | Chưa chạy; không có kết quả |
| Code implementation | Chưa bắt đầu trong phạm vi đánh giá này |

## Tài liệu đã đối chiếu

- [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md)
- [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md)
- [TECHNOLOGY_COMPARISON.md](./TECHNOLOGY_COMPARISON.md)
- [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md)
- [RESEARCH_CONTRIBUTIONS.md](./RESEARCH_CONTRIBUTIONS.md)
- [BUSINESS_RULES_DECISIONS.md](./BUSINESS_RULES_DECISIONS.md)
- [APPROVED_BOOKING_POLICY_DRAFT.md](./APPROVED_BOOKING_POLICY_DRAFT.md)
