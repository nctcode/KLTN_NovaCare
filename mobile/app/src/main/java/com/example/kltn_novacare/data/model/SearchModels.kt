package com.example.kltn_novacare.data.model

import com.google.gson.annotations.SerializedName

enum class SearchCategory(val label: String, val apiValue: String) {
    ALL("Tất cả", "ALL"),
    DOCTOR("Bác sĩ", "DOCTOR"),
    HOSPITAL("Bệnh viện", "HOSPITAL"),
    CLINIC("Phòng khám", "CLINIC"),
    SPECIALTY("Chuyên khoa", "SPECIALTY"),
    SERVICE("Dịch vụ", "SERVICE")
}

enum class SearchSortBy(val apiValue: String) {
    RELEVANCE("relevance"),
    DISTANCE("distance")
}

data class SearchDoctorItem(
    val id: String,
    val fullName: String,
    val title: String? = null,
    val avatarUrl: String? = null,
    val qualification: String? = null,
    val yearsOfExperience: Int? = null,
    val rating: Double = 5.0,
    val reviewCount: Int = 0,
    val consultationCount: Int = 0,
    val specialties: List<Specialty>? = null,
    val hospital: Hospital? = null,
    val distanceKm: Double? = null,
    val nearestFacilityName: String? = null,
    val workPlaces: List<DoctorWorkplace>? = null
) {
    val displayTitle: String
        get() = when {
            !title.isNullOrBlank() -> "$title $fullName"
            !qualification.isNullOrBlank() -> "$qualification $fullName"
            else -> "BS. $fullName"
        }

    val displaySpecialties: String
        get() = specialties?.joinToString(", ") { it.name } ?: "Đa khoa"

    val displayDistance: String?
        get() = formatDistance(distanceKm)
}

data class SearchFacilityItem(
    val id: String,
    val name: String,
    val address: String? = null,
    val city: String? = null,
    val type: String? = null,
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    val logoUrl: String? = null,
    val coverImageUrl: String? = null,
    val phone: String? = null,
    val hotline: String? = null,
    val operatingHours: String? = null,
    val distanceKm: Double? = null,
    val branchesCount: Int = 0,
    val specialties: List<Specialty>? = null
) {
    val displayAddress: String
        get() = address?.takeIf { it.isNotBlank() } ?: city ?: "TP. Hồ Chí Minh"

    val displayDistance: String?
        get() = formatDistance(distanceKm)
}

data class UniversalSearchGroupedData(
    val category: String,
    val doctors: List<SearchDoctorItem> = emptyList(),
    val doctorsCount: Int = 0,
    val hospitals: List<SearchFacilityItem> = emptyList(),
    val hospitalsCount: Int = 0,
    val clinics: List<SearchFacilityItem> = emptyList(),
    val clinicsCount: Int = 0,
    val specialties: List<Specialty> = emptyList(),
    val specialtiesCount: Int = 0,
    val services: List<MedicalService> = emptyList(),
    val servicesCount: Int = 0
)

data class UniversalSearchPagedData<T>(
    val category: String,
    val total: Int,
    val page: Int,
    val limit: Int,
    val hasMore: Boolean,
    val items: List<T> = emptyList()
)

data class PopularSearchData(
    val popularSpecialties: List<Specialty> = emptyList(),
    val popularHospitals: List<SearchFacilityItem> = emptyList(),
    val popularClinics: List<SearchFacilityItem> = emptyList()
)

data class LocationDivision(
    val province: String,
    val districts: List<String> = emptyList()
)

data class SearchFilters(
    val isNearMe: Boolean = false,
    val province: String? = null,
    val district: String? = null,
    val placeType: String? = null, // "Bác sĩ", "Bệnh viện", "Phòng khám"
    val selectedSpecialtyIds: Set<String> = emptySet(),
    val selectedServices: Set<String> = emptySet(), // "KhamBenh", "TuVanTuXa", "GoiKham"
    val userLat: Double? = null,
    val userLng: Double? = null
) {
    val activeCount: Int
        get() {
            var count = 0
            if (isNearMe || !province.isNullOrBlank() || !district.isNullOrBlank()) count++
            if (!placeType.isNullOrBlank()) count++
            if (selectedSpecialtyIds.isNotEmpty()) count += selectedSpecialtyIds.size
            if (selectedServices.isNotEmpty()) count += selectedServices.size
            return count
        }

    fun hasActiveFilters(): Boolean = activeCount > 0

    val locationLabel: String?
        get() = when {
            isNearMe -> "Gần nhất"
            !district.isNullOrBlank() && !province.isNullOrBlank() -> "$district, $province"
            !province.isNullOrBlank() -> province
            else -> null
        }
}

fun formatDistance(distanceKm: Double?): String? {
    if (distanceKm == null || distanceKm < 0) return null
    return if (distanceKm < 1.0) {
        val meters = (distanceKm * 1000).toInt()
        "$meters m"
    } else {
        String.format(java.util.Locale.US, "%.1f km", distanceKm)
    }
}
