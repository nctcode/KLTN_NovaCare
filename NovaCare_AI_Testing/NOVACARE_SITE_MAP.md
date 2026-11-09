# Sitemap NovaCare theo source code

## 1. Phạm vi và cách xác định

Sitemap này được lập từ:

- Các file `page.tsx` trong `nova-care-web/src/app`.
- Cấu hình menu tại `nova-care-web/src/config/navigation.ts`.
- Sidebar của bệnh nhân, Platform Admin và Hospital Admin.
- Các guard phân quyền frontend.
- Các controller backend để đối chiếu năng lực nghiệp vụ phía server.
- Luồng Smart Screening được tham chiếu từ `run_actual_tests.ts`.

Ký hiệu:

- **Đã có page:** có file `page.tsx` tương ứng.
- **Dynamic:** route dùng `[id]`, `[slug]` hoặc catch-all `[...id]`.
- **Có backend, chưa có page riêng:** controller/API tồn tại nhưng source frontend chưa có route page tương ứng.
- **Liên kết thiếu page:** menu có href nhưng không tìm thấy page hoặc dynamic route bao phủ.

Frontend hiện có **79 page routes**:

| Khu vực | Số route | Actor chính |
|---|---:|---|
| Public | 35 | Khách truy cập, bệnh nhân |
| Authentication | 3 | Khách truy cập |
| Patient dashboard | 10 | Bệnh nhân/người dùng đã đăng nhập |
| Platform Admin | 24 | ADMIN |
| Hospital Admin | 8 | HOSPITAL_ADMIN, ADMIN giám sát |

## 2. Sitemap tổng quát

```text
NovaCare /
├── Public
├── Authentication
├── Patient dashboard
├── Platform Admin
└── Hospital Admin
```

## 3. Khu vực Public

| Route | Mục đích | Trạng thái |
|---|---|---|
| `/` | Trang chủ, giới thiệu dịch vụ và lối tắt đặt lịch | Đã có page |
| `/bac-si` | Danh sách và tìm kiếm bác sĩ | Đã có page |
| `/bac-si/[...id]` | Chi tiết bác sĩ | Dynamic, đã có page |
| `/chuyen-khoa` | Danh sách chuyên khoa | Đã có page |
| `/chuyen-khoa/[...specialtyId]` | Chi tiết chuyên khoa | Dynamic, đã có page |
| `/co-so-y-te` | Danh sách cơ sở y tế, lọc theo loại | Đã có page |
| `/co-so-y-te/[...id]` | Chi tiết cơ sở y tế, bác sĩ, chi nhánh, chuyên khoa | Dynamic, đã có page |
| `/dich-vu` | Danh mục dịch vụ y tế | Đã có page |
| `/dich-vu/xet-nghiem` | Dịch vụ xét nghiệm | Đã có page |
| `/dich-vu/chan-doan-hinh-anh` | Dịch vụ chẩn đoán hình ảnh | Đã có page |
| `/dich-vu/chup-phim-noi-soi` | Dịch vụ chụp phim/nội soi | Đã có page |
| `/dich-vu/goi-kham-suc-khoe` | Gói khám sức khỏe | Đã có page |
| `/dich-vu/kham-tai-nha` | Khám/y tế tại nhà | Đã có page |
| `/dich-vu/kham-thong-tu` | Khám theo thông tư | Đã có page |
| `/dich-vu/tiem-chung` | Dịch vụ tiêm chủng | Đã có page |
| `/dich-vu/tu-van-tu-xa` | Tư vấn từ xa/video | Đã có page |
| `/dich-vu/tham-my` | Dịch vụ tạo hình thẩm mỹ | Đã có page |
| `/doanh-nghiep` | Khám sức khỏe doanh nghiệp | Đã có page |
| `/dat-lich` | Luồng đặt lịch tổng quát | Đã có page |
| `/dat-kham-co-so` | Luồng đặt khám tại cơ sở, hỗ trợ query mode/doctor/service | Đã có page |
| `/dat-kham-chuyen-khoa/[...specialtyId]` | Luồng đặt khám theo chuyên khoa | Dynamic, đã có page |
| `/thanh-toan` | Thanh toán lịch hẹn | Đã có page |
| `/thanh-toan/return` | Trang quay về sau thanh toán | Đã có page |
| `/tin-tuc` | Danh sách tin tức | Đã có page |
| `/tin-tuc/[slug]` | Chi tiết tin tức | Dynamic, đã có page |
| `/huong-dan` | Danh sách hướng dẫn | Đã có page |
| `/huong-dan/[slug]` | Chi tiết hướng dẫn theo slug | Dynamic, bao phủ `dat-lich`, `quy-trinh-kham`, `thanh-toan` |
| `/cau-hoi-thuong-gap` | FAQ | Đã có page |
| `/lien-he` | Liên hệ/hỗ trợ | Đã có page |
| `/lien-he-hop-tac` | Đăng ký hợp tác với NovaCare | Đã có page |
| `/ve-chung-toi` | Giới thiệu NovaCare | Đã có page |
| `/chinh-sach` | Chính sách | Đã có page |
| `/dieu-khoan` | Điều khoản sử dụng | Đã có page |
| `/tra-cuu-ho-so` | Tra cứu hồ sơ công khai | Đã có page |

### Các biến thể query được menu sử dụng

| URL | Ý nghĩa |
|---|---|
| `/co-so-y-te?type=benh-vien-cong` | Lọc bệnh viện công |
| `/co-so-y-te?type=benh-vien-tu` | Lọc bệnh viện tư |
| `/co-so-y-te?type=phong-kham` | Lọc phòng khám |
| `/co-so-y-te?type=xet-nghiem` | Lọc trung tâm xét nghiệm/chẩn đoán hình ảnh |
| `/dat-kham-co-so?mode=out_of_hours` | Đặt khám ngoài giờ |
| `/dat-kham-co-so?mode=service` | Đặt theo dịch vụ |
| `/lien-he-hop-tac?type=co-so-y-te` | Đăng ký cơ sở y tế hợp tác |
| `/lien-he-hop-tac?type=bac-si` | Đăng ký bác sĩ hợp tác |
| `/tin-tuc?category=...` | Lọc nhóm tin tức |

### Liên kết menu cần xử lý

| Href trong `navigation.ts` | Kết quả đối chiếu |
|---|---|
| `/dich-vu/giup-viec` | Không có `page.tsx` và không có dynamic route tương ứng |
| `/dich-vu/nha-thuoc` | Không có `page.tsx` và không có dynamic route tương ứng |

Hai mục trên đang được hiển thị như liên kết trong menu nhưng chưa có site page thực tế. Cần hoặc tạo page, hoặc bỏ/cập nhật liên kết.

## 4. Authentication

| Route | Mục đích | Actor |
|---|---|---|
| `/dang-nhap` | Đăng nhập | Khách, bệnh nhân, ADMIN, HOSPITAL_ADMIN |
| `/dang-ky` | Đăng ký tài khoản | Khách |
| `/quen-mat-khau` | Khôi phục mật khẩu | Người dùng |

Backend auth có các nhóm chức năng đăng nhập, đăng ký, refresh token, OTP/đặt lại mật khẩu và lấy thông tin phiên tại `src/modules/auth/auth.controller.ts`.

## 5. Patient dashboard

Tất cả route trong nhóm này được bao bởi `DashboardLayout`, yêu cầu người dùng đã đăng nhập; nếu chưa đăng nhập sẽ chuyển về `/dang-nhap`.

| Route | Chức năng |
|---|---|
| `/tai-khoan` | Quản lý tài khoản cá nhân |
| `/ho-so` | Quản lý hồ sơ bệnh nhân và thông tin chia sẻ |
| `/lich-kham` | Danh sách lịch khám |
| `/lich-kham/[id]` | Chi tiết lịch khám, thanh toán, hủy/đổi trạng thái, đánh giá khi đủ điều kiện |
| `/lich-su-kham` | Lịch sử khám, bệnh án/timeline, mã chia sẻ và audit truy cập |
| `/tra-cuu-benh-an` | Tra cứu bệnh án/liên thông hồ sơ |
| `/tu-van` | Danh sách phiên tư vấn |
| `/tu-van/[id]` | Chi tiết phiên tư vấn, tin nhắn, file đính kèm, video |
| `/danh-gia` | Đánh giá của người dùng |
| `/thong-bao` | Danh sách và đánh dấu thông báo đã đọc |

Smart Screening không có một page route độc lập trong `app`; nó được tích hợp vào các component đặt lịch như `PreExamScreening`, `AIHealthAssessmentWizard`, `ScreeningStep2`, `ScreeningSummary` và gọi backend `/api/v1/pre-exam-v2/analyze-smartphone`.

## 6. Platform Admin

Nhóm `/admin` được bao bởi `AdminGuard`. Guard cho phép `ADMIN` và cũng cho phép `HOSPITAL_ADMIN`, trong khi backend API tiếp tục giới hạn quyền bằng `@Roles`. Đây là điểm cần kiểm tra đồng bộ quyền ở frontend/backend.

| Route | Chức năng |
|---|---|
| `/admin` | Tổng quan nền tảng; với Hospital Admin có thể hiển thị tổng quan bệnh viện theo sidebar động |
| `/admin/hospitals` | Danh sách bệnh viện/cơ sở đối tác |
| `/admin/hospitals/new` | Tạo cơ sở y tế |
| `/admin/hospitals/[id]` | Chi tiết cơ sở, tab chi nhánh/bác sĩ/chuyên khoa/gói/dịch vụ/log |
| `/admin/hospitals/[id]/edit` | Chỉnh sửa cơ sở |
| `/admin/doctors` | Quản lý bác sĩ |
| `/admin/schedules` | Lịch trực/lịch khám |
| `/admin/appointments` | Giám sát lịch hẹn |
| `/admin/appointments/today` | Lịch hẹn hôm nay |
| `/admin/appointments/history` | Lịch sử lịch hẹn |
| `/admin/medical-services` | Quản lý dịch vụ y tế |
| `/admin/health-packages` | Quản lý gói khám |
| `/admin/specialties` | Quản lý danh mục chuyên khoa và trạng thái tiếp nhận |
| `/admin/users` | Danh sách người dùng/bệnh nhân |
| `/admin/users/activity` | Hoạt động người dùng |
| `/admin/users/roles` | Quản lý vai trò/tài khoản quản trị bệnh viện |
| `/admin/partner-requests` | Duyệt đăng ký hợp tác |
| `/admin/payments` | Theo dõi thanh toán/hoàn tiền |
| `/admin/reviews` | Kiểm duyệt đánh giá và báo cáo |
| `/admin/audit-logs` | Nhật ký hệ thống |
| `/admin/his-sync` | Tích hợp/đồng bộ HIS |
| `/admin/interoperability` | Tổng quan liên thông bệnh án |
| `/admin/interoperability/audit` | Nhật ký liên thông |
| `/admin/interoperability/lookups` | Tra cứu dữ liệu liên thông |

## 7. Hospital Admin

Nhóm `/hospital-admin` được bao bởi `HospitalAdminGuard`; cho phép `HOSPITAL_ADMIN` và `ADMIN`. Hospital Admin phải có `hospitalId` được gán trước khi thao tác.

| Route | Chức năng |
|---|---|
| `/hospital-admin` | Tổng quan cơ sở |
| `/hospital-admin/hospital-info` | Hồ sơ cơ sở y tế |
| `/hospital-admin/integration` | Tích hợp và kết nối HIS |
| `/hospital-admin/doctors` | Bác sĩ trực thuộc |
| `/hospital-admin/schedules` | Lịch trực bác sĩ |
| `/hospital-admin/specialties` | Chuyên khoa cơ sở cung cấp/tiếp nhận |
| `/hospital-admin/services` | Dịch vụ y tế và khám |
| `/hospital-admin/appointments` | Quản lý lịch hẹn bệnh nhân |

## 8. Nhóm backend có ảnh hưởng đến sitemap/nghiệp vụ

Đây là các năng lực server đã thấy trong controller nhưng không phải tất cả đều có một page riêng:

| Phân hệ backend | Năng lực chính | Page frontend liên quan |
|---|---|---|
| Auth | Đăng nhập, đăng ký, refresh, OTP, reset password | `/dang-nhap`, `/dang-ky`, `/quen-mat-khau` |
| Doctors | Danh sách, chi tiết, ngày/slot trống, CRUD quản trị | `/bac-si`, `/bac-si/[...id]`, admin doctor |
| Hospitals/branches | Danh sách, chi tiết, chuyên khoa, bác sĩ, chi nhánh | `/co-so-y-te`, `/co-so-y-te/[...id]`, admin hospital |
| Specialties | Danh mục, CRUD/trạng thái | `/chuyen-khoa`, `/chuyen-khoa/[...specialtyId]`, admin specialties |
| Appointments/schedules | Tạo, xem, hủy, availability, slot | booking pages, patient appointments, admin appointments |
| Pre-exam V2 | Catalog, session, media, transcribe, smartphone analysis, health assessment | booking/screening components |
| Consultations | Phiên tư vấn, message, attachment, trạng thái | `/tu-van`, `/tu-van/[id]` |
| Consultation video | Join/capability/webhook | `/tu-van/[id]` |
| Patient profiles | CRUD hồ sơ, default profile | `/ho-so`, booking steps |
| Passport/medical integration | Hồ sơ chia sẻ, share code, revoke, audit | `/lich-su-kham`, `/tra-cuu-benh-an` |
| Clinical | Encounter, diagnosis, observations, prescriptions | Có API; chưa thấy page frontend clinical riêng |
| Payments | Tạo payment, status, VNPay IPN, refund | `/thanh-toan`, `/thanh-toan/return`, admin payments |
| Reviews | Tạo/sửa/xem/response/report/moderation | `/danh-gia`, appointment detail, admin reviews |
| Notifications | Danh sách, unread count, read/read all, register device | `/thong-bao` |
| Integration/HIS | Consent, identity matching, share codes, catalog sync, QD4750 | admin interoperability/HIS, patient medical history |

## 9. Các năng lực backend chưa có page riêng

Các API sau có source backend nhưng chưa thấy route page chuyên biệt trong frontend:

- Clinical encounter/diagnosis/observation/prescription operations.
- Một số endpoint quản trị clinic rooms/sessions.
- API catalog sync và QD4750 XML extraction.
- API identity matching/hospital links có thể đang được gọi bên trong các page liên thông, không có page độc lập.
- Smart Screening catalog, transcribe và analyze là API được gọi từ component đặt lịch, không phải URL người dùng truy cập trực tiếp.

Điều này không đồng nghĩa chức năng backend chưa hoạt động; chỉ kết luận rằng source chưa có sitemap page độc lập cho chúng.

## 10. Sitemap nên dùng làm cơ sở thiết kế

### Phân hệ người dùng

```text
Trang chủ
├── Tìm bác sĩ
├── Tìm chuyên khoa
├── Tìm cơ sở y tế
├── Dịch vụ y tế
├── Đặt lịch
│   ├── Đặt tại cơ sở
│   ├── Đặt theo chuyên khoa
│   ├── Đặt theo bác sĩ
│   └── Smart Screening tiền khám
├── Thanh toán
├── Tin tức / Hướng dẫn / FAQ
├── Đăng nhập / Đăng ký / Quên mật khẩu
└── Khu vực cá nhân
    ├── Tài khoản
    ├── Hồ sơ bệnh nhân
    ├── Lịch khám
    ├── Lịch sử khám và bệnh án
    ├── Tư vấn trực tuyến
    ├── Đánh giá
    └── Thông báo
```

### Phân hệ quản trị

```text
Platform Admin
├── Dashboard
├── Cơ sở đối tác
├── Bác sĩ / Lịch / Lịch hẹn
├── Chuyên khoa / Dịch vụ / Gói khám
├── Người dùng / Vai trò
├── Đăng ký hợp tác
├── Thanh toán
├── Đánh giá
├── HIS / API
├── Liên thông bệnh án
└── Audit log

Hospital Admin
├── Dashboard cơ sở
├── Hồ sơ cơ sở
├── Bác sĩ
├── Lịch trực
├── Chuyên khoa
├── Dịch vụ
├── Lịch hẹn
└── Tích hợp HIS
```

## 11. Kết luận

Sitemap hiện tại đã bao phủ các luồng chính: khám phá cơ sở/bác sĩ/chuyên khoa, đặt lịch, Smart Screening, thanh toán, tư vấn, hồ sơ bệnh nhân, bệnh án liên thông và quản trị vận hành. Hai mục menu `Giúp việc cá nhân` và `Mua thuốc tại An Khang` hiện chưa có page tương ứng. Ngoài ra, một số năng lực clinical/integration chỉ tồn tại ở backend hoặc nằm trong tab/component, nên không nên vẽ thành page độc lập nếu mục tiêu là sitemap giao diện hiện tại.
