package com.example.kltn_novacare.ui.screens.screening

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.MobileScreeningResult
import com.example.kltn_novacare.data.model.ScreeningImageAssessment
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.ScreeningImage

// ==============================================================================
// 1. RESULT HERO CARD (Specialty & Summary)
// ==============================================================================
@Composable
fun ResultHeroCard(
    result: MobileScreeningResult,
    modifier: Modifier = Modifier
) {
    val specialty = result.recommendedSpecialtyName ?: "Khám tổng quát / Đang đánh giá"
    val riskLabel = result.riskLabel
    val riskLevel = result.riskLevel

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = PrimaryLight.copy(alpha = 0.7f)),
        border = BorderStroke(1.5.dp, PrimaryBorder)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Label & Risk Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(Primary, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Verified,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "GỢI Ý PHÙ HỢP NHẤT",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = PrimaryDark,
                        letterSpacing = 0.5.sp
                    )
                }

                // Show risk level only if source data actually provides it
                if (!riskLabel.isNullOrBlank()) {
                    val badgeColor = when (riskLevel) {
                        "EMERGENCY" -> Color(0xFFDC2626)
                        "URGENT" -> Color(0xFFEA580C)
                        else -> PrimaryDark
                    }
                    val badgeBg = when (riskLevel) {
                        "EMERGENCY" -> Color(0xFFFEE2E2)
                        "URGENT" -> Color(0xFFFFEDD5)
                        else -> Color.White
                    }

                    Surface(
                        color = badgeBg,
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, badgeColor.copy(alpha = 0.4f))
                    ) {
                        Text(
                            text = riskLabel,
                            color = badgeColor,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            // Specialty Name (Huge, prominent, crisp)
            Text(
                text = specialty,
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                color = PrimaryDark,
                lineHeight = 30.sp
            )

            // Clinical summary
            if (!result.summary.isNullOrBlank()) {
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, BorderLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = result.summary,
                        fontSize = 13.sp,
                        color = TextPrimary,
                        lineHeight = 19.sp,
                        modifier = Modifier.padding(14.dp)
                    )
                }
            }
        }
    }
}

// ==============================================================================
// 2. RECOMMENDATION REASONS CARD ("Vì sao gợi ý?")
// ==============================================================================
@Composable
fun RecommendationReasonsCard(
    result: MobileScreeningResult,
    modifier: Modifier = Modifier
) {
    val observations = result.triageDetails?.keyObservations.orEmpty()
    val hasRules = result.recommendationSource == "QUESTIONNAIRE_RULES"
    val hasRag = result.recommendationSource == "RAG_LLM"

    ScreeningSectionCard(
        title = "Vì sao hệ thống gợi ý chuyên khoa này?",
        subtitle = "Căn cứ từ các triệu chứng, câu trả lời trắc nghiệm và dữ liệu lâm sàng.",
        icon = Icons.Outlined.Psychology,
        modifier = modifier
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (observations.isNotEmpty()) {
                observations.forEach { observation ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.Top
                    ) {
                        Box(
                            modifier = Modifier
                                .padding(top = 6.dp)
                                .size(6.dp)
                                .background(Primary, CircleShape)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = observation,
                            fontSize = 13.sp,
                            color = TextPrimary,
                            lineHeight = 18.sp
                        )
                    }
                }
            } else {
                Text(
                    text = "Gợi ý được tổng hợp dựa trên vùng bất thường và các câu hỏi lâm sàng bạn đã xác nhận.",
                    fontSize = 13.sp,
                    color = TextSecondary
                )
            }

            // Source explanation
            Spacer(modifier = Modifier.height(4.dp))
            Surface(
                color = Color(0xFFF8FAFC),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = when {
                        hasRules -> "Định hướng dựa trên thông tin đã xác nhận và quy tắc sàng lọc y khoa."
                        hasRag -> "Định hướng có đối chiếu cơ sở tri thức y khoa tham khảo (RAG/LLM)."
                        else -> "Định hướng dựa trên thuật toán tổng hợp thông tin lâm sàng NovaCare."
                    },
                    fontSize = 11.sp,
                    color = TextSecondary,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                )
            }
        }
    }
}

// ==============================================================================
// 3. SCREENING DATA SUMMARY CARD
// ==============================================================================
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ScreeningDataSummaryCard(
    regionNames: List<String>,
    pain: String,
    duration: String,
    bpm: Int?,
    hasImages: Boolean,
    hasVoice: Boolean,
    modifier: Modifier = Modifier
) {
    ScreeningSectionCard(
        title = "Tóm tắt dữ liệu thu thập",
        subtitle = "Các yếu tố đã được đối chiếu trong phiên này.",
        icon = Icons.Outlined.Checklist,
        modifier = modifier
    ) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            // Vùng cơ thể
            if (regionNames.isNotEmpty()) {
                DataSummaryChip(
                    icon = Icons.Outlined.HealthAndSafety,
                    label = "Vùng: ${regionNames.joinToString()}"
                )
            }

            // Thang đau
            if (pain.isNotBlank()) {
                DataSummaryChip(
                    icon = Icons.Outlined.Timer,
                    label = "Mức đau: $pain/10"
                )
            }

            // Thời gian
            if (duration.isNotBlank()) {
                DataSummaryChip(
                    icon = Icons.Outlined.Schedule,
                    label = "Khởi phát: $duration"
                )
            }

            // Nhịp tim
            if (bpm != null) {
                DataSummaryChip(
                    icon = Icons.Outlined.Favorite,
                    label = "Nhịp tim: $bpm BPM"
                )
            }

            // Ảnh
            if (hasImages) {
                DataSummaryChip(
                    icon = Icons.Outlined.Image,
                    label = "Có ảnh tổn thương"
                )
            }

            // Giọng nói
            if (hasVoice) {
                DataSummaryChip(
                    icon = Icons.Outlined.GraphicEq,
                    label = "Có bản ghi lời kể"
                )
            }
        }
    }
}

@Composable
private fun DataSummaryChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String
) {
    Surface(
        color = Color(0xFFF1F5F9),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = PrimaryDark,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary
            )
        }
    }
}

// ==============================================================================
// 4. RESULT IMAGE ASSESSMENTS CARD
// ==============================================================================
@Composable
fun ResultImageAssessmentsCard(
    images: List<ScreeningImage>,
    assessments: List<ScreeningImageAssessment>?,
    findings: List<String>?,
    modifier: Modifier = Modifier
) {
    var expandedImage by remember { mutableStateOf<ScreeningImage?>(null) }

    if (images.isNotEmpty() || !findings.isNullOrEmpty()) {
        ScreeningSectionCard(
            title = "Phân tích ảnh tổn thương",
            subtitle = "Quan sát bề mặt bên ngoài được AI ghi nhận từ ảnh đã chụp.",
            icon = Icons.Outlined.Image,
            modifier = modifier
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                images.forEachIndexed { index, image ->
                    val assessment = assessments?.find { it.imageIndex == index }
                    Surface(
                        color = Color(0xFFF8FAFC),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(70.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.Black)
                                    .clickable { expandedImage = image }
                            ) {
                                AsyncImage(
                                    model = image.file,
                                    contentDescription = "Ảnh ${index + 1}",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Ảnh ${index + 1} (chạm để phóng to)",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryDark
                                )

                                val obs = assessment?.observations.orEmpty()
                                if (obs.isNotEmpty()) {
                                    obs.forEach {
                                        Text("• $it", fontSize = 11.sp, color = TextPrimary)
                                    }
                                } else {
                                    Text(
                                        text = when (assessment?.status) {
                                            "FAILED" -> "Chưa phân tích được ảnh này."
                                            "LOW_QUALITY_OR_UNRELATED" -> "Ảnh chưa đủ nét hoặc không phù hợp với vùng chọn."
                                            else -> "Đã nhận diện bề mặt ảnh tổn thương."
                                        },
                                        fontSize = 11.sp,
                                        color = TextSecondary
                                    )
                                }
                            }
                        }
                    }
                }

                if (assessments.isNullOrEmpty() && !findings.isNullOrEmpty()) {
                    findings.forEach { finding ->
                        Text("• $finding", fontSize = 12.sp, color = TextPrimary)
                    }
                }

                Text(
                    text = "Lưu ý: Quan sát chỉ phản ánh bề mặt nhìn thấy, không thay thế xét nghiệm da liễu hoặc chẩn đoán hình ảnh chuyên sâu.",
                    fontSize = 10.sp,
                    color = TextMuted,
                    lineHeight = 14.sp
                )
            }
        }
    }

    // Zoom Dialog
    expandedImage?.let { img ->
        var scale by remember(img) { mutableFloatStateOf(1f) }
        AlertDialog(
            onDismissRequest = { expandedImage = null },
            shape = RoundedCornerShape(16.dp),
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Ảnh đã gửi", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    IconButton(onClick = { expandedImage = null }) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng")
                    }
                }
            },
            text = {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(320.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Black),
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = img.file,
                        contentDescription = "Chi tiết ảnh",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .fillMaxSize()
                            .pointerInput(img) {
                                detectTransformGestures { _, _, zoom, _ ->
                                    scale = (scale * zoom).coerceIn(1f, 4f)
                                }
                            }
                            .graphicsLayer {
                                scaleX = scale
                                scaleY = scale
                            }
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { expandedImage = null }) {
                    Text("Đóng", fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

// ==============================================================================
// 5. MEDICAL NOTES & CITATIONS CARD
// ==============================================================================
@Composable
fun MedicalNotesAndCitationsCard(
    result: MobileScreeningResult,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val citations = result.citations.orEmpty()
    val providerErrors = result.providerErrors.orEmpty()

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Citations / Reference Articles
        if (citations.isNotEmpty()) {
            ScreeningSectionCard(
                title = "Tài liệu y khoa tham khảo",
                subtitle = "Các nguồn đối chiếu từ thư viện tri thức y tế.",
                icon = Icons.Outlined.MenuBook
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    citations.forEach { citation ->
                        Surface(
                            color = Color(0xFFF8FAFC),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    if (citation.sourceUrl.startsWith("https://") || citation.sourceUrl.startsWith("http://")) {
                                        runCatching {
                                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(citation.sourceUrl)))
                                        }
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.OpenInNew,
                                    contentDescription = null,
                                    tint = PrimaryDark,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = citation.title,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = PrimaryDark,
                                    textDecoration = TextDecoration.Underline,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Provider Failure Warning if any
        if (providerErrors.isNotEmpty()) {
            Surface(
                color = Color(0xFFFEF2F2),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color(0xFFFECACA)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Info,
                        contentDescription = null,
                        tint = Color(0xFFDC2626),
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (providerErrors.any { it.code == "INSUFFICIENT_BALANCE" })
                            "Phần đối chiếu mở rộng AI hiện đang bảo trì tạm thời. Định hướng chuyên khoa vẫn được hoàn tất qua bộ quy tắc sàng lọc."
                        else "Một số phần đối chiếu trực tuyến chưa hoàn tất. Kết quả định hướng vẫn được bảo lưu.",
                        fontSize = 11.sp,
                        color = Color(0xFF991B1B),
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Standard Medical Disclaimer
        MedicalDisclaimerBanner(
            text = "Lưu ý y tế quan trọng: Kết quả sàng lọc AI mang tính định hướng chuyên khoa phù hợp và không thay thế chẩn đoán xác định của bác sĩ. Nếu triệu chứng trở nặng đột ngột, vui lòng đến cơ sở y tế gần nhất."
        )
    }
}

// ==============================================================================
// 6. EMERGENCY GUIDANCE CARD (If nextAction == "EMERGENCY_GUIDANCE")
// ==============================================================================
@Composable
fun EmergencyGuidanceCard(
    onCall115: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
        border = BorderStroke(2.dp, Color(0xFFEF4444))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Outlined.WarningAmber,
                    contentDescription = null,
                    tint = Color(0xFFDC2626),
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Khuyến cáo y tế khẩn cấp",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF991B1B)
                )
            }

            Text(
                text = "Hệ thống ghi nhận dấu hiệu nguy cơ cao. Bạn nên đến phòng cấp cứu hoặc liên hệ y tế khẩn cấp ngay thay vì chờ đặt lịch khám thông thường.",
                fontSize = 13.sp,
                color = Color(0xFF7F1D1D),
                lineHeight = 18.sp
            )

            Button(
                onClick = onCall115,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp)
            ) {
                Icon(Icons.Filled.Phone, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Gọi cấp cứu 115 ngay", fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
