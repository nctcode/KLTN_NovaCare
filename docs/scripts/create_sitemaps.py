import os

puml_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML"

# Common Visual Paradigm styling for Site Maps
vp_style = """!theme plain
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam roundcorner 0
skinparam defaultFontName Arial
skinparam defaultFontSize 11
skinparam defaultFontColor #000000

skinparam ArrowColor #000000
skinparam ArrowThickness 1

skinparam rectangle {
    BackgroundColor #87CEEB
    BorderColor #000000
    BorderThickness 1
    FontColor #000000
    FontSize 11
    FontStyle bold
}

skinparam package {
    BackgroundColor #FFFFFF
    BorderColor #000000
    BorderThickness 1
    FontColor #000000
    FontSize 12
    FontStyle bold
    Style rectangle
}

skinparam linetype ortho
skinparam nodesep 25
skinparam ranksep 35
"""

# ==============================================================================
# 12. SƠ ĐỒ SITE MAP TỔNG THỂ HỆ THỐNG NOVACARE
# ==============================================================================
sitemap_12 = f"""@startuml 12_SiteMap_Tong_The
{vp_style}
title SƠ ĐỒ SITE MAP TỔNG THỂ HỆ THỐNG Y TẾ SỐ NOVACARE (OMNICHANNEL ARCHITECTURE)

rectangle "HỆ THỐNG Y TẾ SỐ NOVACARE\\n(Omnichannel Digital Health Platform)" as Root #5DADE2

package "1. Cổng Thông tin & Dịch vụ Web Công cộng\\n(Public Web Portal)" as P_Public {{
    rectangle "Trang chủ (Home)\\n/ " as Pub_Home
    rectangle "Khám phá Cơ sở Y tế\\n/co-so-y-te" as Pub_Hosp
    rectangle "Danh bạ Bác sĩ\\n/bac-si" as Pub_Doc
    rectangle "Danh mục Chuyên khoa\\n/chuyen-khoa" as Pub_Spec
    rectangle "Dịch vụ & Gói khám\\n/dich-vu/*" as Pub_Serv
    rectangle "Đặt lịch Khám trực tuyến\\n/dat-lich" as Pub_Book
    rectangle "Tin tức & Y học thường thức\\n/tin-tuc" as Pub_News
    rectangle "Hợp tác Doanh nghiệp / CSYT\\n/lien-he-hop-tac" as Pub_Partner
}}

package "2. Cổng Bệnh nhân Web & Cá nhân hóa\\n(Patient Web Dashboard)" as P_Patient {{
    rectangle "Hồ sơ Sức khỏe Gia đình\\n/ho-so" as Pat_Profile
    rectangle "Hộ chiếu Y tế (Passport)\\n/ho-so (Passport QR)" as Pat_Pass
    rectangle "Quản lý Lịch khám\\n/lich-kham" as Pat_Appt
    rectangle "Lịch sử & Bệnh án EMR\\n/tra-cuu-benh-an" as Pat_EMR
    rectangle "Tư vấn Khám từ xa\\n/tu-van" as Pat_Tele
    rectangle "Đánh giá Chất lượng\\n/danh-gia" as Pat_Review
    rectangle "Thông báo & Lời nhắc\\n/thong-bao" as Pat_Notif
}}

package "3. Cổng Quản trị Bệnh viện & Cơ sở\\n(Hospital Admin Portal)" as P_Hospital {{
    rectangle "Bảng điều khiển Cơ sở\\n/hospital-admin" as Hosp_Dash
    rectangle "Tiếp đón & Quản lý Ca khám\\n/hospital-admin/appointments" as Hosp_Appt
    rectangle "Quản lý Bác sĩ & Phòng khám\\n/hospital-admin/doctors" as Hosp_Doc
    rectangle "Quản lý Ca trực & Suất khám\\n/hospital-admin/schedules" as Hosp_Sched
    rectangle "Danh mục Dịch vụ Bệnh viện\\n/hospital-admin/services" as Hosp_Serv
    rectangle "Thông tin CSYT & Chi nhánh\\n/hospital-admin/hospital-info" as Hosp_Info
    rectangle "Cổng Tích hợp & Đồng bộ HIS\\n/hospital-admin/integration" as Hosp_HIS
}}

package "4. Cổng Quản trị Hệ thống Toàn sàn\\n(Super Admin Portal)" as P_Admin {{
    rectangle "Dashboard Giám sát Toàn sàn\\n/admin" as Adm_Dash
    rectangle "Quản trị Người dùng & Quyền\\n/admin/users" as Adm_User
    rectangle "Mạng lưới CSYT & Đối tác\\n/admin/hospitals" as Adm_Hosp
    rectangle "Xét duyệt Hồ sơ Hợp tác\\n/admin/partner-requests" as Adm_PartReq
    rectangle "Danh mục Kỹ thuật Toàn quốc\\n/admin/specialties | services" as Adm_Catalog
    rectangle "Tài chính & Đối soát Viện phí\\n/admin/payments" as Adm_Pay
    rectangle "Kiểm duyệt Nhận xét & Đánh giá\\n/admin/reviews" as Adm_Rev
    rectangle "Liên thông Y tế & Kiểm toán\\n/admin/interoperability | audit-logs" as Adm_Audit
}}

package "5. Ứng dụng Di động Người bệnh\\n(NovaCare Patient Mobile App)" as P_Mobile {{
    rectangle "Trang chủ Mobile (Home Tab)\\nHomeScreen" as Mob_Home
    rectangle "Tìm kiếm & Tra cứu (Search Tab)\\nSearchScreen" as Mob_Search
    rectangle "Sàng lọc Tiền khám AI\\nPreExamScreeningScreen" as Mob_AI
    rectangle "Đặt khám & Thanh toán\\nBookingScreen -> PaymentScreen" as Mob_Book
    rectangle "Tư vấn Từ xa (Telemedicine Tab)\\nConsultationHomeScreen" as Mob_Tele
    rectangle "Lịch hẹn của tôi (Appointments Tab)\\nAppointmentListScreen" as Mob_Appt
    rectangle "Hồ sơ & Cài đặt (Settings Tab)\\nSettingsScreen -> ProfileListScreen" as Mob_Prof
}}

' Kết nối đa kênh
Root -down-> P_Public : "Kênh Web Khách"
Root -down-> P_Patient : "Kênh Web Bệnh nhân"
Root -down-> P_Mobile : "Kênh Mobile App"
Root -down-> P_Hospital : "Kênh Quản trị Viện"
Root -down-> P_Admin : "Kênh Quản trị Toàn sàn"

Pub_Home -down-> Pub_Hosp
Pub_Home -down-> Pub_Doc
Pub_Home -down-> Pub_Spec
Pub_Home -down-> Pub_Serv
Pub_Home -down-> Pub_Book
Pub_Home -down-> Pub_News
Pub_Home -down-> Pub_Partner

Pat_Appt -down-> Pat_Profile
Pat_Appt -down-> Pat_EMR
Pat_Appt -down-> Pat_Tele
Pat_Appt -down-> Pat_Review

Hosp_Dash -down-> Hosp_Appt
Hosp_Dash -down-> Hosp_Doc
Hosp_Dash -down-> Hosp_Sched
Hosp_Dash -down-> Hosp_Serv
Hosp_Dash -down-> Hosp_Info
Hosp_Dash -down-> Hosp_HIS

Adm_Dash -down-> Adm_User
Adm_Dash -down-> Adm_Hosp
Adm_Dash -down-> Adm_PartReq
Adm_Dash -down-> Adm_Catalog
Adm_Dash -down-> Adm_Pay
Adm_Dash -down-> Adm_Rev
Adm_Dash -down-> Adm_Audit

Mob_Home -down-> Mob_Search
Mob_Home -down-> Mob_AI
Mob_Home -down-> Mob_Book
Mob_Home -down-> Mob_Tele
Mob_Home -down-> Mob_Appt
Mob_Home -down-> Mob_Prof

@enduml
"""

# ==============================================================================
# 13. SƠ ĐỒ SITE MAP ỨNG DỤNG DI ĐỘNG BỆNH NHÂN (PATIENT MOBILE APP)
# ==============================================================================
sitemap_13 = f"""@startuml 13_SiteMap_Mobile_App
{vp_style}
title SƠ ĐỒ ĐIỀU HƯỚNG MÀN HÌNH ỨNG DỤNG DI ĐỘNG BỆNH NHÂN (NOVACARE PATIENT MOBILE APP)

rectangle "Ứng dụng Di động NovaCare\\n(Android / iOS App Root)" as App_Root #5DADE2

package "1. Luồng Xác thực Người dùng (Authentication Flow)" as P_Auth {{
    rectangle "Màn hình Đăng nhập\\n(LoginScreen)" as Scr_Login
    rectangle "Màn hình Đăng ký\\n(RegisterScreen)" as Scr_Register
    rectangle "Xác minh OTP Đăng ký\\n(OtpVerificationDialog)" as Scr_RegOtp
    rectangle "Quên mật khẩu\\n(ForgotPasswordScreen)" as Scr_Forgot
    rectangle "Đặt lại Mật khẩu\\n(ResetPasswordScreen)" as Scr_Reset
}}

package "2. Thanh Điều hướng Chính (Bottom Navigation Tabs)" as P_BottomNav {{
    rectangle "Tab 1: Trang chủ\\n(HomeScreen)" as Tab_Home
    rectangle "Tab 2: Tìm kiếm CSYT & Bác sĩ\\n(SearchScreen)" as Tab_Search
    rectangle "Tab 3: Lịch hẹn của tôi\\n(AppointmentListScreen)" as Tab_Appt
    rectangle "Tab 4: Khám bệnh từ xa\\n(ConsultationHomeScreen)" as Tab_Tele
    rectangle "Tab 5: Cá nhân & Cài đặt\\n(SettingsScreen)" as Tab_Settings
}}

package "3. Phân hệ Sàng lọc Tiền khám Thông minh AI (Smart Screening)" as P_Screening {{
    rectangle "Khởi động Sàng lọc AI\\n(PreExamScreeningScreen)" as Scr_ScreenRoot
    rectangle "Bước 1: Sơ đồ Cơ thể & Triệu chứng\\n(ScreeningStep1Components)" as Scr_Step1
    rectangle "Bước 2A: Ghi âm Giọng nói Whisper\\n(ScreeningVoiceComponents)" as Scr_Voice
    rectangle "Bước 2B: Chụp ảnh Tổn thương da/mắt\\n(ScreeningImageComponents)" as Scr_Image
    rectangle "Bước 2C: Đo Nhịp tim Camera PPG\\n(ScreeningPpgCapture)" as Scr_PPG
    rectangle "Bước 3: Kết quả Triage & Gợi ý\\n(ScreeningResultComponents)" as Scr_Result
    rectangle "Cảnh báo Khẩn cấp 115\\n(EmergencyGuidanceDialog)" as Scr_Emerg
}}

package "4. Phân hệ Đặt lịch & Thanh toán Viện phí (Booking & Payment)" as P_Booking {{
    rectangle "Chọn Bệnh viện / Phòng khám\\n(HospitalFacilityBookingScreen)" as Scr_HospSelect
    rectangle "Danh sách Bác sĩ theo Chuyên khoa\\n(DoctorListScreen)" as Scr_DocList
    rectangle "Hồ sơ Bác sĩ & Biểu phí\\n(DoctorDetailScreen)" as Scr_DocDetail
    rectangle "Chọn Khung giờ & Hồ sơ khám\\n(BookingScreen)" as Scr_SlotBook
    rectangle "Cổng Thanh toán Viện phí\\n(PaymentScreen)" as Scr_Payment
    rectangle "Chi tiết Phiếu hẹn & QR Check-in\\n(AppointmentDetailScreen)" as Scr_ApptDetail
}}

package "5. Phân hệ Hội chẩn Trực tuyến (Telemedicine Call Flow)" as P_TeleFlow {{
    rectangle "Kiểm tra Thiết bị Camera / Mic\\n(ConsultationPrecheckScreen)" as Scr_Precheck
    rectangle "Phòng Hội chẩn Video Trực tuyến\\n(ConsultationVideoScreen)" as Scr_VideoCall
    rectangle "Nhắn tin & Gửi Tệp Lâm sàng\\n(ConsultationChatScreen)" as Scr_ChatRoom
}}

package "6. Phân hệ Quản lý Hồ sơ & Hộ chiếu Y tế (Patient Passport)" as P_Profiles {{
    rectangle "Danh sách Hồ sơ Gia đình\\n(ProfileListScreen)" as Scr_ProfList
    rectangle "Thêm / Chỉnh sửa Hồ sơ\\n(EditProfileScreen)" as Scr_ProfEdit
    rectangle "Hộ chiếu Y tế Điện tử\\n(MedicalPassportScreen)" as Scr_Passport
    rectangle "Mã QR Định danh Y tế cá nhân\\n(PassportQrViewModal)" as Scr_PassQR
    rectangle "Trung tâm Thông báo\\n(NotificationScreen)" as Scr_Notif
}}

' Kết nối luồng
App_Root -down-> P_Auth : "Chưa đăng nhập"
App_Root -down-> P_BottomNav : "Đã đăng nhập"

Scr_Login -right-> Scr_Register
Scr_Register -down-> Scr_RegOtp
Scr_Login -down-> Scr_Forgot
Scr_Forgot -down-> Scr_Reset

Tab_Home -down-> P_Screening : "Khám sàng lọc AI"
Tab_Home -down-> Scr_Notif : "Nhấn chuông thông báo"

Scr_ScreenRoot -down-> Scr_Step1
Scr_Step1 -down-> Scr_Voice
Scr_Step1 -down-> Scr_Image
Scr_Step1 -down-> Scr_PPG
Scr_Voice -down-> Scr_Result
Scr_Image -down-> Scr_Result
Scr_PPG -down-> Scr_Result
Scr_Result -down-> Scr_Emerg : "Nguy cơ ĐỎ"
Scr_Result -down-> Scr_HospSelect : "Đặt khám theo gợi ý"

Tab_Search -down-> Scr_HospSelect
Tab_Search -down-> Scr_DocList
Scr_DocList -down-> Scr_DocDetail
Scr_DocDetail -down-> Scr_SlotBook
Scr_HospSelect -down-> Scr_SlotBook
Scr_SlotBook -down-> Scr_Payment
Scr_Payment -down-> Scr_ApptDetail

Tab_Appt -down-> Scr_ApptDetail

Tab_Tele -down-> Scr_Precheck
Scr_Precheck -down-> Scr_VideoCall
Scr_VideoCall -right-> Scr_ChatRoom

Tab_Settings -down-> Scr_ProfList
Scr_ProfList -down-> Scr_ProfEdit
Scr_ProfList -down-> Scr_Passport
Scr_Passport -down-> Scr_PassQR

@enduml
"""

# ==============================================================================
# 14. SƠ ĐỒ SITE MAP CỔNG THÔNG TIN & NGƯỜI BỆNH WEB (PUBLIC & PATIENT WEB)
# ==============================================================================
sitemap_14 = f"""@startuml 14_SiteMap_Web_Public_Patient
{vp_style}
title SƠ ĐỒ SITE MAP CỔNG THÔNG TIN VÀ DỊCH VỤ NGƯỜI BỆNH WEB (NOVACARE PUBLIC & PATIENT PORTAL)

rectangle "NovaCare Web Application (Root /)" as Web_Root #5DADE2

package "1. Cổng Thông tin Đại chúng (Public Information Portal)" as P_PublicWeb {{
    rectangle "Trang chủ\\n/" as Page_Home
    rectangle "Danh bạ Bác sĩ\\n/bac-si" as Page_Doctors
    rectangle "Chi tiết Bác sĩ\\n/bac-si/[...id]" as Page_DoctorDetail
    rectangle "Danh mục Chuyên khoa\\n/chuyen-khoa" as Page_Specs
    rectangle "Chi tiết Chuyên khoa\\n/chuyen-khoa/[...specialtyId]" as Page_SpecDetail
    rectangle "Mạng lưới Cơ sở Y tế\\n/co-so-y-te" as Page_Hosps
    rectangle "Chi tiết Cơ sở Y tế\\n/co-so-y-te/[...id]" as Page_HospDetail
    rectangle "Danh mục Dịch vụ Kỹ thuật\\n/dich-vu" as Page_Services
    rectangle "Gói khám Sức khỏe\\n/dich-vu/goi-kham-suc-khoe" as Page_HealthPkg
    rectangle "Xét nghiệm & CĐHA\\n/dich-vu/xet-nghiem | chan-doan-hinh-anh" as Page_LabImaging
    rectangle "Cẩm nang Y tế & Tin tức\\n/tin-tuc" as Page_News
    rectangle "Chi tiết Bài viết\\n/tin-tuc/[slug]" as Page_NewsDetail
    rectangle "Tra cứu Hồ sơ nhanh\\n/tra-cuu-ho-so" as Page_QuickSearch
    rectangle "Liên hệ Hợp tác CSYT\\n/lien-he-hop-tac" as Page_Contact
    rectangle "Điều khoản & Chính sách\\n/dieu-khoan | chinh-sach" as Page_Policy
}}

package "2. Luồng Đặt lịch & Thanh toán Web (Public Booking & Payment)" as P_WebBooking {{
    rectangle "Điều phối Đặt lịch\\n/dat-lich" as Page_BookGeneral
    rectangle "Đặt khám theo Cơ sở\\n/dat-kham-co-so" as Page_BookFacility
    rectangle "Đặt khám theo Chuyên khoa\\n/dat-kham-chuyen-khoa/[...specialtyId]" as Page_BookSpecialty
    rectangle "Cổng Thanh toán Trực tuyến\\n/thanh-toan" as Page_Payment
    rectangle "Kết quả Giao dịch Viện phí\\n/thanh-toan/return" as Page_PayReturn
}}

package "3. Phân hệ Xác thực Người dùng Web (Authentication)" as P_WebAuth {{
    rectangle "Đăng nhập\\n/dang-nhap" as Page_Login
    rectangle "Đăng ký Thành viên\\n/dang-ky" as Page_Register
    rectangle "Quên Mật khẩu\\n/quen-mat-khau" as Page_Forgot
}}

package "4. Bảng điều khiển Bệnh nhân (Patient Dashboard - Yêu cầu Đăng nhập)" as P_PatientDash {{
    rectangle "Quản lý Hồ sơ Gia đình\\n/ho-so" as Dash_Profiles
    rectangle "Quản lý Lịch hẹn Khám\\n/lich-kham" as Dash_Appointments
    rectangle "Chi tiết Phiếu hẹn & Check-in\\n/lich-kham/[id]" as Dash_ApptDetail
    rectangle "Lịch sử Ca khám Hoàn tất\\n/lich-su-kham" as Dash_History
    rectangle "Hồ sơ Bệnh án EMR & Đơn thuốc\\n/tra-cuu-benh-an" as Dash_EMR
    rectangle "Hội chẩn Khám từ xa Telemedicine\\n/tu-van" as Dash_Telemedicine
    rectangle "Phòng Khám bệnh Video Call\\n/tu-van/[id]" as Dash_VideoRoom
    rectangle "Đánh giá Chất lượng Dịch vụ\\n/danh-gia" as Dash_Reviews
    rectangle "Trung tâm Thông báo Cá nhân\\n/thong-bao" as Dash_Notifications
    rectangle "Cài đặt & Bảo mật Tài khoản\\n/tai-khoan" as Dash_Account
}}

Web_Root -down-> Page_Home
Web_Root -down-> Page_Login
Web_Root -down-> Dash_Profiles : "Đăng nhập thành công"

Page_Home -down-> Page_Doctors
Page_Doctors -down-> Page_DoctorDetail
Page_Home -down-> Page_Specs
Page_Specs -down-> Page_SpecDetail
Page_Home -down-> Page_Hosps
Page_Hosps -down-> Page_HospDetail
Page_Home -down-> Page_Services
Page_Services -down-> Page_HealthPkg
Page_Services -down-> Page_LabImaging
Page_Home -down-> Page_News
Page_News -down-> Page_NewsDetail
Page_Home -down-> Page_QuickSearch
Page_Home -down-> Page_Contact
Page_Home -down-> Page_Policy

Page_Home -down-> Page_BookGeneral
Page_BookGeneral -down-> Page_BookFacility
Page_BookGeneral -down-> Page_BookSpecialty
Page_BookFacility -down-> Page_Payment
Page_BookSpecialty -down-> Page_Payment
Page_Payment -down-> Page_PayReturn

Page_Login -right-> Page_Register
Page_Login -down-> Page_Forgot

Dash_Appointments -down-> Dash_ApptDetail
Dash_Appointments -down-> Dash_History
Dash_Appointments -down-> Dash_Reviews
Dash_History -down-> Dash_EMR
Dash_Telemedicine -down-> Dash_VideoRoom
Dash_Profiles -down-> Dash_Account
Dash_Profiles -down-> Dash_Notifications

@enduml
"""

# ==============================================================================
# 15. SƠ ĐỒ SITE MAP CỔNG QUẢN TRỊ BỆNH VIỆN (HOSPITAL ADMIN PORTAL)
# ==============================================================================
sitemap_15 = f"""@startuml 15_SiteMap_Hospital_Admin
{vp_style}
title SƠ ĐỒ SITE MAP CỔNG QUẢN TRỊ CƠ SỞ Y TẾ (NOVACARE HOSPITAL ADMIN PORTAL)

rectangle "Hospital Admin Portal Root\\n(/hospital-admin)" as Hosp_Root #5DADE2

package "1. Bảng điều khiển Tổng quan (Dashboard)" as P_HospDash {{
    rectangle "Dashboard Thống kê Vận hành\\n/hospital-admin" as Menu_Dash
    rectangle "Biểu đồ Ca khám & Doanh thu\\n(Revenue & Appointment Stats)" as Sub_Stats
    rectangle "Trạng thái Phòng khám Hiện thời\\n(Clinic Room Live Status)" as Sub_LiveStatus
}}

package "2. Quản lý Tiếp đón & Lịch hẹn (Appointments Desk)" as P_HospAppts {{
    rectangle "Quản trị Lịch khám Bệnh viện\\n/hospital-admin/appointments" as Menu_Appts
    rectangle "Danh sách Tiếp đón trong ngày\\n(Today's Queue List)" as Sub_TodayQueue
    rectangle "Check-in QR Code Bệnh nhân\\n(QR Code Scanner Modal)" as Sub_Checkin
    rectangle "Điều phối & Chuyển trạng thái\\n(Status Workflow Controller)" as Sub_StatusChange
    rectangle "In Phiếu Khám & Số Thứ tự\\n(Print Queue Ticket)" as Sub_PrintTicket
}}

package "3. Quản lý Nhân lực Bác sĩ (Doctor Staff Management)" as P_HospDocs {{
    rectangle "Danh bạ Bác sĩ Bệnh viện\\n/hospital-admin/doctors" as Menu_Doctors
    rectangle "Hồ sơ Chuyên môn & Bằng cấp\\n(Doctor Profile & Credentials)" as Sub_DocProfile
    rectangle "Phân công Phòng khám Trực\\n(Assign Clinic Room Modal)" as Sub_AssignRoom
    rectangle "Cấu hình Biểu phí Khám bệnh\\n(Consultation Fee Config)" as Sub_FeeConfig
}}

package "4. Quản trị Ca trực & Lịch làm việc (Schedule & Slots)" as P_HospSched {{
    rectangle "Lịch trực & Suất khám Bệnh viện\\n/hospital-admin/schedules" as Menu_Schedules
    rectangle "Thiết lập Lịch trực Tuần\\n(Weekly Recurring Schedule)" as Sub_WeeklySched
    rectangle "Sinh Suất khám Tự động (Slots)\\n(Slot Generation Engine)" as Sub_GenSlots
    rectangle "Đăng ký Nghỉ phép & Báo bận\\n(Doctor Schedule Exceptions)" as Sub_Exceptions
}}

package "5. Danh mục Kỹ thuật & Chuyên khoa (Catalog & Services)" as P_HospCatalog {{
    rectangle "Danh mục Dịch vụ Bệnh viện\\n/hospital-admin/services" as Menu_Services
    rectangle "Thiết lập Đơn giá & BHYT\\n(Service Price & Insurance Setup)" as Sub_ServicePrice
    rectangle "Chuyên khoa Triển khai tại Viện\\n/hospital-admin/specialties" as Menu_Specialties
    rectangle "Liên kết Khoa & Phòng khám\\n(Specialty-Room Mapping)" as Sub_SpecRoom
}}

package "6. Thông tin Cơ sở & Tích hợp HIS (Facility & Integration)" as P_HospConfig {{
    rectangle "Thông tin Pháp nhân CSYT\\n/hospital-admin/hospital-info" as Menu_Info
    rectangle "Quản lý Chi nhánh Bệnh viện\\n(Hospital Branches Management)" as Sub_Branches
    rectangle "Cấu hình Quy định Đặt hẹn\\n(HospitalBookingConfig Setup)" as Sub_BookingConfig
    rectangle "Cổng Kết nối & Đồng bộ HIS\\n/hospital-admin/integration" as Menu_HIS
    rectangle "Trạng thái Liên thông Webhook\\n(HIS Webhook & API Monitor)" as Sub_HISMonitor
}}

Hosp_Root -down-> Menu_Dash
Hosp_Root -down-> Menu_Appts
Hosp_Root -down-> Menu_Doctors
Hosp_Root -down-> Menu_Schedules
Hosp_Root -down-> Menu_Services
Hosp_Root -down-> Menu_Info
Hosp_Root -down-> Menu_HIS

Menu_Dash -down-> Sub_Stats
Menu_Dash -down-> Sub_LiveStatus

Menu_Appts -down-> Sub_TodayQueue
Menu_Appts -down-> Sub_Checkin
Menu_Appts -down-> Sub_StatusChange
Menu_Appts -down-> Sub_PrintTicket

Menu_Doctors -down-> Sub_DocProfile
Menu_Doctors -down-> Sub_AssignRoom
Menu_Doctors -down-> Sub_FeeConfig

Menu_Schedules -down-> Sub_WeeklySched
Menu_Schedules -down-> Sub_GenSlots
Menu_Schedules -down-> Sub_Exceptions

Menu_Services -down-> Sub_ServicePrice
Menu_Specialties -down-> Sub_SpecRoom
Menu_Services -right-> Menu_Specialties

Menu_Info -down-> Sub_Branches
Menu_Info -down-> Sub_BookingConfig

Menu_HIS -down-> Sub_HISMonitor

@enduml
"""

# ==============================================================================
# 16. SƠ ĐỒ SITE MAP CỔNG QUẢN TRỊ HỆ THỐNG TOÀN SÀN (SUPER ADMIN PORTAL)
# ==============================================================================
sitemap_16 = f"""@startuml 16_SiteMap_Super_Admin
{vp_style}
title SƠ ĐỒ SITE MAP CỔNG QUẢN TRỊ HỆ THỐNG TOÀN SÀN (NOVACARE SUPER ADMIN PORTAL)

rectangle "Super Admin Portal Root\\n(/admin)" as Adm_Root #5DADE2

package "1. Giám sát & Bảng điều khiển (Analytics & BI)" as P_AdmBI {{
    rectangle "Dashboard Toàn sàn NovaCare\\n/admin" as Adm_MenuDash
    rectangle "Chỉ số Tăng trưởng & Người dùng\\n(User Growth & MAU Analytics)" as Sub_AdmUsersStats
    rectangle "Sản lượng Đặt khám Toàn mạng lưới\\n(Network-wide Appointment Volume)" as Sub_AdmApptStats
    rectangle "Tổng Doanh thu Giao dịch (GMV)\\n(Platform GMV & Financial Overview)" as Sub_AdmRevStats
}}

package "2. Quản trị Người dùng & Phân quyền (Users & RBAC)" as P_AdmUsers {{
    rectangle "Quản lý Người dùng Toàn sàn\\n/admin/users" as Adm_MenuUsers
    rectangle "Phân quyền & Vai trò (RBAC)\\n/admin/users/roles" as Adm_MenuRoles
    rectangle "Lịch sử Hoạt động & Đăng nhập\\n/admin/users/activity" as Adm_MenuActivity
    rectangle "Khóa / Kích hoạt Tài khoản\\n(User Status Controller Modal)" as Sub_AdmLockUser
}}

package "3. Quản trị Mạng lưới Y tế (Hospitals & Partnerships)" as P_AdmHosps {{
    rectangle "Quản lý Mạng lưới CSYT\\n/admin/hospitals" as Adm_MenuHosps
    rectangle "Tạo mới Bệnh viện Đối tác\\n/admin/hospitals/new" as Adm_MenuNewHosp
    rectangle "Hồ sơ Chi tiết & Hợp đồng\\n/admin/hospitals/[id] | edit" as Adm_MenuEditHosp
    rectangle "Xét duyệt Yêu cầu Hợp tác\\n/admin/partner-requests" as Adm_MenuPartReq
    rectangle "Thẩm định Hồ sơ Pháp lý Viện\\n(Approve / Reject Partner Modal)" as Sub_AdmApprovePart
}}

package "4. Danh mục Kỹ thuật Chuẩn hóa Toàn quốc (Standard Catalogs)" as P_AdmCatalogs {{
    rectangle "Quản lý 12 Chuyên khoa Chuẩn\\n/admin/specialties" as Adm_MenuSpecs
    rectangle "Quản lý Danh bạ Bác sĩ Sàn\\n/admin/doctors" as Adm_MenuDocs
    rectangle "Danh mục Dịch vụ Y tế Quốc gia\\n/admin/medical-services" as Adm_MenuServs
    rectangle "Quản lý Gói khám Sức khỏe\\n/admin/health-packages" as Adm_MenuPkgs
    rectangle "Giám sát Lịch trực Toàn sàn\\n/admin/schedules" as Adm_MenuScheds
}}

package "5. Giao dịch Ca khám & Tài chính (Transactions & Finance)" as P_AdmFinance {{
    rectangle "Quản lý Lịch hẹn Toàn hệ thống\\n/admin/appointments" as Adm_MenuAppts
    rectangle "Ca khám Diễn ra Trong ngày\\n/admin/appointments/today" as Adm_MenuTodayAppts
    rectangle "Lịch sử Đặt khám Toàn sàn\\n/admin/appointments/history" as Adm_MenuHistAppts
    rectangle "Quản lý Thanh toán & Cổng GD\\n/admin/payments" as Adm_MenuPayments
    rectangle "Đối soát Viện phí & Hoàn tiền\\n(Settlement & Refund Processing)" as Sub_AdmRefund
}}

package "6. Kiểm duyệt, Liên thông & An ninh (Moderation & Interoperability)" as P_AdmSafety {{
    rectangle "Kiểm duyệt Nhận xét & Đánh giá\\n/admin/reviews" as Adm_MenuReviews
    rectangle "Xử lý Khiếu nại Vi phạm Review\\n(Review Report Resolution Modal)" as Sub_AdmReportRes
    rectangle "Cổng Liên thông Dữ liệu Y tế\\n/admin/interoperability" as Adm_MenuInterop
    rectangle "Ánh xạ Danh mục Quốc tế ICD-10\\n/admin/interoperability/lookups" as Adm_MenuLookups
    rectangle "Kiểm toán Kết nối Đồng bộ HIS\\n/admin/interoperability/audit" as Adm_MenuAuditHIS
    rectangle "Nhật ký Kiểm toán An ninh Toàn sàn\\n/admin/audit-logs" as Adm_MenuAuditLogs
}}

Adm_Root -down-> Adm_MenuDash
Adm_Root -down-> Adm_MenuUsers
Adm_Root -down-> Adm_MenuHosps
Adm_Root -down-> Adm_MenuSpecs
Adm_Root -down-> Adm_MenuAppts
Adm_Root -down-> Adm_MenuPayments
Adm_Root -down-> Adm_MenuReviews
Adm_Root -down-> Adm_MenuInterop
Adm_Root -down-> Adm_MenuAuditLogs

Adm_MenuDash -down-> Sub_AdmUsersStats
Adm_MenuDash -down-> Sub_AdmApptStats
Adm_MenuDash -down-> Sub_AdmRevStats

Adm_MenuUsers -down-> Adm_MenuRoles
Adm_MenuUsers -down-> Adm_MenuActivity
Adm_MenuUsers -down-> Sub_AdmLockUser

Adm_MenuHosps -down-> Adm_MenuNewHosp
Adm_MenuHosps -down-> Adm_MenuEditHosp
Adm_MenuHosps -down-> Adm_MenuPartReq
Adm_MenuPartReq -down-> Sub_AdmApprovePart

Adm_MenuSpecs -down-> Adm_MenuDocs
Adm_MenuDocs -down-> Adm_MenuServs
Adm_MenuServs -down-> Adm_MenuPkgs
Adm_MenuPkgs -down-> Adm_MenuScheds

Adm_MenuAppts -down-> Adm_MenuTodayAppts
Adm_MenuAppts -down-> Adm_MenuHistAppts

Adm_MenuPayments -down-> Sub_AdmRefund

Adm_MenuReviews -down-> Sub_AdmReportRes

Adm_MenuInterop -down-> Adm_MenuLookups
Adm_MenuInterop -down-> Adm_MenuAuditHIS

@enduml
"""

# Write all files
files_to_write = {
    "12_SiteMap_Tong_The.puml": sitemap_12,
    "13_SiteMap_Mobile_App.puml": sitemap_13,
    "14_SiteMap_Web_Public_Patient.puml": sitemap_14,
    "15_SiteMap_Hospital_Admin.puml": sitemap_15,
    "16_SiteMap_Super_Admin.puml": sitemap_16,
}

for filename, content in files_to_write.items():
    filepath = os.path.join(puml_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {filepath}")

print("All 5 Site Map diagrams created successfully!")

