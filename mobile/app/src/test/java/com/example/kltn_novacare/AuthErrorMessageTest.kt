package com.example.kltn_novacare

import com.example.kltn_novacare.data.repository.AuthErrorMessage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test
import java.io.EOFException
import java.net.SocketTimeoutException

class AuthErrorMessageTest {
    @Test
    fun `unexpected end of stream is replaced with a friendly message`() {
        val message = AuthErrorMessage.fromException(
            EOFException("unexpected end of stream on http://127.0.0.1:3000")
        )

        assertEquals("Kết nối với máy chủ bị gián đoạn. Vui lòng thử lại sau ít phút.", message)
        assertFalse(message.contains("127.0.0.1"))
    }

    @Test
    fun `timeout has an actionable message`() {
        assertEquals(
            "Kết nối đến NovaCare quá thời gian. Vui lòng kiểm tra mạng và thử lại.",
            AuthErrorMessage.fromException(SocketTimeoutException())
        )
    }

    @Test
    fun `invalid credentials do not reveal whether the account exists`() {
        val rawBody = """{"statusCode":401,"message":"Email không tồn tại","error":"Unauthorized"}"""

        assertEquals(
            "Email/số điện thoại hoặc mật khẩu không đúng.",
            AuthErrorMessage.fromHttp(401, null, rawBody)
        )
    }

    @Test
    fun `locked account keeps a specific support message`() {
        val rawBody = """{"statusCode":401,"message":"Tài khoản đã bị khóa","error":"Unauthorized"}"""

        assertEquals(
            "Tài khoản đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ NovaCare.",
            AuthErrorMessage.fromHttp(401, null, rawBody)
        )
    }

    @Test
    fun `server errors do not expose technical response`() {
        assertEquals(
            "Hệ thống NovaCare đang tạm thời gián đoạn. Vui lòng thử lại sau.",
            AuthErrorMessage.fromHttp(500, null, "Internal Server Error")
        )
    }
}
