package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.model.AuthResponse
import com.example.kltn_novacare.data.model.User
import com.example.kltn_novacare.data.remote.ApiClient
import com.example.kltn_novacare.data.remote.LoginRequest
import com.example.kltn_novacare.data.remote.RegisterRequest
import com.example.kltn_novacare.data.remote.RefreshTokenRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository {
    private val apiService = ApiClient.getService()
    private val tokenManager = ApiClient.getTokenManager()

    suspend fun login(email: String?, phone: String?, password: String): Result<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val username = email ?: phone ?: ""
            val response = apiService.login(LoginRequest(username, password)).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                val data = body.data!!
                tokenManager.saveTokens(data.accessToken, data.refreshToken)
                tokenManager.saveUser(data.user.id, data.user.fullName, data.user.email)
                Result.success(data)
            } else {
                val errorMsg = body?.error ?: body?.message ?: "Đăng nhập thất bại"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(fullName: String, email: String?, phone: String?, password: String): Result<AuthResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.register(RegisterRequest(fullName, email, phone, password)).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                val data = body.data!!
                tokenManager.saveTokens(data.accessToken, data.refreshToken)
                tokenManager.saveUser(data.user.id, data.user.fullName, data.user.email)
                Result.success(data)
            } else {
                val errorMsg = body?.error ?: body?.message ?: "Đăng ký thất bại"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val refreshToken = tokenManager.getRefreshToken()
            if (refreshToken != null) {
                apiService.logout(RefreshTokenRequest(refreshToken)).execute()
            }
            tokenManager.clear()
            Result.success(Unit)
        } catch (e: Exception) {
            tokenManager.clear() // Clear anyway
            Result.success(Unit)
        }
    }

    fun isLoggedIn(): Boolean {
        return tokenManager.getAccessToken() != null
    }

    fun getCurrentUser(): User? {
        val id = tokenManager.getUserId() ?: return null
        val name = tokenManager.getUserName() ?: ""
        val email = tokenManager.getUserEmail() ?: ""
        return User(id, email, null, name, "PATIENT", true)
    }
}
