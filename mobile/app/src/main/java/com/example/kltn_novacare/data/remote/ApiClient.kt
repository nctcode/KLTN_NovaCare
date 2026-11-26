package com.example.kltn_novacare.data.remote

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
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

enum class ServerMode(val label: String) {
    PRODUCTION("Server AWS"),
    LOCAL_USB("Cáp USB (Local)")
}

object ApiClient {
    /**
     * Hỗ trợ song song cả 2 chế độ kết nối (chuyển đổi trực tiếp ngay tại màn hình Đăng nhập):
     * 1. ServerMode.PRODUCTION (Mặc định): Kết nối thẳng tới server AWS Production (https://novacare-health.me/api/v1/)
     * 2. ServerMode.LOCAL_USB: Kết nối qua cáp USB (127.0.0.1:3000 kèm adb reverse) hoặc Emulator (10.0.2.2:3000)
     */
    private const val PRODUCTION_BASE_URL = "https://novacare-health.me/api/v1/"
    private const val LOCAL_EMULATOR_BASE_URL = "http://10.0.2.2:3000/api/v1/"
    private const val LOCAL_USB_BASE_URL = "http://127.0.0.1:3000/api/v1/"
    private const val PREFS_NAME = "novacare_server_prefs"
    private const val KEY_SERVER_MODE = "server_mode"

    private fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.PRODUCT.contains("sdk_gphone")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu"))
    }

    @Volatile
    private var currentMode: ServerMode = ServerMode.PRODUCTION
    private var serverPrefs: SharedPreferences? = null

    fun getServerMode(): ServerMode = currentMode

    fun setServerMode(mode: ServerMode) {
        if (currentMode != mode) {
            currentMode = mode
            serverPrefs?.edit()?.putString(KEY_SERVER_MODE, mode.name)?.apply()
            if (::tokenManager.isInitialized) {
                tokenManager.clear()
            }
        }
    }

    fun getBaseUrl(): String = when (currentMode) {
        ServerMode.PRODUCTION -> PRODUCTION_BASE_URL
        ServerMode.LOCAL_USB -> if (isEmulator()) LOCAL_EMULATOR_BASE_URL else LOCAL_USB_BASE_URL
    }

    private var retrofit: Retrofit? = null
    private var apiService: ApiService? = null
    private var preExamApiService: com.example.kltn_novacare.data.api.PreExamApiService? = null
    private lateinit var tokenManager: TokenManager

    fun init(context: Context) {
        val appContext = context.applicationContext
        tokenManager = TokenManager(appContext)
        serverPrefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedMode = serverPrefs?.getString(KEY_SERVER_MODE, ServerMode.PRODUCTION.name)
        currentMode = runCatching { ServerMode.valueOf(savedMode ?: ServerMode.PRODUCTION.name) }
            .getOrDefault(ServerMode.PRODUCTION)

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }

        // Dynamic Base URL Interceptor: tự động đổi host giữa Server Production và Local USB không cần restart app
        val dynamicBaseUrlInterceptor = Interceptor { chain ->
            val original = chain.request()
            val targetBase = getBaseUrl().toHttpUrl()
            val updatedUrl = original.url.newBuilder()
                .scheme(targetBase.scheme)
                .host(targetBase.host)
                .port(targetBase.port)
                .build()
            chain.proceed(original.newBuilder().url(updatedUrl).build())
        }

        // Header Interceptor to attach Access Token
        val headerInterceptor = Interceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
            
            tokenManager.getAccessToken()?.let { token ->
                requestBuilder.header("Authorization", "Bearer $token")
            }
            
            chain.proceed(requestBuilder.build())
        }

        // Authenticator to automatically handle 401 and refresh token
        val authenticator = object : Authenticator {
            override fun authenticate(route: Route?, response: Response): Request? {
                // Prevent infinite loop if refreshing fails
                if (response.priorResponse?.request?.url?.encodedPath?.contains("auth/refresh") == true) {
                    return null
                }

                val refreshToken = tokenManager.getRefreshToken() ?: return null

                synchronized(this) {
                    val currentAccessToken = tokenManager.getAccessToken()
                    val requestToken = response.request.header("Authorization")
                    
                    // If the token was already refreshed by another concurrent thread, retry with it
                    if (requestToken != "Bearer $currentAccessToken") {
                        return response.request.newBuilder()
                            .header("Authorization", "Bearer $currentAccessToken")
                            .build()
                    }

                    // Call refresh API synchronously
                    try {
                        val refreshClient = OkHttpClient.Builder()
                            .addInterceptor(loggingInterceptor)
                            .build()
                        
                        val refreshRetrofit = Retrofit.Builder()
                            .baseUrl(getBaseUrl())
                            .client(refreshClient)
                            .addConverterFactory(GsonConverterFactory.create())
                            .build()
                        
                        val refreshService = refreshRetrofit.create(ApiService::class.java)
                        val callResponse = refreshService.refreshToken(RefreshTokenRequest(refreshToken)).execute()
                        
                        if (callResponse.isSuccessful) {
                            val authData = callResponse.body()?.data
                            if (authData != null) {
                                tokenManager.saveTokens(authData.accessToken, authData.refreshToken)
                                return response.request.newBuilder()
                                    .header("Authorization", "Bearer ${authData.accessToken}")
                                    .build()
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    
                    // Clear tokens and let request fail (force user logout in UI)
                    tokenManager.clear()
                    return null
                }
            }
        }

        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(dynamicBaseUrlInterceptor)
            .addInterceptor(headerInterceptor)
            .addInterceptor(loggingInterceptor)
            .authenticator(authenticator)
            .build()

        retrofit = Retrofit.Builder()
            .baseUrl(PRODUCTION_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit?.create(ApiService::class.java)
        preExamApiService = retrofit?.newBuilder()?.client(okHttpClient.newBuilder()
            .readTimeout(150, TimeUnit.SECONDS).callTimeout(180, TimeUnit.SECONDS).build())?.build()
            ?.create(com.example.kltn_novacare.data.api.PreExamApiService::class.java)
    }

    fun getService(): ApiService {
        return apiService ?: throw IllegalStateException("ApiClient not initialized. Call init(context) first.")
    }

    fun getPreExamApiService(): com.example.kltn_novacare.data.api.PreExamApiService {
        return preExamApiService ?: retrofit?.create(com.example.kltn_novacare.data.api.PreExamApiService::class.java)
            ?: throw IllegalStateException("ApiClient not initialized. Call init(context) first.")
    }

    fun getTokenManager(): TokenManager {
        return tokenManager
    }

    fun getRealtimeBaseUrl(): String = getBaseUrl().removeSuffix("api/v1/").removeSuffix("/")
}
