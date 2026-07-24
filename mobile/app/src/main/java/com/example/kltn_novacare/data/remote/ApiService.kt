package com.example.kltn_novacare.data.remote

import com.example.kltn_novacare.data.model.*
import retrofit2.Call
import retrofit2.http.*

interface ApiService {

    // ==========================================
    // AUTHENTICATION
    // ==========================================
    @POST("auth/login")
    fun login(@Body request: LoginRequest): Call<ApiResponse<AuthResponse>>

    @POST("auth/register")
    fun register(@Body request: RegisterRequest): Call<ApiResponse<AuthResponse>>

    @POST("auth/refresh")
    fun refreshToken(@Body body: RefreshTokenRequest): Call<ApiResponse<AuthResponse>>

    @POST("auth/logout")
    fun logout(@Body body: RefreshTokenRequest): Call<ApiResponse<Unit>>

    // ==========================================
    // SPECIALTIES & HOSPITALS
    // ==========================================
    @GET("specialties")
    fun getSpecialties(): Call<ApiResponse<List<Specialty>>>

    @GET("hospitals")
    fun getHospitals(): Call<ApiResponse<List<Hospital>>>

    // ==========================================
    // DOCTORS & WORKPLACES
    // ==========================================
    @GET("doctors")
    fun searchDoctors(
        @Query("q") query: String?,
        @Query("specialtyId") specialtyId: String?,
        @Query("hospitalId") hospitalId: String?,
        @Query("page") page: Int?,
        @Query("limit") limit: Int?
    ): Call<ApiResponse<List<Doctor>>>

    @GET("doctors/{id}")
    fun getDoctorById(@Path("id") id: String): Call<ApiResponse<Doctor>>

    @GET("doctors/{doctorId}/available-slots")
    fun getAvailableSlots(
        @Path("doctorId") doctorId: String,
        @Query("workplaceId") workplaceId: String,
        @Query("date") date: String // yyyy-MM-dd
    ): Call<ApiResponse<List<AppointmentSlot>>>

    // ==========================================
    // PATIENT PROFILES
    // ==========================================
    @GET("patient-profiles")
    fun getPatientProfiles(): Call<ApiResponse<List<PatientProfile>>>

    @GET("patient-profiles/{id}")
    fun getPatientProfileById(@Path("id") id: String): Call<ApiResponse<PatientProfile>>

    @POST("patient-profiles")
    fun createPatientProfile(@Body request: CreatePatientProfileRequest): Call<ApiResponse<PatientProfile>>

    @PUT("patient-profiles/{id}")
    fun updatePatientProfile(
        @Path("id") id: String,
        @Body request: CreatePatientProfileRequest
    ): Call<ApiResponse<PatientProfile>>

    @DELETE("patient-profiles/{id}")
    fun deletePatientProfile(@Path("id") id: String): Call<ApiResponse<Unit>>

    @PATCH("patient-profiles/{id}/default")
    fun setDefaultPatientProfile(@Path("id") id: String): Call<ApiResponse<PatientProfile>>

    // ==========================================
    // APPOINTMENTS
    // ==========================================
    @POST("appointments")
    fun createAppointment(@Body request: CreateAppointmentRequest): Call<ApiResponse<Appointment>>

    @GET("appointments/me")
    fun getAppointments(): Call<ApiResponse<List<Appointment>>>

    @GET("appointments/upcoming")
    fun getUpcomingAppointments(): Call<ApiResponse<List<Appointment>>>

    @GET("appointments/history")
    fun getAppointmentHistory(): Call<ApiResponse<List<Appointment>>>

    @GET("appointments/{id}")
    fun getAppointmentById(@Path("id") id: String): Call<ApiResponse<Appointment>>

    @PATCH("appointments/{id}/cancel")
    fun cancelAppointment(
        @Path("id") id: String,
        @Body request: CancelAppointmentRequest
    ): Call<ApiResponse<Appointment>>

    @PATCH("appointments/{id}/reschedule")
    fun rescheduleAppointment(
        @Path("id") id: String,
        @Body request: RescheduleAppointmentRequest
    ): Call<ApiResponse<Appointment>>

    // ==========================================
    // PAYMENTS
    // ==========================================
    @POST("payments/create")
    fun createPayment(@Body request: CreatePaymentRequest): Call<ApiResponse<PaymentUrlResponse>>

    @GET("payments/status/{appointmentId}")
    fun getPaymentStatus(@Path("appointmentId") appointmentId: String): Call<ApiResponse<PaymentStatusResponse>>

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    @GET("notifications")
    fun getNotifications(): Call<ApiResponse<List<Notification>>>

    @PATCH("notifications/{id}/read")
    fun markNotificationAsRead(@Path("id") id: String): Call<ApiResponse<Notification>>

    @PATCH("notifications/read-all")
    fun markAllNotificationsAsRead(): Call<ApiResponse<Unit>>

    @GET("notifications/unread-count")
    fun getUnreadNotificationsCount(): Call<ApiResponse<Int>>
}

// Request and Response Wrapper classes
data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterRequest(
    val fullName: String,
    val email: String?,
    val phone: String?,
    val password: String
)

data class RefreshTokenRequest(
    val refreshToken: String
)

data class CreatePatientProfileRequest(
    val fullName: String,
    val phone: String,
    val email: String?,
    val dateOfBirth: String,
    val gender: String,
    val identityCard: String?,
    val healthInsurance: String?,
    val address: String?,
    val relationship: String
)

data class CreateAppointmentRequest(
    val slotId: String,
    val patientProfileId: String,
    val paymentMethod: String,
    val reason: String?,
    val symptoms: String?,
    val idempotencyKey: String
)

data class CancelAppointmentRequest(
    val reason: String
)

data class RescheduleAppointmentRequest(
    val newSlotId: String
)

data class CreatePaymentRequest(
    val appointmentId: String
)

data class PaymentUrlResponse(
    val paymentUrl: String
)

data class PaymentStatusResponse(
    val paymentStatus: String, // PAID, UNPAID...
    val bookingCode: String?
)
