package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.PatientProfile
import com.example.kltn_novacare.data.repository.PatientRepository
import com.example.kltn_novacare.data.remote.CreatePatientProfileRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PatientViewModel(private val patientRepository: PatientRepository = PatientRepository()) : ViewModel() {

    private val _profiles = MutableStateFlow<NetworkState<List<PatientProfile>>>(NetworkState.Idle)
    val profiles: StateFlow<NetworkState<List<PatientProfile>>> = _profiles.asStateFlow()

    private val _profileOperation = MutableStateFlow<NetworkState<PatientProfile>>(NetworkState.Idle)
    val profileOperation: StateFlow<NetworkState<PatientProfile>> = _profileOperation.asStateFlow()

    init {
        loadProfiles()
    }

    fun loadProfiles() {
        viewModelScope.launch {
            _profiles.value = NetworkState.Loading
            patientRepository.getPatientProfiles().fold(
                onSuccess = { _profiles.value = NetworkState.Success(it) },
                onFailure = { _profiles.value = NetworkState.Error(it.message ?: "Lỗi tải danh sách hồ sơ") }
            )
        }
    }

    fun createProfile(request: CreatePatientProfileRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _profileOperation.value = NetworkState.Loading
            patientRepository.createPatientProfile(request).fold(
                onSuccess = {
                    _profileOperation.value = NetworkState.Success(it)
                    loadProfiles()
                    onSuccess()
                },
                onFailure = {
                    _profileOperation.value = NetworkState.Error(it.message ?: "Tạo hồ sơ thất bại")
                }
            )
        }
    }

    fun updateProfile(id: String, request: CreatePatientProfileRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _profileOperation.value = NetworkState.Loading
            patientRepository.updatePatientProfile(id, request).fold(
                onSuccess = {
                    _profileOperation.value = NetworkState.Success(it)
                    loadProfiles()
                    onSuccess()
                },
                onFailure = {
                    _profileOperation.value = NetworkState.Error(it.message ?: "Cập nhật hồ sơ thất bại")
                }
            )
        }
    }

    fun deleteProfile(id: String) {
        viewModelScope.launch {
            patientRepository.deletePatientProfile(id).fold(
                onSuccess = { loadProfiles() },
                onFailure = { /* Handle error silently or post value */ }
            )
        }
    }

    fun setDefaultProfile(id: String) {
        viewModelScope.launch {
            patientRepository.setDefaultPatientProfile(id).fold(
                onSuccess = { loadProfiles() },
                onFailure = { /* Handle error */ }
            )
        }
    }
}
