# A Unified PostgreSQL-Based Occupancy Control Mechanism for Concurrent Appointment Booking in Digital Healthcare Systems

## Bản thảo tổng hợp bài báo nghiên cứu NovaCare

> **Trạng thái: bản ghép nội bộ đã qua kiểm tra chéo dữ liệu, chưa phải bản thảo sẵn sàng nộp.** Nội dung tái sử dụng tài liệu Related Work và chương kết quả thực nghiệm. Tác giả/đơn vị công tác chưa được cung cấp; tìm kiếm tài liệu chưa có protocol systematic; mức isolation thực tế của các kết nối thử nghiệm không được ghi lại. Chưa có thay đổi mã nguồn hoặc chạy thêm thực nghiệm trong đợt kiểm toán này.

## Abstract

Hệ thống đặt khám trực tuyến có thể cung cấp nhiều luồng tạo lịch nhưng cùng sử dụng sức chứa của một suất khám. Nếu các luồng đọc và cập nhật trạng thái occupancy theo các đường riêng, nhiều yêu cầu có thể cùng được chấp nhận mặc dù sức chứa chỉ còn một chỗ. Nghiên cứu này khảo sát và đánh giá một cơ chế occupancy claim thống nhất dựa trên các primitive giao dịch PostgreSQL, áp dụng cho luồng đặt lịch thông thường và luồng AI Pre-exam của NovaCare. Thực nghiệm V0 được thực hiện trên tám kịch bản, mỗi kịch bản 30 trial, tổng cộng 240 trial và 450 lần gọi service. Ở kịch bản normal booking cạnh tranh với AI Pre-exam trên slot capacity 1, cả hai yêu cầu cùng thành công và dữ liệu cuối vượt sức chứa trong 30/30 trial. Nguyên mẫu V1 dùng chung row-level lock, đọc lại trạng thái sau khóa, conditional update và transaction bao gồm counter, appointment cùng slot membership. Artifact thực nghiệm V1 được lưu giữ gồm 210 trial và 360 lần gọi service, gồm E1, bốn biến thể E2 có điều phối xen kẽ, E6 thành công và fault injection. Không quan sát over-capacity hoặc counter/membership mismatch trong 120 trial E2; fault injection sau lần ghi counter đầu tiên được ghi nhận rollback trong 30/30 trial. Kết quả chỉ phản ánh source copy thí nghiệm, PostgreSQL 16.14, fixture tổng hợp do harness tạo và gọi service trực tiếp; không phải kết quả production, HTTP hay multi-instance và không phải independent reproduction. Các primitive PostgreSQL được sử dụng là kỹ thuật đã biết; đóng góp được giới hạn ở việc thống nhất invariant và đánh giá trên các luồng cụ thể của NovaCare.

**Index Terms—** appointment scheduling, concurrency control, PostgreSQL, row-level locking, occupancy, transaction atomicity, healthcare capacity.

## I. Introduction

Các hệ thống đặt khám cần ánh xạ yêu cầu của bệnh nhân vào thời điểm và nguồn lực y tế có giới hạn. Nghiên cứu vận trù về outpatient scheduling tập trung vào cân bằng nhu cầu với công suất, thời gian chờ và sử dụng nguồn lực; các tổng quan cũng ghi nhận bài toán phụ thuộc vào bối cảnh dịch vụ và các quyết định vận hành [6], [7]. Tài liệu [8] có tiêu đề về tổng quan multi-appointment scheduling trong bệnh viện; do không truy cập được nội dung, bài này không dựa vào nó để diễn giải kết quả cụ thể. Ở tầng thực thi phần mềm, một yêu cầu đặt lịch không chỉ là chọn thời điểm phù hợp mà còn phải bảo đảm nhiều giao dịch đồng thời không tiêu thụ quá mức cùng một sức chứa.

Vấn đề nghiên cứu của bài này xuất phát từ hai đường nghiệp vụ cùng tạo lịch trong NovaCare: normal booking và AI Pre-exam. V0 cho thấy hai đường này có thể cùng thành công khi cạnh tranh một slot capacity 1: điều đó xảy ra trong 30/30 trial, với counter cuối bằng 2 và một membership row [10]. Trái lại, hai yêu cầu normal booking cùng cạnh tranh được xử lý thành một thành công và một conflict trong 30/30 trial. Các kết quả này là quan sát từ source snapshot và môi trường thử nghiệm, không phải đánh giá triển khai production.

Nghiên cứu xây dựng nguyên mẫu V1 trong source copy độc lập. Cả hai đường tạo lịch được chuyển qua cùng thao tác claim occupancy của PostgreSQL: khóa hàng slot, đọc lại dữ liệu sau khi khóa, kiểm tra capacity, thực hiện guarded update và ghi appointment cùng membership trong cùng transaction. Cơ chế tận dụng các kỹ thuật cơ sở dữ liệu sẵn có [1]–[5]; bài không tuyên bố row locking hay conditional update là thuật toán mới.

Các đóng góp trong phạm vi đánh giá hiện tại là:

1. Xác định khiếm khuyết occupancy cụ thể giữa normal booking và AI Pre-exam trên NovaCare bằng database readback sau mỗi trial.
2. Tích hợp một điểm claim dùng chung cho hai luồng tạo lịch trong nguyên mẫu cô lập, bao gồm counter và membership trong cùng transaction.
3. Đối chiếu V0/V1 qua thử nghiệm đồng thời có synthetic fixtures, các interleaving có điều phối và một fault-injection test multi-slot.

Phần còn lại của bài được tổ chức như sau: Mục II tổng quan tài liệu; Mục III định nghĩa bài toán và research gap; Mục IV mô tả V1; Mục V và VI trình bày phương pháp, kết quả; Mục VII thảo luận giới hạn; Mục VIII kết luận và hướng tiếp theo.

## II. Related Work

### A. Kiểm soát đồng thời và nhất quán giao dịch

Bernstein và Goodman tổng hợp các kỹ thuật kiểm soát đồng thời trong cơ sở dữ liệu phân tán, phân tích các bài toán đồng bộ hóa đọc–ghi và ghi–ghi, cùng các kỹ thuật giải quyết chúng [1]. Kung và Robinson trình bày hai họ phương pháp nonlocking theo hướng optimistic: cơ chế dựa chủ yếu vào transaction backup và giả định xung đột giữa các transaction không xảy ra; bài báo thảo luận những ứng dụng mà phương pháp này có thể hiệu quả hơn locking [2]. Các công trình nền tảng này cho thấy locking và optimistic control là những họ giải pháp đã được nghiên cứu; lựa chọn phù hợp phụ thuộc vào tải, xung đột và yêu cầu ứng dụng.

Cahill, Röhm và Fekete nghiên cứu chủ đề serializable isolation trên snapshot databases [3]. Do không truy cập được abstract hoặc toàn văn nguồn trong lượt xác minh này, bản thảo không diễn giải chi tiết phương pháp hay kết quả của công trình. Tài liệu PostgreSQL mô tả row-level locking và transaction isolation như các primitive nền tảng: locking clauses như `FOR UPDATE` khóa hàng mục tiêu trước các cập nhật xung đột, trong khi các mức isolation có những đặc tính khác nhau về snapshot và serialization failure [4], [5]. Những cơ chế này không tự bảo đảm ứng dụng đúng nếu các đường ghi không cùng khóa tài nguyên, không kiểm tra lại trạng thái hoặc ghi một phần ngoài transaction.

### B. Lập lịch hẹn trong y tế

Cayirli và Veral tổng quan nghiên cứu outpatient appointment scheduling, tập trung vào cân bằng nhu cầu với công suất, sử dụng nguồn lực và thời gian chờ; abstract mô tả các giải pháp thường đặc thù theo bối cảnh [6]. Gupta và Denton tổng hợp thách thức của scheduling trong chăm sóc sức khỏe, gồm biến thiên thời điểm bệnh nhân đến, sở thích bệnh nhân/nhà cung cấp, thông tin sẵn có, công nghệ, kinh nghiệm nhân viên và phản ứng thời gian thực khi kế hoạch sai lệch [7]. Marynissen và Demeulemeester có một bài tổng quan về multi-appointment scheduling trong bệnh viện [8]. Với [8], chỉ metadata thư mục và phạm vi thể hiện trong tiêu đề được xác minh; không truy cập được abstract hoặc toàn văn nên không diễn giải phương pháp hay kết quả. Các công trình này thuộc nhánh lập lịch; chúng không được dùng ở đây làm bằng chứng về một giao thức database-level cụ thể.

### C. Liên hệ và giới hạn của tổng quan

Nhánh concurrency/database cung cấp mô hình về xung đột giao dịch và cơ chế bảo đảm nhất quán [1]–[5]; các tổng quan healthcare scheduling [6], [7] xem xét phân bổ thời điểm, nguồn lực, công suất và các mục tiêu vận hành. [8] được nhận diện ở mức chủ đề qua tiêu đề multi-appointment scheduling; nội dung của nguồn này chưa được xác minh. Câu hỏi của NovaCare nằm tại giao điểm: làm sao để nhiều luồng nghiệp vụ tạo lịch cùng claim một slot, bảo toàn counter và membership, và có thể kiểm chứng bằng dữ liệu PostgreSQL sau giao dịch.

Đây là tổng quan chọn lọc, không phải systematic review. Chưa thực hiện tìm kiếm có cấu trúc đầy đủ trên IEEE Xplore, ACM Digital Library, SpringerLink và ScienceDirect; do đó research gap ở Mục III được phát biểu trong phạm vi tập tài liệu đã xác minh, không phải tuyên bố rằng không có nghiên cứu tương tự trong toàn lĩnh vực.

## III. Problem Definition and Research Gap

### A. Định nghĩa bài toán

Cho một slot \(s\) có sức chứa \(C_s\) và bộ đếm đặt chỗ `bookedCount` là \(B_s\). Nhiều transaction từ các luồng tạo lịch có thể đồng thời yêu cầu chiếm cùng slot. Trong trạng thái sau một claim hoàn tất, invariant capacity được mô tả là \(0 \leq B_s \leq C_s\). Các ghi đại diện cho một booking thành công—counter, appointment và slot membership—phải được commit hoặc rollback nhất quán trong phạm vi transaction.

Với booking nhiều slot, yêu cầu chiếm một tập slot \(S\). Nếu transaction không thể chiếm đủ các slot theo quy tắc hiện hành, nó không được để lại trạng thái một phần trong các thao tác occupancy thuộc transaction. Đây là mục tiêu nguyên tử của nguyên mẫu V1 đối với luồng multi-slot được thử; chưa khái quát thành contract cho mọi thao tác lifecycle như hủy, hết hạn, đổi lịch hay capacity modification.

### B. Bằng chứng vấn đề tại NovaCare

Trong V0 E2, normal booking và AI Pre-exam cùng cạnh tranh slot capacity 1. Cả hai service call thành công trong 30/30 trial; trạng thái PostgreSQL cuối ghi nhận `bookedCount = 2` và một membership row. Đây là runtime/database evidence cho over-capacity trong fixture thử nghiệm. V0 E1, gồm hai normal booking, không tái hiện over-capacity trong 30 trial. Do đó, kết quả chỉ ra rằng hành vi của một đường đặt không đại diện cho đường nghiệp vụ khác.

V0 còn quan sát một số trạng thái đáng chú ý ở E3–E8, nhưng không phải tất cả đều có thể kết luận là vi phạm chính sách: E4 có appointment/payment `PAID` đồng thời với counter 0 sau expiry; E5 có lịch sử thanh toán và enqueue side effect lặp; E3/E8 có slot ở trạng thái `BLOCKED`/unavailable sau hủy; E6 thành công nhưng không có fault injection; E7 giảm capacity về 0 mà không vượt counter. Những kết quả này được báo cáo như quan sát source/runtime và không tự chuyển thành phán quyết nghiệp vụ.

### C. Research gap và đóng góp

Trong tập tài liệu đã rà soát, các nghiên cứu concurrency cung cấp nền tảng tổng quát về locking, optimistic control và serializability [1]–[5], trong khi các tổng quan appointment scheduling tập trung vào quy tắc lập lịch, nhu cầu, công suất và nguồn lực [6]–[8]. Tập tài liệu này chưa trực tiếp trả lời trường hợp cụ thể của NovaCare: nhiều luồng tạo appointment (normal booking và AI Pre-exam) cùng cạnh tranh capacity của một slot trong ứng dụng PostgreSQL, trong đó `bookedCount` và slot membership phải được cập nhật như một claim nguyên tử có thể kiểm tra bằng database readback.

Research gap được giới hạn như sau: thiếu bằng chứng ứng dụng được trình bày trong tập tài liệu đã rà soát về tích hợp một giao thức occupancy claim chung vào nhiều luồng đặt lịch của cùng hệ thống y tế, sau đó đánh giá đồng thời over-capacity và counter/membership consistency qua các thử nghiệm service/database có điều phối. Không khẳng định chưa từng có nghiên cứu nào giải quyết vấn đề tương tự.

Đóng góp là tích hợp và đánh giá các primitive đã biết dưới một contract chung cho các đường nghiệp vụ cụ thể của NovaCare; không phải thuật toán concurrency mới, kiến trúc distributed mới, hoặc chứng minh hình thức tính đúng đắn.

## IV. Proposed Unified Occupancy Control Mechanism

V1 là nguyên mẫu trong source copy cô lập, không phải thay đổi production. Cơ chế tập trung vào normal appointment creation và AI Pre-exam appointment creation. Cả hai đường gọi chung các thao tác reservation và membership [9].

Trong transaction Prisma hiện có, nguyên mẫu thực hiện trình tự sau [9]:

1. Xác định danh sách slot cần claim, loại slot ID trùng và sắp xếp ID theo thứ tự ổn định.
2. Với từng slot, thực hiện `SELECT ... FOR UPDATE` để khóa hàng slot.
3. Đọc trạng thái hàng sau khi lấy khóa; từ chối nếu slot không active/available, status không phải `AVAILABLE`, hoặc `bookedCount` đã đạt capacity.
4. Cập nhật `bookedCount` và version bằng guarded SQL `UPDATE` với điều kiện capacity và trạng thái slot, dùng `RETURNING` để nhận hàng đã cập nhật.
5. Tạo appointment, status history và membership của từng slot trong cùng transaction; gọi resolver trạng thái slot hiện có.
6. Nếu thao tác bắt buộc thất bại, ném lỗi để transaction rollback counter và các ghi liên quan.

Normal booking trước đây đã có membership multi-slot; V1 chuyển thao tác occupancy của luồng này sang helper dùng chung. Luồng AI Pre-exam trong V1 được bổ sung membership và capacity được kiểm tra lại trong claim transaction thay vì dựa vào lần kiểm tra trước transaction làm quyết định cuối. Constraint unique hiện có trên cặp `(appointmentId, slotId)` tiếp tục là hàng rào chống membership trùng. Không thêm Redis hay schema/migration mới.

Thứ tự claim trước khi insert appointment được chọn sau khi smoke test ban đầu tái hiện deadlock do thứ tự tạo appointment rồi mới khóa slot, trong đó có liên quan đến khóa tham chiếu FK và yêu cầu `FOR UPDATE`. Smoke run ban đầu bị loại khỏi kết quả chính; cấu hình đã điều chỉnh được chạy lại trên database test mới. Kết quả 210 trial chính thức không ghi nhận deadlock/serialization conflict.

Khóa nhiều slot theo thứ tự ID ổn định giúp các transaction giao nhau theo slot dùng cùng thứ tự khóa. Đây là cách triển khai nhằm tránh chu trình chờ khóa trong trường hợp đã xét, không phải đảm bảo toàn bộ hệ thống không thể deadlock. V1 không xử lý các chính sách late payment, refund, capacity reduction, hủy/hết hạn/reschedule hoặc duplicate callback.

## V. Experimental Methodology

### A. Nguồn và môi trường

V0 và V1 chạy trên PostgreSQL 16.14 trong các container test mới, chỉ bind loopback [10], [11]. V0 dùng database `novacare_occupancy_test` tại `127.0.0.1:55439`; V1 dùng `novacare_occupancy_v1_test` tại original artifact target `127.0.0.1:55440`. Không sử dụng dữ liệu bệnh nhân thật, database production/development, Redis hoặc payment provider thật. Callback payment V0 là payload synthetic có chữ ký HMAC test-only; V1 không thử nghiệm payment.

### Business Process Under Test

Quy trình được đo bắt đầu khi bệnh nhân gửi yêu cầu đặt lịch qua luồng đặt lịch thông thường hoặc luồng AI Pre-exam. Cả hai luồng chọn appointment slot rồi chuyển yêu cầu vào shared occupancy claim. Trong cùng một transaction PostgreSQL, service khóa dòng slot, kiểm tra capacity và availability hiện tại, sau đó cập nhật `bookedCount` có điều kiện. Nếu claim thành công, hệ thống tạo `Appointment` và các bản ghi membership `AppointmentSlotBooking` rồi commit. Nếu một thao tác bắt buộc thất bại, transaction rollback counter và các ghi liên quan. Thực nghiệm chỉ bao phủ quy trình đặt lịch và claim này, gồm request đồng thời và một điểm rollback trong kịch bản nhiều slot. Payment, hủy, hết hạn, reschedule, refund và thay đổi trạng thái từ admin nằm ngoài pipeline được đo.

### Synthetic Data Generation

The experiments used synthetic data generated by the test harness. Each run created a shared hospital, specialty, doctor, workplace, and medical service. New patients and appointment slots were created for each trial. All tested slots had a capacity of one, an initial booked count of zero, and an available status.

In the concurrent booking scenarios, two different patients attempted to book the same slot through the normal and AI-assisted booking paths. The requests were executed concurrently using `Promise.all`. For selected V1 scenarios, synchronization hooks were used to control the request order.

The harness generated identifiers using `crypto.randomUUID()` and used `Date.now()` for timestamps. No fixed random seed was used. Trial-specific records were newly created, but the harness did not clear previous records between trials. Separate databases were used for V0 and V1. No real patient data or AI-generated data was used.

Hai lượt dùng cùng hash Prisma schema `a5a45a82b6a672737270b807301c94ec4ef86a8a157013303900bf60d76fecb5`. Cần phân biệt ba lớp: Prisma declared schema, schema được tạo bởi mười repository migrations, và schema của original synchronized experimental database. Các report V1 mô tả áp dụng migrations trước, sau đó đồng bộ Prisma schema trên database trống; exact V1 synchronization command không được lưu trong terminal log trực tiếp. Không còn original PostgreSQL dump/catalog để xác minh toàn bộ schema thực tế, nên kết quả V1 là preserved historical artifact chứ không phải independent reproduction hoặc migrations-only reconstruction. V0/V1 thừa hưởng baseline branch `develop`, Git HEAD `585dcd8db9d612b4d35d758fe7d285b4762298b6`; V1 được triển khai trong source copy độc lập từ V0 snapshot. Working tree ban đầu đã có thay đổi chưa commit và được bảo toàn. Báo cáo và JSON/CSV hiện có không ghi lại transaction isolation level hiệu lực của các kết nối, nên không thể gán chắc chắn kết quả runtime cho một isolation level đã xác minh cụ thể.

### B. Fixture và thực thi

Fixture gồm dữ liệu tổng hợp do harness tạo cho bệnh viện, chuyên khoa, bác sĩ, nơi làm việc, người dùng, hồ sơ bệnh nhân, dịch vụ, slot, appointment và payment record theo scenario. Harness gọi trực tiếp method service NestJS bằng Prisma client; không khởi động HTTP server. Các thao tác cạnh tranh được khởi chạy bằng `Promise.all`; database được đọc lại sau mỗi trial. Harness không xóa các record cũ giữa các trial, nên fixture không đại diện traffic hoặc hành vi người dùng thực tế.

V0 chạy E1–E8, 30 trial mỗi scenario: 240 trial và 450 service call [10]. V1 chạy E1, E2 baseline, E2 normal-first, E2 AI-first, E2 barrier-release, E6 thành công và E6 fault rollback: 210 trial, 360 service call [11]. Các hook V1 điều phối trước occupancy claim để kiểm tra các thứ tự E2 cụ thể; đây không phải bao phủ mọi interleaving. Fault injection ném lỗi sau khi cập nhật counter của slot đầu tiên trong transaction multi-slot, trước khi tạo appointment/membership.

### C. Chỉ số và định nghĩa

Các chỉ số gồm số lần gọi thành công/thất bại, HTTP 5xx, over-capacity, counter âm, counter/membership mismatch, thiếu/thừa hoặc trùng membership, rollback, deadlock/transaction conflict và latency trung bình/P50/P95. Không dùng raw `COUNT(AppointmentSlotBooking)` làm occupancy truth tổng quát; membership chỉ được đối chiếu với thao tác synthetic của trial. HTTP 5xx không đo (được lưu null), không phải zero.

Latency đo thời gian từng service call bằng đồng hồ monotonic của harness, loại trừ fixture setup và database readback [10], [11]. P50/P95 dùng nearest-rank `ceil(p*n)`, tương đương giá trị xếp hạng nhỏ nhất có thứ hạng ít nhất `ceil(p*n)` trong `n` quan sát đã sắp xếp. Controlled E2 latency chứa thời gian chờ test-only; fault injection latency có thao tác gây lỗi. Latency E2 không thể so sánh hiệu năng trực tiếp do V0 thành công hai request còn V1 từ chối một request. Không có benchmark hiệu năng có kiểm soát, warm-up nhiều phiên, hoặc kiểm định thống kê.

JSON có dữ liệu trial và latency từng request; CSV có một dòng mỗi trial [10], [11]. Đối chiếu theo từng dòng giữa JSON và CSV cho thấy không có sai lệch trên 240 dòng V0 và 210 dòng V1. Các tổng service call, thành công/thất bại và latency trung bình/P50/P95 trên request thô được tính lại khớp báo cáo.

## VI. Experimental Results

### A. Kết quả V0

**Bảng 1. Kết quả correctness V0.** `Calls (success/failure)` ghi tổng số service call và số thành công/thất bại; các bất thường tính theo trial.

| Kịch bản | Trials | Calls (success/failure) | Over-capacity | Counter/membership mismatch |
|---|---:|---:|---:|---:|
| E1 Concurrent Create | 30 | 60 (30/30) | 0/30 | 0/30 |
| E2 Normal vs AI Pre-exam | 30 | 60 (60/0) | 30/30 | 30/30 |
| E3 Create vs Cancel | 30 | 60 (30/30) | 0/30 | 0/30 |
| E4 Payment vs Expiry | 30 | 60 (60/0) | 0/30 | 0/30 |
| E5 Duplicate Payment | 30 | 60 (60/0) | 0/30 | 0/30 |
| E6 Multi-slot Booking | 30 | 30 (30/0) | 0/30 | 0/30 |
| E7 Capacity Reduction vs Create | 30 | 60 (30/30) | 0/30 | 0/30 |
| E8 Duplicate Cancel | 30 | 60 (60/0) | 0/30 | 0/30 |
| **Tổng** | **240** | **450 (360/90)** | **30/240** | **30/240** |

**Bảng 2. Latency V0.** Đơn vị ms trên từng service call; percentiles tính trên các call thô trong scenario.

| Kịch bản | Measured calls | Average | P50 | P95 |
|---|---:|---:|---:|---:|
| E1 Concurrent Create | 60 | 49.08 | 45.66 | 70.41 |
| E2 Normal vs AI Pre-exam | 60 | 49.13 | 44.12 | 76.77 |
| E3 Create vs Cancel | 60 | 22.86 | 22.93 | 37.99 |
| E4 Payment vs Expiry | 60 | 13.33 | 12.37 | 19.30 |
| E5 Duplicate Payment | 60 | 13.09 | 13.09 | 18.71 |
| E6 Multi-slot Booking | 30 | 47.11 | 41.52 | 60.76 |
| E7 Capacity Reduction vs Create | 60 | 14.38 | 15.69 | 21.66 |
| E8 Duplicate Cancel | 60 | 30.17 | 31.33 | 44.34 |
| **Tổng** | **450** | **28.75** | **22.47** | **57.46** |

Trong 240 trial V0, không có counter âm hoặc database deadlock/transaction conflict. Các trial có tín hiệu phụ gồm slot-state mismatch 120/240, payment/occupancy tuple E4 30/30, duplicate side effect 60/240 (E5 và E8), và missing/extra membership 30/240 (E2). `Slot-state signal` được tính theo quy tắc đơn giản của fixture, không phải quyết định chính sách. Payment/occupancy tuple không kết luận late payment là hành vi nghiệp vụ sai. Nguồn Bảng 1–2: V0 report và JSON/CSV [10].

E2 là kết quả over-capacity được tái hiện: cả hai service call thành công trên slot capacity 1 trong cả 30 trial; database ghi counter 2 và một membership row. Ở E1, hai normal create có một thành công/một conflict mỗi trial. E4 kết thúc với appointment/payment `PAID` nhưng counter 0 sau expiry trong 30 trial; policy xử lý thanh toán muộn chưa được xác định. E5 ghi nhận hai lịch sử PAID và hai lần thử enqueue email cùng push ở mỗi trial. E3/E8 có slot `BLOCKED`/unavailable theo fixture; E8 ghi hai lịch sử CANCELLED mỗi trial. E6 tạo lịch nhiều slot thành công 30/30 lần nhưng không thử fault rollback. E7 capacity giảm về 0 cạnh tranh với create, không tái hiện over-capacity.

Tổng cộng có 90 lời gọi thất bại dạng service conflict ở E1, E3 và E7; không ghi nhận database deadlock/serialization conflict. HTTP 5xx không đo.

### B. Kết quả V1

**Bảng 3. Kết quả correctness V1.** `Calls (success/failure)` ghi tổng số service call và số thành công/thất bại; các bất thường tính theo trial.

| Kịch bản | Trials | Calls (success/failure) | Over-capacity | Counter/membership mismatch | Rollback |
|---|---:|---:|---:|---:|---:|
| E1 Concurrent normal create | 30 | 60 (30/30) | 0/30 | 0/30 | N/A |
| E2 normal vs AI, baseline | 30 | 60 (30/30) | 0/30 | 0/30 | N/A |
| E2 normal-first controlled | 30 | 60 (30/30) | 0/30 | 0/30 | N/A |
| E2 AI-first controlled | 30 | 60 (30/30) | 0/30 | 0/30 | N/A |
| E2 barrier-release | 30 | 60 (30/30) | 0/30 | 0/30 | N/A |
| E6 multi-slot success | 30 | 30 (30/0) | 0/30 | 0/30 | N/A |
| E6 fault after first counter write | 30 | 30 (0/30) | 0/30 | 0/30 | 30/30 |
| **Tổng** | **210** | **360 (180/180)** | **0/210** | **0/210** | **30/30 fault trials** |

**Bảng 4. Latency V1.** Đơn vị ms trên từng service call; E2 controlled và fault injection gồm thời gian chờ/thao tác test-only.

| Kịch bản | Measured calls | Average | P50 | P95 |
|---|---:|---:|---:|---:|
| E1 Concurrent normal create | 60 | 42.17 | 38.43 | 54.37 |
| E2 baseline normal vs AI | 60 | 22.03 | 19.70 | 39.81 |
| E2 normal-first controlled | 60 | 59.29 | 66.29 | 91.60 |
| E2 AI-first controlled | 60 | 52.60 | 34.88 | 90.95 |
| E2 barrier-release | 60 | 35.00 | 34.46 | 47.37 |
| E6 multi-slot success | 30 | 44.64 | 42.51 | 55.49 |
| E6 fault after first counter write | 30 | 23.19 | 21.72 | 35.65 |
| **Tổng** | **360** | **40.83** | **35.40** | **84.66** |

Trong tất cả 210 trial của preserved V1 artifact, không có counter âm, missing/extra hoặc duplicate membership, hay deadlock/transaction conflict. Nguồn Bảng 3–4: V1 report và JSON/CSV [11].

Trong 180 service call thất bại, 150 là conflict occupancy dự kiến ở E1/E2 và 30 là lỗi được chủ động inject trong E6; đây không phải 180 lỗi runtime không phân loại.

Trong E2 baseline, AI Pre-exam thắng 30/30 trial; normal-first và AI-first lần lượt làm actor tương ứng thắng 30/30 trial. Barrier-release ghi nhận 16 normal và 14 AI thắng trong 30 lần chạy. Đây không phải bảo đảm fairness hoặc ưu tiên nghiệp vụ. Tổng 120 trial E2 có đúng một thành công và một conflict/trial; không có counter vượt capacity hoặc mismatch.

Trong E6 fault injection, lỗi được ném sau counter write đầu tiên, trước khi tạo appointment/membership. Cả hai counter trở về 0; không còn membership, appointment hay status-history của fixture bị lỗi trong 30/30 trial. Điều này xác nhận rollback tại điểm inject đã thử, không bao phủ lỗi tại mọi bước khác. Kiểm kê cuối database V1 trong report ghi 180 appointment, 270 slot, 210 membership; không có counter vượt capacity hoặc âm [11].

### C. So sánh V0 và V1

**Bảng 5. So sánh correctness trong các scenario tương ứng.** `Calls (success/failure)` ghi tổng số service call và số thành công/thất bại; các bất thường là số trial trên tổng trial của phiên bản.

| Scenario | Version | Trials | Calls (success/failure) | Over-capacity | Counter/member mismatch |
|---|---|---:|---:|---:|---:|
| E1 Concurrent normal create | V0 | 30 | 60 (30/30) | 0/30 | 0/30 |
| E1 Concurrent normal create | V1 | 30 | 60 (30/30) | 0/30 | 0/30 |
| E2 Normal vs AI Pre-exam | V0 | 30 | 60 (60/0) | 30/30 | 30/30 |
| E2 Normal vs AI baseline | V1 | 30 | 60 (30/30) | 0/30 | 0/30 |
| E6 Multi-slot success | V0 | 30 | 30 (30/0) | 0/30 | 0/30 |
| E6 Multi-slot success | V1 | 30 | 30 (30/0) | 0/30 | 0/30 |

Nguồn Bảng 5: tổng hợp từ V0/V1 experiment reports và kết quả JSON/CSV [10], [11].

**Bảng 6. Latency mô tả trong các scenario tương ứng.** Đơn vị ms trên từng service call; đây không phải phép so sánh benchmark.

| Scenario | Version | Measured calls | Average | P50 | P95 |
|---|---|---:|---:|---:|---:|
| E1 Concurrent normal create | V0 | 60 | 49.08 | 45.66 | 70.41 |
| E1 Concurrent normal create | V1 | 60 | 42.17 | 38.43 | 54.37 |
| E2 Normal vs AI Pre-exam | V0 | 60 | 49.13 | 44.12 | 76.77 |
| E2 Normal vs AI baseline | V1 | 60 | 22.03 | 19.70 | 39.81 |
| E6 Multi-slot success | V0 | 30 | 47.11 | 41.52 | 60.76 |
| E6 Multi-slot success | V1 | 30 | 44.64 | 42.51 | 55.49 |

Nguồn Bảng 6: tính lại từ latency từng request trong JSON V0/V1 [10], [11].

E2 V0 và V1 có outcome khác nhau có chủ đích: V0 xử lý thành công cả hai request, V1 chỉ chấp nhận một claim trên capacity 1. Vì vậy, latency E2 không phải workload tương đương. E1/E6 latency chỉ là quan sát mô tả của một lượt chạy; thiết kế không đủ để kết luận V1 nhanh hơn. Không so sánh aggregate latency V0/V1 do cơ cấu scenario khác nhau.

## VII. Discussion

### A. Ý nghĩa kết quả

V0 cung cấp bằng chứng runtime cụ thể về over-capacity ở E2: hai đường nghiệp vụ cạnh tranh cùng slot nhưng cùng thành công, counter và membership không phản ánh tương ứng hai claim thành công. Trong 120 trial E2 của preserved V1 artifact, không quan sát lại hiện tượng over-capacity sau khi hai luồng được quy tụ vào cùng điểm claim, khóa hàng slot và kiểm tra lại capacity trước khi ghi. Database readback cho thấy một booking thành công, một conflict và một membership phù hợp mỗi trial.

Kết quả hỗ trợ tính khả thi của cơ chế trong source copy và lịch thử đã chọn. 30/30 hay 120/120 lần thành công không chứng minh tính đúng đắn tuyệt đối cho mọi lịch xen kẽ hoặc mọi đường ghi. Fault injection cũng chỉ xác nhận rollback tại một điểm lỗi cụ thể trong transaction multi-slot.

### B. Tính nhất quán với tài liệu

Nguyên mẫu sử dụng các primitive được mô tả trong lý thuyết concurrency và tài liệu PostgreSQL [1]–[5]. Đóng góp không phải phát minh locking; trọng tâm là đưa các đường tạo appointment khác nhau qua cùng ranh giới serialization và duy trì counter, appointment, membership trong transaction. Các tổng quan healthcare scheduling [6], [7] cung cấp bối cảnh vận hành; [8] chỉ được dẫn để ghi nhận chủ đề nêu trong tiêu đề. Không nguồn nào trong nhóm này được dùng để khẳng định đã đánh giá cơ chế DB-level tương tự.

### C. Giới hạn và diễn giải thận trọng

1. **Chỉ gọi trực tiếp service:** không kiểm thử HTTP, routing, authentication, validation, middleware, timeout hoặc HTTP 5xx.
2. **Không production/multi-instance và không exact environment recovery:** test dùng database PostgreSQL local riêng, synthetic fixture và source copy. Chưa xác minh cách triển khai production hoặc nhiều instance. Không còn original database dump/catalog; exact V1 schema synchronization command cũng chưa được xác minh trực tiếp, nên preserved artifact không phải independent reproduction.
3. **Reset giữa các trial:** The experiment harness did not clear records between trials. Although each trial used newly created patients and appointment slots, previous records remained in the database. Therefore, the results should be interpreted within the tested experimental setup.
4. **Lịch xen kẽ hữu hạn:** E2 có barrier và ưu tiên actor tại ranh giới claim; không bao phủ mọi điểm xen kẽ trong hệ thống.
5. **Phạm vi V1 giới hạn:** chưa xử lý E3, E4, E5, E7, E8. Không khẳng định V1 sửa cancellation, expiry, payment callback, capacity reduction hoặc duplicate cancellation.
6. **Chính sách nghiệp vụ chưa chốt:** late payment sau expiry, refund, capacity reduction về 0, giữ/xóa membership sau release, cancel/expiry/reschedule và các trạng thái occupancy cần phê duyệt trước khi đánh giá correctness ở các luồng này.
7. **Hiệu năng chưa được benchmark:** latency là service-call latency của các lượt chạy cụ thể. Không có benchmark tải có kiểm soát, đủ vòng lặp độc lập, kiểm soát warm-up/tài nguyên hoặc kiểm định thống kê; không kết luận tăng tốc.
8. **Tổng quan tài liệu chưa hệ thống:** phạm vi tài liệu chọn lọc; đặc biệt tài liệu [8] mới xác minh metadata và chủ đề tổng quát, chưa đọc toàn văn/abstract. Vì vậy, research gap chỉ có giá trị trong phạm vi tập nguồn đã rà soát.
9. **Isolation level chưa được ghi nhận:** artifacts hiện có không cho biết isolation level hiệu lực của các transaction V0/V1; không thể xác định tác động thực nghiệm của một isolation setting cụ thể.
10. **Giới hạn mô hình occupancy:** raw membership lịch sử không được xem là occupancy truth phổ quát; dữ liệu legacy có thể phản ánh các vòng đời khác nhau. Kết quả chỉ đối chiếu dữ liệu synthetic theo kỳ vọng của từng scenario.

## VIII. Conclusion and Future Work

Trong preserved V0 artifact, normal booking và AI Pre-exam cùng đặt thành công một slot capacity 1 trong 30/30 trial, tạo trạng thái counter vượt capacity và counter/membership mismatch. Trong preserved V1 artifact, hai luồng được tích hợp vào cùng cơ chế PostgreSQL occupancy claim. Không quan sát over-capacity, counter/membership mismatch hoặc deadlock trong 120 trial E2; transaction multi-slot rollback tại điểm fault injection được ghi nhận trong 30/30 trial. Đây không phải independent reproduction của original environment; không còn original database dump/catalog và exact V1 synchronization command chưa được xác minh trực tiếp.

Các kết quả chứng minh được ở đây giới hạn trong preserved V1 source copy, schema snapshot được report mô tả là đã đồng bộ, PostgreSQL 16.14, synthetic fixtures và direct service invocation. Chúng không xác nhận independent reproduction, production readiness, multi-instance correctness, HTTP behavior hoặc mọi workflow occupancy. Row-level locking, conditional update và transaction là kỹ thuật đã biết; đóng góp là tích hợp và thực nghiệm trên hai đường tạo lịch NovaCare.

Trước khi nộp, cần hoàn thiện tìm kiếm và xác minh tài liệu theo yêu cầu của venue, bổ sung tên tác giả/đơn vị công tác và xác nhận ngôn ngữ được venue yêu cầu. Nếu tiếp tục đưa ra diễn giải dựa trên transaction isolation, cần tìm evidence đã lưu về setting hiệu lực hoặc mô tả điều này là chưa xác định. Các chính sách nghiệp vụ ngoài phạm vi V1 vẫn cần phê duyệt trước khi kết luận về chúng. Không chạy thêm thí nghiệm trong đợt kiểm toán này.

## References

[1] P. A. Bernstein and N. Goodman, “Concurrency control in distributed database systems,” *ACM Computing Surveys*, vol. 13, no. 2, pp. 185–221, 1981, doi: 10.1145/356842.356846.

[2] H. T. Kung and J. T. Robinson, “On optimistic methods for concurrency control,” *ACM Transactions on Database Systems*, vol. 6, no. 2, pp. 213–226, 1981, doi: 10.1145/319566.319567.

[3] M. J. Cahill, U. Röhm, and A. D. Fekete, “Serializable isolation for snapshot databases,” in *Proceedings of the 2008 ACM SIGMOD International Conference on Management of Data*, 2008, pp. 729–738, doi: 10.1145/1376616.1376690.

[4] PostgreSQL Global Development Group, “Explicit locking,” *PostgreSQL 16 Documentation*, §13.3. [Online]. Available: https://www.postgresql.org/docs/16/explicit-locking.html. [Accessed: Nov. 9, 2026].

[5] PostgreSQL Global Development Group, “Transaction isolation,” *PostgreSQL 16 Documentation*, §13.2. [Online]. Available: https://www.postgresql.org/docs/16/transaction-iso.html. [Accessed: Nov. 9, 2026].

[6] T. Cayirli and E. Veral, “Outpatient scheduling in health care: A review of literature,” *Production and Operations Management*, vol. 12, no. 4, pp. 519–549, 2003, doi: 10.1111/j.1937-5956.2003.tb00218.x.

[7] D. Gupta and B. T. Denton, “Appointment scheduling in health care: Challenges and opportunities,” *IIE Transactions*, vol. 40, no. 9, pp. 800–819, 2008, doi: 10.1080/07408170802165880.

[8] J. Marynissen and E. Demeulemeester, “Literature review on multi-appointment scheduling problems in hospitals,” *European Journal of Operational Research*, vol. 272, no. 2, pp. 407–419, 2019, doi: 10.1016/j.ejor.2018.03.001.

[9] *V1 unified occupancy implementation report* (`V1_IMPLEMENTATION_REPORT.md`), internal NovaCare technical report, unpublished. Describes the isolated experimental source copy, not a production deployment.

[10] *NovaCare occupancy V0 experiment report* (`V0_EXPERIMENT_REPORT.md`) and accompanying `V0_EXPERIMENT_RESULTS.json` / `V0_EXPERIMENT_RESULTS.csv`, internal experimental artifacts, unpublished.

[11] *V1 unified occupancy experiment report* (`V1_EXPERIMENT_REPORT.md`) and accompanying `V1_EXPERIMENT_RESULTS.json` / `V1_EXPERIMENT_RESULTS.csv`, internal experimental artifacts, unpublished.
