package com.example.kltn_novacare.data.remote

import android.content.Context
import android.os.Build
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    /**
     * Tự động nhận diện thiết bị đang chạy:
     * - Máy ảo Android Emulator -> dùng 10.0.2.2 (alias trỏ về máy tính host)
     * - Điện thoại thật (Physical Device) -> dùng IP mạng Wi-Fi của máy tính (192.168.1.6)
     */
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

    private val BASE_URL: String by lazy {
        if (isEmulator()) {
            "http://10.0.2.2:3000/api/v1/"
        } else {
            // Dùng 127.0.0.1 khi cắm cáp USB (kèm adb reverse tcp:3000 tcp:3000) - miễn nhiễm với wifi quán cafe
            "http://127.0.0.1:3000/api/v1/"
            // Nếu dùng Wi-Fi (phát 4G từ điện thoại): "http://192.168.8.43:3000/api/v1/"
        }
    }
    
    private var retrofit: Retrofit? = null
    private var apiService: ApiService? = null
    private var preExamApiService: com.example.kltn_novacare.data.api.PreExamApiService? = null
    private lateinit var tokenManager: TokenManager

    fun init(context: Context) {
        tokenManager = TokenManager(context.applicationContext)
        
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
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
                            .baseUrl(BASE_URL)
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
            .addInterceptor(headerInterceptor)
            .addInterceptor(loggingInterceptor)
            .authenticator(authenticator)
            .build()

        retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
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

    fun getRealtimeBaseUrl(): String = BASE_URL.removeSuffix("api/v1/").removeSuffix("/")
}
