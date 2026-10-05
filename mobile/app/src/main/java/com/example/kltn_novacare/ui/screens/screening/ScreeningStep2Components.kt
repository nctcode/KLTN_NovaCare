package com.example.kltn_novacare.ui.screens.screening

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.HelpOutline
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.ScreeningQuestion
import com.example.kltn_novacare.data.model.ScreeningRegion
import com.example.kltn_novacare.ui.theme.*

// ==============================================================================
// STEP 2 - COMPONENT 1: PAIN & DURATION CARD
// ==============================================================================
@Composable
fun PainAndDurationCard(
    pain: String,
    onPainChange: (String) -> Unit,
    duration: String,
    onDurationChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val currentPainInt = pain.toIntOrNull()

    ScreeningSectionCard(
        title = "Mức độ đau & Thời gian",
        subtitle = "Cung cấp thang điểm đau và thời gian khởi phát để hỗ trợ đánh giá mức độ.",
        icon = Icons.Outlined.Timer,
        modifier = modifier
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            // Thang điểm đau
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Thang điểm đau (0 - 10):",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = if (currentPainInt != null) "$currentPainInt / 10" else "Chưa chọn",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = when {
                            currentPainInt == null -> TextMuted
                            currentPainInt >= 7 -> Color(0xFFDC2626)
                            currentPainInt >= 4 -> Color(0xFFD97706)
                            else -> PrimaryDark
                        }
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Pain scale quick buttons (0, 2, 4, 6, 8, 10 or text input)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf(0, 2, 4, 6, 8, 10).forEach { score ->
                        val isSelected = currentPainInt == score
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(38.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(
                                    when {
                                        isSelected && score >= 7 -> Color(0xFFFEE2E2)
                                        isSelected && score >= 4 -> Color(0xFFFEF3C7)
                                        isSelected -> PrimaryLight
                                        else -> Color(0xFFF1F5F9)
                                    }
                                )
                                .border(
                                    BorderStroke(
                                        width = if (isSelected) 1.5.dp else 1.dp,
                                        color = when {
                                            isSelected && score >= 7 -> Color(0xFFDC2626)
                                            isSelected && score >= 4 -> Color(0xFFD97706)
                                            isSelected -> Primary
                                            else -> Color(0xFFE2E8F0)
                                        }
                                    ),
                                    RoundedCornerShape(8.dp)
                                )
                                .clickable { onPainChange(score.toString()) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = score.toString(),
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
                                color = when {
                                    isSelected && score >= 7 -> Color(0xFF991B1B)
                                    isSelected && score >= 4 -> Color(0xFF92400E)
                                    isSelected -> PrimaryDark
                                    else -> TextPrimary
                                }
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("0: Không đau", fontSize = 10.sp, color = TextMuted)
                    Text("5: Trung bình", fontSize = 10.sp, color = TextMuted)
                    Text("10: Rất dữ dội", fontSize = 10.sp, color = TextMuted)
                }
            }

            // Thời gian bắt đầu
            OutlinedTextField(
                value = duration,
                onValueChange = onDurationChange,
                label = { Text("Triệu chứng bắt đầu khi nào?") },
                placeholder = { Text("Ví dụ: 3 ngày trước, sau khi thức dậy...") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    focusedLabelColor = PrimaryDark,
                    cursorColor = Primary
                ),
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

// ==============================================================================
// STEP 2 - COMPONENT 2: COMPACT QUESTION CARD
// ==============================================================================
@Composable
fun CompactQuestionCard(
    questionIndex: Int,
    totalQuestions: Int,
    question: ScreeningQuestion,
    catalogRegions: List<ScreeningRegion>,
    selectedRegions: Set<String>,
    currentAnswer: String?,
    onAnswerSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    // Resolve dynamic text {regionName}
    val resolvedQuestionText = remember(question, catalogRegions, selectedRegions) {
        val regionNames = catalogRegions
            .filter { it.id in selectedRegions && it.id in question.regionIds }
            .joinToString { it.name }
        question.question.replace("{regionName}", regionNames.ifBlank { "vùng đã chọn" })
    }

    val isRedFlag = question.safety
    val isAnswered = currentAnswer != null

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isRedFlag) Color(0xFFFFFBEB) else Color.White
        ),
        border = BorderStroke(
            width = if (isRedFlag) 1.5.dp else 1.dp,
            color = if (isRedFlag) Color(0xFFFDE68A) else if (isAnswered) PrimaryBorder else BorderLight
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header: Question number + Safety Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Câu ${questionIndex + 1}/$totalQuestions",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isRedFlag) Color(0xFFB45309) else PrimaryDark
                )

                if (isRedFlag) {
                    Surface(
                        color = Color(0xFFFEF2F2),
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, Color(0xFFFECACA))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.WarningAmber,
                                contentDescription = null,
                                tint = Color(0xFFDC2626),
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Dấu hiệu cảnh báo",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFDC2626)
                            )
                        }
                    }
                }
            }

            // Question content
            Text(
                text = resolvedQuestionText,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                lineHeight = 20.sp
            )

            // Choices: 3 buttons (Có / Không / Không rõ) or custom choices
            val choices: List<Pair<String, String>> = remember(question) {
                if (question.type == "boolean") {
                    listOf("yes" to "Có", "no" to "Không", "unknown" to "Không rõ")
                } else {
                    question.options.orEmpty().map { it.value to it.label } + ("unknown" to "Không rõ")
                }
            }

            if (choices.size == 3) {
                // Horizontal 3-button compact row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    choices.forEach { (value, label) ->
                        val isSelected = currentAnswer == value
                        val isYesOnRedFlag = isRedFlag && value == "yes" && isSelected

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    when {
                                        isYesOnRedFlag -> Color(0xFFFEF2F2)
                                        isSelected -> PrimaryLight
                                        else -> Color(0xFFF8FAFC)
                                    }
                                )
                                .border(
                                    BorderStroke(
                                        width = if (isSelected) 1.5.dp else 1.dp,
                                        color = when {
                                            isYesOnRedFlag -> Color(0xFFEF4444)
                                            isSelected -> Primary
                                            else -> Color(0xFFE2E8F0)
                                        }
                                    ),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { onAnswerSelected(value) },
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center,
                                modifier = Modifier.padding(horizontal = 4.dp)
                            ) {
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = if (isYesOnRedFlag) Color(0xFFDC2626) else PrimaryDark,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                }
                                Text(
                                    text = label,
                                    fontSize = 13.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = when {
                                        isYesOnRedFlag -> Color(0xFF991B1B)
                                        isSelected -> PrimaryDark
                                        else -> TextPrimary
                                    }
                                )
                            }
                        }
                    }
                }
            } else {
                // Stacked choice buttons for multi-option questions
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    choices.forEach { (value, label) ->
                        val isSelected = currentAnswer == value
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSelected) PrimaryLight else Color(0xFFF8FAFC))
                                .border(
                                    BorderStroke(
                                        width = if (isSelected) 1.5.dp else 1.dp,
                                        color = if (isSelected) Primary else Color(0xFFE2E8F0)
                                    ),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { onAnswerSelected(value) }
                                .padding(horizontal = 14.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = PrimaryDark,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                }
                                Text(
                                    text = label,
                                    fontSize = 13.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) PrimaryDark else TextPrimary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==============================================================================
// STEP 2 - COMPONENT 3: SAFETY WARNING BANNER
// ==============================================================================
@Composable
fun SafetyAlertWarningCard(
    onUrgentAction: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
        border = BorderStroke(1.5.dp, Color(0xFFFCA5A5))
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
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Dấu hiệu cần đánh giá y tế sớm",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = Color(0xFF991B1B)
                )
            }

            Text(
                text = "Câu trả lời của bạn có dấu hiệu quan trọng cần được lưu ý. Bạn có thể xem hướng dẫn định hướng ngay mà không cần hoàn thành các bước chụp ảnh hay ghi âm.",
                fontSize = 12.sp,
                color = Color(0xFF7F1D1D),
                lineHeight = 17.sp
            )

            Button(
                onClick = onUrgentAction,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth().height(42.dp)
            ) {
                Text("Xem hướng dẫn y tế ngay", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}
