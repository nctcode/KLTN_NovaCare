package com.novacare.doctor.ui

import android.Manifest
import android.content.pm.PackageManager
import android.provider.OpenableColumns
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.navigation.NavHostController
import coil.ImageLoader
import coil.compose.AsyncImage
import io.livekit.android.renderer.TextureViewRenderer
import io.livekit.android.room.Room
import io.livekit.android.room.track.VideoTrack
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import com.novacare.doctor.data.*

private val ConsultGreen = Color(0xFF087F5B)
private val ConsultGreenLight = Color(0xFFE9F7F1)
private val ConsultBackground = Color(0xFFF4F8F6)
private val ConsultText = Color(0xFF102A23)
private val ConsultMuted = Color(0xFF64748B)
private val ConsultBorder = Color(0xFFDDE7E2)
private val ConsultDanger = Color(0xFFB42318)

@Composable
fun DoctorConsultationsScreen(
    nav: NavHostController,
    viewModel: DoctorConsultationViewModel
) {
    val state by viewModel.list.collectAsState()
    var filter by rememberSaveable { mutableStateOf("ALL") }
    LaunchedEffect(Unit) { viewModel.loadConsultations() }
    val visible = remember(state.items, filter) {
        state.items.filter {
            when (filter) {
                "PENDING" -> it.status in listOf("SCHEDULED", "WAITING")
                "ACTIVE" -> it.status in listOf("ACCEPTED", "ACTIVE")
                "DONE" -> it.status in listOf("COMPLETED", "CANCELLED", "EXPIRED")
                else -> true
            }
        }.sortedByDescending { it.updatedAt ?: it.scheduledStartAt.orEmpty() }
    }

    DoctorScaffold(nav, "consultations", "Tư vấn trực tuyến") { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    ConsultationOverview(
                        waiting = state.items.count { it.status in listOf("SCHEDULED", "WAITING") },
                        active = state.items.count { it.status in listOf("ACCEPTED", "ACTIVE") },
                        unread = state.items.sumOf { it.unreadCount }
                    )
                }
                item {
                    Row(
                        Modifier.fillMaxWidth().horizontalScroll(androidx.compose.foundation.rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("ALL" to "Tất cả", "PENDING" to "Chờ tiếp nhận", "ACTIVE" to "Đang xử lý", "DONE" to "Đã kết thúc").forEach { (key, label) ->
                            FilterChip(selected = filter == key, onClick = { filter = key }, label = { Text(label) })
                        }
                    }
                }
                if (state.error != null) item {
                    ErrorPanel(state.error.orEmpty(), viewModel::loadConsultations)
                }
                if (!state.loading && state.error == null && visible.isEmpty()) item {
                    EmptyConsultations(filter)
                }
                items(visible, key = { it.id }) { consultation ->
                    DoctorConsultationCard(consultation) { nav.navigate("consultation/${consultation.id}") }
                }
            }
            if (state.loading && state.items.isEmpty()) CircularProgressIndicator(Modifier.align(Alignment.Center), color = ConsultGreen)
            FloatingActionButton(
                onClick = viewModel::loadConsultations,
                containerColor = ConsultGreen,
                contentColor = Color.White,
                modifier = Modifier.align(Alignment.BottomEnd).padding(18.dp)
            ) { Icon(Icons.Outlined.Refresh, "Làm mới") }
        }
    }
}

@Composable
private fun ConsultationOverview(waiting: Int, active: Int, unread: Int) {
    Card(colors = CardDefaults.cardColors(containerColor = ConsultGreen), shape = RoundedCornerShape(22.dp)) {
        Column(Modifier.fillMaxWidth().padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.HealthAndSafety, null, tint = Color.White, modifier = Modifier.size(30.dp))
                Spacer(Modifier.width(10.dp))
                Column {
                    Text("Phòng tư vấn của bác sĩ", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                    Text("Chỉ hiển thị bệnh nhân được phân công", color = Color(0xFFD1FAE5), fontSize = 11.sp)
                }
            }
            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OverviewMetric("Chờ nhận", waiting, Modifier.weight(1f))
                OverviewMetric("Đang xử lý", active, Modifier.weight(1f))
                OverviewMetric("Chưa đọc", unread, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun OverviewMetric(label: String, value: Int, modifier: Modifier) {
    Surface(modifier, color = Color.White.copy(alpha = .13f), shape = RoundedCornerShape(12.dp)) {
        Column(Modifier.padding(vertical = 10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value.toString(), color = Color.White, fontWeight = FontWeight.Black, fontSize = 19.sp)
            Text(label, color = Color(0xFFD1FAE5), fontSize = 10.sp)
        }
    }
}

@Composable
private fun DoctorConsultationCard(item: Consultation, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(1.dp, if (item.unreadCount > 0) ConsultGreen.copy(alpha = .45f) else ConsultBorder)
    ) {
        Column(Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(48.dp).clip(CircleShape).background(ConsultGreenLight), contentAlignment = Alignment.Center) {
                    Text(initials(item.patientProfile.fullName), color = ConsultGreen, fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f)) {
                    Text(item.patientProfile.fullName, fontWeight = FontWeight.Black, color = ConsultText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(item.doctorWorkplace.specialty.name, color = ConsultGreen, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    item.appointment?.bookingCode?.let { Text("Mã lịch: $it", color = ConsultMuted, fontSize = 10.sp) }
                }
                Column(horizontalAlignment = Alignment.End) {
                    ConsultationStatus(item.status)
                    if (item.unreadCount > 0) Badge(containerColor = ConsultDanger, modifier = Modifier.padding(top = 6.dp)) {
                        Text(item.unreadCount.toString(), color = Color.White)
                    }
                }
            }
            HorizontalDivider(color = ConsultBorder)
            Text(item.topic.ifBlank { "Tư vấn sức khỏe trực tuyến" }, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = ConsultText)
            if (item.description.isNotBlank()) Text(item.description, color = ConsultMuted, fontSize = 11.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(if (item.videoEnabled) Icons.Outlined.Videocam else Icons.Outlined.ChatBubbleOutline, null, tint = ConsultMuted, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(if (item.videoEnabled) "Chat và video" else "Tư vấn qua tin nhắn", color = ConsultMuted, fontSize = 10.sp)
                Spacer(Modifier.weight(1f))
                Text(formatConsultationTime(item.scheduledStartAt ?: item.updatedAt), color = ConsultMuted, fontSize = 10.sp)
                Icon(Icons.Default.ChevronRight, null, tint = ConsultMuted, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun ConsultationStatus(status: String) {
    val (label, background, foreground) = when (status) {
        "SCHEDULED" -> Triple("Đã đặt lịch", Color(0xFFEFF6FF), Color(0xFF1D4ED8))
        "WAITING" -> Triple("Chờ tiếp nhận", Color(0xFFFFF7E6), Color(0xFFB54708))
        "ACCEPTED" -> Triple("Đã tiếp nhận", ConsultGreenLight, ConsultGreen)
        "ACTIVE" -> Triple("Đang tư vấn", Color(0xFFDCFCE7), Color(0xFF15803D))
        "COMPLETED" -> Triple("Hoàn thành", Color(0xFFF1F5F9), Color(0xFF475569))
        "CANCELLED" -> Triple("Đã hủy", Color(0xFFFFE8E8), ConsultDanger)
        "EXPIRED" -> Triple("Hết hạn", Color(0xFFFFE8E8), ConsultDanger)
        else -> Triple(status, Color(0xFFF1F5F9), ConsultMuted)
    }
    Surface(color = background, shape = RoundedCornerShape(20.dp)) {
        Text(label, color = foreground, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorConsultationChatScreen(
    id: String,
    nav: NavHostController,
    viewModel: DoctorConsultationViewModel
) {
    val state by viewModel.chat.collectAsState()
    val consultation = state.consultation
    var draft by rememberSaveable(id) { mutableStateOf("") }
    var confirmComplete by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            runCatching {
                val resolver = context.contentResolver
                val mime = resolver.getType(uri) ?: "application/octet-stream"
                var name = "tai-lieu"
                resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) name = cursor.getString(0) ?: name
                }
                val bytes = resolver.openInputStream(uri)?.use { it.readBytes() } ?: byteArrayOf()
                viewModel.sendAttachment(name, mime, bytes)
            }.onFailure { viewModel.reportError("Không thể đọc tệp đã chọn") }
        }
    }

    LaunchedEffect(id) { viewModel.open(id) }
    DisposableEffect(id) { onDispose { viewModel.leave() } }
    BackHandler { viewModel.leave(); nav.popBackStack() }
    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) listState.animateScrollToItem(state.messages.lastIndex)
    }

    Scaffold(
        containerColor = ConsultBackground,
        topBar = {
            TopAppBar(
                navigationIcon = { IconButton(onClick = { viewModel.leave(); nav.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Quay lại") } },
                title = {
                    Column {
                        Text(consultation?.patientProfile?.fullName ?: "Phiên tư vấn", fontWeight = FontWeight.Black, fontSize = 16.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(consultation?.doctorWorkplace?.specialty?.name ?: connectionLabel(state.connection), color = ConsultMuted, fontSize = 10.sp)
                    }
                },
                actions = {
                    if (consultation?.videoEnabled == true && consultation.status in listOf("ACCEPTED", "ACTIVE")) {
                        IconButton(onClick = { nav.navigate("consultation-video/$id") }) { Icon(Icons.Outlined.Videocam, "Tham gia video", tint = ConsultGreen) }
                    }
                    IconButton(onClick = viewModel::refresh) { Icon(Icons.Outlined.Refresh, "Làm mới") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            if (consultation != null) ConsultationBottomArea(
                consultation = consultation,
                state = state,
                draft = draft,
                onDraft = { draft = it; viewModel.setTyping(it.isNotBlank()) },
                onSend = { if (draft.isNotBlank()) { viewModel.sendText(draft); draft = "" } },
                onAttach = { picker.launch(arrayOf("image/*", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) },
                onTransition = { action -> if (action == "complete") confirmComplete = true else viewModel.transition(action) },
                onVideo = { nav.navigate("consultation-video/$id") }
            )
        },
        snackbarHost = {
            if (state.error != null) Snackbar(
                action = { TextButton(onClick = viewModel::clearError) { Text("Đóng", color = Color.White) } },
                containerColor = ConsultDanger,
                modifier = Modifier.padding(12.dp)
            ) { Text(state.error.orEmpty(), color = Color.White) }
        }
    ) { padding ->
        when {
            state.loading -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = ConsultGreen) }
            consultation == null -> Box(Modifier.fillMaxSize().padding(padding).padding(20.dp)) { ErrorPanel(state.error ?: "Không thể tải phiên tư vấn") { viewModel.open(id) } }
            else -> LazyColumn(
                state = listState,
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item { ConsultationInfoCard(consultation, state.connection) }
                if (state.messages.isEmpty()) item { EmptyMessageCard() }
                items(state.messages, key = { "${it.id}-${it.localDeliveryStatus}" }) { message ->
                    MessageBubble(
                        message = message,
                        consultationId = consultation.id,
                        isDoctor = message.senderType == "DOCTOR",
                        onRetry = { viewModel.retry(message) }
                    )
                }
                if (state.patientTyping) item { TypingBubble() }
            }
        }
    }

    if (confirmComplete) AlertDialog(
        onDismissRequest = { confirmComplete = false },
        icon = { Icon(Icons.Outlined.CheckCircle, null, tint = ConsultDanger) },
        title = { Text("Kết thúc phiên tư vấn?", fontWeight = FontWeight.Black) },
        text = { Text("Sau khi kết thúc, bác sĩ và bệnh nhân chỉ có thể xem lại nội dung và không thể gửi thêm tin nhắn.") },
        confirmButton = { TextButton(onClick = { confirmComplete = false; viewModel.transition("complete") }) { Text("Kết thúc ngay", color = ConsultDanger, fontWeight = FontWeight.Bold) } },
        dismissButton = { TextButton(onClick = { confirmComplete = false }) { Text("Tiếp tục tư vấn") } }
    )
}

@Composable
private fun ConsultationInfoCard(item: Consultation, connection: String) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, ConsultBorder), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                ConsultationStatus(item.status)
                Spacer(Modifier.width(8.dp))
                Surface(color = if (connection == "CONNECTED") Color(0xFFDCFCE7) else Color(0xFFF1F5F9), shape = RoundedCornerShape(20.dp)) {
                    Row(Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(6.dp).background(if (connection == "CONNECTED") Color(0xFF22C55E) else ConsultMuted, CircleShape))
                        Spacer(Modifier.width(5.dp)); Text(connectionLabel(connection), fontSize = 9.sp, color = ConsultMuted)
                    }
                }
            }
            Text(item.topic.ifBlank { "Tư vấn sức khỏe trực tuyến" }, fontWeight = FontWeight.Black, color = ConsultText)
            if (item.description.isNotBlank()) Text(item.description, color = ConsultMuted, fontSize = 11.sp)
            Row {
                item.appointment?.bookingCode?.let { Text("Mã lịch: $it", color = ConsultMuted, fontSize = 10.sp) }
                Spacer(Modifier.weight(1f))
                Text(formatConsultationTime(item.scheduledStartAt), color = ConsultMuted, fontSize = 10.sp)
            }
        }
    }
}

@Composable
private fun ConsultationBottomArea(
    consultation: Consultation,
    state: DoctorChatState,
    draft: String,
    onDraft: (String) -> Unit,
    onSend: () -> Unit,
    onAttach: () -> Unit,
    onTransition: (String) -> Unit,
    onVideo: () -> Unit
) {
    Surface(color = Color.White, shadowElevation = 10.dp) {
        Column(Modifier.navigationBarsPadding().imePadding().padding(horizontal = 12.dp, vertical = 8.dp)) {
            val action = when (consultation.status) {
                "SCHEDULED", "WAITING" -> "accept" to "Nhận phiên tư vấn"
                "ACCEPTED" -> "start" to "Bắt đầu tư vấn"
                "ACTIVE" -> "complete" to "Kết thúc tư vấn"
                else -> null
            }
            action?.let { (key, label) ->
                Button(
                    onClick = { onTransition(key) },
                    enabled = !state.updatingStatus,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = if (key == "complete") ConsultDanger else ConsultGreen),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (state.updatingStatus) CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    else Icon(if (key == "complete") Icons.Outlined.StopCircle else Icons.Outlined.PlayCircle, null)
                    Spacer(Modifier.width(8.dp)); Text(if (state.updatingStatus) "Đang cập nhật..." else label, fontWeight = FontWeight.Bold)
                }
            }
            if (consultation.videoEnabled && consultation.status in listOf("ACCEPTED", "ACTIVE")) {
                OutlinedButton(onClick = onVideo, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                    Icon(Icons.Outlined.Videocam, null); Spacer(Modifier.width(8.dp)); Text("Tham gia phòng video")
                }
            }
            val enabled = consultation.status in listOf("ACCEPTED", "ACTIVE") && chatIsOpen(consultation)
            if (!enabled) Text(
                when (consultation.status) {
                    "SCHEDULED", "WAITING" -> "Tiếp nhận phiên để mở trao đổi với bệnh nhân."
                    "COMPLETED" -> "Phiên đã kết thúc. Nội dung được lưu để đối chiếu."
                    else -> "Không thể gửi thêm nội dung trong trạng thái hiện tại."
                },
                color = ConsultMuted, fontSize = 10.sp, modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp), textAlign = TextAlign.Center
            )
            Row(verticalAlignment = Alignment.Bottom) {
                IconButton(onClick = onAttach, enabled = enabled && !state.sendingAttachment) {
                    if (state.sendingAttachment) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = ConsultGreen)
                    else Icon(Icons.Outlined.AttachFile, "Gửi tài liệu", tint = if (enabled) ConsultGreen else ConsultMuted)
                }
                OutlinedTextField(
                    value = draft,
                    onValueChange = onDraft,
                    enabled = enabled,
                    placeholder = { Text("Nhập hướng dẫn cho bệnh nhân...", fontSize = 12.sp) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(18.dp),
                    maxLines = 4,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = { onSend() })
                )
                IconButton(onClick = onSend, enabled = enabled && draft.isNotBlank()) {
                    Icon(Icons.AutoMirrored.Filled.Send, "Gửi tin nhắn", tint = if (enabled && draft.isNotBlank()) ConsultGreen else ConsultMuted)
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(message: ConsultationMessage, consultationId: String, isDoctor: Boolean, onRetry: () -> Unit) {
    val context = LocalContext.current
    val imageLoader = remember {
        ImageLoader.Builder(context).okHttpClient {
            OkHttpClient.Builder().addInterceptor { chain ->
                val request = chain.request().newBuilder()
                DoctorApiClient.session().accessToken()?.let { request.header("Authorization", "Bearer $it") }
                chain.proceed(request.build())
            }.build()
        }.build()
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (isDoctor) Arrangement.End else Arrangement.Start) {
        Column(horizontalAlignment = if (isDoctor) Alignment.End else Alignment.Start, modifier = Modifier.widthIn(max = 310.dp)) {
            Surface(
                color = if (isDoctor) ConsultGreen else Color.White,
                shape = RoundedCornerShape(
                    topStart = 16.dp, topEnd = 16.dp,
                    bottomStart = if (isDoctor) 16.dp else 4.dp,
                    bottomEnd = if (isDoctor) 4.dp else 16.dp
                ),
                border = if (isDoctor) null else BorderStroke(1.dp, ConsultBorder)
            ) {
                Column(Modifier.padding(11.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    message.text?.takeIf(String::isNotBlank)?.let { Text(it, color = if (isDoctor) Color.White else ConsultText, fontSize = 13.sp) }
                    message.attachments.forEach { attachment ->
                        val url = DoctorApiClient.attachmentUrl(consultationId, attachment.id)
                        if (attachment.mimeType.startsWith("image/")) {
                            AsyncImage(
                                model = url,
                                imageLoader = imageLoader,
                                contentDescription = attachment.fileName,
                                modifier = Modifier.fillMaxWidth().heightIn(min = 120.dp, max = 260.dp).clip(RoundedCornerShape(10.dp))
                            )
                        } else {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.Description, null, tint = if (isDoctor) Color.White else ConsultGreen)
                                Spacer(Modifier.width(7.dp))
                                Column {
                                    Text(attachment.fileName, color = if (isDoctor) Color.White else ConsultText, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 2)
                                    Text(fileSizeLabel(attachment.sizeBytes), color = if (isDoctor) Color.White.copy(.75f) else ConsultMuted, fontSize = 9.sp)
                                }
                            }
                        }
                    }
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(formatMessageTime(message.sentAt), color = ConsultMuted, fontSize = 9.sp)
                if (isDoctor) {
                    Spacer(Modifier.width(4.dp))
                    Text(when {
                        message.localDeliveryStatus == "SENDING" -> "Đang gửi"
                        message.localDeliveryStatus == "FAILED" -> "Gửi thất bại"
                        message.readAt != null -> "Đã đọc"
                        else -> "Đã gửi"
                    }, color = if (message.localDeliveryStatus == "FAILED") ConsultDanger else ConsultMuted, fontSize = 9.sp)
                }
            }
            if (message.localDeliveryStatus == "FAILED") TextButton(onClick = onRetry, contentPadding = PaddingValues(0.dp)) { Text("Gửi lại", color = ConsultDanger, fontSize = 10.sp) }
        }
    }
}

@Composable
private fun TypingBubble() {
    Surface(color = Color.White, shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, ConsultBorder)) {
        Text("Bệnh nhân đang nhập...", color = ConsultMuted, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp))
    }
}

@Composable
private fun EmptyMessageCard() {
    Column(Modifier.fillMaxWidth().padding(vertical = 28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Outlined.Forum, null, tint = ConsultGreen, modifier = Modifier.size(40.dp))
        Text("Chưa có nội dung trao đổi", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 10.dp))
        Text("Hãy tiếp nhận và bắt đầu phiên để tư vấn cho bệnh nhân.", color = ConsultMuted, fontSize = 11.sp, textAlign = TextAlign.Center)
    }
}

@Composable
private fun EmptyConsultations(filter: String) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, ConsultBorder), shape = RoundedCornerShape(18.dp)) {
        Column(Modifier.fillMaxWidth().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Outlined.Forum, null, tint = ConsultGreen, modifier = Modifier.size(44.dp))
            Text(if (filter == "ALL") "Chưa có phiên tư vấn" else "Không có phiên phù hợp", fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 10.dp))
            Text("Các phiên được phân công sẽ xuất hiện tại đây.", color = ConsultMuted, fontSize = 11.sp)
        }
    }
}

@Composable
private fun ErrorPanel(message: String, retry: () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF1F1)), border = BorderStroke(1.dp, ConsultDanger.copy(.25f))) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Text(message, color = ConsultDanger, fontSize = 12.sp)
            TextButton(onClick = retry) { Icon(Icons.Outlined.Refresh, null); Spacer(Modifier.width(5.dp)); Text("Thử lại") }
        }
    }
}

@Composable
fun DoctorConsultationVideoScreen(id: String, nav: NavHostController, viewModel: DoctorVideoViewModel) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    var requested by remember { mutableStateOf(false) }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        if (result[Manifest.permission.CAMERA] == true && result[Manifest.permission.RECORD_AUDIO] == true) viewModel.join(id)
        else viewModel.permissionDenied()
    }
    LaunchedEffect(id) {
        if (!requested) {
            requested = true
            val camera = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
            val microphone = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
            if (camera && microphone) viewModel.join(id)
            else permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO))
        }
    }
    DisposableEffect(id) { onDispose { viewModel.leave() } }
    BackHandler { viewModel.leave(); nav.popBackStack() }

    Box(Modifier.fillMaxSize().background(Color(0xFF07110D))) {
        val remote = state.remoteVideo
        if (remote != null) LiveVideoTrack(viewModel.room, remote, Modifier.fillMaxSize())
        else RemotePatientPlaceholder(state, Modifier.fillMaxSize())

        Column(Modifier.align(Alignment.TopStart).statusBarsPadding().padding(14.dp)) {
            IconButton(onClick = { viewModel.leave(); nav.popBackStack() }, modifier = Modifier.background(Color.Black.copy(.35f), CircleShape)) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Quay lại", tint = Color.White)
            }
            Text(state.consultation?.patientProfile?.fullName ?: "Bệnh nhân", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
            Text(if (state.connected) "Đang kết nối an toàn" else if (state.connecting) "Đang vào phòng..." else "Chưa kết nối", color = Color.White.copy(.7f), fontSize = 11.sp)
        }

        LocalDoctorVideo(viewModel.room, state, Modifier.align(Alignment.TopEnd).statusBarsPadding().padding(top = 72.dp, end = 14.dp))

        if (state.connecting) CircularProgressIndicator(Modifier.align(Alignment.Center), color = Color.White)

        Row(
            Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(Color.Black.copy(.72f)).navigationBarsPadding().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            VideoControl(if (state.microphone) Icons.Default.Mic else Icons.Default.MicOff, if (state.microphone) "Micro" else "Đã tắt", viewModel::toggleMicrophone)
            VideoControl(if (state.camera) Icons.Default.Videocam else Icons.Default.VideocamOff, if (state.camera) "Camera" else "Đã tắt", viewModel::toggleCamera)
            VideoControl(Icons.Default.Cameraswitch, "Đổi camera", viewModel::switchCamera)
            VideoControl(if (state.speaker) Icons.Default.VolumeUp else Icons.Default.Hearing, if (state.speaker) "Loa ngoài" else "Loa thoại", viewModel::toggleSpeaker)
            VideoControl(Icons.Default.CallEnd, "Kết thúc", { viewModel.leave(); nav.popBackStack() }, danger = true)
        }

        state.error?.let { error ->
            AlertDialog(
                onDismissRequest = viewModel::dismissError,
                title = { Text("Không thể thực hiện") },
                text = { Text(error) },
                confirmButton = { TextButton(onClick = viewModel::dismissError) { Text("Đóng") } }
            )
        }
    }
}

@Composable
private fun RemotePatientPlaceholder(state: DoctorVideoState, modifier: Modifier) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Box(Modifier.size(112.dp).background(Color(0xFF17352A), CircleShape), contentAlignment = Alignment.Center) {
            Text(initials(state.consultation?.patientProfile?.fullName ?: "BN"), color = Color(0xFF6EE7B7), fontSize = 32.sp, fontWeight = FontWeight.Black)
        }
        Text(state.consultation?.patientProfile?.fullName ?: "Bệnh nhân", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp, modifier = Modifier.padding(top = 16.dp))
        Text(if (state.remotePresent) "Camera bệnh nhân đang tắt" else "Đang chờ bệnh nhân tham gia...", color = Color.White.copy(.65f), fontSize = 12.sp)
    }
}

@Composable
private fun LocalDoctorVideo(room: Room, state: DoctorVideoState, modifier: Modifier) {
    Surface(modifier.size(width = 108.dp, height = 148.dp), shape = RoundedCornerShape(16.dp), color = Color(0xFF16231E), border = BorderStroke(1.dp, ConsultGreen)) {
        Box {
            if (state.camera && state.localVideo != null) LiveVideoTrack(room, state.localVideo, Modifier.fillMaxSize())
            else Icon(Icons.Default.VideocamOff, null, tint = Color.White.copy(.65f), modifier = Modifier.align(Alignment.Center).size(30.dp))
            Text("Bác sĩ", color = Color.White, fontSize = 9.sp, modifier = Modifier.align(Alignment.TopStart).background(Color.Black.copy(.55f), RoundedCornerShape(bottomEnd = 6.dp)).padding(horizontal = 6.dp, vertical = 3.dp))
        }
    }
}

@Composable
private fun LiveVideoTrack(room: Room, track: VideoTrack, modifier: Modifier) {
    key(track) {
        AndroidView(
            modifier = modifier,
            factory = { context -> TextureViewRenderer(context).also { room.initVideoRenderer(it); track.addRenderer(it) } },
            onRelease = { track.removeRenderer(it); it.release() }
        )
    }
}

@Composable
private fun VideoControl(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit, danger: Boolean = false) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(62.dp).clickable(onClick = onClick)) {
        Box(Modifier.size(48.dp).background(if (danger) Color(0xFFDC2626) else Color.White.copy(.16f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, label, tint = Color.White)
        }
        Text(label, color = Color.White.copy(.75f), fontSize = 9.sp, maxLines = 1, modifier = Modifier.padding(top = 4.dp))
    }
}

private fun initials(name: String): String = name.trim().split(Regex("\\s+")).filter(String::isNotBlank).takeLast(2).mapNotNull { it.firstOrNull()?.uppercase() }.joinToString("").ifBlank { "BN" }
private fun chatIsOpen(item: Consultation): Boolean = item.chatOpenAt?.let { runCatching { !Instant.now().isBefore(Instant.parse(it)) }.getOrDefault(true) } ?: true
private fun connectionLabel(value: String): String = when (value) { "CONNECTED" -> "Trực tuyến"; "CONNECTING" -> "Đang kết nối"; "RECONNECTING" -> "Đang kết nối lại"; else -> "Ngoại tuyến" }
private fun formatConsultationTime(value: String?): String = runCatching { Instant.parse(value).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(DateTimeFormatter.ofPattern("HH:mm · dd/MM/yyyy")) }.getOrDefault(value.orEmpty())
private fun formatMessageTime(value: String): String = runCatching { Instant.parse(value).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(DateTimeFormatter.ofPattern("HH:mm")) }.getOrDefault("")
private fun fileSizeLabel(bytes: Int): String = if (bytes >= 1024 * 1024) "%.1f MB".format(bytes / 1024f / 1024f) else "%.0f KB".format(bytes / 1024f)
