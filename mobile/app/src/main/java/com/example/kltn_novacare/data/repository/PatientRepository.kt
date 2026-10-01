package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.model.PatientProfile
import com.example.kltn_novacare.data.remote.*
import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

// Explicit nulls on PUT allow optional fields (including unique CCCD) to be cleared.
internal fun profileUpdateBody(request: CreatePatientProfileRequest): JsonObject =
    GsonBuilder().serializeNulls().create().toJsonTree(request).asJsonObject.apply {
        if (request.isDefault == null) remove("isDefault")
    }

class PatientRepository(private val apiService: ApiService = ApiClient.getService()) {
    suspend fun getPatientProfiles(): Result<List<PatientProfile>> =
        healthApiResult("Không thể tải hồ sơ", { apiService.getPatientProfiles() }) {
            requireNotNull(it.data) { "Máy chủ chưa trả về danh sách hồ sơ" }
        }

    suspend fun getPatientProfileById(id: String): Result<PatientProfile> =
        healthApiResult("Không tìm thấy hồ sơ", { apiService.getPatientProfileById(id) }) {
            requireNotNull(it.data) { "Không tìm thấy hồ sơ" }
        }

    suspend fun createPatientProfile(request: CreatePatientProfileRequest): Result<PatientProfile> =
        healthApiResult("Tạo hồ sơ thất bại", { apiService.createPatientProfile(request) }) {
            requireNotNull(it.data) { "Máy chủ chưa trả về hồ sơ đã tạo" }
        }

    suspend fun updatePatientProfile(id: String, request: CreatePatientProfileRequest): Result<PatientProfile> =
        healthApiResult("Cập nhật hồ sơ thất bại", {
            // Use a raw JSON body so Retrofit's default Gson does not drop explicit nulls again.
            apiService.updatePatientProfile(id, profileUpdateBody(request).toString()
                .toRequestBody("application/json; charset=utf-8".toMediaType()))
        }) {
            requireNotNull(it.data) { "Máy chủ chưa trả về hồ sơ đã cập nhật" }
        }

    suspend fun deletePatientProfile(id: String): Result<Unit> =
        healthApiResult("Xóa hồ sơ thất bại", { apiService.deletePatientProfile(id) }) { Unit }

    suspend fun setDefaultPatientProfile(id: String): Result<PatientProfile> =
        healthApiResult("Đặt mặc định thất bại", { apiService.setDefaultPatientProfile(id) }) {
            requireNotNull(it.data) { "Máy chủ chưa trả về hồ sơ mặc định" }
        }
}
