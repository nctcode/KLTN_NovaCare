package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.ApiClient
import com.example.kltn_novacare.data.remote.ApiService
import com.example.kltn_novacare.data.remote.healthApiResult
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class ConsultationRepository(private val api: ApiService = ApiClient.getService()) {
    suspend fun transition(id: String, action: String): Result<Consultation> =
        healthApiResult("Không thể cập nhật phiên tư vấn", {
            when (action) {
                "accept" -> api.acceptConsultation(id)
                "start" -> api.startConsultation(id)
                "complete" -> api.completeConsultation(id)
                "cancel" -> api.cancelConsultation(id)
                else -> error("Thao tác không hợp lệ")
            }
        }) { requireNotNull(it.data) { "Máy chủ chưa xác nhận trạng thái phiên" } }

    suspend fun list(cursor: String? = null, limit: Int = 20): Result<ConsultationPage<Consultation>> =
        healthApiResult("Không thể tải danh sách tư vấn", { api.getConsultations(cursor, limit) }) {
            requireNotNull(it.data) { "Máy chủ chưa trả về danh sách tư vấn" }
        }

    suspend fun detail(id: String): Result<Consultation> =
        healthApiResult("Không thể tải phiên tư vấn", { api.getConsultation(id) }) {
            requireNotNull(it.data) { "Phiên tư vấn không tồn tại" }
        }

    suspend fun create(request: CreateConsultationRequest): Result<Consultation> =
        healthApiResult("Không thể tạo phiên tư vấn", { api.createConsultation(request) }) {
            requireNotNull(it.data) { "Máy chủ chưa trả về phiên tư vấn" }
        }

    suspend fun messages(id: String, before: String? = null, limit: Int = 30): Result<ConsultationPage<ConsultationMessage>> =
        healthApiResult("Không thể tải tin nhắn", { api.getConsultationMessages(id, before, limit) }) {
            requireNotNull(it.data) { "Máy chủ chưa trả về tin nhắn" }
        }

    suspend fun send(id: String, clientMessageId: String, text: String): Result<ConsultationMessage> =
        healthApiResult("Không thể gửi tin nhắn", { api.sendConsultationMessage(id, SendConsultationMessageRequest(clientMessageId, text)) }) {
            requireNotNull(it.data) { "Máy chủ chưa xác nhận tin nhắn" }
        }

    suspend fun sendAttachment(
        id: String,
        clientMessageId: String,
        fileName: String,
        mimeType: String,
        bytes: ByteArray,
        caption: String = ""
    ): Result<ConsultationMessage> {
        val file = MultipartBody.Part.createFormData(
            "file",
            fileName,
            bytes.toRequestBody(mimeType.toMediaType())
        )
        return healthApiResult("Không thể gửi tài liệu", {
            api.sendConsultationAttachment(
                id,
                file,
                clientMessageId.toRequestBody("text/plain".toMediaType()),
                caption.toRequestBody("text/plain".toMediaType())
            )
        }) { requireNotNull(it.data) { "Máy chủ chưa xác nhận tài liệu" } }
    }

    suspend fun markRead(id: String, lastMessageId: String): Result<ReadConsultationMessagesResult> =
        healthApiResult("Không thể cập nhật trạng thái đã đọc", { api.markConsultationRead(id, ReadConsultationMessagesRequest(lastMessageId)) }) {
            requireNotNull(it.data) { "Máy chủ chưa xác nhận trạng thái đã đọc" }
        }
}
