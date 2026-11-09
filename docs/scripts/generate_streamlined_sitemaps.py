import os

puml_dir = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML"

vp_style = """!theme plain
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam roundcorner 0
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam defaultFontColor #000000

skinparam ArrowColor #000000
skinparam ArrowThickness 1

skinparam rectangle {
    BackgroundColor #FFFFFF
    BorderColor #000000
    BorderThickness 1
    FontColor #000000
    FontSize 12
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
skinparam nodesep 20
skinparam ranksep 30
"""

# ==============================================================================
# SƠ ĐỒ 1: SITE MAP TỔNG THỂ TOÀN HỆ THỐNG
# ==============================================================================
puml_12 = f"""@startuml 12_SiteMap_Tong_The
{vp_style}
title SƠ ĐỒ SITE MAP TỔNG THỂ HỆ THỐNG Y TẾ SỐ NOVACARE (HỆ THỐNG ĐA KÊNH)

rectangle "HỆ THỐNG Y TẾ SỐ NOVACARE" as Root

package "1. Cổng Web Công cộng" as P_Public {{
    rectangle "Trang chủ & Tra cứu" as Pub_1
    rectangle "Mạng lưới Cơ sở Y tế" as Pub_2
    rectangle "Danh bạ Bác sĩ & Chuyên khoa" as Pub_3
    rectangle "Dịch vụ & Gói khám Sức khỏe" as Pub_4
    rectangle "Tin tức & Hợp tác Doanh nghiệp" as Pub_5
}}

package "2. Cổng Web Người bệnh" as P_Patient {{
    rectangle "Hồ sơ Bệnh nhân & Hộ chiếu Y tế" as Pat_1
    rectangle "Đặt lịch & Quản lý Ca khám" as Pat_2
    rectangle "Lịch sử Khám & Bệnh án EMR" as Pat_3
    rectangle "Khám bệnh Từ xa Telemedicine" as Pat_4
    rectangle "Đánh giá Dịch vụ & Phản hồi" as Pat_5
}}

package "3. Ứng dụng Di động Bệnh nhân" as P_Mobile {{
    rectangle "Xác thực Tài khoản & OTP" as Mob_1
    rectangle "Trang chủ & Tìm kiếm Y tế" as Mob_2
    rectangle "Sàng lọc Tiền khám bằng AI" as Mob_3
    rectangle "Đặt lịch khám & Thanh toán" as Mob_4
    rectangle "Khám từ xa & Hồ sơ Sức khỏe" as Mob_5
}}

package "4. Cổng Quản trị Cơ sở Y tế" as P_Hospital {{
    rectangle "Dashboard Vận hành Cơ sở" as Hosp_1
    rectangle "Tiếp đón & Quản lý Lịch khám" as Hosp_2
    rectangle "Quản lý Bác sĩ & Phòng khám" as Hosp_3
    rectangle "Lịch trực & Suất khám (Slots)" as Hosp_4
    rectangle "Dịch vụ & Tích hợp HIS" as Hosp_5
}}

package "5. Cổng Quản trị Toàn sàn" as P_Admin {{
    rectangle "Dashboard Thống kê Toàn hệ thống" as Adm_1
    rectangle "Quản lý Tài khoản & Phân quyền" as Adm_2
    rectangle "Quản trị Mạng lưới CSYT & Đối tác" as Adm_3
    rectangle "Danh mục Y tế Chuẩn hóa Toàn quốc" as Adm_4
    rectangle "Giao dịch Tài chính & Kiểm toán" as Adm_5
}}

Root -down-> P_Public
Root -down-> P_Patient
Root -down-> P_Mobile
Root -down-> P_Hospital
Root -down-> P_Admin

Pub_1 -down-> Pub_2
Pub_2 -down-> Pub_3
Pub_3 -down-> Pub_4
Pub_4 -down-> Pub_5

Pat_1 -down-> Pat_2
Pat_2 -down-> Pat_3
Pat_3 -down-> Pat_4
Pat_4 -down-> Pat_5

Mob_1 -down-> Mob_2
Mob_2 -down-> Mob_3
Mob_3 -down-> Mob_4
Mob_4 -down-> Mob_5

Hosp_1 -down-> Hosp_2
Hosp_2 -down-> Hosp_3
Hosp_3 -down-> Hosp_4
Hosp_4 -down-> Hosp_5

Adm_1 -down-> Adm_2
Adm_2 -down-> Adm_3
Adm_3 -down-> Adm_4
Adm_4 -down-> Adm_5

@enduml
"""

# ==============================================================================
# SƠ ĐỒ 2: SITE MAP ỨNG DỤNG DI ĐỘNG BỆNH NHÂN
# ==============================================================================
puml_13 = f"""@startuml 13_SiteMap_Mobile_App
{vp_style}
title SƠ ĐỒ ĐIỀU HƯỚNG MÀN HÌNH ỨNG DỤNG DI ĐỘNG BỆNH NHÂN (NOVACARE PATIENT APP)

rectangle "ỨNG DỤNG DI ĐỘNG NOVACARE" as App_Root

package "1. Xác thực tài khoản" as P_Auth {{
    rectangle "Đăng nhập tài khoản" as Auth_Login
    rectangle "Đăng ký & Xác thực OTP" as Auth_Register
    rectangle "Quên & Đặt lại mật khẩu" as Auth_Forgot
}}

package "2. Trang chủ & Điều hướng" as P_Home {{
    rectangle "Trang chủ ứng dụng" as Home_Main
    rectangle "Danh mục dịch vụ nổi bật" as Home_Services
    rectangle "Phím tắt tiện ích y tế" as Home_Shortcuts
}}

package "3. Tìm kiếm y tế" as P_Search {{
    rectangle "Tìm kiếm cơ sở y tế" as Search_Hosp
    rectangle "Tìm kiếm bác sĩ & chuyên khoa" as Search_Doctor
    rectangle "Bộ lọc nâng cao (Khu vực, Giá)" as Search_Filter
}}

package "4. Sàng lọc sức khỏe bằng AI" as P_AI {{
    rectangle "Khai báo triệu chứng & Vị trí đau" as AI_Input
    rectangle "Phân tích đa phương thức AI" as AI_Analysis
    rectangle "Kết quả phân tầng nguy cơ & Gợi ý" as AI_Result
}}

package "5. Đặt lịch và thanh toán" as P_Booking {{
    rectangle "Chọn cơ sở y tế & Bác sĩ" as Book_Select
    rectangle "Chọn khung giờ & Hồ sơ khám" as Book_Slot
    rectangle "Thanh toán viện phí trực tuyến" as Book_Pay
    rectangle "Phiếu xác nhận & QR Check-in" as Book_Ticket
}}

package "6. Khám bệnh từ xa" as P_Tele {{
    rectangle "Danh sách ca tư vấn trực tuyến" as Tele_List
    rectangle "Kiểm tra camera & mic trước khám" as Tele_Precheck
    rectangle "Phòng gọi video hội chẩn" as Tele_Room
    rectangle "Nhắn tin & Trao đổi tài liệu" as Tele_Chat
}}

package "7. Quản lý hồ sơ sức khỏe" as P_Profile {{
    rectangle "Hồ sơ người bệnh gia đình" as Prof_Family
    rectangle "Hộ chiếu y tế số & QR cá nhân" as Prof_Passport
    rectangle "Lịch sử khám & Đơn thuốc số" as Prof_History
}}

package "8. Lịch hẹn và thông báo" as P_Appt {{
    rectangle "Danh sách lịch hẹn khám" as Appt_List
    rectangle "Chi tiết ca khám & Hủy lịch" as Appt_Detail
    rectangle "Trung tâm thông báo & Lời nhắc" as Appt_Notif
}}

App_Root -down-> P_Auth
App_Root -down-> P_Home
App_Root -down-> P_Search
App_Root -down-> P_AI

App_Root -down-> P_Booking
App_Root -down-> P_Tele
App_Root -down-> P_Profile
App_Root -down-> P_Appt

Auth_Login -down-> Auth_Register
Auth_Login -down-> Auth_Forgot

Home_Main -down-> Home_Services
Home_Services -down-> Home_Shortcuts

Search_Hosp -down-> Search_Doctor
Search_Doctor -down-> Search_Filter

AI_Input -down-> AI_Analysis
AI_Analysis -down-> AI_Result

Book_Select -down-> Book_Slot
Book_Slot -down-> Book_Pay
Book_Pay -down-> Book_Ticket

Tele_List -down-> Tele_Precheck
Tele_Precheck -down-> Tele_Room
Tele_Room -down-> Tele_Chat

Prof_Family -down-> Prof_Passport
Prof_Passport -down-> Prof_History

Appt_List -down-> Appt_Detail
Appt_Detail -down-> Appt_Notif

@enduml
"""

# ==============================================================================
# SƠ ĐỒ 3: SITE MAP WEB CÔNG CỘNG VÀ NGƯỜI BỆNH
# ==============================================================================
puml_14 = f"""@startuml 14_SiteMap_Web_Public_Patient
{vp_style}
title SƠ ĐỒ SITE MAP CỔNG THÔNG TIN CÔNG CỘNG VÀ NGƯỜI BỆNH WEB (NOVACARE WEB)

rectangle "CỔNG WEB NGƯỜI DÙNG NOVACARE" as Web_Root

package "A. CỔNG THÔNG TIN CÔNG CỘNG (PUBLIC PORTAL)" as P_PublicWeb {{
    package "1. Giới thiệu & Khám phá" as Sub_Intro {{
        rectangle "Trang chủ (Home)" as Pub_Home
        rectangle "Tìm kiếm cơ sở y tế" as Pub_Hosp
        rectangle "Danh bạ bác sĩ" as Pub_Doc
        rectangle "Chuyên khoa y tế" as Pub_Spec
    }}

    package "2. Dịch vụ & Gói khám" as Sub_Services {{
        rectangle "Dịch vụ kỹ thuật y tế" as Pub_Service
        rectangle "Gói khám sức khỏe tổng quát" as Pub_Package
        rectangle "Tra cứu nhanh hồ sơ" as Pub_SearchFast
    }}

    package "3. Thông tin & Xác thực" as Sub_InfoAuth {{
        rectangle "Tin tức & Cẩm nang y khoa" as Pub_News
        rectangle "Đăng nhập & Đăng ký tài khoản" as Pub_Auth
        rectangle "Liên hệ & Hợp tác doanh nghiệp" as Pub_Contact
    }}
}}

package "B. CỔNG NGƯỜI BỆNH (PATIENT DASHBOARD)" as P_PatientWeb {{
    package "4. Quản lý Y tế Cá nhân" as Sub_Medical {{
        rectangle "Tổng quan cá nhân" as Pat_Dashboard
        rectangle "Hồ sơ sức khỏe gia đình" as Pat_Profile
        rectangle "Hộ chiếu y tế điện tử" as Pat_Passport
    }}

    package "5. Đặt lịch & Khám bệnh" as Sub_Booking {{
        rectangle "Đặt lịch khám trực tuyến" as Pat_Book
        rectangle "Quản lý lịch hẹn khám" as Pat_Appt
        rectangle "Thanh toán viện phí trực tuyến" as Pat_Payment
        rectangle "Tư vấn khám từ xa Telemedicine" as Pat_Tele
    }}

    package "6. Bệnh án & Tương tác" as Sub_Interaction {{
        rectangle "Lịch sử khám & Bệnh án EMR" as Pat_EMR
        rectangle "Đánh giá chất lượng dịch vụ" as Pat_Review
        rectangle "Thông báo & Cài đặt tài khoản" as Pat_Settings
    }}
}}

Web_Root -down-> P_PublicWeb
Web_Root -down-> P_PatientWeb

Pub_Home -down-> Pub_Hosp
Pub_Hosp -down-> Pub_Doc
Pub_Doc -down-> Pub_Spec

Pub_Service -down-> Pub_Package
Pub_Package -down-> Pub_SearchFast

Pub_News -down-> Pub_Auth
Pub_Auth -down-> Pub_Contact

Pat_Dashboard -down-> Pat_Profile
Pat_Profile -down-> Pat_Passport

Pat_Book -down-> Pat_Appt
Pat_Appt -down-> Pat_Payment
Pat_Payment -down-> Pat_Tele

Pat_EMR -down-> Pat_Review
Pat_Review -down-> Pat_Settings

@enduml
"""

# ==============================================================================
# SƠ ĐỒ 4: SITE MAP CỔNG QUẢN TRỊ CƠ SỞ Y TẾ
# ==============================================================================
puml_15 = f"""@startuml 15_SiteMap_Hospital_Admin
{vp_style}
title SƠ ĐỒ SITE MAP CỔNG QUẢN TRỊ CƠ SỞ Y TẾ (HOSPITAL ADMIN PORTAL)

rectangle "CỔNG QUẢN TRỊ CƠ SỞ Y TẾ" as Hosp_Root

package "1. Dashboard cơ sở y tế" as P_HospDash {{
    rectangle "Thống kê ca khám trong ngày" as Dash_Today
    rectangle "Doanh thu viện phí cơ sở" as Dash_Revenue
    rectangle "Tỷ lệ lấp đầy phòng khám" as Dash_Occupancy
}}

package "2. Tiếp đón & Quản lý lịch khám" as P_HospAppts {{
    rectangle "Danh sách tiếp đón trong ngày" as Appt_Queue
    rectangle "Check-in QR Code người bệnh" as Appt_Checkin
    rectangle "Điều phối trạng thái ca khám" as Appt_Status
    rectangle "In phiếu thứ tự tiếp đón" as Appt_Print
}}

package "3. Quản lý bác sĩ & Nhân sự" as P_HospDocs {{
    rectangle "Danh bạ bác sĩ bệnh viện" as Doc_List
    rectangle "Phân công phòng khám trực" as Doc_Room
    rectangle "Cấu hình biểu phí khám bệnh" as Doc_Fee
}}

package "4. Quản lý phòng khám & Lịch trực" as P_HospSched {{
    rectangle "Lịch trực tuần của bác sĩ" as Sched_Weekly
    rectangle "Sinh suất khám tự động (Slots)" as Sched_Slots
    rectangle "Quản lý báo bận & Nghỉ trực" as Sched_Exceptions
}}

package "5. Quản lý dịch vụ & Chuyên khoa" as P_HospCatalog {{
    rectangle "Danh mục dịch vụ kỹ thuật viện" as Serv_List
    rectangle "Thiết lập đơn giá & BHYT" as Serv_Price
    rectangle "Chuyên khoa tiếp nhận tại viện" as Serv_Spec
}}

package "6. Cấu hình cơ sở & Tích hợp HIS" as P_HospConfig {{
    rectangle "Thông tin cơ sở & Chi nhánh" as Conf_Info
    rectangle "Cấu hình quy định đặt hẹn" as Conf_Rules
    rectangle "Kết nối đồng bộ dữ liệu HIS" as Conf_HIS
}}

Hosp_Root -down-> P_HospDash
Hosp_Root -down-> P_HospAppts
Hosp_Root -down-> P_HospDocs
Hosp_Root -down-> P_HospSched
Hosp_Root -down-> P_HospCatalog
Hosp_Root -down-> P_HospConfig

Dash_Today -down-> Dash_Revenue
Dash_Revenue -down-> Dash_Occupancy

Appt_Queue -down-> Appt_Checkin
Appt_Checkin -down-> Appt_Status
Appt_Status -down-> Appt_Print

Doc_List -down-> Doc_Room
Doc_Room -down-> Doc_Fee

Sched_Weekly -down-> Sched_Slots
Sched_Slots -down-> Sched_Exceptions

Serv_List -down-> Serv_Price
Serv_Price -down-> Serv_Spec

Conf_Info -down-> Conf_Rules
Conf_Rules -down-> Conf_HIS

@enduml
"""

# ==============================================================================
# SƠ ĐỒ 5: SITE MAP CỔNG QUẢN TRỊ TOÀN SÀN
# ==============================================================================
puml_16 = f"""@startuml 16_SiteMap_Super_Admin
{vp_style}
title SƠ ĐỒ SITE MAP CỔNG QUẢN TRỊ HỆ THỐNG TOÀN SÀN (SUPER ADMIN PORTAL)

rectangle "CỔNG QUẢN TRỊ TOÀN SÀN NOVACARE" as Adm_Root

package "1. Dashboard & Thống kê toàn sàn" as P_AdmBI {{
    rectangle "Tổng quan vận hành toàn hệ thống" as BI_Overview
    rectangle "Phân tích chỉ số người dùng" as BI_Users
    rectangle "Báo cáo sản lượng ca khám" as BI_Appts
}}

package "2. Quản lý tài khoản & Phân quyền" as P_AdmUsers {{
    rectangle "Danh sách tài khoản người dùng" as User_List
    rectangle "Phân quyền & Vai trò (RBAC)" as User_Roles
    rectangle "Lịch sử hoạt động đăng nhập" as User_Logs
}}

package "3. Quản trị cơ sở y tế & Đối tác" as P_AdmHosps {{
    rectangle "Mạng lưới bệnh viện đối tác" as Hosp_Network
    rectangle "Xét duyệt hồ sơ đối tác mới" as Hosp_Requests
}}

package "4. Quản lý danh mục dùng chung" as P_AdmCatalogs {{
    rectangle "12 chuyên khoa chuẩn hóa" as Cat_Spec
    rectangle "Danh bạ bác sĩ toàn hệ thống" as Cat_Docs
    rectangle "Danh mục dịch vụ y tế quốc gia" as Cat_Servs
    rectangle "Gói khám sức khỏe liên viện" as Cat_Pkgs
    rectangle "Giám sát lịch trực toàn sàn" as Cat_Scheds
}}

package "5. Quản lý giao dịch & Tài chính" as P_AdmFinance {{
    rectangle "Quản lý lịch hẹn toàn sàn" as Fin_Appts
    rectangle "Cổng thanh toán & Đối soát viện phí" as Fin_Payments
    rectangle "Xử lý hoàn tiền giao dịch" as Fin_Refunds
}}

package "6. Kiểm duyệt đánh giá & Phản hồi" as P_AdmReviews {{
    rectangle "Kiểm duyệt nhận xét bệnh nhân" as Rev_Moderation
    rectangle "Xử lý báo cáo vi phạm đánh giá" as Rev_Reports
}}

package "7. Liên thông y tế & Kiểm toán" as P_AdmInterop {{
    rectangle "Cổng liên thông dữ liệu HIS/EHR" as Safe_Interop
    rectangle "Ánh xạ danh mục mã bệnh ICD-10" as Safe_Lookups
    rectangle "Nhật ký kiểm toán an ninh (Audit Logs)" as Safe_Audit
}}

Adm_Root -down-> P_AdmBI
Adm_Root -down-> P_AdmUsers
Adm_Root -down-> P_AdmHosps
Adm_Root -down-> P_AdmCatalogs
Adm_Root -down-> P_AdmFinance
Adm_Root -down-> P_AdmReviews
Adm_Root -down-> P_AdmInterop

BI_Overview -down-> BI_Users
BI_Users -down-> BI_Appts

User_List -down-> User_Roles
User_Roles -down-> User_Logs

Hosp_Network -down-> Hosp_Requests

Cat_Spec -down-> Cat_Docs
Cat_Docs -down-> Cat_Servs
Cat_Servs -down-> Cat_Pkgs
Cat_Pkgs -down-> Cat_Scheds

Fin_Appts -down-> Fin_Payments
Fin_Payments -down-> Fin_Refunds

Rev_Moderation -down-> Rev_Reports

Safe_Interop -down-> Safe_Lookups
Safe_Lookups -down-> Safe_Audit

@enduml
"""

# Write all files
files_to_write = {
    "12_SiteMap_Tong_The.puml": puml_12,
    "13_SiteMap_Mobile_App.puml": puml_13,
    "14_SiteMap_Web_Public_Patient.puml": puml_14,
    "15_SiteMap_Hospital_Admin.puml": puml_15,
    "16_SiteMap_Super_Admin.puml": puml_16,
}

for filename, content in files_to_write.items():
    filepath = os.path.join(puml_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated: {filepath}")

print("All 5 streamlined Site Map diagrams generated successfully!")

