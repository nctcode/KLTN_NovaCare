# TÀI LIỆU QUY CHUẨN KỸ THUẬT & HƯỚNG DẪN LIÊN THÔNG DỮ LIỆU HIS - NOVACARE
**Tài liệu dành cho Đội ngũ Kỹ sư Công nghệ Thông tin & Nhà cung cấp phần mềm HIS Bệnh viện**

* **Mã hiệu tài liệu:** `NC-HIS-SPEC-2026-V1`
* **Phiên bản:** `1.0.0`
* **Ngày phát hành:** `2026`
* **Cơ quan ban hành:** Trung tâm Kỹ thuật & Liên thông Dữ liệu Y tế NovaCare (`NovaCare Interoperability Team`)
* **Tiêu chuẩn áp dụng:** RESTful API, OpenAPI 3.0.3, Kiến trúc liên thông lỏng lẻo (Loosely-coupled), Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân.

---

## MỤC LỤC TÀI LIỆU
1. **Phần I: Tổng quan & Phạm vi liên thông (Overview & Scope)**
2. **Phần II: Đặc tả API Contract chi tiết (API Specification & Data Schemas)**
3. **Phần III: Cơ chế Xác thực & An toàn bảo mật (Authentication & Security)**
4. **Phần IV: Cơ chế NovaCare gọi API (Calling Mechanism, Triggers & SLA)**
5. **Phần V: Quy trình Nhập URL & Bắt tay kết nối trên NovaCare (Onboarding & Handshake)**
6. **Phần VI: Cơ chế Preview dữ liệu trước khi đồng bộ (Data Preview & Sanity Check)**
7. **Phần VII: Quy tắc Tạo mới và Cập nhật dữ liệu (Upsert & Mapping Logic)**
8. **Phần VIII: Quy tắc Xử lý dữ liệu bị xoá / Tạm ngưng (Deactivation & Soft-Delete Rules)**
9. **Phần IX: Xử lý sự cố đồng bộ & Cơ chế Thử lại (Error Handling & Retry Mechanism)**
10. **Phần X: Nhật ký & Giám sát lịch sử đồng bộ (Audit Trail & Logging)**
11. **Phần XI: An toàn thông tin & Tuân thủ pháp lý y tế (Compliance & Data Privacy)**
12. **Phần XII: Bảng Checklist kiểm tra trước khi Go-live chính thức (Pre-Flight Go-live Checklist)**
13. **Phần XIII: Kênh hỗ trợ kỹ thuật & Xử lý sự cố (Technical Support SLA)**

---

## PHẦN I: TỔNG QUAN & PHẠM VI LIÊN THÔNG

### 1.1 Mục đích liên thông
Tài liệu này xác lập giao thức kết nối dữ liệu chuẩn giữa **Hệ thống Quản lý Bệnh viện (HIS - Hospital Information System)** của các cơ sở khám chữa bệnh đối tác và **Nền tảng Đặt khám Trực tuyến NovaCare Health**.

Mục tiêu chính:
- **Tự động hóa**: Đồng bộ danh mục Khoa phòng, Bác sĩ công tác và Lịch trực định kỳ từ HIS sang NovaCare mà không cần nhân viên nhập liệu thủ công bằng tay.
- **Tính độc lập (Loose Coupling)**: Bệnh viện hoàn toàn làm chủ hạ tầng máy chủ, cơ sở dữ liệu và mã nguồn nội bộ. NovaCare chỉ tiếp nhận dữ liệu qua giao thức HTTP REST API công khai đạt chuẩn.
- **Độ chính xác thời gian thực**: Khi bệnh viện điều chỉnh giá khám, cập nhật học vị hoặc thay đổi ca trực trên HIS, thông tin được phản ánh chuẩn xác trên ứng dụng đặt lịch của người dân.

### 1.2 Phạm vi dữ liệu liên thông
Giao thức kết nối tại cổng này **chỉ áp dụng cho dữ liệu danh mục công khai**:
- Thông tin định danh cơ sở y tế (Tên, Mã cơ sở, Hotline, Giờ hoạt động, Địa chỉ).
- Danh mục Khoa phòng trực thuộc.
- Danh sách Nhân sự Bác sĩ chuyên môn (Họ tên, Học vị, Mã nhân sự, Chuyên khoa, Giá khám niêm yết).
- Lịch phân công ca trực khám bệnh theo tuần.

> **QUY ĐỊNH BẢO MẬT TUYỆT ĐỐI:**
> Cổng liên thông danh mục này **TUYỆT ĐỐI KHÔNG YÊU CẦU, KHÔNG TRUY XUẤT VÀ KHÔNG LƯU TRỮ** dữ liệu hồ sơ bệnh án (EMR), bệnh sử, kết quả cận lâm sàng hay đơn thuốc nhạy cảm của người bệnh.

---

## PHẦN II: ĐẶC TẢ API CONTRACT CHI TIẾT

Hệ thống HIS của bệnh viện cần mở **duy nhất 01 Endpoint HTTP GET** đáp ứng chuẩn OpenAPI 3.0.3 dưới đây:

### 2.1 Thông tin Endpoint
- **Phương thức:** `GET`
- **Đường dẫn đề xuất:** `/api/hospital-catalog` (hoặc đường dẫn do bệnh viện tự cấu hình)
- **Content-Type phản hồi:** `application/json; charset=utf-8`

### 2.2 Tham số yêu cầu (Request Parameters)
#### Header:
| Tên Header | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `Accept` | `string` | Có | Giá trị: `application/json` |
| `X-API-KEY` | `string` | Tùy chọn | Mã khóa xác thực nếu viện cấu hình cơ chế API Key |
| `Authorization` | `string` | Tùy chọn | `Bearer <token>` nếu viện dùng Bearer Token |

#### Query Parameters:
| Tham số | Kiểu | Bắt buộc | Ví dụ | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `hospital_code` | `string` | Tùy chọn | `HIS_BV_ANBINH` | Mã cơ sở do NovaCare cấp để kiểm tra định danh |
| `state` | `number` | Tùy chọn | `1` | Tham số tùy chọn dùng cho môi trường thử nghiệm / demo |

### 2.3 Cấu trúc Schema Dữ liệu Phản hồi (Response Body)
Khi thành công, API phải trả về HTTP Status `200 OK` với cấu trúc JSON chuẩn:

```json
{
  "status": 200,
  "message": "Lấy danh mục dữ liệu bệnh viện thành công",
  "data": {
    "hospital_code": "HIS_BV_ANBINH",
    "hospital_name": "Bệnh Viện Đa Khoa An Bình",
    "hotline": "028 3923 4260",
    "emergency_hotline": "115 (Trực cấp cứu 24/7)",
    "address": "146 An Bình, Phường 7, Quận 5, TP.HCM",
    "city": "TP. Hồ Chí Minh",
    "website": "https://benhvienanbinh.vn",
    "established_year": 2001,
    "bed_count": 500,
    "hospital_type": "PUBLIC",
    "operating_hours": "07:00 - 16:30 (Thứ 2 - Thứ 6)",
    "departments": [
      {
        "dept_code": "K_TIM_CAN_THIEP",
        "dept_name": "Khoa Tim Mạch Can Thiệp"
      }
    ],
    "doctors": [
      {
        "staff_id": "HIS_DOC_001",
        "full_name": "Nguyễn Văn An",
        "gender": "MALE",
        "academic_degree": "TS.BS",
        "qualification_title": "Tiến sĩ Y khoa, Bác sĩ CKI Tim Mạch",
        "dept_code": "K_TIM_CAN_THIEP",
        "consultation_fee": 350000,
        "experience_years": 10,
        "avatar_url": "https://example.com/avatar.jpg",
        "weekly_shifts": [
          {
            "day_of_week": 1,
            "start_time": "08:00",
            "end_time": "12:00",
            "break_start": null,
            "break_end": null
          },
          {
            "day_of_week": 3,
            "start_time": "13:30",
            "end_time": "17:00",
            "break_start": null,
            "break_end": null
          }
        ]
      }
    ]
  }
}
```

### 2.4 Từ điển trường dữ liệu (Data Dictionary Constraints)

#### Đối tượng Hồ sơ Cơ sở Y tế (`HospitalProfile`):
- `hospital_code` (*string, Bắt buộc*): Mã cơ sở định danh tại HIS viện (Ví dụ: `HIS_BV_ANBINH`).
- `hospital_name` (*string, Bắt buộc*): Tên pháp nhân đầy đủ của cơ sở khám chữa bệnh.
- `hotline` (*string, Tùy chọn*): Hotline tổng đài tư vấn, chăm sóc khách hàng.
- `emergency_hotline` (*string, Tùy chọn*): Đường dây nóng cấp cứu 24/7 (Ví dụ: `"115"` hoặc `"028 3923 4567"`). Tự động cập nhật vào trang Hồ sơ cơ sở y tế.
- `address` (*string, Tùy chọn*): Địa chỉ trụ sở cơ sở (Số nhà, đường, phường, quận/huyện).
- `city` (*string, Tùy chọn*): Tỉnh / Thành phố trực thuộc.
- `website` (*string, Tùy chọn*): Website chính thức của cơ sở y tế (Định dạng URL hợp lệ).
- `established_year` (*number, Tùy chọn*): Năm thành lập viện (Số nguyên 4 chữ số, ví dụ `2001`).
- `bed_count` (*number, Tùy chọn*): Quy mô giường bệnh điều trị nội trú (Số nguyên dương, ví dụ `500`).
- `operating_hours` (*string, Tùy chọn*): Thời gian làm việc đón tiếp bệnh nhân (Ví dụ: `"07:00 - 16:30 (Thứ 2 - Thứ 6)"`).

#### Đối tượng Khoa phòng (`DepartmentItem`):
- `dept_code` (*string, Bắt buộc*): Mã khoa phòng nội bộ duy nhất tại viện (Unique). Độ dài tối đa 50 ký tự. Không chứa dấu cách hoặc ký tự đặc biệt.
- `dept_name` (*string, Bắt buộc*): Tên hiển thị khoa phòng (Ví dụ: "Khoa Tim Mạch Can Thiệp").

#### Đối tượng Bác sĩ (`DoctorItem`):
- `staff_id` (*string, Bắt buộc*): Mã định danh nhân viên / Bác sĩ tại viện (Khóa chính Unique đối soát).
- `full_name` (*string, Bắt buộc*): Họ và tên đầy đủ (Không viết tắt họ).
- `gender` (*enum, Bắt buộc*): Chỉ chấp nhận một trong 2 giá trị: `"MALE"` hoặc `"FEMALE"`.
- `academic_degree` (*string, Bắt buộc*): Học vị học hàm cao nhất: `"GS"`, `"PGS"`, `"TS.BS"`, `"ThS.BS"`, `"BS.CKII"`, `"BS.CKI"`, `"BS"`.
- `qualification_title` (*string, Tùy chọn*): Chức danh chuyên môn / Vị trí đảm nhiệm.
- `dept_code` (*string, Bắt buộc*): Phải khớp chính xác với một mã `dept_code` có trong mảng `departments`.
- `consultation_fee` (*number, Bắt buộc*): Giá khám niêm yết bằng Việt Nam Đồng (VND). **Bắt buộc là số nguyên dương**, không chứa dấu phẩy phân cách chuỗi (Ví dụ: `350000`, không phải `"350,000"`).
- `experience_years` (*number, Tùy chọn*): Số năm kinh nghiệm công tác.
- `avatar_url` (*string, Tùy chọn*): Đường dẫn ảnh chân dung bác sĩ (định dạng HTTPS).
- `weekly_shifts` (*array, Bắt buộc*): Danh sách ca trực định kỳ trong tuần.

#### Đối tượng Ca trực (`WeeklyShift`):
- `day_of_week` (*number, Bắt buộc*): Thứ trong tuần. Quy ước:
  * `0`: Chủ Nhật
  * `1`: Thứ Hai
  * `2`: Thứ Ba
  * `3`: Thứ Tư
  * `4`: Thứ Năm
  * `5`: Thứ Sáu
  * `6`: Thứ Bảy
- `start_time` (*string, Bắt buộc*): Giờ bắt đầu khám định dạng `HH:mm` 24h (Ví dụ: `"07:30"`, `"08:00"`).
- `end_time` (*string, Bắt buộc*): Giờ kết thúc khám định dạng `HH:mm` 24h (Ví dụ: `"11:30"`, `"17:00"`).
- `break_start`, `break_end` (*string, Tùy chọn*): Thời gian nghỉ trưa giữa ca định dạng `HH:mm`.

---

## PHẦN III: CƠ CHẾ XÁC THỰC & AN TOÀN BẢO MẬT (AUTHENTICATION)

Nhằm đảm bảo an toàn cho cả hai hệ thống trên môi trường Internet công cộng, các tiêu chuẩn bảo mật sau đây được áp dụng:

### 3.1 Giao thức truyền thông bắt buộc
- **HTTPS với TLS 1.2 hoặc TLS 1.3**: Bắt buộc trên môi trường Production. NovaCare sẽ từ chối gọi vào các endpoint HTTP không mã hóa để phòng chống tấn công nghe lén (Man-in-the-middle).

### 3.2 Các cơ chế xác thực hỗ trợ (Tùy chọn cấu hình phía Viện)
Hệ thống NovaCare cho phép quản trị viên viện lựa chọn 1 trong 3 cơ chế xác thực khi cấu hình endpoint:
1. **Phương thức 1: API Key Header (Khuyên dùng)**
   - Phía Bệnh viện cấp cho NovaCare một khóa bí mật (Secret Key).
   - Mỗi request NovaCare gửi đi sẽ đính kèm Header: `X-API-KEY: <Gia_Tri_Key>`
   - Bệnh viện kiểm tra Header này trước khi trả kết quả.
2. **Phương thức 2: Bearer Token**
   - Đính kèm Header tiêu chuẩn: `Authorization: Bearer <token>`
3. **Phương thức 3: IP Whitelist (Tường lửa mạng)**
   - Bệnh viện mở cổng firewall chỉ cho phép dải IP tĩnh của máy chủ NovaCare truy cập.

---

## PHẦN IV: CƠ CHẾ NOVACARE GỌI API (CALLING MECHANISM & SLA)

### 4.1 NovaCare gọi API của Bệnh viện khi nào?
NovaCare kích hoạt gọi API của bệnh viện theo **3 trường hợp cụ thể**:
1. **Đồng bộ thủ công (On-Demand Trigger)**: Khi Quản trị viên Bệnh viện bấm nút `[Đồng bộ ngay]` trên Cổng Hospital Admin.
2. **Đồng bộ định kỳ tự động (Scheduled Cron Trigger)**: Hệ thống chạy tác vụ ngầm tự động lúc **02:00 sáng hàng ngày** (khung giờ lưu lượng khám chữa bệnh thấp nhất) để đồng bộ lịch trực tuần mới.
3. **Kiểm tra trạng thái sẵn sàng (Heartbeat Health Check)**: Hệ thống gửi request kiểm tra ping mỗi 30 phút để giám sát tính khả dụng của máy chủ HIS.

### 4.2 Giới hạn thời gian (Timeout SLA) & Caching
- **Timeout tối đa:** `10.000 ms (10 giây)`. Nếu sau 10 giây máy chủ HIS không phản hồi, NovaCare tự động ngắt kết nối và đánh dấu phiên đồng bộ thất bại do lỗi Timeout.
- **Bộ đệm thông minh (Smart Caching):** Để tránh gây nghẽn tải cơ sở dữ liệu nội bộ của bệnh viện khi người dùng truy cập đông, NovaCare áp dụng bộ đệm (cache) 15 phút cho các truy vấn tìm kiếm bác sĩ phía bệnh nhân.

---

## PHẦN V: QUY TRÌNH 5 GIAI ĐOẠN KẾT NỐI & ĐỒNG BỘ DỮ LIỆU CHÍNH THỨC TRÊN NOVACARE

Quy trình kích hoạt kết nối được thực hiện qua giao diện Web của Cổng Quản Trị Cơ Sở Y Tế (`/hospital-admin/integration`) thông qua 5 giai đoạn liên hoàn:

### 5.1 Giai đoạn 1: Nhập thông số & Thẩm định Bắt tay (Connection & Handshake)
- **Nhập URL & Bảo mật:** Quản trị viên nhập đường dẫn Endpoint URL (Ví dụ: `http://localhost:5055/api/hospital-catalog`) và thiết lập cơ chế xác thực (None / API Key / Bearer).
- **Thẩm định tự động (Automated Sanity Check):** NovaCare gửi một request HTTP GET tới URL đã cung cấp. Bộ máy thẩm định (Validator) quét kiểm tra phản hồi HTTP 200 và tính toàn vẹn của dữ liệu (`hospital_code`, `departments`, `doctors`).
- **Phản hồi tức thì:** Nếu thành công, màn hình hiển thị thẻ tóm tắt số lượng khoa phòng, bác sĩ và ca trực phát hiện được để mở khóa luồng kết nối chính thức.

### 5.2 Giai đoạn 2: Xem trước Dữ liệu trích xuất & Hồ sơ Cơ sở (Preview & Profile Verification)
Trước khi ghi dữ liệu vào CSDL chính của NovaCare, hệ thống cung cấp giao diện đối soát 2 tầng:
1. **Đối soát Hồ sơ Hành chính Bệnh viện:**
   - Hệ thống hiển thị tóm tắt: Địa chỉ trụ sở, Hotline tổng đài, Hotline Cấp cứu 24/7, Quy mô giường bệnh, Năm thành lập và Website.
   - Các thông tin này sẽ được **tự động lưu vào Hồ sơ cơ sở y tế** (`/hospital-admin/hospital-info`), giúp viện không phải nhập liệu tay lại từ đầu.
2. **Đối soát Danh sách Bác sĩ thô:**
   - Quản trị viên xem trực tiếp danh sách bác sĩ trích xuất từ HIS: Mã nhân viên, Học vị, Giá khám niêm yết và số ca trực/tuần.

### 5.3 Giai đoạn 3: Ánh xạ Khoa phòng HIS sang Chuyên khoa Chuẩn NovaCare (Specialty Taxonomy Mapping)
Đây là bước **CỐT LÕI** trong việc kết nối đa cơ sở y tế:
- **Bản chất nghiệp vụ:** Mỗi bệnh viện có cách đặt mã và tên khoa phòng nội bộ khác nhau (Ví dụ: `K_NOI_TIM_MACH` - Khoa Nội Tim Mạch). Tuy nhiên, trên ứng dụng người bệnh tìm kiếm theo danh mục chuyên khoa chuẩn hóa toàn sàn (Ví dụ: `Tim mạch`).
- **Tác dụng của Ánh xạ:** Giúp hệ thống gắn chiếc "nhãn danh mục chuẩn" của NovaCare vào khoa phòng của viện. Khi bệnh nhân tìm chuyên khoa "Tim mạch", hệ thống sẽ hiển thị đúng các bác sĩ thuộc "Khoa Nội Tim Mạch" của viện bạn. Tên khoa phòng nội bộ gốc của viện vẫn được bảo toàn nguyên vẹn 100%.
- **Cơ chế Gợi ý Tự động (Auto-mapping):** NovaCare tích hợp thuật toán so khớp ngữ nghĩa tên khoa. Khi quét thấy *"Khoa Nội Tim Mạch"*, hệ thống sẽ tự động chọn sẵn *"Tim mạch"*, viện chỉ cần liếc mắt xác nhận và bấm tiếp tục.

### 5.4 Giai đoạn 4: Phê duyệt Bác sĩ đưa lên hệ thống (Doctor Approval)
- Quản trị viên có toàn quyền tích chọn hoặc bỏ chọn (checkbox) từng bác sĩ sẽ được mở nhận lịch khám trực tuyến trên NovaCare.
- Những bác sĩ chưa tích chọn sẽ ở trạng thái *"Bỏ qua"* và không bị công bố ra ngoài ứng dụng người bệnh.

### 5.5 Giai đoạn 5: Kích hoạt & Đồng bộ vào CSDL NovaCare (Sync Activation)
- Khi bấm nút `[Kích Hoạt & Đồng Bộ Vào NovaCare]`, hệ thống tự động:
  1. Cập nhật thông tin bệnh viện (External ID, Hotline, Cấp cứu, Giường bệnh, Năm thành lập, Website, Giờ làm việc).
  2. Kích hoạt liên kết các chuyên khoa tương ứng của viện (`HospitalSpecialty`).
  3. Khởi tạo tài khoản và hồ sơ bác sĩ (`Doctor` & `DoctorWorkplace`) với giá khám niêm yết.
  4. Khởi tạo các khung giờ khám và ca trực tuần (`DoctorSchedule`).

---

## PHẦN VII: QUY TẮC TẠO MỚI & CẬP NHẬT DỮ LIỆU (UPSERT LOGIC)

NovaCare sử dụng thuật toán **Cập nhật thông minh (Smart Upsert)** dựa trên khóa duy nhất `staff_id` (Mã nhân sự tại viện) và `dept_code` (Mã khoa phòng):

### 7.1 Trường hợp Bác sĩ mới (INSERT)
- Nếu `staff_id` chưa từng tồn tại trong CSDL của bệnh viện trên NovaCare:
  - Hệ thống tự động tạo mới bản ghi Bác sĩ trong bảng `Doctor`.
  - Tạo liên kết công tác `DoctorWorkplace` gắn cố định với Bệnh viện.
  - Gán nguồn dữ liệu: `source = "API"`.
  - Khởi tạo danh sách ca trực tuần trong bảng `DoctorSchedule`.

### 7.2 Trường hợp Bác sĩ đã tồn tại (UPDATE)
- Nếu `staff_id` đã có trong hệ thống:
  - Hệ thống cập nhật các trường có biến động: `full_name`, `academic_degree`, `qualification_title`, `consultation_fee`, `dept_code`.
  - Cập nhật lại lịch trực tuần theo danh sách mới nhất.
  - **GIỮ NGUYÊN:** Mã định danh hệ thống (`id`), tài khoản đăng nhập, đánh giá đánh giá của bệnh nhân và toàn bộ lịch sử các cuộc hẹn khám đã hoàn tất trước đó.

### 7.3 Trường hợp Dữ liệu không thay đổi (UNCHANGED)
- Hệ thống so sánh chữ ký dữ liệu (Hash); nếu thông tin giống hệt nhau thì bỏ qua ghi đĩa để tối ưu hiệu năng.

---

## PHẦN VIII: QUY TẮC XỬ LÝ DỮ LIỆU BỊ XOÁ / TẠM NGƯNG (SOFT-DELETE)

Một trong những quy định kỹ thuật quan trọng nhất của nền tảng y tế là: **TUYỆT ĐỐI KHÔNG XÓA CỨNG (NO HARD-DELETE)** dữ liệu bác sĩ trong cơ sở dữ liệu.

### 8.1 Khi Bác sĩ nghỉ việc hoặc bị xóa khỏi danh sách trả về của HIS:
- Nếu một bác sĩ từng có trong hệ thống nhưng trong phiên đồng bộ mới nhất không còn xuất hiện trong mảng `doctors`:
  - NovaCare tự động cập nhật cờ trạng thái: `isActive = false` (Tạm ngưng tiếp nhận).
  - Tự động tắt trạng thái nhận bệnh nhân trên ứng dụng di động (Người dân sẽ không thể tìm thấy bác sĩ này để đặt lịch mới nữa).
  - **LỊCH SỬ KHÁM CŨ VẪN ĐƯỢC BẢO LƯU TRỌN VẸN**: Các hồ sơ bệnh án, lịch sử đặt khám và báo cáo doanh thu tài chính liên quan đến bác sĩ này trong quá khứ không bị mất.

### 8.2 Khi một Ca trực bị hủy bỏ:
- Ca trực đó bị đánh dấu ngừng hoạt động (`isActive = false`). Các lịch hẹn bệnh nhân ĐÃ ĐẶT thành công trong ca đó trước thời điểm hủy vẫn được bảo toàn để bệnh viện liên hệ dời lịch nếu cần.

---

## PHẦN IX: XỬ LÝ SỰ CỐ ĐỒNG BỘ & CƠ CHẾ THỬ LẠI (RETRY MECHANISM)

### 9.1 Phân loại lỗi và phản ứng của hệ thống:
1. **Lỗi mạng chập chờn / Timeout (504 / Connection Reset)**:
   - Áp dụng thuật toán **Exponential Backoff**: Tự động thử lại tối đa **3 lần** (lần 1 sau 5 giây, lần 2 sau 15 giây, lần 3 sau 30 giây).
   - Nếu sau 3 lần vẫn thất bại: Đánh dấu phiên đồng bộ thất bại, ghi log lỗi và gửi thông báo cảnh báo đến Quản trị viên.
2. **Lỗi xác thực (HTTP 401 Unauthorized / 403 Forbidden)**:
   - Dừng ngay lập tức, **không gửi thử lại** để tránh bị khóa IP do nghi ngờ tấn công brute-force.
3. **Lỗi định dạng dữ liệu (HTTP 400 Bad Request / Schema Invalid)**:
   - Dừng phiên đồng bộ, chỉ rõ tên trường và vị trí bản ghi không hợp lệ trong tệp phản hồi.

### 9.2 Tính toàn vẹn giao dịch (Database Transaction Safety)
Quá trình đồng bộ dữ liệu vào cơ sở dữ liệu NovaCare được bọc trong một **Database Transaction**. Nếu xảy ra lỗi nghiêm trọng ở bất kỳ bước nào, toàn bộ giao dịch được **Rollback** về trạng thái trước khi đồng bộ, đảm bảo cơ sở dữ liệu không bao giờ bị rơi vào trạng thái dữ liệu rác hay chắp vá.

---

## PHẦN X: NHẬT KÝ & GIÁM SÁT LỊCH SỬ ĐỒNG BỘ (AUDIT LOG)

Mỗi phiên giao dịch kết nối đều được ghi nhận vào Bảng Audit Log với đầy đủ các thuộc tính:
- `sync_id`: Mã phiên giao dịch duy nhất (UUID).
- `timestamp`: Thời gian chính xác diễn ra phiên đồng bộ.
- `trigger_type`: Nguồn kích hoạt (`MANUAL_ADMIN` - do quản trị viên bấm, hoặc `SYSTEM_CRON` - do hệ thống tự động).
- `endpoint_url`: URL máy chủ HIS đã gọi tới.
- `status`: Trạng thái kết quả (`SUCCESS`, `PARTIAL_SUCCESS`, `FAILED`).
- `metrics`: Thống kê chi tiết (Số bản ghi quét được, Số tạo mới, Số cập nhật, Số tạm ngưng).
- `error_log`: Nội dung thông báo lỗi chi tiết nếu có sự cố xảy ra.

Quản trị viên có thể tra cứu lịch sử này bất kỳ lúc nào tại Cổng Hospital Admin.

---

## PHẦN XI: AN TOÀN THÔNG TIN & TUÂN THỦ PHÁP LÝ Y TẾ

1. **Tuân thủ Nghị định 13/2023/NĐ-CP**:
   - Nền tảng NovaCare tuân thủ đầy đủ các quy định về Bảo vệ Dữ liệu Cá nhân của Chính phủ Việt Nam.
2. **Nguyên tắc Tối thiểu hóa Dữ liệu (Data Minimization)**:
   - Cổng liên thông danh mục này chỉ yêu cầu lượng dữ liệu tối thiểu cần thiết để phục vụ người dân đặt lịch khám (Tên, chuyên khoa, lịch khám). Tuyệt đối không thu thập dữ liệu dư thừa.
3. **Độc lập dữ liệu bệnh viện**:
   - Bệnh viện giữ toàn quyền kiểm soát dữ liệu. Bệnh viện có thể chủ động ngắt kết nối hoặc tắt chia sẻ dữ liệu bất kỳ lúc nào thông qua Cổng quản trị.

---

## PHẦN XII: BẢNG CHECKLIST KIỂM TRA TRƯỚC KHI GO-LIVE

Đội ngũ Kỹ sư CNTT Bệnh viện vui lòng kiểm tra và đánh dấu đủ 10 tiêu chí sau trước khi chính thức bấm kích hoạt hệ thống:

| STT | Hạng mục kiểm tra | Tiêu chuẩn đạt | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | **Giao thức HTTPS** | Endpoint chạy trên cổng HTTPS có chứng chỉ SSL hợp lệ. | [ ] |
| 2 | **Cấu hình Firewall / CORS** | Máy chủ web cho phép request GET từ Internet / IP của NovaCare. | [ ] |
| 3 | **Quyền CSDL nội bộ** | Tài khoản kết nối CSDL chỉ có quyền ĐỌC (SELECT), không có quyền ghi/xóa. | [ ] |
| 4 | **Tính duy nhất của Mã NV** | Mỗi bác sĩ có duy nhất một `staff_id` không bị trùng lặp. | [ ] |
| 5 | **Định dạng Giới tính** | Chỉ dùng `MALE` hoặc `FEMALE`. | [ ] |
| 6 | **Định dạng Thời gian** | Giờ khám chuẩn `HH:mm` 24h (Ví dụ: `08:00`, `16:30`). | [ ] |
| 7 | **Định dạng Thứ trong tuần** | Số nguyên từ 0 (Chủ nhật) đến 6 (Thứ bảy). | [ ] |
| 8 | **Định dạng Giá khám** | Số nguyên dương (VND), không chứa ký tự chữ hay dấu phẩy. | [ ] |
| 9 | **Kiểm thử tự động Postman** | Chạy file `novacare-his-postman.json` báo PASS 100%. | [ ] |
| 10 | **Thời gian phản hồi API** | Tốc độ phản hồi dưới 3.000 ms (tối đa không quá 10.000 ms). | [ ] |

---

## PHẦN XIII: KÊNH HỖ TRỢ KỸ THUẬT & XỬ LÝ SỰ CỐ

Trong quá trình triển khai, nếu phát sinh sự cố hoặc cần phối hợp kiểm thử môi trường mạng riêng, Đội ngũ IT bệnh viện vui lòng liên hệ:
- **Đội Kỹ thuật & Tích hợp Hệ thống NovaCare**:
  - Hotline kỹ thuật 24/7: **1900 6868 (Nhánh 2 - Bộ phận Liên thông)**
  - Email tiếp nhận kỹ thuật: `integration@novacare.vn`
  - Cổng tài liệu trực tuyến: `https://novacare.vn/docs/integration`

---
*Tài liệu được ban hành chính thức bởi NovaCare Health Platform - Bản quyền 2026.*
