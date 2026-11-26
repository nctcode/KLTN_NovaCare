package com.novacare.doctor.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.novacare.doctor.data.AppointmentScreening
import com.novacare.doctor.data.DoctorApiClient
import com.novacare.doctor.data.DoctorAppointment
import com.novacare.doctor.data.ScreeningMediaItem
import com.novacare.doctor.data.SharedRecord
import java.time.LocalDate
import java.time.Period

private val DetailEmeraldDark = Color(0xFF064E3B)
private val DetailEmeraldMid = Color(0xFF087F5B)
private val DetailEmeraldSoft = Color(0xFFECFDF5)
private val DetailEmeraldBorder = Color(0xFFA7F3D0)
private val DetailTextMuted = Color(0xFF64748B)
private val DetailBorder = Color(0xFFE2E8F0)
private val DetailSurfaceAlt = Color(0xFFF8FAFC)

@Composable
internal fun AppointmentDetailScreen(nav: NavHostController, viewModel: DoctorViewModel, id: String) {
    val state by viewModel.appointment.collectAsState()
    val screening by viewModel.screening.collectAsState()
    val sharedRecords by viewModel.sharedRecords.collectAsState()
    var selectedSharedRecord by remember { mutableStateOf<SharedRecord?>(null) }

    LaunchedEffect(id) { viewModel.loadAppointment(id) }

    val bookingCode = (state as? LoadState.Data<DoctorAppointment>)?.value?.bookingCode

    DoctorScaffold(
        nav = nav,
        route = "",
        title = "Chi tiết lịch hẹn",
        canBack = true,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.horizontalGradient(
                            listOf(DetailEmeraldDark, DetailEmeraldMid)
                        )
                    )
                    .statusBarsPadding()
                    .padding(horizontal = 8.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { nav.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại", tint = Color.White)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Chi tiết lịch hẹn",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp
                    )
                    if (!bookingCode.isNullOrBlank()) {
                        Text(
                            bookingCode,
                            color = Color(0xFFD1FAE5),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    ) { padding ->
        StateContent(state, Modifier.padding(padding), { viewModel.loadAppointment(id) }) { appointment ->
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // 1. Hero Appointment Status & Time Card
                item(key = "hero") {
                    AppointmentHeroCard(
                        appointment = appointment,
                        onOpenConsultation = appointment.consultation?.id?.let { cid ->
                            { nav.navigate("consultation/$cid") }
                        }
                    )
                }

                // 2. Compact Patient Profile Card
                item(key = "patient") {
                    CompactPatientCard(appointment)
                }

                // 3. Compact Appointment Details Card
                item(key = "details") {
                    CompactAppointmentInfoCard(appointment)
                }

                // 4. Compact AI Pre-Screening Card
                item(key = "screening") {
                    CompactScreeningCard(appointment = appointment, screeningState = screening)
                }

                // 5. Shared Records Section Header
                item(key = "shared-header") {
                    val recordCount = (sharedRecords as? LoadState.Data<List<SharedRecord>>)?.value?.size
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(30.dp)
                                    .background(DetailEmeraldSoft, RoundedCornerShape(9.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Outlined.FolderShared, contentDescription = null, tint = DetailEmeraldMid, modifier = Modifier.size(17.dp))
                            }
                            Text(
                                "Hồ sơ khám trước được chia sẻ",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 15.sp,
                                color = TextDark
                            )
                        }
                        if (recordCount != null) {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = if (recordCount > 0) DetailEmeraldSoft else Color(0xFFF1F5F9),
                                border = BorderStroke(1.dp, if (recordCount > 0) DetailEmeraldBorder else DetailBorder)
                            ) {
                                Text(
                                    "$recordCount bệnh án",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (recordCount > 0) DetailEmeraldDark else DetailTextMuted,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }
                }

                // 6. Shared Records State / Summary Cards
                when (val records = sharedRecords) {
                    is LoadState.Data -> {
                        if (records.value.isEmpty()) {
                            item(key = "shared-empty") {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    border = BorderStroke(1.dp, DetailBorder)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Icon(Icons.Outlined.LockClock, contentDescription = null, tint = DetailTextMuted, modifier = Modifier.size(20.dp))
                                        Text(
                                            "Chưa có hồ sơ được chia sẻ hoặc quyền chia sẻ đã hết hiệu lực.",
                                            fontSize = 12.5.sp,
                                            color = DetailTextMuted
                                        )
                                    }
                                }
                            }
                        } else {
                            items(records.value, key = { "record-${it.id}" }) { record ->
                                SharedRecordSummaryCard(
                                    record = record,
                                    onViewDetail = { selectedSharedRecord = record }
                                )
                            }
                        }
                    }
                    is LoadState.Error -> {
                        item(key = "shared-error") {
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = Color(0xFFFEF2F2),
                                border = BorderStroke(1.dp, Color(0xFFFECACA)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    records.message,
                                    color = Color(0xFFDC2626),
                                    fontSize = 12.5.sp,
                                    modifier = Modifier.padding(14.dp)
                                )
                            }
                        }
                    }
                    else -> {
                        item(key = "shared-loading") {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(Modifier.size(24.dp), color = DetailEmeraldMid, strokeWidth = 2.5.dp)
                            }
                        }
                    }
                }

                item { Spacer(Modifier.height(12.dp)) }
            }
        }
    }

    // Full Shared Medical Record Detail Popup
    selectedSharedRecord?.let { record ->
        SharedRecordDetailDialog(
            record = record,
            onDismiss = { selectedSharedRecord = null }
        )
    }
}

@Composable
private fun AppointmentHeroCard(
    appointment: DoctorAppointment,
    onOpenConsultation: (() -> Unit)?
) {
    val (statusBg, statusBorder, statusText) = statusColors(appointment.status)
    val (typeBg, typeText) = appointmentTypeColors(appointment)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, DetailEmeraldBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(color = typeBg, shape = RoundedCornerShape(8.dp)) {
                    Row(
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            if (appointment.serviceBookingMode == "ONLINE" || appointment.consultation != null)
                                Icons.Outlined.Videocam else Icons.Outlined.MedicalServices,
                            contentDescription = null,
                            tint = typeText,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            appointment.appointmentTypeLabel,
                            color = typeText,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }

                Surface(
                    color = statusBg,
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, statusBorder)
                ) {
                    Text(
                        statusLabel(appointment.status),
                        color = statusText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(DetailEmeraldSoft, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.EventAvailable, contentDescription = null, tint = DetailEmeraldMid, modifier = Modifier.size(21.dp))
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        formatDateTime(appointment.slot.startTime),
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        color = TextDark
                    )
                    Text(
                        "${appointment.slot.doctorWorkplace.specialty.name} · ${appointment.slot.doctorWorkplace.hospital.name}",
                        fontSize = 12.sp,
                        color = DetailTextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            if (onOpenConsultation != null) {
                Button(
                    onClick = onOpenConsultation,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(42.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = DetailEmeraldDark)
                ) {
                    Icon(Icons.Outlined.Forum, contentDescription = null, modifier = Modifier.size(17.dp))
                    Spacer(Modifier.width(7.dp))
                    Text("Mở phòng tư vấn trực tuyến", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun CompactPatientCard(appointment: DoctorAppointment) {
    val patient = appointment.patientProfile
    val initials = remember(patient.fullName) {
        patient.fullName.trim().split(Regex("\\s+"))
            .takeLast(2)
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .joinToString("")
            .ifBlank { "BN" }
    }
    val ageText = remember(patient.dateOfBirth) {
        patient.dateOfBirth?.takeIf(String::isNotBlank)?.let { raw ->
            runCatching {
                val dob = LocalDate.parse(raw.substringBefore('T'))
                val years = Period.between(dob, LocalDate.now(vietnamZone)).years
                if (years >= 0) "$years tuổi" else null
            }.getOrNull()
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, DetailBorder)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .background(
                            Brush.linearGradient(listOf(DetailEmeraldDark, DetailEmeraldMid)),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(initials, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text("BỆNH NHÂN", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = DetailEmeraldMid, letterSpacing = 0.6.sp)
                    Text(
                        patient.fullName,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 16.sp,
                        color = TextDark
                    )
                    val metaParts = buildList {
                        add(genderLabel(patient.gender))
                        val dob = formatBirthDate(patient.dateOfBirth)
                        if (dob != "Chưa cung cấp") add(if (ageText != null) "$dob ($ageText)" else dob)
                    }
                    Text(
                        metaParts.joinToString(" · "),
                        fontSize = 12.sp,
                        color = DetailTextMuted
                    )
                }
            }

            HorizontalDivider(color = Color(0xFFF1F5F9))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Outlined.Phone, contentDescription = null, tint = DetailEmeraldMid, modifier = Modifier.size(16.dp))
                Text(
                    patient.phone?.takeIf(String::isNotBlank) ?: "Chưa cung cấp số điện thoại",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextDark
                )
            }

            patient.address?.takeIf(String::isNotBlank)?.let { address ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Outlined.LocationOn,
                        contentDescription = null,
                        tint = DetailTextMuted,
                        modifier = Modifier.size(16.dp).padding(top = 1.dp)
                    )
                    Text(
                        address,
                        fontSize = 12.5.sp,
                        color = Color(0xFF475569),
                        lineHeight = 17.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun CompactAppointmentInfoCard(appointment: DoctorAppointment) {
    val reason = appointment.reason?.takeIf(String::isNotBlank)
    val symptoms = appointment.symptoms?.takeIf(String::isNotBlank)?.takeIf { it != reason }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, DetailBorder)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                Icon(Icons.Outlined.EventNote, contentDescription = null, tint = DetailEmeraldMid, modifier = Modifier.size(18.dp))
                Text("Thông tin khám bệnh", fontWeight = FontWeight.ExtraBold, fontSize = 14.5.sp, color = TextDark)
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CompactInfoCell("Mã lịch hẹn", appointment.bookingCode, Modifier.weight(1f))
                CompactInfoCell("Phòng khám", appointment.slot.roomSession?.room?.name ?: "Chưa phân phòng", Modifier.weight(1f))
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CompactInfoCell(
                    "Cơ sở y tế",
                    appointment.slot.doctorWorkplace.branch?.name ?: appointment.slot.doctorWorkplace.hospital.name,
                    Modifier.weight(1f)
                )
                CompactInfoCell("Chuyên khoa", appointment.slot.doctorWorkplace.specialty.name, Modifier.weight(1f))
            }

            if (reason != null || symptoms != null) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = DetailSurfaceAlt,
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        reason?.let {
                            Column {
                                Text("Lý do khám", fontSize = 10.5.sp, fontWeight = FontWeight.Bold, color = DetailTextMuted)
                                Text(it, fontSize = 12.5.sp, color = TextDark, lineHeight = 18.sp)
                            }
                        }
                        symptoms?.let {
                            Column {
                                Text("Triệu chứng ghi nhận", fontSize = 10.5.sp, fontWeight = FontWeight.Bold, color = DetailTextMuted)
                                Text(it, fontSize = 12.5.sp, color = TextDark, lineHeight = 18.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CompactInfoCell(label: String, value: String, modifier: Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(11.dp),
        color = DetailSurfaceAlt
    ) {
        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(label, fontSize = 10.5.sp, fontWeight = FontWeight.SemiBold, color = DetailTextMuted)
            Text(value, fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = TextDark, maxLines = 2, overflow = TextOverflow.Ellipsis)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CompactScreeningCard(
    appointment: DoctorAppointment,
    screeningState: LoadState<AppointmentScreening>
) {
    var expandQuestions by remember { mutableStateOf(false) }
    var previewImageUrl by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, DetailEmeraldBorder)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .background(DetailEmeraldSoft, RoundedCornerShape(9.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Psychology, contentDescription = null, tint = DetailEmeraldMid, modifier = Modifier.size(19.dp))
                    }
                    Column {
                        Text("Sàng lọc tiền khám AI", fontWeight = FontWeight.ExtraBold, fontSize = 14.5.sp, color = TextDark)
                        (screeningState as? LoadState.Data<AppointmentScreening>)?.value?.completedAt?.takeIf(String::isNotBlank)?.let { completed ->
                            Text("Hoàn tất: ${formatDateTime(completed)}", fontSize = 10.5.sp, color = DetailTextMuted)
                        }
                    }
                }
                if (screeningState is LoadState.Data) {
                    val (riskBg, riskText) = riskColors(screeningState.value.riskLevel)
                    Surface(color = riskBg, shape = RoundedCornerShape(20.dp)) {
                        Text(
                            riskLabel(screeningState.value.riskLevel),
                            color = riskText,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            // Clinical disclaimer
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = Color(0xFFFFFBEB),
                border = BorderStroke(1.dp, Color(0xFFFDE68A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Outlined.Info, contentDescription = null, tint = Color(0xFFB45309), modifier = Modifier.size(14.dp))
                    Text(
                        "Chỉ dùng tham khảo trước khám, không thay thế chẩn đoán lâm sàng.",
                        color = Color(0xFF92400E),
                        fontSize = 11.sp,
                        lineHeight = 15.sp
                    )
                }
            }

            when (screeningState) {
                is LoadState.Data -> {
                    val data = screeningState.value
                    val recObj = data.recommendations?.takeIf { it.isJsonObject }?.asJsonObject
                    val structObj = data.structuredData?.takeIf { it.isJsonObject }?.asJsonObject

                    // Extract structured screening indicators
                    val suggestedSpecialty = extractSuggestedSpecialty(recObj)
                    val alternativeSpecialties = extractAlternativeSpecialties(recObj)
                    val ppgInfo = extractScreeningPpg(structObj, recObj)
                    val regionsList = extractBodyRegions(data.bodyDiagramData, recObj, structObj)
                    val redFlags = extractRedFlags(recObj)
                    val keyObservations = extractStringList(recObj?.getAsJsonObject("triageDetails")?.get("keyObservations"))
                    val imageFindings = extractStringList(recObj?.get("imageAnalysisFindings"))
                    val citations = extractCitations(recObj)
                    val painLevel = extractPainLevel(structObj)
                    val durationText = extractDuration(structObj)

                    // 1. Key Clinical Indicator Chips (Specialty, Heart Rate PPG, Body Regions, Pain)
                    if (suggestedSpecialty != null || ppgInfo != null || regionsList.isNotEmpty() || painLevel != null || durationText != null) {
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            suggestedSpecialty?.let { spec ->
                                ScreeningMetricBadge(
                                    icon = Icons.Outlined.MedicalServices,
                                    label = "Gợi ý: $spec",
                                    bg = DetailEmeraldSoft,
                                    border = DetailEmeraldBorder,
                                    fg = DetailEmeraldDark
                                )
                            }
                            ppgInfo?.let { (bpm, quality) ->
                                val qualityText = when (quality?.uppercase()) {
                                    "GOOD" -> " · Ổn định"
                                    "LOW" -> " · Tín hiệu yếu"
                                    else -> ""
                                }
                                ScreeningMetricBadge(
                                    icon = Icons.Outlined.FavoriteBorder,
                                    label = "$bpm nhịp/phút$qualityText",
                                    bg = Color(0xFFFFF1F2),
                                    border = Color(0xFFFECDD3),
                                    fg = Color(0xFFBE123C)
                                )
                            }
                            painLevel?.let { pain ->
                                ScreeningMetricBadge(
                                    icon = Icons.Outlined.MonitorHeart,
                                    label = "Mức đau: $pain/10",
                                    bg = Color(0xFFFFFBEB),
                                    border = Color(0xFFFDE68A),
                                    fg = Color(0xFFB45309)
                                )
                            }
                            durationText?.let { dur ->
                                ScreeningMetricBadge(
                                    icon = Icons.Outlined.Schedule,
                                    label = "Thời gian: $dur",
                                    bg = Color(0xFFF1F5F9),
                                    border = DetailBorder,
                                    fg = Color(0xFF334155)
                                )
                            }
                        }
                    }

                    // 2. Red Flags (if any)
                    if (redFlags.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFFEF2F2),
                            border = BorderStroke(1.dp, Color(0xFFFECACA)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Icon(Icons.Outlined.WarningAmber, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(16.dp))
                                    Text("Cảnh báo cờ đỏ (${redFlags.size})", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = Color(0xFF991B1B))
                                }
                                redFlags.forEach { flag ->
                                    Text("• $flag", fontSize = 12.sp, color = Color(0xFF7F1D1D), lineHeight = 17.sp)
                                }
                            }
                        }
                    }

                    // 3. AI Summary Highlight Box
                    val summary = recommendationSummary(data.recommendations)
                    if (summary.isNotBlank() && summary != "Chưa có nhận định") {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = DetailEmeraldSoft,
                            border = BorderStroke(1.dp, DetailEmeraldBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(11.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Nhận định tham khảo AI", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = DetailEmeraldDark)
                                Text(summary, fontSize = 12.5.sp, color = TextDark, lineHeight = 18.sp)
                                if (alternativeSpecialties.isNotEmpty()) {
                                    Text(
                                        "Chuyên khoa tham khảo thêm: ${alternativeSpecialties.joinToString(", ")}",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = DetailEmeraldMid,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )
                                }
                            }
                        }
                    }

                    // 4. Selected Body Regions
                    if (regionsList.isNotEmpty()) {
                        CompactKeyValueBlock("Vùng cơ thể đã chọn", regionsList.joinToString(", "))
                    }

                    // 5. Patient Narrative / Voice Transcript (avoid redundant "Chưa ghi nhận")
                    val typedSymptom = data.symptoms?.takeIf(String::isNotBlank)
                    val voiceText = data.voiceTranscript?.takeIf(String::isNotBlank)
                    if (typedSymptom != null) {
                        CompactKeyValueBlock("Triệu chứng người bệnh nhập", typedSymptom)
                    }
                    if (voiceText != null) {
                        CompactKeyValueBlock("Lời kể bằng giọng nói (đã xác nhận)", voiceText)
                    }
                    if (typedSymptom == null && voiceText == null) {
                        val fallback = appointment.symptoms?.takeIf(String::isNotBlank)
                            ?: appointment.reason?.takeIf(String::isNotBlank)
                        if (fallback != null) {
                            CompactKeyValueBlock("Triệu chứng người bệnh mô tả", fallback)
                        }
                    }

                    // 6. Localized Next Action, Decision Reason, PPG Explanation
                    val details = recommendationDetails(data.recommendations)
                    if (details.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = DetailSurfaceAlt,
                            border = BorderStroke(1.dp, DetailBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                details.forEach { (label, text) ->
                                    CompactKeyValueBlock(label, text)
                                }
                            }
                        }
                    }

                    // 7. Key Clinical Observations & Image Findings
                    if (keyObservations.isNotEmpty()) {
                        CompactKeyValueBlock(
                            "Dữ kiện triệu chứng làm căn cứ",
                            keyObservations.joinToString("\n") { "• $it" }
                        )
                    }
                    if (imageFindings.isNotEmpty()) {
                        CompactKeyValueBlock(
                            "Nhận xét từ hình ảnh tổn thương",
                            imageFindings.joinToString("\n") { "• $it" }
                        )
                    }

                    // 8. Attached Symptom Images (authenticated Coil request)
                    val symptomImages = data.media.orEmpty().filter { it.type == "SYMPTOM_IMAGE" && !it.fileUrl.isNullOrBlank() }
                    if (symptomImages.isNotEmpty()) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("Ảnh tổn thương đính kèm (${symptomImages.size})", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = DetailTextMuted)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                                symptomImages.take(3).forEach { media ->
                                    val fullUrl = buildMediaUrl(media)
                                    val request = remember(media.id, fullUrl) {
                                        ImageRequest.Builder(context)
                                            .data(fullUrl)
                                            .apply {
                                                DoctorApiClient.session().accessToken()?.let { token ->
                                                    addHeader("Authorization", "Bearer $token")
                                                }
                                            }
                                            .crossfade(true)
                                            .build()
                                    }
                                    AsyncImage(
                                        model = request,
                                        contentDescription = "Ảnh tổn thương",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier
                                            .weight(1f)
                                            .aspectRatio(1f)
                                            .clip(RoundedCornerShape(12.dp))
                                            .clickable { previewImageUrl = fullUrl }
                                    )
                                }
                            }
                        }
                    }

                    // 9. Clinical Citations (if any)
                    if (citations.isNotEmpty()) {
                        CompactKeyValueBlock(
                            "Nguồn y khoa tham chiếu",
                            citations.joinToString("\n") { "• $it" }
                        )
                    }

                    // 10. Screening Questions (Localized answers in clean cards)
                    val questions = data.questions.orEmpty().sortedBy { it.order }
                    if (questions.isNotEmpty()) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .clickable { expandQuestions = !expandQuestions },
                            shape = RoundedCornerShape(10.dp),
                            color = DetailSurfaceAlt,
                            border = BorderStroke(1.dp, DetailBorder)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    "Câu hỏi sàng lọc (${questions.size})",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.5.sp,
                                    color = DetailEmeraldDark
                                )
                                Icon(
                                    if (expandQuestions) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                    contentDescription = null,
                                    tint = DetailEmeraldMid,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        if (expandQuestions) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                questions.forEachIndexed { index, q ->
                                    val ans = localizeScreeningAnswer(q.answer)
                                    val isPositive = q.answer?.trim()?.lowercase() in listOf("yes", "true", "có")
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = if (isPositive) Color(0xFFFFFBEB) else DetailSurfaceAlt,
                                        border = BorderStroke(1.dp, if (isPositive) Color(0xFFFDE68A) else DetailBorder),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                                            verticalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Text(
                                                "${index + 1}. ${q.question}",
                                                fontSize = 12.sp,
                                                color = Color(0xFF475569),
                                                lineHeight = 17.sp
                                            )
                                            Text(
                                                ans,
                                                fontSize = 12.5.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = if (isPositive) Color(0xFFB45309) else DetailEmeraldDark
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                is LoadState.Loading -> {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = DetailEmeraldMid)
                        Text("Đang tải dữ liệu sàng lọc...", fontSize = 12.sp, color = DetailTextMuted)
                    }
                }
                else -> {
                    Text("Bệnh nhân chưa có phiếu sàng lọc tiền khám.", fontSize = 12.5.sp, color = DetailTextMuted)
                }
            }
        }
    }

    // Full-screen preview for symptom image
    previewImageUrl?.let { url ->
        Dialog(
            onDismissRequest = { previewImageUrl = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.Black)
                    .clickable { previewImageUrl = null }
            ) {
                val request = remember(url) {
                    ImageRequest.Builder(context)
                        .data(url)
                        .apply {
                            DoctorApiClient.session().accessToken()?.let { token ->
                                addHeader("Authorization", "Bearer $token")
                            }
                        }
                        .crossfade(true)
                        .build()
                }
                AsyncImage(
                    model = request,
                    contentDescription = "Ảnh tổn thương phóng to",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 260.dp, max = 560.dp)
                )
                IconButton(
                    onClick = { previewImageUrl = null },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(10.dp)
                        .background(Color.Black.copy(alpha = 0.55f), CircleShape)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.White)
                }
            }
        }
    }
}

@Composable
private fun ScreeningMetricBadge(
    icon: ImageVector,
    label: String,
    bg: Color,
    border: Color,
    fg: Color
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = bg,
        border = BorderStroke(1.dp, border)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            Icon(icon, contentDescription = null, tint = fg, modifier = Modifier.size(14.dp))
            Text(label, fontSize = 11.5.sp, fontWeight = FontWeight.ExtraBold, color = fg)
        }
    }
}

private val BODY_REGION_VI_MAP = mapOf(
    "head" to "Đầu / Hộp sọ",
    "face" to "Khuôn mặt / Trán",
    "neck" to "Cổ / Vùng họng",
    "left_shoulder" to "Vai trái",
    "right_shoulder" to "Vai phải",
    "left_upper_arm" to "Bắp tay trái",
    "right_upper_arm" to "Bắp tay phải",
    "left_elbow" to "Khuỷu tay trái",
    "right_elbow" to "Khuỷu tay phải",
    "left_forearm" to "Cẳng tay trái",
    "right_forearm" to "Cẳng tay phải",
    "left_hand" to "Bàn tay trái",
    "right_hand" to "Bàn tay phải",
    "upper_chest" to "Ngực trên",
    "chest" to "Ngực",
    "lower_chest" to "Ngực dưới",
    "upper_abdomen" to "Thượng vị / Bụng trên",
    "abdomen" to "Bụng trung tâm",
    "lower_abdomen" to "Hạ vị / Bụng dưới",
    "upper_back" to "Lưng trên / Bả vai",
    "mid_back" to "Lưng giữa",
    "lower_back" to "Thắt lưng / Lưng dưới",
    "left_hip" to "Hông / Mông trái",
    "right_hip" to "Hông / Mông phải",
    "left_thigh" to "Đùi trái",
    "right_thigh" to "Đùi phải",
    "left_knee" to "Đầu gối trái",
    "right_knee" to "Đầu gối phải",
    "left_calf" to "Bắp chân trái",
    "right_calf" to "Bắp chân phải",
    "left_ankle" to "Mắt cá trái",
    "right_ankle" to "Mắt cá phải",
    "left_foot" to "Bàn chân trái",
    "right_foot" to "Bàn chân phải"
)

private fun localizeBodyRegion(raw: String): String {
    val key = raw.trim().lowercase().replace('-', '_').replace(' ', '_')
    return BODY_REGION_VI_MAP[key] ?: raw.replace('_', ' ')
}

private fun localizeScreeningAnswer(value: String?): String = when (value?.trim()?.lowercase()) {
    null, "" -> "Chưa trả lời"
    "yes", "true" -> "Có"
    "no", "false" -> "Không"
    "unknown", "unsure" -> "Không chắc"
    "none" -> "Không có"
    else -> value
}

private fun extractSuggestedSpecialty(recObj: JsonObject?): String? {
    if (recObj == null) return null
    recObj.get("recommendedSpecialtyName")?.takeIf { it.isJsonPrimitive && it.asString.isNotBlank() }?.asString?.let { return it }
    recObj.get("selectedSpecialty")?.takeIf { it.isJsonObject }?.asJsonObject
        ?.get("name")?.takeIf { it.isJsonPrimitive && it.asString.isNotBlank() }?.asString?.let { return it }
    return null
}

private fun extractAlternativeSpecialties(recObj: JsonObject?): List<String> {
    val arr = recObj?.get("alternatives")?.takeIf { it.isJsonArray }?.asJsonArray ?: return emptyList()
    return arr.mapNotNull { el ->
        when {
            el.isJsonObject -> el.asJsonObject.get("name")?.takeIf { it.isJsonPrimitive }?.asString
            el.isJsonPrimitive -> el.asString
            else -> null
        }?.takeIf(String::isNotBlank)
    }
}

private fun extractScreeningPpg(structObj: JsonObject?, recObj: JsonObject?): Pair<Int, String?>? {
    val candidates = listOfNotNull(
        structObj?.get("ppg")?.takeIf { it.isJsonObject }?.asJsonObject,
        recObj?.get("ppg")?.takeIf { it.isJsonObject }?.asJsonObject,
        structObj?.get("vitals")?.takeIf { it.isJsonObject }?.asJsonObject
    )
    for (obj in candidates) {
        val bpm = obj.get("bpm")?.takeIf { it.isJsonPrimitive }?.let { runCatching { it.asInt }.getOrNull() }
            ?: obj.get("heartRateBpm")?.takeIf { it.isJsonPrimitive }?.let { runCatching { it.asInt }.getOrNull() }
            ?: obj.get("heartRate")?.takeIf { it.isJsonPrimitive }?.let { runCatching { it.asInt }.getOrNull() }
        if (bpm != null && bpm > 0) {
            val quality = obj.get("quality")?.takeIf { it.isJsonPrimitive }?.asString
                ?: obj.get("measurementQuality")?.takeIf { it.isJsonPrimitive }?.asString
            return bpm to quality
        }
    }
    return null
}

private fun extractBodyRegions(
    bodyDiagramData: JsonElement?,
    recObj: JsonObject?,
    structObj: JsonObject?
): List<String> {
    val rawIds = mutableListOf<String>()
    fun collectFrom(el: JsonElement?) {
        if (el == null || el.isJsonNull) return
        when {
            el.isJsonArray -> el.asJsonArray.forEach { item ->
                when {
                    item.isJsonPrimitive -> rawIds.add(item.asString)
                    item.isJsonObject -> {
                        val obj = item.asJsonObject
                        val v = obj.get("name")?.takeIf { it.isJsonPrimitive }?.asString
                            ?: obj.get("id")?.takeIf { it.isJsonPrimitive }?.asString
                            ?: obj.get("area")?.takeIf { it.isJsonPrimitive }?.asString
                        if (!v.isNullOrBlank()) rawIds.add(v)
                    }
                }
            }
            el.isJsonObject -> {
                collectFrom(el.asJsonObject.get("regions"))
                collectFrom(el.asJsonObject.get("bodyAreas"))
                collectFrom(el.asJsonObject.get("areas"))
            }
        }
    }
    collectFrom(bodyDiagramData)
    if (rawIds.isEmpty()) collectFrom(recObj?.get("regions"))
    if (rawIds.isEmpty()) collectFrom(structObj?.get("regions"))
    return rawIds.map(::localizeBodyRegion).filter(String::isNotBlank).distinct()
}

private fun extractRedFlags(recObj: JsonObject?): List<String> {
    val arr = recObj?.get("redFlags")?.takeIf { it.isJsonArray }?.asJsonArray ?: return emptyList()
    return arr.mapNotNull { el ->
        when {
            el.isJsonObject -> el.asJsonObject.get("text")?.takeIf { it.isJsonPrimitive }?.asString
                ?: el.asJsonObject.get("reason")?.takeIf { it.isJsonPrimitive }?.asString
            el.isJsonPrimitive -> el.asString
            else -> null
        }?.takeIf(String::isNotBlank)
    }
}

private fun extractStringList(el: JsonElement?): List<String> {
    val arr = el?.takeIf { it.isJsonArray }?.asJsonArray ?: return emptyList()
    return arr.mapNotNull { item ->
        if (item.isJsonPrimitive) item.asString.takeIf(String::isNotBlank) else null
    }
}

private fun extractCitations(recObj: JsonObject?): List<String> {
    val arr = recObj?.get("citations")?.takeIf { it.isJsonArray }?.asJsonArray ?: return emptyList()
    return arr.mapNotNull { el ->
        if (!el.isJsonObject) return@mapNotNull null
        val obj = el.asJsonObject
        val title = obj.get("title")?.takeIf { it.isJsonPrimitive }?.asString.orEmpty()
        val section = obj.get("section")?.takeIf { it.isJsonPrimitive }?.asString.orEmpty()
        listOf(title, section).filter(String::isNotBlank).joinToString(" — ").takeIf(String::isNotBlank)
    }
}

private fun extractPainLevel(structObj: JsonObject?): Int? {
    val q = structObj?.get("questionnaire")?.takeIf { it.isJsonObject }?.asJsonObject ?: structObj ?: return null
    return q.get("painLevel")?.takeIf { it.isJsonPrimitive }?.let { runCatching { it.asInt }.getOrNull() }?.takeIf { it in 1..10 }
}

private fun extractDuration(structObj: JsonObject?): String? {
    val q = structObj?.get("questionnaire")?.takeIf { it.isJsonObject }?.asJsonObject ?: structObj ?: return null
    return q.get("duration")?.takeIf { it.isJsonPrimitive && it.asString.isNotBlank() }?.asString
}

private fun buildMediaUrl(media: ScreeningMediaItem): String {
    val path = media.fileUrl.orEmpty()
    if (path.startsWith("http://") || path.startsWith("https://")) return path
    val base = DoctorApiClient.serverBaseUrl().trimEnd('/')
    return if (path.startsWith("/")) "$base$path" else "$base/$path"
}

@Composable
private fun CompactKeyValueBlock(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = DetailTextMuted)
        Text(value, fontSize = 12.5.sp, color = TextDark, lineHeight = 18.sp)
    }
}

// ==============================================================================
// COMPACT SHARED RECORD SUMMARY CARD (Only key info; click to open full popup)
// ==============================================================================
@Composable
private fun SharedRecordSummaryCard(
    record: SharedRecord,
    onViewDetail: () -> Unit
) {
    val primaryDiagnosis = remember(record) {
        record.diagnoses?.firstOrNull()?.let { d ->
            listOfNotNull(d.diseaseName?.takeIf(String::isNotBlank), d.icdCode?.takeIf(String::isNotBlank)?.let { "($it)" })
                .joinToString(" ")
                .takeIf(String::isNotBlank)
        } ?: record.initialDiagnosis?.takeIf(String::isNotBlank)
            ?: record.conclusion?.takeIf(String::isNotBlank)
    }
    val highlightText = primaryDiagnosis
        ?: record.chiefComplaint?.takeIf(String::isNotBlank)
        ?: record.clinicalSummary?.takeIf(String::isNotBlank)

    val diagnosisCount = record.diagnoses.orEmpty().size
    val observationCount = record.observations.orEmpty().size
    val medicineCount = record.prescription?.items.orEmpty().size

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable(onClick = onViewDetail),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, DetailBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(9.dp)
        ) {
            // Top Row: Date Pill + Specialty Tag
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = DetailEmeraldSoft
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Outlined.Event, contentDescription = null, tint = DetailEmeraldDark, modifier = Modifier.size(13.dp))
                        Text(
                            formatDateTime(record.encounterDate),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = DetailEmeraldDark
                        )
                    }
                }
                Text(
                    record.specialtyName,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = DetailEmeraldMid,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Hospital & Attending Doctor
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    record.hospitalName,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.5.sp,
                    color = TextDark,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Outlined.MedicalServices, contentDescription = null, tint = DetailTextMuted, modifier = Modifier.size(13.dp))
                    Text(
                        record.doctorName,
                        fontSize = 12.sp,
                        color = DetailTextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Primary Clinical Highlight (Concise 2-line preview)
            if (!highlightText.isNullOrBlank()) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = DetailSurfaceAlt,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)) {
                        Text(
                            if (primaryDiagnosis != null) "Chẩn đoán chính" else "Lý do / Tóm tắt",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = DetailTextMuted
                        )
                        Text(
                            highlightText,
                            fontSize = 12.5.sp,
                            fontWeight = if (primaryDiagnosis != null) FontWeight.SemiBold else FontWeight.Normal,
                            color = TextDark,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            lineHeight = 17.sp
                        )
                    }
                }
            }

            // Footer: Content Badges + View Detail Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    if (diagnosisCount > 0) RecordMiniTag("$diagnosisCount chẩn đoán")
                    if (observationCount > 0) RecordMiniTag("$observationCount chỉ số")
                    if (medicineCount > 0) RecordMiniTag("$medicineCount thuốc")
                }

                Spacer(Modifier.width(6.dp))

                Surface(
                    onClick = onViewDetail,
                    shape = RoundedCornerShape(10.dp),
                    color = DetailEmeraldSoft,
                    border = BorderStroke(1.dp, DetailEmeraldBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            "Xem chi tiết",
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = DetailEmeraldDark
                        )
                        Icon(
                            Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = DetailEmeraldDark,
                            modifier = Modifier.size(15.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RecordMiniTag(text: String) {
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = Color(0xFFF1F5F9)
    ) {
        Text(
            text = text,
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF475569),
            maxLines = 1,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
        )
    }
}

// ==============================================================================
// SHARED MEDICAL RECORD DETAIL POPUP DIALOG
// ==============================================================================
@Composable
private fun SharedRecordDetailDialog(
    record: SharedRecord,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.86f),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Popup Header (NovaCare Emerald Gradient)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(DetailEmeraldDark, DetailEmeraldMid)
                            )
                        )
                        .padding(horizontal = 18.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = Color.White.copy(alpha = 0.16f),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                formatDateTime(record.encounterDate),
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(32.dp)
                                .background(Color.White.copy(alpha = 0.16f), CircleShape)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                    }

                    Text(
                        record.hospitalName,
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 17.sp,
                        lineHeight = 22.sp
                    )
                    Text(
                        "${record.specialtyName} · ${record.doctorName}",
                        color = Color(0xFFD1FAE5),
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                // Scrollable Clinical Content
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Lý do khám
                    record.chiefComplaint?.takeIf(String::isNotBlank)?.let { complaint ->
                        PopupSectionBlock("Lý do khám", Icons.Outlined.Assignment) {
                            Text(complaint, fontSize = 13.sp, color = TextDark, lineHeight = 19.sp)
                        }
                    }

                    // Chẩn đoán
                    val diagnoses = record.diagnoses.orEmpty()
                    if (!record.initialDiagnosis.isNullOrBlank() || diagnoses.isNotEmpty()) {
                        PopupSectionBlock("Chẩn đoán", Icons.Outlined.MonitorHeart) {
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                record.initialDiagnosis?.takeIf(String::isNotBlank)?.let {
                                    Text("Chẩn đoán ban đầu: $it", fontSize = 12.5.sp, color = DetailTextMuted)
                                }
                                diagnoses.forEach { d ->
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = DetailEmeraldSoft,
                                        border = BorderStroke(1.dp, DetailEmeraldBorder),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                d.diseaseName.orEmpty().ifBlank { "Chưa rõ" },
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = DetailEmeraldDark,
                                                modifier = Modifier.weight(1f)
                                            )
                                            d.icdCode?.takeIf(String::isNotBlank)?.let { code ->
                                                Spacer(Modifier.width(8.dp))
                                                Surface(color = Color.White, shape = RoundedCornerShape(6.dp)) {
                                                    Text(
                                                        code,
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.ExtraBold,
                                                        color = DetailEmeraldMid,
                                                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Tóm tắt khám lâm sàng
                    record.clinicalSummary?.takeIf(String::isNotBlank)?.let { summary ->
                        PopupSectionBlock("Tóm tắt khám lâm sàng", Icons.Outlined.Description) {
                            Text(summary, fontSize = 13.sp, color = TextDark, lineHeight = 19.sp)
                        }
                    }

                    // Chỉ số & Kết quả cận lâm sàng
                    val observations = record.observations.orEmpty()
                    if (observations.isNotEmpty()) {
                        PopupSectionBlock("Chỉ số & Cận lâm sàng (${observations.size})", Icons.Outlined.Biotech) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                observations.forEach { obs ->
                                    val fullVal = listOfNotNull(
                                        obs.value?.takeIf(String::isNotBlank),
                                        obs.unit?.takeIf(String::isNotBlank)
                                    ).joinToString(" ")
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = DetailSurfaceAlt,
                                        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(horizontal = 11.dp, vertical = 8.dp),
                                            verticalArrangement = Arrangement.spacedBy(2.dp)
                                        ) {
                                            Text(
                                                obs.name.orEmpty().ifBlank { "Chỉ số" },
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = DetailTextMuted
                                            )
                                            Text(
                                                fullVal.ifBlank { "—" },
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = TextDark,
                                                lineHeight = 18.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Hướng điều trị & Kết luận
                    if (!record.treatmentPlan.isNullOrBlank() || !record.conclusion.isNullOrBlank()) {
                        PopupSectionBlock("Điều trị & Kết luận", Icons.Outlined.FactCheck) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                record.treatmentPlan?.takeIf(String::isNotBlank)?.let {
                                    CompactKeyValueBlock("Hướng điều trị", it)
                                }
                                record.conclusion?.takeIf(String::isNotBlank)?.let {
                                    CompactKeyValueBlock("Kết luận", it)
                                }
                            }
                        }
                    }

                    // Đơn thuốc
                    val meds = record.prescription?.items.orEmpty()
                    if (meds.isNotEmpty() || !record.prescription?.note.isNullOrBlank()) {
                        PopupSectionBlock("Đơn thuốc (${meds.size})", Icons.Outlined.Medication) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                meds.forEachIndexed { idx, item ->
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = DetailSurfaceAlt,
                                        border = BorderStroke(1.dp, DetailBorder),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(11.dp),
                                            verticalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    "${idx + 1}. ${item.drugName.orEmpty()}",
                                                    fontWeight = FontWeight.ExtraBold,
                                                    fontSize = 13.sp,
                                                    color = DetailEmeraldDark,
                                                    modifier = Modifier.weight(1f)
                                                )
                                                item.dosage?.takeIf(String::isNotBlank)?.let { dose ->
                                                    Spacer(Modifier.width(6.dp))
                                                    Surface(color = DetailEmeraldSoft, shape = RoundedCornerShape(6.dp)) {
                                                        Text(
                                                            dose,
                                                            fontSize = 10.5.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = DetailEmeraldMid,
                                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                        )
                                                    }
                                                }
                                            }
                                            val instruction = listOfNotNull(
                                                item.usageInstruction?.takeIf(String::isNotBlank),
                                                item.duration?.takeIf(String::isNotBlank)
                                            ).joinToString(" · ")
                                            if (instruction.isNotBlank()) {
                                                Text(instruction, fontSize = 12.sp, color = Color(0xFF475569), lineHeight = 17.sp)
                                            }
                                        }
                                    }
                                }
                                record.prescription?.note?.takeIf(String::isNotBlank)?.let { note ->
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = Color(0xFFFFFBEB),
                                        border = BorderStroke(1.dp, Color(0xFFFDE68A)),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            "Lời dặn: $note",
                                            fontSize = 12.sp,
                                            color = Color(0xFF92400E),
                                            modifier = Modifier.padding(10.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Sticky Footer
                HorizontalDivider(color = DetailBorder)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        shape = RoundedCornerShape(13.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = DetailEmeraldDark)
                    ) {
                        Text("Đóng hồ sơ", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun PopupSectionBlock(
    title: String,
    icon: ImageVector,
    content: @Composable () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(icon, contentDescription = null, tint = DetailEmeraldMid, modifier = Modifier.size(16.dp))
            Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 13.5.sp, color = TextDark)
        }
        content()
    }
}

private fun statusColors(status: String): Triple<Color, Color, Color> = when (status.uppercase()) {
    "COMPLETED" -> Triple(Color(0xFFECFDF5), Color(0xFFA7F3D0), Color(0xFF065F46))
    "CONFIRMED", "PAID" -> Triple(Color(0xFFE0F2FE), Color(0xFFBAE6FD), Color(0xFF0369A1))
    "PENDING", "AWAITING_PAYMENT" -> Triple(Color(0xFFFFFBEB), Color(0xFFFDE68A), Color(0xFFB45309))
    "CANCELLED", "NO_SHOW" -> Triple(Color(0xFFFEF2F2), Color(0xFFFECACA), Color(0xFFDC2626))
    else -> Triple(Color(0xFFF1F5F9), Color(0xFFE2E8F0), Color(0xFF475569))
}

private fun appointmentTypeColors(item: DoctorAppointment): Pair<Color, Color> = when {
    item.serviceBookingMode == "ONLINE" || item.consultation != null -> Color(0xFFE0F2FE) to Color(0xFF0369A1)
    item.serviceBookingMode == "AFTER_HOURS" -> Color(0xFFFEF3C7) to Color(0xFFB45309)
    item.serviceBookingMode == "SERVICE" || item.medicalService != null -> Color(0xFFF3E8FF) to Color(0xFF7E22CE)
    else -> Color(0xFFF1F5F9) to Color(0xFF475569)
}

private fun riskColors(risk: String?): Pair<Color, Color> = when (risk?.uppercase()) {
    "HIGH", "URGENT", "EMERGENCY" -> Color(0xFFFEF2F2) to Color(0xFFDC2626)
    "MODERATE", "MEDIUM", "CONSULT" -> Color(0xFFFFFBEB) to Color(0xFFB45309)
    "LOW" -> Color(0xFFECFDF5) to Color(0xFF065F46)
    else -> Color(0xFFF1F5F9) to Color(0xFF475569)
}
