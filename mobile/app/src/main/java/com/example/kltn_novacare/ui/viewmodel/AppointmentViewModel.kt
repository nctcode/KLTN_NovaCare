package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.Appointment
import com.example.kltn_novacare.data.model.Notification
import com.example.kltn_novacare.data.repository.AppointmentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AppointmentViewModel(
    private val appointmentRepository: AppointmentRepository = AppointmentRepository()
) : ViewModel() {

    private val _upcomingAppointments = MutableStateFlow<NetworkState<List<Appointment>>>(NetworkState.Idle)
    val upcomingAppointments: StateFlow<NetworkState<List<Appointment>>> = _upcomingAppointments.asStateFlow()

    private val _historyAppointments = MutableStateFlow<NetworkState<List<Appointment>>>(NetworkState.Idle)
    val historyAppointments: StateFlow<NetworkState<List<Appointment>>> = _historyAppointments.asStateFlow()

    private val _appointmentDetails = MutableStateFlow<NetworkState<Appointment>>(NetworkState.Idle)
    val appointmentDetails: StateFlow<NetworkState<Appointment>> = _appointmentDetails.asStateFlow()

    private val _cancelState = MutableStateFlow<NetworkState<Appointment>>(NetworkState.Idle)
    val cancelState: StateFlow<NetworkState<Appointment>> = _cancelState.asStateFlow()

    private val _notifications = MutableStateFlow<NetworkState<List<Notification>>>(NetworkState.Idle)
    val notifications: StateFlow<NetworkState<List<Notification>>> = _notifications.asStateFlow()

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    fun loadUpcoming() {
        viewModelScope.launch {
            _upcomingAppointments.value = NetworkState.Loading
            appointmentRepository.getUpcomingAppointments().fold(
                onSuccess = { _upcomingAppointments.value = NetworkState.Success(it) },
                onFailure = { _upcomingAppointments.value = NetworkState.Error(it.message ?: "Lỗi tải lịch hẹn sắp tới") }
            )
        }
    }

    fun loadHistory() {
        viewModelScope.launch {
            _historyAppointments.value = NetworkState.Loading
            appointmentRepository.getAppointmentHistory().fold(
                onSuccess = { _historyAppointments.value = NetworkState.Success(it) },
                onFailure = { _historyAppointments.value = NetworkState.Error(it.message ?: "Lỗi tải lịch sử khám") }
            )
        }
    }

    fun loadDetails(appointmentId: String) {
        viewModelScope.launch {
            _appointmentDetails.value = NetworkState.Loading
            appointmentRepository.getAppointmentById(appointmentId).fold(
                onSuccess = { _appointmentDetails.value = NetworkState.Success(it) },
                onFailure = { _appointmentDetails.value = NetworkState.Error(it.message ?: "Không tìm thấy lịch khám") }
            )
        }
    }

    fun cancelAppointment(appointmentId: String, reason: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _cancelState.value = NetworkState.Loading
            appointmentRepository.cancelAppointment(appointmentId, reason).fold(
                onSuccess = {
                    _cancelState.value = NetworkState.Success(it)
                    loadDetails(appointmentId)
                    loadUpcoming()
                    onSuccess()
                },
                onFailure = {
                    _cancelState.value = NetworkState.Error(it.message ?: "Hủy lịch hẹn thất bại")
                }
            )
        }
    }

    fun loadNotifications() {
        viewModelScope.launch {
            _notifications.value = NetworkState.Loading
            appointmentRepository.getNotifications().fold(
                onSuccess = {
                    _notifications.value = NetworkState.Success(it)
                    loadUnreadCount()
                },
                onFailure = { _notifications.value = NetworkState.Error(it.message ?: "Lỗi tải thông báo") }
            )
        }
    }

    fun markNotificationAsRead(id: String) {
        viewModelScope.launch {
            appointmentRepository.markNotificationAsRead(id).fold(
                onSuccess = { loadNotifications() },
                onFailure = { /* Handle error */ }
            )
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            appointmentRepository.markAllNotificationsAsRead().fold(
                onSuccess = { loadNotifications() },
                onFailure = { /* Handle error */ }
            )
        }
    }

    fun loadUnreadCount() {
        viewModelScope.launch {
            appointmentRepository.getUnreadNotificationsCount().fold(
                onSuccess = { _unreadCount.value = it },
                onFailure = { /* Handle error */ }
            )
        }
    }
}
