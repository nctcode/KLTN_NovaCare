package com.example.kltn_novacare.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.local.SearchHistoryManager
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.repository.SearchRepository
import com.example.kltn_novacare.ui.screens.search.location.LocationHelper
import com.example.kltn_novacare.ui.screens.search.location.UserLocationState
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SearchUiState(
    val query: String = "",
    val category: SearchCategory = SearchCategory.ALL,
    val filters: SearchFilters = SearchFilters(),
    val draftFilters: SearchFilters = SearchFilters(),
    val isFilterSheetVisible: Boolean = false,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val errorMessage: String? = null,
    val groupedData: UniversalSearchGroupedData? = null,
    val doctors: List<SearchDoctorItem> = emptyList(),
    val doctorTotal: Int = 0,
    val doctorPage: Int = 1,
    val doctorHasMore: Boolean = false,
    val facilities: List<SearchFacilityItem> = emptyList(),
    val facilityTotal: Int = 0,
    val facilityPage: Int = 1,
    val facilityHasMore: Boolean = false,
    val specialties: List<Specialty> = emptyList(),
    val specialtyTotal: Int = 0,
    val specialtyPage: Int = 1,
    val specialtyHasMore: Boolean = false,
    val popularData: PopularSearchData? = null,
    val recentSearches: List<String> = emptyList(),
    val locations: List<LocationDivision> = emptyList(),
    val locationState: UserLocationState = UserLocationState.Idle
) {
    val isQueryEmpty: Boolean
        get() = query.trim().isEmpty()

    val showEmptyState: Boolean
        get() {
            if (isLoading) return false
            return when (category) {
                SearchCategory.ALL -> {
                    val g = groupedData ?: return false
                    g.doctors.isEmpty() && g.hospitals.isEmpty() && g.clinics.isEmpty() &&
                            g.specialties.isEmpty() && g.services.isEmpty()
                }
                SearchCategory.DOCTOR -> doctors.isEmpty()
                SearchCategory.HOSPITAL, SearchCategory.CLINIC -> facilities.isEmpty()
                SearchCategory.SPECIALTY -> specialties.isEmpty()
                SearchCategory.SERVICE -> false
            }
        }
}

class SearchViewModel @JvmOverloads constructor(
    application: Application,
    private val repository: SearchRepository = SearchRepository()
) : AndroidViewModel(application) {

    class Factory(private val application: Application) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return SearchViewModel(application) as T
        }
    }

    private val historyManager = SearchHistoryManager(application)
    val locationHelper = LocationHelper(application)

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadInitialData()
    }

    private fun loadInitialData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(recentSearches = historyManager.getRecentSearches())

            // Load popular recommendations
            repository.getPopularSearch().onSuccess { popular ->
                _uiState.value = _uiState.value.copy(popularData = popular)
            }

            // Load location divisions catalog
            repository.getLocations().onSuccess { locs ->
                _uiState.value = _uiState.value.copy(locations = locs)
            }
        }
    }

    fun onQueryChanged(newQuery: String) {
        _uiState.value = _uiState.value.copy(query = newQuery)
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(350) // Debounce 350ms
            performSearch(resetPagination = true)
        }
    }

    fun onCategorySelected(newCategory: SearchCategory) {
        if (_uiState.value.category == newCategory) return
        _uiState.value = _uiState.value.copy(category = newCategory)
        performSearch(resetPagination = true)
    }

    fun performSearch(resetPagination: Boolean = true) {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            val state = _uiState.value
            val q = state.query.trim()
            val filters = state.filters

            // If query is empty and no filters applied, reset search results to show Popular & Recent
            if (q.isEmpty() && !filters.hasActiveFilters()) {
                _uiState.value = state.copy(
                    isLoading = false,
                    errorMessage = null,
                    groupedData = null,
                    doctors = emptyList(),
                    facilities = emptyList(),
                    specialties = emptyList()
                )
                return@launch
            }

            _uiState.value = state.copy(isLoading = true, errorMessage = null)

            when (state.category) {
                SearchCategory.ALL -> {
                    repository.searchGrouped(q, filters)
                        .onSuccess { data ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                groupedData = data,
                                errorMessage = null
                            )
                        }
                        .onFailure { error ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                errorMessage = error.localizedMessage ?: "Lỗi tải kết quả tìm kiếm"
                            )
                        }
                }
                SearchCategory.DOCTOR -> {
                    val page = if (resetPagination) 1 else state.doctorPage
                    repository.searchDoctors(q, filters, page = page, limit = 20)
                        .onSuccess { paged ->
                            val items = if (resetPagination) paged.items else state.doctors + paged.items
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                doctors = items,
                                doctorTotal = paged.total,
                                doctorPage = paged.page,
                                doctorHasMore = paged.hasMore,
                                errorMessage = null
                            )
                        }
                        .onFailure { error ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                errorMessage = error.localizedMessage ?: "Lỗi tải danh sách bác sĩ"
                            )
                        }
                }
                SearchCategory.HOSPITAL, SearchCategory.CLINIC -> {
                    val page = if (resetPagination) 1 else state.facilityPage
                    repository.searchFacilities(q, state.category, filters, page = page, limit = 20)
                        .onSuccess { paged ->
                            val items = if (resetPagination) paged.items else state.facilities + paged.items
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                facilities = items,
                                facilityTotal = paged.total,
                                facilityPage = paged.page,
                                facilityHasMore = paged.hasMore,
                                errorMessage = null
                            )
                        }
                        .onFailure { error ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                errorMessage = error.localizedMessage ?: "Lỗi tải danh sách cơ sở y tế"
                            )
                        }
                }
                SearchCategory.SPECIALTY -> {
                    val page = if (resetPagination) 1 else state.specialtyPage
                    repository.searchSpecialties(q, page = page, limit = 20)
                        .onSuccess { paged ->
                            val items = if (resetPagination) paged.items else state.specialties + paged.items
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                specialties = items,
                                specialtyTotal = paged.total,
                                specialtyPage = paged.page,
                                specialtyHasMore = paged.hasMore,
                                errorMessage = null
                            )
                        }
                        .onFailure { error ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                errorMessage = error.localizedMessage ?: "Lỗi tải danh sách chuyên khoa"
                            )
                        }
                }
                SearchCategory.SERVICE -> {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                }
            }
        }
    }

    fun loadMore() {
        val state = _uiState.value
        if (state.isLoading || state.isLoadingMore) return

        viewModelScope.launch {
            when (state.category) {
                SearchCategory.DOCTOR -> {
                    if (!state.doctorHasMore) return@launch
                    _uiState.value = state.copy(isLoadingMore = true)
                    val nextPage = state.doctorPage + 1
                    repository.searchDoctors(state.query.trim(), state.filters, page = nextPage, limit = 20)
                        .onSuccess { paged ->
                            _uiState.value = _uiState.value.copy(
                                isLoadingMore = false,
                                doctors = state.doctors + paged.items,
                                doctorTotal = paged.total,
                                doctorPage = paged.page,
                                doctorHasMore = paged.hasMore
                            )
                        }
                        .onFailure {
                            _uiState.value = _uiState.value.copy(isLoadingMore = false)
                        }
                }
                SearchCategory.HOSPITAL, SearchCategory.CLINIC -> {
                    if (!state.facilityHasMore) return@launch
                    _uiState.value = state.copy(isLoadingMore = true)
                    val nextPage = state.facilityPage + 1
                    repository.searchFacilities(state.query.trim(), state.category, state.filters, page = nextPage, limit = 20)
                        .onSuccess { paged ->
                            _uiState.value = _uiState.value.copy(
                                isLoadingMore = false,
                                facilities = state.facilities + paged.items,
                                facilityTotal = paged.total,
                                facilityPage = paged.page,
                                facilityHasMore = paged.hasMore
                            )
                        }
                        .onFailure {
                            _uiState.value = _uiState.value.copy(isLoadingMore = false)
                        }
                }
                SearchCategory.SPECIALTY -> {
                    if (!state.specialtyHasMore) return@launch
                    _uiState.value = state.copy(isLoadingMore = true)
                    val nextPage = state.specialtyPage + 1
                    repository.searchSpecialties(state.query.trim(), page = nextPage, limit = 20)
                        .onSuccess { paged ->
                            _uiState.value = _uiState.value.copy(
                                isLoadingMore = false,
                                specialties = state.specialties + paged.items,
                                specialtyTotal = paged.total,
                                specialtyPage = paged.page,
                                specialtyHasMore = paged.hasMore
                            )
                        }
                        .onFailure {
                            _uiState.value = _uiState.value.copy(isLoadingMore = false)
                        }
                }
                else -> Unit
            }
        }
    }

    fun onRecentQueryClicked(query: String) {
        historyManager.addSearch(query)
        _uiState.value = _uiState.value.copy(
            query = query,
            recentSearches = historyManager.getRecentSearches()
        )
        performSearch(resetPagination = true)
    }

    fun removeRecentQuery(query: String) {
        historyManager.removeSearch(query)
        _uiState.value = _uiState.value.copy(recentSearches = historyManager.getRecentSearches())
    }

    fun clearRecentQueries() {
        historyManager.clearAll()
        _uiState.value = _uiState.value.copy(recentSearches = emptyList())
    }

    fun saveCurrentQueryToHistory() {
        val q = _uiState.value.query.trim()
        if (q.isNotEmpty()) {
            historyManager.addSearch(q)
            _uiState.value = _uiState.value.copy(recentSearches = historyManager.getRecentSearches())
        }
    }

    // Filter bottom sheet actions
    fun openFilterSheet() {
        _uiState.value = _uiState.value.copy(
            isFilterSheetVisible = true,
            draftFilters = _uiState.value.filters
        )
    }

    fun closeFilterSheet() {
        _uiState.value = _uiState.value.copy(isFilterSheetVisible = false)
    }

    fun updateDraftFilters(transform: (SearchFilters) -> SearchFilters) {
        _uiState.value = _uiState.value.copy(draftFilters = transform(_uiState.value.draftFilters))
    }

    fun applyDraftFilters() {
        val draft = _uiState.value.draftFilters
        _uiState.value = _uiState.value.copy(
            filters = draft,
            isFilterSheetVisible = false
        )
        performSearch(resetPagination = true)
    }

    fun clearFilters() {
        _uiState.value = _uiState.value.copy(
            filters = SearchFilters(),
            draftFilters = SearchFilters()
        )
        performSearch(resetPagination = true)
    }

    fun removeFilterChip(type: String, id: String? = null) {
        val cur = _uiState.value.filters
        val updated = when (type) {
            "LOCATION" -> cur.copy(isNearMe = false, province = null, district = null, userLat = null, userLng = null)
            "PLACE_TYPE" -> cur.copy(placeType = null)
            "SPECIALTY" -> if (id != null) cur.copy(selectedSpecialtyIds = cur.selectedSpecialtyIds - id) else cur
            "SERVICE" -> if (id != null) cur.copy(selectedServices = cur.selectedServices - id) else cur
            else -> cur
        }
        _uiState.value = _uiState.value.copy(filters = updated, draftFilters = updated)
        performSearch(resetPagination = true)
    }

    fun requestNearestLocation(onPermissionNeeded: () -> Unit) {
        viewModelScope.launch {
            if (!locationHelper.hasLocationPermission()) {
                onPermissionNeeded()
                return@launch
            }

            _uiState.value = _uiState.value.copy(locationState = UserLocationState.Locating)
            val result = locationHelper.getCurrentLocation()
            _uiState.value = _uiState.value.copy(locationState = result)

            if (result is UserLocationState.Available) {
                val updated = _uiState.value.draftFilters.copy(
                    isNearMe = true,
                    province = null,
                    district = null,
                    userLat = result.latitude,
                    userLng = result.longitude
                )
                _uiState.value = _uiState.value.copy(draftFilters = updated)
            }
        }
    }

    fun onLocationPermissionResult(isGranted: Boolean) {
        if (isGranted) {
            requestNearestLocation {}
        } else {
            _uiState.value = _uiState.value.copy(locationState = UserLocationState.PermissionDenied)
        }
    }
}
