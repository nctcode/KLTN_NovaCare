package com.example.kltn_novacare.ui.screens.screening

import android.Manifest
import android.media.MediaRecorder
import android.net.Uri
import android.os.SystemClock
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil.compose.AsyncImage
import com.example.kltn_novacare.ui.viewmodel.ScreeningImage
import java.io.File
import kotlinx.coroutines.delay

@Composable
fun ScreeningImages(images: List<ScreeningImage>, enabled: Boolean, onImage: (Uri, File?) -> Unit,
    onRemove: (ScreeningImage) -> Unit, onError: (String) -> Unit) {
    val context = LocalContext.current
    var pendingPath by rememberSaveable { mutableStateOf<String?>(null) }
    DisposableEffect(Unit) {
        onDispose { if ((context as? android.app.Activity)?.isChangingConfigurations != true) pendingPath?.let { File(it).delete() } }
    }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri -> uri?.let { onImage(it, null) } }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        pendingPath?.let { path ->
            val file = File(path)
            if (success) onImage(FileProvider.getUriForFile(context, "${context.packageName}.screening.files", file), file) else file.delete()
        }; pendingPath = null
    }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) try {
            val folder = File(context.cacheDir, "screening-capture").apply { mkdirs() }
            val file = File.createTempFile("capture-", ".jpg", folder); pendingPath = file.absolutePath
            camera.launch(FileProvider.getUriForFile(context, "${context.packageName}.screening.files", file))
        } catch (_: Exception) { pendingPath?.let { File(it).delete() }; pendingPath = null; onError("Không mở được camera. Bạn có thể chọn ảnh có sẵn.") }
        else onError("Chưa có quyền camera. Bạn có thể chọn ảnh hoặc bỏ qua.")
    }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedButton(onClick = { permission.launch(Manifest.permission.CAMERA) }, enabled = enabled && images.size < 3, modifier = Modifier.weight(1f)) { Text("Chụp ảnh") }
        OutlinedButton(onClick = { picker.launch("image/*") }, enabled = enabled && images.size < 3, modifier = Modifier.weight(1f)) { Text("Chọn ảnh") }
    }
    images.forEachIndexed { index, image ->
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            AsyncImage(image.file, "Ảnh tổn thương ${index + 1}", Modifier.size(90.dp))
            TextButton(onClick = { onRemove(image) }, enabled = enabled) { Text("Xóa ảnh ${index + 1}") }
        }
    }
}

@Suppress("DEPRECATION")
@Composable
fun ScreeningVoiceCapture(uploading: Boolean, onSend: (File) -> Unit, onError: (String) -> Unit) {
    val context = LocalContext.current
    val owner = LocalLifecycleOwner.current
    var recorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var file by remember { mutableStateOf<File?>(null) }
    var ready by remember { mutableStateOf(false) }
    var started by remember { mutableLongStateOf(0L) }
    var seconds by remember { mutableIntStateOf(0) }
    fun discard() { recorder?.let { runCatching { it.stop() }; it.release() }; recorder = null; file?.delete(); file = null; ready = false }
    fun finish() {
        val current = recorder ?: return
        val duration = SystemClock.elapsedRealtime() - started
        val stopped = runCatching { current.stop() }.isSuccess; current.release(); recorder = null
        ready = stopped && duration >= 3000 && (file?.length() ?: 0) in 1..10L * 1024 * 1024
        if (!ready) { file?.delete(); file = null; onError("Bản ghi quá ngắn hoặc chưa rõ. Hãy ghi ít nhất 3 giây hoặc nhập lời kể.") }
    }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (!granted) onError("Chưa có quyền microphone. Bạn vẫn có thể nhập lời kể.")
        else try {
            discard()
            val output = File.createTempFile("screening-voice-", ".m4a", context.cacheDir); file = output
            val media = MediaRecorder(); recorder = media
            media.setAudioSource(MediaRecorder.AudioSource.MIC); media.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            media.setAudioEncoder(MediaRecorder.AudioEncoder.AAC); media.setAudioEncodingBitRate(96000); media.setAudioSamplingRate(44100)
            media.setOutputFile(output.absolutePath); media.setMaxDuration(30000); media.setMaxFileSize(10L * 1024 * 1024)
            media.setOnInfoListener { _, what, _ -> if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED || what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED) finish() }
            media.setOnErrorListener { _, _, _ -> discard(); onError("Ghi âm bị gián đoạn. Vui lòng thử lại.") }
            media.prepare(); media.start(); started = SystemClock.elapsedRealtime(); seconds = 0
        } catch (_: Exception) { discard(); onError("Không khởi tạo được microphone. Hãy thử lại hoặc nhập mô tả.") }
    }
    DisposableEffect(owner) {
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_STOP) discard() }
        owner.lifecycle.addObserver(observer)
        onDispose { owner.lifecycle.removeObserver(observer); discard() }
    }
    LaunchedEffect(recorder) { while (recorder != null) { delay(500); seconds = ((SystemClock.elapsedRealtime() - started) / 1000).toInt(); if (seconds >= 30) finish() } }
    Text("Mô tả bạn khó chịu ở đâu, bắt đầu khi nào và triệu chứng đi kèm. Không đọc câu mẫu, không nêu thông tin nhận dạng.", style = MaterialTheme.typography.bodySmall)
    if (recorder != null) Button(onClick = { finish() }) { Text("Dừng ghi • ${seconds}s / 30s") }
    else OutlinedButton(onClick = { permission.launch(Manifest.permission.RECORD_AUDIO) }, enabled = !uploading) { Text(if (ready) "Ghi lại" else "Bắt đầu ghi âm") }
    if (ready) Button(onClick = { val sent = file; file = null; ready = false; sent?.let(onSend) }, enabled = !uploading) { Text("Chuyển bản ghi thành văn bản") }
}
