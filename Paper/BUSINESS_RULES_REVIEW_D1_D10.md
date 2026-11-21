# Rà soát Business Rules D1–D10 — NovaCare

**Mục tiêu:** chuẩn hóa các lựa chọn nghiệp vụ trước khi thiết kế dữ liệu hoặc triển khai xử lý occupancy.  
**Trạng thái:** phân tích và đề xuất; không phải phê duyệt nghiệp vụ. Không sửa source, không chạy migration và không truy cập/chỉnh database.  
**Source snapshot:** branch `develop`, HEAD `585dcd8db9d612b4d35d758fe7d285b4762298b6` cộng các thay đổi chưa commit. Các kết luận về code bên dưới áp dụng cho working tree đang khảo sát, không khẳng định production. `admin-appointments.controller.ts`, `admin-appointments.service.ts` và `hospital-admin.service.ts` đang modified; nơi hành vi khác `HEAD`, tài liệu nêu rõ.

## 1. Phạm vi và tài liệu đã đọc

Đã đọc sáu tài liệu bắt buộc:

1. [BASELINE_AND_OCCUPANCY_INVENTORY.md](./BASELINE_AND_OCCUPANCY_INVENTORY.md)
2. [BUSINESS_RULES_DECISIONS.md](./BUSINESS_RULES_DECISIONS.md)
3. [APPROVED_BOOKING_POLICY_DRAFT.md](./APPROVED_BOOKING_POLICY_DRAFT.md)
4. [IMPLEMENTATION_READINESS.md](./IMPLEMENTATION_READINESS.md)
5. [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md)
6. [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md)

Các tài liệu trên đều mô tả quyết định là **chưa được phê duyệt** hoặc để chờ xác nhận. Tên `APPROVED_BOOKING_POLICY_DRAFT.md` không phải bằng chứng phê duyệt; nội dung file tự ghi rõ “DỰ THẢO — CHƯA ĐƯỢC PHÊ DUYỆT”. Không tìm thấy biên bản hoặc dấu xác nhận nghiệp vụ D1–D10 trong sáu tài liệu.

Đã đối chiếu trực tiếp các luồng trong source:

- Tạo thông thường, cancel, reschedule, confirm, expiry, complete và mock/HIS completion trong [appointments.service.ts](./nova-care-backend/src/modules/appointments/appointments.service.ts#L26).
- Tạo lịch từ AI Pre-exam trong [pre-exam.service.ts](./nova-care-backend/src/modules/pre-exam/pre-exam.service.ts#L201).
- Payment URL, VNPay IPN và simulator trong [payments.service.ts](./nova-care-backend/src/modules/payments/payments.service.ts#L17).
- Admin status/revert no-show trong [admin-appointments.service.ts](./nova-care-backend/src/modules/admin/admin-appointments.service.ts#L360).
- Hospital-admin cancel/status/revert no-show trong [hospital-admin.service.ts](./nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L527).
- Admin refund trong [admin-payments.service.ts](./nova-care-backend/src/modules/admin/admin-payments.service.ts#L80).
- Capacity/status trong [appointment-slots.service.ts](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L263), room assignment trong [clinic-rooms.module.ts](./nova-care-backend/src/modules/schedules/clinic-rooms.module.ts#L44), schedule reconciliation trong [schedule-reconciliation.service.ts](./nova-care-backend/src/modules/schedules/schedule-reconciliation.service.ts#L15).
- Enum và model trong [schema.prisma](./nova-care-backend/prisma/schema.prisma#L26).

## 2. Tóm tắt baseline hiện tại

- Schema hiện có `AppointmentStatus`, `PaymentStatus`, `SlotStatus`; `Appointment` có primary `slotId`, `expiresAt`, nullable unique `idempotencyKey`; `AppointmentSlot` có `capacity`, `bookedCount`, `isAvailable`, `isActive`, `status`, `version`; `AppointmentSlotBooking` có unique `(appointmentId, slotId)`. Chưa có một lifecycle occupancy thống nhất được áp dụng bởi tất cả writer.
- Create thông thường là đường duy nhất trong source đã rà soát vừa khóa các slot trong transaction, kiểm tra capacity sau lock, tạo multi-slot junction và tăng counter.
- AI Pre-exam là một đường tạo lịch độc lập: check capacity trước transaction, sau đó tạo appointment và tăng count; không tạo `AppointmentSlotBooking`; hold được gán 30 phút thay vì 15 phút.
- Patient cancel, reschedule, expiry, payment/IPN, admin, hospital-admin và refund có các đường cập nhật state/count riêng. Một số luồng chỉ xử lý primary slot; membership/junction không được cập nhật hoặc xóa nhất quán.
- Working tree khác `HEAD`: controller admin đã bỏ `DELETE /api/v1/admin/appointments/:id`; service admin đã xóa `cancelAppointment()` khỏi working tree. Working tree hospital-admin bổ sung cancel có reason/CAS và decrement guarded nhưng vẫn giảm primary slot. Không được coi riêng một trong hai snapshot là production.
- Queue/expiry processor class tồn tại nhưng source/config đã rà soát chưa chứng minh BullMQ được wire, processor được gọi, hoặc cron/scheduler chạy. Runtime production chưa xác minh.
- Không có kết quả data inventory: SQL trong tài liệu baseline chỉ là truy vấn dự kiến, chưa chạy. Không thể kết luận có bao nhiêu counter/junction drift.

## 3. Phân tích chi tiết D1–D10

### D1 — Trạng thái nào chiếm suất? `bookedCount` nghĩa là gì?

**1. Vấn đề nghiệp vụ**  
Phải xác định một appointment đang giữ chỗ hay không; `bookedCount` đếm reservation tương lai đang chiếm sức chứa hay là tổng lịch sử; và những thời điểm nào làm tăng/giảm count.

**2. Hành vi hiện tại**

Enums được khai báo tại [schema.prisma](./nova-care-backend/prisma/schema.prisma#L26):

| `AppointmentStatus` | Hành vi thấy trong source hiện tại — không phải chính sách đã duyệt |
|---|---|
| `PENDING` | Create chính không tạo status này; payment URL và patient cancel có chấp nhận. Seed tạo `PENDING`. Không có quy tắc occupancy thống nhất. |
| `AWAITING_PAYMENT` | Create thông thường và AI Pre-exam tăng `bookedCount`; có `expiresAt`. |
| `CONFIRMED` | `confirm()` đổi status nhưng không đổi count; admin/hospital-admin có thể ghi status. |
| `PAID` | IPN/simulator đổi appointment thành `PAID` mà không đổi count; reschedule/cancel cho phép. |
| `COMPLETED` | Complete và mock/HIS flow đổi status; không giảm count trong các đoạn đã rà. |
| `CANCELLED` | Patient cancel giảm count theo junction/fallback primary; hospital-admin trong working tree chỉ giảm primary; admin generic status update không release count. |
| `EXPIRED` | Hai implementation expiry giảm primary slot; cách ghi count khác nhau; không đồng bộ membership. |
| `NO_SHOW` | Admin/hospital-admin có thể ghi nhận; không thấy release count; có luồng revert về `PAID`/`CONFIRMED`. |
| `FAILED` | Có enum; không thấy một transition appointment thống nhất với occupancy. Payment failure không tự đổi appointment thành `FAILED` trong IPN đã rà. |
| `REFUNDED` | Admin refund đặt Payment và Appointment thành `REFUNDED`; không thấy release count/membership ở refund flow. |

`PaymentStatus` gồm `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `REFUNDED`, `EXPIRED`; source payment flow đã rà ghi `PENDING`, `PAID`, `FAILED`, `REFUNDED`, nhưng không thấy dùng `PROCESSING`/`EXPIRED` ở các writer đó. `SlotStatus` gồm `AVAILABLE`, `FULL`, `BLOCKED`, `CONFLICTED`, `CANCELLED`; availability/read và create không dùng cùng một predicate hoàn toàn. `AppointmentSlotBooking` được tạo bởi create thông thường; cancel/expiry có thể đọc nhưng không xóa rows.

**3. Rủi ro**  
Không thể tính occupancy chính xác chỉ từ appointment status, payment status, junction row count hoặc counter riêng lẻ. Ví dụ counter có thể bị giữ sau cancel/complete, còn junction có thể lưu lịch sử sau khi release. Điều này làm capacity, availability, backfill và correctness oracle không xác định.

**4. Các phương án**

- **A.** Chọn một tập `AppointmentStatus` chiếm capacity. Dễ hiểu nếu vòng đời đơn giản; khó biểu diễn payment muộn/refund/no-show/terminal transitions, dễ tái tạo các query predicate khác nhau.
- **B.** Định nghĩa một reservation lifecycle tách khỏi Appointment/Payment, chẳng hạn `HELD`, `BOOKED`, `RELEASED`, `CONSUMED`; count là projection active. Tường minh hơn cho concurrency nhưng cần định nghĩa chuyển trạng thái và xác định cách lưu/đối soát.
- **C.** Không lưu counter, tính occupancy từ booking ledger. Tránh drift của projection nhưng tăng chi phí query/locking và yêu cầu ledger active đủ tin cậy.

**5. Đề xuất (chưa được duyệt)**  
Chọn **B về semantics**: chỉ reservation ở trạng thái đang giữ hoặc đã cấp suất mới chiếm capacity; `PaymentStatus` không tự claim/release. Định nghĩa `bookedCount` là **số reservation đang chiếm slot hiện tại**, không phải số lượt lịch sử; history/analytics là số liệu riêng. Không map enum AppointmentStatus nào sang lifecycle cho đến khi owner duyệt từng trường hợp.

**6. Tác động**  
Create/cancel/expiry/reschedule/admin/payment/complete đều cần cùng quy tắc transition; `AppointmentSlotBooking` là tập slot được giữ, không mặc nhiên là ledger active vì hiện không có release marker; `PaymentTransaction` giữ semantics tài chính độc lập. `COMPLETED`, `NO_SHOW`, `FAILED`, `REFUNDED`, `PENDING` cần quyết định riêng.

**7. Kiểm thử**  
Với từng status và cặp payment status, assert chính sách chiếm suất đã duyệt; chạy cancel/expiry/payment/admin transition cùng lúc; kiểm counter, mọi slot membership và trạng thái cuối sau commit/rollback. Không dùng raw junction count làm oracle trước khi thống nhất membership semantics.

**Trạng thái:** `PROPOSED` — có phương án khuyến nghị; mapping status và định nghĩa cuối cần owner xác nhận.

### D2 — Hold 15 hay 30 phút? Thời điểm và biên hết hạn

**1. Vấn đề nghiệp vụ**  
Chốt TTL duy nhất, thời điểm bắt đầu tính, equality tại `expiresAt`, grace/gia hạn, và ảnh hưởng của payment đang xử lý.

**2. Hành vi hiện tại**

- [AppointmentsService.create](./nova-care-backend/src/modules/appointments/appointments.service.ts#L26) đặt `expiresAt = Date.now() + 15 phút`; tạo hold và count trong transaction.
- [PreExamService.createAppointmentFromPreExam](./nova-care-backend/src/modules/pre-exam/pre-exam.service.ts#L201) đặt 30 phút và tăng count trong transaction sau khi đã precheck slot bên ngoài.
- Cả [AppointmentsService.expirePendingAppointments](./nova-care-backend/src/modules/appointments/appointments.service.ts#L770) và [ExpireAppointmentsProcessor.process](./nova-care-backend/src/queue/expire-appointments.processor.ts#L5) dùng điều kiện `expiresAt < now`, không phải `<=`.
- Chưa xác minh worker/scheduler production tự gọi expiry.

**3. Rủi ro**  
Hai kênh cấp thời hạn khác nhau; tại đúng thời điểm hết hạn hold chưa được chọn bởi `<`; payment, expiry và client có thể hiểu “còn hiệu lực” khác nhau; có thể payment URL được tạo khi hold đã gần/đã quá hạn.

**4. Các phương án**

- Một TTL cố định từ lúc hold commit; đơn giản và so sánh công bằng giữa các kênh.
- TTL bắt đầu từ lúc khởi tạo payment session; thuận tiện thanh toán nhưng có thể tạo hold lâu nếu payment URL bị trì hoãn/retry.
- TTL khác theo channel/service; linh hoạt nhưng làm policy và thực nghiệm phức tạp.
- Equality coi hết hạn tại `now >= expiresAt`, hoặc chỉ sau hạn `now > expiresAt`; cả hai cần boundary rule thống nhất. Có/không grace cho provider processing là lựa chọn bổ sung.

**5. Đề xuất (chưa được duyệt)**  
Dùng cùng một TTL cho mọi luồng tạo giữ suất, bắt đầu tại thời điểm commit hold; coi hết hạn khi `now >= expiresAt`; cùng predicate trong payment/callback và expiry. 15 phút là ứng viên sát với luồng thông thường, **không** phải lựa chọn đã duyệt. Chưa chọn TTL cuối cho đến khi phụ trách nghiệp vụ/thanh toán quyết định.

**6. Tác động**  
Appointment `expiresAt`; AppointmentStatus `AWAITING_PAYMENT`; PaymentStatus `PROCESSING`; counter/membership release; endpoint payment URL; expiry job/sweeper. Dữ liệu AI Pre-exam cần xem riêng khi backfill do TTL 30 phút hiện có.

**7. Kiểm thử**  
Test hai đường create dùng cùng policy; `t = expiresAt - 1ms`, `t = expiresAt`, `t = expiresAt + 1ms`; payment URL trước/sau hạn; callback và expiry xen kẽ; payment processing/grace; retry worker và scheduler ngoài hệ thống.

**Trạng thái:** `UNRESOLVED` — TTL source 15/30 phút và boundary `<`/`<=` mâu thuẫn; cần xác nhận business owner.

### D3 — Hủy lịch và thời điểm giải phóng capacity

**1. Vấn đề nghiệp vụ**  
Xác định ai được hủy trạng thái nào, deadline/ngoại lệ, encounter đã tiếp nhận, lý do/audit, refund tách biệt hay không và thời điểm release slot.

**2. Hành vi hiện tại**

- [AppointmentsService.cancel](./nova-care-backend/src/modules/appointments/appointments.service.ts#L546): patient có thể hủy `PENDING`, `AWAITING_PAYMENT`, `CONFIRMED`, `PAID`; ngoài `AWAITING_PAYMENT` yêu cầu trước giờ khám ít nhất 2 giờ; từ chối nếu encounter đã được tiếp nhận. Trong transaction đổi status, đọc junction (fallback primary nếu không có), decrement từng slot bằng read-then-write và clamp về 0; không xóa junction.
- [HospitalAdminService.updateAppointmentStatus](./nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L527) trong working tree yêu cầu lý do, có CAS trên status và decrement guarded chỉ cho `Appointment.slotId`; không duyệt multi-slot junction. Đây là diff chưa commit.
- [AdminAppointmentsService.updateStatus](./nova-care-backend/src/modules/admin/admin-appointments.service.ts#L427) cho phép status update tổng quát; nhánh CANCELLED không release count. Working tree xóa service `cancelAppointment()` và DELETE route admin; trong `HEAD` có route/service cũ để CANCELLED và decrement primary.
- Refund admin tách riêng ở [AdminPaymentsService.refund](./nova-care-backend/src/modules/admin/admin-payments.service.ts#L80).

**3. Rủi ro**  
Double release, lost update, count clamp che dữ liệu drift, admin channels trả kết quả khác nhau, multi-slot chỉ release một phần, và cancellation/refund status có thể không đồng bộ.

**4. Các phương án**

- Hủy tự do đến giờ hẹn; đơn giản cho bệnh nhân nhưng tăng chi phí đổi lịch phút chót.
- Deadline patient (ví dụ 2 giờ) và admin/hospital override có lý do; giữ gần policy hiện hành nhưng cần define quyền.
- Hủy không release ngay; giữ đến khi admin xử lý/refund; tránh tranh chấp tài chính nhưng chặn capacity không cần thiết.

**5. Đề xuất (chưa được duyệt)**  
Chỉ khi lệnh hủy hợp lệ chuyển một reservation đang chiếm sang trạng thái không chiếm thì release tất cả memberships đúng một lần trong cùng transaction. Dùng chung cho patient/admin/hospital; refund không chặn việc release. Giữ 2 giờ là đề xuất candidate cho patient; chưa áp dụng cho đến khi chốt status/role/deadline/encounter.

**6. Tác động**  
Appointment `CANCELLED` và `cancelledAt`; reservation occupancy; mọi `AppointmentSlotBooking`; `bookedCount` từng slot; `AppointmentStatusHistory`; refund/payment workflow và notification.

**7. Kiểm thử**  
Patient cancel theo từng status/deadline; admin/hospital hủy cùng appointment; 2 cancel đồng thời; cancel đối đầu expiry/payment/create; multi-slot cancel và membership sau commit; encounter active/cancelled; payment paid/refund pending.

**Trạng thái:** `PROPOSED` — nguyên tắc release một lần có đề xuất; deadline, quyền và điều kiện hủy còn cần phê duyệt.

### D4 — Reschedule: giữ suất cũ, lấy suất mới

**1. Vấn đề nghiệp vụ**  
Xác định eligibility, booking đã trả tiền, đổi dịch vụ/thời lượng/phòng/giá và đảm bảo bệnh nhân không mất lịch cũ khi target không còn chỗ.

**2. Hành vi hiện tại**

- [AppointmentsService.reschedule](./nova-care-backend/src/modules/appointments/appointments.service.ts#L662) chỉ cho `CONFIRMED`/`PAID`.
- Đọc target slot và check capacity/overlap ngoài transaction.
- Trong transaction decrement old primary, increment new primary, cập nhật `Appointment.slotId`; không cập nhật `AppointmentSlotBooking`, không thấy row lock/CAS/conditional capacity guard.

**3. Rủi ro**  
Race trên target, increment quá capacity, old/new count sai, junction không khớp primary reference; nếu dịch vụ nhiều slot thì tập target không được xác nhận đầy đủ.

**4. Các phương án**

- Hủy lịch cũ rồi tạo lịch mới: đơn giản nhưng có khoảng trống, lịch cũ có thể bị mất nếu target thất bại.
- Chuyển nguyên tử: kiểm/claim toàn bộ target trước khi release source; nếu không đủ capacity rollback.
- Cho phép đổi khi target không đủ bằng cách tự chọn cửa sổ thay thế: thuận tiện nhưng cần quy tắc chọn/đồng ý của bệnh nhân.

**5. Đề xuất (chưa được duyệt)**  
Chuyển nguyên tử: giữ reservation cũ đến khi toàn bộ target slot được xác nhận claimable; sau đó đổi toàn bộ tập membership/counter trong một transaction. Target thất bại thì lịch cũ còn nguyên. Giữ trạng thái payment là quyết định riêng, không suy ra từ việc đổi slot.

**6. Tác động**  
Appointment `slotId`/status/price; PaymentTransaction và fee/refund nếu giá đổi; tất cả old/new `AppointmentSlotBooking`; count mọi slot trong hai tập; audit/history.

**7. Kiểm thử**  
Đổi `CONFIRMED` và `PAID`; slot target cạnh tranh; một slot trong multi-slot target đầy; old/new window giao nhau; transaction rollback; concurrent double reschedule; giá/dịch vụ/phòng thay đổi; junction sau commit khớp target.

**Trạng thái:** `PROPOSED` — atomic target-first có đề xuất; eligibility, payment/fee và giới hạn thời gian cần xác nhận.

### D5 — Multi-slot và ý nghĩa `Appointment.slotId`

**1. Vấn đề nghiệp vụ**  
Chốt slot granularity, dịch vụ chiếm bao nhiêu slot liên tiếp, primary slot biểu diễn gì, capacity từng phần và quy tắc phòng/dịch vụ.

**2. Hành vi hiện tại**

- Create thông thường ở [AppointmentsService.create](./nova-care-backend/src/modules/appointments/appointments.service.ts#L26) lấy duration service (default 30 phút), xác định candidate liên tiếp trên logic slot 15 phút, lock/kiểm tra và tạo appointment; sau đó tạo junction và tăng count cho từng slot.
- AI Pre-exam tạo một appointment một primary slot và tăng count nhưng không tạo junction.
- Patient cancel dùng junction khi có, fallback về primary nếu không có; expiry/hospital-admin cancel chỉ decrement primary; reschedule đổi primary nhưng không đổi junction.
- `Appointment.slotId` là foreign key primary slot; `AppointmentSlotBooking` có thể chứa nhiều slot.
- ScheduleReconciliationService tạo slots theo bước 30 phút trong source hiện tại, trong khi create thông thường mô tả lưới 15 phút. Vì vậy không thể mặc định mọi runtime slot set đang là base 15 phút.

**3. Rủi ro**  
Các flow có thể release slot phụ sai/thiếu; primary slot có thể không biểu diễn toàn duration; AI Pre-exam tạo lịch không có junction; quy tắc duration/rounding không nhất quán giữa schedule generator và booking.

**4. Các phương án**

- Một appointment giữ một slot bất kể service duration; dễ nhưng có thể không bảo vệ toàn bộ thời gian.
- Một appointment giữ tập slot liền nhau; all-or-nothing, hợp với junction hiện có nhưng cần chuẩn hóa interval và update mọi writer.
- Tạo appointment riêng từng đoạn trong một group; lịch sử từng phần rõ hơn nhưng tăng độ phức tạp.

**5. Đề xuất (chưa được duyệt)**  
Dùng một appointment/reservation cho một cửa sổ liên tiếp; `slotId` là primary/start reference, junction là membership đầy đủ; mọi create/reschedule/cancel/expiry/admin xử lý cả tập atomic. Chưa chốt granularity hoặc duration policy: source vừa có đường 15 phút vừa có generator 30 phút, cần owner và schedule owner xác minh.

**6. Tác động**  
Appointment primary slot/status; mọi membership và count trên từng slot; service duration/room session/capacity; AI Pre-exam phải theo cùng semantics; cancellation/expiry/reschedule cần đọc cả membership.

**7. Kiểm thử**  
Duration một/nhiều slot; interval 15/30 phút; capacity khác nhau giữa các slot; gap/break; room session; conflict trên slot cuối; all-or-none rollback; AI Pre-exam membership; cancel/expiry/reschedule đổi đủ tập và không để membership stale.

**Trạng thái:** `UNRESOLVED` — mô hình appointment với membership đa slot có đề xuất, nhưng interval/base-slot source không đồng nhất và chưa được xác nhận nghiệp vụ.

### D6 — Payment đến muộn, callback duplicate, thời điểm hợp lệ

**1. Vấn đề nghiệp vụ**  
Chọn settlement timestamp hay callback arrival time; xử lý paid-before-expiry callback-after-expiry; duplicate event; slot đã bán lại; provider ACK/retry.

**2. Hành vi hiện tại**

- [PaymentsService.handleIpn](./nova-care-backend/src/modules/payments/payments.service.ts#L96) kiểm HMAC signature và tìm PaymentTransaction. Nếu status đang `PAID`, trả “already confirmed” trước transaction. Nếu success thì transaction đặt payment/appointment `PAID`; `paidAt` được đặt bằng thời gian xử lý hiện tại, không thấy dùng một provider settlement timestamp.
- Không thấy trong đoạn source này check Appointment status, `expiresAt`, reservation/capacity, amount/currency hoặc event identity trong transaction trước khi đặt paid.
- `simulatePaymentSuccess()` public ghi payment/appointment PAID không gate expiry.
- Payment failure ghi Payment `FAILED`, không giải phóng appointment hold trong IPN.

**3. Rủi ro**  
Callback muộn có thể đổi appointment đã `EXPIRED`/`CANCELLED` sang `PAID`; duplicate đồng thời có thể qua precheck; paid appointment có thể không còn slot; không xác định được khoản đã thu nhưng không cấp được lịch/ACK semantics.

**4. Các phương án**

- Arrival-time: chỉ chấp nhận callback đến trước hạn; triển khai đơn giản nhưng có thể từ chối payment settlement đúng hạn đến muộn.
- Provider settlement-time: chấp nhận nếu timestamp đáng tin cho biết thanh toán trước hạn; cần xác minh provider field/contract và replay/dedup.
- Re-claim sau expiry nếu toàn bộ target slots vẫn khả dụng; nếu slot đã cấp lại thì không overbook, chuyển sang refund/review.

**5. Đề xuất (chưa được duyệt)**  
Dedupe callback theo transaction/event identity, xác thực provider payload và đọc lại state trong transaction. Không coi callback thành công tự động là quyền chiếm slot. Nếu cân nhắc settlement-time, trước hết xác minh timestamp/amount/currency theo VNPay contract; re-claim chỉ khi policy cho phép và toàn bộ slots vẫn claim được. Nếu không cấp được suất, cần policy refund/manual review và response IPN được owner/provider duyệt.

**6. Tác động**  
PaymentStatus/`paidAt`/transaction code/callback payload; Appointment status; hold expiry; slot counter/membership; refund workflow; email/push/ACK provider.

**7. Kiểm thử**  
Callback đúng hạn, sát hạn, muộn; settlement time khác arrival time; duplicate sequential/concurrent; callback với appointment cancelled/expired; slot còn trống/đã bán lại; failure callback rồi success; invalid/mismatched amount/reference; ACK/error retry.

**Trạng thái:** `UNRESOLVED` — chưa xác minh timestamp provider, event identity, re-claim hay ACK contract.

### D7 — Refund, payment failure và manual review

**1. Vấn đề nghiệp vụ**  
Quyết định khi nào tự refund, khi nào manual review; full/partial; SLA/owner; retry lỗi provider; payment fail có còn hold hay không.

**2. Hành vi hiện tại**

- Enum có Payment/Appointment `REFUNDED`.
- [AdminPaymentsService.refund](./nova-care-backend/src/modules/admin/admin-payments.service.ts#L80) trong transaction đổi PaymentTransaction và Appointment sang `REFUNDED`, ghi status history; phần được rà không gọi provider refund API và không cập nhật slot count/membership.
- Patient cancel sau paid chỉ thông báo liên hệ cơ sở để kiểm tra refund.
- VNPay failure đặt payment `FAILED`; không đổi Appointment sang `FAILED` hoặc release hold trong flow đó.

**3. Rủi ro**  
Ghi trạng thái `REFUNDED` không chứng minh tiền thực đã hoàn; payment/appointment có thể lệch; retry gây double refund nếu có integration ngoài; slot có thể tiếp tục bị tính occupancy sau refund hoặc bị release không đúng theo lifecycle.

**4. Các phương án**

- Auto-refund qua provider với idempotency, reconciliation và trạng thái kết quả.
- Manual review/case queue có owner, reason, SLA và audit.
- Kết hợp: tự động khi provider/settlement deterministic; manual review khi callback/slot state ambiguous.

**5. Đề xuất (chưa được duyệt)**  
Tách booking occupancy khỏi refund. Release slot theo trạng thái booking đã được duyệt, không chờ refund; ghi nhận kết quả tiền theo workflow có audit. Chỉ auto-refund khi provider support idempotency và có reconciliation. Nếu không, chuyển manual review có người phụ trách. Payment `FAILED` không tự giải phóng hold cho tới khi policy expiry/retry quyết định.

**6. Tác động**  
Payment status và provider transaction; Appointment state không nên bị đồng nhất máy móc với refund; reservation/counter độc lập; status history/audit; thông báo và xử lý ngoại lệ.

**7. Kiểm thử**  
Refund request lặp/đồng thời; provider timeout nhưng refund có thể đã thành công; payment failed trước/sau retry; cancel paid; refund khi slot đã bán lại; manual-review assignment/SLA; so provider outcome với DB status.

**Trạng thái:** `UNRESOLVED` — source có status setter nhưng không chứng minh external refund; chưa có policy refund/manual review.

### D8 — Lịch trùng thời gian của cùng bệnh nhân

**1. Vấn đề nghiệp vụ**  
Chặn theo `patientProfileId`, `userId` hay cả hai; booking hold có block lịch khác; overlap dùng primary interval hay toàn bộ multi-slot interval; có quyền override không.

**2. Hành vi hiện tại**

- Create thông thường/reschedule query overlap theo `patientProfileId` trong transaction nhưng không lock profile để serialize hai lệnh trên các slot khác nhau.
- Hai query loại trừ `CANCELLED`, `EXPIRED`, `COMPLETED`; các status khác tiếp tục bị tính overlap.
- Query dùng primary slot/time window; multi-slot duration không nhất thiết được biểu diễn đủ bởi primary interval.
- AI Pre-exam creation không thấy overlap check trong hàm đã rà.

**3. Rủi ro**  
Hai request song song cho cùng patient có thể cùng vượt query; một tài khoản đặt cho dependent profiles có semantics khác với patient-level; hold/NO_SHOW/FAILED/REFUNDED có thể bị block không chủ ý; interval nhiều slot có thể không phủ đủ thời gian.

**4. Các phương án**

- Hard block overlap theo patient profile.
- Hard block overlap theo user, kể cả dependent profiles.
- Chỉ cảnh báo hoặc cho phép override bởi cơ sở.
- Chỉ kiểm tra reservation đang chiếm capacity, bỏ terminal/released bookings.

**5. Đề xuất (chưa được duyệt)**  
Nếu mục tiêu là ngăn một người bệnh có hai lịch chồng lấn, kiểm tra theo patient profile và toàn bộ appointment interval/slot membership; chỉ reservation đang active theo policy được duyệt mới block. Nếu cần guarantee dưới concurrency, serialize check trên patient profile. Phải quyết định riêng dependent profiles chung user và override.

**6. Tác động**  
Appointment patient profile/user, query interval, lifecycle states, multi-slot membership; create thông thường, AI Pre-exam, reschedule và admin override.

**7. Kiểm thử**  
Hai profile khác nhau cùng user; cùng profile qua hai thiết bị; overlapping primary slots khác nhau; multi-slot duration; AWAITING_PAYMENT hold; NO_SHOW/revert; cancel/expiry race; AI Pre-exam và regular create cạnh tranh.

**Trạng thái:** `PROPOSED` — phương án profile-based có đề xuất; phạm vi dependent/hold/override cần xác nhận.

### D9 — Giảm capacity, khóa slot hoặc sửa lịch đang có booking

**1. Vấn đề nghiệp vụ**  
Chốt cho phép giảm capacity dưới active reservations không; block/deactivate có hủy/di dời booking hiện hữu không; update schedule ảnh hưởng slot đang được claim thế nào.

**2. Hành vi hiện tại**

- [AppointmentSlotsService.updateSlot](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L263) đọc slot, từ chối capacity dưới snapshot `bookedCount`, rồi update capacity/isAvailable/isActive ngoài transaction/lock; không luôn đồng bộ `SlotStatus`.
- [ClinicRoomsController.assign](./nova-care-backend/src/modules/schedules/clinic-rooms.module.ts#L44) dùng transaction và khóa slot; chỉ cho assign khi slot count 0, sau đó đổi capacity.
- [ScheduleReconciliationService.reconcileWorkplaceSlotsForDate](./nova-care-backend/src/modules/schedules/schedule-reconciliation.service.ts#L15) upsert existing slot và có thể đổi capacity/endTime/active mà không khóa/kiểm `bookedCount`. Được gọi từ availability flow, nên query availability có thể kích hoạt update.
- Doctor schedule purge deactivates slots khi snapshot `bookedCount=0`, không cùng protocol lock với booking.

**3. Rủi ro**  
Create cạnh tranh với capacity update; capacity thấp hơn reservations; public availability và create khác status predicate; sửa giờ/endTime làm thay đổi interval của appointment hiện hữu; purge có thể deactive slot sau khi booking tranh chấp.

**4. Các phương án**

- Từ chối mọi capacity giảm dưới occupancy; block mới nhưng honor reservation hiện tại.
- Cho phép giảm dưới occupancy nhưng giữ booking cũ và tạo exception/CONFLICTED cho xử lý.
- Force-cancel/di dời bookings theo ưu tiên rồi mới giảm; cần chính sách thông báo/refund.
- Với schedule edits, chỉ áp dụng cho slot tương lai chưa có reservation; xử lý slot có đặt theo quy trình riêng.

**5. Đề xuất (chưa được duyệt)**  
Khóa slot khi thay đổi capacity/availability; không tự làm mất hoặc di chuyển booking hiện tại. Mặc định từ chối giảm dưới occupancy đã đối soát; block ngăn claim mới nhưng giữ reservation hiện hữu để xử lý/audit. Tất cả availability path phải cùng rule. Cần xác minh schedule owner và ngoại lệ trước khi chọn.

**6. Tác động**  
AppointmentSlot `capacity`, `status`, `isAvailable`, `isActive`, thời gian; bookedCount/membership; Appointment interval; room sessions/schedule config; availability API.

**7. Kiểm thử**  
Capacity giảm đồng thời với create/reschedule; block/disable khi hold hoặc paid booking tồn tại; schedule reconciliation thay capacity/endTime; purge đối đầu claim; public availability phản ánh đúng cùng eligibility predicate; slot `CONFLICTED`.

**Trạng thái:** `PROPOSED` — nguyên tắc bảo vệ booking hiện hữu có đề xuất; ngoại lệ giảm capacity, block và xử lý reschedule cần xác nhận.

### D10 — Hoàn tất, no-show và chuyển ngược trạng thái

**1. Vấn đề nghiệp vụ**  
Chốt thời điểm capacity được giải phóng sau khám/no-show; no-show có giữ slot đến hết giờ/grace không; ai được revert no-show; revert có phải re-claim.

**2. Hành vi hiện tại**

- [AppointmentsService.complete](./nova-care-backend/src/modules/appointments/appointments.service.ts#L844) đổi Appointment thành `COMPLETED` và tạo encounter, không giảm count trong đoạn đã rà.
- Admin/hospital-admin có thể đặt `NO_SHOW`; các luồng đã đọc không giảm count.
- [AdminAppointmentsService.revertNoShow](./nova-care-backend/src/modules/admin/admin-appointments.service.ts#L360) và [HospitalAdminService.revertNoShow](./nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L469) đổi `NO_SHOW` về `PAID` hoặc `CONFIRMED` theo payment; không thấy re-claim slot/count/junction.
- Complete từ appointments service từ chối trạng thái `NO_SHOW`, nhưng admin có nhánh restore riêng.

**3. Rủi ro**  
Nếu counter là live occupancy thì count có thể còn sau giờ khám; nếu lịch sử thì availability sai. Revert no-show có thể khôi phục status dù slot đã được cấp lại; count/membership không có bước khôi phục tương ứng.

**4. Các phương án**

- `COMPLETED` giải phóng ngay khi lượt khám hoàn tất; no-show giải phóng sau end time/grace.
- Giữ count như historical total và tính availability từ active ledger riêng.
- Revert no-show chỉ cho phép nếu còn claim được toàn bộ slot; nếu không, yêu cầu xử lý thủ công/điều phối.

**5. Đề xuất (chưa được duyệt)**  
Nếu `bookedCount` là active occupancy như đề xuất D1, complete/no-show cần transition terminal/consume theo một thời điểm rõ ràng; status history vẫn giữ số liệu lịch sử. Revert no-show không được chỉ đổi enum: chỉ khôi phục lịch nếu reservation còn hợp lệ hoặc có thể claim lại toàn bộ slot mà không overbook. No-show end/grace và quyền revert phải do nghiệp vụ xác nhận.

**6. Tác động**  
Appointment `COMPLETED`/`NO_SHOW`/reverted `PAID`/`CONFIRMED`; encounter/check-in; PaymentStatus; reservation/counter/membership; reports/metrics.

**7. Kiểm thử**  
Complete và no-show trước/sau slot end/grace; revert trước/sau slot được bán lại; duplicate complete/no-show; payment state paid/unpaid; slot multi-slot; count/membership terminal; report history không phụ thuộc live counter.

**Trạng thái:** `UNRESOLVED` — completion/no-show release time và revert semantics chưa có quyết định nghiệp vụ.

## 4. Bảng tổng hợp quyết định

`CONFIRMED` chỉ dùng khi có bằng chứng approval rõ ràng. Không có D nào trong sáu tài liệu được ghi nhận như vậy.

| Mã | Quyết định | Hành vi hiện tại | Phương án đề xuất | Trạng thái |
|---|---|---|---|---|
| D1 | Status-to-occupancy; nghĩa `bookedCount` | Các luồng update count không thống nhất; count/junction/status không đồng nghĩa. | Lifecycle occupancy rõ; count là active occupancy, history riêng. | `PROPOSED` |
| D2 | TTL/start/expiry boundary | Regular create 15 phút, AI Pre-exam 30 phút; source dùng `< now`; worker runtime chưa xác minh. | Một TTL từ commit hold; hết tại `now >= expiresAt`. TTL cuối chờ duyệt. | `UNRESOLVED` |
| D3 | Hủy và release | Patient 2h/encounter rules; admin/hospital khác nhau; release paths thiếu CAS/multi-slot coverage. | Transition hợp lệ release toàn bộ membership đúng một lần; refund riêng. | `PROPOSED` |
| D4 | Reschedule | Chỉ `CONFIRMED`/`PAID`; precheck ngoài transaction; cập nhật primary/count, không junction. | Claim target toàn bộ trước; transaction atomic; thất bại giữ lịch cũ. | `PROPOSED` |
| D5 | Multi-slot / primary vs junction | Regular create ghi membership đa slot; pre-exam không ghi; các release/reschedule không đồng bộ; generator có 15/30m khác biệt. | Một reservation aggregate với tập slot liền nhau; primary là start reference. | `UNRESOLVED` |
| D6 | Late/duplicate payment | IPN kiểm chữ ký; precheck paid ngoài transaction; success đặt appointment/payment paid không check expiry/capacity trong flow đã rà. | Idempotent event + state/capacity recheck; không overbook; late policy/ACK phải chốt. | `UNRESOLVED` |
| D7 | Refund/payment failure/manual review | Admin status setter ghi REFUNDED nhưng provider refund chưa được chứng minh; failure không release hold. | Refund độc lập occupancy; auto-refund chỉ với idempotency/reconciliation, nếu không manual review. | `UNRESOLVED` |
| D8 | Patient overlap | Query theo patient profile trong regular create/reschedule; chưa serialize; AI Pre-exam không thấy check. | Block overlap của active reservations trên full interval, nếu scope được duyệt. | `PROPOSED` |
| D9 | Capacity/block/schedule edits | Slot update check-then-write; room assign khóa slot khi count 0; schedule reconcile có thể update existing slot. | Khóa slot, giữ booking hiện hữu, ngăn claim mới; ngoại lệ chờ duyệt. | `PROPOSED` |
| D10 | Complete/no-show/revert | Complete/no-show không release; revert status không re-claim count/membership. | Define consume/release timing; revert chỉ khi reservation còn/claim lại được. | `UNRESOLVED` |

## 5. Câu hỏi cần người dùng/giảng viên xác nhận

1. **D1:** `bookedCount` có phải active occupancy không? Với từng AppointmentStatus, khi nào chiếm và thôi chiếm capacity?
2. **D2:** Chọn hold TTL chung bao nhiêu phút cho regular và AI Pre-exam? Bắt đầu khi commit hay payment URL? Equality là hết tại `now >= expiresAt`? Có grace/gia hạn khi `PROCESSING`?
3. **D3:** Deadline patient cancel có giữ 2 giờ? Unpaid exception? Vai trò nào được override? Encounter đã tiếp nhận có thể hủy theo quy trình nào?
4. **D4:** Reschedule lịch đã thanh toán có giữ `PAID`? Có đổi service/duration/room/price không? Refund/thu thêm và giới hạn thời gian?
5. **D5:** Base slot đang là 15 hay 30 phút theo nghiệp vụ? Một dịch vụ dài giữ toàn bộ cửa sổ liền kề? `Appointment.slotId` có được chốt là slot đầu? Cách xử lý gap/capacity khác nhau?
6. **D6:** VNPay settlement timestamp nào đáng tin và được phép dùng? Có re-claim slot nếu callback đến sau expiry? Nếu đã bán lại thì response IPN/ưu tiên xử lý tiền thế nào?
7. **D7:** Auto-refund hay manual review? Ai chịu trách nhiệm/SLA? Refund full/partial? Có integration provider refund đã được duyệt không?
8. **D8:** Overlap block theo profile hay user (kể cả dependent profiles)? `AWAITING_PAYMENT` có block? Cơ sở có override không?
9. **D9:** Có cho giảm capacity dưới reservations đang có bằng ngoại lệ? Block slot đã đặt thì honor, chuyển hay hủy? Ai được duyệt?
10. **D10:** `COMPLETED` release lúc nào? `NO_SHOW` giữ đến slot end/grace? Revert no-show có cần re-claim và điều kiện nào?
11. Ai là người có thẩm quyền ký duyệt từng policy (nghiệp vụ, thanh toán, bệnh viện, chủ dự án)? Cần lưu approval artifact nào?
12. Source baseline: các thay đổi admin/hospital-admin/migration chưa commit có thuộc snapshot mà nghiên cứu cần đánh giá không? Commit/deployment nào đại diện cho hệ thống chạy thực?

## 6. Mâu thuẫn giữa tài liệu và code

| Chủ đề | Mâu thuẫn/thiếu | Cách xử lý trước khi khóa rule |
|---|---|---|
| TTL | Tài liệu thiết kế ưu tiên 15 phút; working source AI Pre-exam dùng 30 phút; không có bằng chứng policy được duyệt. | Owner chọn một TTL hoặc exception có căn cứ. |
| Boundary | Code dùng `expiresAt < now`; conflict design đề nghị `<=`; policy draft/readiness nói cần thống nhất. | Chốt predicate và test boundary. |
| Slot granularity | Create chính xem lưới 15 phút, default service duration 30; schedule reconciliation sinh slot 30 phút. | Schedule/clinic owner xác nhận granularity thực tế; không mặc định 15 phút. |
| Multi-slot | Create chính tạo junction đa slot; AI Pre-exam không tạo junction; cancel có thể đọc junction; expiry/hospital cancel chỉ decrement primary; reschedule không đổi junction. | Duyệt aggregate rule và phân loại legacy rows trước khi dùng junction làm oracle. |
| `bookedCount` | Tài liệu đề xuất active occupancy; source không decrement complete/no-show; một số cancel/expiry release nhưng membership còn lại. | Duyệt semantics trước reconciliation/migration. |
| Payment `PAID` | Tài liệu đề xuất paid không đồng nghĩa có slot; code IPN/simulator đổi appointment thành `PAID` không kiểm expiry/capacity trong flow đã rà. | Chốt late payment/ACK; không hiểu code hiện tại là policy. |
| Refund | Một số tài liệu nói chưa thấy refund workflow; source có admin method đặt payment + appointment `REFUNDED`, nhưng không thấy provider API operation trong method. | Phân biệt status bookkeeping với hoàn tiền thật; xác minh integration/provider và owner. |
| Admin cancellation | `HEAD` có DELETE route và service cancel/decrement primary; working tree đã xóa endpoint/method. Hospital-admin working diff có CAS+guard decrement primary. | Pin commit/release baseline; không gộp hành vi khác snapshot. |
| Appointment overlap | Regular create/reschedule query theo profile nhưng không serialize; pre-exam create không thấy overlap check. | Quy định scope và áp dụng cho tất cả channels. |
| Dự thảo/approval | File có “APPROVED” trong tên nhưng tự khai là draft, mọi lựa chọn đều chờ duyệt. | Giữ status PROPOSED/UNRESOLVED đến khi có phê duyệt xác thực. |

## 7. Kết luận và bước tiếp theo

**Chưa đủ điều kiện chuyển sang thiết kế dữ liệu chi tiết hoặc migration.** D1, D2, D5, D6, D7 và D10 còn unresolved hoặc phụ thuộc quyết định vận hành/provider; D3, D4, D8, D9 có phương án kỹ thuật-nghiệp vụ đề xuất nhưng vẫn chưa được người có thẩm quyền phê duyệt. Không có quyết định `CONFIRMED`.

Trình tự khuyến nghị:

1. Nhận xác nhận của owner cho câu hỏi D1–D10 ở trên; ghi người duyệt, ngày và phạm vi.
2. Chốt truth table Appointment/Payment/Slot/occupancy cùng TTL, late-payment, refund, overlap và no-show rules.
3. Chốt commit/deployment baseline và kiểm tra diff chưa commit; xác minh provider/scheduler thực tế.
4. Sau approval, chạy truy vấn inventory chỉ đọc trên DB clone, phân loại mismatch và record cần manual review.
5. Chỉ khi occupancy semantics và dữ liệu được xác nhận mới chuyển sang thiết kế dữ liệu tối thiểu; tài liệu này không đề xuất schema/migration cụ thể.

**Không triển khai, không migration, không thay đổi database và không benchmark trong lần rà soát này.**
