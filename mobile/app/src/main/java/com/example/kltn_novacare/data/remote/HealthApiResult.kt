package com.example.kltn_novacare.data.remote

import com.example.kltn_novacare.data.model.ApiResponse
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Call

internal fun healthErrorMessage(raw: String?, fallback: String): String = runCatching {
    val message = Gson().fromJson(raw, JsonObject::class.java)?.get("message")
    when {
        message == null || message.isJsonNull -> fallback
        message.isJsonArray -> message.asJsonArray.joinToString("\n") { it.asString }
        message.isJsonPrimitive -> message.asString
        else -> fallback
    }.ifBlank { fallback }
}.getOrDefault(fallback)

internal suspend fun <T, R> healthApiResult(
    fallback: String,
    call: () -> Call<ApiResponse<T>>,
    read: (ApiResponse<T>) -> R
): Result<R> = withContext(Dispatchers.IO) {
    try {
        val response = call().execute()
        val body = response.body()
        if (response.isSuccessful && body != null && body.success) {
            Result.success(read(body))
        } else {
            Result.failure(IllegalStateException(
                healthErrorMessage(response.errorBody()?.string(), body?.message ?: fallback)
            ))
        }
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (error: Exception) {
        Result.failure(error)
    }
}
