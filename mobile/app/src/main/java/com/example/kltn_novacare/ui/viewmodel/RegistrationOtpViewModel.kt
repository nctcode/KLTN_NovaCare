package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.remote.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class RegistrationOtpState(val requested: Boolean = false, val verified: Boolean = false, val phone: String = "", val token: String = "", val busy: Boolean = false, val error: String? = null)
class RegistrationOtpViewModel : ViewModel() {
    private val mutable = MutableStateFlow(RegistrationOtpState())
    val state = mutable.asStateFlow()
    fun request(phone: String) {
        if (mutable.value.busy) return
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch { healthApiResult("Không thể gửi OTP", { ApiClient.getService().requestRegistrationOtp(PasswordOtpRequest(phone = phone)) }) { Unit }.fold(
            { mutable.value = RegistrationOtpState(requested = true, phone = phone.trim()) },
            { mutable.value = mutable.value.copy(busy = false, error = it.message) }
        ) }
    }
    fun verify(otp: String) {
        if (!otp.matches(Regex("[0-9]{6}"))) { mutable.value = mutable.value.copy(error = "Nhập đủ mã OTP 6 chữ số"); return }
        mutable.value = mutable.value.copy(busy = true, error = null)
        viewModelScope.launch { healthApiResult("Mã OTP không hợp lệ", { ApiClient.getService().verifyRegistrationOtp(VerifyOtpRequest(phone = mutable.value.phone, otpCode = otp)) }) { requireNotNull(it.data) }.fold(
            { mutable.value = mutable.value.copy(verified = true, phone = it.phone ?: mutable.value.phone, token = it.verificationToken.orEmpty(), busy = false) },
            { mutable.value = mutable.value.copy(busy = false, error = it.message) }
        ) }
    }
}
