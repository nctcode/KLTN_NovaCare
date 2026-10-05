package com.example.kltn_novacare.ui.screens.screening

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.SurfaceTexture
import android.hardware.camera2.*
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Surface
import android.view.TextureView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.HelpOutline
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Sensors
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
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.example.kltn_novacare.data.model.ScreeningPpg
import com.example.kltn_novacare.domain.service.CameraPpgProgress
import com.example.kltn_novacare.domain.service.CameraPpgSignal
import com.example.kltn_novacare.ui.theme.*
import java.time.Instant

@Composable
fun ScreeningPpgCapture(
    currentPpg: ScreeningPpg? = null,
    onResult: (ScreeningPpg?) -> Unit,
    onError: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var running by remember { mutableStateOf(false) }
    var showGuide by rememberSaveable { mutableStateOf(false) }
    var lensFacing by rememberSaveable { mutableIntStateOf(CameraCharacteristics.LENS_FACING_BACK) }
    var signal by remember { mutableStateOf(CameraPpgProgress(0, false, 0)) }
    var cameraPermissionDenied by rememberSaveable { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            cameraPermissionDenied = false
            onResult(null)
            running = true
        } else {
            cameraPermissionDenied = true
            onError("Chưa có quyền camera. Bạn có thể bỏ qua phép đo nhịp tim.")
        }
    }

    if (showGuide) {
        PpgGuideDialog(onDismiss = { showGuide = false })
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        if (running) {
            // Live Measurement Panel
            PpgMeasurementPanel(
                signal = signal,
                onStop = {
                    running = false
                    onResult(null)
                },
                onGuide = { showGuide = true }
            ) {
                PpgCamera(
                    lensFacing = lensFacing,
                    onProgress = { signal = it },
                    onResult = {
                        running = false
                        onResult(it)
                    },
                    onError = {
                        running = false
                        onError(it)
                    },
                    onStop = { running = false }
                )
            }
        } else {
            // Idle Setup Card
            ScreeningSectionCard(
                title = "4. Nhịp tim qua camera (tùy chọn)",
                subtitle = "Chỉ dùng hỗ trợ sàng lọc khi tín hiệu ổn định. Không thay thế thiết bị y tế chuyên dụng.",
                icon = Icons.Outlined.Sensors,
                badgeText = if (currentPpg != null) "${currentPpg.bpm} BPM" else "Tùy chọn",
                badgeColor = if (currentPpg != null) PrimaryDark else TextMuted
            ) {
                // Already recorded measurement banner
                if (currentPpg != null) {
                    Surface(
                        color = PrimaryLight,
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, PrimaryBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Favorite,
                                contentDescription = null,
                                tint = PrimaryDark,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Đã ghi nhận nhịp tim: ${currentPpg.bpm} BPM",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryDark
                                )
                                Text(
                                    text = "Số đo ước lượng qua PPG quang học • Có thể đo lại nếu muốn",
                                    fontSize = 11.sp,
                                    color = TextSecondary
                                )
                            }
                            IconButton(onClick = { onResult(null) }) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Xóa số đo",
                                    tint = TextSecondary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }

                // Guide trigger row (Separate, responsive row to completely prevent vertical text wrapping)
                Surface(
                    color = Color(0xFFF8FAFC),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showGuide = true }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.HelpOutline,
                                contentDescription = null,
                                tint = PrimaryDark,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Xem hướng dẫn cách đặt ngón tay đúng chuẩn",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                        }

                        Text(
                            text = "Xem",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryDark
                        )
                    }
                }

                // Camera Lens Selection (Separate, balanced 2-column row)
                Text(
                    text = "Chọn camera đo:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    FilterChip(
                        selected = lensFacing == CameraCharacteristics.LENS_FACING_BACK,
                        onClick = { lensFacing = CameraCharacteristics.LENS_FACING_BACK },
                        label = {
                            Text(
                                "Camera sau + Flash (khuyên dùng)",
                                fontSize = 12.sp,
                                fontWeight = if (lensFacing == CameraCharacteristics.LENS_FACING_BACK) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryLight,
                            selectedLabelColor = PrimaryDark
                        ),
                        modifier = Modifier.weight(1f)
                    )

                    FilterChip(
                        selected = lensFacing == CameraCharacteristics.LENS_FACING_FRONT,
                        onClick = { lensFacing = CameraCharacteristics.LENS_FACING_FRONT },
                        label = {
                            Text(
                                "Camera trước",
                                fontSize = 12.sp,
                                fontWeight = if (lensFacing == CameraCharacteristics.LENS_FACING_FRONT) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryLight,
                            selectedLabelColor = PrimaryDark
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }

                // Start Button
                Button(
                    onClick = {
                        signal = CameraPpgProgress(0, false, 0)
                        permissionLauncher.launch(Manifest.permission.CAMERA)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryDark)
                ) {
                    Icon(
                        imageVector = Icons.Default.Favorite,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (currentPpg != null) "Đo lại nhịp tim" else "Bắt đầu đo nhịp tim",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (cameraPermissionDenied) {
                    PermissionNoticeCard(
                        title = "Quyền truy cập Camera bị từ chối",
                        description = "Cần quyền camera để đo tín hiệu quang học PPG qua ngón tay. Bạn có thể cấp quyền hoặc bỏ qua bước này.",
                        buttonText = "Cấp quyền camera",
                        onRequestPermission = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                        isPermanentlyDenied = false
                    )
                }
            }
        }
    }
}

// ==============================================================================
// PPG MEASUREMENT PANEL (While actively measuring)
// ==============================================================================
@Composable
private fun PpgMeasurementPanel(
    signal: CameraPpgProgress,
    onStop: () -> Unit,
    onGuide: () -> Unit,
    preview: @Composable () -> Unit
) {
    val progress = (signal.durationMs / 20_000f).coerceIn(0f, 1f)

    // Pulse animation: feedback only, NOT ECG
    val infiniteTransition = rememberInfiniteTransition(label = "pulse_animation")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (signal.covered) 1.15f else 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 650, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B)), // Deep NovaCare Emerald
        border = BorderStroke(1.dp, Color(0xFF047857))
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Top control bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(
                    onClick = onStop,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.4f)),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text("Hủy đo", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                TextButton(
                    onClick = onGuide,
                    colors = ButtonDefaults.textButtonColors(contentColor = Color.White)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.HelpOutline,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Cách đo", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            // Pulse Icon with UI rhythm feedback
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .scale(pulseScale)
                    .background(
                        if (signal.covered) Color(0xFF10B981) else Color.White.copy(alpha = 0.15f),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Favorite,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(42.dp)
                )
            }

            // Contact Status
            Text(
                text = if (signal.covered) "Đang tiếp nhận tín hiệu" else "Đặt ngón tay che kín camera",
                color = if (signal.covered) Color(0xFFA7F3D0) else Color.White,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )

            // TextureView Preview (Hidden or subtle)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (signal.covered) Color(0xFF047857).copy(alpha = 0.4f) else Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                preview()
                if (!signal.covered) {
                    Text(
                        text = "Khung camera\n(Sẽ chuyển sang xanh khi áp đúng)",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }

            // Progress Bar (20s)
            Column(modifier = Modifier.fillMaxWidth()) {
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = Color(0xFF34D399),
                    trackColor = Color.White.copy(alpha = 0.2f)
                )

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (!signal.covered) "Vui lòng giữ yên ngón tay" else "Tiến trình: ${(progress * 100).toInt()}% (giữ 20s)",
                        color = Color.White,
                        fontSize = 12.sp
                    )

                    // Signal Quality state based purely on real CameraPpgProgress.quality
                    val qualityText = when {
                        signal.quality >= 80 -> "Tốt"
                        signal.quality >= 35 -> "Đang ổn định"
                        else -> "Chưa đủ"
                    }
                    val qualityColor = when {
                        signal.quality >= 80 -> Color(0xFF86EFAC)
                        signal.quality >= 35 -> Color(0xFFFDE68A)
                        else -> Color(0xFFFCA5A5)
                    }

                    Text(
                        text = "Tín hiệu: $qualityText",
                        color = qualityColor,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Disclaimer on UI feedback
            Text(
                text = "Hiệu ứng nhịp đập chỉ mang tính phản hồi thao tác và không phải biểu đồ điện tâm đồ (ECG) chuẩn y khoa.",
                color = Color.White.copy(alpha = 0.65f),
                fontSize = 10.sp,
                textAlign = TextAlign.Center,
                lineHeight = 14.sp
            )
        }
    }
}

// ==============================================================================
// PPG GUIDE DIALOG
// ==============================================================================
@Composable
private fun PpgGuideDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(18.dp),
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Hướng dẫn đo nhịp tim",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Đóng")
                }
            }
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    color = PrimaryLight,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Favorite,
                            contentDescription = null,
                            tint = PrimaryDark,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Áp nhẹ đầu ngón tay trỏ che kín camera sau và đèn flash. Giữ yên điện thoại trong 20 giây.",
                            fontSize = 12.sp,
                            color = PrimaryDark,
                            lineHeight = 17.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                PpgGuideStep(
                    number = "1",
                    title = "Nơi đủ sáng, tay ấm",
                    desc = "Không đo khi tay quá lạnh, run hoặc vừa vận động mạnh."
                )

                PpgGuideStep(
                    number = "2",
                    title = "Không ấn quá mạnh",
                    desc = "Ấn nhẹ vừa đủ che kín ống kính. Không đè mạnh lên đèn flash để tránh bị nóng."
                )

                PpgGuideStep(
                    number = "3",
                    title = "Giữ yên trong 20 giây",
                    desc = "Hạn chế cử động ngón tay và không nói chuyện trong khi máy đang đo."
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Tôi đã hiểu", fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun PpgGuideStep(number: String, title: String, desc: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .background(Primary, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = number,
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = desc,
                fontSize = 12.sp,
                color = TextSecondary,
                lineHeight = 16.sp
            )
        }
    }
}

// ==============================================================================
// CAMERA2 LOGIC IMPLEMENTATION (Preserved 100% original business logic)
// ==============================================================================
@Composable
private fun PpgCamera(
    lensFacing: Int,
    onProgress: (CameraPpgProgress) -> Unit,
    onResult: (ScreeningPpg) -> Unit,
    onError: (String) -> Unit,
    onStop: () -> Unit
) {
    val context = LocalContext.current
    val owner = LocalLifecycleOwner.current
    val result by rememberUpdatedState(onResult)
    val error by rememberUpdatedState(onError)
    val stop by rememberUpdatedState(onStop)
    val latestProgress by rememberUpdatedState(onProgress)
    val controller = remember(lensFacing) {
        PpgCameraController(
            context.applicationContext,
            lensFacing,
            { latestProgress(it) },
            { result(it) },
            { error(it) }
        )
    }

    DisposableEffect(owner, controller) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_STOP) {
                controller.close()
                stop()
            }
        }
        owner.lifecycle.addObserver(observer)
        onDispose {
            owner.lifecycle.removeObserver(observer)
            controller.close()
        }
    }

    AndroidView(
        factory = { TextureView(it).also(controller::attach) },
        modifier = Modifier.fillMaxSize()
    )
}

@Suppress("DEPRECATION")
private class PpgCameraController(
    val context: Context,
    val lensFacing: Int,
    val progress: (CameraPpgProgress) -> Unit,
    val done: (ScreeningPpg) -> Unit,
    val error: (String) -> Unit
) {
    private companion object { const val MAX_MEASUREMENT_MS = 35_000L }
    private val handler = Handler(Looper.getMainLooper())
    private var camera: CameraDevice? = null
    private var session: CameraCaptureSession? = null
    private var surface: Surface? = null
    private var active = true
    private var opened = false
    private val signal = CameraPpgSignal()
    private val timeout = Runnable {
        fail("Chưa thu được tín hiệu đủ chất lượng. Hãy đo lại bằng camera sau và flash, che kín ống kính trong 20 giây.")
    }

    fun close() {
        active = false
        handler.removeCallbacks(timeout)
        session?.close()
        session = null
        camera?.close()
        camera = null
        surface?.release()
        surface = null
    }

    private fun fail(message: String) {
        if (active) {
            close()
            error(message)
        }
    }

    fun attach(view: TextureView) {
        view.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
            override fun onSurfaceTextureAvailable(texture: SurfaceTexture, width: Int, height: Int) = open(texture)
            override fun onSurfaceTextureSizeChanged(texture: SurfaceTexture, width: Int, height: Int) {}
            override fun onSurfaceTextureDestroyed(texture: SurfaceTexture): Boolean {
                close()
                return true
            }
            override fun onSurfaceTextureUpdated(texture: SurfaceTexture) {
                if (!active) return
                val bitmap = view.getBitmap(32, 32) ?: return
                try {
                    val pixels = IntArray(32 * 32)
                    bitmap.getPixels(pixels, 0, 32, 0, 0, 32, 32)
                    val red = pixels.sumOf { (it shr 16 and 255).toDouble() } / pixels.size
                    val green = pixels.sumOf { (it shr 8 and 255).toDouble() } / pixels.size
                    val time = SystemClock.elapsedRealtime()
                    val state = signal.progress(time, red, green)
                    progress(state)
                    val bpm = signal.add(time, red, green)
                    if (bpm != null) {
                        val reading = ScreeningPpg(bpm, signal.duration, Instant.now().toString())
                        close()
                        done(reading)
                    } else if (signal.duration >= MAX_MEASUREMENT_MS) {
                        fail("Tín hiệu chưa đủ để tính nhịp tim sau 30 giây. Hãy đo lại bằng camera sau và flash hoặc bỏ qua; không có số đo được lưu.")
                    }
                } finally {
                    bitmap.recycle()
                }
            }
        }
        if (view.isAvailable) view.surfaceTexture?.let(::open)
    }

    @SuppressLint("MissingPermission")
    private fun open(texture: SurfaceTexture) {
        if (opened || !active) return
        opened = true
        handler.postDelayed(timeout, 35_000)
        try {
            val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            val id = manager.cameraIdList.firstOrNull {
                manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING) == lensFacing
            } ?: return fail("Thiết bị không có camera sau phù hợp. Bạn có thể bỏ qua phép đo.")

            val characteristics = manager.getCameraCharacteristics(id)
            val size = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
                ?.getOutputSizes(SurfaceTexture::class.java)
                ?.minByOrNull { kotlin.math.abs(it.width * it.height - 640 * 480) }
                ?: return fail("Camera không hỗ trợ phép đo này.")

            texture.setDefaultBufferSize(size.width, size.height)
            surface = Surface(texture)

            manager.openCamera(id, object : CameraDevice.StateCallback() {
                override fun onOpened(device: CameraDevice) {
                    if (!active) { device.close(); return }
                    camera = device
                    try {
                        val target = surface ?: return
                        device.createCaptureSession(listOf(target), object : CameraCaptureSession.StateCallback() {
                            override fun onConfigured(configured: CameraCaptureSession) {
                                if (!active) { configured.close(); return }
                                session = configured
                                try {
                                    val request = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW).apply {
                                        addTarget(target)
                                        set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO)
                                        if (lensFacing == CameraCharacteristics.LENS_FACING_BACK && characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true) {
                                            set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
                                        }
                                    }
                                    configured.setRepeatingRequest(request.build(), null, handler)
                                } catch (_: Exception) {
                                    fail("Camera bị gián đoạn. Vui lòng thử lại.")
                                }
                            }
                            override fun onConfigureFailed(configured: CameraCaptureSession) {
                                configured.close()
                                fail("Không cấu hình được camera. Vui lòng bỏ qua hoặc thử lại.")
                            }
                        }, handler)
                    } catch (_: Exception) {
                        fail("Không mở được luồng camera.")
                    }
                }
                override fun onDisconnected(device: CameraDevice) {
                    device.close()
                    fail("Camera đã ngắt kết nối.")
                }
                override fun onError(device: CameraDevice, code: Int) {
                    device.close()
                    fail("Camera đang bận hoặc không khả dụng.")
                }
            }, handler)
        } catch (_: Exception) {
            fail("Không truy cập được camera. Kiểm tra quyền truy cập hoặc bỏ qua bước này.")
        }
    }
}
