# Related Work and Research Gap

## 1. Phạm vi và cách tiếp cận

Đề tài nghiên cứu cơ chế kiểm soát occupancy dùng chung dựa trên PostgreSQL cho các yêu cầu đặt lịch khám đồng thời. Phần tổng quan này kết nối ba nhóm tài liệu: (i) kiểm soát đồng thời và tính tuần tự hóa của giao dịch; (ii) cơ chế khóa, isolation và MVCC trong PostgreSQL; và (iii) nghiên cứu tối ưu lịch hẹn trong y tế. Các tài liệu dưới đây được chọn vì có nguồn xuất bản hoặc DOI/URL có thể xác minh. Phần tổng quan không xem đây là một tổng quan hệ thống toàn diện và không suy diễn rằng không tồn tại nghiên cứu khác ngoài các tài liệu được rà soát.

Một điểm phân biệt quan trọng là **appointment scheduling** trong nghiên cứu vận trù thường nghiên cứu cách phân bổ thời điểm, nguồn lực, thời lượng, nhu cầu và thời gian chờ; còn **concurrency control** trong cơ sở dữ liệu nghiên cứu cách bảo đảm các giao dịch đồng thời không tạo ra trạng thái dữ liệu bất hợp lệ. Hai nhánh có liên quan nhưng không đồng nhất: một lịch được tối ưu về mặt vận hành vẫn cần cơ chế thực thi giao dịch bảo vệ sức chứa khi nhiều kênh cùng gửi lệnh đặt chỗ.

## 2. Nghiên cứu về kiểm soát đồng thời và tính nhất quán giao dịch

### 2.1. Các nền tảng về concurrency control

Bernstein và Goodman [1] tổng hợp các kỹ thuật kiểm soát đồng thời trong cơ sở dữ liệu phân tán, phân rã vấn đề đồng bộ hóa thành các xung đột đọc–ghi và ghi–ghi, đồng thời khảo sát các kỹ thuật giải quyết từng loại. Công trình cung cấp nền tảng khái niệm để phân tích vì sao hai tác nhân có thể cùng đọc một trạng thái còn chỗ rồi cùng ghi nhận đặt chỗ. Phạm vi của bài là kiểm soát đồng thời nói chung trong cơ sở dữ liệu phân tán; bài không đặc tả mô hình occupancy hay quy tắc đặt lịch khám.

Kung và Robinson [2] trình bày các họ phương pháp optimistic/nonlocking, trong đó giao dịch thực hiện với giả định xung đột hiếm và việc phát hiện/xử lý xung đột được đưa vào cơ chế giao dịch. Công trình giúp đặt giải pháp khóa cạnh tranh với các phương án không khóa, nhưng không nghiên cứu một hệ thống lịch khám cụ thể hoặc tính nhất quán giữa một bộ đếm sức chứa và bảng membership. Vì vậy, công trình hỗ trợ khung so sánh cơ chế, không phải bằng chứng rằng một loại cơ chế luôn vượt trội trong NovaCare.

Cahill, Röhm và Fekete [3] nghiên cứu cách bảo đảm Serializable trên cơ sở dữ liệu sử dụng snapshot isolation. Bài báo chỉ ra rằng snapshot isolation có thể cho phép các lịch giao dịch vi phạm nhất quán dù từng giao dịch riêng lẻ duy trì các điều kiện dữ liệu; họ đề xuất theo dõi các xung đột giữa giao dịch để ngăn các bất thường này mà không cần thêm khóa tùy tiện vào ứng dụng. Liên hệ với đề tài là việc lựa chọn mức isolation và cách phối hợp các giao dịch phải dựa trên invariant cụ thể, chứ không chỉ dựa vào giả định rằng mỗi câu lệnh đã chạy trong transaction. Tuy nhiên, đây là công trình về cơ chế serializability tổng quát, không phải đánh giá booking hoặc PostgreSQL occupancy theo hai đường nghiệp vụ.

### 2.2. PostgreSQL: row-level locking và transaction isolation

Tài liệu PostgreSQL 16 mô tả `SELECT ... FOR UPDATE` là một locking clause khóa các hàng được chọn để ngăn giao dịch khác sửa đổi hoặc khóa chúng theo cách xung đột cho đến khi transaction kết thúc [4]. Trong chế độ Read Committed, nếu một lệnh khóa hàng phải đợi một transaction khác cập nhật cùng hàng, PostgreSQL chờ transaction đó kết thúc rồi xử lý phiên bản hàng đã cập nhật; hành vi này cho phép ứng dụng đọc lại trạng thái hàng sau khi giành được khóa. Cơ chế này phù hợp với bài toán tranh chấp khi các yêu cầu đặt cùng một slot được quy tụ về cùng một hàng slot.

Tài liệu isolation của PostgreSQL cũng lưu ý Read Committed là mức mặc định và một transaction có thể quan sát các snapshot khác nhau giữa các câu lệnh; một số lịch đồng thời có thể dẫn tới kết quả không tương đương thực thi tuần tự [5]. Mức Serializable nhằm bảo đảm tương đương một thứ tự tuần tự nhưng giao dịch có thể bị hủy và cần được thử lại. Do đó, một triển khai dựa trên row lock và conditional update có thể là lựa chọn tường minh, hẹp theo tài nguyên tranh chấp; còn Serializability là một lựa chọn isolation rộng hơn với đặc tính abort/retry cần được xử lý. Tài liệu PostgreSQL mô tả hành vi của nền tảng, không chứng minh rằng một lược đồ khóa hoặc transaction boundary tùy ý trong ứng dụng là đúng.

Trong nguyên mẫu V1 của NovaCare, báo cáo triển khai ghi nhận hai đường tạo lịch thường và AI Pre-exam dùng chung thao tác claim: khóa hàng slot, đọc lại trạng thái sau khóa, kiểm tra điều kiện sức chứa, cập nhật `bookedCount` có điều kiện và ghi membership trong cùng Prisma transaction [N1]. Khóa nhiều slot được lấy theo thứ tự ID ổn định trong nguyên mẫu. Đây là cách áp dụng các primitive của PostgreSQL vào invariant cụ thể, không phải một thuật toán khóa mới. Việc conditional update bổ sung một guard tại điểm ghi; nó không thay thế transaction và việc cập nhật membership nguyên tử.

## 3. Nghiên cứu về appointment scheduling trong y tế

Cayirli và Veral [6] khảo sát rộng tài liệu về outpatient appointment scheduling, mục tiêu thường gặp là khớp nhu cầu với công suất để sử dụng nguồn lực tốt hơn và giảm thời gian chờ. Nhóm tác giả tổng hợp mô hình hóa, phân loại phương pháp và chỉ ra rằng giải pháp trong các nghiên cứu trước thường phụ thuộc mạnh vào bối cảnh cụ thể, chưa dễ chuyển thành hướng dẫn tổng quát cho thiết kế hệ thống. Công trình có giá trị để xác định các yếu tố vận hành mà một hệ thống đặt khám phải mô hình hóa; tuy nhiên, trọng tâm không phải xử lý giao dịch đồng thời hoặc bảo vệ một counter khi nhiều kênh cùng claim slot.

Gupta và Denton [7] mô tả appointment scheduling trong chăm sóc sức khỏe như một bài toán có nhiều biến động và quyết định, bao gồm thời điểm bệnh nhân đến, thời lượng dịch vụ, sở thích bệnh nhân và nhà cung cấp, thông tin sẵn có và khả năng phản ứng thời gian thực khi kế hoạch thay đổi. Bài viết tổng quan các bối cảnh cung cấp dịch vụ và đưa ra hướng phát triển cho các mô hình Industrial Engineering/Operations Research. Bài báo làm rõ độ phức tạp nghiệp vụ của lịch khám nhưng không đưa ra một giao thức database-level để đồng bộ hai luồng tạo appointment cạnh tranh trên cùng dữ liệu sức chứa.

Marynissen và Demeulemeester [8] tổng quan bài toán lập lịch nhiều cuộc hẹn trong bệnh viện. Hướng này gần với trường hợp NovaCare cần đặt nhiều slot cho một dịch vụ: tính khả thi của toàn bộ chuỗi slot khác với kiểm tra một slot đơn lẻ. Tuy nhiên, bài toán lập lịch một chuỗi nhiều cuộc hẹn không tự giải quyết vấn đề transaction atomicity khi một yêu cầu đồng thời tranh các slot đó. Metadata thư mục xác minh tiêu đề, tác giả, năm, tạp chí và phạm vi multi-appointment; do bản toàn văn/abstract không truy cập được trong quá trình rà soát, tài liệu này không được dùng để khẳng định các kết quả chi tiết hơn. Trong phạm vi được xác minh, đây là nghiên cứu về lập lịch, không phải nghiên cứu về PostgreSQL locks hay cập nhật counter.

## 4. Đối chiếu khoảng cách giữa hai nhánh nghiên cứu

| Khía cạnh | Nghiên cứu concurrency/database | Nghiên cứu appointment scheduling | Câu hỏi cụ thể trong NovaCare |
|---|---|---|---|
| Đối tượng chính | Lịch giao dịch, lock, isolation, xung đột và tính tuần tự hóa [1]–[5] | Phân bổ lịch, nhu cầu, công suất, thời gian chờ và nguồn lực y tế [6]–[8] | Làm sao bảo đảm một slot không bị claim vượt sức chứa khi hai đường dịch vụ cùng ghi? |
| Mức mô hình | Transaction và cấu trúc dữ liệu tổng quát | Bệnh nhân, bác sĩ, thời gian, nguồn lực và quy tắc lập lịch | Tách trạng thái appointment/payment khỏi trạng thái claim occupancy ra sao? |
| Nhiều luồng nghiệp vụ | Các kỹ thuật áp dụng cho giao dịch có xung đột | Thường phân tích các chính sách và quy trình đặt lịch | Normal booking và AI Pre-exam phải dùng chung ranh giới tuần tự hóa nào? |
| Nhiều slot | Khóa/transaction có thể bao phủ nhiều hàng, nhưng thứ tự và ranh giới phụ thuộc ứng dụng | Có nghiên cứu lịch nhiều cuộc hẹn và tài nguyên phụ thuộc [8] | Counter, membership và appointment phải commit hoặc rollback cùng nhau thế nào? |
| Bằng chứng | Tính đúng đắn của giao thức concurrency tổng quát | Chất lượng lịch và hiệu quả vận hành | Có thể kiểm tra bằng database readback sau các lời gọi đồng thời thực tế hay không? |

Từ đối chiếu này, không nên đồng nhất “hệ thống đã có transaction” với “invariant occupancy được bảo vệ”. Transaction chỉ đảm bảo tính nguyên tử trong phạm vi các thao tác đã được đưa vào transaction; nó không tự đồng bộ hai luồng nếu hai luồng không khóa/cập nhật cùng tài nguyên theo cùng quy tắc. Tương tự, kết quả tối ưu hóa lịch không bảo đảm rằng thao tác ghi đồng thời trong ứng dụng sẽ không vượt capacity.

## 5. Bối cảnh bằng chứng từ NovaCare

Báo cáo thực nghiệm V0 ghi nhận trong 30/30 trial E2, một yêu cầu đặt thông thường và một yêu cầu AI Pre-exam cùng thành công trên slot capacity 1; dữ liệu cuối có `bookedCount = 2` và một membership row [N2]. Đây là kết quả runtime trong source copy, PostgreSQL test riêng và synthetic fixture; không phải kết quả production. Báo cáo cũng nêu rằng V0 E1 (hai yêu cầu đặt thường) không vượt capacity trong 30 trial, cho thấy kiểm tra theo từng đường nghiệp vụ không đủ để suy ra rằng các đường khác đã cùng được tuần tự hóa.

Trong source copy V1, hai luồng dùng chung occupancy claim dựa trên PostgreSQL row lock và guarded update, với membership cùng các ghi liên quan nằm trong transaction [N1]. Thực nghiệm V1 ghi nhận 120 trial E2 (baseline và các biến thể điều phối xen kẽ), mỗi trial có một yêu cầu thành công và một yêu cầu xung đột; không có over-capacity hoặc counter/membership mismatch trong các trial này. Fault injection trên một điểm cụ thể của giao dịch multi-slot rollback thành công 30/30 lần [N3]. Các kết quả này là bằng chứng thực nghiệm hữu hạn cho nguyên mẫu cô lập, không phải chứng minh toàn diện với mọi lịch xen kẽ, HTTP, môi trường production hoặc triển khai nhiều instance.

Những bằng chứng của NovaCare tạo ra một câu hỏi ứng dụng cụ thể: nếu một ứng dụng có nhiều đường tạo lịch, nhưng các đường đó cùng tác động lên một nguồn sức chứa, liệu việc đưa chúng qua một giao thức claim PostgreSQL thống nhất có loại bỏ được hiện tượng hai giao dịch cùng tiêu thụ phần capacity cuối cùng, đồng thời duy trì nhất quán giữa counter và membership trong cùng transaction hay không? Đây là câu hỏi triển khai và kiểm chứng một invariant cụ thể, không phải câu hỏi phát minh `SELECT FOR UPDATE`.

## 6. Research Gap

### 6.1. Khoảng trống được xác định

Trong nhóm tài liệu được xác minh, nghiên cứu concurrency cung cấp các nguyên lý tổng quát về locking, optimistic control và serializability [1]–[5], trong khi các tổng quan appointment scheduling tập trung chủ yếu vào chính sách lập lịch, công suất, nhu cầu và các nguồn lực y tế [6]–[8]. Các công trình thuộc hai nhánh này tạo nền tảng cần thiết nhưng chưa trực tiếp trả lời bài toán kỹ thuật ở phạm vi NovaCare: **nhiều luồng tạo appointment khác nhau, gồm normal booking và AI Pre-exam, cùng cạnh tranh capacity của một slot trong ứng dụng dùng PostgreSQL; counter và slot membership cần được cập nhật như một claim nguyên tử có thể đối chiếu bằng dữ liệu sau giao dịch.**

Khoảng trống vì vậy được phát biểu có giới hạn: **thiếu bằng chứng ứng dụng được trình bày trong tập tài liệu đã rà soát về việc tích hợp một giao thức occupancy claim chung vào nhiều luồng đặt lịch trong cùng hệ thống y tế, rồi kiểm tra đồng thời cả over-capacity lẫn tính nhất quán giữa counter và membership bằng các thử nghiệm service/database có điều phối**. Không phát biểu rằng chưa từng có nghiên cứu nào giải quyết vấn đề tương tự; cũng không khẳng định đây là khoảng trống của toàn bộ lĩnh vực trước khi có một systematic review rộng hơn.

### 6.2. Đóng góp nghiên cứu có thể bảo vệ

Đóng góp của nghiên cứu nên được diễn đạt ở mức thiết kế ứng dụng và đánh giá thực nghiệm:

1. **Đặc tả invariant occupancy cho một hệ thống đặt khám cụ thể.** Một claim thành công phải tôn trọng capacity, đồng thời thống nhất `bookedCount`, membership và việc tạo appointment trong một transaction. Đây là đặc tả trường hợp ứng dụng, không phải invariant mới trong lý thuyết cơ sở dữ liệu.
2. **Tích hợp một điểm kiểm soát dùng chung cho các actor/luồng tạo lịch.** Normal booking và AI Pre-exam được chuyển qua cùng thao tác PostgreSQL claim để tránh việc mỗi luồng tự quyết định capacity trên trạng thái đọc cũ hoặc cập nhật các biểu diễn occupancy khác nhau.
3. **Đánh giá bằng đối chứng V0/V1 có database readback.** V0 cung cấp bằng chứng có thể tái lập trong harness về E2; V1 đo lường các kịch bản tương ứng cùng những biến thể xen kẽ và rollback multi-slot. Báo cáo cần giữ rõ giới hạn về số trial, test trực tiếp service, môi trường local synthetic và chưa có production/multi-instance.
4. **Tách correctness khỏi performance.** Kết quả cho phép đánh giá over-capacity và counter/membership consistency trong các điều kiện đã thử; số liệu latency hiện tại chỉ mang tính mô tả, không đủ để tuyên bố cải thiện hiệu năng.

### 6.3. Giới hạn của tuyên bố novelty

`SELECT ... FOR UPDATE`, transaction isolation, conditional update và rollback là các cơ chế đã có trong PostgreSQL và lý thuyết cơ sở dữ liệu [1]–[5]. Do đó, bài nghiên cứu không nên tuyên bố các cơ chế này là thuật toán mới. Tính đóng góp nằm ở cách xác định invariant, thống nhất các luồng nghiệp vụ cụ thể, thứ tự hóa claim trên hàng slot, đưa counter và membership vào transaction chung, và kiểm chứng thực nghiệm trên hệ thống NovaCare.

Cụm từ **“unified PostgreSQL-based occupancy control”** mô tả sự tích hợp của các primitive đã biết dưới một contract chung cho các luồng đặt lịch của hệ thống. Cụm từ này không hàm ý một cơ chế lock mới, một kiến trúc phân tán đã triển khai, hoặc một bằng chứng hình thức về correctness. Nếu muốn khẳng định khả năng triển khai đa instance, cần thực nghiệm hoặc phân tích triển khai riêng; nếu muốn khẳng định tính đúng đắn tổng quát, cần đặc tả và chứng minh invariant dưới phạm vi isolation, schema, transaction retry và mọi đường ghi liên quan.

## 7. Hướng phát triển phần Related Work trong bài báo

Trước khi nộp, nên mở rộng tìm kiếm có cấu trúc trên IEEE Xplore, ACM Digital Library, SpringerLink, ScienceDirect và các cơ sở dữ liệu học thuật khác; ghi lại truy vấn, khoảng năm, tiêu chí đưa vào/loại trừ và ngày tìm kiếm. Cần tìm thêm nghiên cứu về concurrency trong hệ thống đặt lịch trực tuyến, quản lý capacity/inventory có tính khan hiếm, thiết kế transaction cho workflow y tế và các đánh giá thực nghiệm trên cơ sở dữ liệu quan hệ. Các tài liệu bổ sung cần được đọc bản đầy đủ khi có thể; nếu chỉ xác minh metadata/abstract, phần kết quả và giới hạn phải được mô tả đúng mức đó.

Khi viết bài, cần dùng trích dẫn theo chuẩn IEEE, thống nhất cách gọi occupancy, capacity, membership và counter, đồng thời đặt các con số V0/V1 trong phần phương pháp/kết quả thay vì dùng chúng như bằng chứng của tài liệu Related Work. Cần tránh khẳng định hệ thống là phân tán hoặc multi-instance khi chưa có bằng chứng deployment.

## Tài liệu tham khảo

[1] P. A. Bernstein and N. Goodman, “Concurrency control in distributed database systems,” *ACM Computing Surveys*, vol. 13, no. 2, pp. 185–221, 1981, doi: 10.1145/356842.356846.

[2] H. T. Kung and J. T. Robinson, “On optimistic methods for concurrency control,” *ACM Transactions on Database Systems*, vol. 6, no. 2, pp. 213–226, 1981, doi: 10.1145/319566.319567.

[3] M. J. Cahill, U. Röhm, and A. D. Fekete, “Serializable isolation for snapshot databases,” in *Proceedings of the 2008 ACM SIGMOD International Conference on Management of Data*, 2008, pp. 729–738, doi: 10.1145/1376616.1376690.

[4] PostgreSQL Global Development Group, “Explicit locking,” *PostgreSQL 16 Documentation*, §13.3. [Online]. Available: https://www.postgresql.org/docs/16/explicit-locking.html. [Accessed: Nov. 9, 2026].

[5] PostgreSQL Global Development Group, “Transaction isolation,” *PostgreSQL 16 Documentation*, §13.2. [Online]. Available: https://www.postgresql.org/docs/16/transaction-iso.html. [Accessed: Nov. 9, 2026].

[6] T. Çayirli and E. Veral, “Outpatient scheduling in health care: A review of literature,” *Production and Operations Management*, vol. 12, no. 4, pp. 519–549, 2003, doi: 10.1111/j.1937-5956.2003.tb00218.x.

[7] D. Gupta and B. T. Denton, “Appointment scheduling in health care: Challenges and opportunities,” *IIE Transactions*, vol. 40, no. 9, pp. 800–819, 2008, doi: 10.1080/07408170802165880.

[8] J. Marynissen and E. L. Demeulemeester, “Literature review on multi-appointment scheduling problems in hospitals,” *European Journal of Operational Research*, vol. 272, no. 2, pp. 407–419, 2019, doi: 10.1016/j.ejor.2018.03.001.

### Tài liệu nội bộ của nghiên cứu NovaCare (không phải tài liệu khoa học đã xuất bản)

[N1] *V1 unified occupancy implementation report*, mục “Implemented mechanism”. Báo cáo nội bộ ghi nhận cơ chế trong source copy thí nghiệm, không phải triển khai production.

[N2] *NovaCare occupancy V0 experiment report*, mục “E2 — Normal create vs AI pre-exam create”; đối chiếu cùng `V0_EXPERIMENT_RESULTS.json` và `.csv`.

[N3] *V1 unified occupancy experiment report*, mục kết quả E2 và multi-slot rollback; đối chiếu cùng `V1_EXPERIMENT_RESULTS.json` và `.csv`.
