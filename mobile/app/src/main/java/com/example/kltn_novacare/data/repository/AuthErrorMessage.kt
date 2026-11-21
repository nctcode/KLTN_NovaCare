package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.remote.healthErrorMessage
import java.io.EOFException
import java.io.IOException
import java.net.ConnectException
import java.net.ProtocolException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

internal object AuthErrorMessage {
    private const val LOGIN_FAILED = "Không thể đăng nhập. Vui lòng thử lại."

    fun fromHttp(statusCode: Int, bodyMessage: String?, rawErrorBody: String?): String {
        val serverMessage = healthErrorMessage(rawErrorBody, bodyMessage.orEmpty()).trim()

        return when (statusCode) {
            401 -> if (serverMessage.contains("khóa", ignoreCase = true)) {
                "Tài khoản đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ NovaCare."
            } else {
                "Email/số điện thoại hoặc mật khẩu không đúng."
            }
            403 -> "Tài khoản không có quyền đăng nhập vào ứng dụng này."
            408, 504 -> "Máy chủ phản hồi quá chậm. Vui lòng thử lại."
            429 -> "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi một lúc rồi thử lại."
            in 500..599 -> "Hệ thống NovaCare đang tạm thời gián đoạn. Vui lòng thử lại sau."
            else -> serverMessage.takeIf { it.isNotBlank() } ?: LOGIN_FAILED
        }
    }

    fun fromException(error: Throwable): String = when {
        error is SocketTimeoutException ->
            "Kết nối đến NovaCare quá thời gian. Vui lòng kiểm tra mạng và thử lại."
        error is UnknownHostException ->
            "Không tìm thấy máy chủ NovaCare. Vui lòng kiểm tra kết nối mạng."
        error is ConnectException ->
            "Không thể kết nối đến máy chủ NovaCare. Vui lòng kiểm tra máy chủ và kết nối mạng."
        error is EOFException || error is ProtocolException ||
            error.message.orEmpty().contains("unexpected end of stream", ignoreCase = true) ->
            "Kết nối với máy chủ bị gián đoạn. Vui lòng thử lại sau ít phút."
        error is IOException ->
            "Không thể kết nối đến NovaCare. Vui lòng kiểm tra mạng và thử lại."
        else -> LOGIN_FAILED
    }
}
