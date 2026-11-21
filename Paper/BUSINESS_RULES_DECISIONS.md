# Chốt thiết kế nghiệp vụ đặt khám và occupancy

**Mục đích:** làm căn cứ được chủ dự án/phụ trách nghiệp vụ phê duyệt trước khi bắt đầu triển khai cơ chế xử lý tranh chấp.  
**Trạng thái quyết định:** CHƯA ĐƯỢC PHÊ DUYỆT. Các cột “Đề xuất” là khuyến nghị để xem xét, không phải chính sách đã có hiệu lực.  
**Phạm vi kiểm tra:** năm tài liệu thiết kế và source code NovaCare hiện có; không sửa code, enum hay database, không chạy migration/benchmark.  
**Lưu ý phiên bản:** working tree có các file backend đang thay đổi. Kết luận source dưới đây áp dụng cho snapshot được đọc; cần đối chiếu commit/triển khai trước khi coi là mô tả production.

## 1. Kết luận cần phê duyệt trước khi code

1. `AppointmentStatus` không đủ để suy ra slot đang bị chiếm: các nhánh patient/admin/payment/expiry cập nhật counter khác nhau.
2. `PaymentStatus` là trạng thái giao dịch; nó không tự cấp hoặc giải phóng slot. Cần state machine riêng cho reservation/occupancy hoặc một predicate thống nhất đã được phê duyệt.
3. Luồng create là luồng duy nhất được quan sát thấy vừa khóa các slot vừa kiểm tra capacity trong transaction. Các writer khác chưa áp dụng cùng protocol.
4. Đề xuất ban đầu là: reservation bắt đầu chiếm slot khi create commit; hold có hạn 15 phút chờ xác nhận thanh toán; các trạng thái đã xác nhận/đã trả tiền tiếp tục giữ slot đến khi bị hủy hoặc tới khi lượt khám được tiêu thụ; terminal release chỉ một lần cho mọi slot. Tuy nhiên thời hạn hold, trạng thái nào chiếm capacity, và cách xử lý thanh toán muộn **phải được chủ dự án xác nhận** trước khi schema/API được chốt.
5. Không thêm giá trị vào enum hiện tại cho đến khi các quyết định ở mục 4–12 được duyệt. Migrations ở mục 7 chỉ là danh sách thiết kế.

## 2. Enum hiện có và ý nghĩa occupancy

### 2.1 AppointmentStatus

Nguồn: [schema.prisma](./nova-care-backend/prisma/schema.prisma#L26).

| Giá trị | Hành vi occupancy hiện quan sát được | Đề xuất nghiệp vụ (chờ duyệt) |
|---|---|---|
| `PENDING` | `create()` chính đặt `AWAITING_PAYMENT`, nhưng `PENDING` được cho phép bắt đầu thanh toán và hủy. Query overlap của create/reschedule xem `PENDING` là trạng thái đang xung đột. Không có một quy tắc counter riêng theo status. | Nếu appointment `PENDING` đã có reservation hợp lệ thì chiếm capacity; nếu chỉ là draft chưa claim slot thì không được chiếm. Cần xác định liệu trạng thái này có còn dùng cho booking hay là dữ liệu legacy. |
| `AWAITING_PAYMENT` | Create increment count và tạo hold; patient cancel release slot junction; expiry release slot chính. | Chiếm capacity trong thời gian hold còn hiệu lực. Hết hạn chỉ release sau transition nguyên tử và theo chính sách payment muộn. |
| `CONFIRMED` | `confirm()` chỉ đổi status, không đổi count; reschedule/cancel cho phép trạng thái này. | Tiếp tục chiếm capacity cho toàn bộ slot membership đến cancel/consume. |
| `PAID` | VNPay IPN và endpoint giả lập đổi appointment sang `PAID`, không đổi count; patient reschedule/cancel cho phép. | Tiếp tục chiếm capacity nếu reservation hợp lệ; không để status `PAID` một mình chứng minh đã được cấp suất khi callback đến muộn. |
| `COMPLETED` | `complete()` đổi status nhưng không decrement counter; query overlap loại trừ `COMPLETED`. | Không còn là occupancy tương lai sau khi lượt khám kết thúc; nếu `bookedCount` được định nghĩa là live occupancy, giải phóng/consume theo transaction sau giờ khám. Lịch sử vẫn giữ qua appointment, không dựa vào counter. Cần xác nhận thời điểm consume. |
| `CANCELLED` | Patient cancel cập nhật appointment và giảm mọi junction. Hospital-admin cancellation dùng CAS nhưng chỉ giảm slot chính. `AdminAppointmentsService.updateStatus()` đổi status nhưng không release counter trong nhánh status tổng quát. | Không chiếm capacity sau một transition hủy thành công; mọi kênh dùng chung release idempotent cho toàn bộ membership. Chính sách refund độc lập với việc release. |
| `EXPIRED` | Expiry sweep chọn `AWAITING_PAYMENT` quá hạn, đổi status và giảm slot chính; overlap query loại trừ `EXPIRED`. | Không chiếm capacity sau khi expiry transition thành công; release tất cả slot đúng một lần. |
| `NO_SHOW` | Status có thể được đặt từ các API quản trị; các luồng được đọc không giảm counter. Query overlap của create/reschedule hiện không loại trừ `NO_SHOW`. Có luồng revert thành `PAID` hoặc `CONFIRMED`. | Chỉ chuyển thành terminal sau giờ hẹn/đủ điều kiện; quyết định có giải phóng counter hay giữ historical count phải phụ thuộc định nghĩa counter. Đề xuất không dùng counter live làm thống kê no-show. |
| `FAILED` | Có trong enum và generic admin status update; không thấy một transition nghiệp vụ thống nhất cho occupancy. Payment có status `FAILED` riêng, không đồng nghĩa tự động với `AppointmentStatus.FAILED`. | Chỉ release nếu reservation được chuyển tường minh sang released. Cần phân biệt payment failure có thể retry với appointment failure đã đóng. |
| `REFUNDED` | Có trong enum appointment và payment; không thấy refund transition chung giải phóng slot. Hospital-admin cancellation không cho hủy từ appointment `REFUNDED`. | Refund là kết quả tài chính, không tự kết luận lịch đã hủy/slot được giải phóng. Chỉ release khi có transition lịch riêng được phép. Cần chốt liệu appointment `REFUNDED` có hợp lệ như trạng thái độc lập không. |

**Quan sát:** bảng này không thể rút gọn thành một ánh xạ status → occupies hiện hành. Counter hiện được cập nhật theo từng luồng cụ thể, không theo một state machine duy nhất.

### 2.2 PaymentStatus

Nguồn: [schema.prisma](./nova-care-backend/prisma/schema.prisma#L39), model [PaymentTransaction](./nova-care-backend/prisma/schema.prisma#L420).

| Giá trị | Hành vi hiện tại | Đề xuất/chờ duyệt |
|---|---|---|
| `PENDING` | Payment URL tạo/upsert payment transaction `PENDING`. | Không tự thay đổi occupancy; appointment reservation mới quyết định giữ slot. |
| `PROCESSING` | Có trong enum; không thấy trong callback flow đã đọc. | Chỉ phản ánh tiến trình nhà cung cấp; giữ reservation theo appointment/expiry policy. Xác minh có provider/API nào dùng trạng thái này. |
| `PAID` | IPN success và simulate-success ghi payment PAID và appointment PAID. IPN không kiểm tra appointment state/expiry trước khi chuyển PAID. | Payment captured ≠ tự động có capacity. Cần policy timestamp, re-claim và refund/review khi slot đã bán lại. |
| `FAILED` | IPN failure ghi payment FAILED; đoạn này không chuyển appointment sang FAILED và không release slot. | Giữ hold đến hết hạn hoặc kết thúc sớm theo retry/payment policy đã duyệt. |
| `REFUNDED` | Có trong enum; chưa thấy đường refund được đối chiếu ở luồng này. | Không tự kết luận appointment bị hủy; yêu cầu payment event và appointment transition riêng. |
| `EXPIRED` | Có trong enum; chưa thấy IPN/payment flow được khảo sát ghi trạng thái này. | Cần phân biệt payment attempt hết hạn với appointment reservation hết hạn. |

**Bất biến đề xuất:** `PaymentStatus` không được dùng thay cho trạng thái reservation; mọi callback chỉ cập nhật appointment/occupancy qua command transition sau khi đọc trạng thái mới nhất trong transaction.

### 2.3 SlotStatus

Nguồn: [schema.prisma](./nova-care-backend/prisma/schema.prisma#L123); logic chuẩn hóa tại [slot-status.service.ts](./nova-care-backend/src/modules/schedules/slot-status.service.ts#L13).

| Giá trị | Ý nghĩa hiện có | Quy tắc cần chốt |
|---|---|---|
| `AVAILABLE` | `create()` chỉ nhận slot có status này và `bookedCount < capacity`. `getAvailableSlots()` lọc `isAvailable`, `isActive`, count nhưng không lọc trực tiếp `status`. | Chỉ nhận booking nếu status chuẩn hóa là AVAILABLE và còn capacity; API đọc slot phải dùng cùng predicate. |
| `FULL` | `resolveStatus()` trả khi count >= capacity. | Không claim thêm chỗ. Khi release, tính lại status trong cùng transaction; không gán `AVAILABLE` vô điều kiện. |
| `BLOCKED` | Schedule exception/manual state; helper cũng coi `!isAvailable` là blocked. | Ngăn reservation mới; block không tự hủy reservation đã có. Nếu đang có reservation, quy tắc chuyển `CONFLICTED`/giải quyết vận hành phải được xác nhận. |
| `CONFLICTED` | Helper trả khi slot inactive nhưng count > 0. | Giữ reservation hiện hữu và cấm booking mới; đưa vào hàng đợi xử lý của quản trị viên. Cần xác nhận nếu muốn auto-cancel/refund thay vì giữ. |
| `CANCELLED` | Helper trả khi slot inactive và count bằng 0. | Slot ngừng nhận booking; đây không phải trạng thái hủy từng appointment. |

`isAvailable` là boolean song song với enum. `updateSlot()` có thể cập nhật boolean mà không gọi `resolveStatus`; danh sách public slot dùng boolean/count, còn create kiểm tra enum AVAILABLE. Cần invariant đồng bộ `status`/`isAvailable` để không hiển thị slot mà lệnh create sẽ từ chối.

## 3. Quyết định nghiệp vụ theo chủ đề

Mỗi hàng dưới đây trình bày hiện trạng, rủi ro, lựa chọn, khuyến nghị và phần chờ phê duyệt. Không có hàng nào được coi là quyết định cuối cùng cho đến khi cột cuối được chủ dự án xác nhận.

### D1. Trạng thái nào chiếm capacity?

- **Hiện trạng:** create chiếm count ở `AWAITING_PAYMENT`; confirm/paid không đổi count; cancel/expiry có các cơ chế release riêng; `COMPLETED`, `NO_SHOW`, `FAILED`, `REFUNDED` không ánh xạ đồng nhất. `findOne()` của slot lọc primary appointments bằng cách chỉ loại `CANCELLED` và `EXPIRED`, khác với query overlap.
- **Rủi ro:** không thể tính occupancy chính xác chỉ từ AppointmentStatus; channel khác nhau có thể cùng status nhưng counter khác.
- **Phương án:**
  1. Quy định một tập AppointmentStatus chiếm capacity, dùng trong mọi query/mutation.
  2. Thêm lifecycle reservation độc lập với appointment/payment status.
  3. Tính capacity hoàn toàn từ các booking đang hiệu lực, bỏ counter.
- **Đề xuất:** phương án 2; `HELD` và `BOOKED` chiếm, `RELEASED` không chiếm, `CONSUMED` là terminal/history. Counter có thể tiếp tục làm projection đồng bộ trong transaction. Mô hình reservation là khái niệm, không nhất thiết thêm enum ngay.
- **Chủ dự án phải xác nhận:** trạng thái `PENDING`, `AWAITING_PAYMENT`, `CONFIRMED`, `PAID`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `NO_SHOW`, `FAILED`, `REFUNDED` map vào reservation lifecycle nào; thời điểm consume.

### D2. Bắt đầu và kết thúc hold

- **Hiện trạng:** `create()` đặt `AWAITING_PAYMENT` và `expiresAt = Date.now() + 15 phút` bên trong transaction; counter tăng trước khi trả kết quả. Expiry truy vấn `expiresAt < now`, không phải `<=`.
- **Rủi ro:** response/commit xảy ra sau timestamp bắt đầu; thời điểm biên `expiresAt == now` chưa bị expiry query chọn; chưa xác nhận expiry worker thật sự được kích hoạt; retry payment và expiry có thể đua nhau.
- **Phương án:** bắt đầu từ tạo record; từ khi trả URL thanh toán; từ khi payment session khởi tạo; hoặc hold tổng cố định từ commit. Hết hạn theo `now > expiresAt` hoặc `now >= expiresAt`, có/không grace period.
- **Đề xuất:** hold bắt đầu khi transaction create commit thành công; `expiresAt` là thời điểm hết hạn, tại equality coi là đã hết (`expiresAt <= now`), và mọi request payment/expiry dùng cùng một clock/điều kiện. Dùng TTL 15 phút chỉ như giá trị hiện hành cần phê duyệt; xác định có gia hạn không.
- **Chủ dự án phải xác nhận:** 15 phút có tiếp tục dùng; bắt đầu ở create hay payment session; equality/grace; có retry/gia hạn, và khi payment đang `PROCESSING` có đóng băng expiry không.

### D3. Hủy lịch và giải phóng slot

- **Hiện trạng:** patient cancel cho phép `PENDING`, `AWAITING_PAYMENT`, `CONFIRMED`, `PAID`; với appointment không phải awaiting payment yêu cầu trước giờ khám ít nhất 2 giờ; chặn nếu medical encounter đã được tiếp nhận. Trong transaction update status thường, sau đó release toàn junction (fallback slot chính) bằng read + absolute set `max(0,count-1)`. Hospital-admin yêu cầu lý do, dùng CAS, nhưng decrement slot chính. Admin generic status update có thể đặt CANCELLED nhưng không decrement slot.
- **Rủi ro:** double cancel/release, mất increment đồng thời, appointment multi-slot rò capacity, khác kết quả giữa kênh; refund không liên kết tường minh với hủy.
- **Phương án:** hủy luôn nếu chưa bắt đầu; áp dụng deadline/role; cho admin override có lý do; refund độc lập hoặc tự động.
- **Đề xuất:** hủy là idempotent state transition; chỉ winner của transition từ occupying sang RELEASED decrement đúng một lần từng membership trong cùng DB transaction. Giữ deadline 2 giờ làm policy ứng viên, không áp dụng mặc định cho admin; mọi override audit. Refund là workflow riêng, không trì hoãn giải phóng slot sau khi hủy hợp lệ.
- **Chủ dự án phải xác nhận:** deadline patient; unpaid exception; vai trò/override; hủy khi encounter tồn tại; refund, phí hủy và thông báo.

### D4. Đổi lịch

- **Hiện trạng:** chỉ `CONFIRMED`/`PAID` được reschedule. Slot mới đọc/kiểm capacity ngoài transaction. Transaction decrement old primary, increment new primary, cập nhật `Appointment.slotId`; không cập nhật `AppointmentSlotBooking`. Với appointment multi-slot, junction có thể tiếp tục trỏ slot cũ.
- **Rủi ro:** overbooking target, lost update, count âm/drift, stale availability, multi-slot membership không đúng, bệnh nhân mất lịch cũ nếu quy trình không nguyên tử (hiện transaction giúp cặp counter và appointment cùng commit nhưng không sửa junction).
- **Phương án:** chuyển reservation trước-sau nguyên tử và rollback về lịch cũ khi target không đủ; hoặc hủy lịch cũ rồi tạo booking mới (có nguy cơ mất suất).
- **Đề xuất:** giữ lịch cũ cho đến khi toàn bộ slot đích được khóa/claim thành công; một transaction khóa appointment rồi hợp các slot cũ/mới theo thứ tự toàn cục; cập nhật membership theo hiệu tập; chỉ commit sau khi capacity từng slot đích đạt.
- **Chủ dự án phải xác nhận:** reschedule paid có giữ paid status; thay đổi giá/refund; reschedule gần giờ khám; có thể đổi duration/service/room mode không; appointment multi-slot có được đổi sang cửa sổ mới cùng duration không.

### D5. Multi-slot

- **Hiện trạng:** create dùng duration dịch vụ (mặc định 30 phút) và slot cơ sở 15 phút; tạo junction và tăng count tất cả slot trong transaction. Patient cancel release junction. Expiry và hospital-admin cancel chỉ update slot chính. Reschedule chỉ update primary slot và không sửa junction.
- **Rủi ro:** mỗi luồng giải phóng/đổi có thể để occupancy giả ở slot phụ hoặc junction không khớp với appointment.
- **Phương án:** mô hình một reservation aggregate với slot membership; hoặc appointment riêng cho từng đoạn nhưng liênակցուած group.
- **Đề xuất:** một appointment/reservation chiếm một tập slot liền nhau; claim/release/expiry/reschedule xử lý toàn bộ tập trong một transaction. Mọi slot trong tập phải đủ capacity. Membership là nguồn kiểm toán; `slotId` là primary/start reference, không phải toàn bộ membership.
- **Chủ dự án phải xác nhận:** granularity 15 phút; duration/rounding; capacity khác nhau giữa các slot; cách chọn cửa sổ khi có lỗ; quy tắc phòng/dịch vụ clinic room.

### D6. Thanh toán muộn và callback trùng

- **Hiện trạng:** IPN kiểm tra chữ ký và transaction đã PAID; success cập nhật payment và appointment PAID trong transaction nhưng không kiểm tra status/expiry/capacity. Callback duplicate check PAID xảy ra trước transaction. Simulate-success public cập nhật payment/appointment PAID mà không gate theo status/expiry. Failure IPN cập nhật payment FAILED nhưng không release appointment hold.
- **Rủi ro:** callback muộn có thể đổi `EXPIRED`/`CANCELLED` thành `PAID`; callback trùng đồng thời có thể qua precheck; appointment PAID không chứng minh slot còn được giữ; hold có thể tồn tại sau payment failure theo policy chưa rõ.
- **Phương án:**
  1. Chỉ chấp nhận nếu callback đến trước expiry (arrival-time policy).
  2. Chấp nhận nếu provider xác nhận `paid_at <= expiresAt`, dù IPN đến trễ, nếu có thể claim lại toàn bộ slot.
  3. Nếu không claim được hoặc payment sau hạn, không cấp lịch; đưa refund/manual review.
- **Đề xuất:** idempotency theo provider transaction/event ID; xử lý theo một transaction khóa appointment và mọi slot. Dùng timestamp settlement được provider xác thực nếu provider thực sự cung cấp. Nếu hết hạn nhưng toàn bộ slot vẫn còn claimable, có thể re-claim theo policy; nếu đã cấp lại, không overbook—đưa khoản thu vào refund/review. Không tự chuyển lịch thành PAID booking chỉ vì nhận callback.
- **Chủ dự án phải xác nhận:** source timestamp đáng tin; grace period; ưu tiên slot nếu paid trước hạn nhưng callback sau; xác nhận phản hồi IPN khi đã thu tiền nhưng không cấp được lịch; endpoint simulate có chỉ ở demo/test.

### D7. Refund hoặc manual review

- **Hiện trạng:** enum có `PaymentStatus.REFUNDED` và `AppointmentStatus.REFUNDED`; đoạn payment được kiểm tra chưa có workflow refund/reconciliation tương ứng. Patient cancel chỉ thông báo “liên hệ” nếu đã thanh toán.
- **Rủi ro:** payment và booking status có thể diverge; thiếu tracking retry, provider refund ID, người xử lý, SLA và audit.
- **Phương án:** tự refund ngay; manual review; thử re-claim trước rồi tự refund nếu thất bại; hoặc phối hợp theo từng provider.
- **Đề xuất:** state machine payment/refund riêng và durable outbox/manual-review queue; không giữ DB transaction mở khi gọi provider. Cho phép auto-refund chỉ sau khi provider/API hỗ trợ idempotency và có reconciliation; nếu không, tạo case review có audit. Appointment reservation release độc lập, không chờ refund xong.
- **Chủ dự án phải xác nhận:** auto hay manual; thời gian/SLA; full/partial refund; trạng thái appointment khi refund; quyền/phê duyệt; hành vi khi refund provider lỗi.

### D8. Lịch trùng cùng bệnh nhân

- **Hiện trạng:** create/reschedule query overlap theo `patientProfileId` trong transaction nhưng không khóa patient/profile hoặc DB constraint bảo đảm hai request ở slot khác nhau không cùng lọt. Cả hai loại trừ CANCELLED/EXPIRED/COMPLETED; do đó NO_SHOW/FAILED/REFUNDED vẫn được tính overlap. Query dựa trên appointment.slot primary interval, không chắc chắn xét mọi `slotBookings` của duration dài.
- **Rủi ro:** hai request đồng thời qua query; chính sách các status không rõ; multi-slot overlap có thể bỏ qua nếu primary duration không diễn đạt đầy đủ.
- **Phương án:** hard block overlap; warning/cho phép; block chỉ cho active reservations; áp dụng theo profile hoặc theo user (mọc bệnh nhân phụ thuộc user).
- **Đề xuất:** hard block các time interval giao nhau cho cùng patient profile, tính toàn bộ interval/slot membership; chỉ các reservation đang occupying mới ngăn lịch mới; serialize check theo patient profile trong transaction. Đây là mặc định an toàn lâm sàng nhưng ảnh hưởng đặt cho người phụ thuộc nên cần duyệt.
- **Chủ dự án phải xác nhận:** profile hay user; có áp dụng cho dependent profiles chung user; `AWAITING_PAYMENT` có block; grace/no-show/terminal states; cho phép override bởi cơ sở không.

### D9. Giảm capacity, khóa hoặc vô hiệu slot

- **Hiện trạng:** `updateSlot()` đọc slot trước transaction; từ chối giảm capacity dưới `bookedCount` tại snapshot nhưng check/update không nguyên tử; có thể đặt `isAvailable` trực tiếp và `isActive`. SlotStatusService có `CONFLICTED` khi inactive và count > 0, nhưng updateSlot không gọi resolver. Public availability lọc isAvailable/active/count, không lọc status; create thì yêu cầu `status=AVAILABLE`.
- **Rủi ro:** race với create; `isAvailable=true` và `status=BLOCKED` có thể làm API public quảng bá giờ mà create từ chối; block/lower capacity có thể xung đột với hold đang hoạt động.
- **Phương án:** reject mọi giảm dưới occupancy; cho giảm nhưng giữ bookings cũ và block booking mới; force-cancel các booking dư theo ưu tiên/thời gian; hard block chỉ sau di chuyển/refund.
- **Đề xuất:** slot update transaction khóa hàng, so capacity với active occupancy (không tin count có thể lệch); từ chối capacity thấp hơn occupied. Block/disable ngăn claim mới nhưng không hủy các reservation hiện có; đánh dấu xung đột và yêu cầu xử lý/audit. Tất cả read/write dùng một resolver thống nhất.
- **Chủ dự án phải xác nhận:** giảm capacity có ngoại lệ không; block giờ đang đặt được xử lý thế nào; ai được thao tác; quy tắc ưu tiên nếu cần chuyển/hủy booking; trạng thái hiển thị.

### D10. Reservation release, completion và no-show

- **Hiện trạng:** `complete()` cập nhật COMPLETED nhưng không giảm count; status quản trị NO_SHOW cũng không release; revert no-show trở về PAID/CONFIRMED. Dữ liệu lịch sử nằm trong Appointment/StatusHistory, không có reservation lifecycle field.
- **Rủi ro:** nếu bookedCount là current occupancy thì terminal states làm counter lưu lại; nếu là count lịch sử thì không thể dùng nó như capacity còn trống và semantics tên trường dễ gây nhầm.
- **Phương án:** counter là active occupancy, giảm khi hủy/expiry/consume; hoặc counter là cumulative bookings và tính capacity bằng active ledger riêng.
- **Đề xuất:** định nghĩa `bookedCount` là số reservation đang chiếm slot; chuyển sang `CONSUMED` và giảm count khi lượt khám kết thúc hoặc no-show được xác nhận sau thời điểm slot, giữ appointment/status history làm lịch sử. Có thể dùng aggregate riêng thay đổi nghĩa cột nếu tương thích dữ liệu không đảm bảo.
- **Chủ dự án phải xác nhận:** thời điểm appointment ngừng chiếm capacity; no-show có giữ chỗ đến hết slot/grace; có báo cáo hiện dùng bookedCount như số lịch đã đặt hay không.

## 4. Mapping API/service hiện tại sang BookingCommandService dự kiến

BookingCommandService là **service ứng dụng nội bộ đề xuất**, không nhất thiết là endpoint mới hoặc microservice. Các endpoint có thể giữ hợp đồng HTTP trong giai đoạn migration nhưng phải chuyển tất cả mutation occupancy qua command tương ứng. Những handler chỉ đọc không cần command.

| Endpoint/service hiện tại | Hành vi hiện tại | Command/handler tương lai | Ghi chú chuyển đổi |
|---|---|---|---|
| `POST /api/v1/appointments` → `AppointmentsService.create()` | Hold AWAITING_PAYMENT; khóa và claim nhiều slot trong transaction. | `createBooking(command, actor)` | Giữ API tương thích trước; thống nhất idempotency replay, profile lock nếu policy overlap được duyệt, update counter guarded. |
| `PATCH /api/v1/appointments/:id/reschedule` → `AppointmentsService.reschedule()` | Đổi primary slot; counter old/new, không cập nhật junction. | `rescheduleBooking(command, actor)` | Claim toàn bộ cửa sổ đích trước khi release; cập nhật membership và count trong một transaction. |
| `PATCH /api/v1/appointments/:id/cancel` → `AppointmentsService.cancel()` | Patient policy/deadline; release junction qua read-then-write. | `cancelBooking(command, actor)` | CAS reservation state; release toàn bộ membership đúng một lần; refund qua workflow riêng. |
| `PATCH /api/v1/appointments/:id/confirm` → `AppointmentsService.confirm()` (endpoint `@Public`) | Đổi AWAITING_PAYMENT sang CONFIRMED không kiểm payment row/expiry. | `confirmBooking(command, source)` hoặc bỏ route nếu không còn cần | Chỉ transition theo policy; xác minh thanh toán/quyền; cân nhắc publicness. |
| `POST /api/v1/appointments/expire-pending` → `expirePendingAppointments()` | Sweep expiry; update appointment và decrement slot chính; endpoint ở controller đã có JWT guard cấp lớp nhưng không thấy role check ở method. | `expireDueReservations(batch)`; internal worker/scheduler | Không public API tùy tiện; lock/CAS, mọi memberships, retry; idempotent multi-worker. |
| `POST /api/v1/payments/create` → `PaymentsService.createPaymentUrl()` | Đọc appointment, cho phép PENDING/AWAITING_PAYMENT, upsert PaymentTransaction. | `validatePaymentAttempt()` (không claim/release) + payment adapter | Kiểm tra reservation active, ownership/amount/idempotency theo policy; không thay occupancy khi tạo URL. |
| VNPay `GET/POST /api/v1/payments/vnpay-ipn` → `handleIpn()` | Check chữ ký; cập nhật payment; success đặt appointment PAID. | `applyPaymentEvent(event)` | Adapter xác thực provider; command transition khóa appointment/slots; chống duplicate và late payment theo D6. |
| `POST /api/v1/payments/simulate-success` → `simulatePaymentSuccess()` (public) | Ghi PAID cho appointment qua đường mô phỏng; không gate hold/expiry. | `applyPaymentEvent()` chỉ trong test/demo adapter | Không cho phép production path bỏ qua cùng state machine; disable/guard theo deployment policy. |
| `PATCH /api/v1/admin/appointments/:id/status` → `AdminAppointmentsService.updateStatus()` | Generic status write; nhánh CANCELLED không release occupancy trong service đã đọc. | `changeAppointmentState(command, adminActor)` | Whitelist transitions; nếu transition ảnh hưởng occupancy, gọi cancel/release hoặc payment/consume command. |
| `PATCH /api/v1/hospital-admin/appointments/:id/status` → `HospitalAdminService.updateAppointmentStatus()` | CANCELLED có CAS và decrement slot chính; các status khác update trạng thái. | `changeAppointmentState(command, hospitalActor)` | Giữ scope hospital authorization; giải phóng toàn junction; audit actor/reason; không cho direct generic occupancy writes. |
| `PATCH /api/v1/appointments/:id/complete` → `AppointmentsService.complete()` | Chuyển COMPLETED, tạo encounter; không decrement count. | `completeBooking(command, actor)` | Thực hiện consume/release nếu policy D10 được duyệt; clinical side effects/outbox đồng bộ theo yêu cầu. |
| Admin NO_SHOW / revert NO_SHOW handlers → các service status hiện tại | Ghi NO_SHOW hoặc khôi phục PAID/CONFIRMED; occupancy semantics không rõ. | `changeAppointmentState()` / `restoreNoShow()` | Chỉ gọi occupancy transition nếu chính sách quy định; preserve audit & eligibility. |
| `PATCH /api/v1/appointment-slots/:id` → `AppointmentSlotsService.updateSlot()` | Sửa capacity/isAvailable/isActive; đọc/ghi không cùng lock, status không luôn resolve. | `updateSlotPolicy(command, adminActor)` | Tách policy/schedule từ booking; khóa slot, tính occupancy và resolver status đồng nhất. |
| `AppointmentSlotsService.updateBookedCount()` | Đọc rồi tính rồi ghi absolute count; chưa tìm thấy call site trong controller/service được khảo sát. | Không public/không gọi từ feature; chỉ internal `claimSlots`/`releaseSlots` | Loại bỏ đường ghi count độc lập trong quá trình triển khai (source change cần phê duyệt riêng). |
| `GET /api/v1/appointment-slots/available` | Đọc slot dùng isAvailable/active/count, không filter status enum trực tiếp. | Không phải command; `AvailabilityQueryService` | Dùng cùng eligibility predicate; dữ liệu đọc chỉ là snapshot, phải claim qua command. |

Nguồn controller: [appointments.controller.ts](./nova-care-backend/src/modules/appointments/appointments.controller.ts#L24), [payments.controller.ts](./nova-care-backend/src/modules/payments/payments.controller.ts#L34), [admin-appointments.controller.ts](./nova-care-backend/src/modules/admin/admin-appointments.controller.ts#L98), [hospital-admin.controller.ts](./nova-care-backend/src/modules/hospital-admin/hospital-admin.controller.ts#L143), [appointment-slots.controller.ts](./nova-care-backend/src/modules/appointment-slots/appointment-slots.controller.ts#L81).

## 5. DB migration cần thiết (chỉ mô tả)

Không chạy migration và không chỉnh sửa `schema.prisma` trong giai đoạn này. Chốt policy và audit dữ liệu trước khi chọn thứ tự migration.

### M0 — Data inventory, không thay schema

- Kiểm kê status/count/membership/payment hiện có; tìm `bookedCount < 0`, `bookedCount > capacity`, slot membership khác slot primary, appointment terminal nhưng count còn giữ.
- Tính occupancy candidate theo từng phương án trạng thái; không tự sửa dữ liệu trước khi chủ nghiệp vụ chọn predicate.
- So sánh chênh lệch count với appointment-slot junction và ghi báo cáo backfill.

### M1 — Lifecycle reservation (cần quyết định schema)

- **Khuyến nghị cần thẩm định:** thêm một trạng thái lifecycle reservation ở cấp appointment/aggregate, độc lập với `AppointmentStatus`/`PaymentStatus`, ví dụ khái niệm `HELD`, `BOOKED`, `RELEASED`, `CONSUMED`; chưa chốt tên/enum/value.
- Thêm timestamp/reason cho release/consume, hoặc bảng reservation riêng có version và audit fields. Vì một appointment multi-slot phải release nguyên tử, lifecycle ở aggregate là đơn giản nhất; không tạo một release state lệch nhau trên từng membership trừ khi nghiệp vụ cần phân bổ partial.
- Quyết định `expiresAt` có thể dùng lại cho hold nếu không có payment-session expiry khác; không thêm trường trùng trước khi rà soát semantics.

### M2 — Idempotency command

- `Appointment.idempotencyKey` đã có unique nullable constraint. Đánh giá việc bổ sung payload hash, actor scope, request status/result reference hoặc bảng `IdempotencyRequest` để cùng key khác payload/actor không bị trả lại nhầm appointment.
- Thêm unique constraint phù hợp cho provider event/transaction identity; hiện có `PaymentTransaction.transactionCode` unique và `appointmentId` unique, nhưng không thấy bảng event ledger cho callback trùng/khác event.

### M3 — Payment event / refund review ledger

- Nếu provider callback có event ID/retry semantics, lưu event ID unique, verified reference, provider settlement time, amount/currency, raw/normalized result và processed state; hạn chế giữ dữ liệu callback nhạy cảm theo policy.
- Nếu refund/manual review được duyệt, thêm các trường hoặc bảng case để lưu refund request/provider ID, idempotency key, amount, status, reason, retry timestamps, reviewer/audit. Không suy diễn `AppointmentStatus.REFUNDED` là đủ để mô tả ledger tài chính.

### M4 — Transactional outbox

- Thêm bảng outbox với unique event ID, aggregate/type/version, payload tối thiểu, created/published/attempt metadata và index cho pending events.
- Outbox row phải được insert trong cùng transaction với lifecycle/occupancy update. Dispatcher/queue worker và dedupe thuộc migration + application deployment theo thứ tự tương thích.

### M5 — Invariant và index database

- Sau khi reconciler xác nhận dữ liệu, thêm CHECK `capacity > 0`, `bookedCount >= 0`, `bookedCount <= capacity` (nếu counter được chốt là active occupancy). Xác minh DDL support/online deployment và xử lý row lỗi trước.
- Index batch expiry (ví dụ composite appointment status/expiry) và indexes cho reservation membership/ledger/reconciliation dựa trên query plan; không thêm index chỉ theo phỏng đoán.
- Unique constraints cần thiết cho reservation membership và idempotency/provider event; giữ unique hiện có `(appointmentId, slotId)`.
- Counter vẫn phải cập nhật trong transaction; CHECK constraint không chống double-release logic.

### M6 — Backfill, cutover, rollback

- Tạo migration/backfill theo batch, không giữ lock bảng dài; xác định nguồn occupancy và xử lý appointment không rõ state bằng manual review.
- Dual-read hoặc shadow reconciliation trước khi chuyển writer; tránh dual-write hai nguồn sự thật kéo dài.
- Cutover mọi writer (patient/admin/hospital/payment/expiry/slot policy) sang command path; chỉ sau đó bật DB CHECK constraints.
- Có rollback plan: giữ enum cũ tương thích, không drop dữ liệu lịch sử; rollback application không được đưa writer cũ vào đường gây drift.

## 6. Kiểm tra tính nhất quán giữa 5 tài liệu thiết kế

Không thấy khuyến nghị kỹ thuật cốt lõi nào đối nghịch nhau: năm tài liệu cùng chọn PostgreSQL là authority, dùng row locks + CAS/conditional update, đưa writer về một command path, xử lý multi-slot nguyên tử, coi Redis/queue/realtime là phụ trợ, và chưa đưa ra số liệu benchmark. Tuy nhiên có các **khoảng chưa chốt** cần xử lý trước khi gọi là “thiết kế cuối cùng”:

| Vị trí | Khoảng thiếu / điểm có thể hiểu khác nhau | Cách làm rõ đề xuất |
|---|---|---|
| [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md#4-invariants-và-chính-sách-cần-xác-nhận), mục 4; [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md#2-định-nghĩa-occupancy-tách-khái-niệm-khỏi-appointment-status), mục 2 | `HELD/BOOKED/RELEASED/CONSUMED` là mô hình khái niệm, nhưng chưa map từng enum AppointmentStatus và PaymentStatus. | Dùng bảng state mapping ở mục 2 của tài liệu này làm checklist duyệt; không tạo enum mới trước khi map xong. |
| [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md#3-truth-table-cần-khóa-trước-test), truth table | Hầu hết trạng thái chiếm capacity vẫn “cần xác nhận”, vì vậy oracle/criteria correctness chưa thể tính occupancy tuyệt đối. | Phê duyệt truth table trước khi chạy E1–E15; nếu chưa, test chỉ kiểm tra cơ chế kỹ thuật theo từng policy variant, không kết luận nghiệp vụ. |
| [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md#4-luồng-lệnh), expiry step 2 | Gợi ý expiry `expiresAt <= now`, trong khi source hiện `expiresAt < now`. Chưa nêu tường minh thời điểm equality là hết hạn ở tất cả tài liệu. | Chọn một rule duy nhất; khuyến nghị `<=` và thêm boundary test. |
| [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md#3-thứ-tự-khóa-và-transaction-chung), mục 3, và mục 7; [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md#2-ma-trận-kịch-bản), E3/E5 | Thiết kế nói multi-slot membership cập nhật nguyên tử, nhưng E3/E5 chưa nói rõ oracle phải xác minh junction của reschedule đổi đúng tập slot; E3 tập trung create. | Bổ sung tiêu chí E5/E6 kiểm membership cũ/mới và mọi slot liên quan; kiểm expiry/admin cancellation multi-slot riêng. |
| [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md#6-thanh-toán-callback-muộn-cần-xác-nhận), callback step 1 | Nói cần xác minh amount/currency/event identity, nhưng chưa chốt failure handling/response semantics với provider khi callback hợp lệ nhưng không cấp được slot. | Chủ dự án/provider owner duyệt truth table và response/IPN retry; lưu tiền đã thu vào ledger/review trước khi ACK. |
| [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md#5-hướng-khuyến-nghị), [TECHNOLOGY_COMPARISON.md](./TECHNOLOGY_COMPARISON.md#3-khuyến-nghị-kết-hợp) | Outbox được khuyến nghị cho notification/events; [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md#4-so-sánh-phương-án-thí-nghiệm) V1/V2/V3 không chỉ rõ outbox cố định ở mọi variant hay biến thử nghiệm riêng. | Khóa outbox behavior/config giống nhau trong comparison booking correctness; nếu nghiên cứu event latency thì thiết kế experiment riêng, không nhập vào Redis comparison. |
| [RESEARCH_CONTRIBUTIONS.md](./RESEARCH_CONTRIBUTIONS.md#3-giả-thuyết-nghiên-cứu-có-thể-kiểm-chứng), H4 | H4 nói Redis lock không tăng correctness nếu DB transaction/CAS là authority, có thể bị hiểu như kết quả đã biết thay vì giả thuyết. | Giữ nó là giả thuyết cần kiểm chứng; tuyên bố kết quả chỉ sau test failure/lease-expiry và đối chiếu related work. |
| [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md#3-thành-phần-hiện-có-và-đề-xuất) và [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md#8-outbox-queue-và-realtime) | Expiry scheduler đề xuất vừa có DB sweeper vừa có delayed queue; chưa xác định một trong hai là trigger chính và fallback. | Chốt DB sweeper là safety net/authority; delayed queue chỉ tối ưu wake-up, cả hai gọi cùng idempotent expiry command. |

### Kết quả kiểm tra consistency

- **Không có mâu thuẫn cứng** ở lựa chọn storage/locking/realtime hoặc benchmark claim.
- **Chưa đủ điều kiện gọi là business design final** cho đến khi các quyết định còn chờ được ký duyệt; các tài liệu hiện tại ghi rõ chưa triển khai/benchmark.
- Tài liệu audit trước đó có nhận xét về hủy admin theo snapshot. Tài liệu này đối chiếu source đang làm việc: hospital-admin cancellation có CAS và giảm slot chính; admin generic status update không release counter. Hai kênh khác nhau, không gộp thành một kết luận “admin không release”.
- Cần bổ sung rõ reschedule không đồng bộ `AppointmentSlotBooking` vào risk register/experiment plan trước triển khai; đây là phát hiện từ đối chiếu source hiện tại, có thể chưa được nêu đủ trong audit/design trước.

## 7. Danh sách quyết định cần chủ dự án trả lời

Để chuyển sang implementation, phê duyệt/điều chỉnh các mục sau:

| ID | Quyết định | Khuyến nghị đang ghi trong tài liệu | Trả lời chủ dự án |
|---|---|---|---|
| D1 | Enum status → reservation occupancy, gồm COMPLETED/NO_SHOW/FAILED/REFUNDED | Reservation lifecycle riêng; HELD/BOOKED chiếm, RELEASED không, CONSUMED terminal | Chờ xác nhận |
| D2 | Hold duration, bắt đầu/kết thúc, equality/grace, payment processing | Bắt đầu khi create commit; giữ TTL 15 phút chỉ nếu được duyệt; hết tại `expiresAt <= now` | Chờ xác nhận |
| D3 | Patient cancel deadline, unpaid exception, role override, encounter, refund | Idempotent release tất cả memberships; deadline 2h là ứng viên, admin override audit | Chờ xác nhận |
| D4 | Reschedule paid, fee/refund, deadline, đổi service/duration | Claim target toàn bộ trước; lỗi giữ slot cũ | Chờ xác nhận |
| D5 | Multi-slot granularity/capacity/hole/window/room | Một reservation aggregate, tất cả slot nguyên tử | Chờ xác nhận |
| D6 | Late payment timestamp/grace/slot sold again/IPN ACK | Không overbook; re-claim chỉ khi đủ toàn bộ slots; còn lại refund/review | Chờ xác nhận |
| D7 | Refund automation, manual review, SLA, trạng thái | Payment workflow riêng và durable/auditable; auto-refund có idempotency/reconciliation | Chờ xác nhận |
| D8 | Patient overlap scope/status/override | Block active overlap theo profile; serialize check | Chờ xác nhận |
| D9 | Capacity reduction/block with active reservations | Reject giảm thấp hơn occupied; block new reservations, honor existing, mark conflict | Chờ xác nhận |
| D10 | Complete/no-show consume/release và metric semantics | `bookedCount` là current occupancy; consume/release sau lượt khám | Chờ xác nhận |
| D11 | Có cần reservation lifecycle, event ledger, outbox, idempotency hash | Phê duyệt M1–M4 sau data audit | Chờ xác nhận |

## 8. Điều kiện cho phép bắt đầu triển khai

- D1–D10 được chủ nghiệp vụ/phụ trách thanh toán/phụ trách cơ sở xác nhận; D11 được owner backend/DB xác nhận.
- Có truth table trạng thái và callback/payment response contract.
- Có snapshot baseline/commit được dùng, các thay đổi chưa commit được phân loại.
- Hoàn tất inventory và reconciliation dữ liệu trước CHECK constraint hoặc backfill.
- Endpoint mapping bao phủ tất cả writer; không còn direct counter/status update bên ngoài command path.
- Kịch bản test correctness E1–E15 cập nhật oracle theo policy đã duyệt; benchmark được lên kế hoạch riêng sau correctness.

Tài liệu tham chiếu: [SYSTEM_ARCHITECTURE_AUDIT.md](./SYSTEM_ARCHITECTURE_AUDIT.md), [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md), [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md), [TECHNOLOGY_COMPARISON.md](./TECHNOLOGY_COMPARISON.md), [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md), [RESEARCH_CONTRIBUTIONS.md](./RESEARCH_CONTRIBUTIONS.md).
