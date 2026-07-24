package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.Specialty
import com.example.kltn_novacare.data.model.Hospital
import com.example.kltn_novacare.data.model.Doctor
import com.example.kltn_novacare.data.model.AppointmentSlot
import com.example.kltn_novacare.data.repository.DoctorRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class NetworkState<out T> {
    object Idle : NetworkState<Nothing>()
    object Loading : NetworkState<Nothing>()
    data class Success<out T>(val data: T) : NetworkState<T>()
    data class Error(val message: String) : NetworkState<Nothing>()
}

class DoctorViewModel(private val doctorRepository: DoctorRepository = DoctorRepository()) : ViewModel() {

    private val _specialties = MutableStateFlow<NetworkState<List<Specialty>>>(NetworkState.Idle)
    val specialties: StateFlow<NetworkState<List<Specialty>>> = _specialties.asStateFlow()

    private val _hospitals = MutableStateFlow<NetworkState<List<Hospital>>>(NetworkState.Idle)
    val hospitals: StateFlow<NetworkState<List<Hospital>>> = _hospitals.asStateFlow()

    private val _doctors = MutableStateFlow<NetworkState<List<Doctor>>>(NetworkState.Idle)
    val doctors: StateFlow<NetworkState<List<Doctor>>> = _doctors.asStateFlow()

    private val _doctorDetails = MutableStateFlow<NetworkState<Doctor>>(NetworkState.Idle)
    val doctorDetails: StateFlow<NetworkState<Doctor>> = _doctorDetails.asStateFlow()

    private val _availableSlots = MutableStateFlow<NetworkState<List<AppointmentSlot>>>(NetworkState.Idle)
    val availableSlots: StateFlow<NetworkState<List<AppointmentSlot>>> = _availableSlots.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            loadSpecialties()
            loadHospitals()
            searchDoctors()
        }
    }

    fun loadSpecialties() {
        viewModelScope.launch {
            _specialties.value = NetworkState.Loading
            doctorRepository.getSpecialties().fold(
                onSuccess = { _specialties.value = NetworkState.Success(it) },
                onFailure = { _specialties.value = NetworkState.Error(it.message ?: "Lỗi tải chuyên khoa") }
            )
        }
    }

    fun loadHospitals() {
        viewModelScope.launch {
            _hospitals.value = NetworkState.Loading
            doctorRepository.getHospitals().fold(
                onSuccess = { _hospitals.value = NetworkState.Success(it) },
                onFailure = { _hospitals.value = NetworkState.Error(it.message ?: "Lỗi tải bệnh viện") }
            )
        }
    }

    fun searchDoctors(
        query: String? = null,
        specialtyId: String? = null,
        hospitalId: String? = null
    ) {
        viewModelScope.launch {
            _doctors.value = NetworkState.Loading
            doctorRepository.searchDoctors(query, specialtyId, hospitalId).fold(
                onSuccess = { _doctors.value = NetworkState.Success(it) },
                onFailure = { _doctors.value = NetworkState.Error(it.message ?: "Lỗi tìm bác sĩ") }
            )
        }
    }

    fun getDoctorById(id: String) {
        viewModelScope.launch {
            _doctorDetails.value = NetworkState.Loading
            doctorRepository.getDoctorById(id).fold(
                onSuccess = { _doctorDetails.value = NetworkState.Success(it) },
                onFailure = { _doctorDetails.value = NetworkState.Error(it.message ?: "Không tìm thấy bác sĩ") }
            )
        }
    }

    fun loadAvailableSlots(doctorId: String, workplaceId: String, date: String) {
        viewModelScope.launch {
            _availableSlots.value = NetworkState.Loading
            doctorRepository.getAvailableSlots(doctorId, workplaceId, date).fold(
                onSuccess = { _availableSlots.value = NetworkState.Success(it) },
                onFailure = { _availableSlots.value = NetworkState.Error(it.message ?: "Lỗi tải khung giờ") }
            )
        }
    }
}
