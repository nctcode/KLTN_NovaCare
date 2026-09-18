package com.example.kltn_novacare.data.model

data class BodyAreaItem(
    val id: String,
    val name: String
)

data class QuestionnaireData(
    val duration: String = "< 24 giờ",
    val painLevel: Int = 3,
    val warningSigns: List<String> = emptyList(),
    val medicalHistory: List<String> = emptyList()
)

data class TriageDetails(
    val urgencyReason: String? = null,
    val actionAdvice: String? = null,
    val keyObservations: List<String>? = null
)

data class TriageResult(
    val riskLevel: String? = "CONSULT", // EMERGENCY, CONSULT, MONITOR
    val riskLabel: String? = "Nên khám bác sĩ chuyên khoa",
    val riskColor: String? = "amber",
    val recommendedSpecialtyName: String? = "Nội tổng quát",
    val summary: String? = null,
    val vitalSignsAssessment: String? = null,
    val triageDetails: TriageDetails? = null,
    val imageAnalysisFindings: List<String>? = null,
    val transcript: String? = null
)
