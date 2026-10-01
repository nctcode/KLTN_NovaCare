package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.PatientProfile
import com.example.kltn_novacare.data.repository.PatientRepository
import com.example.kltn_novacare.data.remote.CreatePatientProfileRequest
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PatientViewModel(private val patientRepository: PatientRepository = PatientRepository()) : ViewModel() {
    private val _profiles = MutableStateFlow<NetworkState<List<PatientProfile>>>(NetworkState.Idle)
    val profiles = _profiles.asStateFlow()
    private val _profileOperation = MutableStateFlow<NetworkState<Unit>>(NetworkState.Idle)
    val profileOperation = _profileOperation.asStateFlow()
    private var loadJob: Job? = null

    fun loadProfiles() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _profiles.value = NetworkState.Loading
            patientRepository.getPatientProfiles().fold(
                onSuccess = { _profiles.value = NetworkState.Success(it) },
                onFailure = { _profiles.value = NetworkState.Error(it.message ?: "Lỗi tải danh sách hồ sơ") }
            )
        }
    }

    fun resetOperation() {
        if (_profileOperation.value !is NetworkState.Loading) _profileOperation.value = NetworkState.Idle
    }

    private fun <T> mutate(action: suspend () -> Result<T>, onSuccess: (T) -> Unit) {
        if (_profileOperation.value is NetworkState.Loading) return
        _profileOperation.value = NetworkState.Loading
        viewModelScope.launch {
            action().fold(
                onSuccess = {
                    _profileOperation.value = NetworkState.Success(Unit)
                    loadProfiles()
                    onSuccess(it)
                },
                onFailure = { _profileOperation.value = NetworkState.Error(it.message ?: "Không thể cập nhật hồ sơ") }
            )
        }
    }

    fun createProfile(request: CreatePatientProfileRequest, onSuccess: (PatientProfile) -> Unit) =
        mutate({ patientRepository.createPatientProfile(request) }, onSuccess)

    fun updateProfile(id: String, request: CreatePatientProfileRequest, onSuccess: () -> Unit) =
        mutate({ patientRepository.updatePatientProfile(id, request) }) { onSuccess() }

    fun deleteProfile(id: String, onSuccess: () -> Unit = {}) =
        mutate({ patientRepository.deletePatientProfile(id) }) { onSuccess() }

    fun setDefaultProfile(id: String, onSuccess: () -> Unit = {}) =
        mutate({ patientRepository.setDefaultPatientProfile(id) }) { onSuccess() }
}
