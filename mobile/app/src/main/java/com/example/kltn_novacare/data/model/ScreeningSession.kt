package com.example.kltn_novacare.data.model

import java.util.Date
import java.util.UUID

enum class ScreeningSessionStatus {
    NOT_STARTED,
    IN_PROGRESS,
    COMPLETED,
    SKIPPED,
    ABORTED
}

enum class RiskLevel(val label: String, val colorHex: String) {
    LOW("Thấp - Có thể tự theo dõi", "#22C55E"),
    MEDIUM("Trung Bình - Nên khám bác sĩ", "#F59E0B"),
    HIGH("Cao - Nên khám sớm", "#EA580C"),
    VERY_HIGH("Rất Cao - Cần đánh giá y tế khẩn", "#DC2626"),
    EMERGENCY("🔴 CẦN ĐẾN CẤP CỨU NGAY", "#991B1B")
}

enum class ActionAdvice(val title: String, val description: String) {
    SELF_CARE("Tự chăm sóc tại nhà", "Theo dõi triệu chứng trong 24-48 giờ tiếp theo."),
    MONITOR("Theo dõi thêm", "Nếu triệu chứng không giảm sau 3 ngày, hãy đặt lịch khám."),
    BOOK_APPOINTMENT("Đặt lịch khám bác sĩ", "Đăng ký khám chuyên khoa phù hợp để được kiểm tra lâm sàng."),
    BOOK_APPOINTMENT_SOON("Khám sớm trong 24-48h", "Triệu chứng có xu hướng tiến triển, nên gặp bác sĩ sớm."),
    SEEK_URGENT_CARE("Cần khám cấp thiết", "Đến ngay phòng khám/bệnh viện gần nhất."),
    EMERGENCY("CẤP CỨU NGAY LẬP TỨC", "Gọi 115 hoặc nhờ người đưa đến khoa cấp cứu gần nhất.")
}

data class SpecialtyRecommendation(
    val specialtyId: String,
    val specialtyName: String,
    val score: Double, // 0.0 - 1.0
    val rank: Int
)

data class RedFlagItem(
    val id: String,
    val title: String,
    val description: String,
    val isEmergency: Boolean = true
)

data class ScreeningSession(
    val id: String = UUID.randomUUID().toString(),
    val userId: String? = null,
    val startedAt: Date = Date(),
    var completedAt: Date? = null,
    var currentStep: Int = 1,
    var status: ScreeningSessionStatus = ScreeningSessionStatus.IN_PROGRESS,
    var riskLevel: RiskLevel? = null,
    var riskScore: Int = 0, // 0 - 100
    var recommendedSpecialtyId: String? = null,
    val algorithmVersion: String = "screening-v1.0"
)

data class ScreeningResultPayload(
    val screeningSessionId: String,
    val algorithmVersion: String = "screening-v1.0",
    val createdAt: Date = Date(),
    val riskScore: Int,
    val riskLevel: RiskLevel,
    val hasRedFlags: Boolean,
    val redFlags: List<RedFlagItem>,
    val specialties: List<SpecialtyRecommendation>,
    val recommendation: ActionAdvice,
    val summary: String,
    val isDemoMode: Boolean = false
)
