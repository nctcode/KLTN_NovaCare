package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.remote.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PasswordResetState(
    val requested: Boolean = false,
    val verified: Boolean = false,
    val busy: Boolean = false,
    val done: Boolean = false,
    val error: String? = null,
    val resendAt: Long = 0,
    val identifier: String = ""
)

class PasswordResetViewModel : ViewModel() {
    private val mutable = MutableStateFlow(PasswordResetState())
    val state = mutable.asStateFlow()
    private var destination = PasswordOtpRequest()
    private var resetToken = ""

    fun resetState() {
        destination = PasswordOtpRequest()
        resetToken = ""
        mutable.value = PasswordResetState()
    }

    fun request(identifier: String) {
        if (mutable.value.busy || System.currentTimeMillis() < mutable.value.resendAt) return
        val trimmed = identifier.trim()
        if (trimmed.isBlank()) {
            mutable.value = mutable.value.copy(error = "Vui lòng nhập số điện thoại hoặc email")
            return
        }
        destination = if (trimmed.contains('@')) PasswordOtpRequest(email = trimmed) else PasswordOtpRequest(phone = trimmed)
        mutable.value = mutable.value.copy(busy = true, error = null, identifier = trimmed)
        viewModelScope.launch {
            healthApiResult("Không thể gửi mã xác thực", { ApiClient.getService().requestPasswordOtp(destination) }) { Unit }.fold(
                { mutable.value = PasswordResetState(requested = true, resendAt = System.currentTimeMillis() + 60000, identifier = trimmed) },
                { mutable.value = mutable.value.copy(busy = false, error = it.message) }
            )
        }
    }

    fun resend() {
        if (mutable.value.busy || System.currentTimeMillis() < mutable.value.resendAt) return
        val currentId = mutable.value.identifier
        if (currentId.isNotBlank()) {
            request(currentId)
        }
    }

    fun verify(otp: String) {
        if (!otp.matches(Regex("[0-9]{6}"))) {
            mutable.value = mutable.value.copy(error = "Vui lòng nhập đủ mã OTP 6 chữ số")
            return
        }
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch {
            healthApiResult("Mã OTP không hợp lệ", { ApiClient.getService().verifyPasswordOtp(VerifyOtpRequest(destination.phone, destination.email, otp)) }) { requireNotNull(it.data?.resetToken) }.fold(
                { resetToken = it; mutable.value = mutable.value.copy(verified = true, busy = false) },
                { mutable.value = mutable.value.copy(busy = false, error = it.message) }
            )
        }
    }

    fun reset(password: String, confirm: String) {
        if (mutable.value.busy) return
        if (!mutable.value.verified || password.length !in 6..128 || password != confirm) {
            mutable.value = mutable.value.copy(error = "Mật khẩu cần từ 6 đến 128 ký tự và hai mật khẩu phải khớp nhau.")
            return
        }
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch {
            healthApiResult("Không thể đặt lại mật khẩu", { ApiClient.getService().resetPassword(PasswordResetRequest(resetToken, password)) }) { Unit }.fold(
                { mutable.value = mutable.value.copy(done = true, busy = false) },
                { mutable.value = mutable.value.copy(busy = false, error = it.message) }
            )
        }
    }
}
