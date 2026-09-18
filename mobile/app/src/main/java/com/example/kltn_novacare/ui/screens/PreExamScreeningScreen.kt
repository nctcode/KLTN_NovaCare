package com.example.kltn_novacare.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.kltn_novacare.data.model.RiskLevel
import com.example.kltn_novacare.domain.engine.QuestionType
import com.example.kltn_novacare.ui.components.Body3DView
import com.example.kltn_novacare.ui.viewmodel.PreExamViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PreExamScreeningScreen(
    onSkipScreening: () -> Unit,
    onCompletedToBooking: (doctorId: String?, specialtyId: String?, hospitalId: String?, reason: String) -> Unit,
    viewModel: PreExamViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    val primaryGreen = Color(0xFF0C4B39)
    val accentGreen = Color(0xFF10B981)

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    val warningSigns = remember {
        listOf("Sốt cao liên tục > 38.5°C", "Tức ngực, khó thở", "Chóng mặt, choáng váng", "Nôn mửa / Tiêu chảy", "Phát ban da toàn thân")
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Trợ Lý AI Sàng Lọc (${uiState.activeTab}/5)", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White) },
                actions = {
                    TextButton(onClick = onSkipScreening) {
                        Text("Bỏ qua", color = accentGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = primaryGreen)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFF8FAFC))
        ) {
            ScrollableTabRow(
                selectedTabIndex = uiState.activeTab - 1,
                containerColor = Color.White,
                contentColor = primaryGreen,
                edgePadding = 8.dp
            ) {
                Tab(selected = uiState.activeTab == 1, onClick = { viewModel.setActiveTab(1) }) {
                    Text("1. Vùng Đau", modifier = Modifier.padding(12.dp), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Tab(selected = uiState.activeTab == 2, onClick = { viewModel.setActiveTab(2) }) {
                    Text("2. Hỏi Đáp AI", modifier = Modifier.padding(12.dp), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Tab(selected = uiState.activeTab == 3, onClick = { viewModel.setActiveTab(3) }) {
                    Text("3. Ảnh Lâm Sàng", modifier = Modifier.padding(12.dp), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Tab(selected = uiState.activeTab == 4, onClick = { viewModel.setActiveTab(4) }) {
                    Text("4. PPG & BMI", modifier = Modifier.padding(12.dp), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Tab(selected = uiState.activeTab == 5, onClick = { viewModel.setActiveTab(5) }) {
                    Text("5. Kết Quả AI", modifier = Modifier.padding(12.dp), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                when (uiState.activeTab) {
                    // TAB 1: 3D ANATOMICAL BODY MAP SELECTOR
                    1 -> {
                        Text("1. Sơ đồ cơ thể 3D - Chọn vùng tổn thương:", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, color = Color(0xFF0F172A))
                        Text("Chạm trực tiếp vào từng vùng giải phẫu trên mô hình 3D hoặc bấm chọn từ danh sách bên dưới.", fontSize = 11.sp, color = Color.Gray)

                        Body3DView(
                            selectedRegions = uiState.selectedBodyRegions,
                            onRegionSelected = { region -> viewModel.toggleBodyRegion(region) },
                            onClearAll = { viewModel.clearBodyRegions() }
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Button(
                            onClick = {
                                if (uiState.selectedBodyRegions.isEmpty() && uiState.selectedBodyAreas.isEmpty()) {
                                    scope.launch {
                                        snackbarHostState.showSnackbar("Vui lòng chọn ít nhất một vùng tổn thương.")
                                    }
                                } else {
                                    viewModel.setActiveTab(2)
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = primaryGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Tiếp Theo: Hỏi Đáp AI Thích Ứng >", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }

                    // TAB 2: ADAPTIVE SYMPTOM INTERVIEW
                    2 -> {
                        Text("2. Khảo sát trắc nghiệm AI thích ứng", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, color = Color(0xFF0F172A))

                        // Pain Scale Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(16.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                val painEmoji = when (uiState.painLevel) {
                                    in 1..3 -> "😊 Nhẹ"
                                    in 4..6 -> "😐 Vừa"
                                    in 7..8 -> "😣 Nặng"
                                    else -> "😫 Rất dữ dội"
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text("Mức độ đau (Pain Scale):", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Surface(
                                        color = if (uiState.painLevel >= 7) Color(0xFFFFE4E6) else Color(0xFFFEF3C7),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(
                                            "$painEmoji (${uiState.painLevel}/10)",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 12.sp,
                                            color = if (uiState.painLevel >= 7) Color(0xFFE11D48) else Color(0xFFD97706),
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }
                                Slider(
                                    value = uiState.painLevel.toFloat(),
                                    onValueChange = { viewModel.setPainLevel(it.toInt()) },
                                    valueRange = 1f..10f,
                                    steps = 8,
                                    colors = SliderDefaults.colors(thumbColor = primaryGreen, activeTrackColor = primaryGreen)
                                )
                            }
                        }

                        // Warning Signs
                        Text("Dấu hiệu cảnh báo đi kèm:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            warningSigns.take(3).forEach { sign ->
                                val isChecked = uiState.selectedWarnings.contains(sign)
                                FilterChip(
                                    selected = isChecked,
                                    onClick = { viewModel.toggleWarning(sign) },
                                    label = { Text(sign, fontSize = 10.sp) }
                                )
                            }
                        }

                        // Adaptive Domain Questions
                        Text("Câu hỏi AI chuyên biệt theo vùng tổn thương:", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        uiState.adaptiveQuestions.take(3).forEach { q ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, Color(0xFFCBD5E1))
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(q.text, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = primaryGreen)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    if (q.type == QuestionType.SINGLE_CHOICE || q.type == QuestionType.MULTI_CHOICE) {
                                        q.options.forEach { opt ->
                                            val isSelected = uiState.questionAnswers[q.id] == opt
                                            OutlinedButton(
                                                onClick = { viewModel.answerQuestion(q.id, opt) },
                                                modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                                                colors = ButtonDefaults.outlinedButtonColors(
                                                    containerColor = if (isSelected) primaryGreen else Color.Transparent,
                                                    contentColor = if (isSelected) Color.White else Color(0xFF1E293B)
                                                ),
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Text(opt, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Symptoms Text Input
                        OutlinedTextField(
                            value = uiState.symptomsText,
                            onValueChange = { viewModel.setSymptomsText(it) },
                            label = { Text("Mô tả thêm triệu chứng (nếu có)") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 2,
                            shape = RoundedCornerShape(12.dp)
                        )

                        Button(
                            onClick = { viewModel.setActiveTab(3) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = primaryGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Tiếp Theo: Phân Tích Ảnh Lâm Sàng >", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }

                    // TAB 3: CLINICAL IMAGE VISION PIPELINE
                    3 -> {
                        Text("3. Phân tích hình ảnh lâm sàng (AI Vision Pipeline)", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, color = Color(0xFF0F172A))
                        Text("Tải lên ảnh vùng tổn thương da, mắt, họng hoặc vết thương để AI kiểm tra chất lượng & phân tích.", fontSize = 11.sp, color = Color.Gray)

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(170.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(1.5.dp, Color(0xFFCBD5E1))
                        ) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.CameraAlt, contentDescription = null, tint = primaryGreen, modifier = Modifier.size(44.dp))
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("Chụp ảnh trực tiếp hoặc tải từ Thư viện", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569))
                                    Text("Hệ thống tự động kiểm tra mờ / ánh sáng", fontSize = 10.sp, color = Color.Gray)
                                }
                            }
                        }

                        uiState.visionResult?.let { vision ->
                            Surface(
                                color = if (vision.imageQuality.isValid) Color(0xFFDCFCE7) else Color(0xFFFFE4E6),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text("Chất lượng ảnh: ${vision.imageQuality.displayName}", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                    vision.findings.forEach { finding ->
                                        Text("• ${finding.displayName} (${(finding.confidence * 100).toInt()}%)", fontSize = 11.sp, color = primaryGreen, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = { viewModel.setActiveTab(4) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = primaryGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Tiếp Theo: Đo Nhịp Tim PPG & BMI >", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }

                    // TAB 4: VITALS PPG & BMI ENGINE
                    4 -> {
                        Text("4. Đo Nhịp Tim PPG & Chỉ Số BMI Sinh Hiệu", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, color = Color(0xFF0F172A))

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5)),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(1.dp, Color(0xFFA7F3D0))
                        ) {
                            Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(40.dp))
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Nhịp tim PPG đo qua Camera: ${uiState.measuredHeartRate} BPM", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, color = primaryGreen)
                                Text("Chỉ số BMI tính toán: ${uiState.bmiValue}", fontSize = 12.sp, color = Color(0xFF047857), fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 2.dp))
                                Button(
                                    onClick = { viewModel.setHeartRate(78) },
                                    colors = ButtonDefaults.buttonColors(containerColor = primaryGreen),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.padding(top = 8.dp)
                                ) {
                                    Text("Thực Hiện Đo Nhịp Tim 15s", fontSize = 11.sp)
                                }
                            }
                        }

                        Button(
                            onClick = { viewModel.runAIAnalysis() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = primaryGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color(0xFFFDE047))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Tổng Hợp AI Screening & Triage Kết Quả", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                        }
                    }

                    // TAB 5: AI SCREENING RESULT CARD & RED FLAG OVERRIDE
                    5 -> {
                        if (uiState.isAnalyzing) {
                            Box(modifier = Modifier.fillMaxWidth().height(260.dp), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    CircularProgressIndicator(color = primaryGreen)
                                    Spacer(modifier = Modifier.height(16.dp))
                                    Text("Hệ thống AI đang tổng hợp 5 nguồn dữ liệu...", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }
                        } else {
                            val payload = uiState.screeningPayload
                            val triage = uiState.triageResult

                            payload?.let { res ->
                                // Emergency Red Flag Banner if override triggered!
                                if (res.hasRedFlags) {
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF1F2)),
                                        shape = RoundedCornerShape(16.dp),
                                        border = BorderStroke(2.dp, Color(0xFFDC2626))
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFDC2626))
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text("🔴 CẢNH BÁO ĐỎ Y TẾ (RED FLAG)", fontWeight = FontWeight.Black, fontSize = 14.sp, color = Color(0xFFDC2626))
                                            }
                                            res.redFlags.forEach { rf ->
                                                Text("• ${rf.title}: ${rf.description}", fontSize = 11.sp, color = Color(0xFF991B1B), fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                                            }
                                        }
                                    }
                                }

                                // Risk Level & Score Card
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (res.riskLevel == RiskLevel.EMERGENCY) Color(0xFFFFF1F2) else Color(0xFFFFFBEB)
                                    ),
                                    shape = RoundedCornerShape(16.dp),
                                    border = BorderStroke(1.5.dp, if (res.riskLevel == RiskLevel.EMERGENCY) Color(0xFFF43F5E) else Color(0xFFF59E0B))
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text("Đánh Giá Nguy Cơ: ${res.riskLevel.label}", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color(0xFF0F172A))
                                        Text("Điểm Nguy Cơ AI: ${res.riskScore}/100 (Thuật toán: ${res.algorithmVersion})", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = primaryGreen, modifier = Modifier.padding(top = 4.dp))

                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text("Chuyên khoa đề xuất ưu tiên:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                        res.specialties.take(2).forEach { spec ->
                                            Text("• ${spec.rank}. ${spec.specialtyName} (Độ phù hợp ${(spec.score * 100).toInt()}%)", fontSize = 11.sp, color = primaryGreen, fontWeight = FontWeight.Bold)
                                        }

                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text("Khuyên nghị hành động: ${res.recommendation.title}", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = Color(0xFF0F172A))
                                        Text(res.recommendation.description, fontSize = 11.sp, color = Color(0xFF475569))
                                    }
                                }

                                // Non-diagnostic Disclaimer
                                Text(
                                    "⚠️ Disclaimer: Kết quả này chỉ đóng vai trò hỗ trợ sàng lọc ban đầu và không thay thế cho chẩn đoán y tế xác định từ Bác sĩ.",
                                    fontSize = 10.sp,
                                    color = Color.Gray,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                // Appointment Integration Button
                                Button(
                                    onClick = {
                                        val topSpec = res.specialties.firstOrNull()?.specialtyName ?: "Nội tổng quát"
                                        onCompletedToBooking(null, res.specialties.firstOrNull()?.specialtyId, null, "AI Sàng lọc (${res.riskLevel.label}): ${res.summary}")
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(52.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = primaryGreen),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = Color.White)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("ĐẶT LỊCH KHÁM NGAY THEO GỢI Ý AI", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
