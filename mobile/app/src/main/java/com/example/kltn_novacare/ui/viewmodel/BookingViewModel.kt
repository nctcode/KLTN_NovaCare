package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.CreateAppointmentRequest
import com.example.kltn_novacare.data.repository.AppointmentRepository
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.util.UUID

data class BookingUiState(
    val currentStep: Int = 1,
    val hospital: Hospital? = null,
    val bookingType: String = "DOCTOR",
    val doctor: Doctor? = null,
    val workplace: DoctorWorkplace? = null,
    val selectedService: MedicalService? = null,
    val selectedSpecialty: Specialty? = null,
    val selectedDate: String? = null,
    val selectedSlot: AppointmentSlot? = null,
    val selectedProfile: PatientProfile? = null,
    val reason: String = "",
    val symptoms: String = "",
    val paymentMethod: String = "CASH",
    val idempotencyKey: String = UUID.randomUUID().toString(),
    val createdAppointment: Appointment? = null,
    val checkoutState: NetworkState<Unit> = NetworkState.Idle,
    val showSimulation: Boolean = false,
    val resumed: Boolean = false
) {
    val busy get() = checkoutState is NetworkState.Loading
    val locked get() = busy || createdAppointment != null
}

class BookingViewModel(
    private val appointmentRepository: AppointmentRepository = AppointmentRepository(),
    private val dispatcher: CoroutineDispatcher = Dispatchers.Main.immediate
) : ViewModel() {
    private val _uiState = MutableStateFlow(BookingUiState())
    val uiState = _uiState.asStateFlow()

    fun resetBooking() {
        if (!_uiState.value.busy) _uiState.value = BookingUiState()
    }

    // New draft input gets a new key; retries of the same submission reuse the key.
    private fun draft(change: (BookingUiState) -> BookingUiState) {
        val before = _uiState.value
        if (before.locked) return
        val after = change(before)
        if (after != before) _uiState.value = after.copy(
            idempotencyKey = UUID.randomUUID().toString(), checkoutState = NetworkState.Idle
        )
    }

    fun setStep(step: Int) {
        val state = _uiState.value
        if (state.busy || (state.createdAppointment != null && step < 4)) return
        if (step >= 2 && state.selectedSlot == null && !state.resumed) return
        if (step >= 3 && state.selectedProfile == null && !state.resumed) return
        if (step == 5 && state.createdAppointment?.status !in listOf("PAID", "CONFIRMED")) return
        _uiState.value = state.copy(currentStep = step.coerceIn(1, 5))
    }

    fun selectHospital(hospital: Hospital) = draft {
        if (it.hospital?.id == hospital.id) it else it.copy(hospital = hospital, doctor = null,
            workplace = null, selectedSlot = null, selectedService = null, selectedSpecialty = null)
    }
    fun setBookingType(type: String) = draft { it.copy(bookingType = type) }
    fun selectDoctor(doctor: Doctor, workplace: DoctorWorkplace) = draft {
        if (it.workplace?.id == workplace.id) it.copy(doctor = doctor, workplace = workplace)
        else it.copy(doctor = doctor, workplace = workplace, hospital = workplace.hospital ?: it.hospital,
            selectedSlot = null, selectedService = null, selectedSpecialty = workplace.specialty)
    }
    fun selectService(service: MedicalService?) = draft { it.copy(selectedService = service, selectedSlot = null) }
    fun selectSpecialty(specialty: Specialty) = draft { it.copy(selectedSpecialty = specialty) }
    fun selectDate(date: String) = draft {
        if (it.selectedDate == date) it else it.copy(selectedDate = date, selectedSlot = null)
    }
    fun selectDateTime(date: String, slot: AppointmentSlot) = draft {
        it.copy(selectedDate = date, selectedSlot = slot)
    }
    fun selectProfile(profile: PatientProfile) = draft { it.copy(selectedProfile = profile) }
    fun setDetails(reason: String, symptoms: String) = draft { it.copy(reason = reason, symptoms = symptoms) }
    fun setPaymentMethod(method: String) {
        if (!_uiState.value.busy && method in listOf("CASH", "MOMO", "VNPAY", "VIETQR", "CARD"))
            _uiState.value = _uiState.value.copy(paymentMethod = method, checkoutState = NetworkState.Idle)
    }
    fun dismissSimulation() {
        if (!_uiState.value.busy) _uiState.value = _uiState.value.copy(showSimulation = false)
    }

    private fun fail(message: String) {
        _uiState.value = _uiState.value.copy(checkoutState = NetworkState.Error(message))
    }
    private fun expired(appointment: Appointment): Boolean =
        appointment.status == "EXPIRED" || (appointment.status == "AWAITING_PAYMENT" &&
            appointment.expiresAt?.let { runCatching { !Instant.parse(it).isAfter(Instant.now()) }.getOrDefault(false) } == true)

    fun checkout() {
        val initial = _uiState.value
        if (initial.busy) return
        if (initial.createdAppointment == null && (initial.selectedProfile == null || initial.selectedSlot == null || initial.workplace == null)) {
            fail("Vui lòng chọn bác sĩ, khung giờ và hồ sơ bệnh nhân.")
            return
        }
        _uiState.value = initial.copy(checkoutState = NetworkState.Loading)
        viewModelScope.launch(dispatcher) {
            var appointment = initial.createdAppointment
            if (appointment == null) {
                val result = appointmentRepository.createAppointment(CreateAppointmentRequest(
                    slotId = initial.selectedSlot!!.id, patientProfileId = initial.selectedProfile!!.id,
                    reason = initial.reason.trim().ifBlank { null }, symptoms = initial.symptoms.trim().ifBlank { null },
                    idempotencyKey = initial.idempotencyKey, medicalServiceId = initial.selectedService?.id
                ))
                appointment = result.getOrElse { fail(it.message ?: "Không thể đặt lịch"); return@launch }
                _uiState.value = _uiState.value.copy(createdAppointment = appointment)
            }
            if (appointment.status in listOf("PAID", "CONFIRMED")) {
                _uiState.value = _uiState.value.copy(currentStep = 5, checkoutState = NetworkState.Success(Unit))
                return@launch
            }
            if (appointment.status != "AWAITING_PAYMENT" || expired(appointment)) {
                fail("Lịch khám đã hết hạn hoặc không còn chờ thanh toán. Vui lòng kiểm tra lịch hẹn.")
                return@launch
            }
            if (initial.paymentMethod == "CASH") {
                appointmentRepository.confirmAppointment(appointment.id).fold(
                    onSuccess = { confirmed ->
                        if (confirmed.status != "CONFIRMED") fail("Máy chủ chưa xác nhận lịch khám.")
                        else _uiState.value = _uiState.value.copy(
                            createdAppointment = appointment.copy(status = confirmed.status),
                            checkoutState = NetworkState.Success(Unit), currentStep = 5
                        )
                    },
                    onFailure = { fail(it.message ?: "Không thể xác nhận lịch khám") }
                )
            } else {
                _uiState.value = _uiState.value.copy(showSimulation = true, checkoutState = NetworkState.Idle)
            }
        }
    }

    fun simulatePayment() {
        val state = _uiState.value
        val appointment = state.createdAppointment ?: return
        if (state.busy || appointment.status != "AWAITING_PAYMENT") return
        if (expired(appointment)) { fail("Lịch khám đã hết hạn. Vui lòng đặt lịch mới."); return }
        _uiState.value = state.copy(checkoutState = NetworkState.Loading)
        viewModelScope.launch(dispatcher) {
            // Reconcile first: a previous attempt may have succeeded despite a lost response.
            val status = appointmentRepository.getPaymentStatus(appointment.id).getOrElse {
                fail(it.message ?: "Không thể kiểm tra thanh toán"); return@launch
            }
            if (status.paymentStatus != "PAID") {
                val paid = appointmentRepository.simulatePayment(appointment.id, state.paymentMethod).getOrElse {
                    fail(it.message ?: "Thanh toán mô phỏng thất bại"); return@launch
                }
                if (paid.status != "PAID" || paid.appointmentId != appointment.id) {
                    fail("Máy chủ chưa xác nhận thanh toán thành công."); return@launch
                }
            }
            _uiState.value = _uiState.value.copy(
                createdAppointment = appointment.copy(status = "PAID", paymentStatus = "PAID", paymentMethod = state.paymentMethod),
                showSimulation = false, currentStep = 5, checkoutState = NetworkState.Success(Unit)
            )
        }
    }

    fun resumePayment(appointment: Appointment) {
        if (_uiState.value.busy) return
        _uiState.value = BookingUiState(
            currentStep = 4, createdAppointment = appointment, resumed = true,
            selectedProfile = appointment.patientProfile, selectedSlot = appointment.slot,
            workplace = appointment.workplace ?: appointment.slot?.doctorWorkplace,
            hospital = (appointment.workplace ?: appointment.slot?.doctorWorkplace)?.hospital,
            paymentMethod = "MOMO"
        )
    }
}
