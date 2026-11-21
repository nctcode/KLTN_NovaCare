# Ma trận phê duyệt chính sách nghiệp vụ NovaCare

**Mục đích:** chuyển rà soát D1–D10 thành các quyết định có chủ thể, bằng chứng, phụ thuộc và bước tiếp theo rõ ràng.  
**Trạng thái:** tài liệu chuẩn bị phê duyệt; không phải chính sách đã ban hành. Không có quyết định nào được đánh dấu `APPROVED`.  
**Baseline tham chiếu:** working tree được ghi nhận tại branch `develop`, HEAD `585dcd8db9d612b4d35d758fe7d285b4762298b6`; không khẳng định tương ứng production.  
**Phạm vi:** phân tích tài liệu/source và tạo ma trận; không sửa code/schema/migration, không truy cập/chỉnh database, không benchmark.

## 1. Mục tiêu và phạm vi

Tài liệu phân biệt bốn loại việc thường bị trộn lẫn:

1. **ARCHITECTURE PRINCIPLES:** các nguyên tắc kỹ thuật khuyến nghị thống nhất.
2. **BUSINESS POLICY APPROVAL:** lựa chọn chính sách cần đúng chủ thể nghiệp vụ/phụ trách dự án phê duyệt.
3. **TECHNICAL VERIFICATION:** sự kiện source, build, cấu hình, runtime, provider hoặc dữ liệu cần bằng chứng kỹ thuật.
4. **EXPERIMENTAL VALIDATION:** giả thuyết chỉ có thể kết luận bằng thử nghiệm có kiểm soát.

Đầu vào chính là [CONSOLIDATED_BUSINESS_POLICY_REVIEW.md](./CONSOLIDATED_BUSINESS_POLICY_REVIEW.md); đối chiếu thêm [BUSINESS_RULES_REVIEW_D1_D10.md](./BUSINESS_RULES_REVIEW_D1_D10.md), [D1_OCCUPANCY_POLICY_ANALYSIS.md](./D1_OCCUPANCY_POLICY_ANALYSIS.md), [BASELINE_AND_OCCUPANCY_INVENTORY.md](./BASELINE_AND_OCCUPANCY_INVENTORY.md), [IMPLEMENTATION_READINESS.md](./IMPLEMENTATION_READINESS.md), [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md), [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md), [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md). Các tài liệu đầu vào không có bằng chứng approval của người có thẩm quyền.

## 2. Cách sử dụng ma trận

- Mỗi dòng là một quyết định độc lập hoặc một verification/test có thể được giao cho chủ thể cụ thể.
- **Hiện trạng source** là mô tả code đã quan sát, không phải quy tắc được duyệt hay bằng chứng runtime production.
- `PROPOSED`: có khuyến nghị nhưng chưa quyết định có yêu cầu phê duyệt; chưa được áp dụng.
- `NEEDS_APPROVAL`: cần người/nhóm có thẩm quyền chọn hoặc xác nhận chính sách.
- `UNRESOLVED`: thiếu dữ kiện, mâu thuẫn hoặc còn phụ thuộc technical verification trước khi có thể đề nghị chốt.
- `APPROVED`: chỉ dùng khi có artifact rõ ràng ghi người/nhóm duyệt, nội dung, phiên bản và ngày hiệu lực. Hiện không có dòng nào mang trạng thái này.
- Technical verification chỉ dùng `VERIFIED` khi có bằng chứng cho đúng scope; nếu source đã xác minh nhưng runtime chưa xác minh, tách thành hai dòng thay vì gộp.
- Không cung cấp secret/token trong quá trình xác minh provider/deployment. Dùng cấu hình đã che thông tin nhạy cảm, metadata, logs đã sanitize hoặc xác nhận từ owner.
- Khi phê duyệt, ghi lại giá trị đã chọn, người/nhóm duyệt, ngày hiệu lực, ngoại lệ, policy version và liên kết artifact. Không sửa trạng thái ma trận thành `APPROVED` chỉ dựa trên trao đổi không truy vết được.

## 3. Nguyên tắc kiến trúc đề xuất

Các nguyên tắc dưới đây có căn cứ kỹ thuật để làm **phương án thống nhất**, nhưng chưa có artifact phê duyệt chính thức. Chúng không tự động trở thành yêu cầu triển khai hoặc business approval.

| ID | Nguyên tắc đề xuất | Căn cứ / giới hạn | Trạng thái |
|---|---|---|---|
| A1 | PostgreSQL là authority cho quyền claim/release capacity vì appointment, slot, membership và counter cùng nằm trong DB hiện tại. | Source có PostgreSQL/Prisma; deployment DB topology/runtime chưa xác minh. | `PROPOSED` |
| A2 | Tách appointment state, payment state và occupancy lifecycle; không suy ra occupancy từ riêng `AppointmentStatus`, `PaymentStatus`, counter hay raw junction count. | Nhiều writer hiện không đồng bộ; junction được giữ lại sau cancel/expiry. Lifecycle mới là khái niệm, chưa phải schema. | `PROPOSED` |
| A3 | Các thay đổi occupancy phải commit nguyên tử; lỗi giữa multi-slot update phải rollback toàn bộ. | Tận dụng PostgreSQL transaction; hiện chưa phải mọi writer đều dùng cùng transaction/protocol. | `PROPOSED` |
| A4 | Claim/release/reschedule/consume phải xử lý toàn bộ membership của một reservation multi-slot; không chỉ primary `slotId`. | Source create thường tạo junction đa slot, trong khi nhiều đường khác chỉ xử lý primary hoặc bỏ junction. | `PROPOSED` |
| A5 | Một transition từ occupying sang terminal chỉ giảm counter một lần; dùng serialization/CAS/guard, không clamp counter về 0 để che drift. | Thiết kế cần idempotency cho cancel, expiry, retry và callback duplicate. | `PROPOSED` |
| A6 | Mọi writer ảnh hưởng occupancy đi qua một command path nội bộ dùng chung; controller/kênh không tự increment/decrement. | BookingCommandService chưa tồn tại trong source. | `PROPOSED` |
| A7 | Dùng ordered row locks + transaction làm serialization baseline và conditional update/CAS làm guard sát dữ liệu; retry bounded cho lỗi DB phù hợp. | Hợp với kiến trúc PostgreSQL hiện tại; cần test và thiết kế cụ thể trước rollout. | `PROPOSED` |
| A8 | Redis/queue/realtime không quyết định suất; Redis lock không phải correctness authority mặc định. Queue/outbox chỉ xử lý hiệu ứng phụ sau commit. | Redis/BullMQ runtime chưa được xác minh; không có benchmark chứng minh cần Redis lock. | `PROPOSED` |
| A9 | Availability query chỉ là snapshot; chỉ kết quả commit của booking command mới xác nhận chỗ được cấp. | Cần áp dụng nhất quán ở mọi client/kênh. | `PROPOSED` |
| A10 | Lịch sử đặt khám/payment được giữ độc lập với live occupancy counter. | Phù hợp với mục tiêu D1; cách lưu/đối soát legacy chưa được quyết định. | `PROPOSED` |

## 4. Ma trận phê duyệt D1–D10

### 4.1 Quyết định chi tiết

| ID | Vấn đề cần quyết định | Hiện trạng trong source snapshot | Phương án đề xuất | Phương án thay thế và ưu/nhược điểm | Phụ thuộc | Hậu quả nếu chưa quyết định | Người/nhóm cần xác nhận | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| **D1.1** | Ý nghĩa của `bookedCount`; history có phụ thuộc counter không? | Writers tăng/giảm theo luồng khác nhau; complete/no-show không giảm; raw junction giữ lại sau release; không có occupancy ledger thống nhất. | `bookedCount` = reservation đang chiếm capacity hiện tại; history appointment/payment/status lưu độc lập. | **Cumulative count:** tiện thống kê lượt đặt nhưng không thể dùng trực tiếp kiểm tra capacity; cần nguồn active occupancy riêng. **Tính từ ledger không lưu counter:** tránh drift counter nhưng tăng query/locking cost, cần ledger chuẩn. | D1.2, D5, D10; inventory dữ liệu legacy. | Không có oracle cho backfill, counter constraints, availability hay test correctness. | Chủ sản phẩm/nghiệp vụ đặt khám + DBA/kiến trúc sư xác nhận semantics và cách báo cáo. | `NEEDS_APPROVAL` |
| **D1.2** | Trạng thái Appointment nào đi cùng trạng thái occupancy nào? | Create thường `AWAITING_PAYMENT`; confirm/paid đổi status không đổi counter; các path cancel/expiry/admin/refund khác nhau. Không có mapping tập trung. | Phê duyệt truth table tách biệt: chỉ reservation lifecycle quyết định occupying; appointment/payment status không tự claim/release. | Map trực tiếp từng AppointmentStatus sang occupying/not occupying: dễ đọc nhưng không diễn đạt được expiry/callback/revert/legacy một cách tin cậy. | D1.1, D2, D3, D6, D7, D10. | Không thể xác định record nào được giữ/release; test oracle và migration sẽ tùy tiện. | Chủ nghiệp vụ booking; payment owner cho các trạng thái liên quan tiền; đại diện vận hành lâm sàng cho `COMPLETED/NO_SHOW`. | `NEEDS_APPROVAL` |
| **D2.1** | TTL chung bao nhiêu và áp dụng theo kênh/service/hospital thế nào? | Create thường 15 phút; AI Pre-exam 30 phút. Không có bằng chứng TTL được cấu hình/duyệt theo service/hospital. | Chọn một TTL chung cho mọi kênh làm candidate dễ so sánh/công bằng; giá trị 15 hay 30 phải do owner chọn dựa trên thời gian thanh toán thực tế, không chọn chỉ vì dễ code. | **15m chung:** nhả chỗ sớm, giảm hold dài; có thể không đủ cho thanh toán. **30m chung:** bệnh nhân có thêm thời gian; capacity bị giữ lâu hơn. **Theo nguồn:** dễ triển khai nhưng kênh được đối xử khác nhau. **Theo service/hospital:** linh hoạt, nhưng cần governance/configuration, kiểm thử nhiều tổ hợp và có thể gây bất công nếu thiếu căn cứ. | D1, D6; dữ liệu về payment completion/abandonment nếu sẵn có. | Mỗi luồng tiếp tục có hạn khác nhau; không thể so sánh trải nghiệm hay chuẩn hóa expiry. | Chủ nghiệp vụ booking + payment/UX + đại diện bệnh viện nếu policy thay đổi theo cơ sở. | `NEEDS_APPROVAL` |
| **D2.2** | TTL bắt đầu tại thời điểm nào? | Source gán `expiresAt = Date.now() + TTL` trước khi insert appointment trong transaction; payment URL được tạo ở một method riêng và không gia hạn hold trong đoạn rà. | Bắt đầu từ khi reservation claim transaction commit; tránh người dùng mở payment URL làm timer reset. | **Từ lúc bắt đầu checkout:** giảm nguy cơ hết hạn trong redirect nhưng retry/mở lại có thể kéo dài giữ chỗ. **Từ lúc URL tạo:** semantics phụ thuộc provider call/URL retry. | D1, D2.1, D6; chính xác hóa clock/time source. | Client/API/provider có thể hiểu khác thời hạn; hành vi retry payment không dự đoán được. | Chủ nghiệp vụ booking và payment owner. | `NEEDS_APPROVAL` |
| **D2.3** | Boundary đúng tại `expiresAt`, grace và gia hạn; `PROCESSING`/trang thanh toán có giữ chỗ không? | Expiry service và processor dùng `expiresAt < now`; chưa thấy xử lý `PROCESSING` trong payment writers rà soát; runtime sweeper chưa xác minh. | Dùng một predicate nhất quán, candidate `now >= expiresAt`; không gia hạn chỉ do mở trang/URL retry. Grace chỉ bật khi provider có trạng thái/timestamp đáng tin và được duyệt. | **`now > expiresAt`:** giữ tới sau tick boundary, có thể dễ hiểu theo “quá hạn” nhưng tạo khoảng lệch. **Grace/renewal theo PROCESSING:** giảm thanh toán bị timeout nhưng giữ slot lâu/khó chống lạm dụng, cần timeout cứng. | D1, D2.1–2.2, D6; provider/runtime evidence. | Race ở boundary, hold bị nhả sớm hoặc tồn tại không giới hạn; không thể test payment/expiry một cách chuẩn. | Chủ nghiệp vụ booking + payment owner; kỹ thuật xác minh provider support trước khi chọn grace. | `NEEDS_APPROVAL` |
| **D3.1** | Quyền hủy, deadline 2 giờ, encounter đã tiếp nhận và ngoại lệ admin/hospital. | Patient cancel cho phép một số status và áp dụng 2h với một số state; encounter đã tiếp nhận có guard. Hospital-admin working diff có reason/CAS; admin route/service khác giữa HEAD và working tree. | Dùng một occupancy command chung; policy có thể cho deadline patient riêng và quyền override có audit/reason cho staff, nhưng điều kiện cụ thể cần owner duyệt. | **Giữ 2h:** nhất quán gần source hiện tại nhưng hạn chế người bệnh. **Hủy đến giờ khám:** linh hoạt hơn nhưng tăng hủy phút chót. **Staff override:** xử lý ngoại lệ nhưng cần phân quyền/audit. | D1, D5, D7, D10; baseline admin cần pin. | Các kênh áp dụng khác nhau, có thể hủy mà không release đúng hoặc release trái điều kiện. | Chủ nghiệp vụ booking + đại diện bệnh viện/CSKH + security/authorization owner. | `NEEDS_APPROVAL` |
| **D3.2** | Hủy có release capacity khi nào và refund có cùng một nghiệp vụ không? | Patient cancel giảm junction/fallback primary; hospital-admin working tree giảm primary guarded; admin generic status/refund khác. Không có uniform CAS/release. | Khi lệnh hủy hợp lệ chuyển reservation đang occupying sang RELEASED và transaction commit, release toàn bộ membership đúng một lần. Refund là workflow tài chính riêng. | **Giữ chỗ đến khi refund hoàn tất:** có thể giảm rủi ro tài chính nhưng chặn capacity. **Release ngay, refund async:** tăng khả năng dùng lại slot nhưng cần payment case/reconciliation. | D1, D5, D6–D7; D3.1. | Double release, counter drift, chỗ bị giữ hoặc mở không đúng; không rõ tiền và booking. | Chủ nghiệp vụ booking + payment/refund owner + hospital operations. | `NEEDS_APPROVAL` |
| **D4.1** | Appointment nào được đổi lịch; paid/confirmed có đổi được không? | `AppointmentsService.reschedule()` chỉ cho `CONFIRMED`/`PAID`; payment amount/fee update không thấy trong đoạn reschedule đã rà. | Cho phép đổi khi reservation còn active và policy quyền/thời hạn thỏa; eligibility theo status được duyệt, không dựa vào check ngoài transaction. | **Chỉ CONFIRMED/PAID:** tránh đổi unpaid hold, nhưng có thể loại bỏ nhu cầu người dùng. **Cho AWAITING_PAYMENT:** linh hoạt nhưng phải xử lý payment session/expiry. | D1, D2, D3, D5–D7. | API status và payment/slot chuyển khác nhau; khách hàng có thể trả cho lịch cũ sau đổi. | Chủ nghiệp vụ booking + payment owner + product/UX. | `NEEDS_APPROVAL` |
| **D4.2** | Cách chuyển slot cũ sang slot mới; nếu target fail thì sao? | Code precheck target ngoài transaction, cập nhật counter/primary trong transaction, không cập nhật membership junction. | Claim đủ target trước, cập nhật tập old/new atomically; nếu target fail giữ nguyên lịch cũ; cùng slot giao giữ nguyên occupancy. | **Cancel rồi create:** đơn giản nhưng có khoảng trống/mất lịch nếu create fail. **Atomic transfer:** đảm bảo lịch cũ không mất nhưng lock nhiều slot và cần xử lý overlap. | D1, D5, D8, D9; D4.1. | Có thể overbook target, sai membership, hoặc bệnh nhân mất lịch trong reschedule. | Chủ nghiệp vụ booking; kỹ thuật xác nhận transaction protocol, không cần chọn Redis. | `NEEDS_APPROVAL` |
| **D5.1** | Slot granularity, dịch vụ chiếm bao nhiêu slot và duration rounding. | Create logic nhận duration service/default 30 phút và tìm slot liên tiếp theo logic 15 phút; schedule reconciliation đang tạo 30 phút base. | Chuẩn hóa một interval model/schedule contract; mỗi booking giữ toàn bộ cửa sổ cần cho service duration, không suy đoán từ `slotId` đơn lẻ. | **Một slot bất kể duration:** dễ nhưng có thể không bảo vệ đủ thời gian. **N slot liên tiếp:** đúng thời lượng hơn nhưng cần membership và rollback all-or-none. **Appointment từng đoạn:** rõ từng phần nhưng phức tạp. | D1, D4, D8, D9; schedule/clinic model. | Không tính được membership hợp lệ, overlap, capacity và chi phí; thực nghiệm multi-slot không có oracle. | Schedule/clinic operations + chủ nghiệp vụ dịch vụ khám + kiến trúc sư dữ liệu. | `UNRESOLVED` |
| **D5.2** | Vai trò `Appointment.slotId` và `AppointmentSlotBooking`; AI Pre-exam/legacy không có junction thì diễn giải thế nào? | Create thường tạo junction nhiều slot; AI Pre-exam chỉ increment primary; cancel có thể fallback primary; expiry/reschedule/admin không đồng bộ đầy đủ junction. | Xem `slotId` là primary/start reference, junction là membership đầy đủ; mọi writer tạo/đổi/release phải cập nhật đủ tập. Legacy thiếu junction phải được phân loại/đối chiếu, không tự backfill bằng raw count. | **Một slot duy nhất:** loại bỏ multi-slot complexity nhưng không đáp ứng service dài nếu service chiếm toàn duration. **Junction membership:** phù hợp schema hiện có nhưng legacy rows không có active marker. | D1.1, D5.1, D4, D9; read-only data inventory. | Không thể tin membership/counter reconciliation; release một phần và overbooking slot phụ. | Chủ nghiệp vụ + DBA/data owner + schedule owner. | `UNRESOLVED` |
| **D6.1** | Thanh toán nào được coi đúng hạn; settlement timestamp hay callback arrival? | IPN ghi `paidAt` theo thời gian xử lý; đoạn rà không dùng settlement timestamp provider để so TTL. Contract runtime/provider chưa xác minh. | Dùng timestamp settlement chỉ khi xác minh được field, tính xác thực và timezone; nếu không, cần policy fallback được owner duyệt. | **Arrival time:** đơn giản, nhưng có thể phạt callback đến trễ. **Provider settlement time:** phản ánh lúc thu tiền hơn, nhưng cần field đáng tin và chống replay/clock ambiguity. | D1–D2; technical verification VNPay/provider. | Không thể phân loại paid-before-expiry callback-after-expiry; booking có thể PAID nhưng không có slot. | Payment owner + chủ nghiệp vụ booking + provider/integration owner. | `UNRESOLVED` |
| **D6.2** | Callback duplicate/concurrent; provider event identity và ACK/retry. | IPN có HMAC check và precheck `PAID` ngoài transaction; không thấy event id ledger/DB idempotency trong đoạn rà; callback behavior contract chưa xác minh. | Serialize theo payment/appointment, dedupe event bằng định danh provider đã xác minh, cập nhật payment/appointment/occupancy cùng transaction; ACK theo contract. | **Deduplicate theo transactionCode:** ít lưu trữ nhưng không phân biệt event nếu provider có nhiều sự kiện. **Event identity riêng:** mạnh hơn nếu provider cung cấp ID; thêm lưu trữ/vận hành. | D1, D2, D6.1, D7; provider verification. | Duplicate side effect/history/refund hoặc mất cập nhật do race; không biết provider sẽ retry thế nào. | Payment/integration owner + kỹ thuật vận hành callback. | `UNRESOLVED` |
| **D6.3** | Payment callback sau expiry/cancel hoặc sau khi slot bán lại: re-claim hay xử lý bù trừ? | IPN success được rà có thể ghi appointment `PAID` mà không recheck expiry/capacity; source hiện không chứng minh callback policy. | Không overbook; callback ghi nhận tiền/event, chỉ re-claim nếu policy cho phép và toàn bộ target vẫn claim được atomically; nếu không, đưa vào refund/manual review. | **Không re-claim, refund/review:** dễ bảo vệ slot nhưng có thể bất tiện/tốn xử lý. **Re-claim nếu còn chỗ:** phục vụ callback paid trước hạn nhưng slot trống; có race và yêu cầu claim đủ. **Ưu tiên payment bất kể capacity:** không an toàn về capacity, không khuyến nghị. | D1, D2, D5, D6.1–2, D7. | Payment/booking inconsistency, overbooking hoặc tiền thu không được xử lý. | Chủ nghiệp vụ booking + payment/refund owner; provider contract xác định ACK. | `NEEDS_APPROVAL` |
| **D7.1** | Payment failure có kết thúc booking/hold không? | IPN failure đặt Payment `FAILED`, không thấy release appointment/slot; Payment `PROCESSING/EXPIRED` không được quan sát trong writers rà. | Payment attempt failure không tự release; hold tiếp tục đến retry/expiry theo D2 nếu chưa có terminal booking decision. | **Release ngay ở failure:** nhả chỗ sớm nhưng có thể người dùng retry và mất slot. **Giữ đến TTL:** cho retry nhưng giữ capacity lâu hơn. | D1–D2, D6, D7.2. | Kênh thanh toán và expiry xử lý khác nhau; retry có thể mất suất hoặc giữ chỗ không giới hạn. | Payment owner + chủ nghiệp vụ booking. | `NEEDS_APPROVAL` |
| **D7.2** | Auto-refund hay manual review; full/partial, SLA, provider error. | Admin method đổi payment/appointment status sang `REFUNDED` và ghi history; không thấy provider refund call trong method đã rà; deployed workflow chưa xác minh. | Refund/review là financial workflow idempotent, tách occupancy; xác định owner/SLA/attempts và reconciliation trước khi tự động hoàn. | **Auto-refund:** nhanh hơn nhưng cần API/eligibility/idempotency/retry rõ. **Manual review:** kiểm soát được ngoại lệ nhưng chậm và tốn vận hành. **Partial/full:** phụ thuộc hợp đồng/fee policy. | D3, D6; provider capability; payment accounting. | Không giải quyết được paid-but-unallocated; status `REFUNDED` có thể không tương ứng tiền đã hoàn thật. | Payment/finance owner + chủ dự án + người vận hành manual review. | `UNRESOLVED` |
| **D8.1** | Scope trùng lịch: profile, user/dependent hay tài khoản; unpaid hold có block? | Normal create/reschedule check `patientProfileId` và primary interval, không serialize; Pre-exam path không thấy cùng overlap check. | Nếu owner chọn hard invariant, kiểm tra full interval của các reservation đang occupying và serialize theo scope được duyệt. | **Theo profile:** tách bệnh nhân phụ thuộc tốt nhưng hai profile cùng user có thể trùng. **Theo user:** chặn mạnh hơn nhưng có thể cấm đặt cho nhiều dependent cùng thời điểm. **Warning/override:** linh hoạt nhưng không ngăn trùng. | D1, D2, D5; quyền staff/guardian. | Hai request đồng thời có thể trùng lịch; không biết hai profile khác nhau có được phép cùng giờ. | Chủ nghiệp vụ/clinical operations + product phụ thuộc patient/guardian. | `NEEDS_APPROVAL` |
| **D9.1** | Giảm capacity dưới occupancy hiện hữu được phép không? | `updateSlot()` kiểm tra bằng snapshot `bookedCount` rồi cập nhật ngoài transaction; chưa bảo đảm đối đầu với booking. | Mặc định từ chối nếu capacity mới nhỏ hơn active occupancy; mọi update khóa/serialize cùng slot. Ngoại lệ phải có quy trình chuyển/hủy/ưu tiên. | **Cho giảm và giữ booking hiện có:** capacity thực tế tạm vượt target, cần diễn giải. **Force cancel/move:** bảo vệ capacity mới nhưng ảnh hưởng cam kết bệnh nhân và cần bồi thường/ưu tiên. | D1, D5, D9.2; data drift/current occupancy. | Capacity dưới số booking, hoặc admin thao tác gây race và slot không còn nhất quán. | Hospital/clinic operations + chủ nghiệp vụ + DBA/technical owner. | `NEEDS_APPROVAL` |
| **D9.2** | Block/inactivate/đổi lịch làm việc hoặc phòng khi slot đã có booking. | Slot status/availability predicates khác nhau; room/schedule reconciliation là writer riêng; reconciliation có thể cập nhật slot existing capacity/endTime/isActive. | Chặn claim mới nhưng giữ cam kết active; serialize edit với booking; chuyển/hủy booking đang có chỉ qua policy ngoại lệ/audit. | **Honor bookings:** ổn định cam kết nhưng lịch mới có thể không khớp staff/room. **Force relocate/cancel:** phản ánh schedule mới nhưng cần target claim, patient consent/notification, refund. | D1, D5, D9.1; clinic room/schedule evidence. | Slot hiển thị khả dụng nhưng create từ chối hoặc booking bị thay đổi âm thầm. | Clinic/hospital operations + chủ nghiệp vụ; kỹ thuật xác minh reconciliation triggers. | `NEEDS_APPROVAL` |
| **D10.1** | `COMPLETED` ngừng chiếm capacity khi nào? | Complete đổi status/ghi encounter/history, không thấy decrement counter/junction. | Với `bookedCount` live occupancy, chuyển sang `CONSUMED` và giảm count tại mốc completion được xác nhận; giữ appointment/history độc lập. | **Giải phóng lúc completion:** cho tái sử dụng sớm, cần rõ time slot đã bắt đầu/kết thúc. **Giữ đến hết slot:** dễ dự đoán nhưng counter có thể giữ sau khám xong. | D1, D5, D10.2. | Counter có thể trở thành historical total hoặc giải phóng quá sớm; không tính capacity nhất quán. | Clinical operations + chủ nghiệp vụ booking. | `NEEDS_APPROVAL` |
| **D10.2** | No-show grace, release/consume và revert `NO_SHOW → PAID/CONFIRMED`. | Admin/hospital-admin có eligibility path cho no-show; không thấy release; revert status không re-claim membership/counter trong đoạn rà. | Giữ occupancy đến mốc slot end/grace được duyệt; sau terminal consume/release không tính live count. Revert sau terminal phải re-claim toàn bộ slot hoặc chuyển manual/new booking, không chỉ đổi enum. | **Release ngay khi đánh NO_SHOW:** nhả chỗ sớm nhưng có thể bệnh nhân đến muộn. **Giữ hết slot/grace:** bảo vệ cơ hội khám nhưng giữ capacity lâu hơn. **Revert vô điều kiện:** tiện nhưng có thể overbook nếu slot đã bán. | D1, D3, D5, D6, D7, D10.1. | Revert có thể tạo trạng thái PAID/CONFIRMED nhưng không còn suất; xử lý late arrival không thống nhất. | Clinical/hospital operations + chủ nghiệp vụ booking + payment owner nếu có phí/refund. | `NEEDS_APPROVAL` |

### 4.2 Bảng tổng hợp bắt buộc D1–D10

| ID | Chủ đề | Nhóm quyết định | Phương án đề xuất | Người/nhóm cần duyệt | Phụ thuộc | Trạng thái | Bước tiếp theo |
|---|---|---|---|---|---|---|---|
| D1 | Nghĩa `bookedCount` và mapping occupancy | Business policy approval | Live occupancy; lifecycle riêng; history độc lập. | Chủ nghiệp vụ booking; DBA/architect cho data semantics. | D2–D7, D10, legacy inventory. | `NEEDS_APPROVAL` | Chọn semantics và duyệt status/lifecycle truth table. |
| D2 | TTL, timer start, boundary, grace/renewal | Business policy approval | Một policy nhất quán; candidate start at hold commit và `now >= expiresAt`; TTL value/grace chưa chọn. | Booking owner + payment owner. | D1, D6, technical provider/runtime facts. | `NEEDS_APPROVAL` | Xác minh provider/runtime song song; owner chọn TTL và edge rules. |
| D3 | Hủy, quyền, deadline, release/refund separation | Business policy approval | Cancel commit giải phóng tất cả slot đúng một lần; refund riêng. | Booking owner + hospital operations + finance. | D1, D5, D7, D10. | `NEEDS_APPROVAL` | Chốt quyền, 2h, encounter, exception và refund relation. |
| D4 | Reschedule eligibility và atomic transfer | Business policy approval | Claim full target first; old schedule retained on failure; transfer atomically. | Booking owner + payment owner. | D1, D5, D6, D8, D9. | `NEEDS_APPROVAL` | Chốt state eligibility, paid/fee, target alternative policy. |
| D5 | Slot interval, duration, membership | Business policy approval | Full contiguous membership, all-or-none; primary as reference only. | Clinic/schedule owner + booking owner + data architect. | D1, D4, D8, D9. | `UNRESOLVED` | Chuẩn hóa interval contract; phân loại lịch legacy/junction. |
| D6 | Timely/late payment, callback idempotency and ACK | Business policy approval + technical verification | Idempotent event handling; no implicit slot claim; re-claim only if approved and full capacity available. | Payment owner + booking owner + provider integration owner. | D1, D2, D5, D7; provider evidence. | `UNRESOLVED` | Xác minh provider event/time/ACK rồi xin chọn late-payment policy. |
| D7 | Payment failure, refund and manual review | Business policy approval | Payment status independent; failure does not itself release; refund/review idempotent and separate. | Finance/payment owner + booking owner. | D1, D3, D6. | `UNRESOLVED` | Chốt auto/manual, full/partial, SLA, provider operation. |
| D8 | Patient overlap scope and hold behavior | Business policy approval | If hard-block approved, use full interval and serialize by approved patient scope. | Booking/clinical owner + product/guardian policy owner. | D1, D4, D5. | `NEEDS_APPROVAL` | Chọn profile/user/dependent scope, hold block and override. |
| D9 | Capacity reduction, block, schedule/room changes | Business policy approval + technical verification | Serialize edits with claims; default reject capacity below active occupancy; preserve booked commitments. | Clinic/hospital operations + booking owner + technical schedule owner. | D1, D5; occupancy data and runtime triggers. | `NEEDS_APPROVAL` | Chốt exceptions/relocation; verify reconciliation callers and deployed policies. |
| D10 | Complete/no-show consume and revert | Business policy approval | Live count ends at an approved consume point; no-show grace and post-terminal revert require re-claim or manual path. | Clinical operations + booking owner; finance for penalties/refund. | D1, D3, D5–D7. | `NEEDS_APPROVAL` | Chốt completion/grace/revert truth table. |

## 5. Ma trận xác minh kỹ thuật

`VERIFIED` ở đây giới hạn đúng với source snapshot/tài liệu đã khảo sát; không lan sang runtime. Các yêu cầu xác minh production dùng quyền truy cập read-only hoặc người sở hữu hệ thống, không cần secret.

| ID | Câu hỏi xác minh | Bằng chứng hiện có | Chưa thể xác minh | Cách xác minh cụ thể | Nguồn/người cung cấp | Trạng thái |
|---|---|---|---|---|---|---|
| T1 | Commit/build nào là baseline nghiên cứu và production? | Baseline ghi branch `develop`, HEAD `585dcd8...`; worktree có modified/untracked, gồm admin/hospital-admin và migrations. | Commit/build đang deploy, artifact image/version và có khớp worktree không. | Lấy commit SHA/image tag/deployment release metadata; so working diff với release; không ghi secret. | Release/DevOps owner, repository maintainer. | `UNVERIFIED` |
| T2 | Modified files có thuộc phạm vi baseline không? | Danh sách diff đã được ghi trong baseline; admin cancellation khác giữa HEAD và working tree. | Intended release/scope của changes chưa commit. | Chủ dự án chọn snapshot; lưu manifest file/diff và commit SHA làm baseline. | Chủ dự án/research supervisor + maintainer. | `UNVERIFIED` |
| T3 | Bao nhiêu backend instances/workers chạy? | Repo/local config không chứng minh topology production; baseline cũng nêu chưa biết số replica. | Số replica, autoscaling, worker process và deployment topology. | Đọc deployment dashboard/manifest đã sanitize, replica history và process roles trong môi trường được phép. | DevOps/SRE; chỉ cung cấp metadata, không credentials. | `UNVERIFIED` |
| T4 | Expiry worker/scheduler có thực chạy không? | `expirePendingAppointments()` và endpoint tồn tại; `ExpireAppointmentsProcessor`, `QueueService.addExpireJob()` tồn tại; không thấy caller của `addExpireJob`, Bull queue registration/processor decorator/scheduler trong source đã quét. | Cron bên ngoài, manual operation, deployed queue wiring hoặc production execution history. | Trace deployment manifests/task scheduler/worker logs and job metrics; xác minh call path trên deployed build; chỉ đọc. | DevOps/SRE + backend owner. | `UNVERIFIED` |
| T5 | Redis/BullMQ có được kết nối và dùng thực tế không? | Có queue class/token/config evidence theo baseline; source `QueueModule` chỉ providers, chưa thấy queue registration; chưa có bằng chứng Redis booking lock. | Connection/runtime use, queue health, Redis responsibilities in deployed environment. | Rà deployed config keys đã redact, dependency wiring, metrics/logs và provider initialization; không gửi token/password. | DevOps/SRE + backend owner. | `UNVERIFIED` |
| T6 | VNPay cung cấp timestamp settlement, event identity, ACK/retry nào? | Source IPN HMAC check, transaction lookup và `paidAt` processing-time; không thấy settlement-time/event ID use trong handler đã rà. | Contract/API field semantics, event identifier uniqueness, callback retry/ACK rules, deployed callback URL/version. | Dùng tài liệu hợp đồng hiện hành/provider sandbox hoặc integration owner; inspect redacted sample payload; tuyệt đối không yêu cầu secret/token. | Payment integration owner + provider support qua kênh chính thức. | `UNVERIFIED` |
| T7 | Migration/schema nào đã áp dụng? | Prisma schema và repo migrations tồn tại; một số migrations modified trong working tree. | Actual DB schema/history/migration state per deployment. | DBA chạy báo cáo migration history/schema version chỉ đọc trên môi trường được phép; không chạy migrate. | DBA/database owner. | `UNVERIFIED` |
| T8 | Occupancy data drift/legacy anomalies bao nhiêu? | Có các SQL chỉ đọc dự kiến; chưa chạy DB inventory; junction raw count không phải occupancy oracle. | Counts thực, ambiguous memberships, missing primary junction, counter range/drift, stale holds. | Snapshot/clone an toàn; role read-only; chạy diagnostics sau khi thống nhất classifications; owner review ambiguous cases. | DBA/data owner + booking domain owner. | `UNVERIFIED` |
| T9 | Source behavior cho các luồng chính đã được kiểm tra chưa? | Tài liệu tổng hợp dẫn source cho create, Pre-exam, cancel/reschedule/expiry/complete, IPN/refund/admin, capacity/reconciliation và schema. | Có thể còn external/legacy deployed writers ngoài repo/NestJS scope. | Trước cutover code-search/trace all DB writers, integration apps/scripts, raw SQL, callsites; đối chiếu deployed build. | Backend owner + integration owners. | `VERIFIED` (repo paths đã rà); `UNVERIFIED` (external/deployed completeness) |
| T10 | Idempotency/event identity/data contract hiện tại đủ không? | `Appointment.idempotencyKey` unique nullable; create lookup trước transaction; `PaymentTransaction.transactionCode` unique và appointment unique. | Same-key payload semantics, provider callback event identity, external retry expectations. | Rà DTO/client/provider contract, test existing behavior trên test DB và tài liệu provider; không chạy production writes. | Backend/API owner + payment owner. | `UNVERIFIED` |

## 6. Ma trận giả thuyết thực nghiệm

Các scenario là kế hoạch, không phải kết quả. Dùng database test cô lập, dữ liệu tổng hợp, cùng fixture/config giữa biến thể. Test policy-level chỉ bắt đầu sau khi approval truth table tạo được oracle.

| ID | Giả thuyết cần kiểm chứng | Biến độc lập / so sánh | Chỉ số đo | Điều kiện kiểm thử | Tiêu chí pass/fail |
|---|---|---|---|---|---|
| E1 | DB row locks + recheck ngăn overbooking một slot khi nhiều request đồng thời. | V0 baseline so với V1 ordered DB locks; concurrency và capacity. | Success/conflict/error, occupancy, counter drift, lock wait, p50/p95/p99, throughput. | Isolated PostgreSQL; một slot capacity 1 rồi capacity C; từ 2 tới tải định trước; fixture sạch. | Pass nếu active occupancy ≤ capacity, counter khớp oracle, lỗi phân loại rõ; bất kỳ overbook/drift trái oracle là fail. |
| E2 | CAS/conditional guards giảm lost update/double release so với row lock đơn thuần mà vẫn giữ correctness. | V1 so V2 (V1 + CAS/conditional updates); giữ nguyên API, DB, payload/load. | Counter drift, negative count, CAS conflicts, retries, deadlocks, lock wait, latency/throughput. | Trộn create/cancel trên slot gần đầy; cùng timing/barriers; PostgreSQL cùng cấu hình. | Cả hai phải đạt correctness oracle; so hiệu năng chỉ sau đó. Không claim cải thiện nếu không đo/statistically support. |
| E3 | Multi-slot claim/reschedule all-or-none khi slot bất kỳ trong cửa sổ fail. | Baseline vs command implementation; số slot, overlap pattern, slot cuối fail, capacity khác nhau. | Partial membership, per-slot counts, rollback, deadlocks/retries, latency. | Service duration tạo cửa sổ nhiều slot; inject conflict/failure tại từng vị trí; create và reschedule đồng thời. | Pass khi không có partial commit; appointment active có đúng membership policy; reschedule target fail vẫn giữ lịch cũ. |
| E4 | Cancel/expiry/payment races tạo đúng một terminal transition và không release counter hai lần. | V0/V1/V2; thứ tự interleaving và số duplicate callers. | Winning transition, decrement count, duplicate no-op, payment/reservation tuple, drift, deadlocks. | Barrier-controlled race: cancel vs expiry, payment vs expiry, two expiry workers, create after release. | Final states match approved table; 0 duplicate release/negative count/overbook. |
| E5 | Callback duplicate được xử lý idempotently không lặp history/refund/notification. | Event identity strategy / callback repetition; V1/V2. | Logical transitions, duplicate side effects, refund attempts, ACK result, event handling latency. | Gửi cùng event serial/concurrent; crash before/after DB commit and retry; test provider simulator/sandbox contract. | Một logical update/effect; duplicate produces documented stable response; no paid booking without valid occupancy. |
| E6 | Profile serialization and full-interval check prevent overlapping booking under concurrent channels. | With/without profile lock/CAS; profile vs user scope per approved policy. | Overlap violations, conflict results, lock wait, latency. | Two different slot IDs with intersecting intervals; same profile and dependent profiles; regular + Pre-exam paths. | 0 overlap contrary to approved policy; unauthorized/allowed exceptions are explicit. |
| E7 | Capacity/schedule edits serialized with booking preserve occupancy commitments. | V0 vs shared lock/guard; capacity edit, block, reconciliation timing. | Capacity below active occupancy, invalid status/availability, failed claims, displaced appointments, drift. | Concurrent claim and capacity reduction/block/upsert in synthetic schedule; approved exception scenarios only. | No silent invalidation; capacity invariant holds unless explicitly approved exception and handled; no lost updates. |
| E8 | Redis lock adds measurable value beyond PostgreSQL lock/CAS under target contention, sufficient to justify operational complexity. | V2 vs V3 Redis-assisted; same DB/workload; Redis healthy/outage/lease expiry/failover. | Throughput, p95/p99, DB lock waits/pool use, conflicts, Redis wait/acquire failures, fencing rejects, recovery. | Run only after V2 passes correctness; define lock protocol/fencing and failure injection; same load/fixture. | V3 must preserve all correctness invariants and show reproducible benefit under a pre-agreed metric threshold; otherwise do not adopt. No numeric threshold predetermined. |
| E9 | Expiry lag/recovery is acceptable with selected worker/sweeper topology. | Worker count, batch size, sweep cadence, queue outage; V1/V2 common command. | Expiry lag distribution, processed/retried/error count, duplicate release, DB load, recovery time. | Synthetic expired holds; process restart and competing callbacks; deployed-like but isolated configuration. | All due records eventually reach policy-valid state within an SLA approved before test; no duplicate release or missed payment handling. |
| E10 | Completion/no-show/revert semantics keep live counter consistent while preserving history. | Approved consume/grace/revert policies and concurrent rebooking order. | Counter vs active occupancy, sold-again conflicts, revert success/manual review, history completeness. | Before/at/after slot end/grace; slot reallocated; paid/unpaid; single/multi-slot. | Outcomes match approved truth table; terminal transition cannot silently recreate occupancy or overbook. |

### Experimental controls and reporting

- Freeze commit/build, migrations, DB version/config, connection pool, API/worker instances, fixture, seed, workload and machine resources per run.
- Compare one technical factor at a time; V0 = frozen baseline, V1 = ordered PostgreSQL row locks, V2 = V1 + CAS/guards, V3 = V2 + Redis only if justified.
- Use approved policy-derived occupancy oracle; if no approval, limit findings to implementation mechanics and label policy outcomes unresolved.
- Measure throughput, p50/p95/p99, HTTP outcome classes, conflict rate, overbook rate, counter drift, duplicate release, transaction/lock wait, deadlocks/retries, expiry lag, recovery and refund/manual-review outcomes.
- Do not manufacture measurements. Report no benchmark result in this matrix.

## 7. Quan hệ phụ thuộc và thứ tự ưu tiên

### Dependency graph

```text
D1 occupancy semantics
 ├── D2 hold/expiry ──┬── D6 payment callback ── D7 refund/manual review
 ├── D3 cancellation ─┘
 ├── D5 slot interval/membership ── D4 reschedule
 │                              └── D8 overlap interval
 ├── D9 capacity/block/schedule
 └── D10 complete/no-show consume

Technical verification (baseline, worker, provider, DB data) runs in parallel
with policy review but gates implementation and experiment interpretation.
Approved D1–D10 truth table + verified baseline/runtime + safe data inventory
                         └── schema/API/migration design
                              └── implementation and correctness tests
                                   └── benchmark variants
```

### Recommended approval sequence

1. **Governance/baseline parallel:** xác định người có thẩm quyền cho booking, clinical operations, finance/payment và schedule; pin commit/build/scope. Không dùng trạng thái working tree làm production baseline.
2. **D1 first:** duyệt live occupancy/counter semantics, reservation lifecycle, và nguyên tắc history độc lập. Chưa map từng status hoàn chỉnh cho tới các phụ thuộc sau.
3. **D5 + D2:** cùng làm rõ tập slot/interval trước, rồi chốt TTL bắt đầu/boundary/grace; multi-slot affect expiry và occupancy release.
4. **D3 + D4 + D8 + D9:** duyệt cancel, reschedule, overlap và schedule/capacity exceptions dựa trên cùng tập membership D5.
5. **D6 then D7:** sau khi có D1/D2/D5, payment owner xác nhận timestamp/event/ACK; business/finance chọn late-payment compensation, failure, refund/manual review.
6. **D10:** chốt completion/no-show consume/revert cùng D1; attendance/clinical owner phải tham gia.
7. **Consolidate and sign:** xuất một truth table/version duy nhất gồm actor × appointment state × payment event × occupancy before/after × slot effects × refund/review; lưu approval evidence. Không chạy policy correctness tests trước bước này.
8. **Technical/data gates:** xác minh deployment/worker/provider/migrations và occupancy diagnostics trên DB clone read-only; resolve ambiguous legacy records trước schema/backfill.
9. **Schema/API design:** chỉ sau approvals + evidence mới quyết định có cần lifecycle storage, event/refund/outbox/idempotency schema nào; không mặc định tạo tất cả.
10. **Implementation and experiments:** cut over mọi writer có rollout/rollback plan; correctness/concurrency test đạt trước performance comparison.

## 8. Những quyết định đang chặn implementation

### Business-policy blockers

- Chưa có phê duyệt D1–D10. D1/D10 chưa có occupancy truth table; D2 thiếu TTL/boundary/grace; D5 interval/membership chưa rõ; D6/D7 chưa có provider/financial compensation policy.
- D3/D4/D8/D9 có candidate nhưng vẫn cần owner quyết định deadline/role, reschedule payment handling, overlap scope và forced schedule/capacity exceptions.
- Chưa xác định người có thẩm quyền ký duyệt và approval artifact có version/effective date.

### Evidence/runtime/data blockers

- Chưa pin source/build đang chạy; source liên quan admin/hospital-admin/migration khác HEAD.
- Expiry runtime wiring, số instances, BullMQ/Redis production use, VNPay contract và migration state chưa xác minh.
- Chưa chạy read-only data inventory trên DB clone; counter/membership drift và records mơ hồ chưa định lượng.
- Chưa kiểm kê hết external/deployed writers vượt ngoài repo snapshot đã rà.

### Verification/research blockers

- Không có policy-derived correctness oracle cho tới khi D1–D10 được duyệt.
- Không có concurrency test/benchmark results; nghiên cứu hiện mới có hypotheses/test plan.
- Không được tuyên bố hiệu năng, zero overbooking ngoài test envelope hoặc production behavior khi chưa có bằng chứng.

## 9. Checklist trước khi thiết kế schema/migration

### Policy

- [ ] Người/nhóm phê duyệt được xác định cho booking, payment/refund, clinical attendance và schedule/capacity.
- [ ] Có approval artifact/version/effective date cho D1–D10; không dựa vào tên file draft.
- [ ] Đã chốt truth table Appointment × Payment × Occupancy × actor/action, gồm callback/expiry/cancel race.
- [ ] Đã chốt `bookedCount` semantics, release-once, consume/no-show timing và history retention.
- [ ] Đã chốt TTL/start/boundary/grace/renewal và payment-processing behavior.
- [ ] Đã chốt interval/granularity, multi-slot membership, reschedule, overlap scope và schedule exceptions.
- [ ] Đã chốt late payment, provider ACK, refund/manual review and failure behavior.

### Technical/runtime/data evidence

- [ ] Commit/build/deployment baseline và inclusion/exclusion của working-tree changes đã được pin.
- [ ] API/worker replica count, expiry execution trigger/cadence, queue/Redis wiring xác minh từ deployment evidence.
- [ ] VNPay/provider timestamp, event identity, callback retry/ACK contract xác minh từ tài liệu/payload đã sanitize.
- [ ] Actual migration/schema state xác minh read-only; không chạy migration trong bước kiểm kê.
- [ ] All source/deployed writers có ảnh hưởng occupancy được inventoried; external integration owners xác nhận.
- [ ] Read-only inventory chạy trên safe clone; structural mismatch tách khỏi policy ambiguity; owner quyết định records mơ hồ.

### Logical/data/API readiness

- [ ] Đã quyết định tối thiểu cần lưu lifecycle/idempotency/payment event/outbox/refund/audit; không thêm bảng theo mặc định.
- [ ] Đã xác định `AppointmentSlotBooking` hiện có có thể tái dùng ra sao và xử lý membership legacy.
- [ ] Backfill source-of-truth, batch/locking, manual review, reconciliation và rollback được DBA/owner duyệt.
- [ ] Mọi endpoint/client/provider/scheduler được map vào command; API compatibility/error/idempotency semantics được duyệt.
- [ ] Không có writer cũ/new cùng mutate occupancy ngoài protocol trong rollout plan.
- [ ] Correctness test oracle và PostgreSQL integration/concurrency suite được duyệt trước khi implementation/cutover.

**Nếu bất kỳ điều kiện business approval, source/runtime pinning hoặc safe data classification nào chưa đạt, chưa bắt đầu schema migration/backfill.**

## 10. Kết luận mức độ sẵn sàng

1. **Nguyên tắc kiến trúc:** đủ cơ sở để thống nhất như hướng đề xuất—PostgreSQL authority, state lifecycles tách biệt, transaction atomic, multi-slot all-or-none, idempotent release, Redis không phải correctness authority. Chưa có bằng chứng chính thức phê duyệt các nguyên tắc này.
2. **Chính sách nghiệp vụ:** D1–D10 đều còn cần phê duyệt hoặc giải quyết dữ kiện; không có `APPROVED`.
3. **Thông tin kỹ thuật:** source snapshot có baseline rõ tại thời điểm audit, nhưng deployed commit, instances, worker/queue/Redis, provider contract, migration state và dữ liệu thực chưa xác minh.
4. **Giả thuyết nghiên cứu:** đã có thể kiểm tra bằng V0/V1/V2 và V3 có điều kiện; chưa có kết quả, và correctness test policy-level phụ thuộc approval truth table.

**Mức độ sẵn sàng:** có thể tiến hành xin phê duyệt và technical verification song song; **chưa sẵn sàng thiết kế schema/migration cuối, triển khai booking behavior hoặc benchmark**. Bước tiếp theo là chỉ định approvers, pin deployed baseline/runtime evidence, rồi duyệt D1/D5/D2 làm nền cho các quyết định phụ thuộc.
