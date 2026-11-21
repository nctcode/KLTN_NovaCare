# Chương X. Phương pháp thực nghiệm, kết quả và thảo luận

## X.1. Mục tiêu và câu hỏi thực nghiệm

Thực nghiệm được thực hiện nhằm đánh giá khả năng bảo toàn sức chứa suất khám khi nhiều yêu cầu đặt lịch cùng cạnh tranh, tập trung vào khiếm khuyết đã quan sát ở luồng đặt lịch thông thường và luồng tạo lịch từ AI Pre-exam. Nghiên cứu gồm hai phiên bản:

- **V0** là trạng thái mã nguồn hiện tại tại baseline nghiên cứu, được kiểm thử trên tám kịch bản E1–E8.
- **V1** là nguyên mẫu cô lập, đưa luồng đặt lịch thông thường và luồng AI Pre-exam dùng chung cơ chế claim occupancy dựa trên PostgreSQL. V1 được kiểm thử bằng E1, các biến thể E2 có điều phối xen kẽ, và E6 cùng fault injection.

Các câu hỏi được khảo sát gồm: (i) hai luồng đặt lịch có thể cùng chiếm một suất cuối hay không; (ii) counter `bookedCount` và biểu diễn membership có nhất quán sau các thao tác được kiểm thử hay không; (iii) thay đổi V1 có rollback các ghi occupancy khi giao dịch lỗi hay không; và (iv) độ trễ service quan sát được thay đổi ra sao trong các kịch bản có thể đối chiếu.

Kết quả là bằng chứng thực nghiệm trong môi trường thử nghiệm cô lập, không phải kết quả production. Việc một hiện tượng không xuất hiện trong số lần chạy hữu hạn không chứng minh hiện tượng đó không thể xảy ra trong các lịch xen kẽ khác.

## X.2. Phương pháp thực nghiệm

### X.2.1. Môi trường và dữ liệu

Hai phiên bản được chạy trên PostgreSQL 16.14 trong các container test riêng, chỉ bind vào loopback:

- V0: cơ sở dữ liệu `novacare_occupancy_test` tại `127.0.0.1:55439`.
- V1: cơ sở dữ liệu `novacare_occupancy_v1_test` tại `127.0.0.1:55440`.

Mỗi database được tạo mới cho đợt chạy tương ứng. Các migration trong source copy được áp dụng trước; sau đó Prisma schema được đồng bộ trên database trống để schema thực nghiệm khớp Prisma schema của snapshot. Vì vậy, kết quả mô tả schema Prisma đã đồng bộ, không mô tả riêng trạng thái chỉ sau migration. Cùng một hash Prisma schema được dùng cho V0 và V1: `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5`.

Dữ liệu gồm các thực thể tổng hợp: bệnh viện, chuyên khoa, bác sĩ, nơi làm việc, người dùng, hồ sơ bệnh nhân, dịch vụ, suất khám, appointment và payment record trong các kịch bản tương ứng. Không sử dụng dữ liệu bệnh nhân thật. V0 mô phỏng callback VNPay bằng payload có chữ ký HMAC test-only; không gọi VNPay/MoMo thật. V1 không thử nghiệm thanh toán. Redis không được dùng trong hai đợt.

Baseline Git mà V0 và V1 kế thừa là branch `develop`, commit `585dcd8db9d612b4d35d758fe7d285b4762298b6`; working tree tại thời điểm V0 đã có thay đổi chưa commit. V1 được tạo thành source copy riêng từ source copy V0; các hash nguồn V0 đã được đối chiếu với JSON trước khi sửa bản sao V1. Source copy V0 và các artifact V0 không bị sửa trong quá trình làm V1.

### X.2.2. Cách tạo cạnh tranh đồng thời

Các harness gọi trực tiếp method của service NestJS bằng Prisma client; không khởi động máy chủ HTTP. Trong các kịch bản cạnh tranh, các thao tác service được khởi chạy bằng `Promise.all`, mỗi trial sử dụng fixture độc lập và đọc lại trạng thái PostgreSQL sau khi các thao tác kết thúc.

V0 chạy 30 trial cho mỗi E1–E8, tổng cộng 240 trial và 450 lần gọi service. V1 chạy 30 trial cho mỗi trong bảy nhóm: E1, E2 baseline, E2 normal-first, E2 AI-first, E2 barrier-release, E6 thành công và E6 fault injection. Tổng cộng 210 trial và 360 lần gọi service. URL harness được khóa vào host/port/database test ở lúc khởi động; harness kiểm tra `current_database()` trước service call và trước khi tạo fixture theo từng trial. Các fixture dùng chung được tạo sau lần xác nhận database ban đầu trên kết nối đã khóa vào URL test. Do số lượng và loại kịch bản khác nhau, không so sánh tổng hợp toàn bộ V0 với tổng hợp toàn bộ V1.

Trong V1, các hook chỉ có trong source copy thí nghiệm điều phối hành vi ngay trước thao tác claim:

1. **E2 baseline:** hai service được khởi chạy cạnh tranh bình thường.
2. **Normal-first:** hook cho luồng thường đi tiếp trước; luồng AI chờ luồng thường bắt đầu claim.
3. **AI-first:** thứ tự ưu tiên đảo lại.
4. **Barrier-release:** cả hai luồng chờ đến khi cùng tới barrier rồi được thả đồng thời.

Đây là điều phối test tại ranh giới occupancy claim, không phải mô phỏng mọi lịch xen kẽ có thể có của API hoặc production.

### X.2.3. Chỉ số và cách tính

Các chỉ số được lấy từ kết quả từng trial và đối chiếu với trạng thái cuối trong PostgreSQL:

- **Success/failed:** số lần gọi service hoàn tất thành công hoặc ném lỗi.
- **Over-capacity:** slot tổng kết có `bookedCount > capacity`.
- **Counter/membership mismatch:** chênh lệch so với số claim thành công kỳ vọng trong fixture/kịch bản. Membership count được xem là quan sát lịch sử; không được diễn giải là chân lý occupancy cho mọi luồng nghiệp vụ cũ.
- **Negative counter:** `bookedCount < 0`.
- **Duplicate membership (V1):** có hơn một hàng với cùng cặp `(appointmentId, slotId)`.
- **Rollback:** trong fault injection, kiểm tra sau lỗi cả counter, membership, appointment và status history.
- **Deadlock/transaction conflict:** chỉ đếm các mã PostgreSQL/Prisma nhận diện được như deadlock hoặc serialization conflict. HTTP 409 nghiệp vụ không bị tính là deadlock.
- **Latency:** thời gian từng lần gọi service, đo bằng đồng hồ monotonic của harness; không bao gồm tạo fixture và đọc lại database. Average là trung bình số học; P50/P95 là nearest-rank `ceil(p*n)`. Không đo latency HTTP/end-to-end. HTTP 5xx vì vậy là *không đo*, không phải 0.

JSON giữ latency từng lần gọi; CSV có một dòng cho mỗi trial, gồm các chỉ số tổng hợp của trial. Việc đối chiếu lại cho thấy 240 dòng dữ liệu V0 và 210 dòng V1 trong CSV khớp số trial JSON; các trường outcome, số lần gọi và latency per-trial đã đối chiếu không có sai lệch.

## X.3. Thực nghiệm V0

### X.3.1. Mục đích và các kịch bản

V0 khảo sát hành vi hiện tại trong các trường hợp cạnh tranh và vòng đời occupancy. Mỗi kịch bản được chạy 30 lần.

**Bảng X.1. Kịch bản thực nghiệm V0**

| Mã | Kịch bản | Thao tác chính |
|---|---|---|
| E1 | Concurrent Create | Hai yêu cầu đặt thông thường cùng tranh slot capacity 1. |
| E2 | Normal vs AI Pre-exam | Đặt thường và tạo lịch từ AI Pre-exam cùng tranh slot capacity 1. |
| E3 | Create vs Cancel | Một yêu cầu tạo lịch cạnh tranh với hủy appointment đang giữ slot. |
| E4 | Payment vs Expiry | Callback thanh toán tổng hợp cạnh tranh với xử lý hết hạn appointment. |
| E5 | Duplicate Payment | Hai bản callback thanh toán thành công giống nhau được xử lý đồng thời. |
| E6 | Multi-slot Booking | Một dịch vụ 60 phút yêu cầu hai slot liên tiếp 30 phút. |
| E7 | Capacity Reduction | Giảm capacity về 0 cạnh tranh với yêu cầu tạo lịch. |
| E8 | Duplicate Cancel | Hai lệnh hủy cùng một appointment được gọi đồng thời. |

### X.3.2. Kết quả tổng hợp

**Bảng X.2. Kết quả V0 theo kịch bản**  
*Đơn vị: số trial, số service call, số trial có tín hiệu tương ứng; latency tính bằng ms.*

| Kịch bản | Trials | Calls | Success | Failed | Over-capacity | Counter/membership mismatch | Slot-state signal | Payment/occupancy signal | Duplicate side effects | Deadlock/conflict | Avg | P50 | P95 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E1 Concurrent Create | 30 | 60 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 49.08 | 45.66 | 70.41 |
| E2 Normal vs AI Pre-exam | 30 | 60 | 60 | 0 | 30 | 30 | 0 | 0 | 0 | 0 | 49.13 | 44.12 | 76.77 |
| E3 Create vs Cancel | 30 | 60 | 30 | 30 | 0 | 0 | 30 | 0 | 0 | 0 | 22.86 | 22.93 | 37.99 |
| E4 Payment vs Expiry | 30 | 60 | 60 | 0 | 0 | 0 | 30 | 30 | 0 | 0 | 13.33 | 12.37 | 19.30 |
| E5 Duplicate Payment | 30 | 60 | 60 | 0 | 0 | 0 | 0 | 0 | 30 | 0 | 13.09 | 13.09 | 18.71 |
| E6 Multi-slot Booking | 30 | 30 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 47.11 | 41.52 | 60.76 |
| E7 Capacity Reduction vs Create | 30 | 60 | 30 | 30 | 0 | 0 | 30 | 0 | 0 | 0 | 14.38 | 15.69 | 21.66 |
| E8 Duplicate Cancel | 30 | 60 | 60 | 0 | 0 | 0 | 30 | 0 | 30 | 0 | 30.17 | 31.33 | 44.34 |
| **Tổng** | **240** | **450** | **360** | **90** | **30** | **30** | **120** | **30** | **60** | **0** | **28.75*** | **22.47*** | **57.46*** |

`*` Latency tổng được tính trên 450 lần gọi từ mảng latency thô trong JSON. “Slot-state signal” là so sánh theo quy tắc fixture đơn giản (`bookedCount < capacity` tương ứng AVAILABLE/available); không phải phán quyết nghiệp vụ đã được phê duyệt. “Payment/occupancy signal” là trạng thái quan sát E4, không đồng nghĩa kết luận chính sách thanh toán sai.

**Nguồn Bảng X.1–X.2:** V0 report, V0 JSON/CSV và V0 harness; các tổng và latency được tính lại từ dữ liệu trial và latency thô. JSON/CSV khớp nhau theo các trường đã kiểm tra.

### X.3.3. Phân tích các hiện tượng V0

**E2 – overbooking có bằng chứng trực tiếp.** Trong cả 30 trial, cả hai thao tác đều thành công với một slot capacity 1. Database readback cho thấy `bookedCount = 2`, trong khi chỉ có một membership row. Đây là quan sát runtime cụ thể về vượt capacity và chênh lệch giữa counter với số membership tương ứng hai thao tác thành công. Kết quả phù hợp với việc hai actor có đường ghi occupancy khác nhau; kết luận này giới hạn ở snapshot, fixture và lịch thực thi đã thử.

**E1 – normal-vs-normal được bảo vệ trong các lần chạy này.** Mỗi trial có một thành công và một conflict; không phát hiện over-capacity. Đây không chứng minh mọi actor hoặc mọi deployment topology đều an toàn.

**E3 – create/cancel và trạng thái slot.** Trong 30 trial, thao tác hủy thành công còn create đồng thời nhận conflict; create không thử lại sau khi capacity được giải phóng. Counter cuối là 0 và membership lịch sử còn lại. Slot cuối có `BLOCKED`/unavailable trong khi fixture không có điều kiện block riêng. Quan sát này cho thấy trạng thái slot có thể lệch so với quy tắc trạng thái tối giản của fixture; không tự kết luận chính sách lưu membership hoặc trạng thái blocked là sai.

**E4 – payment/expiry.** Cả hai service call hoàn tất trong 30 trial. Appointment và payment cuối là `PAID`, nhưng `bookedCount = 0`; expiry báo đã xử lý appointment. Slot được đọc là `FULL` nhưng `isAvailable = true`. Đây là state tuple quan sát trực tiếp. Việc late payment phải phục hồi occupancy, bị từ chối, hay dẫn đến hoàn tiền là vấn đề chính sách chưa được xác định và không được suy ra từ thực nghiệm này.

**E5 – callback lặp.** Hai callback tổng hợp đồng thời đều xử lý thành công trong cả 30 trial. Mỗi trial có hai dòng lịch sử `PAID` và hai lần thử enqueue email, hai lần enqueue push. Counter vẫn bằng 1 và membership vẫn là 1 trong fixture. Do đó, tín hiệu được tái hiện là xử lý lặp lịch sử/tác vụ phụ, không phải sai lệch counter occupancy trong kịch bản này.

**E6 – multi-slot thành công, chưa kiểm tra rollback.** Cả 30 lượt tạo lịch 60 phút thành công; hai slot đều có counter 1 và một membership. Không inject lỗi giữa các lần ghi, vì vậy riêng V0 không chứng minh được rollback khi thao tác nhiều slot thất bại giữa chừng.

**E7 – giảm capacity.** Trong 30 trial, cập nhật capacity về 0 thành công và create nhận conflict; không tái hiện over-capacity. Slot cuối là capacity 0, counter 0, `isAvailable = false`, status `AVAILABLE`. Kết quả phụ thuộc định nghĩa nghiệp vụ cho capacity 0 và trạng thái slot; thực nghiệm không phê duyệt chính sách đó.

**E8 – hủy trùng.** Cả hai lệnh hủy đều thành công trong 30 trial. Mỗi trial tạo hai lịch sử CANCELLED; counter bằng 0, membership lịch sử còn một hàng và slot thành BLOCKED/unavailable. Không quan sát counter âm.

Tổng cộng có 90 lần gọi thất bại, đều là conflict nghiệp vụ được ghi nhận trong E1, E3 và E7; harness không ghi nhận deadlock/serialization conflict. HTTP status không đo do không chạy HTTP server. Các kết quả này phân biệt rõ lỗi/sai lệch dữ liệu tái hiện với những câu hỏi chính sách occupancy còn bỏ ngỏ.

## X.4. Cơ chế V1

V1 là thay đổi trong source copy cô lập, tập trung vào các đường **tạo appointment thông thường** và **tạo appointment từ AI Pre-exam**. Cơ chế dùng PostgreSQL; không thêm Redis.

### X.4.1. Claim occupancy thống nhất

Trong `occupancy-claim.ts`, cả hai actor gọi chung `reserveSlotOccupancy` và `createSlotOccupancyMemberships`. Với danh sách slot cần giữ, cơ chế loại trùng và sắp xếp ID để thứ tự khóa ổn định. Với từng slot, trong transaction:

1. Thực hiện `SELECT * FROM "appointment_slots" WHERE id = ... FOR UPDATE`.
2. Đọc hàng được trả về sau khi lấy khóa.
3. Kiểm tra slot còn active, available, status `AVAILABLE`, và `bookedCount < capacity`.
4. Cập nhật counter và version bằng conditional update có điều kiện `bookedCount < capacity`, `isActive`, `isAvailable`, `status = 'AVAILABLE'`, rồi lấy hàng đã cập nhật bằng `RETURNING`.
5. Nếu không cập nhật được đúng một hàng, ném conflict để rollback transaction.

Sau khi reservation đã giữ được capacity, appointment, status history, membership và trạng thái slot được ghi trong cùng transaction. Membership `(appointmentId, slotId)` được tạo qua bảng `AppointmentSlotBooking`, với unique constraint hiện có trên cặp này. Nếu bất kỳ thao tác bắt buộc nào ném lỗi, transaction rollback cả counter lẫn membership và appointment liên quan.

### X.4.2. Tích hợp hai luồng đặt

Luồng normal trong `appointments.service.ts` xác định các slot cần thiết cho thời lượng dịch vụ rồi gọi reservation dùng chung trước khi tạo appointment. Luồng AI Pre-exam trong `pre-exam.service.ts` không còn coi lần đọc availability ngoài transaction là quyết định cuối cùng; nó kiểm tra lại trong claim dùng chung. Luồng AI cũng tạo membership theo cùng biểu diễn junction và gọi `SlotStatusService` để cập nhật trạng thái/khả dụng như luồng normal.

Một lần smoke test ban đầu phát hiện deadlock khi thứ tự là tạo appointment trước rồi mới `FOR UPDATE`: thao tác tạo appointment lấy khóa tham chiếu FK trên slot trong khi transaction cạnh tranh cũng muốn nâng lên khóa cập nhật. V1 đổi thứ tự để claim/update counter trước khi insert appointment, nhưng vẫn giữ tất cả trong cùng transaction. Smoke run đó bị loại khỏi kết quả cuối; đợt đo chính thức dùng database mới sau khi chỉnh sửa. Không có deadlock được ghi nhận trong 210 trial chính thức.

V1 không thay đổi payment service, cancel/expiry, capacity-management, schema hoặc migration. Do đó V1 không tuyên bố giải quyết E3, E4, E5, E7 hay E8.

## X.5. Thực nghiệm V1

### X.5.1. Kết quả

**Bảng X.3. Kết quả V1 theo nhóm trial**  
*Đơn vị: trial, service call, và số trial có bất thường. Latency tính bằng ms.*

| Kịch bản | Trials | Calls | Success | Failed | Over-capacity | Counter/membership mismatch | Duplicate membership | Rollback được xác minh | Deadlock/conflict | Avg | P50 | P95 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E1 concurrent normal create | 30 | 60 | 30 | 30 | 0 | 0 | 0 | — | 0 | 42.17 | 38.43 | 54.37 |
| E2 baseline normal vs AI | 30 | 60 | 30 | 30 | 0 | 0 | 0 | — | 0 | 22.03 | 19.70 | 39.81 |
| E2 normal-first controlled | 30 | 60 | 30 | 30 | 0 | 0 | 0 | — | 0 | 59.29 | 66.29 | 91.60 |
| E2 AI-first controlled | 30 | 60 | 30 | 30 | 0 | 0 | 0 | — | 0 | 52.60 | 34.88 | 90.95 |
| E2 barrier-release | 30 | 60 | 30 | 30 | 0 | 0 | 0 | — | 0 | 35.00 | 34.46 | 47.37 |
| E6 multi-slot success | 30 | 30 | 30 | 0 | 0 | 0 | 0 | — | 0 | 44.64 | 42.51 | 55.49 |
| E6 injected failure after first counter write | 30 | 30 | 0 | 30 | 0 | 0 | 0 | 30/30 | 0 | 23.19 | 21.72 | 35.65 |
| **Tổng** | **210** | **360** | **180** | **180** | **0** | **0** | **0** | **30/30 fault trials** | **0** | **40.83*** | **35.40*** | **84.66*** |

`—` = không áp dụng phép thử rollback cho nhóm này. E2 controlled latency bao gồm thời gian chờ do harness điều phối, và E6 fault latency gồm thao tác gây lỗi; không được dùng các latency đó như phép đo tải tự nhiên. Tổng latency gồm cả nhóm kịch bản khác nhau, do đó không so sánh trực tiếp với tổng V0.

**Nguồn Bảng X.3:** V1 JSON/CSV, tính lại từ từng lần gọi; V1 report. JSON và CSV khớp trên 210 trial, gồm outcome và latency per-trial.

### X.5.2. E2 và controlled interleaving

Trong E2 baseline, mỗi trial chỉ có một actor thành công; cả 30 trial đều thắng thuộc về AI Pre-exam trong lịch chạy này. Trong biến thể normal-first, normal thắng 30/30; trong biến thể AI-first, AI thắng 30/30. Khi cả hai được thả cùng barrier, normal thắng 16 trial và AI thắng 14 trial. Tất cả 120 trial E2 kết thúc với một claim, một conflict, counter bằng 1 cho capacity 1, một membership tương ứng; không có counter âm, duplicate membership hoặc over-capacity.

Kết quả baseline 30/30 nghiêng về AI không được xem là ưu tiên nghiệp vụ hoặc đảm bảo fairness. Các biến thể được thiết kế để chứng minh cả hai actor đều có thể claim khi đi trước, và actor còn lại sẽ đọc trạng thái sau khóa rồi bị từ chối nếu capacity đã đầy. Phân bố 16/14 ở barrier chỉ mô tả 30 lần chạy trên môi trường thử nghiệm này.

### X.5.3. Fault injection và database readback

Fault injection ném lỗi sau khi counter của slot đầu tiên đã được cập nhật guarded, trước khi tạo appointment/membership. Sau mỗi lỗi, harness xác minh:

- cả hai counter multi-slot trở về 0;
- không có membership của hai slot;
- không có appointment cho hồ sơ thử nghiệm;
- không có status-history của appointment đó.

Điều kiện rollback này đúng trong 30/30 trial được thử. Đây là bằng chứng cho điểm inject cụ thể, không chứng minh mọi điểm lỗi có thể có đều đã được kiểm thử.

Truy vấn kiểm kê cuối trên database V1 tổng hợp: 180 appointment, 270 slot, 210 membership; không slot nào có `bookedCount > capacity` hoặc counter âm. Số hàng này phù hợp với 30 appointment thành công E1, 120 appointment thành công qua các nhóm E2, và 30 appointment thành công E6; fault injection không để lại appointment/membership/counter đã ghi.

Trong smoke test ban đầu, một thứ tự ghi khác (tạo appointment rồi mới khóa slot) tái hiện deadlock PostgreSQL liên quan đến khóa tham chiếu FK và yêu cầu `FOR UPDATE`. Thứ tự này được đổi để reservation cập nhật counter trước khi insert appointment, vẫn trong transaction; smoke run bị loại khỏi kết quả chính và được chạy lại trên database mới. 210 trial chính thức sau thay đổi không ghi nhận deadlock/serialization conflict. Đây là một vòng lặp triển khai–kiểm thử được lưu lại trong báo cáo V1, không phải kết quả của cấu hình V1 cuối cùng.

## X.6. So sánh V0 và V1

Chỉ ba kịch bản có thể ghép tương ứng về mục tiêu, fixture cơ bản, schema, số trial và định nghĩa latency được đưa vào bảng so sánh. Dù vậy, E2 thay đổi outcome theo thiết kế V1, vì vậy latency E2 không phải so sánh hiệu năng tương đương.

**Bảng X.4. So sánh các kịch bản tương ứng V0–V1**  
*Latency: ms trên từng lần gọi service; tỷ lệ bất thường tính theo số trial trên 30.*

| Kịch bản | Phiên bản | Success/Calls | Over-capacity | Counter/membership mismatch | Avg | P50 | P95 |
|---|---|---:|---:|---:|---:|---:|---:|
| E1 concurrent normal create | V0 | 30/60 | 0/30 | 0/30 | 49.08 | 45.66 | 70.41 |
| E1 concurrent normal create | V1 | 30/60 | 0/30 | 0/30 | 42.17 | 38.43 | 54.37 |
| E2 normal vs AI pre-exam | V0 | 60/60 | 30/30 | 30/30 | 49.13 | 44.12 | 76.77 |
| E2 normal vs AI baseline | V1 | 30/60 | 0/30 | 0/30 | 22.03 | 19.70 | 39.81 |
| E6 multi-slot success | V0 | 30/30 | 0/30 | 0/30 | 47.11 | 41.52 | 60.76 |
| E6 multi-slot success | V1 | 30/30 | 0/30 | 0/30 | 44.64 | 42.51 | 55.49 |

**Độ đúng đắn.** Trên E2 đã kiểm thử, kết quả thay đổi từ hai thao tác thành công và counter vượt capacity trong 30/30 lượt V0 sang một thành công/một conflict, counter/membership nhất quán trong 30/30 lượt V1 baseline và từng controlled interleaving. Đây là bằng chứng thực nghiệm ủng hộ giả thuyết rằng dùng chung khóa hàng PostgreSQL và kiểm tra capacity trong transaction xử lý được E2 của snapshot đã thử.

**Counter và membership.** V0 E2 có `bookedCount = 2` nhưng một membership row khi hai booking thành công. V1 ghi membership cho cả hai actor thông qua helper chung; readback các trial V1 phù hợp số claim thành công. Sự nhất quán chỉ được khẳng định cho các fixture và operation đã chạy; không suy rộng sang membership lịch sử ở dữ liệu thật, nơi trạng thái lifecycle khác nhau có thể tồn tại.

**Latency.** E1 và E6 có average/P95 thấp hơn ở lần chạy V1 này, nhưng phép đo không được thiết kế như benchmark có kiểm soát tải, lặp nhiều phiên database, warm-up, phân tích độ biến thiên hoặc kiểm định thống kê. Vì thế chỉ nêu giá trị quan sát, không kết luận V1 nhanh hơn. E2 đặc biệt không so sánh hiệu năng: V0 xử lý thành công hai yêu cầu, còn V1 có một yêu cầu bị từ chối; workload và công việc thực hiện khác nhau. Các nhóm E2 controlled còn bao gồm thời gian chờ test-only. Tổng latency V0/V1 có cơ cấu scenario khác nên cũng không đối chiếu trực tiếp.

**Phạm vi V1.** E1/E2/E6 là các phạm vi chính đã chạy. Không thể dùng kết quả E2 để kết luận V1 sửa cancellation, expiry, payment callback, capacity reduction hay duplicate cancellation.

## X.7. Thảo luận và hạn chế

Thực nghiệm cung cấp một trường hợp lỗi cụ thể ở V0 và kết quả đối chứng cho cách xử lý claim occupancy dùng chung. Điểm đáng chú ý về phương pháp là kiểm tra database sau mỗi trial thay vì chỉ dựa trên response service: E2 V0 có thể trả về hai kết quả thành công nhưng trạng thái cuối mới cho thấy counter vượt sức chứa; E4 V0 thể hiện bất nhất giữa thanh toán và occupancy dù hai service call đều hoàn tất.

V1 dùng khóa hàng PostgreSQL và conditional update trong một transaction. Quan sát không có overbooking trong 120 E2 trial và rollback trong 30 fault trial cho thấy cơ chế hoạt động trong điều kiện thử nghiệm. Tuy nhiên, số trial hữu hạn, môi trường local và cách gọi trực tiếp service không bao quát tính chất tải thực, độ trễ mạng, nhiều process, hoặc các đường ghi khác ngoài hai luồng tạo appointment đã tích hợp.

Các hạn chế chính:

1. **Chưa kiểm thử HTTP:** không đo routing, authentication, validation, middleware, timeout hoặc HTTP 5xx.
2. **Chưa kiểm chứng production/multi-instance:** container test đơn trên loopback không cho phép kết luận về kiến trúc triển khai, số backend instance hay vận hành production.
3. **Không gian lịch xen kẽ chưa đầy đủ:** `Promise.all` và các barrier của V1 chỉ tạo một số trường hợp cụ thể; 30 hoặc 120 lượt không chứng minh mọi lịch đều an toàn.
4. **V1 không chạy E3/E4/E5/E7/E8:** không có bằng chứng rằng các luồng cancel/expiry, thanh toán callback lặp hay cập nhật capacity đã được sửa.
5. **Chính sách nghiệp vụ còn mở:** cách xử lý thanh toán muộn sau expiry, hoàn tiền, hủy, hết hạn, giảm sức chứa về 0 và lưu membership sau cancel/expire chưa được quyết định.
6. **Fault injection có giới hạn:** lỗi được gây ra sau counter write đầu tiên, trước khi tạo appointment/membership. Chưa inject lỗi trong membership insert, cập nhật trạng thái slot, ghi history, hoặc ở mỗi bước của multi-slot operation.
7. **Schema và migration:** database thử nghiệm dùng Prisma schema đã đồng bộ sau migrations. Kết quả không chứng minh schema production/migrations-only tương đương.
8. **Latency không phải benchmark:** sample nhỏ, local, không có kiểm soát đầy đủ tài nguyên, warm-up hoặc nhiều vòng lặp độc lập; không dùng để khẳng định tăng/giảm hiệu năng tổng quát.
9. **Membership là dữ liệu có lịch sử:** raw count không nhất thiết đại diện occupancy active trong mọi trạng thái. Các chỉ số nhất quán ở đây dựa vào kỳ vọng của fixture và thao tác thử nghiệm.
10. **Test seam V1:** hook barrier/fault injection thuộc source copy thí nghiệm; cần được loại bỏ hoặc thay bằng seam kiểm thử phù hợp trước mọi tích hợp production.

## X.8. Kết luận theo mức độ bằng chứng

### Những kết luận được dữ liệu chứng minh

- V0 E2 tái hiện over-capacity: hai luồng normal và AI Pre-exam đều thành công, counter đạt 2 trong khi capacity là 1 ở 30/30 trial; counter/membership signal cũng xuất hiện 30/30 lần.
- V0 E1 trong 30 trial có một thành công và một conflict, không phát hiện over-capacity.
- V0 E4 trong 30 trial kết thúc với payment/appointment `PAID` và counter 0 sau khi expiry xử lý appointment; ý nghĩa nghiệp vụ trạng thái này chưa được xác định.
- V0 E5 và E8 tái hiện side effect lịch sử/tác vụ trùng theo mô tả kết quả; đây không phải bằng chứng rằng chính sách callback hoặc hủy đã được phê duyệt.
- Trong V1 source copy và database test, 120 E2 trial (baseline cùng ba biến thể xen kẽ) đều chỉ có một claim thành công trên slot capacity 1, không có over-capacity, counter âm, mismatch hoặc membership trùng.
- Fault injection cụ thể của V1 rollback counter, membership, appointment và status history trong 30/30 trial.
- JSON và CSV khớp số dòng và dữ liệu trial/outcome/latency đã kiểm tra; các báo cáo V0/V1 khớp các tổng hợp được ghi trong đó.

### Những kết luận chưa đủ bằng chứng

- Không thể kết luận mọi lịch xen kẽ hoặc mọi actor trong hệ thống đều được bảo vệ.
- Không thể kết luận V1 đã sẵn sàng production, đã được triển khai phân tán, hoặc chạy an toàn trên nhiều backend instance.
- Không thể kết luận hiệu năng V1 tốt hơn V0 từ các latency local đã đo.
- Không thể kết luận E3/E4/E5/E7/E8 đã được khắc phục trong V1.
- Không thể xác định hành vi đúng nghiệp vụ cho late payment, refund, cancel/expiry, capacity zero hoặc retention membership chỉ dựa trên các kết quả này.
- Không thể suy ra tần suất lỗi production từ 30/30 hoặc 120/120 lượt thử.

### Những điểm cần bổ sung trước khi nộp nghiên cứu

- Mô tả rõ đối tượng nghiên cứu, giả thuyết và tiêu chí thành công được giảng viên/hội đồng thống nhất.
- Bổ sung kiểm thử HTTP và các actor ghi occupancy còn lại; ghi rõ phạm vi mỗi đường ghi.
- Thiết kế thêm kiểm thử lỗi tại nhiều điểm trong transaction, đặc biệt lỗi khi tạo membership, đồng bộ trạng thái slot và từng bước multi-slot.
- Xác minh schema/migrations trong môi trường được kiểm soát có thể tái lập; cung cấp hướng dẫn tạo database test an toàn.
- Nếu cần tuyên bố hiệu năng, thiết kế benchmark có tải và tài nguyên cố định, warm-up, nhiều lần chạy độc lập, đo phân phối latency/throughput và phương pháp phân tích thống kê phù hợp.
- Chốt và ghi nhận các chính sách late payment, refund, cancel, expiry, giảm capacity và membership lịch sử trước khi mở rộng kết luận sang toàn vòng đời appointment.
- Lưu artifact, source hash, cấu hình môi trường và phiên bản công cụ trong gói tái lập nghiên cứu; không công bố dữ liệu hoặc cấu hình nhạy cảm.

## X.9. Nguồn dữ liệu thực nghiệm

Các bảng và kết quả trong chương được tổng hợp từ:

- [Báo cáo V0](./V0_EXPERIMENT_REPORT.md), [JSON V0](./V0_EXPERIMENT_RESULTS.json), [CSV V0](./V0_EXPERIMENT_RESULTS.csv) và [harness V0](./nova-care-backend/test/occupancy-v0.harness.ts).
- [Báo cáo triển khai V1](./V1_IMPLEMENTATION_REPORT.md), [báo cáo thực nghiệm V1](./V1_EXPERIMENT_REPORT.md), [JSON V1](./V1_EXPERIMENT_RESULTS.json), [CSV V1](./V1_EXPERIMENT_RESULTS.csv).
- Harness V1 và source V1 nằm trong source copy thí nghiệm tại session workspace; đường dẫn copy và hash các file được lưu trong JSON V1 và báo cáo triển khai. V1 không được nhập vào source production hoặc working tree chính.
