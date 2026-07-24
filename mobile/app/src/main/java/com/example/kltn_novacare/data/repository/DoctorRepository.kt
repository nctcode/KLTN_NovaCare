package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.model.Specialty
import com.example.kltn_novacare.data.model.Hospital
import com.example.kltn_novacare.data.model.Doctor
import com.example.kltn_novacare.data.model.AppointmentSlot
import com.example.kltn_novacare.data.remote.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class DoctorRepository {
    private val apiService = ApiClient.getService()

    suspend fun getSpecialties(): Result<List<Specialty>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getSpecialties().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tải chuyên khoa"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getHospitals(): Result<List<Hospital>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getHospitals().execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tải cơ sở y tế"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchDoctors(
        query: String? = null,
        specialtyId: String? = null,
        hospitalId: String? = null,
        page: Int? = null,
        limit: Int? = null
    ): Result<List<Doctor>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.searchDoctors(query, specialtyId, hospitalId, page, limit).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể tìm bác sĩ"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDoctorById(id: String): Result<Doctor> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getDoctorById(id).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success && body.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không tìm thấy bác sĩ"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAvailableSlots(
        doctorId: String,
        workplaceId: String,
        date: String
    ): Result<List<AppointmentSlot>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAvailableSlots(doctorId, workplaceId, date).execute()
            val body = response.body()
            if (response.isSuccessful && body != null && body.success) {
                Result.success(body.data ?: emptyList())
            } else {
                Result.failure(Exception(body?.error ?: body?.message ?: "Không thể lấy khung giờ khám"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
