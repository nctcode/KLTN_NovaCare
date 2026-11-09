# Phân tích Use Case hệ thống NovaCare

## 1. Phạm vi và căn cứ

Phân tích được đối chiếu từ:

- Backend NestJS: các `*.controller.ts`, `*.service.ts`, guard/role và DTO trong `nova-care-backend/src`.
- CSDL: `nova-care-backend/prisma/schema.prisma` và các migration.
- Web: route `page.tsx`, service API và component trong `nova-care-web/src`.
- Mobile: navigation, screen, repository và Retrofit service trong `mobile/app/src/main/java`.
- HIS mô phỏng: `mock-his`, `partner-his-server`, `standalone-his-server`.

Không xem các trang nội dung tĩnh như tin tức, hướng dẫn, chính sách, giới thiệu và liên hệ là Use Case nghiệp vụ độc lập nếu chúng không tạo hoặc thay đổi dữ liệu nghiệp vụ.

**Trạng thái:** `HT` = có endpoint/service và có giao diện hoặc luồng client tương ứng; `MP` = có backend/API nhưng giao diện vai trò hoặc luồng hoàn chỉnh chưa thấy trong source; `HT-EXT` = luồng tích hợp/tác vụ nền đã có mã xử lý, không cần giao diện người dùng.

## 2. Actor thực tế

| Mã | Actor | Căn cứ quyền/chức năng |
|---|---|---|
| ACT-01 | Khách chưa đăng nhập | Các endpoint `@Public`, các route public của web/mobile |
| ACT-02 | Người bệnh / Patient | `Role.PATIENT`, hồ sơ bệnh nhân, lịch hẹn, sàng lọc, tư vấn |
| ACT-03 | Bác sĩ / Doctor | `Role.DOCTOR`, consultation và clinical API |
| ACT-04 | Quản trị cơ sở y tế / Hospital Admin | `HospitalAdminGuard`, `Role.HOSPITAL_ADMIN`, API `/hospital-admin` |
| ACT-05 | Quản trị hệ thống / Super Admin | `Role.ADMIN`, nhóm API `/admin` |
| ACT-06 | Cổng thanh toán VNPay | Tạo URL, IPN và xác thực chữ ký |
| ACT-07 | LiveKit | Cấp token/phòng video và webhook cuộc gọi |
| ACT-08 | Dịch vụ AI | Vision, Whisper/STT, triage, RAG và gợi ý chuyên khoa |
| ACT-09 | HIS đối tác / HIS mô phỏng | Handshake, danh mục, liên thông hồ sơ và dữ liệu bệnh án |
| ACT-10 | Email/FCM/Redis-BullMQ worker | OTP, email, push notification và tác vụ nền |

## 3. Danh mục Use Case

### 3.1. Khách chưa đăng nhập

| Mã | Use Case | Actor | Mô tả ngắn | Trạng thái |
|---|---|---|---|---|
| UC-G01 | Đăng ký tài khoản qua OTP | ACT-01 | Yêu cầu, xác minh OTP và tạo tài khoản bệnh nhân. | HT |
| UC-G02 | Đăng nhập hệ thống | ACT-01 | Xác thực email/điện thoại và cấp access/refresh token. | HT |
| UC-G03 | Quên/đặt lại mật khẩu | ACT-01 | Gửi OTP khôi phục và đặt mật khẩu mới. | HT |
| UC-G04 | Tìm kiếm đa tiêu chí | ACT-01 | Tìm cơ sở, bác sĩ, chuyên khoa hoặc dịch vụ. | HT |
| UC-G05 | Lọc tìm kiếm nâng cao | ACT-01 | Lọc kết quả theo vị trí, loại cơ sở và tiêu chí tìm kiếm. | HT |
| UC-G06 | Xem chi tiết cơ sở y tế | ACT-01 | Xem thông tin, chuyên khoa, bác sĩ và dịch vụ của cơ sở. | HT |
| UC-G07 | Xem hồ sơ và lịch khám bác sĩ | ACT-01 | Xem thông tin bác sĩ và các suất khám công khai. | HT |
| UC-G08 | Xem danh mục chuyên khoa và dịch vụ | ACT-01 | Tra cứu chuyên khoa, gói khám và dịch vụ có trạng thái hoạt động. | HT |
| UC-G09 | Xem từ khóa tìm kiếm phổ biến | ACT-01 | Lấy danh sách từ khóa được tìm kiếm phổ biến. | HT |
| UC-G10 | Xem đánh giá và thống kê chất lượng | ACT-01 | Xem đánh giá đã được duyệt và thống kê công khai. | HT |
| UC-G11 | Gửi yêu cầu đăng ký đối tác | ACT-01 | Gửi thông tin cơ sở/đối tác để NovaCare tiếp nhận. | HT |

### 3.2. Người bệnh

| Mã | Use Case | Actor | Mô tả ngắn | Trạng thái |
|---|---|---|---|---|
| UC-P01 | Đăng xuất tài khoản | ACT-02 | Thu hồi phiên hiện tại hoặc toàn bộ refresh token. | HT |
| UC-P02 | Quản lý thông tin tài khoản cá nhân | ACT-02 | Xem và cập nhật thông tin tài khoản. | HT |
| UC-P03 | Tạo hồ sơ người đi khám | ACT-02 | Tạo hồ sơ cho bản thân hoặc thành viên gia đình. | HT |
| UC-P04 | Xem danh sách và chi tiết hồ sơ | ACT-02 | Xem các hồ sơ bệnh nhân thuộc tài khoản. | HT |
| UC-P05 | Cập nhật hồ sơ người đi khám | ACT-02 | Sửa thông tin cá nhân và thông tin y tế của hồ sơ. | HT |
| UC-P06 | Xóa hồ sơ người đi khám | ACT-02 | Xóa hồ sơ theo các ràng buộc lịch hẹn. | HT |
| UC-P07 | Đặt hồ sơ mặc định | ACT-02 | Chọn hồ sơ được điền mặc định khi đặt lịch. | HT |
| UC-P08 | Đặt lịch khám theo bác sĩ | ACT-02 | Chọn bác sĩ, ngày, slot và hồ sơ để tạo lịch. | HT |
| UC-P09 | Đặt lịch theo cơ sở/chuyên khoa | ACT-02 | Chọn cơ sở, chuyên khoa/dịch vụ, bác sĩ và slot. | HT |
| UC-P10 | Đặt lịch từ kết quả sàng lọc AI | ACT-02 | Chuyển chuyên khoa/cơ sở được gợi ý sang luồng đặt lịch. | HT |
| UC-P11 | Xem danh sách lịch hẹn | ACT-02 | Xem lịch sắp tới và lịch sử lịch hẹn. | HT |
| UC-P12 | Xem chi tiết lịch hẹn và dòng thời gian | ACT-02 | Xem trạng thái, thông tin khám và lịch sử thay đổi. | HT |
| UC-P13 | Hủy lịch hẹn khám | ACT-02 | Hủy lịch theo điều kiện trạng thái và thời hạn. | HT |
| UC-P14 | Đổi lịch khám | ACT-02 | Chọn slot mới và cập nhật lịch hẹn. | HT |
| UC-P15 | Thanh toán trực tuyến qua VNPay | ACT-02, ACT-06 | Tạo giao dịch và chuyển người bệnh đến cổng thanh toán. | HT |
| UC-P16 | Xem kết quả thanh toán | ACT-02 | Tra cứu trạng thái giao dịch của lịch hẹn. | HT |
| UC-P17 | Khởi tạo phiên sàng lọc tiền khám AI | ACT-02 | Tạo phiên sàng lọc và tải catalog câu hỏi. | HT |
| UC-P18 | Khai báo triệu chứng và vị trí cơ thể | ACT-02 | Chọn vùng cơ thể và gửi triệu chứng ban đầu. | HT |
| UC-P19 | Tải ảnh tổn thương hỗ trợ AI | ACT-02 | Tải media/ảnh vào phiên sàng lọc. | HT |
| UC-P20 | Nhận diện giọng nói thành văn bản | ACT-02, ACT-08 | Gửi âm thanh và nhận bản chép lời triệu chứng. | HT |
| UC-P21 | Đo nhịp tim qua camera PPG | ACT-02 | Thu tín hiệu camera và gửi dữ liệu phân tích sức khỏe. | HT |
| UC-P22 | Trả lời câu hỏi phân nhánh chuyên sâu | ACT-02 | Trả lời câu hỏi thích ứng theo vùng và triệu chứng. | HT |
| UC-P23 | Nhận kết quả định hướng chuyên khoa và cờ đỏ | ACT-02, ACT-08 | Hoàn tất phiên, tính mức nguy cơ và đưa khuyến nghị. | HT |
| UC-P24 | Khởi tạo phiên tư vấn từ xa | ACT-02 | Tạo phiên tư vấn gắn với lịch hẹn hợp lệ. | HT |
| UC-P25 | Xem danh sách phiên tư vấn | ACT-02 | Xem các phiên tư vấn của người bệnh. | HT |
| UC-P26 | Nhắn tin tư vấn thời gian thực | ACT-02, ACT-03 | Gửi/nhận tin nhắn và cập nhật trạng thái đọc. | HT |
| UC-P27 | Gửi tệp đính kèm trong tư vấn | ACT-02, ACT-03 | Tải và gửi tệp trong phiên tư vấn. | HT |
| UC-P28 | Tham gia phòng gọi video | ACT-02, ACT-03, ACT-07 | Kiểm tra điều kiện, nhận token và vào phòng LiveKit. | HT |
| UC-P29 | Kết thúc/hủy phiên tư vấn | ACT-02, ACT-03 | Chuyển phiên sang trạng thái kết thúc hoặc hủy. | HT |
| UC-P30 | Xem hộ chiếu sức khỏe điện tử | ACT-02 | Xem tổng hợp lượt khám và dữ liệu lâm sàng được phép. | HT |
| UC-P31 | Chia sẻ hồ sơ sức khỏe điện tử | ACT-02 | Tạo mã/token chia sẻ, phạm vi dữ liệu và thời hạn. | HT |
| UC-P32 | Thu hồi quyền chia sẻ hồ sơ | ACT-02 | Vô hiệu hóa một lượt chia sẻ đã cấp. | HT |
| UC-P33 | Quản lý consent chia sẻ liên viện | ACT-02 | Cấp, kiểm tra và thu hồi đồng ý chia sẻ dữ liệu. | HT |
| UC-P34 | Gửi đánh giá bác sĩ/cơ sở | ACT-02 | Gửi đánh giá sau lịch hẹn đủ điều kiện. | HT |
| UC-P35 | Chỉnh sửa đánh giá cá nhân | ACT-02 | Sửa đánh giá trong thời gian cho phép. | HT |
| UC-P36 | Báo cáo đánh giá vi phạm | ACT-02 | Gửi báo cáo kèm lý do/nội dung vi phạm. | HT |
| UC-P37 | Xem danh sách thông báo | ACT-02 | Lấy các thông báo của tài khoản. | HT |
| UC-P38 | Đánh dấu thông báo đã đọc | ACT-02 | Đánh dấu một hoặc toàn bộ thông báo đã đọc. | HT |
| UC-P39 | Đăng ký thiết bị nhận thông báo đẩy | ACT-02, ACT-10 | Gắn device token để nhận FCM. | HT |

### 3.3. Bác sĩ

| Mã | Use Case | Actor | Mô tả ngắn | Trạng thái |
|---|---|---|---|---|
| UC-D01 | Đăng nhập và xác thực bác sĩ | ACT-03 | Đăng nhập qua cơ chế chung và được kiểm tra role. | HT |
| UC-D02 | Quản lý thông tin và lịch biểu công tác | ACT-03 | API quản lý doctor/workplace/schedule cho bác sĩ. | MP |
| UC-D03 | Xem phiên tư vấn được phân công | ACT-03 | Lấy danh sách phiên mà bác sĩ tham gia. | HT |
| UC-D04 | Xem chi tiết phiên và hồ sơ bệnh nhân | ACT-03 | Xem chi tiết phiên, lịch hẹn và dữ liệu liên quan. | HT |
| UC-D05 | Tiếp nhận phiên tư vấn | ACT-03 | Chuyển phiên sang `ACCEPTED`. | HT |
| UC-D06 | Bắt đầu phiên tư vấn | ACT-03 | Chuyển phiên sang trạng thái đang thực hiện. | HT |
| UC-D07 | Nhắn tin và nhận tệp trong phiên | ACT-03 | Trao đổi tin nhắn/tệp với người bệnh. | HT |
| UC-D08 | Tham gia phòng gọi video | ACT-03, ACT-07 | Nhận quyền truy cập phòng video khi đủ điều kiện. | HT |
| UC-D09 | Hoàn tất ca tư vấn từ xa | ACT-03 | Kết thúc phiên tư vấn theo nghiệp vụ. | HT |
| UC-D10 | Xem chi tiết ca khám lâm sàng | ACT-03 | Đọc encounter và dữ liệu lâm sàng liên quan. | MP |
| UC-D11 | Nhập chẩn đoán ICD-10 | ACT-03 | Thêm chẩn đoán vào encounter. | MP |
| UC-D12 | Ghi nhận sinh hiệu và quan sát | ACT-03 | Thêm observation/chỉ số vào encounter. | MP |
| UC-D13 | Kê đơn thuốc điện tử | ACT-03 | Tạo prescription và các prescription item. | MP |
| UC-D14 | Hoàn tất ca khám lâm sàng | ACT-03 | Đóng encounter sau khi hoàn tất dữ liệu. | MP |
| UC-D15 | Phát hành bệnh án vào hộ chiếu sức khỏe | ACT-03 | Publish encounter để dữ liệu được sử dụng trong passport. | MP |
| UC-D16 | Tra cứu hồ sơ liên viện qua mã chia sẻ | ACT-03, ACT-09 | Tra cứu bản ghi được chia sẻ theo mã/quyền. | MP |
| UC-D17 | Phản hồi đánh giá người bệnh | ACT-03 | Gửi phản hồi cho review trong vai trò được phép. | HT |

`MP` ở nhóm UC-D10–D16 nghĩa là controller/service và mô hình dữ liệu đã có, nhưng trong source hiện chưa thấy một cổng giao diện bác sĩ riêng thực hiện đầy đủ các thao tác lâm sàng; không được xem là chức năng giao diện hoàn thiện.

### 3.4. Quản trị cơ sở y tế

| Mã | Use Case | Actor | Mô tả ngắn | Trạng thái |
|---|---|---|---|---|
| UC-HA01 | Kích hoạt tài khoản quản trị cơ sở | ACT-04 | Xác minh activation token và đặt mật khẩu tài khoản. | HT |
| UC-HA02 | Đăng nhập cổng quản trị cơ sở | ACT-04 | Đăng nhập và kiểm tra phạm vi hospital của tài khoản. | HT |
| UC-HA03 | Xem dashboard vận hành cơ sở | ACT-04 | Xem tổng quan lịch hẹn, bác sĩ và vận hành cơ sở. | HT |
| UC-HA04 | Xem và cập nhật hồ sơ cơ sở | ACT-04 | Đọc/cập nhật thông tin bệnh viện của mình. | HT |
| UC-HA05 | Quản lý bác sĩ tại cơ sở | ACT-04 | Xem bác sĩ và cập nhật workplace, phí/trạng thái. | HT |
| UC-HA06 | Quản lý ca trực và suất khám | ACT-04 | Xem/cập nhật schedule, slot và khả dụng. | HT |
| UC-HA07 | Quản lý chuyên khoa và dịch vụ cơ sở | ACT-04 | Xem và cập nhật danh mục, giá, trạng thái dịch vụ. | HT |
| UC-HA08 | Quản lý lịch hẹn tại cơ sở | ACT-04 | Lọc, xem và cập nhật trạng thái lịch của cơ sở. | HT |
| UC-HA09 | Tiếp đón và check-in người bệnh | ACT-04 | Ghi nhận người bệnh đã đến khám. | HT |
| UC-HA10 | Quản lý vắng mặt (no-show) | ACT-04 | Kiểm tra điều kiện và đánh dấu lịch no-show. | HT |
| UC-HA11 | Khôi phục lịch vắng mặt | ACT-04 | Revert trạng thái no-show theo điều kiện. | HT |
| UC-HA12 | Ghi nhận nhật ký liên lạc người bệnh | ACT-04 | Lưu lịch sử gọi điện/SMS/contact log. | HT |
| UC-HA13 | Kiểm tra handshake với HIS | ACT-04, ACT-09 | Gửi yêu cầu kiểm tra kết nối tới HIS. | HT |
| UC-HA14 | Đồng bộ danh mục từ HIS | ACT-04, ACT-09 | Lấy, chuẩn hóa và lưu danh mục khoa/phòng/bác sĩ. | HT |
| UC-HA15 | Phản hồi đánh giá cơ sở | ACT-04 | Gửi phản hồi cho đánh giá liên quan cơ sở. | HT |

### 3.5. Quản trị hệ thống

| Mã | Use Case | Actor | Mô tả ngắn | Trạng thái |
|---|---|---|---|---|
| UC-A01 | Xem dashboard phân tích toàn hệ thống | ACT-05 | Xem thống kê lịch hẹn, doanh thu, cơ sở và bác sĩ. | HT |
| UC-A02 | Quản lý danh sách và trạng thái người dùng | ACT-05 | Xem, lọc, xem chi tiết và bật/tắt tài khoản. | HT |
| UC-A03 | Phân quyền vai trò người dùng (RBAC) | ACT-05 | Cập nhật role và phạm vi cơ sở của người dùng. | HT |
| UC-A04 | Khởi tạo tài khoản quản trị cơ sở | ACT-05 | Tạo tài khoản `HOSPITAL_ADMIN` cho cơ sở. | HT |
| UC-A05 | Quản lý danh mục cơ sở y tế | ACT-05 | Tạo, sửa, xóa và quản lý trạng thái cơ sở. | HT |
| UC-A06 | Quản lý danh mục bác sĩ | ACT-05 | Tạo, sửa, xóa, cấp tài khoản và gán nơi làm việc. | HT |
| UC-A07 | Quản lý danh mục chuyên khoa | ACT-05 | Tạo, sửa, xóa, bật/tắt và gán trạng thái theo cơ sở. | HT |
| UC-A08 | Quản lý gói khám và dịch vụ y tế | ACT-05 | Quản lý health package và medical service. | HT |
| UC-A09 | Quản lý lịch hẹn toàn hệ thống | ACT-05 | Theo dõi, lọc, cập nhật trạng thái và hủy lịch theo quyền. | HT |
| UC-A10 | Quản lý giao dịch thanh toán và đối soát | ACT-05 | Xem danh sách/chi tiết giao dịch thanh toán. | HT |
| UC-A11 | Xử lý hoàn tiền | ACT-05 | Gửi yêu cầu refund cho giao dịch đủ điều kiện. | HT |
| UC-A12 | Phê duyệt yêu cầu đăng ký hợp tác | ACT-05 | Xem, cập nhật trạng thái và approve partner request. | HT |
| UC-A13 | Kiểm duyệt đánh giá công khai | ACT-05 | Duyệt, từ chối hoặc ẩn review. | HT |
| UC-A14 | Xử lý báo cáo vi phạm đánh giá | ACT-05 | Xem và resolve các review report. | HT |
| UC-A15 | Giám sát luồng liên thông dữ liệu y tế | ACT-05 | Xem overview, traffic, gateway, matrix và audit stream. | HT |
| UC-A16 | Xem nhật ký kiểm toán hệ thống | ACT-05 | Tra cứu audit log hoạt động và thay đổi dữ liệu. | HT |

### 3.6. Hệ thống ngoài và tác vụ nền

| Mã | Use Case | Actor | Mô tả ngắn | Trạng thái |
|---|---|---|---|---|
| UC-EXT01 | Khởi tạo thanh toán và kiểm tra chữ ký | ACT-06 | VNPay nhận request thanh toán và kiểm tra checksum. | HT-EXT |
| UC-EXT02 | Gửi phản hồi IPN thanh toán | ACT-06 | VNPay gọi IPN để NovaCare cập nhật giao dịch/lịch hẹn. | HT-EXT |
| UC-EXT03 | Điều phối phòng gọi WebRTC | ACT-07 | LiveKit cấp room/token và điều phối phiên video. | HT-EXT |
| UC-EXT04 | Gửi webhook trạng thái cuộc gọi | ACT-07 | LiveKit gửi sự kiện phòng/người tham gia về backend. | HT-EXT |
| UC-EXT05 | Phân tích triệu chứng và sinh câu hỏi thích ứng | ACT-08 | AI/RAG/LLM trích xuất đặc trưng và định hướng sàng lọc. | HT-EXT |
| UC-EXT06 | Chuyển đổi âm thanh thành văn bản | ACT-08 | Whisper xử lý file audio và trả transcript. | HT-EXT |
| UC-EXT07 | Handshake và cung cấp API danh mục HIS | ACT-09 | HIS đối tác xác thực request và trả danh mục tích hợp. | HT-EXT |
| UC-EXT08 | Trích xuất hồ sơ bệnh án theo QĐ 4750 | ACT-09 | Backend tạo JSON/XML từ encounter theo mã lượt khám. | MP |
| UC-EXT09 | Gửi email tự động qua SMTP | ACT-10 | Gửi OTP, email kích hoạt và thông báo nghiệp vụ. | HT-EXT |
| UC-EXT10 | Quét và hủy lịch quá hạn thanh toán | ACT-10 | Worker/queue tìm lịch quá hạn, chuyển expired và giải phóng slot. | HT-EXT |

## 4. Quan hệ giữa các Use Case

Các quan hệ dưới đây là quan hệ nghiệp vụ dùng cho sơ đồ; chiều mũi tên trong UML đi từ UC mở rộng/bao hàm đến UC cơ sở.

### `<<include>>`

| Use Case gọi | Bao gồm | Lý do |
|---|---|---|
| UC-P08 | UC-P04 | Đặt lịch cần chọn/xác định hồ sơ người đi khám. |
| UC-P09 | UC-P04 | Luồng đặt theo cơ sở cần hồ sơ người đi khám. |
| UC-P15 | UC-P12 | Thanh toán gắn với một lịch hẹn và trạng thái lịch. |
| UC-P18, UC-P22 | UC-P17 | Nhập triệu chứng/trả lời là các bước của phiên sàng lọc. |
| UC-P24 | UC-P17 | Có thể tạo tư vấn từ kết quả phiên sàng lọc. |
| UC-P26, UC-P28 | UC-P24 | Nhắn tin/video cần một phiên tư vấn. |
| UC-P34 | UC-P12 | Đánh giá cần lịch hẹn đủ điều kiện. |
| UC-D11, UC-D12, UC-D13 | UC-D10 | Chẩn đoán, observation và kê đơn thuộc ca khám lâm sàng. |
| UC-HA14 | UC-HA13 | Đồng bộ danh mục thực hiện sau khi kết nối HIS hợp lệ. |

### `<<extend>>`

| Use Case mở rộng | Use Case cơ sở | Điều kiện/kịch bản |
|---|---|---|
| UC-G05 | UC-G04 | Người dùng chọn thêm bộ lọc tìm kiếm. |
| UC-P10 | UC-P09 | Kết quả sàng lọc cung cấp chuyên khoa/cơ sở để đặt lịch. |
| UC-P13, UC-P14 | UC-P12 | Hủy hoặc đổi lịch là thao tác tùy chọn trên lịch đã xem. |
| UC-P19, UC-P20, UC-P21 | UC-P18/UC-P17 | Gửi media, STT, PPG và trả lời câu hỏi là các nhánh bổ sung của sàng lọc. |
| UC-P27 | UC-P26 | Gửi tệp là nhánh bổ sung của nhắn tin tư vấn. |
| UC-P31 | UC-P30 | Chia sẻ được thực hiện từ hộ chiếu sức khỏe. |
| UC-P32 | UC-P31 | Thu hồi chỉ xuất hiện khi đã có lượt chia sẻ. |
| UC-P35 | UC-P34 | Chỉnh sửa là nhánh sau khi đã gửi đánh giá. |
| UC-D15 | UC-D14 | Phát hành bệnh án là bước tùy chọn sau khi hoàn tất ca khám. |
| UC-HA11 | UC-HA10 | Khôi phục là nhánh xử lý lịch đã bị đánh dấu no-show. |
| UC-A04 | UC-A02 | Tạo quản trị cơ sở là thao tác chuyên biệt trong quản lý user. |
| UC-A11 | UC-A10 | Hoàn tiền là thao tác chuyên biệt trên giao dịch. |

Các actor hệ thống `ACT-06` đến `ACT-10` là tác nhân phụ trợ cho các UC người dùng; chúng không phải màn hình độc lập. `UC-EXT04`, `UC-EXT08` và các endpoint webhook/export có thể được thể hiện như UC hệ thống trong sơ đồ tích hợp riêng.

## 5. Phân biệt triển khai và phần chỉ có giao diện

- **Đã triển khai:** các mục `HT` có controller/service hoặc repository thực hiện nghiệp vụ, đồng thời có route web, màn hình mobile hoặc client API tương ứng.
- **Backend có, giao diện chưa đầy đủ:** `UC-D02`, `UC-D10` đến `UC-D16` và `UC-EXT08`. Mã xử lý, API hoặc mô hình dữ liệu tồn tại; source chưa chứng minh một portal bác sĩ/lâm sàng hoàn chỉnh cho toàn bộ thao tác đó.
- **Tác vụ hệ thống:** các mục `HT-EXT` có thể không có UI vì được gọi bởi VNPay, LiveKit, AI, HIS hoặc worker.
- **Chỉ có giao diện:** không đưa các trang nội dung tĩnh vào danh mục Use Case. Trong các nghiệp vụ đã liệt kê, không gắn `UI-only` cho một mục nếu chưa tìm thấy backend/API hoặc hành vi nghiệp vụ tương ứng.

## 6. Kết luận kiểm chứng

Danh mục trên có **108 Use Case nguyên tử**. Các UC quản lý CRUD đã được gom theo mục tiêu nghiệp vụ thay vì tách riêng `xem/tạo/sửa/xóa` thành bốn UC, nhưng các thao tác đó vẫn được mô tả trong từng dòng và có căn cứ từ controller tương ứng. Đây là cách trình bày phù hợp để xây dựng Use Case Diagram; khi vẽ có thể tách các thao tác CRUD thành UC con nếu cần sơ đồ chi tiết.
