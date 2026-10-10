package com.example.kltn_novacare.data.remote

import com.example.kltn_novacare.data.model.*
import com.google.gson.annotations.SerializedName
import retrofit2.Call
import retrofit2.http.*
import okhttp3.MultipartBody
import okhttp3.RequestBody

interface ApiService {
    @GET("consultation-video/capabilities")
    fun videoCapabilities(): Call<ApiResponse<VideoCapabilities>>
    @POST("consultation-video/{id}/join")
    fun joinVideo(@Path("id") id: String): Call<ApiResponse<VideoJoinResult>>
    @POST("auth/forgot-password")
    fun requestPasswordOtp(@Body request: PasswordOtpRequest): Call<ApiResponse<PasswordOtpResult>>
    @POST("auth/forgot-password/verify-otp")
    fun verifyPasswordOtp(@Body request: VerifyOtpRequest): Call<ApiResponse<VerifiedOtpResult>>
    @POST("auth/reset-password")
    fun resetPassword(@Body request: PasswordResetRequest): Call<ApiResponse<Unit>>
    @POST("auth/register/request-otp")
    fun requestRegistrationOtp(@Body request: PasswordOtpRequest): Call<ApiResponse<PasswordOtpResult>>
    @POST("auth/register/verify-otp")
    fun verifyRegistrationOtp(@Body request: VerifyOtpRequest): Call<ApiResponse<VerifiedOtpResult>>
    @GET("clinic-rooms/catalog")
    fun getClinicRoomCatalog(@Query("hospitalId") hospitalId: String, @Query("mode") mode: String): Call<ApiResponse<List<ClinicRoomSession>>>
    @GET("consultations")
    fun getConsultations(
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int = 20
    ): Call<ApiResponse<ConsultationPage<Consultation>>>

    @GET("consultations/{id}")
    fun getConsultation(@Path("id") id: String): Call<ApiResponse<Consultation>>

    @POST("consultations")
    fun createConsultation(@Body request: CreateConsultationRequest): Call<ApiResponse<Consultation>>

    @PATCH("consultations/{id}/cancel")
    fun cancelConsultation(@Path("id") id: String): Call<ApiResponse<Consultation>>

    @PATCH("consultations/{id}/accept")
    fun acceptConsultation(@Path("id") id: String): Call<ApiResponse<Consultation>>

    @PATCH("consultations/{id}/start")
    fun startConsultation(@Path("id") id: String): Call<ApiResponse<Consultation>>

    @PATCH("consultations/{id}/complete")
    fun completeConsultation(@Path("id") id: String): Call<ApiResponse<Consultation>>

    @GET("consultations/{id}/messages")
    fun getConsultationMessages(
        @Path("id") id: String,
        @Query("before") before: String? = null,
        @Query("limit") limit: Int = 30
    ): Call<ApiResponse<ConsultationPage<ConsultationMessage>>>

    @POST("consultations/{id}/messages")
    fun sendConsultationMessage(
        @Path("id") id: String,
        @Body request: SendConsultationMessageRequest
    ): Call<ApiResponse<ConsultationMessage>>

    @Multipart
    @POST("consultations/{id}/attachments")
    fun sendConsultationAttachment(
        @Path("id") id: String,
        @Part file: MultipartBody.Part,
        @Part("clientMessageId") clientMessageId: RequestBody,
        @Part("caption") caption: RequestBody
    ): Call<ApiResponse<ConsultationMessage>>

    @PATCH("consultations/{id}/read")
    fun markConsultationRead(
        @Path("id") id: String,
        @Body request: ReadConsultationMessagesRequest
    ): Call<ApiResponse<ReadConsultationMessagesResult>>

    @POST("appointments/{id}/mock-fulfill")
    fun mockFulfill(@Path("id") id: String): Call<ApiResponse<com.google.gson.JsonObject>>
    @GET("integration/patients/{id}/shareable-records")
    fun shareableRecords(@Path("id") id: String, @Query("targetHospitalId") target: String): Call<ApiResponse<List<com.google.gson.JsonObject>>>
    @GET("integration/patients/{id}/consents")
    fun consents(@Path("id") id: String): Call<ApiResponse<List<com.google.gson.JsonObject>>>
    @GET("integration/patients/{id}/shared-access-logs")
    fun consentLogs(@Path("id") id: String): Call<ApiResponse<List<com.google.gson.JsonObject>>>
    @POST("integration/consents")
    fun createConsent(@Body body: com.google.gson.JsonObject): Call<ApiResponse<com.google.gson.JsonObject>>
    @PATCH("integration/consents/{id}/grant")
    fun grantConsent(@Path("id") id: String): Call<ApiResponse<com.google.gson.JsonObject>>
    @PATCH("integration/consents/{id}/revoke")
    fun revokeConsent(@Path("id") id: String): Call<ApiResponse<com.google.gson.JsonObject>>

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

    @GET("hospitals/{hospitalId}/specialties")
    fun getHospitalSpecialties(@Path("hospitalId") hospitalId: String): Call<ApiResponse<List<Specialty>>>

    @GET("hospitals/{hospitalId}/doctors")
    fun getHospitalDoctors(
        @Path("hospitalId") hospitalId: String,
        @Query("specialtyId") specialtyId: String? = null
    ): Call<ApiResponse<List<Doctor>>>

    @GET("medical-services")
    fun getMedicalServices(
        @Query("hospitalId") hospitalId: String? = null,
        @Query("specialtyId") specialtyId: String? = null,
        @Query("category") category: String? = null
    ): Call<ApiResponse<List<MedicalService>>>

    @GET("medical-services/{id}")
    fun getMedicalServiceById(@Path("id") id: String): Call<ApiResponse<MedicalService>>

    // ==========================================
    // HEALTHCARE UNIVERSAL SEARCH
    // ==========================================
    @GET("search")
    fun universalSearchGrouped(
        @Query("q") query: String?,
        @Query("category") category: String = "ALL",
        @Query("specialtyIds") specialtyIds: String? = null,
        @Query("facilityType") facilityType: String? = null,
        @Query("services") services: String? = null,
        @Query("province") province: String? = null,
        @Query("district") district: String? = null,
        @Query("lat") lat: Double? = null,
        @Query("lng") lng: Double? = null,
        @Query("sort") sort: String? = null,
        @Query("page") page: Int? = 1,
        @Query("limit") limit: Int? = 20
    ): Call<ApiResponse<UniversalSearchGroupedData>>

    @GET("search")
    fun universalSearchDoctors(
        @Query("q") query: String?,
        @Query("category") category: String = "DOCTOR",
        @Query("specialtyIds") specialtyIds: String? = null,
        @Query("facilityType") facilityType: String? = null,
        @Query("services") services: String? = null,
        @Query("province") province: String? = null,
        @Query("district") district: String? = null,
        @Query("lat") lat: Double? = null,
        @Query("lng") lng: Double? = null,
        @Query("sort") sort: String? = null,
        @Query("page") page: Int? = 1,
        @Query("limit") limit: Int? = 20
    ): Call<ApiResponse<UniversalSearchPagedData<SearchDoctorItem>>>

    @GET("search")
    fun universalSearchFacilities(
        @Query("q") query: String?,
        @Query("category") category: String, // "HOSPITAL" or "CLINIC"
        @Query("specialtyIds") specialtyIds: String? = null,
        @Query("facilityType") facilityType: String? = null,
        @Query("services") services: String? = null,
        @Query("province") province: String? = null,
        @Query("district") district: String? = null,
        @Query("lat") lat: Double? = null,
        @Query("lng") lng: Double? = null,
        @Query("sort") sort: String? = null,
        @Query("page") page: Int? = 1,
        @Query("limit") limit: Int? = 20
    ): Call<ApiResponse<UniversalSearchPagedData<SearchFacilityItem>>>

    @GET("search")
    fun universalSearchSpecialties(
        @Query("q") query: String?,
        @Query("category") category: String = "SPECIALTY",
        @Query("page") page: Int? = 1,
        @Query("limit") limit: Int? = 20
    ): Call<ApiResponse<UniversalSearchPagedData<Specialty>>>

    @GET("search/popular")
    fun getPopularSearch(): Call<ApiResponse<PopularSearchData>>

    @GET("search/locations")
    fun getSearchLocations(): Call<ApiResponse<List<LocationDivision>>>

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
        @Body request: okhttp3.RequestBody
    ): Call<ApiResponse<PatientProfile>>

    @DELETE("patient-profiles/{id}")
    fun deletePatientProfile(@Path("id") id: String): Call<ApiResponse<Unit>>

    @PATCH("patient-profiles/{id}/default")
    fun setDefaultPatientProfile(@Path("id") id: String): Call<ApiResponse<PatientProfile>>

    @GET("interoperability/portal/share-codes")
    fun getHealthShares(): Call<ApiResponse<List<HealthShare>>>

    @POST("interoperability/portal/share-codes")
    fun createHealthShare(@Body request: CreateHealthShareRequest): Call<ApiResponse<HealthShare>>

    @PATCH("interoperability/portal/share-codes/{id}/revoke")
    fun revokeHealthShare(@Path("id") id: String): Call<ApiResponse<Unit>>

    // ==========================================
    // APPOINTMENTS
    // ==========================================
    @POST("appointments")
    fun createAppointment(@Body request: CreateAppointmentRequest): Call<ApiResponse<Appointment>>

    @PATCH("appointments/{id}/confirm")
    fun confirmAppointment(@Path("id") id: String): Call<ApiResponse<Appointment>>

    @POST("payments/simulate-success")
    fun simulatePayment(@Body request: SimulatePaymentRequest): Call<ApiResponse<SimulatedPayment>>

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

data class PasswordOtpRequest(val phone: String? = null, val email: String? = null)
data class PasswordOtpResult(val maskedPhone: String?)
data class VerifyOtpRequest(val phone: String? = null, val email: String? = null, val otpCode: String)
data class VerifiedOtpResult(val verificationToken: String? = null, val resetToken: String? = null, val phone: String? = null)
data class PasswordResetRequest(val resetToken: String, val newPassword: String)

// Request and Response Wrapper classes
data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterRequest(
    val fullName: String,
    val email: String?,
    val phone: String?,
    val password: String,
    val verificationToken: String
)

data class RefreshTokenRequest(
    val refreshToken: String
)

data class CreatePatientProfileRequest(
    val fullName: String,
    val phone: String,
    val dateOfBirth: String,
    val gender: String,
    @SerializedName("identityNumber", alternate = ["identityCard"]) val identityCard: String? = null,
    val healthInsurance: String? = null,
    val address: String? = null,
    @SerializedName("relation", alternate = ["relationship"]) val relationship: String = "Bản thân",
    val medicalHistory: String? = null,
    val allergies: String? = null,
    val emergencyContact: String? = null,
    val emergencyPhone: String? = null,
    val isDefault: Boolean? = null
)

data class CreateAppointmentRequest(
    val slotId: String,
    val patientProfileId: String,
    val reason: String?,
    val symptoms: String?,
    val idempotencyKey: String,
    val medicalServiceId: String? = null,
    val clinicRoomId: String? = null,
    val serviceBookingMode: String? = null
)

data class SimulatePaymentRequest(val appointmentId: String, val paymentMethod: String)
data class SimulatedPayment(val appointmentId: String, val status: String, val bookingCode: String?, val paymentMethod: String?)

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
