package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.model.CreateHealthShareRequest
import com.example.kltn_novacare.data.remote.ApiClient
import com.example.kltn_novacare.data.remote.ApiService
import com.example.kltn_novacare.data.remote.healthApiResult

class HealthShareRepository(private val api: ApiService = ApiClient.getService()) {
    suspend fun getShares() = healthApiResult("Không thể tải mã chia sẻ", { api.getHealthShares() }) {
        requireNotNull(it.data) { "Máy chủ chưa trả về danh sách mã chia sẻ" }
            .filterNot { share -> share.shareToken.startsWith("NC-AUDIT-") }
    }

    suspend fun createShare(request: CreateHealthShareRequest) =
        healthApiResult("Không thể tạo mã chia sẻ", { api.createHealthShare(request) }) {
            requireNotNull(it.data) { "Máy chủ chưa trả về mã chia sẻ" }
        }

    suspend fun revokeShare(id: String) =
        healthApiResult("Không thể thu hồi mã chia sẻ", { api.revokeHealthShare(id) }) { Unit }
}
