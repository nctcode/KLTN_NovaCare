package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.ApiClient
import com.example.kltn_novacare.domain.engine.*
import com.example.kltn_novacare.domain.service.*
import com.google.gson.Gson
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

data class PreExamUiState(
    val session: ScreeningSession = ScreeningSession(),
    val activeTab: Int = 1, // 1: BodyMap, 2: Questionnaire, 3: Camera, 4: Vitals, 5: Result
    val selectedBodyAreas: Set<String> = emptySet(),
    val selectedBodyRegions: Set<BodyRegion> = emptySet(),
    val duration: String = "< 24 giờ",
    val painLevel: Int = 3,
    val selectedWarnings: Set<String> = emptySet(),
    val selectedHistories: Set<String> = emptySet(),
    val symptomsText: String = "",
    val adaptiveQuestions: List<Question> = emptyList(),
    val questionAnswers: Map<String, String> = emptyMap(),
    val recordedVoiceFile: File? = null,
    val imageFiles: List<File> = emptyList(),
    val visionResult: VisionAnalysisResult? = null,
    val measuredHeartRate: Int = 75,
    val ppgResult: PPGMeasurementResult? = null,
    val heightCm: String = "170",
    val weightKg: String = "65",
    val bmiValue: String = "22.5",
    val isAnalyzing: Boolean = false,
    val screeningPayload: ScreeningResultPayload? = null,
    val triageResult: TriageResult? = null,
    val errorMessage: String? = null
)

class PreExamViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(PreExamUiState())
    val uiState: StateFlow<PreExamUiState> = _uiState.asStateFlow()

    init {
        updateAdaptiveQuestions()
    }

    fun setActiveTab(tab: Int) {
        val currentSession = _uiState.value.session.copy(currentStep = tab)
        _uiState.value = _uiState.value.copy(activeTab = tab, session = currentSession)
    }

    fun toggleBodyArea(areaName: String) {
        val currentAreas = _uiState.value.selectedBodyAreas.toMutableSet()
        if (currentAreas.contains(areaName)) {
            currentAreas.remove(areaName)
        } else {
            currentAreas.add(areaName)
        }

        val matchedRegion = BodyRegionMapper.findRegionByEntityName(areaName) ?: BodyRegion(
            id = areaName.lowercase().replace(" ", "_"),
            name = areaName,
            displayName = areaName,
            side = "center",
            category = "general"
        )
        val currentRegions = _uiState.value.selectedBodyRegions.toMutableSet()
        if (currentRegions.contains(matchedRegion)) {
            currentRegions.remove(matchedRegion)
        } else {
            currentRegions.add(matchedRegion)
        }

        _uiState.value = _uiState.value.copy(
            selectedBodyAreas = currentAreas,
            selectedBodyRegions = currentRegions
        )
        updateAdaptiveQuestions()
    }

    fun toggleBodyRegion(region: BodyRegion) {
        val currentRegions = _uiState.value.selectedBodyRegions.toMutableSet()
        val currentAreas = _uiState.value.selectedBodyAreas.toMutableSet()

        if (currentRegions.contains(region)) {
            currentRegions.remove(region)
            currentAreas.remove(region.name)
            currentAreas.remove(region.displayName)
        } else {
            currentRegions.add(region)
            currentAreas.add(region.displayName)
        }

        _uiState.value = _uiState.value.copy(
            selectedBodyRegions = currentRegions,
            selectedBodyAreas = currentAreas
        )
        updateAdaptiveQuestions()
    }

    fun clearBodyRegions() {
        _uiState.value = _uiState.value.copy(
            selectedBodyRegions = emptySet(),
            selectedBodyAreas = emptySet()
        )
        updateAdaptiveQuestions()
    }

    private fun updateAdaptiveQuestions() {
        val selectedCodes = _uiState.value.selectedBodyRegions.mapNotNull { BodyRegionCode.fromBodyRegion(it) }.toSet()
        val questions = QuestionEngine.selectAdaptiveQuestions(selectedCodes)
        _uiState.value = _uiState.value.copy(adaptiveQuestions = questions)
    }

    fun answerQuestion(questionId: String, answer: String) {
        val updated = _uiState.value.questionAnswers.toMutableMap()
        updated[questionId] = answer
        _uiState.value = _uiState.value.copy(questionAnswers = updated)
    }

    fun buildStep1Result(): ScreeningStep1Result {
        val locations = _uiState.value.selectedBodyRegions.map { region ->
            val code = BodyRegionCode.fromBodyRegion(region)
            ScreeningBodyLocation(
                code = code?.code ?: region.id.uppercase(),
                name = region.displayName,
                side = region.side.uppercase()
            )
        }
        return ScreeningStep1Result(step = 1, selectedRegions = locations)
    }

    fun setDuration(duration: String) {
        _uiState.value = _uiState.value.copy(duration = duration)
    }

    fun setPainLevel(level: Int) {
        _uiState.value = _uiState.value.copy(painLevel = level)
    }

    fun toggleWarning(sign: String) {
        val current = _uiState.value.selectedWarnings.toMutableSet()
        if (current.contains(sign)) {
            current.remove(sign)
        } else {
            current.add(sign)
        }
        _uiState.value = _uiState.value.copy(selectedWarnings = current)
    }

    fun toggleHistory(history: String) {
        val current = _uiState.value.selectedHistories.toMutableSet()
        if (current.contains(history)) {
            current.remove(history)
        } else {
            current.add(history)
        }
        _uiState.value = _uiState.value.copy(selectedHistories = current)
    }

    fun setSymptomsText(text: String) {
        _uiState.value = _uiState.value.copy(symptomsText = text)
    }

    fun setVoiceFile(file: File?) {
        _uiState.value = _uiState.value.copy(recordedVoiceFile = file)
    }

    fun addImageFile(file: File) {
        val current = _uiState.value.imageFiles.toMutableList()
        current.add(file)
        _uiState.value = _uiState.value.copy(imageFiles = current)

        // Run vision quality check pipeline
        viewModelScope.launch {
            val result = DefaultVisionAnalysisService.analyzeClinicalImage(file)
            _uiState.value = _uiState.value.copy(visionResult = result)
        }
    }

    fun removeImageFile(index: Int) {
        val current = _uiState.value.imageFiles.toMutableList()
        if (index in current.indices) {
            current.removeAt(index)
            _uiState.value = _uiState.value.copy(imageFiles = current)
        }
    }

    fun setHeartRate(bpm: Int) {
        val ppg = DefaultPPGService.measureHeartRate(simulatedBpm = bpm)
        _uiState.value = _uiState.value.copy(measuredHeartRate = bpm, ppgResult = ppg)
    }

    fun setHeightAndWeight(height: String, weight: String) {
        val h = height.toDoubleOrNull() ?: 170.0
        val w = weight.toDoubleOrNull() ?: 65.0
        val bmiRes = DefaultPPGService.calculateBMI(h, w)
        _uiState.value = _uiState.value.copy(
            heightCm = height,
            weightKg = weight,
            bmiValue = bmiRes.bmiValue.toString()
        )
    }

    fun runAIAnalysis() {
        val state = _uiState.value
        _uiState.value = state.copy(isAnalyzing = true, activeTab = 5, errorMessage = null)

        viewModelScope.launch {
            // Run clinical engines locally for instant assessment & red flag override calculation
            val selectedCodes = state.selectedBodyRegions.mapNotNull { BodyRegionCode.fromBodyRegion(it) }.toSet()
            val findings = state.visionResult?.findings ?: emptyList()

            val payload = ScreeningEngine.runScreening(
                sessionId = state.session.id,
                regions = selectedCodes,
                painLevel = state.painLevel,
                symptomsText = state.symptomsText,
                warnings = state.selectedWarnings,
                answers = state.questionAnswers,
                heartRateBpm = state.measuredHeartRate,
                findings = findings
            )

            _uiState.value = _uiState.value.copy(screeningPayload = payload)

            // Sync with backend API
            try {
                val gson = Gson()
                val bodyAreasJson = gson.toJson(state.selectedBodyAreas.toList())
                val questionnaireObj = QuestionnaireData(
                    duration = state.duration,
                    painLevel = state.painLevel,
                    warningSigns = state.selectedWarnings.toList(),
                    medicalHistory = state.selectedHistories.toList()
                )
                val questionnaireJson = gson.toJson(questionnaireObj)

                val bodyAreasPart = bodyAreasJson.toRequestBody("text/plain".toMediaTypeOrNull())
                val questionnairePart = questionnaireJson.toRequestBody("text/plain".toMediaTypeOrNull())

                val voicePart = state.recordedVoiceFile?.let { file ->
                    val requestFile = file.asRequestBody("audio/*".toMediaTypeOrNull())
                    MultipartBody.Part.createFormData("voice", file.name, requestFile)
                }

                val imageParts = state.imageFiles.map { file ->
                    val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                    MultipartBody.Part.createFormData("images", file.name, requestFile)
                }

                val api = ApiClient.getPreExamApiService()
                val response = api.analyzeSmartphoneInputs(
                    bodyAreas = bodyAreasPart,
                    questionnaire = questionnairePart,
                    voice = voicePart,
                    images = imageParts.ifEmpty { null }
                )

                if (response.isSuccessful && response.body()?.data != null) {
                    val currentSession = state.session.copy(
                        status = ScreeningSessionStatus.COMPLETED,
                        riskLevel = payload.riskLevel,
                        riskScore = payload.riskScore,
                        recommendedSpecialtyId = payload.specialties.firstOrNull()?.specialtyId
                    )
                    _uiState.value = _uiState.value.copy(
                        isAnalyzing = false,
                        session = currentSession,
                        triageResult = response.body()!!.data
                    )
                } else {
                    fallbackTriage(payload)
                }
            } catch (e: Exception) {
                fallbackTriage(payload)
            }
        }
    }

    private fun fallbackTriage(payload: ScreeningResultPayload) {
        val state = _uiState.value
        val topSpecialty = payload.specialties.firstOrNull()?.specialtyName ?: "Nội tổng quát"
        val isEmergency = payload.hasRedFlags || payload.riskLevel == RiskLevel.EMERGENCY

        val updatedSession = state.session.copy(
            status = ScreeningSessionStatus.COMPLETED,
            riskLevel = payload.riskLevel,
            riskScore = payload.riskScore,
            recommendedSpecialtyId = payload.specialties.firstOrNull()?.specialtyId
        )

        val result = TriageResult(
            riskLevel = payload.riskLevel.name,
            riskLabel = payload.riskLevel.label,
            riskColor = if (isEmergency) "rose" else "amber",
            recommendedSpecialtyName = topSpecialty,
            summary = payload.summary,
            vitalSignsAssessment = "Nhịp tim PPG ${state.measuredHeartRate} BPM. Chỉ số BMI: ${state.bmiValue}.",
            triageDetails = TriageDetails(
                urgencyReason = if (isEmergency) "Phát hiện dấu hiệu cảnh báo đỏ (Red Flag) nguy hiểm!" else "Cần bác sĩ chuyên khoa kiểm tra lâm sàng.",
                actionAdvice = payload.recommendation.title + ": " + payload.recommendation.description,
                keyObservations = listOf(
                    "Vùng cơ thể: ${state.selectedBodyAreas.joinToString(", ").ifBlank { "Chưa chọn" }}",
                    "Mức đau: ${state.painLevel}/10",
                    "Điểm nguy cơ AI: ${payload.riskScore}/100",
                    "Khuyến nghị: ${payload.recommendation.title}"
                )
            ),
            imageAnalysisFindings = state.visionResult?.findings?.map { "${it.displayName} (${(it.confidence * 100).toInt()}%)" },
            transcript = if (state.recordedVoiceFile != null) "Đã chuyển đổi giọng nói thành văn bản thành công." else null
        )

        _uiState.value = _uiState.value.copy(
            isAnalyzing = false,
            session = updatedSession,
            triageResult = result
        )
    }
}
