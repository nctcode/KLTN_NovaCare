package com.novacare.doctor.data

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Response
import java.util.UUID

class DoctorConsultationRepository(
    private val api: DoctorApi = DoctorApiClient.api()
) {
    suspend fun list(): Result<List<Consultation>> = request { api.consultations().requireData().items }
    suspend fun detail(id: String): Result<Consultation> = request { api.consultation(id).requireData() }
    suspend fun messages(id: String, before: String? = null): Result<ConsultationPage<ConsultationMessage>> =
        request { api.consultationMessages(id, before).requireData() }

    suspend fun transition(id: String, action: String): Result<Consultation> = request {
        when (action) {
            "accept" -> api.acceptConsultation(id)
            "start" -> api.startConsultation(id)
            "complete" -> api.completeConsultation(id)
            else -> error("Thao tác không hợp lệ")
        }.requireData()
    }

    suspend fun sendText(id: String, text: String, clientMessageId: String = UUID.randomUUID().toString()): Result<ConsultationMessage> =
        request { api.sendConsultationMessage(id, SendConsultationMessageRequest(clientMessageId, text.trim())).requireData() }

    suspend fun sendAttachment(
        id: String,
        fileName: String,
        mimeType: String,
        bytes: ByteArray,
        clientMessageId: String = UUID.randomUUID().toString()
    ): Result<ConsultationMessage> = request {
        require(bytes.isNotEmpty()) { "Tệp không có dữ liệu" }
        require(bytes.size <= 10 * 1024 * 1024) { "Tệp không được lớn hơn 10 MB" }
        val mediaType = runCatching { mimeType.toMediaType() }.getOrElse { "application/octet-stream".toMediaType() }
        val file = MultipartBody.Part.createFormData("file", fileName, bytes.toRequestBody(mediaType))
        api.sendConsultationAttachment(
            id,
            file,
            clientMessageId.toRequestBody("text/plain".toMediaType()),
            "".toRequestBody("text/plain".toMediaType())
        ).requireData()
    }

    suspend fun markRead(id: String, lastMessageId: String): Result<ReadConsultationMessagesResult> =
        request { api.markConsultationRead(id, ReadConsultationMessagesRequest(lastMessageId)).requireData() }

    suspend fun videoCapabilities(): Result<VideoCapabilities> = request { api.videoCapabilities().requireData() }
    suspend fun joinVideo(id: String): Result<VideoJoinResult> = request { api.joinVideo(id).requireData() }

    private suspend fun <T> request(block: suspend () -> T): Result<T> = try {
        Result.success(block())
    } catch (error: Exception) {
        Result.failure(error)
    }

    private fun <T> Response<ApiResponse<T>>.requireData(): T {
        val body = body()
        if (!isSuccessful || body == null || (body.data == null && body.success != true)) {
            throw IllegalStateException(body?.message ?: body?.error ?: "Yêu cầu thất bại (${code()})")
        }
        return body.data ?: throw IllegalStateException(body.message ?: "Không có dữ liệu trả về")
    }
}
