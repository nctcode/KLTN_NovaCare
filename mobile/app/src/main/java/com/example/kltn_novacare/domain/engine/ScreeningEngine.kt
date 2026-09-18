package com.example.kltn_novacare.domain.engine

import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.domain.service.VisionFinding

// ── 1. RISK ASSESSMENT ENGINE ─────────────────────────────────
object RiskAssessmentEngine {

    fun calculateRiskScore(
        painLevel: Int,
        progression: String?,
        impact: String?,
        warningsCount: Int,
        heartRateBpm: Int,
        imageFindingsCount: Int,
        hasRedFlags: Boolean
    ): Pair<Int, RiskLevel> {
        var score = 0

        // Pain level component (0 - 25 pts)
        score += (painLevel * 2.5).toInt()

        // Progression component (0 - 20 pts)
        when (progression) {
            "Tăng nhanh đột ngột" -> score += 20
            "Tăng dần từ từ" -> score += 10
            "Không thay đổi" -> score += 5
        }

        // Functional impact component (0 - 25 pts)
        when (impact) {
            "Không thể sinh hoạt bình thường" -> score += 25
            "Nhiều" -> score += 18
            "Ảnh hưởng trung bình" -> score += 12
            "Ảnh hưởng nhẹ" -> score += 5
        }

        // Warnings count (0 - 15 pts)
        score += (warningsCount * 5).coerceAtMost(15)

        // Heart rate vitals (0 - 15 pts)
        if (heartRateBpm > 110 || (heartRateBpm in 1..50)) {
            score += 15
        }

        // Image findings (0 - 10 pts)
        if (imageFindingsCount > 0) {
            score += 10
        }

        // Cap raw score to 100
        score = score.coerceIn(0, 100)

        // Determine base risk level from score
        var level = when {
            score >= 80 -> RiskLevel.VERY_HIGH
            score >= 60 -> RiskLevel.HIGH
            score >= 30 -> RiskLevel.MEDIUM
            else -> RiskLevel.LOW
        }

        // RED FLAG OVERRIDE RULE: Emergency red flags override score to EMERGENCY!
        if (hasRedFlags) {
            level = RiskLevel.EMERGENCY
            score = maxOf(score, 85)
        }

        return Pair(score, level)
    }
}

// ── 2. SPECIALTY RECOMMENDATION ENGINE ────────────────────────
object SpecialtyRecommendationEngine {

    fun rankSpecialties(
        regions: Set<BodyRegionCode>,
        symptomsText: String,
        answers: Map<String, String>
    ): List<SpecialtyRecommendation> {
        val scores = mutableMapOf<String, Double>()

        val textConcat = (regions.joinToString(" ") { it.displayName } + " " + symptomsText + " " + answers.values.joinToString(" ")).lowercase()

        // Rules based ranking
        if (textConcat.contains("tim") || textConcat.contains("ngực") || textConcat.contains("thắt ngực") || textConcat.contains("mồ hôi")) {
            scores["Tim mạch"] = (scores["Tim mạch"] ?: 0.0) + 0.90
        }
        if (textConcat.contains("ho") || textConcat.contains("khó thở") || textConcat.contains("đờm") || textConcat.contains("phổi")) {
            scores["Hô hấp"] = (scores["Hô hấp"] ?: 0.0) + 0.85
        }
        if (textConcat.contains("khớp") || textConcat.contains("vai") || textConcat.contains("lưng") || textConcat.contains("gối") || textConcat.contains("tay") || textConcat.contains("chân") || textConcat.contains("xương")) {
            scores["Cơ xương khớp"] = (scores["Cơ xương khớp"] ?: 0.0) + 0.88
        }
        if (textConcat.contains("đầu") || textConcat.contains("tê") || textConcat.contains("yếu") || textConcat.contains("méo miệng") || textConcat.contains("chóng mặt")) {
            scores["Thần kinh"] = (scores["Thần kinh"] ?: 0.0) + 0.82
        }
        if (textConcat.contains("bụng") || textConcat.contains("dạ dày") || textConcat.contains("nôn") || textConcat.contains("tiêu chảy")) {
            scores["Tiêu hóa"] = (scores["Tiêu hóa"] ?: 0.0) + 0.80
        }
        if (textConcat.contains("da") || textConcat.contains("mụn") || textConcat.contains("ngứa") || textConcat.contains("phát ban")) {
            scores["Da liễu"] = (scores["Da liễu"] ?: 0.0) + 0.85
        }
        if (textConcat.contains("họng") || textConcat.contains("tai") || textConcat.contains("mũi")) {
            scores["Tai Mũi Họng"] = (scores["Tai Mũi Họng"] ?: 0.0) + 0.80
        }
        if (textConcat.contains("mắt") || textConcat.contains("nhìn")) {
            scores["Mắt"] = (scores["Mắt"] ?: 0.0) + 0.85
        }

        // Always add General Internal Medicine fallback
        scores["Nội tổng quát"] = (scores["Nội tổng quát"] ?: 0.0) + 0.50

        return scores.entries
            .sortedByDescending { it.value }
            .mapIndexed { index, entry ->
                SpecialtyRecommendation(
                    specialtyId = entry.key.lowercase().replace(" ", "_"),
                    specialtyName = entry.key,
                    score = entry.value,
                    rank = index + 1
                )
            }
    }
}

// ── 3. RECOMMENDATION ENGINE ─────────────────────────────────
object RecommendationEngine {

    fun decideActionAdvice(riskLevel: RiskLevel, hasRedFlags: Boolean): ActionAdvice {
        if (hasRedFlags || riskLevel == RiskLevel.EMERGENCY) {
            return ActionAdvice.EMERGENCY
        }
        return when (riskLevel) {
            RiskLevel.VERY_HIGH -> ActionAdvice.SEEK_URGENT_CARE
            RiskLevel.HIGH -> ActionAdvice.BOOK_APPOINTMENT_SOON
            RiskLevel.MEDIUM -> ActionAdvice.BOOK_APPOINTMENT
            RiskLevel.LOW -> ActionAdvice.MONITOR
            else -> ActionAdvice.BOOK_APPOINTMENT
        }
    }
}

// ── 4. SCREENING ENGINE MASTER ORCHESTRATOR ──────────────────
object ScreeningEngine {

    fun runScreening(
        sessionId: String,
        regions: Set<BodyRegionCode>,
        painLevel: Int,
        symptomsText: String,
        warnings: Set<String>,
        answers: Map<String, String>,
        heartRateBpm: Int,
        findings: List<VisionFinding>
    ): ScreeningResultPayload {
        // 1. Red flag evaluation
        val redFlags = RedFlagEngine.evaluateRedFlags(
            answers = answers,
            warnings = warnings,
            painLevel = painLevel,
            heartRateBpm = heartRateBpm
        )
        val hasRedFlags = redFlags.any { it.isEmergency }

        // 2. Risk scoring & level calculation
        val (score, level) = RiskAssessmentEngine.calculateRiskScore(
            painLevel = painLevel,
            progression = answers["Q_GEN_PROGRESSION"],
            impact = answers["Q_GEN_IMPACT"],
            warningsCount = warnings.size,
            heartRateBpm = heartRateBpm,
            imageFindingsCount = findings.size,
            hasRedFlags = hasRedFlags
        )

        // 3. Specialty ranking
        val specialties = SpecialtyRecommendationEngine.rankSpecialties(
            regions = regions,
            symptomsText = symptomsText,
            answers = answers
        )

        // 4. Recommendation decision
        val recommendation = RecommendationEngine.decideActionAdvice(level, hasRedFlags)

        val topSpecialty = specialties.firstOrNull()?.specialtyName ?: "Nội tổng quát"
        val regionNames = regions.joinToString(", ") { it.displayName }.ifBlank { "Toàn thân" }

        val summary = "Sàng lọc vùng $regionNames. Mức đau $painLevel/10. Chuyên khoa gợi ý chính: $topSpecialty."

        return ScreeningResultPayload(
            screeningSessionId = sessionId,
            algorithmVersion = "screening-v1.0",
            riskScore = score,
            riskLevel = level,
            hasRedFlags = hasRedFlags,
            redFlags = redFlags,
            specialties = specialties,
            recommendation = recommendation,
            summary = summary,
            isDemoMode = false
        )
    }
}
