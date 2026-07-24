package com.example.kltn_novacare.data.remote

import android.content.Context
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
    // Standard android emulator loopback IP pointing to localhost
    private const val BASE_URL = "http://10.0.2.2:3000/api/v1/"
    
    private var retrofit: Retrofit? = null
    private var apiService: ApiService? = null
    private lateinit var tokenManager: TokenManager

    fun init(context: Context) {
        tokenManager = TokenManager(context.applicationContext)
        
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
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
    }

    fun getService(): ApiService {
        return apiService ?: throw IllegalStateException("ApiClient not initialized. Call init(context) first.")
    }

    fun getTokenManager(): TokenManager {
        return tokenManager
    }
}
