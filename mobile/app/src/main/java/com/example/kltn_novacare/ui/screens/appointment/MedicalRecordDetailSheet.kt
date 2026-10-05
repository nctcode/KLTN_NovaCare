package com.example.kltn_novacare.ui.screens.appointment

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.Appointment
import com.example.kltn_novacare.data.model.AppointmentEncounter
import com.example.kltn_novacare.ui.theme.*
import com.google.gson.JsonObject
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

// ==============================================================================
// 1. MAIN FULL-HEIGHT BOTTOM SHEET: MEDICAL RECORD DETAIL
// ==============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicalRecordDetailSheet(
    encounter: AppointmentEncounter,
    appointment: Appointment,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        containerColor = Color.White,
        dragHandle = { BottomSheetDefaults.DragHandle() },
        modifier = Modifier.fillMaxHeight(0.95f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
        ) {
            // Header: Title + Encounter ID + Close Button
            MedicalRecordHeader(
                encounterCode = encounter.encounterCode,
                onClose = onDismiss
            )

            HorizontalDivider(color = BorderLight, thickness = 0.8.dp)

            // Scrollable Content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 18.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. Encounter Summary Card
                EncounterSummaryCard(
                    encounter = encounter,
                    appointment = appointment
                )

                // 2. Lý do khám (Chief Complaint)
                val chiefComplaint = encounter.chiefComplaint?.trim().orEmpty()
                if (chiefComplaint.isNotBlank()) {
                    MedicalRecordSection(
                        title = "Lý do khám",
                        icon = Icons.Outlined.ChatBubbleOutline
                    ) {
                        Surface(
                            color = Color(0xFFF8FAFC),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = chiefComplaint,
                                fontSize = 14.sp,
                                color = TextPrimary,
                                lineHeight = 20.sp,
                                modifier = Modifier.padding(14.dp)
                            )
                        }
                    }
                }

                // 3. Tóm tắt lâm sàng (Clinical Summary with collapsible support)
                val clinicalSummary = encounter.clinicalSummary?.trim().orEmpty()
                if (clinicalSummary.isNotBlank()) {
                    MedicalRecordSection(
                        title = "Tóm tắt lâm sàng",
                        icon = Icons.Outlined.Description
                    ) {
                        ClinicalSummaryBox(text = clinicalSummary)
                    }
                }

                // 4. Chẩn đoán (Diagnoses)
                val diagnoses = encounter.diagnoses.orEmpty()
                if (diagnoses.isNotEmpty()) {
                    MedicalRecordSection(
                        title = "Chẩn đoán",
                        icon = Icons.Outlined.FactCheck
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            diagnoses.forEachIndexed { index, diag ->
                                DiagnosisItemCard(
                                    diag = diag,
                                    isPrimary = index == 0 || diag.get("isPrimary")?.asBoolean == true
                                )
                            }
                        }
                    }
                }

                // 5. Chỉ số sinh hiệu & Cận lâm sàng
                val observations = encounter.observations.orEmpty()
                val vitals = remember(observations) { observations.filter { isVitalSign(it) } }
                val labs = remember(observations) { observations.filter { !isVitalSign(it) } }

                // 5a. Chỉ số sinh hiệu
                if (vitals.isNotEmpty()) {
                    MedicalRecordSection(
                        title = "Chỉ số sinh hiệu",
                        icon = Icons.Outlined.FavoriteBorder
                    ) {
                        VitalMetricsGrid(vitals = vitals)
                    }
                }

                // 5b. Cận lâm sàng & Xét nghiệm
                if (labs.isNotEmpty()) {
                    MedicalRecordSection(
                        title = "Cận lâm sàng & Xét nghiệm",
                        icon = Icons.Outlined.Biotech
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            labs.forEach { lab ->
                                ClinicalResultItemCard(observation = lab)
                            }
                        }
                    }
                }

                // 6. Đơn thuốc (Prescription)
                val prescriptionItems = encounter.prescription?.getAsJsonArray("items")
                val prescriptionNote = encounter.prescription?.text("note")?.trim().orEmpty()

                if ((prescriptionItems != null && prescriptionItems.size() > 0) || prescriptionNote.isNotBlank()) {
                    MedicalRecordSection(
                        title = "Đơn thuốc",
                        icon = Icons.Outlined.Medication
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            prescriptionItems?.forEach { itemElement ->
                                MedicationItemCard(item = itemElement.asJsonObject)
                            }

                            if (prescriptionNote.isNotBlank()) {
                                Surface(
                                    color = Color(0xFFFFFBEB),
                                    shape = RoundedCornerShape(10.dp),
                                    border = BorderStroke(1.dp, Color(0xFFFDE68A)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.Top
                                    ) {
                                        Icon(
                                            imageVector = Icons.Outlined.Info,
                                            contentDescription = null,
                                            tint = Color(0xFFD97706),
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Ghi chú đơn thuốc: $prescriptionNote",
                                            fontSize = 12.sp,
                                            color = Color(0xFF92400E),
                                            lineHeight = 17.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // 7. Lời dặn của bác sĩ / Kế hoạch điều trị (Treatment Plan)
                val treatmentPlan = encounter.treatmentPlan?.trim().orEmpty()
                if (treatmentPlan.isNotBlank()) {
                    MedicalRecordSection(
                        title = "Lời dặn & Kế hoạch điều trị",
                        icon = Icons.Outlined.Assignment
                    ) {
                        Surface(
                            color = PrimaryLight.copy(alpha = 0.45f),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, PrimaryBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = treatmentPlan,
                                fontSize = 13.sp,
                                color = TextPrimary,
                                lineHeight = 19.sp,
                                modifier = Modifier.padding(14.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
            }

            // Sticky Bottom Action Bar
            Surface(
                color = Color.White,
                shadowElevation = 10.dp,
                border = BorderStroke(1.dp, BorderLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 12.dp)
                ) {
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Primary)
                    ) {
                        Text(
                            text = "Đóng",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

// ==============================================================================
// 2. HEADER COMPONENT
// ==============================================================================
@Composable
private fun MedicalRecordHeader(
    encounterCode: String?,
    onClose: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Chi tiết bệnh án",
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )
            if (!encounterCode.isNullOrBlank()) {
                Text(
                    text = "Mã hồ sơ: $encounterCode",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = TextSecondary
                )
            }
        }

        IconButton(onClick = onClose) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Đóng",
                tint = TextSecondary,
                modifier = Modifier.size(22.dp)
            )
        }
    }
}

// ==============================================================================
// 3. ENCOUNTER SUMMARY CARD (Who, where, when, specialty)
// ==============================================================================
@Composable
private fun EncounterSummaryCard(
    encounter: AppointmentEncounter,
    appointment: Appointment
) {
    val workplace = appointment.workplace ?: appointment.slot?.doctorWorkplace
    val hospitalName = workplace?.hospital?.name?.trim().orEmpty()
    val doctorName = (encounter.doctorName ?: workplace?.doctor?.fullName).orEmpty().trim()
    val specialtyName = encounter.specialtyName?.trim().orEmpty()
    val patientName = appointment.patientProfile?.fullName?.trim().orEmpty()
    val formattedDate = formatEncounterDate(encounter.encounterDate)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Specialty Badge & Date
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (specialtyName.isNotBlank()) {
                    Surface(
                        color = PrimaryLight,
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, PrimaryBorder)
                    ) {
                        Text(
                            text = specialtyName,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryDark,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }

                if (formattedDate.isNotBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Outlined.CalendarToday,
                            contentDescription = null,
                            tint = TextMuted,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = formattedDate,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = TextSecondary
                        )
                    }
                }
            }

            HorizontalDivider(color = Color(0xFFE2E8F0), thickness = 0.8.dp)

            // Doctor
            if (doctorName.isNotBlank()) {
                SummaryInfoRow(
                    icon = Icons.Outlined.Person,
                    label = "Bác sĩ phụ trách:",
                    value = doctorName,
                    isHighlight = true
                )
            }

            // Hospital
            if (hospitalName.isNotBlank()) {
                SummaryInfoRow(
                    icon = Icons.Outlined.LocalHospital,
                    label = "Cơ sở khám:",
                    value = hospitalName
                )
            }

            // Patient
            if (patientName.isNotBlank()) {
                SummaryInfoRow(
                    icon = Icons.Outlined.AccountCircle,
                    label = "Người khám:",
                    value = patientName
                )
            }
        }
    }
}

@Composable
private fun SummaryInfoRow(
    icon: ImageVector,
    label: String,
    value: String,
    isHighlight: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (isHighlight) PrimaryDark else TextMuted,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = label,
            fontSize = 12.sp,
            color = TextSecondary,
            modifier = Modifier.width(105.dp)
        )
        Text(
            text = value,
            fontSize = 13.sp,
            fontWeight = if (isHighlight) FontWeight.Bold else FontWeight.SemiBold,
            color = if (isHighlight) PrimaryDark else TextPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f)
        )
    }
}

// ==============================================================================
// 4. SECTION WRAPPER
// ==============================================================================
@Composable
private fun MedicalRecordSection(
    title: String,
    icon: ImageVector,
    content: @Composable () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(start = 2.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(PrimaryLight, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = PrimaryDark,
                    modifier = Modifier.size(14.dp)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        }

        content()
    }
}

// ==============================================================================
// 5. CLINICAL SUMMARY BOX (Collapsible)
// ==============================================================================
@Composable
private fun ClinicalSummaryBox(text: String) {
    var expanded by remember { mutableStateOf(false) }
    val isLong = text.length > 120

    Surface(
        color = Color(0xFFF8FAFC),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier
            .fillMaxWidth()
            .animateContentSize()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = text,
                fontSize = 13.sp,
                color = TextPrimary,
                lineHeight = 19.sp,
                maxLines = if (expanded || !isLong) Int.MAX_VALUE else 4,
                overflow = TextOverflow.Ellipsis
            )

            if (isLong) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = if (expanded) "Thu gọn" else "Xem thêm",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryDark,
                    modifier = Modifier
                        .clickable { expanded = !expanded }
                        .padding(vertical = 2.dp)
                )
            }
        }
    }
}

// ==============================================================================
// 6. DIAGNOSIS CARD
// ==============================================================================
@Composable
private fun DiagnosisItemCard(diag: JsonObject, isPrimary: Boolean) {
    val icdCode = diag.text("icdCode").trim()
    val diseaseName = diag.text("diseaseName").trim()

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isPrimary) PrimaryLight.copy(alpha = 0.35f) else Color(0xFFF8FAFC)
        ),
        border = BorderStroke(
            1.dp,
            if (isPrimary) PrimaryBorder else Color(0xFFE2E8F0)
        )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // ICD Badge
            Surface(
                color = if (isPrimary) Primary else Color(0xFFE2E8F0),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = if (icdCode.isNotBlank()) "ICD-10 · $icdCode" else "ICD-10",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (isPrimary) Color.White else TextSecondary,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = diseaseName.ifBlank { "Chẩn đoán bệnh" },
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    lineHeight = 18.sp
                )
                if (isPrimary) {
                    Text(
                        text = "Chẩn đoán chính",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = PrimaryDark
                    )
                }
            }
        }
    }
}

// ==============================================================================
// 7. VITAL METRICS GRID
// ==============================================================================
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun VitalMetricsGrid(vitals: List<JsonObject>) {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        vitals.forEach { vital ->
            val name = vital.text("name").trim()
            val value = vital.text("value").trim()
            val unit = vital.text("unit").trim()
            val interpretation = vital.text("interpretation").trim()

            Surface(
                color = Color(0xFFF8FAFC),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                modifier = Modifier.widthIn(min = 100.dp, max = 175.dp)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(
                        text = name,
                        fontSize = 11.sp,
                        color = TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = value,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = PrimaryDark
                        )
                        if (unit.isNotBlank()) {
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = unit,
                                fontSize = 11.sp,
                                color = TextMuted,
                                modifier = Modifier.padding(bottom = 1.dp)
                            )
                        }
                    }
                    if (interpretation.isNotBlank()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Surface(
                            color = if (interpretation.contains("thường", ignoreCase = true) || interpretation.contains("tốt", ignoreCase = true))
                                PrimaryLight else Color(0xFFFEF3C7),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = interpretation,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (interpretation.contains("thường", ignoreCase = true) || interpretation.contains("tốt", ignoreCase = true))
                                    PrimaryDark else Color(0xFF92400E),
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ==============================================================================
// 8. CLINICAL RESULT ITEM (Labs / Diagnostics)
// ==============================================================================
@Composable
private fun ClinicalResultItemCard(observation: JsonObject) {
    val name = observation.text("name").trim()
    val value = observation.text("value").trim()
    val unit = observation.text("unit").trim()
    val interpretation = observation.text("interpretation").trim()

    val isNegativeOrNormal = interpretation.contains("âm tính", ignoreCase = true) ||
            interpretation.contains("bình thường", ignoreCase = true) ||
            interpretation.contains("không nhiễm", ignoreCase = true)

    val isAbnormalOrHigh = interpretation.contains("tăng", ignoreCase = true) ||
            interpretation.contains("dương tính", ignoreCase = true) ||
            interpretation.contains("dị ứng", ignoreCase = true)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = name,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )

                if (interpretation.isNotBlank()) {
                    val statusBg = when {
                        isNegativeOrNormal -> PrimaryLight
                        isAbnormalOrHigh -> Color(0xFFFEF3C7)
                        else -> Color(0xFFF1F5F9)
                    }
                    val statusColor = when {
                        isNegativeOrNormal -> PrimaryDark
                        isAbnormalOrHigh -> Color(0xFF92400E)
                        else -> TextSecondary
                    }

                    Surface(
                        color = statusBg,
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Text(
                            text = interpretation,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            if (value.isNotBlank()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Kết quả: ",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Text(
                        text = if (unit.isNotBlank()) "$value $unit" else value,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }
            }
        }
    }
}

// ==============================================================================
// 9. MEDICATION ITEM CARD
// ==============================================================================
@Composable
private fun MedicationItemCard(item: JsonObject) {
    val drugName = item.text("drugName").trim()
    val dosage = item.text("dosage").trim()
    val usageInstruction = item.text("usageInstruction").trim()
    val quantity = item.text("quantity").trim()
    val unit = item.text("unit").trim()
    val duration = item.text("duration").trim()

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, BorderLight)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Drug title & dosage
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = drugName,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    if (dosage.isNotBlank()) {
                        Text(
                            text = dosage,
                            fontSize = 12.sp,
                            color = TextSecondary
                        )
                    }
                }

                if (quantity.isNotBlank() || unit.isNotBlank()) {
                    Surface(
                        color = Color(0xFFF1F5F9),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.padding(start = 8.dp)
                    ) {
                        Text(
                            text = "$quantity $unit".trim(),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
            }

            // Usage Instruction
            if (usageInstruction.isNotBlank()) {
                Surface(
                    color = PrimaryLight.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Schedule,
                            contentDescription = null,
                            tint = PrimaryDark,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = usageInstruction,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = PrimaryDark,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            // Duration
            if (duration.isNotBlank()) {
                Text(
                    text = "Thời gian dùng: $duration",
                    fontSize = 11.sp,
                    color = TextMuted
                )
            }
        }
    }
}

// ==============================================================================
// 10. HELPER FUNCTIONS
// ==============================================================================
private fun isVitalSign(obs: JsonObject): Boolean {
    val category = obs.text("category").uppercase()
    if (category == "VITAL_SIGNS" || category == "VITALS") return true
    val name = obs.text("name").lowercase()
    return name.contains("thân nhiệt") || name.contains("nhiệt độ") ||
            name.contains("mạch") || name.contains("nhịp tim") ||
            name.contains("huyết áp") || name.contains("nhịp thở") ||
            name.contains("spo2") || name.contains("cân nặng") ||
            name.contains("chiều cao") || name.contains("bmi")
}

private fun formatEncounterDate(raw: String?): String {
    if (raw.isNullOrBlank()) return ""
    return runCatching {
        val instant = Instant.parse(raw)
        val zone = ZoneId.of("Asia/Ho_Chi_Minh")
        val formatter = DateTimeFormatter.ofPattern("HH:mm · dd/MM/yyyy", Locale("vi", "VN")).withZone(zone)
        formatter.format(instant)
    }.getOrElse {
        raw.substringBefore('T')
    }
}
