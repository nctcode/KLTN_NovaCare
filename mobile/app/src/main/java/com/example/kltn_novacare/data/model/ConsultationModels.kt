package com.example.kltn_novacare.data.model

data class ConsultationDoctor(
    val id: String,
    val fullName: String,
    val title: String? = null,
    val avatarUrl: String? = null,
    val userId: String? = null
)

data class ConsultationHospital(val id: String, val name: String, val logoUrl: String? = null)
data class ConsultationSpecialty(val id: String, val name: String)
data class ConsultationWorkplace(
    val id: String,
    val hospital: ConsultationHospital,
    val specialty: ConsultationSpecialty
)

data class ConsultationAppointmentSummary(
    val id: String,
    val bookingCode: String,
    val status: String,
    val slot: AppointmentSlot? = null
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
    val doctorWorkplace: ConsultationWorkplace,
    val appointment: ConsultationAppointmentSummary? = null,
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

data class CreateConsultationRequest(
    val appointmentId: String,
    val requestMode: String = "SCHEDULED",
    val channel: String = "CHAT",
    val topic: String,
    val description: String,
    val consentAccepted: Boolean,
    val idempotencyKey: String
)

data class SendConsultationMessageRequest(val clientMessageId: String, val text: String)
data class ReadConsultationMessagesRequest(val lastReadMessageId: String)
data class ReadConsultationMessagesResult(val updatedCount: Int, val readAt: String, val lastReadMessageId: String)
