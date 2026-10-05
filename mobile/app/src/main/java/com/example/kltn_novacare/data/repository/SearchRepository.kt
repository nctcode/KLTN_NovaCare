package com.example.kltn_novacare.data.repository

import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.ApiClient
import com.example.kltn_novacare.data.remote.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SearchRepository(
    private val apiService: ApiService = ApiClient.getService()
) {
    suspend fun searchGrouped(
        query: String?,
        filters: SearchFilters
    ): Result<UniversalSearchGroupedData> = withContext(Dispatchers.IO) {
        try {
            val specialtyIds = if (filters.selectedSpecialtyIds.isNotEmpty()) {
                filters.selectedSpecialtyIds.joinToString(",")
            } else null

            val services = if (filters.selectedServices.isNotEmpty()) {
                filters.selectedServices.joinToString(",")
            } else null

            val sort = if (filters.isNearMe) SearchSortBy.DISTANCE.apiValue else SearchSortBy.RELEVANCE.apiValue

            val response = apiService.universalSearchGrouped(
                query = query?.ifBlank { null },
                category = "ALL",
                specialtyIds = specialtyIds,
                facilityType = filters.placeType,
                services = services,
                province = if (!filters.isNearMe) filters.province else null,
                district = if (!filters.isNearMe) filters.district else null,
                lat = if (filters.isNearMe) filters.userLat else null,
                lng = if (filters.isNearMe) filters.userLng else null,
                sort = sort
            ).execute()

            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Lỗi tải kết quả tìm kiếm"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchDoctors(
        query: String?,
        filters: SearchFilters,
        page: Int = 1,
        limit: Int = 20
    ): Result<UniversalSearchPagedData<SearchDoctorItem>> = withContext(Dispatchers.IO) {
        try {
            val specialtyIds = if (filters.selectedSpecialtyIds.isNotEmpty()) {
                filters.selectedSpecialtyIds.joinToString(",")
            } else null

            val services = if (filters.selectedServices.isNotEmpty()) {
                filters.selectedServices.joinToString(",")
            } else null

            val sort = if (filters.isNearMe) SearchSortBy.DISTANCE.apiValue else SearchSortBy.RELEVANCE.apiValue

            val response = apiService.universalSearchDoctors(
                query = query?.ifBlank { null },
                category = "DOCTOR",
                specialtyIds = specialtyIds,
                facilityType = filters.placeType,
                services = services,
                province = if (!filters.isNearMe) filters.province else null,
                district = if (!filters.isNearMe) filters.district else null,
                lat = if (filters.isNearMe) filters.userLat else null,
                lng = if (filters.isNearMe) filters.userLng else null,
                sort = sort,
                page = page,
                limit = limit
            ).execute()

            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Lỗi tải danh sách bác sĩ"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchFacilities(
        query: String?,
        category: SearchCategory,
        filters: SearchFilters,
        page: Int = 1,
        limit: Int = 20
    ): Result<UniversalSearchPagedData<SearchFacilityItem>> = withContext(Dispatchers.IO) {
        try {
            val specialtyIds = if (filters.selectedSpecialtyIds.isNotEmpty()) {
                filters.selectedSpecialtyIds.joinToString(",")
            } else null

            val services = if (filters.selectedServices.isNotEmpty()) {
                filters.selectedServices.joinToString(",")
            } else null

            val sort = if (filters.isNearMe) SearchSortBy.DISTANCE.apiValue else SearchSortBy.RELEVANCE.apiValue

            val response = apiService.universalSearchFacilities(
                query = query?.ifBlank { null },
                category = if (category == SearchCategory.CLINIC) "CLINIC" else "HOSPITAL",
                specialtyIds = specialtyIds,
                facilityType = filters.placeType,
                services = services,
                province = if (!filters.isNearMe) filters.province else null,
                district = if (!filters.isNearMe) filters.district else null,
                lat = if (filters.isNearMe) filters.userLat else null,
                lng = if (filters.isNearMe) filters.userLng else null,
                sort = sort,
                page = page,
                limit = limit
            ).execute()

            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Lỗi tải danh sách cơ sở y tế"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchSpecialties(
        query: String?,
        page: Int = 1,
        limit: Int = 20
    ): Result<UniversalSearchPagedData<Specialty>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.universalSearchSpecialties(
                query = query?.ifBlank { null },
                category = "SPECIALTY",
                page = page,
                limit = limit
            ).execute()

            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Lỗi tải danh sách chuyên khoa"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPopularSearch(): Result<PopularSearchData> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPopularSearch().execute()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Lỗi tải thông tin phổ biến"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLocations(): Result<List<LocationDivision>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getSearchLocations().execute()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Lỗi tải danh mục địa giới"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
