package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.repository.DoctorRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HospitalDetailUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val hospital: Hospital? = null,
    val branches: List<HospitalBranch> = emptyList(),
    val doctors: List<Doctor> = emptyList(),
    val specialties: List<Specialty> = emptyList(),
    val services: List<MedicalService> = emptyList(),
    val reviewStats: PublicReviewStats? = null,
    val reviews: List<PublicReviewItem> = emptyList()
)

class HospitalDetailViewModel(
    private val repository: DoctorRepository = DoctorRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(HospitalDetailUiState())
    val uiState: StateFlow<HospitalDetailUiState> = _uiState.asStateFlow()

    private var loadedHospitalId: String? = null

    fun loadHospitalDetail(hospitalId: String, forceRefresh: Boolean = false) {
        if (!forceRefresh && loadedHospitalId == hospitalId && _uiState.value.hospital != null) {
            return
        }
        loadedHospitalId = hospitalId
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val hospitalDeferred = async { repository.getHospitalById(hospitalId) }
            val branchesDeferred = async { repository.getHospitalBranches(hospitalId) }
            val doctorsDeferred = async { repository.searchDoctors(hospitalId = hospitalId, limit = 100) }
            val specialtiesDeferred = async { repository.getHospitalSpecialties(hospitalId) }
            val reviewStatsDeferred = async { repository.getPublicHospitalReviewStats(hospitalId) }
            val reviewsDeferred = async { repository.getPublicHospitalReviews(hospitalId) }

            val hospitalResult = hospitalDeferred.await()
            hospitalResult.fold(
                onSuccess = { hospital ->
                    val fetchedBranches = branchesDeferred.await().getOrNull().orEmpty()
                    val mergedBranches = if (fetchedBranches.isNotEmpty()) {
                        fetchedBranches
                    } else {
                        hospital.branches.orEmpty()
                    }

                    val fetchedDoctors = doctorsDeferred.await().getOrNull().orEmpty()
                    val fallbackDoctors = hospital.workPlaces.orEmpty()
                        .mapNotNull { wp ->
                            wp.doctor?.copy(workPlaces = listOf(wp.copy(hospital = hospital)))
                        }
                        .distinctBy { it.id }
                    val mergedDoctors = if (fetchedDoctors.isNotEmpty()) fetchedDoctors else fallbackDoctors

                    val fetchedSpecs = specialtiesDeferred.await().getOrNull().orEmpty()
                    val fallbackSpecs = hospital.hospitalSpecialties.orEmpty().mapNotNull { it.specialty }
                    val wpSpecs = hospital.workPlaces.orEmpty().mapNotNull { it.specialty }
                    val mergedSpecs = (fetchedSpecs + fallbackSpecs + wpSpecs)
                        .distinctBy { it.id }
                        .sortedBy { it.name }

                    val stats = reviewStatsDeferred.await().getOrNull()
                    val reviewPage = reviewsDeferred.await().getOrNull()

                    _uiState.value = HospitalDetailUiState(
                        isLoading = false,
                        error = null,
                        hospital = hospital,
                        branches = mergedBranches,
                        doctors = mergedDoctors,
                        specialties = mergedSpecs,
                        services = hospital.services.orEmpty(),
                        reviewStats = stats,
                        reviews = reviewPage?.items.orEmpty()
                    )
                },
                onFailure = { err ->
                    _uiState.value = HospitalDetailUiState(
                        isLoading = false,
                        error = err.message ?: "Không thể tải thông tin cơ sở y tế"
                    )
                }
            )
        }
    }
}
