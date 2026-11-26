package com.novacare.doctor.data

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import okhttp3.Authenticator
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Multipart
import retrofit2.http.Part
import okhttp3.MultipartBody
import okhttp3.RequestBody
import java.util.concurrent.TimeUnit

interface DoctorApi {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): retrofit2.Response<ApiResponse<AuthData>>

    @POST("auth/refresh")
    fun refresh(@Body request: RefreshTokenRequest): Call<ApiResponse<AuthData>>

    @POST("auth/logout")
    suspend fun logout(@Body request: RefreshTokenRequest): retrofit2.Response<ApiResponse<Unit>>

    @GET("doctor-portal/dashboard")
    suspend fun dashboard(): retrofit2.Response<ApiResponse<DoctorDashboard>>

    @GET("doctor-portal/me")
    suspend fun profile(): retrofit2.Response<ApiResponse<DoctorProfile>>

    @PATCH("doctor-portal/me")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): retrofit2.Response<ApiResponse<DoctorProfile>>

    @GET("doctor-portal/schedules")
    suspend fun schedules(
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): retrofit2.Response<ApiResponse<ScheduleResponse>>

    @GET("doctor-portal/appointments")
    suspend fun appointments(
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String,
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 100
    ): retrofit2.Response<ApiResponse<AppointmentsResponse>>

    @GET("doctor-portal/appointments/{id}")
    suspend fun appointment(@Path("id") id: String): retrofit2.Response<ApiResponse<DoctorAppointment>>

    @GET("appointments/{id}/screening")
    suspend fun screening(@Path("id") id: String): retrofit2.Response<ApiResponse<AppointmentScreening>>

    @GET("doctor-portal/appointments/{id}/shared-records")
    suspend fun sharedRecords(@Path("id") id: String): retrofit2.Response<ApiResponse<List<SharedRecord>>>

    @GET("notifications")
    suspend fun notifications(): retrofit2.Response<ApiResponse<List<DoctorNotification>>>

    @PATCH("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String): retrofit2.Response<ApiResponse<DoctorNotification>>

    @PATCH("notifications/read-all")
    suspend fun markAllNotificationsRead(): retrofit2.Response<ApiResponse<Unit>>

    @GET("consultations")
    suspend fun consultations(
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int = 50
    ): retrofit2.Response<ApiResponse<ConsultationPage<Consultation>>>

    @GET("consultations/{id}")
    suspend fun consultation(@Path("id") id: String): retrofit2.Response<ApiResponse<Consultation>>

    @PATCH("consultations/{id}/accept")
    suspend fun acceptConsultation(@Path("id") id: String): retrofit2.Response<ApiResponse<Consultation>>

    @PATCH("consultations/{id}/start")
    suspend fun startConsultation(@Path("id") id: String): retrofit2.Response<ApiResponse<Consultation>>

    @PATCH("consultations/{id}/complete")
    suspend fun completeConsultation(@Path("id") id: String): retrofit2.Response<ApiResponse<Consultation>>

    @GET("consultations/{id}/messages")
    suspend fun consultationMessages(
        @Path("id") id: String,
        @Query("before") before: String? = null,
        @Query("limit") limit: Int = 50
    ): retrofit2.Response<ApiResponse<ConsultationPage<ConsultationMessage>>>

    @POST("consultations/{id}/messages")
    suspend fun sendConsultationMessage(
        @Path("id") id: String,
        @Body request: SendConsultationMessageRequest
    ): retrofit2.Response<ApiResponse<ConsultationMessage>>

    @Multipart
    @POST("consultations/{id}/attachments")
    suspend fun sendConsultationAttachment(
        @Path("id") id: String,
        @Part file: MultipartBody.Part,
        @Part("clientMessageId") clientMessageId: RequestBody,
        @Part("caption") caption: RequestBody
    ): retrofit2.Response<ApiResponse<ConsultationMessage>>

    @PATCH("consultations/{id}/read")
    suspend fun markConsultationRead(
        @Path("id") id: String,
        @Body request: ReadConsultationMessagesRequest
    ): retrofit2.Response<ApiResponse<ReadConsultationMessagesResult>>

    @GET("consultation-video/capabilities")
    suspend fun videoCapabilities(): retrofit2.Response<ApiResponse<VideoCapabilities>>

    @POST("consultation-video/{id}/join")
    suspend fun joinVideo(@Path("id") id: String): retrofit2.Response<ApiResponse<VideoJoinResult>>
}

class DoctorSession(context: Context) {
    private val preferences = context.getSharedPreferences("novacare_doctor_session", Context.MODE_PRIVATE)

    fun accessToken(): String? = preferences.getString("access_token", null)
    fun refreshToken(): String? = preferences.getString("refresh_token", null)
    fun role(): String? = preferences.getString("role", null)
    fun userName(): String? = preferences.getString("user_name", null)
    fun userId(): String? = preferences.getString("user_id", null)
    fun isDoctorLoggedIn(): Boolean = !accessToken().isNullOrBlank() && role() == "DOCTOR"

    fun save(auth: AuthData) {
        preferences.edit()
            .putString("access_token", auth.accessToken)
            .putString("refresh_token", auth.refreshToken)
            .putString("role", auth.user.role)
            .putString("user_id", auth.user.id)
            .putString("user_name", auth.user.fullName)
            .apply()
    }

    fun saveTokens(accessToken: String, refreshToken: String) {
        preferences.edit().putString("access_token", accessToken).putString("refresh_token", refreshToken).apply()
    }

    fun clear() = preferences.edit().clear().apply()
}

enum class DoctorServerMode(val label: String) {
    PRODUCTION("Server AWS"),
    LOCAL_USB("Cáp USB (Local)")
}

object DoctorApiClient {
    private const val PRODUCTION_BASE_URL = "https://novacare-health.me/api/v1/"
    private const val LOCAL_EMULATOR_BASE_URL = "http://10.0.2.2:3000/api/v1/"
    private const val LOCAL_USB_BASE_URL = "http://127.0.0.1:3000/api/v1/"
    private const val PREFS_NAME = "novacare_doctor_server_prefs"
    private const val KEY_SERVER_MODE = "server_mode"

    @Volatile
    private var currentMode: DoctorServerMode = DoctorServerMode.PRODUCTION
    private var serverPrefs: SharedPreferences? = null
    private lateinit var session: DoctorSession
    private lateinit var service: DoctorApi

    fun getServerMode(): DoctorServerMode = currentMode

    fun setServerMode(mode: DoctorServerMode) {
        if (currentMode != mode) {
            currentMode = mode
            serverPrefs?.edit()?.putString(KEY_SERVER_MODE, mode.name)?.apply()
            if (serverPrefs != null) {
                session().clear()
            }
        }
    }

    fun init(context: Context) {
        val appContext = context.applicationContext
        session = DoctorSession(appContext)
        serverPrefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedMode = serverPrefs?.getString(KEY_SERVER_MODE, DoctorServerMode.PRODUCTION.name)
        currentMode = runCatching { DoctorServerMode.valueOf(savedMode ?: DoctorServerMode.PRODUCTION.name) }
            .getOrDefault(DoctorServerMode.PRODUCTION)

        val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
        val dynamicBaseUrl = Interceptor { chain ->
            val original = chain.request()
            val targetBase = baseUrl().toHttpUrl()
            val updatedUrl = original.url.newBuilder()
                .scheme(targetBase.scheme)
                .host(targetBase.host)
                .port(targetBase.port)
                .build()
            chain.proceed(original.newBuilder().url(updatedUrl).build())
        }
        val authHeader = Interceptor { chain ->
            val builder = chain.request().newBuilder()
            session.accessToken()?.let { builder.header("Authorization", "Bearer $it") }
            chain.proceed(builder.build())
        }
        val authenticator = object : Authenticator {
            override fun authenticate(route: Route?, response: Response): Request? {
                if (response.responseCount >= 2) return null
                val refreshToken = session.refreshToken() ?: return null
                synchronized(this) {
                    val current = session.accessToken()
                    if (response.request.header("Authorization") != "Bearer $current") {
                        return response.request.newBuilder().header("Authorization", "Bearer $current").build()
                    }
                    return try {
                        val refreshApi = Retrofit.Builder()
                            .baseUrl(baseUrl())
                            .client(OkHttpClient.Builder().addInterceptor(logging).build())
                            .addConverterFactory(GsonConverterFactory.create())
                            .build().create(DoctorApi::class.java)
                        val auth = refreshApi.refresh(RefreshTokenRequest(refreshToken)).execute().body()?.data
                        if (auth != null && auth.user.role == "DOCTOR") {
                            session.saveTokens(auth.accessToken, auth.refreshToken)
                            response.request.newBuilder().header("Authorization", "Bearer ${auth.accessToken}").build()
                        } else {
                            session.clear()
                            null
                        }
                    } catch (_: Exception) {
                        session.clear()
                        null
                    }
                }
            }
        }
        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(dynamicBaseUrl)
            .addInterceptor(authHeader)
            .addInterceptor(logging)
            .authenticator(authenticator)
            .build()
        service = Retrofit.Builder().baseUrl(PRODUCTION_BASE_URL).client(client)
            .addConverterFactory(GsonConverterFactory.create()).build().create(DoctorApi::class.java)
    }

    fun api(): DoctorApi = service
    fun session(): DoctorSession = session

    fun getBaseUrl(): String = baseUrl()
    fun serverBaseUrl(): String = baseUrl().removeSuffix("api/v1/").removeSuffix("/")
    fun attachmentUrl(consultationId: String, attachmentId: String): String =
        "${baseUrl()}consultations/$consultationId/attachments/$attachmentId"

    private fun baseUrl(): String = when (currentMode) {
        DoctorServerMode.PRODUCTION -> PRODUCTION_BASE_URL
        DoctorServerMode.LOCAL_USB -> if (isEmulator()) LOCAL_EMULATOR_BASE_URL else LOCAL_USB_BASE_URL
    }

    private fun isEmulator(): Boolean = Build.FINGERPRINT.startsWith("generic") ||
        Build.MODEL.contains("Emulator") || Build.MODEL.contains("Android SDK built for x86") ||
        Build.PRODUCT.contains("sdk_gphone") || Build.HARDWARE.contains("goldfish") || Build.HARDWARE.contains("ranchu")

    private val Response.responseCount: Int
        get() {
            var count = 1
            var prior = priorResponse
            while (prior != null) { count++; prior = prior.priorResponse }
            return count
        }
}

class DoctorRepository(
    private val api: DoctorApi = DoctorApiClient.api(),
    private val session: DoctorSession = DoctorApiClient.session()
) {
    suspend fun login(username: String, password: String): Result<AuthData> = runCatching {
        val auth = api.login(LoginRequest(username.trim(), password)).requireData()
        if (auth.user.role != "DOCTOR") throw IllegalAccessException("Tài khoản này không thuộc vai trò Bác sĩ")
        session.save(auth)
        auth
    }

    suspend fun logout() {
        val refresh = session.refreshToken()
        try { if (refresh != null) api.logout(RefreshTokenRequest(refresh)) } finally { session.clear() }
    }

    fun isLoggedIn(): Boolean = session.isDoctorLoggedIn()
    suspend fun dashboard() = runCatching { api.dashboard().requireData() }
    suspend fun profile() = runCatching { api.profile().requireData() }
    suspend fun updateProfile(request: UpdateProfileRequest) = runCatching { api.updateProfile(request).requireData() }
    suspend fun schedules(start: String, end: String) = runCatching { api.schedules(start, end).requireData() }
    suspend fun appointments(start: String, end: String, status: String?) = runCatching { api.appointments(start, end, status).requireData() }
    suspend fun appointment(id: String) = runCatching { api.appointment(id).requireData() }
    suspend fun screening(id: String) = runCatching { api.screening(id).requireData() }
    suspend fun sharedRecords(id: String) = runCatching { api.sharedRecords(id).requireData() }
    suspend fun notifications() = runCatching { api.notifications().requireData() }
    suspend fun markRead(id: String) = runCatching { api.markNotificationRead(id).requireData() }
    suspend fun markAllRead() = runCatching { api.markAllNotificationsRead().requireSuccess() }

    private fun <T> retrofit2.Response<ApiResponse<T>>.requireData(): T {
        val body = body()
        if (!isSuccessful || body == null || (body.success != true && body.statusCode !in 200..299) || body.data == null) {
            throw IllegalStateException(body?.message ?: body?.error ?: "Yêu cầu thất bại (${code()})")
        }
        return body.data
    }

    private fun retrofit2.Response<ApiResponse<Unit>>.requireSuccess() {
        val body = body()
        if (!isSuccessful || (body?.success != true && body?.statusCode !in 200..299)) {
            throw IllegalStateException(body?.message ?: body?.error ?: "Yêu cầu thất bại (${code()})")
        }
    }
}
