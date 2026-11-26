package com.example.kltn_novacare.ui.screens.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.kltn_novacare.data.model.Appointment
import com.example.kltn_novacare.data.model.displayFullNameWithTitle
import com.example.kltn_novacare.data.repository.AppointmentRepository
import com.example.kltn_novacare.ui.screens.appointment.MedicalRecordDetailSheet
import com.example.kltn_novacare.ui.screens.booking.ConsentManagement
import com.example.kltn_novacare.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter

private val RecordEmeraldDark = Color(0xFF064E3B)
private val RecordEmerald = Color(0xFF0C4B39)
private val RecordEmeraldLight = Color(0xFFECFDF5)
private val RecordEmeraldBorder = Color(0xFFA7F3D0)

private fun formatRecordDate(raw: String?): String {
    if (raw.isNullOrBlank()) return "Chưa rõ ngày"
    val datePart = raw.substringBefore('T')
    return runCatching {
        LocalDate.parse(datePart).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    }.getOrDefault(datePart)
}

@Composable
fun PatientRecordBook(profileId: String, name: String, onDismiss: () -> Unit) {
    var records by remember { mutableStateOf<List<Appointment>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var reload by remember { mutableIntStateOf(0) }
    var selectedTab by rememberSaveable(profileId) { mutableIntStateOf(0) } // 0: Bệnh án, 1: Quyền chia sẻ
    var selectedHospitalFilter by rememberSaveable(profileId) { mutableStateOf<String?>(null) }
    var activeRecordAppointment by remember { mutableStateOf<Appointment?>(null) }

    LaunchedEffect(profileId, reload) {
        loading = true
        error = null
        AppointmentRepository().getAppointmentHistory().fold(
            onSuccess = { list ->
                records = list
                    .filter { a -> a.patientProfileId == profileId && a.medicalEncounter != null }
                    .sortedByDescending {
                        it.medicalEncounter?.encounterDate ?: it.slot?.startTime ?: it.createdAt
                    }
            },
            onFailure = { error = it.message ?: "Không thể tải sổ sức khỏe" }
        )
        loading = false
    }

    val hospitals = remember(records) {
        records
            .mapNotNull { (it.workplace ?: it.slot?.doctorWorkplace)?.hospital?.name?.takeIf { n -> n.isNotBlank() } }
            .distinct()
    }

    val filteredRecords = remember(records, selectedHospitalFilter) {
        if (selectedHospitalFilter == null) records
        else records.filter {
            (it.workplace ?: it.slot?.doctorWorkplace)?.hospital?.name == selectedHospitalFilter
        }
    }

    val initials = remember(name) {
        name.trim().split("\\s+".toRegex()).takeLast(2).mapNotNull { it.firstOrNull()?.uppercaseChar() }.joinToString("")
            .ifBlank { "BN" }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = Background
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = innerPadding.calculateBottomPadding())
            ) {
                // 1. Signature NovaCare Gradient Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(RecordEmeraldDark, HeaderGreenMid)
                            )
                        )
                        .statusBarsPadding()
                        .padding(bottom = 18.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        // Top Navigation Bar
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            IconButton(onClick = onDismiss) {
                                Icon(
                                    Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = "Quay lại",
                                    tint = Color.White
                                )
                            }

                            Text(
                                "Sổ sức khỏe điện tử",
                                color = Color.White,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.ExtraBold
                            )

                            IconButton(
                                enabled = !loading,
                                onClick = { reload++ }
                            ) {
                                Icon(
                                    Icons.Default.Refresh,
                                    contentDescription = "Làm mới",
                                    tint = Color.White
                                )
                            }
                        }

                        // Patient Profile Banner Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(52.dp)
                                    .background(Color.White.copy(alpha = 0.18f), CircleShape)
                                    .border(1.5.dp, Color.White.copy(alpha = 0.45f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    initials,
                                    color = Color.White,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 17.sp
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = name,
                                    color = Color.White,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 18.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(Modifier.height(4.dp))
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    HeaderStatPill(Icons.Outlined.Description, "${records.size} bệnh án")
                                    HeaderStatPill(Icons.Outlined.LocalHospital, "${hospitals.size} cơ sở")
                                }
                            }
                        }
                    }
                }

                // 2. Segmented Tab Bar
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .offset(y = (-12).dp),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White,
                    border = BorderStroke(1.dp, Border),
                    shadowElevation = 3.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(5.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        RecordBookTabButton(
                            selected = selectedTab == 0,
                            icon = Icons.Outlined.MedicalInformation,
                            label = "Hồ sơ khám (${records.size})",
                            modifier = Modifier.weight(1f),
                            onClick = { selectedTab = 0 }
                        )
                        RecordBookTabButton(
                            selected = selectedTab == 1,
                            icon = Icons.Outlined.VerifiedUser,
                            label = "Quyền chia sẻ",
                            modifier = Modifier.weight(1f),
                            onClick = { selectedTab = 1 }
                        )
                    }
                }

                if (loading) {
                    LinearProgressIndicator(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .height(3.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = Primary,
                        trackColor = PrimaryLight
                    )
                }

                // 3. Body Content
                if (selectedTab == 0) {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 24.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        error?.let { errMsg ->
                            item {
                                Surface(
                                    color = StatusErrorBg,
                                    shape = RoundedCornerShape(14.dp),
                                    border = BorderStroke(1.dp, Color(0xFFFECACA)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = StatusErrorText, modifier = Modifier.size(18.dp))
                                        Text(errMsg, color = StatusErrorText, fontSize = 12.5.sp, fontWeight = FontWeight.Medium)
                                    }
                                }
                            }
                        }

                        // Hospital Filter Chips when multiple facilities visited
                        if (hospitals.size > 1) {
                            item {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    FilterChip(
                                        selected = selectedHospitalFilter == null,
                                        onClick = { selectedHospitalFilter = null },
                                        label = { Text("Tất cả (${records.size})", fontSize = 11.5.sp, fontWeight = FontWeight.Bold) },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = RecordEmerald,
                                            selectedLabelColor = Color.White,
                                            containerColor = Color.White
                                        )
                                    )
                                    hospitals.forEach { hospName ->
                                        FilterChip(
                                            selected = selectedHospitalFilter == hospName,
                                            onClick = {
                                                selectedHospitalFilter = if (selectedHospitalFilter == hospName) null else hospName
                                            },
                                            label = {
                                                Text(
                                                    hospName,
                                                    fontSize = 11.5.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    maxLines = 1
                                                )
                                            },
                                            colors = FilterChipDefaults.filterChipColors(
                                                selectedContainerColor = RecordEmerald,
                                                selectedLabelColor = Color.White,
                                                containerColor = Color.White
                                            )
                                        )
                                    }
                                }
                            }
                        }

                        if (!loading && filteredRecords.isEmpty()) {
                            item {
                                EmptyRecordBookCard(
                                    icon = Icons.Outlined.FolderShared,
                                    title = "Chưa có hồ sơ bệnh án",
                                    subtitle = "Kết quả khám bệnh, chẩn đoán và đơn thuốc sau mỗi lượt khám tại hệ thống NovaCare sẽ tự động lưu tại đây."
                                )
                            }
                        } else {
                            items(filteredRecords, key = { it.id }) { appointment ->
                                MedicalRecordTimelineCard(
                                    appointment = appointment,
                                    onOpenDetail = { activeRecordAppointment = appointment }
                                )
                            }
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 24.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = RecordEmeraldLight,
                                border = BorderStroke(1.dp, RecordEmeraldBorder),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(38.dp)
                                            .background(Color.White, RoundedCornerShape(12.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Outlined.Security,
                                            contentDescription = null,
                                            tint = RecordEmerald,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            "Kiểm soát quyền liên thông bệnh án",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 13.5.sp,
                                            color = RecordEmeraldDark
                                        )
                                        Text(
                                            "Bạn toàn quyền theo dõi và thu hồi quyền truy cập hồ sơ của các cơ sở y tế bất kỳ lúc nào.",
                                            fontSize = 11.5.sp,
                                            color = TextSecondary,
                                            lineHeight = 16.sp
                                        )
                                    }
                                }
                            }
                        }

                        item {
                            key(reload) {
                                ConsentManagement(profileId = profileId)
                            }
                        }
                    }
                }
            }
        }
    }

    // Medical Record Full Detail Sheet
    activeRecordAppointment?.let { appt ->
        appt.medicalEncounter?.let { encounter ->
            MedicalRecordDetailSheet(
                encounter = encounter,
                appointment = appt,
                onDismiss = { activeRecordAppointment = null }
            )
        }
    }
}

@Composable
private fun HeaderStatPill(icon: ImageVector, text: String) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = Color.White.copy(alpha = 0.16f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            Icon(icon, contentDescription = null, tint = Color(0xFFA7F3D0), modifier = Modifier.size(13.dp))
            Text(text, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun RecordBookTabButton(
    selected: Boolean,
    icon: ImageVector,
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = if (selected) RecordEmerald else Color.Transparent
    ) {
        Row(
            modifier = Modifier.padding(vertical = 10.dp, horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (selected) Color.White else TextSecondary,
                modifier = Modifier.size(16.dp)
            )
            Spacer(Modifier.width(6.dp))
            Text(
                text = label,
                fontSize = 12.5.sp,
                fontWeight = FontWeight.Bold,
                color = if (selected) Color.White else TextSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun MedicalRecordTimelineCard(
    appointment: Appointment,
    onOpenDetail: () -> Unit
) {
    val encounter = appointment.medicalEncounter
    val workplace = appointment.workplace ?: appointment.slot?.doctorWorkplace
    val hospitalName = workplace?.hospital?.name?.takeIf { it.isNotBlank() } ?: "Cơ sở y tế NovaCare"
    val specialtyName = encounter?.specialtyName?.takeIf { it.isNotBlank() }
        ?: workplace?.specialty?.name?.takeIf { it.isNotBlank() }
        ?: "Khám chuyên khoa"
    val doctorName = encounter?.doctorName?.takeIf { it.isNotBlank() }
        ?: workplace?.doctor?.displayFullNameWithTitle
    val dateLabel = formatRecordDate(encounter?.encounterDate ?: appointment.slot?.startTime ?: appointment.createdAt)
    val recordCode = encounter?.encounterCode?.takeIf { it.isNotBlank() } ?: appointment.bookingCode
    val summaryPreview = encounter?.clinicalSummary?.takeIf { it.isNotBlank() }
        ?: encounter?.chiefComplaint?.takeIf { it.isNotBlank() }
        ?: encounter?.treatmentPlan?.takeIf { it.isNotBlank() }

    val hasDiagnoses = !encounter?.diagnoses.isNullOrEmpty()
    val hasObservations = !encounter?.observations.isNullOrEmpty()
    val hasPrescription = encounter?.prescription != null

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpenDetail() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(15.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Top Meta Row: Date badge + Encounter Code
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = RecordEmeraldLight,
                    border = BorderStroke(1.dp, RecordEmeraldBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            Icons.Outlined.CalendarToday,
                            contentDescription = null,
                            tint = RecordEmerald,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            dateLabel,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = RecordEmeraldDark
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFF1F5F9)
                ) {
                    Text(
                        recordCode,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = TextSecondary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            // Hospital & Specialty/Doctor Row
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(RecordEmeraldLight, RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.LocalHospital,
                        contentDescription = null,
                        tint = RecordEmerald,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = hospitalName,
                        fontSize = 14.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextPrimary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(3.dp))
                    Text(
                        text = buildString {
                            append(specialtyName)
                            if (!doctorName.isNullOrBlank()) {
                                append(" · ")
                                append(doctorName)
                            }
                        },
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = RecordEmerald,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Optional Clinical Summary Snippet
            if (!summaryPreview.isNullOrBlank()) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Background,
                    border = BorderStroke(1.dp, BorderLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = summaryPreview,
                        fontSize = 12.sp,
                        color = TextSecondary,
                        lineHeight = 17.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }

            // Available Clinical Section Mini Badges
            if (hasDiagnoses || hasObservations || hasPrescription) {
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (hasDiagnoses) ClinicalTagChip("Chẩn đoán", Color(0xFFEFF6FF), Color(0xFF1D4ED8))
                    if (hasObservations) ClinicalTagChip("Cận lâm sàng", Color(0xFFF3E8FF), Color(0xFF7E22CE))
                    if (hasPrescription) ClinicalTagChip("Đơn thuốc", RecordEmeraldLight, RecordEmerald)
                }
            }

            HorizontalDivider(color = BorderLight)

            // Action Footer
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = Primary,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        "Đã trả kết quả khám",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextSecondary
                    )
                }

                Surface(
                    onClick = onOpenDetail,
                    shape = RoundedCornerShape(10.dp),
                    color = RecordEmerald
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Outlined.Description,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            "Xem hồ sơ",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Icon(
                            Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(15.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ClinicalTagChip(label: String, bg: Color, tint: Color) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = bg
    ) {
        Text(
            text = label,
            color = tint,
            fontSize = 10.5.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@Composable
private fun EmptyRecordBookCard(
    icon: ImageVector,
    title: String,
    subtitle: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Border)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 32.dp, horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(RecordEmeraldLight, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = RecordEmerald, modifier = Modifier.size(30.dp))
            }
            Spacer(Modifier.height(14.dp))
            Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = TextPrimary)
            Spacer(Modifier.height(6.dp))
            Text(
                subtitle,
                fontSize = 12.5.sp,
                color = TextSecondary,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp
            )
        }
    }
}
