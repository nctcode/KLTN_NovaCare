import os

puml_path = r"d:\HTTT18B\KLTN\NovaCare\NovaCare_PlantUML\01_Domain_Model.puml"

content = """@startuml 01_Domain_Model
!theme plain
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam roundcorner 0
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam defaultFontColor #000000

skinparam ArrowColor #000000
skinparam ArrowFontColor #000000
skinparam ArrowThickness 1

skinparam ClassBackgroundColor #87CEEB
skinparam ClassHeaderBackgroundColor #87CEEB
skinparam ClassBorderColor #000000
skinparam ClassBorderThickness 1
skinparam ClassFontColor #000000
skinparam ClassFontSize 12
skinparam ClassFontStyle bold
skinparam ClassAttributeFontColor #000000
skinparam ClassAttributeFontSize 11
skinparam ClassAttributeFontName Arial

skinparam packageBackgroundColor #FFFFFF
skinparam packageBorderColor #000000
skinparam packageBorderThickness 1
skinparam packageFontColor #000000
skinparam packageFontSize 12
skinparam packageFontStyle bold
skinparam packageStyle rectangle

skinparam nodesep 55
skinparam ranksep 60
skinparam linetype ortho

hide circle

title SƠ ĐỒ DOMAIN MODEL TỔNG QUAN (CONCEPTUAL DOMAIN MODEL) - HỆ THỐNG Y TẾ SỐ NOVACARE

' ==============================================================================
' TẦNG 1: QUẢN TRỊ ĐỊNH DANH, CƠ SỞ Y TẾ & NHÂN LỰC
' ==============================================================================

together {
    package "1. Quản trị Tài khoản & Phân quyền" as P1 {
        class User <<Entity>> {
            +String email
            +String phone
            +Role role
            +String fullName
            +Boolean isActive
        }
    }

    package "3. Mạng lưới Y tế & Dịch vụ" as P3 {
        class Hospital <<Entity>> {
            +String name
            +String code
            +HospitalType type
            +String province
            +String hotline
            +PartnershipStatus status
        }

        class Specialty <<Entity>> {
            +String name
            +String slug
            +Boolean isActive
        }

        class ClinicRoom <<Entity>> {
            +String roomNumber
            +String roomName
            +Boolean isActive
        }

        class MedicalService <<Entity>> {
            +String serviceName
            +Decimal price
            +Boolean isActive
        }

        class HealthPackage <<Entity>> {
            +String packageName
            +Decimal price
            +Decimal discountPrice
        }
    }

    package "4. Nhân lực Y tế & Lịch trực" as P4 {
        class Doctor <<Entity>> {
            +String fullName
            +String title
            +Int experienceYears
            +Float ratingAvg
            +Int ratingCount
        }

        class DoctorWorkplace <<Association>> {
            +Decimal consultationFee
            +Boolean isActive
        }

        class AppointmentSlot <<Entity>> {
            +DateTime date
            +Time startTime
            +Time endTime
            +SlotStatus status
            +Int maxCapacity
        }
    }
}

' ==============================================================================
' TẦNG 2: HỒ SƠ NGƯỜI BỆNH, SÀNG LỌC AI & GIAO DỊCH ĐẶT LỊCH
' ==============================================================================

together {
    package "2. Quản lý Hồ sơ & Hộ chiếu Y tế" as P2 {
        class PatientProfile <<Entity>> {
            +String fullName
            +String relationship
            +DateTime dateOfBirth
            +Gender gender
            +String identityCard
            +String healthInsuranceNumber
            +Boolean isDefault
        }

        class MedicalPassport <<Entity>> {
            +String passportNumber
            +String bloodType
            +String qrCode
            +DateTime createdAt
        }
    }

    package "6. Trợ lý Sàng lọc AI Tiền khám" as P6 {
        class PreExamSession <<Entity>> {
            +String chiefComplaint
            +String bodyPart
            +Int painScale
            +TriageLevel triageLevel
            +Boolean redFlagsDetected
        }
    }

    package "5. Giao dịch Lịch hẹn & Thanh toán" as P5 {
        class Appointment <<Aggregate Root>> {
            +String appointmentCode
            +DateTime appointmentDate
            +BookingType bookingType
            +AppointmentStatus status
            +Decimal totalAmount
            +DateTime checkinAt
        }

        class PaymentTransaction <<Entity>> {
            +String txnRef
            +Decimal amount
            +PaymentMethod paymentMethod
            +PaymentStatus status
            +DateTime payDate
        }
    }
}

' ==============================================================================
' TẦNG 3: KHÁM LÂM SÀNG, BỆNH ÁN EMR & ĐÁNH GIÁ CHẤT LƯỢNG
' ==============================================================================

together {
    package "7. Khám bệnh Từ xa (Telemedicine)" as P7 {
        class ConsultationSession <<Entity>> {
            +ConsultationChannel channel
            +ConsultationStatus status
            +String livekitRoomName
            +DateTime startedAt
            +DateTime endedAt
        }
    }

    package "8. Bệnh án Lâm sàng EMR" as P8 {
        class MedicalEncounter <<Entity>> {
            +String encounterCode
            +DateTime encounterDate
            +EncounterStatus status
            +Boolean isPublished
        }

        class Prescription <<Entity>> {
            +String prescriptionCode
            +String instructions
            +DateTime revisitDate
        }
    }

    package "9. Đánh giá Chất lượng Dịch vụ" as P9 {
        class Review <<Entity>> {
            +ReviewTargetType targetType
            +Int rating
            +String comment
            +ReviewStatus status
        }
    }
}

' ── CÂN BẰNG BỐ CỤC 3 TẦNG BẰNG LIÊN KẾT ẨN (HIDDEN LINKS) ──
P1 -[hidden]down-> P2
P3 -[hidden]down-> P6
P4 -[hidden]down-> P5
P2 -[hidden]down-> P7
P6 -[hidden]down-> P8
P5 -[hidden]down-> P9

' ── NỘI BỘ PHÂN HỆ 3 (CƠ SỞ Y TẾ) ──
Hospital "1" *-down-> "1..*" ClinicRoom : "có phòng khám"
Hospital "1" *-down-> "0..*" MedicalService : "cung cấp"
Hospital "1" *-down-> "0..*" HealthPackage : "mở gói khám"
Hospital "1..*" -right-> "1..*" Specialty : "tiếp nhận"

' ── NỘI BỘ PHÂN HỆ 4 (BÁC SĨ & NƠI LÀM VIỆC) ──
Doctor "0..*" -left-> "1" Specialty : "chuyên khoa"
Doctor "1..*" -- "1..*" Hospital : "công tác tại"
(Doctor, Hospital) .. DoctorWorkplace
DoctorWorkplace "1" *-down-> "0..*" AppointmentSlot : "mở ca trực"

' ── LIÊN KẾT TẦNG 1 XUỐNG TẦNG 2 (ĐỊNH DANH -> HỒ SƠ & LỊCH HẸN) ──
User "1" *-down-> "0..*" PatientProfile : "quản lý hồ sơ"
User "1" o-right-> "0..1" Doctor : "tài khoản bác sĩ"
User "1" o-right-> "0..1" Hospital : "quản trị cơ sở"

PatientProfile "1" *-right-> "1" MedicalPassport : "sở hữu sổ y bạ"
PatientProfile "1" -right-> "0..*" PreExamSession : "sàng lọc AI"
PreExamSession "0..1" .right.> "0..1" Appointment : "gợi ý chuyên khoa"

PatientProfile "1" -down-> "0..*" Appointment : "người đi khám"
Hospital "1" -down-> "0..*" Appointment : "nơi khám"
Doctor "1" -down-> "0..*" Appointment : "chủ trì khám"
AppointmentSlot "1" <-down- "0..1" Appointment : "giữ chỗ ca khám"

Appointment "1" *-right-> "0..1" PaymentTransaction : "thanh toán viện phí"

' ── LIÊN KẾT TẦNG 2 XUỐNG TẦNG 3 (LỊCH HẸN -> KHÁM, BỆNH ÁN & ĐÁNH GIÁ) ──
Appointment "1" *-down-> "0..1" ConsultationSession : "kích hoạt khám online"
Appointment "1" *-down-> "0..1" MedicalEncounter : "lập bệnh án"
Appointment "1" *-down-> "0..1" Review : "đánh giá dịch vụ"

' ── NỘI BỘ TẦNG 3 (BỆNH ÁN & ĐƠN THUỐC) ──
Doctor "1" -down-> "0..*" MedicalEncounter : "điều trị"
Doctor "1" -down-> "0..*" Review : "đối tượng đánh giá"
MedicalEncounter "1" *-right-> "0..1" Prescription : "kê đơn thuốc"
MedicalEncounter "0..*" .up.> "1" MedicalPassport : "ghi sổ sức khỏe"

@enduml
"""

with open(puml_path, "w", encoding="utf-8") as fp:
    fp.write(content)

print("Updated 01_Domain_Model.puml successfully!")

