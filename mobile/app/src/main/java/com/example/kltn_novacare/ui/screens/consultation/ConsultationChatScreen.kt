package com.example.kltn_novacare.ui.screens.consultation

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.navigation.NavController
import coil.ImageLoader
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.Consultation
import com.example.kltn_novacare.data.model.ConsultationAttachment
import com.example.kltn_novacare.data.model.ConsultationMessage
import com.example.kltn_novacare.data.remote.ApiClient
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.ConsultationViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConsultationChatScreen(consultationId: String, navController: NavController, viewModel: ConsultationViewModel) {
    val state by viewModel.chat.collectAsState()
    val consultation = state.consultation
    LaunchedEffect(consultationId) { viewModel.openConversation(consultationId) }
    DisposableEffect(consultationId) { onDispose { viewModel.leaveConversation() } }

    var confirmComplete by remember { mutableStateOf(false) }
    var showDoctorSheet by remember { mutableStateOf(false) }
    var previewImageUrl by remember { mutableStateOf<String?>(null) }
    var previewImageName by remember { mutableStateOf<String?>(null) }
    var draftText by rememberSaveable(consultationId) { mutableStateOf("") }

    Scaffold(
        containerColor = Background,
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        if (consultation == null) {
                            Text("Chat với bác sĩ", fontWeight = FontWeight.Bold)
                        } else {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable { showDoctorSheet = true }
                                    .padding(vertical = 4.dp, horizontal = 4.dp)
                            ) {
                                AsyncImage(
                                    model = consultation.doctor.avatarUrl,
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(PrimaryLight)
                                )
                                Spacer(Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = if (viewModel.isAssignedDoctor(consultation)) consultation.patientProfile.fullName
                                        else listOfNotNull(consultation.doctor.title, consultation.doctor.fullName).joinToString(" "),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = consultation.doctorWorkplace.specialty.name,
                                        color = TextSecondary,
                                        fontSize = 11.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                        }
                    },
                    actions = {
                        if (consultation != null) {
                            IconButton(onClick = { showDoctorSheet = true }) {
                                Icon(Icons.Outlined.Info, contentDescription = "Thông tin phiên", tint = PrimaryDark)
                            }
                        }
                        IconButton(onClick = viewModel::refreshConversation) {
                            Icon(Icons.Outlined.Refresh, contentDescription = "Làm mới tin nhắn")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                )

                if (consultation?.status == "ACTIVE") {
                    ActiveSessionTimerBar(startedAt = consultation.startedAt)
                }
            }
        },
        bottomBar = {
            if (consultation != null) {
                Column {
                    if (viewModel.isAssignedDoctor(consultation)) {
                        val action = when (consultation.status) {
                            "SCHEDULED", "WAITING" -> "accept" to "Nhận phiên tư vấn"
                            "ACCEPTED" -> "start" to "Bắt đầu tư vấn"
                            "ACTIVE" -> "complete" to "Kết thúc tư vấn"
                            else -> null
                        }
                        action?.let { (value, label) ->
                            Button(
                                onClick = {
                                    if (value == "complete") confirmComplete = true
                                    else viewModel.transitionSession(value)
                                },
                                enabled = !state.isUpdatingSession,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 6.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (value == "complete") StatusErrorText else Primary
                                ),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(if (state.isUpdatingSession) "Đang cập nhật…" else label, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    AnimatedVisibility(
                        visible = state.isOtherTyping,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        val otherName = if (viewModel.isAssignedDoctor(consultation)) "Bệnh nhân" else "Bác sĩ"
                        TypingIndicatorBubble(text = "$otherName đang nhập tin nhắn...")
                    }

                    ConsultationComposer(
                        consultation = consultation,
                        viewModel = viewModel,
                        draft = draftText,
                        onDraftChange = { draftText = it }
                    )
                }
            }
        }
    ) { padding ->
        when {
            state.isInitialLoading -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Primary)
            }
            state.error != null && consultation == null -> Box(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                InlineConsultationError(state.error.orEmpty()) { viewModel.openConversation(consultationId) }
            }
            consultation != null -> ConsultationMessages(
                consultation = consultation,
                messages = state.messages,
                hasMore = state.hasMore,
                loadingOlder = state.isLoadingOlder,
                error = state.error,
                connectionState = state.connectionState,
                onLoadOlder = viewModel::loadOlder,
                onRetry = viewModel::retry,
                onReadVisible = viewModel::markVisibleMessageRead,
                onImageClick = { url, name ->
                    previewImageUrl = url
                    previewImageName = name
                },
                onSuggestionClick = { suggestion ->
                    draftText = suggestion
                },
                currentUserId = viewModel.currentUserId,
                isDoctor = viewModel.isAssignedDoctor(consultation),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            )
        }
    }

    if (confirmComplete) {
        AlertDialog(
            onDismissRequest = { confirmComplete = false },
            title = { Text("Kết thúc phiên tư vấn?", fontWeight = FontWeight.Bold) },
            text = { Text("Sau khi kết thúc, hai bên có thể xem lại toàn bộ nội dung nhưng không thể gửi thêm tin nhắn.") },
            confirmButton = {
                TextButton(onClick = {
                    confirmComplete = false
                    viewModel.transitionSession("complete")
                }) {
                    Text("Kết thúc ngay", color = StatusErrorText, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmComplete = false }) {
                    Text("Tiếp tục tư vấn")
                }
            }
        )
    }

    if (showDoctorSheet && consultation != null) {
        DoctorInfoBottomSheet(
            consultation = consultation,
            onDismiss = { showDoctorSheet = false }
        )
    }

    if (previewImageUrl != null) {
        FullscreenImageViewer(
            imageUrl = previewImageUrl.orEmpty(),
            title = previewImageName,
            onDismiss = { previewImageUrl = null; previewImageName = null }
        )
    }
}

@Composable
private fun ConsultationMessages(
    consultation: Consultation,
    messages: List<ConsultationMessage>,
    hasMore: Boolean,
    loadingOlder: Boolean,
    error: String?,
    connectionState: String,
    onLoadOlder: () -> Unit,
    onRetry: (ConsultationMessage) -> Unit,
    onReadVisible: (String) -> Unit,
    onImageClick: (url: String, fileName: String) -> Unit,
    onSuggestionClick: (String) -> Unit,
    currentUserId: String,
    isDoctor: Boolean,
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    val visibleIncomingId by remember(messages, currentUserId) {
        derivedStateOf {
            val visibleKeys = listState.layoutInfo.visibleItemsInfo.map { it.key }.toSet()
            messages.lastOrNull { it.id in visibleKeys && it.senderUserId != currentUserId && it.readAt == null }?.id
        }
    }
    LaunchedEffect(visibleIncomingId) { visibleIncomingId?.let(onReadVisible) }

    val isNearBottom by remember {
        derivedStateOf {
            val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val total = listState.layoutInfo.totalItemsCount
            total == 0 || lastVisible >= total - 3
        }
    }

    var unreadSinceScrollUp by remember { mutableIntStateOf(0) }
    LaunchedEffect(isNearBottom) {
        if (isNearBottom) unreadSinceScrollUp = 0
    }
    val latestMessageId = messages.lastOrNull()?.id
    LaunchedEffect(latestMessageId) {
        if (!isNearBottom && latestMessageId != null) {
            unreadSinceScrollUp++
        }
    }

    var firstLayout by remember { mutableStateOf(true) }
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty() && (firstLayout || isNearBottom)) {
            val target = (messages.lastIndex + 3).coerceAtLeast(0)
            listState.scrollToItem(target)
            firstLayout = false
        }
    }

    Box(modifier = modifier) {
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            item { ConsultationInfoBanner(consultation) }
            item { EmergencyBanner() }
            item {
                if (connectionState != "CONNECTED") {
                    Surface(color = StatusInfoBg, shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()) {
                        Text(
                            if (connectionState == "RECONNECTING") "Mất kết nối. NovaCare đang kết nối lại…"
                            else "Đang kết nối kênh tư vấn bảo mật…",
                            color = StatusInfoText, fontSize = 11.sp, modifier = Modifier.padding(10.dp)
                        )
                    }
                }
            }
            if (hasMore) item {
                TextButton(onClick = onLoadOlder, enabled = !loadingOlder, modifier = Modifier.fillMaxWidth()) {
                    if (loadingOlder) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                    else Text("Tải tin nhắn cũ hơn")
                }
            }
            if (error != null) item { InlineConsultationError(error) {} }

            if (messages.isEmpty()) {
                item {
                    EmptyConsultationChatState(
                        isDoctor = isDoctor,
                        onSuggestionClick = onSuggestionClick
                    )
                }
            } else {
                itemsIndexed(messages, key = { _, item -> item.id }) { index, message ->
                    val date = messageDate(message.sentAt)
                    val previousDate = messages.getOrNull(index - 1)?.let { messageDate(it.sentAt) }
                    if (index == 0 || date != previousDate) DateDivider(date)

                    val prev = messages.getOrNull(index - 1)
                    val next = messages.getOrNull(index + 1)
                    val isSameSenderAsPrev = prev != null && prev.senderUserId == message.senderUserId && isWithinTwoMinutes(prev.sentAt, message.sentAt)
                    val isSameSenderAsNext = next != null && next.senderUserId == message.senderUserId && isWithinTwoMinutes(message.sentAt, next.sentAt)

                    MessageBubble(
                        message = message,
                        currentUserId = currentUserId,
                        isSameSenderAsPrev = isSameSenderAsPrev,
                        isSameSenderAsNext = isSameSenderAsNext,
                        onRetry = onRetry,
                        onImageClick = onImageClick
                    )
                }
            }
        }

        AnimatedVisibility(
            visible = !isNearBottom,
            enter = fadeIn() + scaleIn(),
            exit = fadeOut() + scaleOut(),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 12.dp)
        ) {
            SmallFloatingActionButton(
                onClick = {
                    coroutineScope.launch {
                        val total = listState.layoutInfo.totalItemsCount
                        if (total > 0) listState.animateScrollToItem(total - 1)
                    }
                },
                containerColor = Color.White,
                contentColor = PrimaryDark,
                shape = CircleShape,
                elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 4.dp)
            ) {
                BadgedBox(
                    badge = {
                        if (unreadSinceScrollUp > 0) {
                            Badge(containerColor = Primary) {
                                Text(if (unreadSinceScrollUp > 9) "9+" else unreadSinceScrollUp.toString())
                            }
                        }
                    }
                ) {
                    Icon(Icons.Outlined.KeyboardArrowDown, contentDescription = "Cuộn xuống cuối")
                }
            }
        }
    }
}

@Composable
private fun ConsultationInfoBanner(item: Consultation) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PrimaryLight),
        border = BorderStroke(1.dp, PrimaryBorder),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Phiên tư vấn ${item.doctorWorkplace.specialty.name}", fontWeight = FontWeight.Bold, color = TextPrimary)
                ConsultationStatusBadge(item.status)
            }
            Text(item.patientProfile.fullName, color = TextSecondary, fontSize = 13.sp)
            Text(formatConsultationTime(item.scheduledStartAt), color = TextSecondary, fontSize = 13.sp)
            Text(item.topic, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(top = 5.dp))
            if (item.description.isNotBlank()) {
                Text(item.description, color = TextSecondary, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

@Composable
private fun EmergencyBanner() {
    Surface(color = Color.White, shape = RoundedCornerShape(12.dp), border = BorderStroke(1.dp, Border)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
            Icon(Icons.Outlined.Info, contentDescription = null, tint = PrimaryDark, modifier = Modifier.size(19.dp))
            Spacer(Modifier.width(8.dp))
            Text("Tư vấn từ xa không thay thế cấp cứu y tế. Nếu có khó thở nặng, mất ý thức hoặc đau ngực dữ dội, hãy gọi 115 hoặc đến cơ sở y tế gần nhất.",
                color = TextSecondary, fontSize = 12.sp, lineHeight = 17.sp)
        }
    }
}

@Composable
private fun MessageBubble(
    message: ConsultationMessage,
    currentUserId: String,
    isSameSenderAsPrev: Boolean,
    isSameSenderAsNext: Boolean,
    onRetry: (ConsultationMessage) -> Unit,
    onImageClick: (url: String, fileName: String) -> Unit
) {
    if (message.senderType == "SYSTEM") {
        Text(
            text = message.text.orEmpty(),
            color = TextSecondary,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
        )
        return
    }

    val mine = message.senderUserId == currentUserId
    val bubbleShape = RoundedCornerShape(
        topStart = if (!mine && isSameSenderAsPrev) 6.dp else 18.dp,
        topEnd = if (mine && isSameSenderAsPrev) 6.dp else 18.dp,
        bottomStart = if (mine) 18.dp else if (isSameSenderAsNext) 6.dp else 4.dp,
        bottomEnd = if (!mine) 18.dp else if (isSameSenderAsNext) 6.dp else 4.dp
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = if (isSameSenderAsPrev) 2.dp else 6.dp),
        horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start
    ) {
        Column(
            horizontalAlignment = if (mine) Alignment.End else Alignment.Start,
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Surface(
                color = if (mine) Primary else Color.White,
                shape = bubbleShape,
                border = if (mine) null else BorderStroke(1.dp, Border),
                shadowElevation = 0.5.dp
            ) {
                Column(Modifier.padding(horizontal = 10.dp, vertical = 8.dp)) {
                    message.attachments.forEach { attachment ->
                        AttachmentContent(
                            consultationId = message.consultationId,
                            attachment = attachment,
                            onImageClick = onImageClick
                        )
                    }
                    if (!message.text.isNullOrBlank()) {
                        Text(
                            text = message.text,
                            color = if (mine) Color.White else TextPrimary,
                            fontSize = 14.sp,
                            lineHeight = 20.sp,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                    if (message.localDeliveryStatus == "SENDING" && message.attachments.isNotEmpty()) {
                        LinearProgressIndicator(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp),
                            color = if (mine) Color.White else Primary
                        )
                    }
                }
            }

            if (!isSameSenderAsNext || message.localDeliveryStatus == "FAILED") {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 2.dp, start = 4.dp, end = 4.dp)
                ) {
                    Text(formatMessageClock(message.sentAt), color = TextMuted, fontSize = 10.sp)
                    if (mine) {
                        Spacer(Modifier.width(5.dp))
                        val status = when {
                            message.localDeliveryStatus == "SENDING" -> "Đang gửi"
                            message.localDeliveryStatus == "FAILED" -> "Gửi thất bại"
                            message.readAt != null -> "Đã xem"
                            message.deliveredAt != null -> "Đã nhận"
                            else -> "Đã gửi"
                        }
                        Text(status, color = if (message.localDeliveryStatus == "FAILED") StatusErrorText else TextMuted, fontSize = 10.sp)
                    }
                }
            }

            if (message.localDeliveryStatus == "FAILED") {
                Text(
                    text = "Gửi lại",
                    color = PrimaryDark,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .clickable { onRetry(message) }
                        .padding(vertical = 4.dp, horizontal = 4.dp)
                )
            }
        }
    }
}

@Composable
private fun AttachmentContent(
    consultationId: String,
    attachment: ConsultationAttachment,
    onImageClick: (url: String, fileName: String) -> Unit
) {
    val context = LocalContext.current
    if (attachment.type == "IMAGE") {
        val model: Any = attachment.localUri?.let(Uri::parse)
            ?: "${ApiClient.getRealtimeBaseUrl()}/api/v1/consultations/$consultationId/attachments/${attachment.id}"
        val secureImageLoader = remember {
            ImageLoader.Builder(context).okHttpClient {
                OkHttpClient.Builder().addInterceptor { chain ->
                    val request = chain.request().newBuilder()
                    ApiClient.getTokenManager().getAccessToken()?.let { request.header("Authorization", "Bearer $it") }
                    chain.proceed(request.build())
                }.build()
            }.build()
        }
        AsyncImage(
            model = model,
            imageLoader = secureImageLoader,
            contentDescription = "Ảnh y tế ${attachment.fileName}",
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 100.dp, max = 240.dp)
                .clip(RoundedCornerShape(12.dp))
                .clickable { onImageClick(model.toString(), attachment.fileName) }
        )
    } else {
        Row(Modifier.padding(5.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Description, contentDescription = null, modifier = Modifier.size(30.dp), tint = PrimaryDark)
            Spacer(Modifier.width(8.dp))
            Column {
                Text(attachment.fileName, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, maxLines = 2)
                Text("${attachment.sizeBytes / 1024} KB · PDF", fontSize = 11.sp, color = TextSecondary)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ConsultationComposer(
    consultation: Consultation,
    viewModel: ConsultationViewModel,
    draft: String,
    onDraftChange: (String) -> Unit
) {
    val focus = LocalFocusManager.current
    val context = LocalContext.current
    var showAttachmentSheet by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<SelectedAttachment?>(null) }
    var fileError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(draft) {
        if (draft.isNotBlank()) {
            viewModel.setTyping(true)
            delay(3000)
            viewModel.setTyping(false)
        } else {
            viewModel.setTyping(false)
        }
    }

    fun select(uri: Uri?) {
        if (uri == null) return
        runCatching {
            val resolver = context.contentResolver
            val mime = resolver.getType(uri) ?: error("Không xác định được định dạng tệp")
            if (mime !in setOf("image/jpeg", "image/png", "application/pdf")) error("Chỉ hỗ trợ JPEG, PNG hoặc PDF")
            var name = "tai-lieu"
            var size = -1L
            resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    name = cursor.getString(0) ?: name
                    size = if (cursor.isNull(1)) -1 else cursor.getLong(1)
                }
            }
            if (size > 10 * 1024 * 1024) error("Tệp không được vượt quá 10 MB")
            val bytes = resolver.openInputStream(uri)?.use { it.readBytes() } ?: error("Không thể đọc tệp")
            if (bytes.size > 10 * 1024 * 1024) error("Tệp không được vượt quá 10 MB")
            selected = SelectedAttachment(uri, name, mime, bytes)
            fileError = null
        }.onFailure { fileError = it.message }
    }

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent(), ::select)
    val documentPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument(), ::select)
    val chatOpened = runCatching { consultation.chatOpenAt == null || !Instant.now().isBefore(Instant.parse(consultation.chatOpenAt)) }.getOrDefault(false)
    val enabled = consultation.status in listOf("ACCEPTED", "ACTIVE") && chatOpened

    Surface(color = Color.White, shadowElevation = 8.dp) {
        if (!enabled) {
            Text(
                text = when (consultation.status) {
                    "COMPLETED" -> "Phiên tư vấn đã kết thúc. Bạn vẫn có thể xem lại nội dung."
                    "CANCELLED" -> "Phiên tư vấn đã bị hủy."
                    "EXPIRED" -> "Phiên tư vấn đã hết hạn."
                    "SCHEDULED", "WAITING" -> "Đang chờ bác sĩ tiếp nhận và mở phiên tư vấn."
                    else -> "Chưa thể gửi tin nhắn trong trạng thái hiện tại."
                },
                color = TextSecondary,
                fontSize = 13.sp,
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(16.dp)
            )
        } else {
            Column(Modifier.imePadding().navigationBarsPadding()) {
                fileError?.let {
                    Text(it, color = StatusErrorText, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    IconButton(onClick = { showAttachmentSheet = true }) {
                        Icon(Icons.Outlined.Add, contentDescription = "Thêm ảnh hoặc tài liệu", tint = PrimaryDark)
                    }
                    OutlinedTextField(
                        value = draft,
                        onValueChange = { if (it.length <= 4000) onDraftChange(it) },
                        placeholder = { Text("Nhập tin nhắn...") },
                        modifier = Modifier.weight(1f),
                        maxLines = 5,
                        shape = RoundedCornerShape(22.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(onSend = {
                            if (draft.isNotBlank()) {
                                viewModel.sendText(draft)
                                onDraftChange("")
                                focus.clearFocus()
                            }
                        })
                    )
                    Spacer(Modifier.width(7.dp))
                    FilledIconButton(
                        onClick = {
                            viewModel.sendText(draft)
                            onDraftChange("")
                            focus.clearFocus()
                        },
                        enabled = draft.isNotBlank(),
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = Primary),
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Gửi tin nhắn")
                    }
                }
            }
        }
    }

    if (showAttachmentSheet) {
        ModalBottomSheet(onDismissRequest = { showAttachmentSheet = false }) {
            ListItem(
                headlineContent = { Text("Chọn ảnh từ thư viện", fontWeight = FontWeight.Medium) },
                leadingContent = { Icon(Icons.Outlined.Photo, contentDescription = null, tint = Primary) },
                modifier = Modifier.clickable { showAttachmentSheet = false; imagePicker.launch("image/*") }
            )
            ListItem(
                headlineContent = { Text("Chọn tài liệu PDF", fontWeight = FontWeight.Medium) },
                leadingContent = { Icon(Icons.Outlined.Description, contentDescription = null, tint = Primary) },
                modifier = Modifier.clickable { showAttachmentSheet = false; documentPicker.launch(arrayOf("application/pdf")) }
            )
            Spacer(Modifier.navigationBarsPadding().height(16.dp))
        }
    }

    selected?.let { file ->
        AlertDialog(
            onDismissRequest = { selected = null },
            title = { Text("Gửi tài liệu cho bác sĩ?", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    if (file.mimeType.startsWith("image/")) {
                        AsyncImage(file.uri, "Ảnh đã chọn", Modifier.fillMaxWidth().height(220.dp).clip(RoundedCornerShape(14.dp)))
                    }
                    Text(file.fileName, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 10.dp))
                    Text("${file.bytes.size / 1024} KB", color = TextSecondary)
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.sendAttachment(file.fileName, file.mimeType, file.bytes, file.uri.toString())
                    selected = null
                }) { Text("Gửi", color = PrimaryDark, fontWeight = FontWeight.Bold) }
            },
            dismissButton = { TextButton(onClick = { selected = null }) { Text("Hủy") } }
        )
    }
}

private data class SelectedAttachment(val uri: Uri, val fileName: String, val mimeType: String, val bytes: ByteArray)

@Composable
fun FullscreenImageViewer(
    imageUrl: String,
    title: String?,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    val secureImageLoader = remember {
        ImageLoader.Builder(context).okHttpClient {
            OkHttpClient.Builder().addInterceptor { chain ->
                val request = chain.request().newBuilder()
                ApiClient.getTokenManager().getAccessToken()?.let { request.header("Authorization", "Bearer $it") }
                chain.proceed(request.build())
            }.build()
        }.build()
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.95f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectTransformGestures { _, pan, zoom, _ ->
                            scale = (scale * zoom).coerceIn(1f, 5f)
                            if (scale > 1f) {
                                val maxOffsetX = (size.width * (scale - 1)) / 2f
                                val maxOffsetY = (size.height * (scale - 1)) / 2f
                                offset = Offset(
                                    x = (offset.x + pan.x).coerceIn(-maxOffsetX, maxOffsetX),
                                    y = (offset.y + pan.y).coerceIn(-maxOffsetY, maxOffsetY)
                                )
                            } else {
                                offset = Offset.Zero
                            }
                        }
                    }
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onDoubleTap = {
                                if (scale > 1f) {
                                    scale = 1f
                                    offset = Offset.Zero
                                } else {
                                    scale = 2.5f
                                }
                            }
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = imageUrl,
                    imageLoader = secureImageLoader,
                    contentDescription = title ?: "Ảnh phóng to",
                    modifier = Modifier
                        .fillMaxSize()
                        .graphicsLayer(
                            scaleX = scale,
                            scaleY = scale,
                            translationX = offset.x,
                            translationY = offset.y
                        )
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Outlined.Close,
                        contentDescription = "Đóng",
                        tint = Color.White
                    )
                }
                title?.let {
                    Text(
                        text = it,
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp)
                    )
                }
                if (scale > 1f) {
                    IconButton(onClick = { scale = 1f; offset = Offset.Zero }) {
                        Icon(
                            imageVector = Icons.Outlined.Refresh,
                            contentDescription = "Đặt lại thu phóng",
                            tint = Color.White
                        )
                    }
                } else {
                    Spacer(Modifier.size(48.dp))
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorInfoBottomSheet(
    consultation: Consultation,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color.White,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .navigationBarsPadding()
                .padding(bottom = 24.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(
                    model = consultation.doctor.avatarUrl,
                    contentDescription = null,
                    modifier = Modifier
                        .size(60.dp)
                        .clip(CircleShape)
                        .background(PrimaryLight)
                )
                Spacer(Modifier.width(14.dp))
                Column {
                    Text(
                        text = listOfNotNull(consultation.doctor.title, consultation.doctor.fullName).joinToString(" "),
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = TextPrimary
                    )
                    Text(
                        text = consultation.doctorWorkplace.specialty.name,
                        color = PrimaryDark,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = consultation.doctorWorkplace.hospital.name,
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                }
            }

            HorizontalDivider(Modifier.padding(vertical = 16.dp), color = Border)

            Text("Chi tiết phiên tư vấn", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
            Spacer(Modifier.height(8.dp))

            Surface(
                color = Background,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Border)
            ) {
                Column(Modifier.padding(12.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Trạng thái", color = TextSecondary, fontSize = 12.sp)
                        ConsultationStatusBadge(consultation.status)
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Bệnh nhân", color = TextSecondary, fontSize = 12.sp)
                        Text(consultation.patientProfile.fullName, fontWeight = FontWeight.Medium, fontSize = 12.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Thời gian", color = TextSecondary, fontSize = 12.sp)
                        Text(formatConsultationTime(consultation.scheduledStartAt), fontWeight = FontWeight.Medium, fontSize = 12.sp)
                    }
                    if (consultation.appointment?.bookingCode != null) {
                        Spacer(Modifier.height(8.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Mã đặt lịch", color = TextSecondary, fontSize = 12.sp)
                            Text(consultation.appointment.bookingCode, fontWeight = FontWeight.Bold, color = PrimaryDark, fontSize = 12.sp)
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))
            Text("Chủ đề tư vấn:", color = TextSecondary, fontSize = 12.sp)
            Text(consultation.topic, fontWeight = FontWeight.Medium, fontSize = 14.sp, color = TextPrimary)
            if (consultation.description.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text("Mô tả ban đầu:", color = TextSecondary, fontSize = 12.sp)
                Text(consultation.description, fontSize = 13.sp, color = TextSecondary)
            }

            Spacer(Modifier.height(20.dp))
            Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Đóng", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
fun ActiveSessionTimerBar(startedAt: String?) {
    var remainingSeconds by remember(startedAt) {
        val start = runCatching { Instant.parse(startedAt) }.getOrNull() ?: Instant.now()
        val elapsed = Duration.between(start, Instant.now()).seconds
        mutableLongStateOf(maxOf(0L, 1800L - elapsed))
    }

    LaunchedEffect(startedAt) {
        while (true) {
            val start = runCatching { Instant.parse(startedAt) }.getOrNull() ?: Instant.now()
            val elapsed = Duration.between(start, Instant.now()).seconds
            remainingSeconds = maxOf(0L, 1800L - elapsed)
            delay(1000)
        }
    }

    val minutes = remainingSeconds / 60
    val seconds = remainingSeconds % 60
    val timeFormatted = String.format("%02d:%02d", minutes, seconds)
    val isNearEnd = remainingSeconds in 1..300

    Surface(
        color = if (isNearEnd) Color(0xFFFEF2F2) else Color(0xFFF0FDF4),
        border = BorderStroke(1.dp, if (isNearEnd) Color(0xFFFECACA) else Color(0xFFBBF7D0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Outlined.Timer,
                    contentDescription = null,
                    tint = if (isNearEnd) Color(0xFFDC2626) else Color(0xFF16A34A),
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = if (isNearEnd) "Phiên sắp kết thúc: còn $timeFormatted" else "Thời gian tư vấn còn lại: $timeFormatted",
                    color = if (isNearEnd) Color(0xFFDC2626) else Color(0xFF15803D),
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 12.sp
                )
            }
            Text(
                text = "Tối đa 30p",
                color = TextMuted,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun TypingIndicatorBubble(text: String) {
    val infiniteTransition = rememberInfiniteTransition(label = "typing_dots")
    val dot1Alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes { durationMillis = 1000; 0.3f at 0; 1f at 300; 0.3f at 600 },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot1"
    )
    val dot2Alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes { durationMillis = 1000; 0.3f at 150; 1f at 450; 0.3f at 750 },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot2"
    )
    val dot3Alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes { durationMillis = 1000; 0.3f at 300; 1f at 600; 0.3f at 900 },
            repeatMode = RepeatMode.Restart
        ),
        label = "dot3"
    )

    Surface(
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Border),
        shadowElevation = 2.dp,
        modifier = Modifier.padding(start = 16.dp, bottom = 6.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text, fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.Medium)
            Spacer(Modifier.width(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(5.dp).clip(CircleShape).background(Primary.copy(alpha = dot1Alpha)))
                Box(Modifier.size(5.dp).clip(CircleShape).background(Primary.copy(alpha = dot2Alpha)))
                Box(Modifier.size(5.dp).clip(CircleShape).background(Primary.copy(alpha = dot3Alpha)))
            }
        }
    }
}

@Composable
fun EmptyConsultationChatState(
    isDoctor: Boolean,
    onSuggestionClick: (String) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Border),
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                color = PrimaryLight,
                shape = CircleShape,
                modifier = Modifier.size(52.dp)
            ) {
                Icon(
                    imageVector = Icons.Outlined.ChatBubbleOutline,
                    contentDescription = null,
                    tint = PrimaryDark,
                    modifier = Modifier.padding(14.dp)
                )
            }
            Spacer(Modifier.height(12.dp))
            Text(
                text = "Phiên tư vấn trực tuyến bảo mật",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = TextPrimary
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = if (isDoctor)
                    "Bệnh nhân đang chờ phản hồi từ bác sĩ. Bạn có thể gửi lời chào hoặc bắt đầu hỏi thăm triệu chứng."
                else
                    "Hãy mô tả chi tiết triệu chứng hoặc gửi ảnh xét nghiệm/đơn thuốc để bác sĩ tư vấn chính xác nhất.",
                color = TextSecondary,
                fontSize = 12.sp,
                lineHeight = 17.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 8.dp)
            )

            if (!isDoctor) {
                Spacer(Modifier.height(14.dp))
                Text("Gợi ý câu hỏi:", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(8.dp))
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf(
                        "Bác sĩ xem giúp em kết quả này với ạ",
                        "Em bị triệu chứng này 2 hôm nay rồi ạ",
                        "Bác sĩ tư vấn giúp em hướng xử lý với ạ"
                    ).forEach { prompt ->
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Background,
                            border = BorderStroke(1.dp, Border),
                            modifier = Modifier.clickable { onSuggestionClick(prompt) }
                        ) {
                            Text(
                                text = prompt,
                                fontSize = 12.sp,
                                color = PrimaryDark,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DateDivider(date: LocalDate) {
    val today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))
    val label = when (date) {
        today -> "Hôm nay"
        today.minusDays(1) -> "Hôm qua"
        else -> date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    }
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        HorizontalDivider(Modifier.weight(1f), color = Border)
        Text(label, color = TextMuted, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 10.dp))
        HorizontalDivider(Modifier.weight(1f), color = Border)
    }
}

private fun isWithinTwoMinutes(time1: String?, time2: String?): Boolean {
    if (time1 == null || time2 == null) return false
    return runCatching {
        val t1 = Instant.parse(time1)
        val t2 = Instant.parse(time2)
        Duration.between(t1, t2).abs().seconds < 120
    }.getOrDefault(false)
}

private fun messageDate(value: String): LocalDate = runCatching {
    Instant.parse(value).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDate()
}.getOrDefault(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")))

private fun formatMessageClock(value: String): String = runCatching {
    Instant.parse(value).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(DateTimeFormatter.ofPattern("HH:mm"))
}.getOrDefault("")
