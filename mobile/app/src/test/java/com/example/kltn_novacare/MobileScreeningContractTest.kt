package com.example.kltn_novacare

import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.viewmodel.*
import com.example.kltn_novacare.domain.service.estimateCameraPpg
import com.google.gson.Gson
import com.google.gson.JsonObject
import org.junit.Assert.*
import org.junit.Test

class MobileScreeningContractTest {
    private val catalog = MobileScreeningCatalog("v-test", listOf(ScreeningRegion("right_knee", "Gối phải")), listOf(
        ScreeningQuestion("knee-safety", "Có cảnh báo?", listOf("right_knee"), "boolean", "red_flag"),
        ScreeningQuestion("knee-q", "Đau khi vận động?", listOf("right_knee"), "boolean", "region_specific")))
    @Test fun payloadPreservesIdsAnswersAndMissingMeasurements() {
        val fields = screeningFields(PreExamUiState(catalog = catalog, regions = setOf("right_knee"), age = "30", revision = 7,
            answers = mapOf("knee-safety" to "no", "knee-q" to "yes")))
        assertEquals("3", fields["schemaVersion"]); assertEquals("7", fields["inputRevision"])
        assertEquals("[\"right_knee\"]", fields["bodyAreas"])
        val questionnaire = Gson().fromJson(fields["questionnaire"], JsonObject::class.java)
        assertEquals("v-test", questionnaire["version"].asString)
        assertEquals("yes", questionnaire["answers"].asJsonArray[1].asJsonObject["answer"].asString)
        assertFalse(fields.containsKey("ppg")); assertFalse(fields.containsKey("heartRateBpm"))
        assertTrue(questionnaire["painLevel"] == null || questionnaire["painLevel"].isJsonNull)
    }
    @Test fun zeroPainAndConfirmedTranscriptArePreserved() {
        val state = PreExamUiState(catalog = catalog, pain = "0", transcript = "Không ho", confirmed = false)
        assertFalse(screeningFields(state).containsKey("voiceTranscript"))
        assertEquals("Không ho", screeningFields(state.copy(confirmed = true))["voiceTranscript"])
        assertEquals(0, Gson().fromJson(screeningFields(state)["questionnaire"], JsonObject::class.java)["painLevel"].asInt)
    }
    @Test fun unknownSafetyNeverCountsAsNo() {
        val state = PreExamUiState(catalog = catalog, regions = setOf("right_knee"), answers = mapOf("knee-safety" to "unknown"))
        assertEquals(1, state.unansweredSafety.size)
        assertTrue(state.copy(answers = mapOf("knee-safety" to "yes")).hasWarning)
    }
    @Test fun applyRequiresCurrentRevisionExactHospitalAndBackendPermission() {
        val result = Gson().fromJson("""{"schemaVersion":"3","inputRevision":"7","canApply":true,"nextAction":"BOOK_SPECIALTY","recommendedSpecialtyId":"neuro","recommendedSpecialtyName":"Thần kinh","riskLevel":"CONSULT","hospitalAvailability":{"hospitalId":"h1","available":true}}""", MobileScreeningResult::class.java)
        assertTrue(result.applicable(7, "h1")); assertFalse(result.applicable(8, "h1")); assertFalse(result.applicable(7, "h2"))
        assertFalse(result.copy(canApply = false).applicable(7, "h1")); assertFalse(result.copy(riskLevel = "EMERGENCY").applicable(7, "h1"))
        assertFalse(result.copy(nextAction = "CHOOSE_FACILITY").applicable(7, "h1"))
    }
    @Test fun cameraPpgRejectsShortNoisyMissingAndOutOfRangeIntervals() {
        assertNull(estimateCameraPpg(emptyList(), 20000))
        assertNull(estimateCameraPpg((0..26).map { it * 800L }, 5000))
        assertEquals(75, estimateCameraPpg((0..26).map { it * 800L }, 20800))
        assertNull(estimateCameraPpg((0..26).map { it * 800L + if (it % 2 == 0) 0 else 400 }, 20800))
        assertNull(estimateCameraPpg((0..26).map { it * 100L }, 20000))
    }
}
