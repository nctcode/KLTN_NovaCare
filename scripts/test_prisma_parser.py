import re

schema_path = 'nova-care-backend/prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    schema_text = f.read()

# Ordered list of 51 tables as requested by the user
ORDERED_51_TABLES = [
    "User",
    "RefreshToken",
    "PasswordResetChallenge",
    "RegistrationOtpChallenge",
    "DeviceToken",
    "AuditLog",
    "Notification",
    "NotificationLog",
    "PatientProfile",
    "MedicalPassport",
    "MedicalPassportShare",
    "MedicalPassportAccessLog",
    "PatientConsent",
    "PatientHospitalLink",
    "Hospital",
    "HospitalBookingConfig",
    "HospitalBranch",
    "Specialty",
    "HospitalSpecialty",
    "MedicalService",
    "ClinicRoom",
    "ClinicRoomSession",
    "HealthPackage",
    "PartnerRequest",
    "Doctor",
    "DoctorWorkplace",
    "DoctorSchedule",
    "DoctorScheduleService",
    "ScheduleException",
    "AppointmentSlot",
    "AppointmentSlotBooking",
    "Appointment",
    "AppointmentStatusHistory",
    "AppointmentContactLog",
    "PaymentTransaction",
    "PreExamSession",
    "PreExamQuestion",
    "ScreeningMedia",
    "ConsultationSession",
    "ConsultationMessage",
    "ConsultationAttachment",
    "MedicalEncounter",
    "Diagnosis",
    "Observation",
    "Prescription",
    "PrescriptionItem",
    "Review",
    "ReviewCriteriaScore",
    "ReviewResponse",
    "ReviewModerationLog",
    "ReviewReport"
]

print(f"Total tables in ordered list: {len(ORDERED_51_TABLES)}")

