package com.example.kltn_novacare.data.model

import com.google.gson.JsonElement
import com.google.gson.annotations.SerializedName

fun parseJsonElementToDouble(element: JsonElement?): Double? {
    if (element == null || element.isJsonNull) return null
    return try {
        if (element.isJsonPrimitive) {
            val primitive = element.asJsonPrimitive
            if (primitive.isNumber) {
                primitive.asDouble
            } else if (primitive.isString) {
                primitive.asString.toDoubleOrNull()
            } else {
                null
            }
        } else null
    } catch (e: Exception) {
        null
    }
}

data class User(
    val id: String,
    val email: String,
    val phone: String?,
    val fullName: String,
    val role: String,
    val isActive: Boolean
)

data class AuthResponse(
    val user: User,
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long
)

data class PatientProfile(
    val id: String,
    val userId: String,
    val fullName: String,
    val phone: String,
    val email: String?,
    val dateOfBirth: String, // yyyy-MM-dd
    val gender: String,      // NAM, NU, KHAC
    val identityCard: String?,
    val healthInsurance: String?,
    val address: String?,
    val relationship: String, // BAN_THAN, CHA_ME, VO_CHONG, CON_CAI, HO_HANG, KHAC
    val isDefault: Boolean = false
)

data class Hospital(
    val id: String,
    val name: String,
    val address: String? = null,
    val province: String? = null,
    val district: String? = null,
    val description: String? = null,
    val image: String? = null,
    val logo: String? = null,
    @SerializedName("logoUrl") val logoUrl: String? = null,
    @SerializedName("coverImageUrl") val coverImageUrl: String? = null,
    val city: String? = null,
    val phone: String? = null,
    val hotline: String? = null,
    val operatingHours: String? = null,
    val rating: Double? = null,
    val reviewCount: Int? = null
) {
    val displayAddress: String
        get() = address?.takeIf { it.isNotBlank() } ?: city ?: "Việt Nam"

    val displayLogo: String?
        get() = logoUrl?.takeIf { it.isNotBlank() } ?: logo?.takeIf { it.isNotBlank() } ?: image

    val displayCoverImage: String?
        get() = coverImageUrl?.takeIf { it.isNotBlank() } ?: image
}

data class Specialty(
    val id: String,
    val name: String,
    val description: String? = null,
    val image: String? = null,
    val icon: String? = null,
    @SerializedName("coverImageUrl") val coverImageUrl: String? = null
)

data class Doctor(
    val id: String,
    val fullName: String,
    val title: String? = null, // Thạc sĩ, Bác sĩ CKI...
    val avatar: String? = null,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    val qualification: String? = null,
    val yearsOfExperience: Int? = null,
    val description: String? = null,
    val experience: String? = null,
    val bio: String? = null,
    val gender: String? = null,
    val rating: Double = 5.0,
    val reviewCount: Int = 0,
    val consultationCount: Int = 0,
    val specialties: List<Specialty>? = null,
    val hospital: Hospital? = null,
    val workPlaces: List<DoctorWorkplace>? = null
)

data class DoctorWorkplace(
    val id: String,
    val doctorId: String? = null,
    val hospitalId: String? = null,
    val branchId: String? = null,
    val specialtyId: String? = null,
    @SerializedName("consultationFee") val rawConsultationFee: JsonElement? = null,
    @SerializedName("price") val rawPrice: JsonElement? = null,
    val position: String? = null,
    val hospital: Hospital? = null,
    val specialty: Specialty? = null
) {
    val consultationFee: Double?
        get() = parseJsonElementToDouble(rawConsultationFee ?: rawPrice)

    val price: Double?
        get() = parseJsonElementToDouble(rawPrice ?: rawConsultationFee)

    constructor(
        id: String,
        doctorId: String? = null,
        hospitalId: String? = null,
        branchId: String? = null,
        specialtyId: String? = null,
        consultationFee: Double? = null,
        price: Double? = null,
        position: String? = null,
        hospital: Hospital? = null,
        specialty: Specialty? = null
    ) : this(
        id = id,
        doctorId = doctorId,
        hospitalId = hospitalId,
        branchId = branchId,
        specialtyId = specialtyId,
        rawConsultationFee = consultationFee?.let { com.google.gson.JsonPrimitive(it) },
        rawPrice = price?.let { com.google.gson.JsonPrimitive(it) },
        position = position,
        hospital = hospital,
        specialty = specialty
    )
}

fun getDoctorAvatarUrl(doctorId: String?, fullName: String?, avatarUrl: String?, avatar: String?): String {
    val femaleAvatars = listOf(
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1594824813573-246434de83fb?w=400&auto=format&fit=crop&q=80"
    )

    val maleAvatars = listOf(
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1625134673337-519d4d10b463?w=400&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80"
    )

    val rawUrl = avatarUrl?.takeIf { it.isNotBlank() } ?: avatar?.takeIf { it.isNotBlank() }
    if (rawUrl != null) {
        return rawUrl
    }

    val nameClean = (fullName ?: "").replace("PGS.TS", "").replace("TS.BS", "").replace("BS.CKII", "").replace("BS.CKI", "").replace("ThS.BS", "").replace("BS", "").trim()
    val parts = nameClean.lowercase().split("\\s+".toRegex()).filter { it.isNotBlank() }
    val lastName = parts.lastOrNull() ?: ""
    val middleName = if (parts.size > 1) parts[parts.size - 2] else ""

    val femaleGivenNames = setOf(
        "hằng", "liên", "dung", "phương", "mai", "lan", "hương", "trang", "phượng", "mỹ",
        "linh", "thu", "thảo", "yến", "uyên", "tâm", "quuyên", "hà", "vân", "ánh",
        "vy", "quỳnh", "loan", "thúy", "thi", "hoa", "nhi", "ngọc"
    )

    val isFemale = when {
        femaleGivenNames.contains(lastName) -> true
        middleName == "thị" -> true
        else -> false
    }

    val str = doctorId ?: fullName ?: "doctor"
    var hash = 0
    for (ch in str) {
        hash = (hash shl 5) - hash + ch.code
    }
    val index = kotlin.math.abs(hash)

    return if (isFemale) {
        femaleAvatars[index % femaleAvatars.size]
    } else {
        maleAvatars[index % maleAvatars.size]
    }
}

val Doctor.displayTitle: String
    get() {
        val t = title?.trim()
        if (!t.isNullOrEmpty()) return t
        return if (fullName.startsWith("BS") || fullName.startsWith("TS") || fullName.startsWith("PGS")) "" else "BS.CKII"
    }

val Doctor.displayFullNameWithTitle: String
    get() {
        val dt = displayTitle
        return if (dt.isBlank() || fullName.startsWith(dt)) fullName else "$dt $fullName"
    }

val Doctor.displaySpecialty: String
    get() {
        val wpSpecs = workPlaces?.mapNotNull { it.specialty?.name }?.filter { it.isNotBlank() }?.distinct()
        if (!wpSpecs.isNullOrEmpty()) {
            return wpSpecs.joinToString(", ")
        }
        val specs = specialties?.mapNotNull { it.name }?.filter { it.isNotBlank() }?.distinct()
        if (!specs.isNullOrEmpty()) {
            return specs.joinToString(", ")
        }
        return "Đa khoa"
    }

val Doctor.displayHospital: String
    get() {
        return workPlaces?.firstOrNull()?.hospital?.name
            ?: hospital?.name
            ?: "Bệnh viện Đa khoa NovaCare"
    }

val Doctor.displayHospitalAddress: String
    get() {
        return workPlaces?.firstOrNull()?.hospital?.address
            ?: hospital?.address
            ?: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội"
    }

val Doctor.displayPrice: Double
    get() {
        return workPlaces?.firstOrNull()?.let { it.consultationFee ?: it.price }
            ?: 200000.0
    }

val Doctor.displayAvatarUrl: String
    get() = getDoctorAvatarUrl(id, fullName, avatarUrl, avatar)

val Doctor.displayRating: Double
    get() = if (rating > 0) rating else 4.85

val Doctor.displayReviewCount: Int
    get() = if (reviewCount > 0) reviewCount else 120

data class AppointmentSlot(
    val id: String,
    val workplaceId: String? = null,
    val doctorWorkplaceId: String? = null,
    val startTime: String, // ISO String or HH:mm
    val endTime: String,
    val capacity: Int = 1,
    val bookedCount: Int = 0,
    @SerializedName("price") val rawPrice: JsonElement? = null,
    val version: Int = 0
) {
    val price: Double
        get() = parseJsonElementToDouble(rawPrice) ?: 200000.0
}

data class AppointmentStatusHistory(
    val id: String,
    val appointmentId: String,
    val status: String,
    val note: String?,
    val colorHex: String?,
    val createdAt: String
)

data class Appointment(
    val id: String,
    val userId: String,
    val patientProfileId: String,
    val slotId: String,
    val bookingCode: String,
    val status: String, // PENDING, CONFIRMED, PAID...
    val paymentStatus: String? = null, // UNPAID, PAID, REFUNDED...
    val paymentMethod: String? = null, // VNPAY, CASH...
    val reason: String? = null,
    val symptoms: String? = null,
    val notes: String? = null,
    @SerializedName("totalPrice") val rawTotalPrice: JsonElement? = null,
    @SerializedName("totalAmount") val rawTotalAmount: JsonElement? = null,
    val createdAt: String,
    val slot: AppointmentSlot? = null,
    val patientProfile: PatientProfile? = null,
    val workplace: DoctorWorkplace? = null,
    val statusHistory: List<AppointmentStatusHistory>? = null
) {
    val totalAmount: Double
        get() = parseJsonElementToDouble(rawTotalPrice ?: rawTotalAmount) ?: 200000.0
}

data class Notification(
    val id: String,
    val userId: String,
    val title: String,
    val content: String,
    val type: String,
    val isRead: Boolean,
    val createdAt: String
)

data class MedicalService(
    val id: String,
    val hospitalId: String,
    val specialtyId: String? = null,
    val name: String,
    val description: String? = null,
    val category: String? = "EXAMINATION",
    val preparationNote: String? = null,
    val estimatedResultTime: String? = null,
    @SerializedName("price") val rawPrice: JsonElement? = null,
    val duration: Int = 30,
    val isActive: Boolean = true,
    val hospital: Hospital? = null,
    val specialty: Specialty? = null
) {
    val price: Double
        get() = parseJsonElementToDouble(rawPrice) ?: 150000.0
}

data class HealthPackage(
    val id: String,
    val hospitalId: String?,
    val name: String,
    val description: String? = null,
    @SerializedName("price") val rawPrice: JsonElement? = null,
    val duration: Int = 60,
    val services: List<String>? = null,
    val isActive: Boolean = true,
    val hospital: Hospital? = null
) {
    val price: Double
        get() = parseJsonElementToDouble(rawPrice) ?: 500000.0
}

data class HospitalBranch(
    val id: String,
    val hospitalId: String,
    val name: String?,
    val address: String,
    val phone: String?,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val isActive: Boolean = true,
    val hospital: Hospital? = null
)

// Base API wrapper structures
data class ApiResponse<T>(
    val statusCode: Int?,
    val message: String?,
    val data: T?,
    val error: String?
) {
    val success: Boolean
        get() = statusCode == null || statusCode in 200..299
}

