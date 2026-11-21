package com.novacare.doctor.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.novacare.doctor.data.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface LoadState<out T> {
    data object Idle : LoadState<Nothing>
    data object Loading : LoadState<Nothing>
    data class Data<T>(val value: T) : LoadState<T>
    data class Error(val message: String) : LoadState<Nothing>
}

class DoctorViewModel(private val repository: DoctorRepository = DoctorRepository()) : ViewModel() {
    private val _authenticated = MutableStateFlow(repository.isLoggedIn())
    val authenticated: StateFlow<Boolean> = _authenticated.asStateFlow()
    private val _auth = MutableStateFlow<LoadState<Unit>>(LoadState.Idle)
    val auth: StateFlow<LoadState<Unit>> = _auth.asStateFlow()
    private val _dashboard = MutableStateFlow<LoadState<DoctorDashboard>>(LoadState.Idle)
    val dashboard = _dashboard.asStateFlow()
    private val _schedule = MutableStateFlow<LoadState<ScheduleResponse>>(LoadState.Idle)
    val schedule = _schedule.asStateFlow()
    private val _appointments = MutableStateFlow<LoadState<AppointmentsResponse>>(LoadState.Idle)
    val appointments = _appointments.asStateFlow()
    private val _appointment = MutableStateFlow<LoadState<DoctorAppointment>>(LoadState.Idle)
    val appointment = _appointment.asStateFlow()
    private val _screening = MutableStateFlow<LoadState<AppointmentScreening>>(LoadState.Idle)
    val screening = _screening.asStateFlow()
    private val _sharedRecords = MutableStateFlow<LoadState<List<SharedRecord>>>(LoadState.Idle)
    val sharedRecords = _sharedRecords.asStateFlow()
    private val _notifications = MutableStateFlow<LoadState<List<DoctorNotification>>>(LoadState.Idle)
    val notifications = _notifications.asStateFlow()
    private val _profile = MutableStateFlow<LoadState<DoctorProfile>>(LoadState.Idle)
    val profile = _profile.asStateFlow()

    fun login(username: String, password: String) {
        if (username.isBlank() || password.isBlank()) {
            _auth.value = LoadState.Error("Vui lòng nhập tài khoản và mật khẩu")
            return
        }
        viewModelScope.launch {
            _auth.value = LoadState.Loading
            repository.login(username, password).fold(
                onSuccess = { _auth.value = LoadState.Data(Unit); _authenticated.value = true },
                onFailure = { _auth.value = LoadState.Error(it.message ?: "Đăng nhập thất bại") }
            )
        }
    }

    fun logout() = viewModelScope.launch {
        repository.logout()
        _authenticated.value = false
        _auth.value = LoadState.Idle
        clearProtectedState()
    }

    fun loadDashboard() = load(_dashboard, repository::dashboard)
    fun loadSchedule(start: String, end: String) = load(_schedule) { repository.schedules(start, end) }
    fun loadAppointments(start: String, end: String, status: String?) = load(_appointments) { repository.appointments(start, end, status) }
    fun loadAppointment(id: String) {
        load(_appointment) { repository.appointment(id) }
        load(_sharedRecords) { repository.sharedRecords(id) }
        viewModelScope.launch {
            _screening.value = LoadState.Loading
            repository.screening(id).fold(
                onSuccess = { _screening.value = LoadState.Data(it) },
                onFailure = { _screening.value = LoadState.Idle }
            )
        }
    }
    fun loadNotifications() = load(_notifications, repository::notifications)
    fun markNotificationRead(id: String) = viewModelScope.launch {
        repository.markRead(id).onSuccess { loadNotifications() }
    }
    fun markAllNotificationsRead() = viewModelScope.launch {
        repository.markAllRead().onSuccess { loadNotifications() }
    }
    fun loadProfile() = load(_profile, repository::profile)
    fun updateProfile(fullName: String, avatarUrl: String?, bio: String?) = viewModelScope.launch {
        _profile.value = LoadState.Loading
        repository.updateProfile(UpdateProfileRequest(fullName, avatarUrl?.ifBlank { null }, bio?.ifBlank { null })).fold(
            onSuccess = { _profile.value = LoadState.Data(it) },
            onFailure = { _profile.value = LoadState.Error(it.message ?: "Không thể cập nhật hồ sơ") }
        )
    }

    private fun <T> load(target: MutableStateFlow<LoadState<T>>, request: suspend () -> Result<T>) {
        viewModelScope.launch {
            target.value = LoadState.Loading
            request().fold(
                onSuccess = { target.value = LoadState.Data(it) },
                onFailure = {
                    if (it.message?.contains("401") == true || it.message?.contains("403") == true) _authenticated.value = false
                    target.value = LoadState.Error(it.message ?: "Không thể tải dữ liệu")
                }
            )
        }
    }

    private fun clearProtectedState() {
        _dashboard.value = LoadState.Idle
        _schedule.value = LoadState.Idle
        _appointments.value = LoadState.Idle
        _appointment.value = LoadState.Idle
        _screening.value = LoadState.Idle
        _sharedRecords.value = LoadState.Idle
        _notifications.value = LoadState.Idle
        _profile.value = LoadState.Idle
    }
}
