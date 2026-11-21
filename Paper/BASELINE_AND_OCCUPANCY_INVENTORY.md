# Baseline và kiểm kê occupancy

**Phạm vi:** khảo sát source/config hiện có và chuẩn bị truy vấn kiểm kê PostgreSQL chỉ đọc.  
**Giới hạn:** không kết nối hoặc chạy truy vấn trên production; không chạy truy vấn DB trong nhiệm vụ này; không sửa source, migration hoặc database. Các câu SQL ở Phần 4 chỉ là mẫu để chạy trên bản sao/snapshot không production bằng tài khoản chỉ đọc.  
**Kết luận ngắn:** source working tree có nhiều thay đổi chưa commit; tìm thấy nhiều đường ghi counter/status/capacity ngoài luồng đặt lịch chính. Chưa thể xác định occupancy đúng chỉ từ status hoặc số hàng junction: policy chưa duyệt, và một số luồng giữ lại membership sau khi release.

## 1. Source baseline

### Git snapshot

| Thuộc tính | Giá trị ghi nhận |
|---|---|
| Repository root | `D:\KLTN_NovaCare` |
| Branch | `develop` |
| HEAD commit | `585dcd8db9d612b4d35d758fe7d285b4762298b6` |
| Upstream hiển thị trong status | `origin/develop`; status không hiển thị ahead/behind |
| Phân biệt snapshot | Source đang đọc = commit HEAD + thay đổi tracked trong working tree + các file untracked. Nội dung untracked chưa thuộc commit. |

`git status --short` được chạy chỉ đọc. Danh sách dưới đây là toàn bộ trạng thái được ghi nhận tại thời điểm kiểm tra; không có thao tác reset, checkout, stash, commit hoặc chỉnh sửa các file này.

### File modified (tracked, chưa commit)

**Backend/migration**

- `nova-care-backend/prisma/migrations/20260919163000_add_scheduling_and_availability_engine/migration.sql`
- `nova-care-backend/prisma/migrations/20261001190000_add_scoped_patient_consent/migration.sql`
- `nova-care-backend/prisma/migrations/20261005090000_add_telemedicine_consultations/migration.sql`
- `nova-care-backend/prisma/migrations/20261006090000_password_reset/migration.sql`
- `nova-care-backend/src/modules/admin/admin-appointments.controller.ts`
- `nova-care-backend/src/modules/admin/admin-appointments.service.ts`
- `nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts`

**Web client**

- `nova-care-web/package.json`
- `nova-care-web/src/app/(hospital-admin)/hospital-admin/appointments/page.tsx`
- `nova-care-web/src/components/admin/AdminSidebar.tsx`
- `nova-care-web/src/components/admin/schedules/AppointmentDetailDrawer.tsx`
- `nova-care-web/src/components/admin/schedules/AppointmentTab.tsx`
- `nova-care-web/src/components/layout/Footer.tsx`
- `nova-care-web/src/services/admin.service.ts`

### File untracked

- `APPROVED_BOOKING_POLICY_DRAFT.md`
- `BUSINESS_RULES_DECISIONS.md`
- `CONFLICT_RESOLUTION_DESIGN.md`
- `EXPERIMENTAL_TEST_PLAN.md`
- `IMPLEMENTATION_READINESS.md`
- `PROPOSED_ARCHITECTURE.md`
- `RESEARCH_CONTRIBUTIONS.md`
- `SYSTEM_ARCHITECTURE_AUDIT.md`
- `TECHNOLOGY_COMPARISON.md`
- `TRANS-JOUR.doc`
- `docs/NovaCare_catalog.svg`
- `docs/NovaCare_clinical_history.svg`
- `docs/NovaCare_core.svg`
- `docs/NovaCare_partner.svg`
- `docs/NovaCare_screening_passport.svg`
- `docs/NovaCare_telemedicine.svg`
- `docs/admin-hospital-sequence.puml`
- `docs/nova-care-schema-catalog.puml`
- `docs/nova-care-schema-class-diagram.puml`
- `docs/nova-care-schema-clinical-history.puml`
- `docs/nova-care-schema-core.puml`
- `docs/nova-care-schema-partner.puml`
- `docs/nova-care-schema-screening-passport.puml`
- `docs/nova-care-schema-telemedicine.puml`
- `nova-care-backend/src/modules/admin/admin-appointments.controller.spec.ts`

Các tài liệu nghiên cứu ở trên là untracked, không phải artifact đã có trong `HEAD`. `TRANS-JOUR.doc` được ghi nhận nhưng không mở/diễn giải do không thuộc scope.

### Diff của các file liên quan

- Migration scheduling `20260919163000...`: working diff thêm `breakStart`, `breakEnd`, `doctorWorkplaceId`, chuyển/copy doctor schedules sang workplace-level, bỏ `doctorId` cũ và bổ sung foreign key. Đây là migration chưa commit, có thay đổi schema/schedule đáng kể; không chạy hay xác minh trạng thái đã áp dụng trong DB.
- Migration consent, telemedicine và password reset cũng modified nhưng phần diff đã xem không cho thấy writer occupancy; chúng vẫn là migration chưa commit cần được đưa vào release/baseline review.
- `admin-appointments.controller.ts`: working diff bỏ `DELETE /api/v1/admin/appointments/:id` và thay đổi access-scope cho hospital admin. Trong `HEAD`, DELETE route tồn tại. Vì vậy inventory endpoint trong working tree khác endpoint ở commit.
- `admin-appointments.service.ts`: working diff xóa `cancelAppointment()` cùng nhánh decrement counter. Trong `HEAD`, service có cancel trong transaction, nhưng cũng chỉ giảm primary slot và không cập nhật junction.
- `hospital-admin.service.ts`: working diff thay đổi cancellation, thêm reason/eligibility checks, CAS bằng `updateMany(where: id + prior status)` và decrement có guard `bookedCount > 0`; vẫn chỉ cập nhật primary slot, không cập nhật membership. Đây là source chưa commit và không đại diện chắc chắn cho production.
- Các thay đổi web không được dùng làm bằng chứng rằng production client đã chuyển API; cần pin release và đối chiếu client/deployment khi cutover.

Diff được đọc bằng `git diff` có cảnh báo chuyển LF/CRLF cho một số file backend; không có thao tác ghi file trong quá trình kiểm kê.

## 2. Writer inventory

### 2.1 Nguồn dữ liệu và giới hạn diễn giải

Schema đặt tên bảng `appointments`, `appointment_slots`, `appointment_slot_bookings`, `payment_transactions`; `Appointment.slotId` là primary slot còn `AppointmentSlotBooking` là junction có unique `(appointmentId, slotId)`. Create chính ghi nhiều junction rows; do đó junction khác primary slot không mặc nhiên là lỗi.

Quan trọng: các luồng cancel/expiry được khảo sát đọc junction để giảm count nhưng không xóa junction. Do vậy:

- junction hiện tại không thể được hiểu là active occupancy ledger;
- `COUNT(AppointmentSlotBooking)` không phải oracle của `bookedCount`;
- `AppointmentStatus`/`PaymentStatus` cũng chưa có ánh xạ occupancy đã được duyệt;
- các phép so sánh trong SQL bên dưới là chẩn đoán dữ liệu, không tự động xác định record nào cần sửa.

### 2.2 Writers và thay đổi có thể ảnh hưởng occupancy

`BookingCommandService` là service nội bộ được đề xuất trong design, chưa tồn tại trong source. “Chuyển về command” dưới đây là nhu cầu thiết kế, không phải code đã thay.

| File, API và vị trí | Function / thao tác | Transaction? | Row lock / CAS / conditional guard? | Junction được cập nhật? | Rủi ro concurrency / consistency | Chuyển về BookingCommandService? |
|---|---|---|---|---|---|---|
| [appointments.service.ts create](./nova-care-backend/src/modules/appointments/appointments.service.ts#L26), `POST /api/v1/appointments` | Tạo appointment `AWAITING_PAYMENT`; tạo mọi membership; increment `bookedCount`; resolve trạng thái slot. | Có, appointment + membership + counters cùng transaction. | Có `SELECT ... FOR UPDATE` cho primary/candidate slots và kiểm capacity sau lock; increment không gắn điều kiện `count < capacity` trong câu update. Candidate lock ordering cần rà lại vì primary được khóa trước tập slot. | Có, tạo mỗi junction trong candidate window. | Đây là luồng bảo vệ tốt nhất, nhưng idempotency lookup đứng trước transaction; profile overlap query không serialize; unique key race cần xem xử lý. | **Có.** Giữ làm nền nhưng thống nhất ordered-lock protocol, command idempotency và guard. |
| [pre-exam.service.ts](./nova-care-backend/src/modules/pre-exam/pre-exam.service.ts#L212), `POST /api/v1/appointments/from-pre-exam` | Tạo `AWAITING_PAYMENT`, expires sau 30 phút, increment slot count. | Có cho insert appointment/history/increment. | Không thấy row lock, CAS hay conditional update; check `isAvailable/count` thực hiện trước transaction. | **Không**; không tạo `AppointmentSlotBooking`. | Hai request có thể cùng vượt precheck; counter tăng vượt capacity; primary appointment được tạo mà không có junction; TTL khác create thường. | **Có, ưu tiên cao.** Đây là đường booking độc lập và phải dùng chung command. |
| [appointments.service.ts cancel](./nova-care-backend/src/modules/appointments/appointments.service.ts#L546), `PATCH /api/v1/appointments/:id/cancel` | Chuyển sang `CANCELLED`; đọc membership rồi giảm mỗi count (fallback primary nếu không có junction). | Có cho status/count/history. | Không thấy lock/CAS trên appointment hoặc slot; dùng read-then-write absolute `max(0, count-1)`, không conditional decrement. | Đọc junction; không xóa/update junction. | Hai lệnh hủy hoặc hủy đua expiry có thể release hai lần/lost update; clamp có thể che count drift; membership giữ lại sau cancel. | **Có.** Transition và release cần atomic/idempotent. |
| [appointments.service.ts reschedule](./nova-care-backend/src/modules/appointments/appointments.service.ts#L662), `PATCH /api/v1/appointments/:id/reschedule` | Đọc availability target; trong transaction giảm count slot cũ, tăng target, cập nhật `Appointment.slotId`. | Có cho write; precheck target/overlap ở ngoài transaction. | Không thấy row lock, CAS hay guarded capacity decrement/increment ở transaction. | **Không**; chỉ cập nhật primary reference. | Target có thể bị nhận trước commit; decrement/increment dựa trên snapshot; multi-slot membership cũ vẫn còn, target không được thêm. | **Có.** Cần claim/release tập slot atomically. |
| [appointments.service.ts confirm](./nova-care-backend/src/modules/appointments/appointments.service.ts#L266), `PATCH /api/v1/appointments/:id/confirm` | `AWAITING_PAYMENT → CONFIRMED`; không sửa count. | Có. | Có đọc status trong transaction nhưng không CAS conditional update/lock tường minh. | Không thay junction. | Có thể đua expiry/payment/admin status; không tự làm occupancy count thay đổi, nhưng trạng thái có thể lệch. | **Có nếu transition nằm trong state machine booking.** |
| [appointments.service.ts expiry](./nova-care-backend/src/modules/appointments/appointments.service.ts#L770), `POST /api/v1/appointments/expire-pending` gọi service | Tìm hold cũ; chuyển `EXPIRED`; giảm count `appointment.slotId`. | Có từng appointment. | Không khóa/recheck candidate sau query; không CAS status/expiry; không conditional decrement. | Không; chỉ primary slot. | Hai sweeper có thể expire/release cùng appointment; multi-slot count drift; payment có thể thắng sau pre-read. | **Có.** Gọi cùng expiry command từ scheduler/API. |
| [expire-appointments.processor.ts](./nova-care-backend/src/queue/expire-appointments.processor.ts#L5), `process()` | Một implementation expiry thứ hai; candidate list đọc trước transaction, sau đó status `EXPIRED` và set absolute count `max(0, snapshot-1)`. | Có cho từng appointment. | Không CAS/lock; sử dụng counter snapshot ngoài transaction. | Không; chỉ primary slot. | Race/lost update/double release giống sweeper; implementation khác service expiry, equality dùng `< now`. | **Có nếu processor được wire; hiện chưa xác minh có được gọi.** Loại bỏ logic độc lập khi chuẩn hóa. |
| [payments.service.ts handleIpn](./nova-care-backend/src/modules/payments/payments.service.ts#L96), `GET/POST /api/v1/payments/vnpay-ipn` | Verified callback cập nhật `PaymentStatus` `PAID`/`FAILED`; success đặt appointment `PAID`. | Có cho payment, appointment, history. | Signature HMAC; `PAID` precheck ở ngoài transaction; không thấy row lock/CAS trên payment/appointment, không kiểm lại expiry/capacity trong transaction. | Không. | Callback trùng/muộn có thể chồng với expiry/cancel; trả `PAID` mà reservation đã release; payment event identity/dedupe chưa được xác minh. | **Có.** Adapter xác thực provider rồi command xử lý transition. |
| [payments.service.ts createPaymentUrl](./nova-care-backend/src/modules/payments/payments.service.ts#L17), `POST /api/v1/payments/create` | Tạo/upsert payment transaction ở `PENDING`; không đổi appointment/counter. | Không có transaction tường minh quanh upsert. | Unique `appointmentId` ở model; upsert atomically theo unique row, nhưng không khóa/recheck hold/appointment cùng transaction. | Không. | Concurrent payment URL retries có thể thay transaction code; có thể khởi tạo payment cho hold hết hạn nếu trạng thái chưa đổi. `PENDING` là payment state, không phải occupancy. | **Có phần kiểm tra eligibility/idempotency payment**; không cho phép đường này tự claim/release suất. |
| [payments.service.ts simulate success](./nova-care-backend/src/modules/payments/payments.service.ts#L205), `POST /api/v1/payments/simulate-success` | Ghi payment `PAID` và appointment `PAID`; history. | Có. | Có transaction nhưng không CAS/guard trạng thái/expiry. | Không. | Có thể bỏ qua lifecycle; endpoint hiện `@Public`; nguy cơ thành writer khác policy callback thật. | **Có**, chỉ qua cùng command trong môi trường được cho phép. |
| [admin-payments.service.ts refund](./nova-care-backend/src/modules/admin/admin-payments.service.ts#L80) | Chuyển payment và appointment sang `REFUNDED`. | Có. | Precheck REFUNDED ngoài transaction; transaction update không CAS. | Không; không release count/membership. | Refund race/duplicate hoặc appointment `REFUNDED` nhưng occupancy vẫn chiếm; semantics D7 chưa duyệt. | **Có cho transition appointment/booking;** phần provider refund cần payment workflow riêng. |
| [admin-appointments.service.ts updateStatus](./nova-care-backend/src/modules/admin/admin-appointments.service.ts#L427), `PATCH /api/v1/admin/appointments/:id/status` (controller có trong source) | Ghi status bất kỳ, gồm `CANCELLED`, `COMPLETED`, `NO_SHOW`; history/notification. | Có. | Đọc trước transaction; update không CAS. | Không. | Status có thể terminal nhưng count không release/consume. | **Có** mọi status mutation cần occupancy policy. |
| [admin-appointments.service.ts revertNoShow](./nova-care-backend/src/modules/admin/admin-appointments.service.ts#L360) | `NO_SHOW → PAID/CONFIRMED` theo payment. | Có. | Precheck ngoài transaction; update không CAS. | Không. | Có thể restore trạng thái booking mà reservation/slot đã bị release hoặc bán lại; membership không đối chiếu. | **Có.** |
| [hospital-admin.service.ts updateAppointmentStatus](./nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L527), `PATCH /api/v1/hospital-admin/appointments/:id/status` | Working tree: cancellation CAS appointment theo trạng thái đã đọc và guarded decrement primary slot; status khác ghi trực tiếp. | Có. | CAS cho status cancel; decrement có `bookedCount > 0`; không lock/check membership trong protocol chung. | Không. | Chỉ primary slot, không cập nhật junction; guarded count tránh âm nhưng không chứng minh đúng reservation nào được release. Hành vi này khác `HEAD` và chưa commit. | **Có.** Giữ authorization/hospital scope, chuyển release/status vào command. |
| [hospital-admin.service.ts revertNoShow](./nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L470) và [mockFulfill](./nova-care-backend/src/modules/hospital-admin/hospital-admin.service.ts#L675) | Revert `NO_SHOW`; mock fulfill đổi appointment sang `COMPLETED`. | Có. | Không thấy CAS/lock occupancy; mock route có guard demo theo `NODE_ENV`/flag. | Không. | Restore/complete không cập nhật occupancy; mock fulfill là thêm status writer cần tính khi kiểm kê. | **Có** cho transition; mock route phải giữ điều kiện demo. |
| [appointments.service.ts complete](./nova-care-backend/src/modules/appointments/appointments.service.ts#L844) | `COMPLETED` và tạo encounter; một nhánh mock/HIS cũng ghi `COMPLETED`. | Có. | Không CAS/lock booking row được thấy trong transition. | Không. | Counter không giảm; chưa biết `COMPLETED` giải phóng capacity hay giữ historical count (D10). | **Có** nếu D10 quy định consume/release. |
| [appointment-slots.service.ts updateSlot](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L263), `PATCH /api/v1/appointment-slots/:id` | Cập nhật capacity/isAvailable/isActive. | Không. | Đọc slot rồi validate capacity; write sau đó không transaction/lock/CAS. | Không. | Booking có thể tăng count sau precheck trước capacity update; `isAvailable`/`status` có thể bất nhất. | **Có cho slot policy command** hoặc service dùng cùng lock protocol với booking. |
| [appointment-slots.service.ts remove](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L377), `DELETE /api/v1/appointment-slots/:id` | Soft-disable slot (`isActive=false`) sau khi đếm appointment qua `Appointment.slotId`. | Không. | Check rồi update không lock/CAS; query chỉ nhìn primary reference và loại status `CANCELLED`/`EXPIRED`, không xét secondary junction. | Không. | Multi-slot appointment có thể không được tính nếu slot chỉ là membership phụ; có race giữa check count và deactivate. | **Cần slot-policy boundary** để khóa/đánh giá toàn bộ membership trước khi vô hiệu slot. |
| [appointment-slots.service.ts updateBookedCount](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L350) | Helper đọc count rồi ghi absolute `count + delta`. | Không. | Không lock/CAS; kiểm range ở snapshot. | Không. | Lost update hoặc capacity vượt khi concurrent calls. Không tìm thấy caller khác trong source hiện tại ngoài định nghĩa. | **Có nếu API/service còn sử dụng;** xác minh call sites trước khi giữ/export. |
| [clinic-rooms.module.ts assign](./nova-care-backend/src/modules/schedules/clinic-rooms.module.ts#L44), `POST /api/v1/clinic-rooms/sessions` | Gán room session và set slot capacity. | Có. | Khóa room và slot; kiểm `bookedCount == 0`, active/status/time trước khi update capacity. Không CAS, nhưng row lock có bảo vệ write này tương đối rõ. | Không. | Cạnh tranh booking bị serialize nếu mọi writer khóa cùng slot; cần kiểm tất cả writer có protocol tương thích. | **Cần command/shared lock** cho thay đổi capacity; không phải booking claim. |
| [schedule-reconciliation.service.ts](./nova-care-backend/src/modules/schedules/schedule-reconciliation.service.ts#L82), được gọi từ [availability.service.ts](./nova-care-backend/src/modules/schedules/availability.service.ts#L64) | Upsert slot; update capacity/endTime/active từ schedule. Việc đọc availability có thể kích hoạt write/reconciliation. | Không có transaction tường minh cho mỗi upsert. | Không thấy slot row lock/CAS; update không kiểm `bookedCount` trước khi đổi capacity. | Không. | Có thể giảm capacity dưới count, bật lại slot hoặc thay thời gian trong lúc booking; GET availability không thuần read-only. | **Cần đưa schedule mutations vào slot-policy boundary** hoặc bảo đảm không tác động slot đã có reservation. |
| [doctor-schedules.service.ts purgeFutureUnbookedSlots](./nova-care-backend/src/modules/doctor-schedules/doctor-schedules.service.ts#L241) | Tạo slot với count 0; purge deactivates slot có count 0. | Không có transaction tường minh cho purge. | Predicate `bookedCount: 0`; không lock/cas với booking claim. | Không. | Race create/purge có thể deactivate slot vừa được claim; là writer availability, không phải count. | **Cần đồng bộ với slot lock/policy**; slot generation itself không phải claim. |
| [appointment-slots.service.ts create/generate](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L100), [doctors.service.ts](./nova-care-backend/src/modules/doctors/doctors.service.ts#L280), [doctor-workplaces.service.ts](./nova-care-backend/src/modules/doctor-workplaces/doctor-workplaces.service.ts#L190), [schedule-reconciliation.service.ts](./nova-care-backend/src/modules/schedules/schedule-reconciliation.service.ts#L82) | Khởi tạo slot/capacity/count=0 hoặc upsert slot. | Tuỳ từng create; batch generation không có transaction chung. | Unique key chống slot trùng ở một số đường; không phải claim guard. | Không. | Tạo mới không claim booking; upsert existing capacity/active có thể ảnh hưởng slot đang được claim (xem các hàng capacity ở trên). | Không phải booking command cho create mới; **các update existing phải qua slot-policy boundary**. |
| [seed.ts](./nova-care-backend/prisma/seed.ts#L758), `seed.js`, [fix-slots.js](./nova-care-backend/scripts/fix-slots.js#L1) | Seed tạo appointment rồi đặt counter trực tiếp; không tạo junction trong đoạn seed được đọc. Script fix slot xóa slot chưa đặt và sửa thời gian slot của appointments. | Không có transaction tổng thể. | Không có lock/CAS. | Seed không thấy tạo junction; cleanup chỉ kiểm tra junction rỗng. | Chỉ dành cho thao tác seed/maintenance theo chủ đích; chạy nhầm vào DB dùng thật có thể phá dữ liệu/đồng bộ. `fix-slots.js` thay đổi giờ được appointment tham chiếu. **Không chạy các script này.** | Không cần đưa vào runtime command, nhưng phải khóa quyền/chính sách chạy script và tính vào data provenance. |

### 2.3 Các nơi chỉ đọc/đánh giá khả dụng

- [schedules/availability.service.ts](./nova-care-backend/src/modules/schedules/availability.service.ts#L126), [appointment-slots.service.ts](./nova-care-backend/src/modules/appointment-slots/appointment-slots.service.ts#L301), `doctors`, `doctor-workplaces`, `specialties`, `hospitals`, và [clinic-rooms.module.ts](./nova-care-backend/src/modules/schedules/clinic-rooms.module.ts#L20) đọc `bookedCount < capacity`/status để hiển thị hoặc tìm candidate. Đây là snapshot read, không giữ suất.
- [slot-status.service.ts](./nova-care-backend/src/modules/schedules/slot-status.service.ts#L15) resolve trạng thái slot từ active/count/capacity; helper có một số caller trong transaction create/cancel nhưng việc cập nhật status không thay thế claim/release protocol.
- `AppointmentSlotBooking` source mutation tìm thấy: chỉ có create trong create chính; không thấy update/delete/deleteMany hoặc tạo từ pre-exam/admin/payment/expiry.

## 3. Runtime inventory

### BullMQ / expiry / scheduler

| Câu hỏi | Điều xác minh được từ source/config | Giới hạn kết luận |
|---|---|---|
| BullMQ có package không? | `package.json` có `@nestjs/bullmq`, `bullmq`; QueueService nhận các injection token `BULL_EMAIL_QUEUE`, `BULL_PUSH_QUEUE`, `BULL_REMINDER_QUEUE`, `BULL_EXPIRE_QUEUE`. | Package và token declaration không chứng minh queue được khởi tạo. |
| BullMQ được khởi tạo? | Search source không thấy `BullModule.forRoot`, `registerQueue`, provider cho các `BULL_*` token, `@Processor`, `WorkerHost` hoặc Bull processor decorator. `QueueModule` chỉ đăng ký các class service/processor như Nest providers. | Theo source snapshot, **chưa thấy BullMQ được wire để chạy**. Runtime container/deployment chưa truy cập để xác minh. |
| Có expiry worker? | `ExpireAppointmentsProcessor.process()` có code expiry; không thấy decorator/worker registration hoặc caller của method. `QueueService.addExpireJob()` không tìm thấy call site ngoài định nghĩa. | Có class xử lý nhưng **chưa có bằng chứng processor là worker đang chạy**. |
| Có cron/scheduler? | Search không thấy `@Cron`, `ScheduleModule` hoặc scheduler gọi expiry. | Không thấy scheduler nội bộ trong source. Có thể có scheduler ngoài repo; chưa xác minh. |
| Có endpoint expiry? | `POST /api/v1/appointments/expire-pending` gọi `AppointmentsService.expirePendingAppointments()`, ở controller có `JwtAuthGuard` cấp lớp. Không tìm thấy caller nội bộ. | Endpoint tồn tại trong source; chưa xác minh có scheduler/service bên ngoài gọi hay không và tần suất gọi production. |
| Bull fallback | Email/push queue errors có direct-service fallback; expiry enqueue failure chỉ log warning. | Không thể coi expiry fallback là worker/safety net. |

### Redis, VNPay và số backend instances

| Câu hỏi | Kết quả |
|---|---|
| Redis sử dụng ở đâu? | `REDIS_HOST/PORT/PASSWORD` có trong config/env mẫu; `docker-compose.yml` khai báo service Redis. Không tìm thấy Redis client construction/command use trong source ứng dụng đã quét; `ioredis` dependency/config không chứng minh runtime feature. Chưa có bằng chứng Redis lock/cache/session đang hoạt động. |
| VNPay IPN ở đâu? | [payments.controller.ts](./nova-care-backend/src/modules/payments/payments.controller.ts#L64) public `GET` và `POST /api/v1/payments/vnpay-ipn`; controller chuyển query/body tới [PaymentsService.handleIpn](./nova-care-backend/src/modules/payments/payments.service.ts#L96). Service kiểm tra HMAC, tìm payment theo transaction reference, sau đó ghi `PAID`/`FAILED`; success đặt appointment `PAID`. `paidAt` được đặt lúc callback được xử lý trong source đang đọc. |
| VNPay runtime config? | Service đọc `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`, có fallback cấu hình trong source (URL fallback là sandbox). Compose/env mẫu không xác minh được endpoint IPN đã đăng ký ở VNPay hoặc values của runtime production. Không đọc hoặc công bố giá trị bí mật trong báo cáo. |
| Có bao nhiêu backend instances? | [docker-compose.yml](./nova-care-backend/docker-compose.yml#L20) khai báo một service `api` và một service Redis cho môi trường compose; không thấy replica count trong file này. Đây chỉ là cấu hình local/development, không xác minh production replicas. **Số instance đang chạy: chưa xác minh.** |

Trong source payments đã thấy `PaymentStatus.PENDING`, `PAID`, `FAILED`, `REFUNDED` được ghi. Không tìm thấy ghi `PROCESSING` hoặc `EXPIRED` trong payment transaction flow đã quét; cần xác minh có writer ngoài repo/provider polling nào không.

## 4. Data inventory preparation — SQL chỉ đọc

**Không chạy các câu truy vấn dưới đây trong production.** Chạy trên snapshot/backup đã khôi phục vào môi trường cô lập, bằng DB role chỉ có `SELECT`; không xuất PII không cần thiết. Những truy vấn này chưa được thực thi trong nhiệm vụ.

### 4.1 Đếm appointment theo status

```sql
SELECT a."status"::text AS appointment_status, COUNT(*) AS appointment_count
FROM "appointments" AS a
GROUP BY a."status"
ORDER BY appointment_status;
```

### 4.2 Appointment có primary slot nhưng thiếu junction tại primary

```sql
SELECT a."id", a."bookingCode", a."status"::text AS appointment_status,
       a."slotId", a."expiresAt"
FROM "appointments" AS a
WHERE NOT EXISTS (
  SELECT 1
  FROM "appointment_slot_bookings" AS b
  WHERE b."appointmentId" = a."id"
    AND b."slotId" = a."slotId"
)
ORDER BY a."createdAt";
```

Đây là mismatch cấu trúc so với primary membership. Appointment nhiều slot có thể có thêm membership khác primary; các slot phụ đó không phải lỗi tự thân.

### 4.3 Junction mồ côi hoặc không có primary appointment/slot

```sql
SELECT b."id" AS junction_id, b."appointmentId", b."slotId",
       (a."id" IS NULL) AS missing_appointment,
       (s."id" IS NULL) AS missing_slot
FROM "appointment_slot_bookings" AS b
LEFT JOIN "appointments" AS a ON a."id" = b."appointmentId"
LEFT JOIN "appointment_slots" AS s ON s."id" = b."slotId"
WHERE a."id" IS NULL OR s."id" IS NULL
ORDER BY b."createdAt";
```

Foreign keys hiện khai báo trong Prisma có thể ngăn các orphan mới; query này kiểm tra dữ liệu legacy/constraint drift, không chứng minh các FK đã được áp dụng trong DB đang vận hành.

### 4.4 Membership phụ khác primary — cần phân loại, không tự xem là lỗi

```sql
SELECT a."id", a."bookingCode", a."status"::text AS appointment_status,
       a."slotId" AS primary_slot_id,
       COUNT(b."id") FILTER (WHERE b."slotId" <> a."slotId") AS non_primary_membership_count,
       ARRAY_AGG(b."slotId" ORDER BY b."slotId")
         FILTER (WHERE b."slotId" <> a."slotId") AS non_primary_slot_ids
FROM "appointments" AS a
JOIN "appointment_slot_bookings" AS b ON b."appointmentId" = a."id"
GROUP BY a."id", a."bookingCode", a."status", a."slotId"
HAVING COUNT(b."id") FILTER (WHERE b."slotId" <> a."slotId") > 0
ORDER BY a."createdAt";
```

Đây có thể là membership đúng của multi-slot create, membership cũ bị giữ lại sau reschedule, hoặc dữ liệu không đồng bộ. Phải đối chiếu slot times, lịch sử và policy D5 trước khi phân loại.

### 4.5 Counter âm hoặc lớn hơn capacity

```sql
SELECT s."id", s."doctorWorkplaceId", s."startTime", s."endTime",
       s."bookedCount", s."capacity", s."status"::text AS slot_status
FROM "appointment_slots" AS s
WHERE s."bookedCount" < 0
   OR s."bookedCount" > s."capacity"
ORDER BY s."startTime";
```

Đây là vi phạm range của các cột; không cần quyết định status nào chiếm capacity để phát hiện. Việc sửa count vẫn cần xác định nguồn dữ liệu/policy.

### 4.6 `bookedCount` so với số junction thô (chỉ diagnostic)

```sql
SELECT s."id", s."startTime", s."bookedCount", COUNT(b."id") AS raw_junction_rows,
       s."bookedCount" - COUNT(b."id") AS counter_minus_raw_junction_rows
FROM "appointment_slots" AS s
LEFT JOIN "appointment_slot_bookings" AS b ON b."slotId" = s."id"
GROUP BY s."id", s."startTime", s."bookedCount"
HAVING s."bookedCount" <> COUNT(b."id")
ORDER BY s."startTime";
```

Không dùng `raw_junction_rows` làm occupancy: source hiện không xóa membership khi cancel/expiry. Kết quả chỉ xác định các slot cần điều tra.

### 4.7 Membership phân nhóm theo status (không phải occupancy truth table)

```sql
SELECT b."slotId", a."status"::text AS appointment_status,
       COUNT(*) AS membership_rows
FROM "appointment_slot_bookings" AS b
JOIN "appointments" AS a ON a."id" = b."appointmentId"
GROUP BY b."slotId", a."status"
ORDER BY b."slotId", appointment_status;
```

Dùng để tạo profile dữ liệu cho owner duyệt D1/D10; không cộng một tập trạng thái tùy ý rồi gọi là occupancy.

### 4.8 Hold `AWAITING_PAYMENT` đã quá hạn

```sql
SELECT a."id", a."bookingCode", a."status"::text AS appointment_status,
       a."slotId", a."expiresAt", p."status"::text AS payment_status,
       p."paidAt"
FROM "appointments" AS a
LEFT JOIN "payment_transactions" AS p ON p."appointmentId" = a."id"
WHERE a."status" = 'AWAITING_PAYMENT'
  AND a."expiresAt" < CURRENT_TIMESTAMP
ORDER BY a."expiresAt";
```

Predicate `<` trùng source expiry đang khảo sát. Rule tại đúng `expiresAt` chưa được thống nhất (`<` so với `<=`); query chỉ chuẩn bị danh sách theo predicate hiện tại, không khẳng định hold đã được giải phóng.

### 4.9 Payment/appointment status combinations cần review

```sql
SELECT a."id", a."bookingCode",
       a."status"::text AS appointment_status,
       p."status"::text AS payment_status,
       p."transactionCode", p."paidAt", a."expiresAt"
FROM "appointments" AS a
LEFT JOIN "payment_transactions" AS p ON p."appointmentId" = a."id"
WHERE (a."status" = 'PAID' AND (p."id" IS NULL OR p."status" <> 'PAID'))
   OR (p."status" = 'PAID' AND a."status" <> 'PAID')
   OR (p."status" = 'REFUNDED' AND a."status" <> 'REFUNDED')
   OR (a."status" = 'REFUNDED' AND (p."id" IS NULL OR p."status" <> 'REFUNDED'))
   OR (a."status" IN ('CANCELLED', 'EXPIRED') AND p."status" = 'PAID')
ORDER BY a."updatedAt";
```

Đây là danh sách cần đối chiếu provider/payment history và policy callback/refund; ví dụ `PAID` cùng `COMPLETED` hoặc `NO_SHOW` có thể có giải thích nghiệp vụ, không tự động kết luận bất thường.

### 4.10 Tóm tắt các cặp status/payment để rà soát

```sql
SELECT a."status"::text AS appointment_status,
       COALESCE(p."status"::text, 'NO_PAYMENT_ROW') AS payment_status,
       COUNT(*) AS pair_count
FROM "appointments" AS a
LEFT JOIN "payment_transactions" AS p ON p."appointmentId" = a."id"
GROUP BY a."status", p."status"
ORDER BY appointment_status, payment_status;
```

Không có câu `INSERT`, `UPDATE`, `DELETE`, `ALTER`, migration hoặc truy vấn DB production trong tài liệu này.

### Phân loại mismatch

| Kiểm tra | Có thể phát hiện chỉ bằng cấu trúc? | Cần policy/đối chiếu nghiệp vụ? |
|---|---|---|
| `bookedCount < 0` hoặc `bookedCount > capacity` | Có — range anomaly. | Cần để xác định giá trị sửa đúng. |
| Appointment thiếu junction primary | Có — membership primary vắng mặt. | Cần khi quyết định backfill/reservation source-of-truth. |
| Junction tham chiếu appointment/slot không tồn tại | Có — orphan về cấu trúc. | Thường không; cần kiểm tra FK được áp dụng hay không. |
| Junction có slot ngoài primary | Có thể liệt kê, nhưng không xác định đúng/sai. | Có — multi-slot hợp lệ và reschedule legacy đều có thể tạo dấu vết này. |
| Counter khác số junction thô | Có thể tính chênh lệch. | **Có** — junction chưa phải ledger active; không thể dùng so sánh này làm occupancy oracle. |
| `AWAITING_PAYMENT` quá `expiresAt` | Có thể liệt kê theo timestamp. | Có — boundary, payment `PROCESSING`, grace period, callback đến muộn và worker thực chạy. |
| Appointment/payment status bất thường | Có thể liệt kê các cặp ứng viên. | Có — late callback, refund, no-show/revert và enum semantics chưa duyệt. |

## 5. Kết luận và hành động còn lại

### Đã xác minh trong source snapshot

- `HEAD` là `585dcd8db9d612b4d35d758fe7d285b4762298b6`, branch `develop`; working tree có cả source/migration modified và artifacts untracked.
- Create chính là luồng tìm thấy dùng transaction, row locks, create junction và increment count.
- Create từ pre-exam là một đường tạo appointment thứ hai; kiểm capacity trước transaction, không tạo junction, increment count trực tiếp và dùng hold 30 phút.
- Cancel, expiry, reschedule, payment, admin status, hospital-admin status, refund và slot/schedule mutations không dùng đầy đủ cùng occupancy protocol.
- `AppointmentSlotBooking` chỉ được tạo tại create chính trong source đã quét; không thấy update/delete trong runtime modules. Cancel/expiry giữ lại rows theo code đã đọc.
- `QueueModule` được import nhưng chưa thấy Bull queue registration/provider/worker decorator; `addExpireJob` không có call site; không có cron/scheduler nội bộ tìm thấy.
- VNPay IPN public GET/POST được route vào `PaymentsService.handleIpn`; code hiện kiểm tra signature và cập nhật trạng thái payment/appointment.
- Compose khai báo một API service trong cấu hình local; số backend instances thực tế không thể xác định từ đó.

### Chưa xác minh

- Không truy cập production DB/cluster, provider dashboard hoặc host runtime; không biết migration nào đã áp dụng, runtime config, IPN callback URL, scheduler ngoài repo, Redis connection/client ở deployed code hay số API instances đang chạy.
- Không chạy SQL inventory, không biết số appointment/counter drift/orphan trong bất kỳ DB nào.
- Không pin được production build về commit HEAD; working tree và deployment có thể khác.
- Chưa xác minh đầy đủ mọi `AppointmentStatus`/`PaymentStatus` writer ngoài các modules/routes/script được quét, nhất là integration/maintenance code được deploy riêng hoặc writer ở external systems.

### Writers chưa kiểm kê đầy đủ / việc cần tiếp tục

- Tìm kiếm thêm mọi raw SQL/Prisma writer trong toàn bộ repo, generated/legacy scripts và deploy-side workers trước cutover; inventory hiện tập trung các NestJS modules, prisma seed files và script tìm thấy bằng code search.
- Kiểm tra toàn bộ call sites của `AppointmentSlotsService.updateBookedCount()` và các schedule reconciliation triggers ở deployment.
- Xác minh migration history/DB schema trên bản sao, rồi chạy các SELECT ở Phần 4 bằng role chỉ đọc.
- Đối chiếu những dòng working diff của admin/hospital-admin với commit được deploy; đặc biệt route admin cancellation đã bị xóa khỏi working tree nhưng còn ở HEAD.
- Điều tra các transition status được sửa trong mock/HIS, referral/integration và admin-payment workflow nếu chúng tồn tại trong bản build được triển khai.

### Cần người phụ trách quyết định

1. D1/D10: status nào chiếm capacity; ý nghĩa `bookedCount`; khi nào `COMPLETED`/`NO_SHOW` ngừng chiếm.
2. D2/D6: 15 hay 30 phút hold, expiry boundary, `PROCESSING`, timestamp payment có thẩm quyền và quy tắc callback muộn.
3. D3/D4/D7: cancel/reschedule, refund/manual review và appointment/payment transitions.
4. D5: slot window/multi-slot và kỳ vọng junction membership.
5. D8: patient overlap, có serialize theo hồ sơ hay không.
6. D9: giảm capacity, schedule reconciliation hoặc block slot đang có reservation.
7. Cho phép hay không các API `simulate-success`, manual status update, external expiry trigger; xác định owner runtime cho scheduler/worker.
8. Chốt commit baseline và xác nhận các thay đổi chưa commit/untracked có thuộc release khảo sát hay không.

### Điều kiện trước khi bắt đầu triển khai

- [ ] Pin commit/deployment snapshot; phân loại và review mọi source/migration diff, không dựa vào working tree như production evidence.
- [ ] Chủ nghiệp vụ phê duyệt D1–D10; có state/payment/occupancy truth table và late-payment/refund contract.
- [ ] Chạy SQL inventory chỉ đọc trên DB clone; tạo reconciliation report cho counter, membership, legacy reschedule và expired holds.
- [ ] Mọi record không thể phân loại theo rule đã duyệt được đưa vào danh sách manual review, không tự backfill.
- [ ] Xác minh API clients, admin/hospital-admin endpoint, payment provider, cron/external scheduler, queue/Redis wiring và replica count trong môi trường triển khai.
- [ ] Bao phủ `from-pre-exam`, payment/refund, expiry processor/API, admin writers, clinic-room capacity và schedule reconciliation trong writer inventory cuối.
- [ ] Chọn schema tối thiểu và kế hoạch expand/backfill/rollback; không chạy migration trước data review.
- [ ] Test oracle dựa trên policy được duyệt; correctness tests bao phủ mọi writer và multi-slot trước benchmark/cutover.

## Tài liệu và source đã tham chiếu

- [IMPLEMENTATION_READINESS.md](./IMPLEMENTATION_READINESS.md)
- [SYSTEM_ARCHITECTURE_AUDIT.md](./SYSTEM_ARCHITECTURE_AUDIT.md)
- [PROPOSED_ARCHITECTURE.md](./PROPOSED_ARCHITECTURE.md)
- [CONFLICT_RESOLUTION_DESIGN.md](./CONFLICT_RESOLUTION_DESIGN.md)
- [TECHNOLOGY_COMPARISON.md](./TECHNOLOGY_COMPARISON.md)
- [EXPERIMENTAL_TEST_PLAN.md](./EXPERIMENTAL_TEST_PLAN.md)
- [BUSINESS_RULES_DECISIONS.md](./BUSINESS_RULES_DECISIONS.md)
- [APPROVED_BOOKING_POLICY_DRAFT.md](./APPROVED_BOOKING_POLICY_DRAFT.md)
