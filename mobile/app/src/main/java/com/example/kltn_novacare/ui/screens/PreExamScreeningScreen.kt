package com.example.kltn_novacare.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.kltn_novacare.ui.screens.screening.*
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.PreExamViewModel

@Composable
fun PreExamScreeningScreen(
    onSkipScreening: () -> Unit,
    onCompletedToBooking: (String?, String?, String?, String?, String, String, String) -> Unit,
    viewModel: PreExamViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current

    var leaving by remember { mutableStateOf(false) }
    var applied by remember(state.result) { mutableStateOf(false) }
    val locked = state.busy || state.transcribing || state.importing

    // Step titles for steps 0 to 4 (Step 1 to 5)
    val stepTitles = listOf(
        "Vùng bất thường",
        "Trắc nghiệm",
        "Ảnh tổn thương",
        "Nhịp tim qua camera",
        "Giọng nói triệu chứng"
    )

    // Back handler: if step > 0, go back one step; if step 0, prompt exit dialog
    BackHandler {
        if (state.step > 0 && !locked) {
            viewModel.step(state.step - 1)
        } else {
            leaving = true
        }
    }

    if (leaving) {
        ScreeningExitDialog(
            onConfirmExit = {
                leaving = false
                onSkipScreening()
            },
            onDismiss = { leaving = false }
        )
    }

    Scaffold(
        topBar = {
            if (state.step < 5) {
                Column {
                    ScreeningHeaderBar(
                        title = "Sàng lọc AI",
                        onBack = {
                            if (state.step > 0 && !locked) viewModel.step(state.step - 1) else leaving = true
                        },
                        onClose = { leaving = true }
                    )
                    ScreeningProgressBar(
                        currentStep = state.step,
                        totalSteps = 5,
                        stepTitle = stepTitles.getOrElse(state.step) { "Sàng lọc" }
                    )
                }
            } else {
                // Result Screen Header (Strictly NO "Bước 6/6")
                ScreeningHeaderBar(
                    title = "Kết quả sàng lọc",
                    onBack = {
                        if (!locked) viewModel.step(4)
                    },
                    onClose = { leaving = true }
                )
            }
        },
        bottomBar = {
            if (state.catalog != null) {
                when (state.step) {
                    0 -> {
                        val hasValidAge = state.age.isNotBlank() && (state.age.toIntOrNull() ?: 0) in 1..120
                        val hasRegions = state.regions.isNotEmpty() && state.regions.size <= 2
                        ScreeningBottomAction(
                            primaryText = "Tiếp tục",
                            onPrimary = { viewModel.step(1) },
                            primaryEnabled = hasValidAge && hasRegions && !locked,
                            helperText = when {
                                !hasValidAge -> "Vui lòng nhập độ tuổi của người khám để tiếp tục *"
                                !hasRegions -> "Vui lòng chọn từ 1 đến 2 vùng khó chịu / tổn thương"
                                else -> null
                            }
                        )
                    }
                    1 -> {
                        val questions = state.questions
                        val allQuestionsAnswered = questions.isNotEmpty() && questions.all { state.answers.containsKey(it.id) }
                        val painSelected = state.pain.isNotBlank() && state.pain.toIntOrNull() != null
                        val durationFilled = state.duration.isNotBlank()
                        val canProceedStep2 = allQuestionsAnswered && painSelected && durationFilled && !locked
                        ScreeningBottomAction(
                            primaryText = "Tiếp tục",
                            onPrimary = { viewModel.step(2) },
                            primaryEnabled = canProceedStep2,
                            helperText = when {
                                !painSelected -> "Vui lòng chọn thang điểm mức độ đau (0 - 10)"
                                !durationFilled -> "Vui lòng nhập thời điểm triệu chứng bắt đầu"
                                !allQuestionsAnswered -> "Vui lòng trả lời đủ ${questions.size} câu trắc nghiệm (còn ${questions.size - state.answers.size} câu)"
                                else -> null
                            }
                        )
                    }
                    2 -> {
                        val hasUploadedImageAndConsent = state.images.isNotEmpty() && state.consent
                        if (hasUploadedImageAndConsent) {
                            ScreeningBottomAction(
                                primaryText = "Tiếp tục",
                                onPrimary = { viewModel.step(3) },
                                primaryEnabled = !locked,
                                secondaryText = "Bỏ qua bước này",
                                onSecondary = {
                                    state.images.forEach(viewModel::removeImage)
                                    viewModel.step(3)
                                }
                            )
                        } else {
                            ScreeningBottomAction(
                                primaryText = "Bỏ qua bước này",
                                onPrimary = {
                                    state.images.forEach(viewModel::removeImage)
                                    viewModel.step(3)
                                },
                                primaryEnabled = !locked,
                                helperText = if (state.images.isNotEmpty() && !state.consent) "Vui lòng tích đồng ý xử lý ảnh để tiếp tục hoặc nhấn Bỏ qua" else null
                            )
                        }
                    }
                    3 -> {
                        ScreeningBottomAction(
                            primaryText = "Tiếp tục",
                            onPrimary = { viewModel.step(4) },
                            primaryEnabled = state.ppg != null && !locked,
                            secondaryText = "Bỏ qua bước này",
                            onSecondary = {
                                viewModel.ppg(null)
                                viewModel.step(4)
                            },
                            helperText = if (state.ppg == null) "Hoàn thành đo nhịp tim để tiếp tục hoặc nhấn Bỏ qua bước này" else null
                        )
                    }
                    4 -> {
                        val hasVoiceOrTranscript = state.transcript.isNotBlank()
                        val canAnalyze = !locked && hasVoiceOrTranscript && state.confirmed
                        ScreeningBottomAction(
                            primaryText = "Phân tích và xem gợi ý",
                            onPrimary = { viewModel.analyze() },
                            primaryEnabled = canAnalyze,
                            isLoading = state.busy,
                            loadingText = "NovaCare AI đang tổng hợp thông tin...",
                            secondaryText = "Bỏ qua bước ghi âm & Phân tích ngay",
                            onSecondary = {
                                viewModel.transcript("")
                                viewModel.analyze()
                            },
                            helperText = when {
                                !hasVoiceOrTranscript -> "Vui lòng ghi âm triệu chứng hoặc nhấn Bỏ qua để phân tích ngay"
                                !state.confirmed -> "Vui lòng đánh dấu xác nhận lời kể trước khi phân tích"
                                else -> null
                            }
                        )
                    }
                    5 -> {
                        // Result Screen Bottom Action
                        state.result?.let { res ->
                            Surface(
                                color = Color.White,
                                shadowElevation = 8.dp,
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderLight),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .navigationBarsPadding()
                                        .padding(horizontal = 16.dp, vertical = 12.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    if (state.canApply) {
                                        Button(
                                            onClick = {
                                                if (!applied && viewModel.uiState.value.canApply) {
                                                    applied = true
                                                    onCompletedToBooking(
                                                        null,
                                                        res.recommendedSpecialtyId,
                                                        res.recommendedSpecialtyName,
                                                        state.hospitalId,
                                                        state.symptoms,
                                                        res.summary.orEmpty(),
                                                        res.screeningSessionId.orEmpty()
                                                    )
                                                }
                                            },
                                            enabled = !applied,
                                            shape = RoundedCornerShape(14.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(50.dp)
                                        ) {
                                            Text(
                                                text = "Đặt khám ${res.recommendedSpecialtyName ?: "chuyên khoa"}",
                                                fontSize = 15.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        TextButton(
                                            onClick = {
                                                viewModel.step(if (res.decisionReason == "REGION_CONFLICT") 0 else 1)
                                            }
                                        ) {
                                            Text(
                                                text = "Kiểm tra lại thông tin đã nhập",
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = TextSecondary
                                            )
                                        }

                                        if (res.nextAction == "CHOOSE_FACILITY") {
                                            Spacer(modifier = Modifier.width(8.dp))
                                            TextButton(onClick = { viewModel.step(0) }) {
                                                Text(
                                                    text = "Chọn cơ sở y tế",
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = PrimaryDark
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.25f)
    ) { padding ->
        val scrollState = rememberScrollState()

        // Clear focus and scroll to top when step changes
        LaunchedEffect(state.step) {
            focus.clearFocus()
            keyboard?.hide()
            scrollState.scrollTo(0)
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // General Medical Disclaimer at top of collection steps
            if (state.step < 5) {
                MedicalDisclaimerBanner()
            }

            // Error banner
            state.error?.let { err ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = err,
                            color = Color(0xFFDC2626),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                        if (err.contains("Bộ câu hỏi") || err.contains("kết nối")) {
                            Spacer(modifier = Modifier.height(6.dp))
                            TextButton(
                                onClick = viewModel::load,
                                enabled = !state.loading,
                                colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFDC2626))
                            ) {
                                Text("Tải lại dữ liệu", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            // Loading catalog state
            if (state.loading) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    CircularProgressIndicator(color = Primary)
                    Text(
                        text = "Đang tải bộ câu hỏi và danh mục sàng lọc...",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                }
            }

            if (state.catalog == null && !state.loading) {
                Button(
                    onClick = viewModel::load,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                ) {
                    Text("Tải lại dữ liệu", fontWeight = FontWeight.Bold)
                }
            }

            // Content when catalog is ready
            if (state.catalog != null) {
                val catalog = state.catalog!!

                // Persistent urgent red-flag warning if user answered "yes" to safety question (across steps 0..4)
                if (state.hasWarning && state.step < 5) {
                    SafetyAlertWarningCard(
                        onUrgentAction = { viewModel.analyze(true) }
                    )
                }

                when (state.step) {
                    // STEP 1: VÙNG BẤT THƯỜNG
                    0 -> {
                        PatientInfoCard(
                            age = state.age,
                            onAgeChange = viewModel::age
                        )

                        BodyRegionSelectorCard(
                            catalogRegions = catalog.regions,
                            selectedRegions = state.regions,
                            onToggleRegion = viewModel::region
                        )
                    }

                    // STEP 2: TRẮC NGHIỆM THEO VÙNG
                    1 -> {
                        PainAndDurationCard(
                            pain = state.pain,
                            onPainChange = viewModel::pain,
                            duration = state.duration,
                            onDurationChange = viewModel::duration
                        )

                        val questions = state.questions
                        val answeredCount = questions.count { state.answers.containsKey(it.id) }

                        Surface(
                            color = Color.White,
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BorderLight),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Tiến độ câu hỏi:",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "$answeredCount / ${questions.size} đã trả lời",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = PrimaryDark
                                )
                            }
                        }

                        questions.forEachIndexed { index, q ->
                            CompactQuestionCard(
                                questionIndex = index,
                                totalQuestions = questions.size,
                                question = q,
                                catalogRegions = catalog.regions,
                                selectedRegions = state.regions,
                                currentAnswer = state.answers[q.id],
                                onAnswerSelected = { value -> viewModel.answer(q.id, value) }
                            )
                        }

                        if (state.unansweredSafety.isNotEmpty()) {
                            Surface(
                                color = Color(0xFFFFFBEB),
                                shape = RoundedCornerShape(12.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "Còn ${state.unansweredSafety.size} câu hỏi cảnh báo chưa được xác nhận. Vui lòng kiểm tra kỹ để AI hỗ trợ chính xác nhất.",
                                    fontSize = 12.sp,
                                    color = Color(0xFF92400E),
                                    lineHeight = 16.sp,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        }
                    }

                    // STEP 3: ẢNH TỔN THƯƠNG
                    2 -> {
                        ScreeningImageSection(
                            images = state.images,
                            enabled = !locked,
                            isImporting = state.importing,
                            consent = state.consent,
                            onConsentChange = viewModel::consent,
                            onAddImage = { uri, file ->
                                viewModel.addImage(context.applicationContext, uri, file)
                            },
                            onRemoveImage = viewModel::removeImage,
                            onError = viewModel::error
                        )
                    }

                    // STEP 4: NHỊP TIM CAMERA (PPG)
                    3 -> {
                        ScreeningPpgCapture(
                            currentPpg = state.ppg,
                            onResult = viewModel::ppg,
                            onError = viewModel::error
                        )
                    }

                    // STEP 5: GIỌNG NÓI TRIỆU CHỨNG
                    4 -> {
                        ScreeningVoiceSection(
                            consent = state.consent,
                            onConsentChange = viewModel::consent,
                            isTranscribing = state.transcribing,
                            transcript = state.transcript,
                            onTranscriptChange = viewModel::transcript,
                            confirmed = state.confirmed,
                            onConfirmChange = viewModel::confirm,
                            onSendVoice = viewModel::transcribe,
                            onError = viewModel::error
                        )
                    }

                    // STEP 5: KẾT QUẢ SÀNG LỌC
                    5 -> {
                        if (state.busy) {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = androidx.compose.foundation.BorderStroke(1.dp, BorderLight)
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(14.dp)
                                ) {
                                    CircularProgressIndicator(color = Primary)
                                    Text(
                                        text = "NovaCare AI đang tổng hợp thông tin...",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryDark
                                    )
                                    Text(
                                        text = "Đang đối chiếu triệu chứng, câu trả lời lâm sàng và dữ liệu tham khảo.",
                                        fontSize = 12.sp,
                                        color = TextSecondary
                                    )
                                }
                            }
                        }

                        state.result?.let { result ->
                            // Emergency Guidance Box
                            if (result.nextAction == "EMERGENCY_GUIDANCE") {
                                EmergencyGuidanceCard(
                                    onCall115 = {
                                        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:115")))
                                    }
                                )
                            }

                            // 1. Gợi ý phù hợp nhất (Specialty & summary)
                            ResultHeroCard(result = result)

                            // 2. Vì sao gợi ý? (Key observations from rule engine / AI)
                            RecommendationReasonsCard(result = result)

                            // 3. Tóm tắt dữ liệu
                            val selectedRegionNames = catalog.regions
                                .filter { it.id in state.regions }
                                .map { it.name }
                            ScreeningDataSummaryCard(
                                regionNames = selectedRegionNames,
                                pain = state.pain,
                                duration = state.duration,
                                bpm = result.ppg?.bpm ?: state.ppg?.bpm,
                                hasImages = state.images.isNotEmpty(),
                                hasVoice = state.transcript.isNotBlank()
                            )

                            // 4. Phân tích ảnh
                            ResultImageAssessmentsCard(
                                images = state.images,
                                assessments = result.imageAssessments,
                                findings = result.imageAnalysisFindings
                            )

                            // 5. Lưu ý y tế & Tài liệu tham khảo
                            MedicalNotesAndCitationsCard(result = result)

                            // 6. Gợi ý cơ sở y tế & Bác sĩ (DƯỚI CÙNG - Có popup tùy chọn xem thêm)
                            RecommendedFacilitiesAndDoctorsCard(
                                hospitals = state.hospitals,
                                doctors = state.recommendedDoctors,
                                loadingDoctors = state.loadingDoctors,
                                recommendedSpecialtyName = result.recommendedSpecialtyName,
                                onSelectHospital = { hospitalId ->
                                    if (!applied) {
                                        applied = true
                                        onCompletedToBooking(
                                            null,
                                            result.recommendedSpecialtyId,
                                            result.recommendedSpecialtyName,
                                            hospitalId,
                                            state.symptoms,
                                            result.summary.orEmpty(),
                                            result.screeningSessionId.orEmpty()
                                        )
                                    }
                                },
                                onSelectDoctor = { doctorId, hospitalId ->
                                    if (!applied) {
                                        applied = true
                                        onCompletedToBooking(
                                            doctorId,
                                            result.recommendedSpecialtyId,
                                            result.recommendedSpecialtyName,
                                            hospitalId,
                                            state.symptoms,
                                            result.summary.orEmpty(),
                                            result.screeningSessionId.orEmpty()
                                        )
                                    }
                                }
                            )
                        }

                        if (!state.busy && state.result == null) {
                            Button(
                                onClick = { viewModel.analyze() },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                                modifier = Modifier.fillMaxWidth().height(48.dp)
                            ) {
                                Text("Phân tích lại", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
