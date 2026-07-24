package com.example.kltn_novacare.data.model

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val email: String,
    val phone: String?,
    val fullName: String,
    val role: String,
    val isActive: Boolean
)

data class AuthResponse(
    val user: User,
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long
)

data class PatientProfile(
    val id: String,
    val userId: String,
    val fullName: String,
    val phone: String,
    val email: String?,
    val dateOfBirth: String, // yyyy-MM-dd
    val gender: String,      // NAM, NU, KHAC
    val identityCard: String?,
    val healthInsurance: String?,
    val address: String?,
    val relationship: String, // BAN_THAN, CHA_ME, VO_CHONG, CON_CAI, HO_HANG, KHAC
    val isDefault: Boolean = false
)

data class Hospital(
    val id: String,
    val name: String,
    val address: String,
    val province: String,
    val district: String,
    val description: String?,
    val image: String?,
    val logo: String?
)

data class Specialty(
    val id: String,
    val name: String,
    val description: String?,
    val image: String?
)

data class Doctor(
    val id: String,
    val fullName: String,
    val title: String, // Thạc sĩ, Bác sĩ CKI...
    val avatar: String?,
    val description: String?,
    val experience: String?,
    val bio: String?,
    val rating: Double,
    val reviewCount: Int,
    val specialties: List<Specialty>? = null,
    val hospital: Hospital? = null
)

data class DoctorWorkplace(
    val id: String,
    val doctorId: String,
    val hospitalId: String,
    val specialtyId: String,
    val price: Double,
    val hospital: Hospital?,
    val specialty: Specialty?
)

data class AppointmentSlot(
    val id: String,
    val workplaceId: String,
    val startTime: String, // ISO String or HH:mm
    val endTime: String,
    val capacity: Int,
    val bookedCount: Int,
    val price: Double,
    val version: Int
)

data class AppointmentStatusHistory(
    val id: String,
    val appointmentId: String,
    val status: String,
    val note: String?,
    val colorHex: String?,
    val createdAt: String
)

data class Appointment(
    val id: String,
    val userId: String,
    val patientProfileId: String,
    val slotId: String,
    val bookingCode: String,
    val status: String, // PENDING, CONFIRMED, PAID...
    val paymentStatus: String, // UNPAID, PAID, REFUNDED...
    val paymentMethod: String, // VNPAY, CASH...
    val reason: String?,
    val symptoms: String?,
    val notes: String?,
    val totalAmount: Double,
    val createdAt: String,
    val slot: AppointmentSlot?,
    val patientProfile: PatientProfile?,
    val workplace: DoctorWorkplace?,
    val statusHistory: List<AppointmentStatusHistory>? = null
)

data class Notification(
    val id: String,
    val userId: String,
    val title: String,
    val content: String,
    val type: String,
    val isRead: Boolean,
    val createdAt: String
)

// Base API wrapper structures
data class ApiResponse<T>(
    val statusCode: Int?,
    val message: String?,
    val data: T?,
    val error: String?
) {
    val success: Boolean
        get() = statusCode == null || statusCode in 200..299
}
