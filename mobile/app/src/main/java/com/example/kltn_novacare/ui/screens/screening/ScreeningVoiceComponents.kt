package com.example.kltn_novacare.ui.screens.screening

import android.Manifest
import android.media.MediaRecorder
import android.os.SystemClock
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.outlined.GraphicEq
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.example.kltn_novacare.ui.theme.*
import java.io.File
import kotlinx.coroutines.delay

@Suppress("DEPRECATION")
@Composable
fun ScreeningVoiceSection(
    consent: Boolean,
    onConsentChange: (Boolean) -> Unit,
    isTranscribing: Boolean,
    transcript: String,
    onTranscriptChange: (String) -> Unit,
    confirmed: Boolean,
    onConfirmChange: (Boolean) -> Unit,
    onSendVoice: (File) -> Unit,
    onError: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val owner = LocalLifecycleOwner.current

    var recorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var audioFile by remember { mutableStateOf<File?>(null) }
    var recordingReady by remember { mutableStateOf(false) }
    var startedTime by remember { mutableLongStateOf(0L) }
    var elapsedSeconds by remember { mutableIntStateOf(0) }
    var micPermissionDenied by rememberSaveable { mutableStateOf(false) }

    fun discardRecording() {
        recorder?.let {
            runCatching { it.stop() }
            it.release()
        }
        recorder = null
        audioFile?.delete()
        audioFile = null
        recordingReady = false
    }

    fun finishRecording() {
        val currentRecorder = recorder ?: return
        val durationMs = SystemClock.elapsedRealtime() - startedTime
        val stopped = runCatching { currentRecorder.stop() }.isSuccess
        currentRecorder.release()
        recorder = null

        val fileSize = audioFile?.length() ?: 0
        recordingReady = stopped && durationMs >= 3000 && fileSize in 1..10L * 1024 * 1024
        if (!recordingReady) {
            audioFile?.delete()
            audioFile = null
            onError("Bản ghi quá ngắn hoặc chưa rõ. Hãy ghi ít nhất 3 giây hoặc nhập trực tiếp lời kể.")
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) {
            micPermissionDenied = true
            onError("Chưa có quyền microphone. Bạn vẫn có thể nhập lời kể bằng bàn phím.")
        } else {
            micPermissionDenied = false
            try {
                discardRecording()
                val output = File.createTempFile("screening-voice-", ".m4a", context.cacheDir)
                audioFile = output
                val media = MediaRecorder()
                recorder = media
                media.setAudioSource(MediaRecorder.AudioSource.MIC)
                media.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                media.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                media.setAudioEncodingBitRate(96000)
                media.setAudioSamplingRate(44100)
                media.setOutputFile(output.absolutePath)
                media.setMaxDuration(30000)
                media.setMaxFileSize(10L * 1024 * 1024)
                media.setOnInfoListener { _, what, _ ->
                    if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED ||
                        what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED
                    ) {
                        finishRecording()
                    }
                }
                media.setOnErrorListener { _, _, _ ->
                    discardRecording()
                    onError("Ghi âm bị gián đoạn. Vui lòng thử lại.")
                }
                media.prepare()
                media.start()
                startedTime = SystemClock.elapsedRealtime()
                elapsedSeconds = 0
            } catch (e: Exception) {
                discardRecording()
                onError("Không khởi tạo được microphone. Hãy thử lại hoặc nhập mô tả trực tiếp.")
            }
        }
    }

    DisposableEffect(owner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_STOP) discardRecording()
        }
        owner.lifecycle.addObserver(observer)
        onDispose {
            owner.lifecycle.removeObserver(observer)
            discardRecording()
        }
    }

    LaunchedEffect(recorder) {
        while (recorder != null) {
            delay(500)
            elapsedSeconds = ((SystemClock.elapsedRealtime() - startedTime) / 1000).toInt()
            if (elapsedSeconds >= 30) finishRecording()
        }
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Privacy Consent
        PrivacyConsentCard(
            checked = consent,
            onCheckedChange = onConsentChange,
            title = "Đồng ý xử lý giọng nói y tế bằng AI",
            description = "Bản ghi âm chỉ được dùng để chuyển thành văn bản trong phiên này. Hệ thống không chẩn đoán dựa trên âm sắc giọng nói."
        )

        // Main Voice Capture Section Card
        ScreeningSectionCard(
            title = "5. Giọng nói triệu chứng (tùy chọn)",
            subtitle = "Kể tự nhiên cảm giác khó chịu. AI sẽ hỗ trợ chuyển thành lời kể hoặc bạn có thể nhập trực tiếp.",
            icon = Icons.Outlined.GraphicEq,
            badgeText = if (transcript.isNotBlank()) "Đã có lời kể" else "Tùy chọn",
            badgeColor = if (transcript.isNotBlank()) PrimaryDark else TextMuted
        ) {
            // Note for recording
            Surface(
                color = Color(0xFFF8FAFC),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Info,
                        contentDescription = null,
                        tint = TextSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Nói rõ khó chịu ở đâu, bao lâu và dấu hiệu đi kèm. Không nêu thông tin cá nhân như CCCD/tên đầy đủ.",
                        fontSize = 11.sp,
                        color = TextSecondary,
                        lineHeight = 15.sp
                    )
                }
            }

            // Recorder Control Box
            if (consent) {
                Surface(
                    color = PrimaryLight.copy(alpha = 0.4f),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, PrimaryBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        if (recorder != null) {
                            // Currently Recording State
                            val infiniteTransition = rememberInfiniteTransition(label = "recording_pulse")
                            val pulseScale by infiniteTransition.animateFloat(
                                initialValue = 1f,
                                targetValue = 1.25f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(600, easing = FastOutSlowInEasing),
                                    repeatMode = RepeatMode.Reverse
                                ),
                                label = "mic_scale"
                            )

                            Box(
                                modifier = Modifier
                                    .size(64.dp)
                                    .scale(pulseScale)
                                    .background(Color(0xFFEF4444), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Mic,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(32.dp)
                                )
                            }

                            Text(
                                text = "Đang ghi âm: 00:${elapsedSeconds.toString().padStart(2, '0')} / 00:30",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFDC2626)
                            )

                            Button(
                                onClick = { finishRecording() },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.height(44.dp)
                            ) {
                                Icon(Icons.Default.Stop, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Dừng ghi âm", fontWeight = FontWeight.Bold)
                            }
                        } else {
                            // Idle / Ready / Recorded State
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = {
                                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                    },
                                    enabled = !isTranscribing,
                                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(46.dp)
                                ) {
                                    Icon(
                                        imageVector = if (recordingReady) Icons.Default.Refresh else Icons.Default.Mic,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (recordingReady) "Ghi lại" else "Bắt đầu ghi âm",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }

                                if (recordingReady) {
                                    Button(
                                        onClick = {
                                            val sentFile = audioFile
                                            audioFile = null
                                            recordingReady = false
                                            sentFile?.let(onSendVoice)
                                        },
                                        enabled = !isTranscribing,
                                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryDark),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(46.dp)
                                    ) {
                                        Text(
                                            text = "Chuyển thành văn bản",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }
                        }

                        // Transcribing Spinner
                        if (isTranscribing) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.padding(top = 4.dp)
                            ) {
                                LinearProgressIndicator(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(4.dp)
                                        .clip(RoundedCornerShape(2.dp)),
                                    color = Primary,
                                    trackColor = PrimaryLight
                                )
                                Text(
                                    text = "NovaCare AI đang chuyển bản ghi thành văn bản...",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = PrimaryDark
                                )
                            }
                        }
                    }
                }
            } else {
                Surface(
                    color = Color(0xFFF1F5F9),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Vui lòng đánh dấu đồng ý xử lý giọng nói ở trên để kích hoạt tính năng ghi âm.",
                        fontSize = 12.sp,
                        color = TextMuted,
                        modifier = Modifier.padding(14.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }

            // Permission denial notice
            if (micPermissionDenied) {
                PermissionNoticeCard(
                    title = "Quyền Microphone bị từ chối",
                    description = "Để dùng tính năng ghi âm giọng nói, vui lòng cấp quyền microphone hoặc bạn có thể nhập trực tiếp triệu chứng vào ô bên dưới.",
                    buttonText = "Yêu cầu lại quyền",
                    onRequestPermission = { permissionLauncher.launch(Manifest.permission.RECORD_AUDIO) },
                    isPermanentlyDenied = false
                )
            }

            // Editable Transcript TextField
            OutlinedTextField(
                value = transcript,
                onValueChange = onTranscriptChange,
                enabled = !isTranscribing,
                label = { Text("Lời kể triệu chứng (đã chuyển hoặc nhập trực tiếp)") },
                placeholder = { Text("Nội dung được chuyển từ giọng nói sẽ hiển thị tại đây. Bạn có thể chỉnh sửa tự do trước khi phân tích.") },
                minLines = 3,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    cursorColor = Primary
                ),
                modifier = Modifier.fillMaxWidth()
            )

            // Confirmation Checkbox (Required by backend when transcript is provided)
            Surface(
                color = if (confirmed) PrimaryLight else Color(0xFFF8FAFC),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, if (confirmed) PrimaryBorder else BorderLight),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable(enabled = transcript.isNotBlank() && !isTranscribing) {
                        onConfirmChange(!confirmed)
                    }
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = confirmed,
                        onCheckedChange = onConfirmChange,
                        enabled = transcript.isNotBlank() && !isTranscribing,
                        colors = CheckboxDefaults.colors(
                            checkedColor = Primary,
                            checkmarkColor = Color.White
                        ),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Tôi xác nhận nội dung trên phản ánh đúng triệu chứng của mình.",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (transcript.isNotBlank()) TextPrimary else TextMuted
                    )
                }
            }
        }
    }
}
