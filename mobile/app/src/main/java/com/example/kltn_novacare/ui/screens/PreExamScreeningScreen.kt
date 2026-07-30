package com.example.kltn_novacare.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.ui.components.BodyDiagramView

@Composable
fun PreExamScreeningScreen(
    onSkipScreening: () -> Unit,
    onCompletedToBooking: (doctorId: String?, specialtyId: String?, hospitalId: String?, reason: String) -> Unit
) {
    var step by remember { mutableStateOf(0) }
    var age by remember { mutableStateOf("35") }
    var gender by remember { mutableStateOf("Nam") }
    var medicalHistory by remember { mutableStateOf("") }
    var symptomText by remember { mutableStateOf("") }
    var selectedBodyAreas by remember { mutableStateOf(setOf<String>()) }

    var riskLevel by remember { mutableStateOf("CONSULT") }
    var riskLabel by remember { mutableStateOf("🟡 Khuyên Dùng Khám Bác Sĩ Chuyên Khoa") }
    var suggestedSpecialty by remember { mutableStateOf("Tim mạch") }

    val primaryGreen = Color(0xFF0C4B39)
    val accentGreen = Color(0xFF66FF33)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8FAFC))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Header Banner & Skip Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(primaryGreen, RoundedCornerShape(16.dp))
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Sàng Lọc Sức Khỏe AI",
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                    fontSize = 16.sp
                )
                Text(
                    text = "Đánh giá nguy cơ & gợi ý bác sĩ",
                    color = Color(0xFFA7F3D0),
                    fontSize = 11.sp
                )
            }

            Button(
                onClick = onSkipScreening,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF064E3B))
            ) {
                Text("Bỏ qua", color = accentGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // STEP 0: Thông tin cơ bản
        if (step == 0) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "1. Thông Tin Bệnh Nhân Ban Đầu",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp,
                        color = Color(0xFF0F172A)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = age,
                        onValueChange = { age = it },
                        label = { Text("Tuổi") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = medicalHistory,
                        onValueChange = { medicalHistory = it },
                        label = { Text("Tiền sử bệnh lý (Tăng huyết áp, Đái tháo đường...)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { step = 1 },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = primaryGreen)
                    ) {
                        Text("Tiếp tục nhập triệu chứng", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // STEP 1: Nhập triệu chứng & Chọn vùng đau
        if (step == 1) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "2. Mô Tả Triệu Chứng Đa Phương Thức",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp,
                        color = Color(0xFF0F172A)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = symptomText,
                        onValueChange = { symptomText = it },
                        label = { Text("Mô tả triệu chứng (đau ngực, sốt, ho...)") },
                        modifier = Modifier.fillMaxWidth().height(100.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    BodyDiagramView(
                        selectedAreas = selectedBodyAreas,
                        onAreaToggle = { area ->
                            selectedBodyAreas = if (selectedBodyAreas.contains(area)) {
                                selectedBodyAreas - area
                            } else {
                                selectedBodyAreas + area
                            }
                        }
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { step = 0 },
                            modifier = Modifier.weight(1f).height(48.dp)
                        ) {
                            Text("Quay lại")
                        }

                        Button(
                            onClick = { step = 2 },
                            modifier = Modifier.weight(1f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = primaryGreen)
                        ) {
                            Text("Tiếp tục", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // STEP 2: AI Hỏi đáp thích ứng
        if (step == 2) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "3. AI Đặt Câu Hỏi Thích Ứng Bổ Sung",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp,
                        color = Color(0xFF0F172A)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Câu 1: Mức độ đau của bạn ở mức nào từ 1 đến 10?",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    listOf("1-3 (Nhẹ)", "4-6 (Vừa)", "7-8 (Nặng)", "9-10 (Dữ dội)").forEach { opt ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .background(Color(0xFFF1F5F9), RoundedCornerShape(8.dp))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(opt, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { step = 3 },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = primaryGreen)
                    ) {
                        Text("Xem kết quả đánh giá", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // STEP 3: Màn hình Kết quả & Đề xuất Bác sĩ
        if (step == 3) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Risk Badge Banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFFEF3C7), RoundedCornerShape(12.dp))
                            .border(1.dp, Color(0xFFF59E0B), RoundedCornerShape(12.dp))
                            .padding(14.dp)
                    ) {
                        Column {
                            Text(
                                text = riskLabel,
                                fontWeight = FontWeight.Black,
                                fontSize = 13.sp,
                                color = Color(0xFFB45309)
                            )
                            Text(
                                text = "Triệu chứng cần được bác sĩ kiểm tra và chẩn đoán.",
                                fontSize = 11.sp,
                                color = Color(0xFF92400E)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Chuyên khoa khuyến nghị: $suggestedSpecialty",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = primaryGreen
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            onCompletedToBooking(null, null, null, symptomText)
                        },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = primaryGreen)
                    ) {
                        Text("📋 Đặt Lịch Khám Theo Đề Xuất", color = Color.White, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}
