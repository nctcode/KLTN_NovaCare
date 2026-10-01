package com.example.kltn_novacare.data.model

import com.example.kltn_novacare.data.remote.CreatePatientProfileRequest
import java.time.LocalDate
import java.util.Locale

fun normalizedProfileGender(gender: String?): String = when (gender?.uppercase(Locale.ROOT)) {
    "NAM", "MALE" -> "MALE"
    "NU", "NỮ", "FEMALE" -> "FEMALE"
    else -> "OTHER"
}

data class PatientProfileFormData(
    val fullName: String = "",
    val phone: String = "",
    val dateOfBirth: String = "",
    val gender: String = "MALE",
    val identityNumber: String = "",
    val healthInsurance: String = "",
    val address: String = "",
    val relation: String = "Bản thân",
    val medicalHistory: String = "",
    val allergies: String = "",
    val emergencyContact: String = "",
    val emergencyPhone: String = "",
    val isDefault: Boolean = false
) {
    fun validationErrors(today: LocalDate = LocalDate.now()): Map<String, String> = buildMap {
        if (fullName.isBlank()) put("fullName", "Vui lòng nhập họ tên")
        val birth = runCatching { LocalDate.parse(dateOfBirth.trim()) }.getOrNull()
        if (birth == null) put("dateOfBirth", "Nhập ngày sinh hợp lệ theo YYYY-MM-DD")
        else if (birth.isAfter(today)) put("dateOfBirth", "Ngày sinh không được ở tương lai")
    }

    fun toRequest(isEditing: Boolean): CreatePatientProfileRequest = CreatePatientProfileRequest(
        fullName = fullName.trim(), phone = phone.trim(), dateOfBirth = dateOfBirth.trim(),
        gender = normalizedProfileGender(gender), identityCard = identityNumber.trim().ifBlank { null },
        healthInsurance = healthInsurance.trim().ifBlank { null }, address = address.trim().ifBlank { null },
        relationship = relation, medicalHistory = medicalHistory.trim().ifBlank { null },
        allergies = allergies.trim().ifBlank { null }, emergencyContact = emergencyContact.trim().ifBlank { null },
        emergencyPhone = emergencyPhone.trim().ifBlank { null },
        // Let the API choose the first profile as default when creating.
        isDefault = if (isEditing || isDefault) isDefault else null
    )

    companion object {
        fun from(profile: PatientProfile?) = profile?.let {
            PatientProfileFormData(
                fullName = it.fullName, phone = it.phone.orEmpty(),
                dateOfBirth = it.dateOfBirth?.substringBefore('T').orEmpty(),
                gender = normalizedProfileGender(it.gender), identityNumber = it.identityCard.orEmpty(),
                healthInsurance = it.healthInsurance.orEmpty(), address = it.address.orEmpty(),
                relation = it.displayRelationship, medicalHistory = it.medicalHistory.orEmpty(),
                allergies = it.allergies.orEmpty(), emergencyContact = it.emergencyContact.orEmpty(),
                emergencyPhone = it.emergencyPhone.orEmpty(), isDefault = it.isDefault
            )
        } ?: PatientProfileFormData()
    }
}
