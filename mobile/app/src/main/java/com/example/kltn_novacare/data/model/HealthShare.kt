package com.example.kltn_novacare.data.model

import java.time.Instant

// Values used by the web interoperability portal.
val healthShareSections = listOf(
    "Thông tin hành chính", "Thông tin lần khám", "Kết quả khám",
    "Cận lâm sàng", "Chẩn đoán", "Điều trị", "Kết quả & tái khám"
)

data class CreateHealthShareRequest(
    val validMinutes: Int,
    val allowedSections: List<String>,
    val sharedWith: String = "Bất kỳ bệnh viện nào có mã",
    // Omit to let the server generate a PIN; never generate credentials locally.
    val pinCode: String? = null
)

data class HealthShare(
    val id: String,
    val shareToken: String,
    val validUntil: String,
    val pinCode: String? = null,
    val sharedWith: String? = null,
    val allowedSections: List<String>? = null,
    val isActive: Boolean? = null,
    val revokedAt: String? = null,
    val accessCount: Int = 0
) {
    fun isUsable(now: Instant = Instant.now()): Boolean =
        isActive != false && revokedAt == null &&
            runCatching { Instant.parse(validUntil).isAfter(now) }.getOrDefault(false)
}
