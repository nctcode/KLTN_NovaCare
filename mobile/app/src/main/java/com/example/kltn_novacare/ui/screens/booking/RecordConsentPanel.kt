package com.example.kltn_novacare.ui.screens.booking

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.remote.*
import com.example.kltn_novacare.ui.screens.appointment.text
import com.example.kltn_novacare.ui.theme.*
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.temporal.ChronoUnit

// ==============================================================================
// 1. MAIN CARD: RECORD CONSENT PANEL (Compact & Progressive Disclosure)
// ==============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecordConsentPanel(
    profileId: String,
    targetId: String,
    targetName: String,
    onBusy: (Boolean) -> Unit = {}
) {
    key(profileId, targetId) {
        var enabled by remember { mutableStateOf(false) }
        var records by remember { mutableStateOf<List<JsonObject>>(emptyList()) }
        var selected by remember { mutableStateOf(setOf<String>()) }
        var sections by remember { mutableStateOf(setOf("SUMMARY", "DIAGNOSES", "OBSERVATIONS", "PRESCRIPTIONS")) }
        var days by remember { mutableStateOf("7") }
        var busy by remember { mutableStateOf(false) }
        var message by remember { mutableStateOf<String?>(null) }
        var showConfigSheet by remember { mutableStateOf(false) }
        var showHistorySheet by remember { mutableStateOf(false) }

        val scope = rememberCoroutineScope()
        val api = remember { ApiClient.getService() }

        DisposableEffect(Unit) { onDispose { onBusy(false) } }

        fun loadRecords() {
            scope.launch {
                busy = true
                onBusy(true)
                healthApiResult("Không tải được bệnh án", { api.shareableRecords(profileId, targetId) }) { it.data.orEmpty() }
                    .fold(
                        onSuccess = { fetched ->
                            records = fetched
                            selected = fetched.map { it.text("id") }.toSet()
                            message = null
                        },
                        onFailure = { message = it.message }
                    )
                busy = false
                onBusy(false)
            }
        }

        fun executeGrant(onSuccessDone: () -> Unit) {
            val chosen = records.filter { it.text("id") in selected }.groupBy { it.getAsJsonObject("hospital").text("id") }
            val selectedSections = sections.toList()
            val expires = Instant.now().plus(days.toLongOrNull() ?: 7L, ChronoUnit.DAYS).toString()

            scope.launch {
                busy = true
                onBusy(true)
                message = null
                var completed = 0

                for ((source, entries) in chosen) {
                    val body = JsonObject().apply {
                        addProperty("patientProfileId", profileId)
                        addProperty("sourceHospitalId", source)
                        addProperty("targetHospitalId", targetId)
                        addProperty("expiresAt", expires)
                        addProperty("purpose", "TREATMENT")
                        add("encounterIds", JsonArray().apply { entries.forEach { add(it.text("id")) } })
                        add("allowedSections", JsonArray().apply { selectedSections.forEach { add(it) } })
                    }
                    val created = healthApiResult("Không tạo được quyền", { api.createConsent(body) }) { requireNotNull(it.data).text("id") }
                    if (created.isFailure) {
                        message = created.exceptionOrNull()?.message
                        break
                    }
                    val granted = healthApiResult("Không xác nhận được quyền", { api.grantConsent(created.getOrThrow()) }) { it.data }
                    if (granted.isFailure) {
                        message = granted.exceptionOrNull()?.message
                        break
                    }
                    completed++
                }

                if (completed > 0) {
                    message = "Đã cấp quyền chia sẻ thành công từ $completed cơ sở y tế cho $targetName."
                    onSuccessDone()
                }
                busy = false
                onBusy(false)
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, BorderLight)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Header with Icon & Switch
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .background(PrimaryLight, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.FolderShared,
                            contentDescription = null,
                            tint = PrimaryDark,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Chia sẻ hồ sơ bệnh án cũ",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Hỗ trợ bác sĩ tại $targetName nắm rõ tiền sử khám",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            lineHeight = 16.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Switch(
                        checked = enabled,
                        enabled = !busy,
                        onCheckedChange = { value ->
                            enabled = value
                            if (value && records.isEmpty()) {
                                loadRecords()
                            }
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = Primary,
                            uncheckedThumbColor = Color.White,
                            uncheckedTrackColor = Color(0xFFCBD5E1)
                        )
                    )
                }

                // Expanded Summary View when Switch is ON
                AnimatedVisibility(visible = enabled) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        HorizontalDivider(color = BorderLight, thickness = 0.8.dp)

                        if (busy && records.isEmpty()) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = Primary)
                                Spacer(modifier = Modifier.width(10.dp))
                                Text("Đang kiểm tra hồ sơ bệnh án khả dụng...", fontSize = 12.sp, color = TextSecondary)
                            }
                        } else if (records.isEmpty()) {
                            Surface(
                                color = Color(0xFFF8FAFC),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Outlined.Info, null, tint = TextMuted, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Chưa có bệnh án điện tử từ cơ sở khác để chia sẻ.",
                                        fontSize = 12.sp,
                                        color = TextSecondary
                                    )
                                }
                            }
                        } else {
                            // Summary Info Chips
                            Surface(
                                color = PrimaryLight.copy(alpha = 0.5f),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, PrimaryBorder),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Cấu hình chia sẻ:",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = PrimaryDark
                                        )

                                        Text(
                                            text = "${selected.size}/${records.size} hồ sơ được chọn",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (selected.isNotEmpty()) PrimaryDark else Color(0xFFDC2626)
                                        )
                                    }

                                    // Chips
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        ConsentBadge(
                                            icon = Icons.Outlined.MedicalInformation,
                                            text = "${sections.size} mục dữ liệu"
                                        )
                                        ConsentBadge(
                                            icon = Icons.Outlined.Schedule,
                                            text = "$days ngày hiệu lực"
                                        )
                                    }
                                }
                            }

                            // Button to open Customization Sheet
                            OutlinedButton(
                                onClick = { showConfigSheet = true },
                                enabled = !busy,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(44.dp),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryDark),
                                border = BorderStroke(1.dp, Primary)
                            ) {
                                Icon(Icons.Outlined.Tune, null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Tùy chỉnh danh sách hồ sơ & phạm vi", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Success or Error message
                message?.let { msg ->
                    Surface(
                        color = if (msg.contains("thành công")) Color(0xFFECFDF5) else Color(0xFFFEF2F2),
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(1.dp, if (msg.contains("thành công")) Color(0xFFA7F3D0) else Color(0xFFFECACA)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (msg.contains("thành công")) Icons.Default.Check else Icons.Outlined.Info,
                                contentDescription = null,
                                tint = if (msg.contains("thành công")) PrimaryDark else Color(0xFFDC2626),
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = msg,
                                fontSize = 12.sp,
                                color = if (msg.contains("thành công")) PrimaryDark else Color(0xFF991B1B),
                                lineHeight = 16.sp
                            )
                        }
                    }
                }

                // History & Logs trigger row
                HorizontalDivider(color = BorderLight, thickness = 0.6.dp)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .clickable(enabled = !busy) { showHistorySheet = true }
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Outlined.History,
                            contentDescription = null,
                            tint = TextSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Xem quyền đã cấp & nhật ký bệnh viện truy cập",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextSecondary
                        )
                    }

                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = TextMuted,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }

        // ==============================================================================
        // BOTTOM SHEET 1: CONFIGURATION MODAL (Clean, progressive, compact)
        // ==============================================================================
        if (showConfigSheet) {
            ModalBottomSheet(
                onDismissRequest = { showConfigSheet = false },
                containerColor = Color.White,
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                dragHandle = { BottomSheetDefaults.DragHandle() }
            ) {
                ShareConfigSheetContent(
                    targetName = targetName,
                    records = records,
                    selected = selected,
                    onToggleSelect = { id ->
                        selected = if (id in selected) selected - id else selected + id
                    },
                    onSelectAll = { selectAll ->
                        selected = if (selectAll) records.map { it.text("id") }.toSet() else emptySet()
                    },
                    sections = sections,
                    onToggleSection = { sec ->
                        sections = if (sec in sections) sections - sec else sections + sec
                    },
                    days = days,
                    onDaysChange = { days = it },
                    busy = busy,
                    onConfirm = {
                        executeGrant {
                            showConfigSheet = false
                        }
                    },
                    onClose = { showConfigSheet = false }
                )
            }
        }

        // ==============================================================================
        // BOTTOM SHEET 2: HISTORY & AUDIT LOGS MODAL
        // ==============================================================================
        if (showHistorySheet) {
            ModalBottomSheet(
                onDismissRequest = { showHistorySheet = false },
                containerColor = Color.White,
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                dragHandle = { BottomSheetDefaults.DragHandle() }
            ) {
                ConsentHistorySheetContent(
                    profileId = profileId,
                    onClose = { showHistorySheet = false }
                )
            }
        }
    }
}

// ==============================================================================
// 2. CONSENT MANAGEMENT (Public Composable used by PatientRecordBook & History)
// ==============================================================================
@Composable
fun ConsentManagement(profileId: String) {
    val api = remember { ApiClient.getService() }
    val scope = rememberCoroutineScope()
    var refresh by remember { mutableIntStateOf(0) }
    var consents by remember(profileId) { mutableStateOf<List<JsonObject>>(emptyList()) }
    var logs by remember(profileId) { mutableStateOf<List<JsonObject>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    LaunchedEffect(profileId, refresh) {
        error = null
        healthApiResult("Không tải được quyền chia sẻ", { api.consents(profileId) }) { it.data.orEmpty() }
            .fold({ consents = it }, { error = it.message })
        healthApiResult("Không tải được nhật ký", { api.consentLogs(profileId) }) { it.data.orEmpty() }
            .fold({ logs = it }, { error = it.message })
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        error?.let {
            Text(it, color = Color(0xFFDC2626), fontSize = 12.sp)
        }

        if (consents.isEmpty()) {
            Text("Chưa có quyền chia sẻ nào được cấp.", fontSize = 12.sp, color = TextMuted)
        }

        consents.forEach { consent ->
            val expiry = consent.text("expiresAt")
            val expired = runCatching { Instant.parse(expiry) <= Instant.now() }.getOrDefault(false)
            val status = consent.text("status")
            val sourceName = consent.getAsJsonObject("sourceHospital")?.text("name") ?: "Cơ sở nguồn"
            val targetHospitalName = consent.getAsJsonObject("targetHospital")?.text("name") ?: "Cơ sở đích"

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
                            text = "$sourceName → $targetHospitalName",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.weight(1f)
                        )

                        Surface(
                            color = if (expired || status == "REVOKED") Color(0xFFF1F5F9) else Color(0xFFECFDF5),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                text = if (expired) "Hết hạn" else when(status) {
                                    "GRANTED" -> "Đã cấp quyền"
                                    "REVOKED" -> "Đã thu hồi"
                                    else -> "Chờ xác nhận"
                                },
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (expired || status == "REVOKED") TextMuted else PrimaryDark,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }

                    val allowed = consent.getAsJsonObject("scope")?.getAsJsonArray("allowedSections")?.joinToString {
                        when(it.asString) {
                            "SUMMARY" -> "Tóm tắt"
                            "DIAGNOSES" -> "Chẩn đoán"
                            "OBSERVATIONS" -> "Cận lâm sàng"
                            else -> "Đơn thuốc"
                        }
                    }.orEmpty()

                    if (allowed.isNotBlank()) {
                        Text("Phạm vi: $allowed", fontSize = 12.sp, color = TextSecondary)
                    }

                    Text(
                        text = "Hạn dùng: ${if (expiry.length >= 10) expiry.substring(0, 10) else expiry}",
                        fontSize = 11.sp,
                        color = TextMuted
                    )

                    if (!expired && status in listOf("GRANTED", "PENDING")) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(
                                enabled = !busy,
                                onClick = {
                                    scope.launch {
                                        busy = true
                                        healthApiResult("Không thu hồi được quyền", { api.revokeConsent(consent.text("id")) }) { it.data }
                                            .fold({ refresh++ }, { error = it.message })
                                        busy = false
                                    }
                                },
                                colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFDC2626))
                            ) {
                                Text("Thu hồi quyền", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }

        Text("Nhật ký bệnh viện truy cập", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
        if (logs.isEmpty()) {
            Text("Chưa có lượt truy cập hồ sơ nào được ghi nhận.", fontSize = 12.sp, color = TextMuted)
        }
        logs.forEach { logItem ->
            val hospitalWhoAccessed = logItem.getAsJsonObject("user")?.getAsJsonObject("hospital")?.text("name").orEmpty()
            val accessedAt = logItem.text("createdAt")
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0))
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Visibility, null, tint = TextSecondary, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (hospitalWhoAccessed.isNotBlank()) hospitalWhoAccessed else "Cơ sở y tế điều trị",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Đã xem lúc $accessedAt",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }
                }
            }
        }

        TextButton(onClick = { refresh++ }) {
            Icon(Icons.Default.Refresh, null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("Làm mới quyền và nhật ký", fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

// ==============================================================================
// 3. SHEET CONTENT: SHARE CONFIGURATION
// ==============================================================================
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ShareConfigSheetContent(
    targetName: String,
    records: List<JsonObject>,
    selected: Set<String>,
    onToggleSelect: (String) -> Unit,
    onSelectAll: (Boolean) -> Unit,
    sections: Set<String>,
    onToggleSection: (String) -> Unit,
    days: String,
    onDaysChange: (String) -> Unit,
    busy: Boolean,
    onConfirm: () -> Unit,
    onClose: () -> Unit
) {
    var agreedTerms by remember { mutableStateOf(false) }
    var customDaysMode by remember { mutableStateOf(days !in listOf("7", "14", "30", "90")) }
    val allSelected = records.isNotEmpty() && selected.size == records.size

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .fillMaxHeight(0.9f)
    ) {
        // Sheet Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Cấu hình chia sẻ hồ sơ",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextPrimary
                )
                Text(
                    text = "Đơn vị tiếp nhận: $targetName",
                    fontSize = 12.sp,
                    color = TextSecondary
                )
            }

            IconButton(onClick = onClose) {
                Icon(Icons.Default.Close, contentDescription = "Đóng", tint = TextSecondary)
            }
        }

        HorizontalDivider(color = BorderLight)

        // Scrollable Body
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // 1. RECORDS SELECTION SECTION
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "1. Chọn bệnh án chia sẻ (${selected.size}/${records.size})",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    TextButton(
                        onClick = { onSelectAll(!allSelected) },
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (allSelected) "Bỏ chọn tất cả" else "Chọn tất cả",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryDark
                        )
                    }
                }

                // Grouped records
                records.groupBy { it.getAsJsonObject("hospital").text("name") }.forEach { (hospitalName, entries) ->
                    Text(
                        text = hospitalName,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryDark,
                        modifier = Modifier.padding(top = 4.dp)
                    )

                    entries.forEach { record ->
                        val recordId = record.text("id")
                        val isChecked = recordId in selected
                        var expandedSummary by remember { mutableStateOf(false) }
                        val summaryText = record.text("clinicalSummary")

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .clickable { onToggleSelect(recordId) },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isChecked) PrimaryLight.copy(alpha = 0.4f) else Color(0xFFF8FAFC)
                            ),
                            border = BorderStroke(
                                1.dp,
                                if (isChecked) PrimaryBorder else Color(0xFFE2E8F0)
                            )
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Checkbox(
                                        checked = isChecked,
                                        onCheckedChange = { onToggleSelect(recordId) },
                                        colors = CheckboxDefaults.colors(
                                            checkedColor = Primary,
                                            checkmarkColor = Color.White
                                        ),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Surface(
                                                color = Color.White,
                                                shape = RoundedCornerShape(6.dp),
                                                border = BorderStroke(1.dp, Color(0xFFCBD5E1))
                                            ) {
                                                Text(
                                                    text = record.text("encounterDate").substringBefore('T'),
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = TextPrimary,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }

                                            Text(
                                                text = record.text("specialtyName"),
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = TextPrimary
                                            )
                                        }
                                    }
                                }

                                if (summaryText.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = summaryText,
                                        fontSize = 12.sp,
                                        color = TextSecondary,
                                        lineHeight = 16.sp,
                                        maxLines = if (expandedSummary) Int.MAX_VALUE else 2,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.padding(start = 30.dp)
                                    )

                                    if (summaryText.length > 90) {
                                        Text(
                                            text = if (expandedSummary) "Thu gọn" else "Xem thêm",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = PrimaryDark,
                                            modifier = Modifier
                                                .padding(start = 30.dp, top = 2.dp)
                                                .clickable { expandedSummary = !expandedSummary }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 2. ALLOWED SECTIONS
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "2. Phạm vi dữ liệu được phép xem",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                val sectionOptions = listOf(
                    "SUMMARY" to "Khám lâm sàng & tóm tắt",
                    "DIAGNOSES" to "Chẩn đoán bệnh",
                    "OBSERVATIONS" to "Xét nghiệm & Cận lâm sàng",
                    "PRESCRIPTIONS" to "Đơn thuốc đã kê"
                )

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    sectionOptions.forEach { (secId, secLabel) ->
                        val isSecChecked = secId in sections
                        FilterChip(
                            selected = isSecChecked,
                            onClick = { onToggleSection(secId) },
                            label = { Text(secLabel, fontSize = 12.sp) },
                            leadingIcon = if (isSecChecked) {
                                {
                                    Icon(
                                        Icons.Default.Check,
                                        null,
                                        modifier = Modifier.size(14.dp),
                                        tint = PrimaryDark
                                    )
                                }
                            } else null,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryLight,
                                selectedLabelColor = PrimaryDark
                            )
                        )
                    }
                }
            }

            // 3. DURATION
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "3. Thời hạn cấp quyền truy cập",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("7" to "7 ngày", "14" to "14 ngày", "30" to "30 ngày", "90" to "90 ngày").forEach { (valDay, labelDay) ->
                        val isDaySelected = !customDaysMode && days == valDay
                        FilterChip(
                            selected = isDaySelected,
                            onClick = {
                                customDaysMode = false
                                onDaysChange(valDay)
                            },
                            label = { Text(labelDay, fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryLight,
                                selectedLabelColor = PrimaryDark
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                if (customDaysMode) {
                    OutlinedTextField(
                        value = days,
                        onValueChange = onDaysChange,
                        label = { Text("Số ngày hiệu lực (1 - 365 ngày)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    TextButton(onClick = { customDaysMode = true }) {
                        Text("Tự nhập số ngày tùy chỉnh...", fontSize = 12.sp, color = PrimaryDark)
                    }
                }
            }

            // 4. AGREEMENT CHECKBOX
            Surface(
                color = Color(0xFFF8FAFC),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { agreedTerms = !agreedTerms }
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = agreedTerms,
                        onCheckedChange = { agreedTerms = it },
                        colors = CheckboxDefaults.colors(
                            checkedColor = Primary,
                            checkmarkColor = Color.White
                        ),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Tôi đồng ý chia sẻ các hồ sơ đã chọn cho $targetName phục vụ việc khám bệnh. Có thể thu hồi quyền bất kỳ lúc nào.",
                        fontSize = 12.sp,
                        color = TextPrimary,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Bottom Sticky Action Bar in Sheet
        Surface(
            color = Color.White,
            shadowElevation = 8.dp,
            border = BorderStroke(1.dp, BorderLight),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                val canSubmit = !busy && agreedTerms && selected.isNotEmpty() &&
                        sections.isNotEmpty() && days.toIntOrNull() in 1..365

                Button(
                    onClick = onConfirm,
                    enabled = canSubmit,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Primary,
                        contentColor = Color.White,
                        disabledContainerColor = Color(0xFFCBD5E1)
                    )
                ) {
                    if (busy) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("Đang xử lý cấp quyền...", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    } else {
                        Text("Xác nhận & Cấp quyền chia sẻ", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ==============================================================================
// 4. SHEET CONTENT: HISTORY & AUDIT LOGS
// ==============================================================================
@Composable
private fun ConsentHistorySheetContent(
    profileId: String,
    onClose: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .fillMaxHeight(0.85f)
    ) {
        // Sheet Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Lịch sử & Nhật ký chia sẻ",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextPrimary
                )
                Text(
                    text = "Quản lý quyền truy cập và kiểm tra lượt xem bệnh án",
                    fontSize = 12.sp,
                    color = TextSecondary
                )
            }

            IconButton(onClick = onClose) {
                Icon(Icons.Default.Close, contentDescription = "Đóng", tint = TextSecondary)
            }
        }

        HorizontalDivider(color = BorderLight)

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            ConsentManagement(profileId = profileId)
        }
    }
}

// ==============================================================================
// HELPER BADGE
// ==============================================================================
@Composable
private fun ConsentBadge(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Surface(
        color = Color.White,
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, PrimaryBorder)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = PrimaryDark,
                modifier = Modifier.size(13.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = text,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = PrimaryDark
            )
        }
    }
}
