package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.remote.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PasswordResetState(val requested: Boolean = false, val verified: Boolean = false, val busy: Boolean = false, val done: Boolean = false, val error: String? = null, val resendAt: Long = 0)

class PasswordResetViewModel : ViewModel() {
    private val mutable = MutableStateFlow(PasswordResetState())
    val state = mutable.asStateFlow()
    private var destination = PasswordOtpRequest()
    private var resetToken = ""
    fun request(identifier: String) {
        if (mutable.value.busy || System.currentTimeMillis() < mutable.value.resendAt) return
        if (identifier.isBlank()) { mutable.value = mutable.value.copy(error = "Nhập số điện thoại hoặc email"); return }
        destination = if (identifier.contains('@')) PasswordOtpRequest(email = identifier.trim()) else PasswordOtpRequest(phone = identifier.trim())
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch {
            healthApiResult("Không thể gửi mã xác thực", { ApiClient.getService().requestPasswordOtp(destination) }) { Unit }.fold(
                { mutable.value = PasswordResetState(requested = true, resendAt = System.currentTimeMillis() + 60000) },
                { mutable.value = mutable.value.copy(busy = false, error = it.message) }
            )
        }
    }
    fun verify(otp: String) {
        if (!otp.matches(Regex("[0-9]{6}"))) { mutable.value = mutable.value.copy(error = "Nhập đủ mã OTP 6 chữ số"); return }
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch { healthApiResult("Mã OTP không hợp lệ", { ApiClient.getService().verifyPasswordOtp(VerifyOtpRequest(destination.phone, destination.email, otp)) }) { requireNotNull(it.data?.resetToken) }.fold(
            { resetToken = it; mutable.value = mutable.value.copy(verified = true, busy = false) },
            { mutable.value = mutable.value.copy(busy = false, error = it.message) }
        ) }
    }
    fun reset(password: String, confirm: String) {
        if (mutable.value.busy) return
        if (!mutable.value.verified || password.length !in 6..128 || password != confirm) {
            mutable.value = mutable.value.copy(error = "Mật khẩu cần 6–128 ký tự và hai mật khẩu phải giống nhau."); return
        }
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch {
            healthApiResult("Không thể đặt lại mật khẩu", { ApiClient.getService().resetPassword(PasswordResetRequest(resetToken, password)) }) { Unit }.fold(
                { mutable.value = PasswordResetState(done = true) },
                { mutable.value = mutable.value.copy(busy = false, error = it.message) }
            )
        }
    }
}
