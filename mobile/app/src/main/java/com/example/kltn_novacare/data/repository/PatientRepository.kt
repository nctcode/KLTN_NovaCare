package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.model.PatientProfile
import com.example.kltn_novacare.data.remote.ApiClient
import com.example.kltn_novacare.data.remote.CreatePatientProfileRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PatientRepository {
    private val apiService = ApiClient.getService()

    suspend fun getPatientProfiles(): Result<List<PatientProfile>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPatientProfiles().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tải hồ sơ"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPatientProfileById(id: String): Result<PatientProfile> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPatientProfileById(id).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không tìm thấy hồ sơ"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPatientProfile(request: CreatePatientProfileRequest): Result<PatientProfile> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createPatientProfile(request).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Tạo hồ sơ thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updatePatientProfile(id: String, request: CreatePatientProfileRequest): Result<PatientProfile> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.updatePatientProfile(id, request).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Cập nhật hồ sơ thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deletePatientProfile(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deletePatientProfile(id).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Xóa hồ sơ thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun setDefaultPatientProfile(id: String): Result<PatientProfile> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.setDefaultPatientProfile(id).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Đặt mặc định thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
