# Phân tích chính sách occupancy D1 — NovaCare

**Trạng thái:** phân tích và đề xuất để xin phê duyệt; chưa phải chính sách đã duyệt.  
**Phạm vi:** định nghĩa `bookedCount`, quan hệ giữa trạng thái Appointment/Payment với occupancy, lifecycle occupancy, các transition được yêu cầu và multi-slot. Không thiết kế schema/migration, không sửa source và không truy cập database.  
**Source snapshot:** các kết luận hiện trạng dựa trên working tree đã kiểm tra, gồm `develop` tại HEAD `585dcd8db9d612b4d35d758fe7d285b4762298b6` và thay đổi chưa commit được ghi trong baseline. Không khẳng định snapshot này tương ứng production.

## 1. Tài liệu và source đối chiếu

Đã đọc:

- [BUSINESS_RULES_REVIEW_D1_D10.md](./BUSINESS_RULES_REVIEW_D1_D10.md)
- [BASELINE_AND_OCCUPANCY_INVENTORY.md](./BASELINE_AND_OCCUPANCY_INVENTORY.md)
- [BUSINESS_RULES_DECISIONS.md](./BUSINESS_RULES_DECISIONS.md)
- [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md)

Các đoạn source trọng tâm:

- Enum và model Appointment/Slot/junction: [schema.prisma](./nova-care-backend/prisma/schema.prisma#L26), [Appointment và AppointmentSlot](./nova-care-backend/prisma/schema.prisma#L298), [AppointmentSlotBooking](./nova-care-backend/prisma/schema.prisma#L375).
- Create thường và ghi membership/counter: [AppointmentsService.create](./nova-care-backend/src/modules/appointments/appointments.service.ts#L26), [ghi membership và tăng counter](./nova-care-backend/src/modules/appointments/appointments.service.ts#L217).
- Cancel/reschedule/expiry/complete: [cancel](./nova-care-backend/src/modules/appointments/appointments.service.ts#L546), [reschedule](./nova-care-backend/src/modules/appointments/appointments.service.ts#L662), [expiry](./nova-care-backend/src/modules/appointments/appointments.service.ts#L770), [complete](./nova-care-backend/src/modules/appointments/appointments.service.ts#L844).
- AI Pre-exam create: [PreExamService.createAppointmentFromPreExam](./nova-care-backend/src/modules/pre-exam/pre-exam.service.ts#L201).
- Payment IPN: [PaymentsService.handleIpn](./nova-care-backend/src/modules/payments/payments.service.ts#L96).
- Admin refund và status: [AdminPaymentsService.refund](./nova-care-backend/src/modules/admin/admin-payments.service.ts#L75), [AdminAppointmentsService.updateStatus](./nova-care-backend/src/modules/admin/admin-appointments.service.ts#L427), [HospitalAdminService.updateAppointmentStatus](./nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L527).

## 2. Định nghĩa D1 được đề xuất

### 2.1 Ý nghĩa của `bookedCount`

**Đề xuất của Agent:** `AppointmentSlot.bookedCount` biểu thị số reservation đang chiếm sức chứa của slot tại thời điểm hiện tại. Đây là counter occupancy đang hoạt động, **không phải** tổng số lịch từng được đặt, số lần thanh toán, số appointment còn trong bảng, hoặc số dòng junction thô.

Theo định nghĩa này:

1. Lịch sử đặt khám được giữ trong Appointment, status history, payment/history và các bản ghi nghiệp vụ tương ứng; không phụ thuộc việc counter đã giảm hay chưa.
2. `AppointmentStatus` mô tả tiến trình nghiệp vụ của lịch khám; `PaymentStatus` mô tả tiến trình tài chính. Hai loại trạng thái này không tự thân là nguồn quyết định occupancy.
3. Một trạng thái Appointment chỉ có thể gợi ý occupancy khi có quy tắc đã duyệt và reservation tương ứng còn ở lifecycle đang chiếm chỗ.
4. Với một lịch nhiều slot, reservation đang chiếm chỗ làm tăng counter của **từng slot** trong toàn bộ tập membership, mỗi membership đúng một lần.

Đây là semantics đề xuất, chưa được chủ dự án/giảng viên phê duyệt. Trước khi dùng nó làm correctness oracle, cần xác định lifecycle cho dữ liệu mới và cách diễn giải dữ liệu lịch cũ.

### 2.2 Lifecycle occupancy độc lập

Mô hình khái niệm được đề nghị:

| Trạng thái occupancy | Có chiếm capacity? | Ý nghĩa |
|---|---:|---|
| `NOT_OCCUPYING` | Không | Chưa claim slot hoặc không còn reservation hiệu lực. |
| `OCCUPYING` | Có | Reservation đã claim slot; có thể đang hold chờ thanh toán hoặc đã được giữ/xác nhận. |
| `RELEASED` | Không | Reservation dừng chiếm chỗ do cancel, expiry hoặc thất bại được chấp nhận. Đây là kết thúc do giải phóng trước/sau khi bán chỗ. |
| `CONSUMED` | Không còn chiếm suất tương lai | Lượt khám/slot đã được tiêu thụ theo mốc nghiệp vụ được duyệt. Khác `RELEASED` để phân biệt đã sử dụng với nhường lại chỗ; không xóa lịch sử. |

`HELD`/`BOOKED` có thể hữu ích để phân biệt hold thanh toán với lịch được xác nhận, nhưng cả hai đều thuộc nhóm occupancy đang chiếm capacity. Tên và cách lưu các trạng thái này là lựa chọn thiết kế tương lai, không phải enum hiện tại và không được xem là schema đã chốt.

```text
NOT_OCCUPYING
      │ claim thành công; transaction tạo appointment,
      │ mọi membership và counter cùng commit
      ▼
  OCCUPYING ───────────────► RELEASED
      │                       cancel / expiry / thất bại
      │                       hợp lệ được commit
      │
      └────────────────────► CONSUMED
                              khám hoàn tất hoặc hết cửa sổ
                              sử dụng theo policy được duyệt

RELEASED và CONSUMED không chiếm capacity.
Các chuyển trạng thái làm giảm counter chỉ được thực hiện một lần.
```

**Mốc bắt đầu đề xuất:** khi transaction claim slot thành công commit, không phải khi người dùng mở trang, bắt đầu điền form hoặc mở payment URL. Create phải tạo reservation/membership và tăng counter cùng transaction; rollback nghĩa là chưa có occupancy.

**Mốc kết thúc đề xuất:** khi transition nguyên tử từ `OCCUPYING` sang `RELEASED` hoặc `CONSUMED` commit. Quy tắc xác định thời điểm expiry, cancellation eligibility, khám hoàn tất, no-show và payment muộn vẫn cần phê duyệt; không lấy riêng timestamp hoặc enum làm căn cứ release.

## 3. Ma trận đề xuất cho từng AppointmentStatus

Trong cột “Đề xuất occupancy”, “Có điều kiện” nghĩa là occupancy được xác định từ reservation lifecycle và thời điểm, không suy ra tự động từ AppointmentStatus. Bảng này **không mô tả policy hiện có**.

| AppointmentStatus | Hành vi hiện tại trong source đã rà | Đề xuất: có chiếm suất? | Bắt đầu / giải phóng theo đề xuất | Ngoại lệ và ảnh hưởng payment |
|---|---|---|---|---|
| `PENDING` | Create thường được rà đặt `AWAITING_PAYMENT`; `PENDING` có trong enum và được payment/cancel/overlap paths chấp nhận. Không có quy tắc counter nhất quán cho status này. | **Có điều kiện.** Chỉ chiếm nếu đã có reservation được claim và lifecycle đang `OCCUPYING`; một draft chưa claim thì không. Cần xác định cách xử lý bản ghi legacy `PENDING`. | Bắt đầu lúc claim/commit, không phải do chuyển enum sang `PENDING`. Chỉ release khi một lệnh hủy/thất bại hợp lệ chuyển lifecycle ra khỏi `OCCUPYING`. | Payment `PENDING` hoặc `FAILED` không tự claim/release. Phải xác minh status này hiện còn tạo mới ở kênh nào. |
| `AWAITING_PAYMENT` | Create thường tạo membership và tăng counter; AI Pre-exam tạo appointment và tăng counter nhưng không tạo junction. TTL lần lượt 15 và 30 phút theo source đã rà. | **Có**, nếu hold đã commit và còn hiệu lực theo policy. | Bắt đầu khi create/hold transaction commit. Hết hold chỉ release khi expiry transition được commit; TTL, biên `expiresAt` và worker thực chạy chưa được thống nhất/xác minh. | Payment thành công đúng hạn giữ nguyên occupancy và có thể chuyển booking sang đã trả tiền. Payment thất bại không tự release; có thể còn retry đến khi hold hết hạn, nếu policy cho phép. |
| `CONFIRMED` | `confirm()` đổi status mà không tăng/giảm counter; admin có thể cập nhật status. | **Có điều kiện, thông thường tiếp tục chiếm** nếu reservation trước đó vẫn đang `OCCUPYING`. Không được tạo occupancy chỉ bằng một status update. | Occupancy được giữ liên tục qua transition từ reservation đang chiếm chỗ; release khi cancel hợp lệ hoặc consume. | Payment không tự quyết định status này có chiếm. Nguồn xác nhận lịch (`confirm`) cần thống nhất với policy thanh toán. |
| `PAID` | VNPay IPN và simulator chuyển Appointment sang `PAID`; không cập nhật membership/counter. IPN được rà chưa kiểm tra expiry/capacity trước khi ghi PAID. | **Có điều kiện, thông thường tiếp tục chiếm** nếu reservation chưa release và payment event được chấp nhận theo policy. | Không bắt đầu occupancy chỉ vì `PAID`; giữ occupancy đã claim trước đó. Nếu reservation đã release, cần quy tắc late-payment và claim lại thành công; không phục hồi chỉ bằng đổi enum. | Payment captured sau expiry hoặc khi slot đã bán lại có thể cần refund/manual review; thời điểm hợp lệ và phản hồi provider chưa được duyệt. |
| `COMPLETED` | `complete()` đổi status và ghi history/encounter; không giảm counter hoặc cập nhật junction trong đoạn đã rà. | **Không** sau khi reservation được `CONSUMED`. Trước thời điểm consume, lịch vẫn chiếm nếu slot còn được bảo vệ. | Đề xuất consume lúc hoàn tất khám được xác nhận; có thể cân nhắc kết thúc slot/grace thay vì thời điểm cập nhật status. Mốc chính xác cần D10 phê duyệt. | Payment state không làm sống lại occupancy sau khi đã consume; hoàn tiền/điều chỉnh tài chính là luồng riêng. |
| `CANCELLED` | Patient cancel giảm count qua junction (hoặc fallback primary), không xóa junction; hospital-admin trong working tree chỉ giảm primary; admin generic status path không release counter. | **Không** sau khi cancel hợp lệ đã commit và reservation chuyển sang `RELEASED`. | Chỉ release cùng transaction với transition cancel thắng; phải release tất cả slot membership đúng một lần. | Refund không đồng nhất với cancel. Nếu payment đã thành công, cancellation vẫn có thể release chỗ, còn refund được xử lý riêng theo policy. |
| `EXPIRED` | Expiry service và processor giảm primary slot; membership multi-slot không được đồng bộ. Predicate hiện dùng `expiresAt < now`; worker runtime chưa xác minh. | **Không** sau khi expiry transition được commit. | Release toàn bộ membership khi xác nhận lại hold đủ điều kiện hết hạn trong transaction. Thời điểm bằng nhau (`<` hay `<=`) chưa chốt. | Payment failure không ngăn expiry trừ khi policy cho grace/retry. Callback thành công muộn phải tuân theo D6, không ghi PAID vô điều kiện. |
| `NO_SHOW` | Admin/hospital-admin có thể ghi status; các đoạn đã rà không release counter. Có luồng revert thành `PAID`/`CONFIRMED` mà không thấy re-claim count/membership. | **Có điều kiện theo thời gian.** Đề xuất giữ occupancy đến khi slot kết thúc hoặc hết grace được duyệt, sau đó chuyển `CONSUMED`/không còn chiếm suất. Không dùng `NO_SHOW` làm dữ liệu occupancy lịch sử. | Bắt đầu từ reservation đang chiếm; kết thúc tại mốc no-show/end/grace đã duyệt. | Payment có thể đã paid hoặc chưa; status no-show không tự hoàn tiền, cũng không tự release trước khi hết thời gian cần bảo vệ. Quy tắc revert cần kiểm tra lifecycle và khả năng claim. |
| `FAILED` | Có trong enum và generic admin status path; chưa thấy transition appointment-level thống nhất. `PaymentStatus.FAILED` riêng không tự đổi Appointment thành `FAILED` trong IPN đã rà. | **Có điều kiện.** Chỉ appointment failure terminal đã được duyệt mới kết thúc occupancy; lỗi payment attempt không đồng nghĩa appointment failure. | Nếu failure đóng booking, transition lifecycle `OCCUPYING → RELEASED` cùng transaction. Nếu chỉ là payment attempt thất bại có thể retry, giữ occupancy đến retry/expiry policy. | Cần phân biệt `AppointmentStatus.FAILED` với `PaymentStatus.FAILED`; payment failure riêng lẻ không decrement counter. |
| `REFUNDED` | Admin refund đặt Payment và Appointment thành `REFUNDED`; không thấy release counter/membership trong refund flow. | **Không thể quyết định từ status này.** Đề xuất: refund tự thân không đổi occupancy; nếu booking tương lai vẫn còn và chưa cancel thì tiếp tục chiếm. Nếu refund đi cùng cancellation, lệnh cancel riêng mới release. | Giữ/release theo lifecycle của booking, không theo thời điểm cập nhật `REFUNDED`. | Refund có thể là điều chỉnh tài chính sau khi cancel, sau khám hoặc trong dispute. Cần xác nhận liệu Appointment `REFUNDED` có đại diện hủy lịch trong nghiệp vụ hay không. |

### Lưu ý đọc ma trận

- “Đề xuất: có chiếm suất?” là policy candidate, không phải trạng thái thực tế đã được code bảo đảm.
- `PAID`, `CONFIRMED`, `REFUNDED`, `FAILED` không được dùng làm phép suy luận occupancy nếu chưa biết lifecycle hiện hành của reservation.
- `PaymentStatus.PAID/FAILED/REFUNDED/EXPIRED` là kết quả payment; không được dùng thay đổi counter trực tiếp. Payment event chỉ có thể làm thay đổi booking lifecycle sau khi command nghiệp vụ kiểm tra trạng thái reservation, expiry, slot capacity và policy đã duyệt.
- Một Appointment đã là `CANCELLED`/`EXPIRED` nhưng còn junction row không có nghĩa junction đang active; baseline ghi nhận source không xóa junction nhất quán. Số hàng junction thô vì vậy không phải occupancy truth.

## 4. Các transition được yêu cầu

| Appointment transition | Occupancy đề xuất | Điều kiện/ngoại lệ cần chốt |
|---|---|---|
| `AWAITING_PAYMENT → PAID` | `OCCUPYING → OCCUPYING` nếu hold vẫn hợp lệ; không thay đổi count. | Xác thực callback/payment; xác định payment timestamp chuẩn và boundary. Nếu hold đã `RELEASED`, đi theo late-payment policy; chỉ re-claim nếu transaction kiểm tra và claim được toàn bộ slot. Nếu không claim được, không xác nhận booking bằng status `PAID` đơn thuần; xử lý refund/manual review theo D6/D7. |
| `AWAITING_PAYMENT → EXPIRED` | `OCCUPYING → RELEASED`; decrement mỗi slot membership một lần. | Trong transaction, đọc lại trạng thái và hạn; payment-success và expiry phải có một bên thắng rõ ràng. TTL, equality tại hạn, payment processing/grace và cơ chế sweeper cần phê duyệt/xác minh. |
| `CONFIRMED → CANCELLED` | `OCCUPYING → RELEASED` khi cancellation hợp lệ commit. | Quyền hủy, thời hạn, encounter đã tiếp nhận, audit và lý do. Không để generic status update bỏ qua release. |
| `PAID → CANCELLED` | `OCCUPYING → RELEASED`; payment/refund xử lý độc lập. | Cancel có thể giải phóng slot dù refund chưa xong; cần policy hoàn tiền, fee và thời gian xử lý. Nếu status/payment callback cạnh tranh, transition phải serialize/idempotent. |
| `PAID → COMPLETED` | `OCCUPYING → CONSUMED`; counter occupancy giảm một lần khi lượt khám được tính là đã tiêu thụ. | Xác nhận mốc consume: lúc bác sĩ hoàn tất, encounter được lưu, hay hết slot/grace. Counter không còn là lịch sử; appointment/history vẫn giữ record. |
| `PAID → NO_SHOW` | Không release ngay chỉ vì đổi status; giữ đến khi điều kiện no-show/end/grace kết thúc, sau đó `OCCUPYING → CONSUMED` (đề xuất). | Thời điểm grace, liên hệ bệnh nhân và quyền xác nhận no-show cần policy. Nếu đánh dấu sau khi slot kết thúc, consume có thể được ghi cùng transition. |
| `NO_SHOW → PAID/CONFIRMED` | Nếu reservation vẫn `OCCUPYING`, có thể sửa status mà không đổi counter. Nếu đã `CONSUMED`/`RELEASED`, không thể chỉ đổi enum để chiếm lại. | Cần xác định đây là sửa sai dữ liệu hay khôi phục một lịch tương lai. Chỉ được re-claim nếu thời gian còn hợp lệ và mọi slot có capacity; nếu không, quy trình thủ công/booking mới. |
| `PAID → REFUNDED` | Không thay occupancy chỉ do refund. Nếu lịch bị hủy, lifecycle chuyển `OCCUPYING → RELEASED` bằng một transition hủy riêng. | Phải xác định refund full/partial, provider result, refund lỗi và appointment status sau refund. Không suy diễn rằng tiền hoàn đồng nghĩa lịch đã hủy hoặc chỗ được nhả. |

## 5. Phân tích các tình huống trọng tâm

### Hold hết hạn

Đề xuất: hold chiếm capacity sau khi create transaction commit. Expiry không phải chỉ là một phép so sánh `expiresAt` rồi decrement; command phải kiểm tra lại reservation chưa chuyển sang trạng thái khác, điều kiện thời hạn đã đạt theo boundary được duyệt, và chưa có payment event hợp lệ làm booking tiếp tục chiếm. Sau đó chuyển reservation sang `RELEASED` và giảm toàn bộ slot memberships nguyên tử.

Hiện trạng có TTL create thường 15 phút và Pre-exam 30 phút; expiry service/processor dùng `< now`, cập nhật counter primary slot và chưa chứng minh worker production được wire. Không được coi booking đã hết hạn chỉ bởi timestamp mà chưa qua transition.

### Thanh toán đến muộn

Payment callback không tự claim capacity. Nếu payment provider xác nhận thu tiền sau khi reservation đã `RELEASED`, callback phải đi qua policy riêng:

1. kiểm tra event, số tiền và timestamp đáng tin cậy;
2. nếu còn được phép và toàn bộ slot có thể claim lại, re-claim nguyên tử rồi xác nhận booking;
3. nếu không thể claim, không overbook; đi theo refund/manual review/response policy đã được phê duyệt.

Đây là hướng an toàn đề xuất, không khẳng định API provider hiện hỗ trợ các timestamp hoặc hành vi cụ thể. D6/D7 cần được duyệt cùng D1.

### Hủy lịch

Khi hủy hợp lệ, chỉ transition đầu tiên từ lifecycle đang chiếm sang `RELEASED` mới giảm count. Lặp lại cùng lệnh phải không decrement lần nữa. Patient/admin/hospital-admin phải gọi cùng quy tắc occupancy dù điều kiện authorization và cancel deadline có thể khác. Refund không phải điều kiện để release, trừ khi business owner chọn chính sách khác.

### Hoàn tất khám

Với counter live occupancy, một appointment đã hoàn tất không còn giữ capacity tương lai sau mốc consume. Không giữ counter như tổng lượt khám; báo cáo số lịch/khám phải lấy từ Appointment/status history/encounter. Hiện `complete()` chỉ đổi Appointment status và không giảm counter; mốc consume và tính đúng cho slot đã qua cần được xác nhận.

### Vắng mặt

`NO_SHOW` là kết quả vận hành/attendance, không tự động đồng nghĩa với hủy trước slot hoặc release tức thì. Đề xuất giữ chỗ đến hết slot/grace cần thiết để tránh slot bị coi là trống khi thời gian phục vụ vẫn đang diễn ra, rồi kết thúc occupancy như `CONSUMED` (không phải lịch sử bị xóa). Vì source có thể revert `NO_SHOW` về `PAID`/`CONFIRMED` mà không re-claim, quyền và điều kiện revert là quyết định cần chốt.

### Hoàn tiền

Hoàn tiền là giao dịch tài chính. Nó không tự trả lại slot vì lý do refund có thể khác nhau; release slot cần transition hủy/đóng booking rõ ràng. Hiện admin refund đổi cả Payment và Appointment sang `REFUNDED` nhưng không thấy release membership/counter hoặc thao tác provider refund trong method đã rà. Cần phê duyệt quan hệ giữa `REFUNDED` và cancellation, đồng thời giữ audit payment tách khỏi lịch sử occupancy.

### Đặt nhiều khung giờ liên tiếp

Đề xuất coi reservation là một aggregate chiếm toàn bộ tập slot cần thiết:

- Claim: toàn bộ membership và mọi counter increment cùng transaction; nếu một slot không đủ capacity thì rollback toàn bộ.
- Release/consume: cùng một transition lifecycle áp dụng cho toàn tập; không chỉ primary slot.
- Counter từng slot bằng số reservation active có membership tại chính slot đó; Appointment `slotId` là primary/start reference, không đủ để biểu diễn toàn duration.
- Junction row có thể cần giữ như dấu vết lịch sử hoặc membership, nhưng không được đếm thô làm occupancy nếu không phân biệt active/released.

Hiện create thường tạo `AppointmentSlotBooking` cho candidate slots và tăng từng counter; AI Pre-exam chỉ dùng primary slot, không tạo junction. Cancel/expiry/admin/reschedule không đồng bộ đầy đủ tất cả membership. Vì vậy không thể dùng raw junction count làm oracle cho dữ liệu hiện có.

## 6. Invariants cần bảo đảm

Các invariant dưới đây là yêu cầu kỹ thuật đề xuất; ngưỡng capacity và ngoại lệ nghiệp vụ vẫn cần được duyệt.

1. **Không overbook:** với mỗi slot, occupancy active không vượt `capacity`. Một claim chỉ thành công khi toàn bộ slot cần dùng còn capacity sau khi serialize/guard.
2. **Counter không âm:** `bookedCount >= 0`. Release không được clamp im lặng về 0; nếu không thể decrement đúng một membership thì rollback và báo lỗi invariant để điều tra.
3. **Release một lần:** một reservation/membership chỉ được chuyển khỏi `OCCUPYING` một lần. Retry, duplicate callback, expiry chạy nhiều lần hoặc hai kênh cùng hủy không làm decrement kép.
4. **Counter khớp occupancy:** `bookedCount(slot)` phải bằng số membership thuộc các reservation đang `OCCUPYING` tại slot đó. `RELEASED`/`CONSUMED` không tính; dữ liệu legacy chỉ có thể đối chiếu sau khi xác định policy và nguồn membership đúng.
5. **Atomicity:** create/reschedule/cancel/expiry/payment transition/consume trên multi-slot cập nhật lifecycle, appointment transition liên quan, tất cả membership, mọi counter và history cần thiết trong một transaction. Lỗi giữa chừng rollback toàn bộ.
6. **Payment độc lập:** thay đổi `PaymentStatus` tự thân không làm thay đổi occupancy. Chỉ command booking được ủy quyền áp dụng payment event lên lifecycle sau khi kiểm tra policy.
7. **Lịch sử độc lập counter:** giảm `bookedCount` không xóa Appointment, payment event, status history hay encounter. Không dùng counter để tái tạo lịch sử đặt khám.
8. **Capacity thay đổi:** nếu policy chọn không cho giảm dưới reservation active, `capacity >= occupancy` phải được bảo đảm trong cùng cơ chế serialize slot update và booking. Nếu cần ngoại lệ, phải có quy trình owner phê duyệt trước khi nới invariant.

## 7. Những gì đã xác minh và những gì chưa được duyệt

### Đã xác minh trong source snapshot

- Schema có các enum Appointment/Payment và `bookedCount`, `capacity`, `version`; Appointment giữ `slotId`, expiry và junction relation.
- Create thường ghi appointment, nhiều junction và counter trong transaction; Pre-exam create có đường riêng thiếu junction.
- Cancel, expiry, reschedule, completion, payment IPN, refund và admin state changes không duy trì cùng một lifecycle occupancy; một số path chỉ xử lý primary slot hoặc không release.
- Junction không bị xóa nhất quán khi cancel/expiry; không thể xem số junction hiện tại như active occupancy.
- Các chi tiết trên mô tả source snapshot, không chứng minh trạng thái dữ liệu hoặc runtime production.

### Đề xuất của Agent

- Định nghĩa `bookedCount` là active occupancy, không phải lịch sử.
- Dùng reservation lifecycle tách biệt về ngữ nghĩa khỏi AppointmentStatus và PaymentStatus.
- Claim bắt đầu khi transaction create commit; release/consume kết thúc occupancy đúng một lần sau transaction hợp lệ.
- Multi-slot là một claim/release/consume nguyên tử trên mọi membership.
- Payment/refund không tự claim/release; cần booking command tường minh.

### Câu hỏi cần người dùng/giảng viên phê duyệt

1. Có phê duyệt semantics `bookedCount = số reservation đang chiếm capacity` và lưu lịch sử độc lập counter không?
2. Reservation bắt đầu chiếm ngay khi create commit, kể cả `AWAITING_PAYMENT`? Nếu không, thời điểm nào?
3. `PENDING` có còn là trạng thái tạo booking mới không; các record `PENDING` legacy được hiểu thế nào?
4. `AWAITING_PAYMENT` hết hold tại thời điểm nào, theo boundary nào, và payment `PROCESSING` có grace không? (liên quan D2)
5. Callback paid sau expiry có được re-claim không; nếu không claim được thì refund hay manual review? (D6/D7)
6. `COMPLETED` consume occupancy khi nào? `NO_SHOW` giữ đến hết slot/grace nào và có được revert không? (D10)
7. `REFUNDED` có bao giờ đồng nghĩa lịch đã hủy, hay luôn cần một transition cancellation riêng? (D7)
8. Hủy `CONFIRMED`/`PAID` có release ngay khi cancel commit, độc lập với refund? Có ngoại lệ nào?
9. Xác nhận multi-slot: tất cả slot liên tiếp đều bị giữ; `Appointment.slotId` chỉ là slot đầu/primary? (D5)
10. Với dữ liệu lịch cũ thiếu junction hoặc counter lệch, nguồn nào được dùng để kiểm kê/khởi tạo occupancy? Không nên tự chọn bằng status hay raw junction count.

## 8. Kết luận D1

D1 **đủ rõ để đưa ra phê duyệt nghiệp vụ ở mức nguyên tắc**: `bookedCount` là counter occupancy hiện tại; lịch sử độc lập; AppointmentStatus và PaymentStatus không đồng nhất với occupancy; mọi multi-slot claim/release cần nhất quán và idempotent.

D1 **chưa đủ điều kiện coi là policy cuối hoặc dùng làm căn cứ triển khai** cho đến khi chủ dự án/giảng viên xác nhận các câu hỏi ở Mục 7, đặc biệt mapping các trạng thái có điều kiện, mốc consume/no-show, late payment, refund/cancel và quy tắc dữ liệu legacy. Các phần phụ thuộc D2, D5, D6, D7 và D10 phải được đồng thuận trước khi lập truth table triển khai. Không có nội dung nào trong tài liệu này được đánh dấu là đã phê duyệt.
