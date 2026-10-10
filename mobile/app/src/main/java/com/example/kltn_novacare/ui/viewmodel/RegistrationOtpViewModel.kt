package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.remote.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class RegistrationOtpState(
    val requested: Boolean = false,
    val verified: Boolean = false,
    val phone: String = "",
    val token: String = "",
    val busy: Boolean = false,
    val error: String? = null,
    val resendAt: Long = 0
)

class RegistrationOtpViewModel : ViewModel() {
    private val mutable = MutableStateFlow(RegistrationOtpState())
    val state = mutable.asStateFlow()

    fun reset() {
        mutable.value = RegistrationOtpState()
    }

    fun request(phone: String) {
        if (mutable.value.busy) return
        val cleanPhone = phone.trim()
        if (cleanPhone.isBlank()) {
            mutable.value = mutable.value.copy(error = "Vui lòng nhập số điện thoại")
            return
        }
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch {
            healthApiResult("Không thể gửi OTP", { ApiClient.getService().requestRegistrationOtp(PasswordOtpRequest(phone = cleanPhone)) }) { Unit }.fold(
                { mutable.value = RegistrationOtpState(requested = true, phone = cleanPhone, resendAt = System.currentTimeMillis() + 60000) },
                { mutable.value = mutable.value.copy(busy = false, error = it.message) }
            )
        }
    }

    fun resend() {
        if (mutable.value.busy || System.currentTimeMillis() < mutable.value.resendAt) return
        val currentPhone = mutable.value.phone
        if (currentPhone.isNotBlank()) {
            request(currentPhone)
        }
    }

    fun verify(otp: String) {
        if (!otp.matches(Regex("[0-9]{6}"))) {
            mutable.value = mutable.value.copy(error = "Vui lòng nhập đủ mã OTP 6 chữ số")
            return
        }
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch {
            healthApiResult("Mã OTP không hợp lệ", { ApiClient.getService().verifyRegistrationOtp(VerifyOtpRequest(phone = mutable.value.phone, otpCode = otp)) }) { requireNotNull(it.data) }.fold(
                { mutable.value = mutable.value.copy(verified = true, phone = it.phone ?: mutable.value.phone, token = it.verificationToken.orEmpty(), busy = false) },
                { mutable.value = mutable.value.copy(busy = false, error = it.message) }
            )
        }
    }
}
