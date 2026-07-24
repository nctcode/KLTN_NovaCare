package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.CreateAppointmentRequest
import com.example.kltn_novacare.data.repository.AppointmentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

data class BookingUiState(
    val currentStep: Int = 1,
    val doctor: Doctor? = null,
    val workplace: DoctorWorkplace? = null,
    val selectedDate: String? = null,
    val selectedSlot: AppointmentSlot? = null,
    val selectedProfile: PatientProfile? = null,
    val reason: String = "",
    val symptoms: String = "",
    val paymentMethod: String = "CASH", // VNPAY hoặc CASH
    val idempotencyKey: String = "",
    val bookingState: NetworkState<Appointment> = NetworkState.Idle,
    val paymentUrlState: NetworkState<String> = NetworkState.Idle
)

class BookingViewModel(
    private val appointmentRepository: AppointmentRepository = AppointmentRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(BookingUiState())
    val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()

    fun resetBooking() {
        _uiState.value = BookingUiState(
            idempotencyKey = UUID.randomUUID().toString()
        )
    }

    fun setStep(step: Int) {
        _uiState.value = _uiState.value.copy(currentStep = step)
    }

    fun selectDoctor(doctor: Doctor, workplace: DoctorWorkplace) {
        _uiState.value = _uiState.value.copy(
            doctor = doctor,
            workplace = workplace,
            currentStep = 2
        )
    }

    fun selectDateTime(date: String, slot: AppointmentSlot) {
        _uiState.value = _uiState.value.copy(
            selectedDate = date,
            selectedSlot = slot,
            currentStep = 3
        )
    }

    fun selectProfile(profile: PatientProfile) {
        _uiState.value = _uiState.value.copy(
            selectedProfile = profile,
            currentStep = 4
        )
    }

    fun setDetails(reason: String, symptoms: String) {
        _uiState.value = _uiState.value.copy(
            reason = reason,
            symptoms = symptoms
        )
    }

    fun setPaymentMethod(method: String) {
        _uiState.value = _uiState.value.copy(paymentMethod = method)
    }

    fun createAppointment(onSuccess: (Appointment) -> Unit) {
        val currentState = _uiState.value
        val slotId = currentState.selectedSlot?.id ?: return
        val profileId = currentState.selectedProfile?.id ?: return
        val method = currentState.paymentMethod
        val reason = currentState.reason
        val symptoms = currentState.symptoms
        val key = currentState.idempotencyKey

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(bookingState = NetworkState.Loading)
            val request = CreateAppointmentRequest(
                slotId = slotId,
                patientProfileId = profileId,
                paymentMethod = method,
                reason = reason,
                symptoms = symptoms,
                idempotencyKey = key
            )
            appointmentRepository.createAppointment(request).fold(
                onSuccess = { appointment ->
                    _uiState.value = _uiState.value.copy(
                        bookingState = NetworkState.Success(appointment),
                        currentStep = 5
                    )
                    onSuccess(appointment)
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        bookingState = NetworkState.Error(error.message ?: "Lỗi tạo lịch hẹn")
                    )
                }
            )
        }
    }

    fun createVNPayPayment(appointmentId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(paymentUrlState = NetworkState.Loading)
            appointmentRepository.createPayment(appointmentId).fold(
                onSuccess = { url ->
                    _uiState.value = _uiState.value.copy(paymentUrlState = NetworkState.Success(url))
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        paymentUrlState = NetworkState.Error(error.message ?: "Lỗi tạo liên kết thanh toán")
                    )
                }
            )
        }
    }
}
