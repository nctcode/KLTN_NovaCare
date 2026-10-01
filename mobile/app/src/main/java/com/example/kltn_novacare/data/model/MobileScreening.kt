package com.example.kltn_novacare.data.model

import com.google.gson.JsonObject

data class ScreeningRegion(val id: String, val name: String)
data class ScreeningOption(val value: String, val label: String)
data class ScreeningImpact(val redFlagSeverity: String? = null)
data class ScreeningQuestion(val id: String, val question: String, val regionIds: List<String>, val type: String,
    val category: String?, val priority: Int = 0, val options: List<ScreeningOption>? = null, val riskImpact: ScreeningImpact? = null) {
    val safety get() = category == "red_flag" || riskImpact?.redFlagSeverity != null
}
data class MobileScreeningCatalog(val version: String, val regions: List<ScreeningRegion>, val questions: List<ScreeningQuestion>)
data class ScreeningPpg(val bpm: Int, val durationMs: Long, val measuredAt: String,
    val source: String = "CAMERA_PPG", val quality: String = "GOOD", val algorithmVersion: String = "android-ppg-1")
data class ScreeningProviderFailure(val stage: String?, val code: String?)
data class ScreeningCitation(val id: String, val title: String, val sourceUrl: String)
data class ScreeningVitals(val bpm: Int? = null, val quality: String? = null)
data class ScreeningHospitalAvailability(val hospitalId: String?, val available: Boolean = false)
data class MobileScreeningResult(val schemaVersion: String?, val inputRevision: String?, val riskLevel: String?,
    val riskLabel: String?, val summary: String?, val nextAction: String?, val canApply: Boolean = false,
    val recommendedSpecialtyId: String?, val recommendedSpecialtyName: String?,
    val triageDetails: TriageDetails?, val providerErrors: List<ScreeningProviderFailure>?,
    val citations: List<ScreeningCitation>?, val imageAnalysisFindings: List<String>?,
    val recommendationSource: String?, val decisionReason: String?, val ppg: ScreeningVitals?,
    val hospitalAvailability: ScreeningHospitalAvailability?, val modalityStatuses: Map<String, String>?) {
    fun applicable(revision: Long, hospitalId: String?) = schemaVersion == "3" && inputRevision == revision.toString() &&
        canApply && nextAction == "BOOK_SPECIALTY" && !recommendedSpecialtyId.isNullOrBlank() &&
        !recommendedSpecialtyName.isNullOrBlank() && hospitalId != null && hospitalAvailability?.available == true &&
        hospitalAvailability.hospitalId == hospitalId && riskLevel !in listOf("EMERGENCY", "URGENT")
}
fun unwrapScreeningResponse(body: JsonObject): JsonObject {
    var value = body
    repeat(2) { if (value.get("data")?.isJsonObject == true) value = value.getAsJsonObject("data") }
    return value
}
