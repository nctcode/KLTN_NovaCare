package com.novacare.doctor.data

import com.google.gson.JsonElement

data class ApiResponse<T>(
    val success: Boolean = false,
    val statusCode: Int? = null,
    val data: T? = null,
    val message: String? = null,
    val error: String? = null
)

data class LoginRequest(val username: String, val password: String)
data class RefreshTokenRequest(val refreshToken: String)
data class DoctorUser(
    val id: String,
    val fullName: String,
    val email: String? = null,
    val phone: String? = null,
    val role: String,
    val avatarUrl: String? = null
)
data class AuthData(
    val user: DoctorUser,
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long = 0
)

data class Hospital(val id: String, val name: String, val address: String? = null)
data class HospitalBranch(val id: String, val name: String, val address: String? = null)
data class Specialty(val id: String, val name: String)
data class MedicalService(val id: String, val name: String)

data class DoctorWorkplace(
    val id: String,
    val isPrimary: Boolean = false,
    val position: String? = null,
    val hospital: Hospital,
    val branch: HospitalBranch? = null,
    val specialty: Specialty
)

data class DoctorProfile(
    val id: String,
    val fullName: String,
    val title: String? = null,
    val qualification: String = "",
    val yearsOfExperience: Int = 0,
    val avatarUrl: String? = null,
    val bio: String? = null,
    val user: DoctorUser,
    val workPlaces: List<DoctorWorkplace> = emptyList()
)

data class DashboardStats(
    val totalToday: Int = 0,
    val upcomingToday: Int = 0,
    val completedToday: Int = 0,
    val slotsToday: Int = 0,
    val unreadNotifications: Int = 0
)
data class DoctorDashboard(
    val date: String,
    val doctor: DoctorProfile,
    val stats: DashboardStats,
    val nextAppointments: List<DoctorAppointment> = emptyList()
)

data class ClinicRoom(val id: String, val code: String, val name: String)
data class RoomSession(val mode: String? = null, val room: ClinicRoom, val service: MedicalService? = null)
data class DoctorSchedule(
    val id: String,
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val breakStart: String? = null,
    val breakEnd: String? = null,
    val doctorWorkplace: DoctorWorkplace
)
data class DoctorSlot(
    val id: String,
    val startTime: String,
    val endTime: String,
    val capacity: Int = 1,
    val bookedCount: Int = 0,
    val status: String? = null,
    val doctorWorkplace: DoctorWorkplace,
    val roomSession: RoomSession? = null
)
data class ScheduleResponse(
    val startDate: String,
    val endDate: String,
    val workplaces: List<DoctorWorkplace> = emptyList(),
    val recurringSchedules: List<DoctorSchedule> = emptyList(),
    val slots: List<DoctorSlot> = emptyList()
)

data class PatientProfile(
    val id: String,
    val fullName: String,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val address: String? = null
)
data class ScreeningSummary(val id: String, val status: String? = null)
data class ConsultationSummary(val id: String, val channel: String? = null, val status: String? = null)
data class DoctorAppointment(
    val id: String,
    val bookingCode: String,
    val status: String,
    val reason: String? = null,
    val symptoms: String? = null,
    val serviceBookingMode: String? = null,
    val consultation: ConsultationSummary? = null,
    val patientProfile: PatientProfile,
    val medicalService: MedicalService? = null,
    val preExamSession: ScreeningSummary? = null,
    val slot: DoctorSlot
) {
    val appointmentTypeLabel: String
        get() = when {
            serviceBookingMode == "ONLINE" || consultation != null -> "Tư vấn video trực tuyến"
            serviceBookingMode == "AFTER_HOURS" -> "Khám ngoài giờ"
            serviceBookingMode == "SERVICE" || medicalService != null -> medicalService?.name ?: "Khám dịch vụ"
            else -> "Khám theo bác sĩ"
        }
}
data class AppointmentsResponse(
    val items: List<DoctorAppointment> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 20,
    val totalPages: Int = 0
)
data class ScreeningMediaItem(
    val id: String,
    val type: String? = null,
    val mimeType: String? = null,
    val sizeBytes: Int? = null,
    val fileUrl: String? = null
)
data class AppointmentScreening(
    val id: String,
    val status: String,
    val source: String? = null,
    val completedAt: String? = null,
    val symptoms: String? = null,
    val riskLevel: String? = null,
    val recommendations: JsonElement? = null,
    val voiceTranscript: String? = null,
    val bodyDiagramData: JsonElement? = null,
    val structuredData: JsonElement? = null,
    val imageAnalysis: JsonElement? = null,
    val questions: List<ScreeningQuestion>? = emptyList(),
    val media: List<ScreeningMediaItem>? = emptyList()
)
data class ScreeningQuestion(val id: String, val question: String, val answer: String? = null, val order: Int = 0)
data class SharedDiagnosis(val diseaseName: String? = null, val icdCode: String? = null)
data class SharedObservation(val name: String? = null, val value: String? = null, val unit: String? = null)
data class SharedPrescriptionItem(val drugName: String? = null, val dosage: String? = null, val usageInstruction: String? = null, val duration: String? = null)
data class SharedPrescription(val note: String? = null, val items: List<SharedPrescriptionItem>? = emptyList())
data class SharedRecord(
    val id: String, val encounterDate: String, val hospitalName: String, val specialtyName: String,
    val doctorName: String, val chiefComplaint: String? = null, val clinicalSummary: String? = null,
    val treatmentPlan: String? = null, val conclusion: String? = null,
    val initialDiagnosis: String? = null, val diagnoses: List<SharedDiagnosis>? = emptyList(),
    val observations: List<SharedObservation>? = emptyList(), val prescription: SharedPrescription? = null
)
data class DoctorNotification(
    val id: String,
    val title: String,
    val content: String,
    val type: String? = null,
    val data: JsonElement? = null,
    val isRead: Boolean = false,
    val createdAt: String
)
data class UpdateProfileRequest(val fullName: String, val avatarUrl: String?, val bio: String?)

data class VideoCapabilities(val videoEnabled: Boolean = false)
data class VideoJoinResult(
    val serverUrl: String,
    val participantToken: String,
    val roomName: String,
    val consultationId: String,
    val endsAt: String
)

data class ConsultationDoctor(
    val id: String,
    val fullName: String,
    val title: String? = null,
    val avatarUrl: String? = null,
    val userId: String? = null
)

data class ConsultationAppointment(
    val id: String,
    val bookingCode: String,
    val status: String
)

data class Consultation(
    val id: String,
    val patientProfileId: String,
    val doctorId: String,
    val doctorWorkplaceId: String,
    val specialtyId: String,
    val appointmentId: String? = null,
    val status: String,
    val requestMode: String,
    val channel: String,
    val topic: String,
    val description: String,
    val scheduledStartAt: String? = null,
    val scheduledEndAt: String? = null,
    val chatOpenAt: String? = null,
    val acceptedAt: String? = null,
    val startedAt: String? = null,
    val completedAt: String? = null,
    val videoEnabled: Boolean = false,
    val patientProfile: PatientProfile,
    val doctor: ConsultationDoctor,
    val doctorWorkplace: DoctorWorkplace,
    val appointment: ConsultationAppointment? = null,
    val messages: List<ConsultationMessage> = emptyList(),
    val unreadCount: Int = 0,
    val updatedAt: String? = null
)

data class ConsultationMessage(
    val id: String,
    val consultationId: String,
    val senderUserId: String,
    val senderType: String,
    val messageType: String,
    val clientMessageId: String,
    val text: String? = null,
    val sentAt: String,
    val deliveredAt: String? = null,
    val readAt: String? = null,
    val attachments: List<ConsultationAttachment> = emptyList(),
    val localDeliveryStatus: String? = null
)

data class ConsultationAttachment(
    val id: String,
    val type: String,
    val fileName: String,
    val mimeType: String,
    val sizeBytes: Int,
    val status: String,
    val localUri: String? = null
)

data class ConsultationPage<T>(
    val items: List<T> = emptyList(),
    val nextCursor: String? = null
)

data class SendConsultationMessageRequest(val clientMessageId: String, val text: String)
data class ReadConsultationMessagesRequest(val lastReadMessageId: String)
data class ReadConsultationMessagesResult(
    val updatedCount: Int,
    val readAt: String,
    val lastReadMessageId: String
)
