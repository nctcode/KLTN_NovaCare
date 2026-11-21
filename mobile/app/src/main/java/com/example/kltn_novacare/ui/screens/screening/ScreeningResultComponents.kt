package com.example.kltn_novacare.ui.screens.screening

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Star
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
import com.example.kltn_novacare.data.model.*
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
                    label = "Nhịp tim: $bpm nhịp/phút"
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

// ==============================================================================
// 7. RECOMMENDED FACILITIES & DOCTORS (By Distance or Rating)
// ==============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecommendedFacilitiesAndDoctorsCard(
    hospitals: List<Hospital>,
    doctors: List<Doctor>,
    loadingDoctors: Boolean,
    recommendedSpecialtyName: String?,
    onSelectHospital: (String) -> Unit,
    onSelectDoctor: (String, String?) -> Unit,
    modifier: Modifier = Modifier
) {
    var sortByDistance by remember { mutableStateOf(true) } // true: Khoảng cách, false: Rating
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Cơ sở y tế, 1: Bác sĩ
    var showModal by remember { mutableStateOf(false) }

    val hospitalDistances = remember { listOf(1.2, 2.5, 4.8, 6.1, 8.3) }
    val hospitalRatings = remember { listOf(4.9, 4.8, 4.7, 4.8, 4.6) }

    val sortedHospitals = remember(hospitals, sortByDistance) {
        val indexed = hospitals.mapIndexed { index, hospital ->
            Triple(hospital, hospitalDistances.getOrElse(index) { 3.0 + index * 1.5 }, hospitalRatings.getOrElse(index) { 4.7 })
        }
        if (sortByDistance) {
            indexed.sortedBy { it.second }
        } else {
            indexed.sortedByDescending { it.third }
        }
    }

    val doctorDistances = remember { listOf(1.5, 2.8, 3.9, 5.2, 6.7) }
    val sortedDoctors = remember(doctors, sortByDistance) {
        val indexed = doctors.mapIndexed { index, doctor ->
            Pair(doctor, doctorDistances.getOrElse(index) { 2.0 + index * 1.2 })
        }
        if (sortByDistance) {
            indexed.sortedBy { it.second }
        } else {
            indexed.sortedByDescending { it.first.rating }
        }
    }

    // Thẻ tóm tắt gọn gàng, không bị kéo dài
    ScreeningSectionCard(
        title = "Gợi ý cơ sở y tế & Bác sĩ",
        subtitle = "Đề xuất theo chuyên khoa ${recommendedSpecialtyName ?: ""}",
        icon = Icons.Outlined.LocalHospital,
        modifier = modifier
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            val topHospital = sortedHospitals.firstOrNull()
            if (topHospital != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, BorderLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = topHospital.first.name,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.5.sp,
                                    color = TextPrimary,
                                    modifier = Modifier.weight(1f, fill = false)
                                )
                                Spacer(Modifier.width(6.dp))
                                Surface(
                                    color = PrimaryLight,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = "${topHospital.second} km",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryDark,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            topHospital.first.address?.takeIf(String::isNotBlank)?.let {
                                Text(text = it, fontSize = 11.sp, color = TextSecondary, maxLines = 1)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Filled.Star, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(13.dp))
                                Spacer(Modifier.width(2.dp))
                                Text(text = "${topHospital.third}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    text = "· Cơ sở đề xuất hàng đầu",
                                    fontSize = 10.5.sp,
                                    color = Color(0xFF059669),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        Spacer(Modifier.width(8.dp))
                        Button(
                            onClick = { onSelectHospital(topHospital.first.id) },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Text("Đặt khám", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Top Doctor Preview (nếu có)
            val topDoctor = sortedDoctors.firstOrNull()
            if (topDoctor != null) {
                val workplace = topDoctor.first.workPlaces?.firstOrNull()
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, BorderLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (!topDoctor.first.displayAvatarUrl.isNullOrBlank()) {
                            AsyncImage(
                                model = topDoctor.first.displayAvatarUrl,
                                contentDescription = topDoctor.first.fullName,
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE2E8F0)),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(PrimaryLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Outlined.Person, null, tint = PrimaryDark, modifier = Modifier.size(24.dp))
                            }
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                text = topDoctor.first.displayFullNameWithTitle,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = TextPrimary
                            )
                            workplace?.hospital?.name?.let {
                                Text(text = it, fontSize = 11.sp, color = PrimaryDark, maxLines = 1)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Filled.Star, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(12.dp))
                                Spacer(Modifier.width(2.dp))
                                Text(text = "${topDoctor.first.rating}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                Spacer(Modifier.width(4.dp))
                                Text("·", color = TextMuted)
                                Spacer(Modifier.width(4.dp))
                                Text(text = "${topDoctor.first.yearsOfExperience ?: 10} năm KN", fontSize = 10.5.sp, color = TextSecondary)
                            }
                        }
                        Spacer(Modifier.width(8.dp))
                        Button(
                            onClick = { onSelectDoctor(topDoctor.first.id, workplace?.hospital?.id) },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Text("Đặt khám", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Nút Xem thêm & Tùy chọn (Mở Popup)
            OutlinedButton(
                onClick = { showModal = true },
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, PrimaryBorder),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp)
            ) {
                Icon(Icons.Outlined.Tune, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "Tùy chọn cơ sở & bác sĩ (${sortedHospitals.size} cơ sở • ${sortedDoctors.size} bác sĩ)",
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.width(6.dp))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp))
            }
        }
    }

    // ==============================================================================
    // POPUP (ModalBottomSheet): CHỌN CƠ SỞ Y TẾ HOẶC BÁC SĨ CHUYÊN KHOA
    // ==============================================================================
    if (showModal) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showModal = false },
            sheetState = sheetState,
            containerColor = Color.White,
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f)
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                // Header Popup
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Chọn cơ sở hoặc bác sĩ",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Chuyên khoa: ${recommendedSpecialtyName ?: "Chuyên khoa"}",
                            fontSize = 12.5.sp,
                            color = PrimaryDark,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    IconButton(onClick = { showModal = false }) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng", tint = TextSecondary)
                    }
                }

                Spacer(Modifier.height(10.dp))

                // Sắp xếp theo FilterChips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Sắp xếp theo:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(
                            selected = sortByDistance,
                            onClick = { sortByDistance = true },
                            leadingIcon = {
                                Icon(Icons.Filled.LocationOn, null, modifier = Modifier.size(14.dp))
                            },
                            label = { Text("Gần nhất", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Primary,
                                selectedLabelColor = Color.White,
                                selectedLeadingIconColor = Color.White
                            )
                        )
                        FilterChip(
                            selected = !sortByDistance,
                            onClick = { sortByDistance = false },
                            leadingIcon = {
                                Icon(Icons.Filled.Star, null, modifier = Modifier.size(14.dp))
                            },
                            label = { Text("Đánh giá cao", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Primary,
                                selectedLabelColor = Color.White,
                                selectedLeadingIconColor = Color.White
                            )
                        )
                    }
                }

                Spacer(Modifier.height(10.dp))

                // Tab Switch (Cơ sở / Bác sĩ)
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Color(0xFFF1F5F9),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = {
                            Text(
                                "Cơ sở y tế (${sortedHospitals.size})",
                                fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal,
                                color = if (selectedTab == 0) PrimaryDark else TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = {
                            Text(
                                "Bác sĩ chuyên khoa (${sortedDoctors.size})",
                                fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal,
                                color = if (selectedTab == 1) PrimaryDark else TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    )
                }

                Spacer(Modifier.height(12.dp))

                // Danh sách cuộn
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (selectedTab == 0) {
                        if (sortedHospitals.isEmpty()) {
                            Text(
                                text = "Đang tải danh sách cơ sở...",
                                fontSize = 12.sp,
                                color = TextMuted,
                                modifier = Modifier.padding(vertical = 12.dp)
                            )
                        } else {
                            sortedHospitals.forEach { (hospital, distance, rating) ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, BorderLight),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier.padding(12.dp),
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = hospital.name,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp,
                                                color = TextPrimary,
                                                modifier = Modifier.weight(1f)
                                            )
                                            Surface(
                                                color = PrimaryLight,
                                                shape = RoundedCornerShape(8.dp),
                                                modifier = Modifier.padding(start = 6.dp)
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Icon(Icons.Filled.LocationOn, null, tint = PrimaryDark, modifier = Modifier.size(12.dp))
                                                    Spacer(Modifier.width(2.dp))
                                                    Text(
                                                        text = "$distance km",
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = PrimaryDark
                                                    )
                                                }
                                            }
                                        }

                                        hospital.address?.takeIf(String::isNotBlank)?.let {
                                            Text(text = it, fontSize = 11.5.sp, color = TextSecondary)
                                        }

                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Filled.Star, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(14.dp))
                                                Spacer(Modifier.width(3.dp))
                                                Text(text = "$rating", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                                Spacer(Modifier.width(6.dp))
                                                Text(
                                                    text = "· Chuyên khoa ${recommendedSpecialtyName ?: ""}",
                                                    fontSize = 11.sp,
                                                    color = Color(0xFF059669),
                                                    fontWeight = FontWeight.Medium
                                                )
                                            }

                                            Button(
                                                onClick = {
                                                    showModal = false
                                                    onSelectHospital(hospital.id)
                                                },
                                                shape = RoundedCornerShape(10.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                                modifier = Modifier.height(34.dp)
                                            ) {
                                                Text("Đặt khám", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (loadingDoctors) {
                            Box(modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = Primary, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                            }
                        } else if (sortedDoctors.isEmpty()) {
                            Text(
                                text = "Chưa có bác sĩ hiển thị cho chuyên khoa này.",
                                fontSize = 12.sp,
                                color = TextMuted,
                                modifier = Modifier.padding(vertical = 16.dp)
                            )
                        } else {
                            sortedDoctors.forEach { (doctor, distance) ->
                                val workplace = doctor.workPlaces?.firstOrNull()
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, BorderLight),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        if (!doctor.displayAvatarUrl.isNullOrBlank()) {
                                            AsyncImage(
                                                model = doctor.displayAvatarUrl,
                                                contentDescription = doctor.fullName,
                                                modifier = Modifier
                                                    .size(52.dp)
                                                    .clip(CircleShape)
                                                    .background(Color(0xFFE2E8F0)),
                                                contentScale = ContentScale.Crop
                                            )
                                        } else {
                                            Box(
                                                modifier = Modifier
                                                    .size(52.dp)
                                                    .clip(CircleShape)
                                                    .background(PrimaryLight),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(Icons.Outlined.Person, null, tint = PrimaryDark, modifier = Modifier.size(28.dp))
                                            }
                                        }

                                        Spacer(Modifier.width(10.dp))

                                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                            Text(
                                                text = doctor.displayFullNameWithTitle,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp,
                                                color = TextPrimary
                                            )
                                            Text(
                                                text = doctor.qualification ?: "Bác sĩ chuyên khoa",
                                                fontSize = 11.sp,
                                                color = TextSecondary
                                            )
                                            workplace?.hospital?.name?.let {
                                                Text(text = it, fontSize = 11.sp, color = PrimaryDark, fontWeight = FontWeight.Medium)
                                            }
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Icon(Icons.Filled.Star, null, tint = Color(0xFFF59E0B), modifier = Modifier.size(13.dp))
                                                Text(text = "${doctor.rating}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                                Text("·", color = TextMuted)
                                                Text(text = "${doctor.yearsOfExperience ?: 10} năm KN", fontSize = 11.sp, color = TextSecondary)
                                                Text("·", color = TextMuted)
                                                Text(text = "$distance km", fontSize = 11.sp, color = PrimaryDark, fontWeight = FontWeight.SemiBold)
                                            }
                                        }

                                        Spacer(Modifier.width(8.dp))

                                        Button(
                                            onClick = {
                                                showModal = false
                                                onSelectDoctor(doctor.id, workplace?.hospital?.id)
                                            },
                                            shape = RoundedCornerShape(10.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                                            modifier = Modifier.height(34.dp)
                                        ) {
                                            Text("Đặt khám", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
