package com.example.kltn_novacare.domain.service

import java.io.File

enum class ImageQualityStatus(val displayName: String, val isValid: Boolean) {
    EXCELLENT("Ảnh rất rõ nét, ánh sáng tốt", true),
    GOOD("Chất lượng ảnh đạt tiêu chuẩn", true),
    ACCEPTABLE("Ảnh tạm chấp nhận", true),
    POOR_BLURRY("Ảnh bị mờ nét, vui lòng chụp lại", false),
    POOR_DARK("Ảnh thiếu ánh sáng, vui lòng mở đèn flash", false)
}

data class VisionFinding(
    val type: String,        // e.g. "redness", "swelling", "lesion", "rash"
    val displayName: String, // e.g. "Tăng sinh mạch / Đỏ da", "Phù nề mô nôn"
    val confidence: Double   // 0.0 - 1.0
)

data class VisionAnalysisResult(
    val imageQuality: ImageQualityStatus,
    val findings: List<VisionFinding>,
    val isDemoMode: Boolean = true,
    val summaryMessage: String
)

interface VisionAnalysisService {
    suspend fun analyzeClinicalImage(file: File): VisionAnalysisResult
    fun checkImageQuality(file: File): ImageQualityStatus
}

object DefaultVisionAnalysisService : VisionAnalysisService {

    override fun checkImageQuality(file: File): ImageQualityStatus {
        if (!file.exists() || file.length() == 0L) {
            return ImageQualityStatus.POOR_BLURRY
        }
        val sizeKb = file.length() / 1024
        return when {
            sizeKb < 20 -> ImageQualityStatus.POOR_BLURRY
            sizeKb > 100 -> ImageQualityStatus.EXCELLENT
            else -> ImageQualityStatus.GOOD
        }
    }

    override suspend fun analyzeClinicalImage(file: File): VisionAnalysisResult {
        val quality = checkImageQuality(file)
        if (!quality.isValid) {
            return VisionAnalysisResult(
                imageQuality = quality,
                findings = emptyList(),
                isDemoMode = true,
                summaryMessage = quality.displayName
            )
        }

        // Mock structured vision model findings for demo/clinical inspection
        val findings = listOf(
            VisionFinding(type = "redness", displayName = "Sung huyết / Đỏ vùng tổn thương", confidence = 0.86),
            VisionFinding(type = "swelling", displayName = "Sưng nề mô mềm nhẹ", confidence = 0.72)
        )

        return VisionAnalysisResult(
            imageQuality = quality,
            findings = findings,
            isDemoMode = true,
            summaryMessage = "Đã phân tích 2 đặc điểm lâm sàng từ hình ảnh (Đỏ da 86%, Sưng nề 72%)."
        )
    }
}
