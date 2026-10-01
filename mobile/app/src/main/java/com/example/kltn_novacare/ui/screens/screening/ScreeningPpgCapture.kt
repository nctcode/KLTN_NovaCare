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
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.example.kltn_novacare.data.model.ScreeningPpg
import com.example.kltn_novacare.domain.service.CameraPpgSignal
import java.time.Instant

@Composable
fun ScreeningPpgCapture(onResult: (ScreeningPpg?) -> Unit, onError: (String) -> Unit) {
    var running by remember { mutableStateOf(false) }
    var lensFacing by rememberSaveable { mutableIntStateOf(CameraCharacteristics.LENS_FACING_BACK) }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        if (it) { onResult(null); running = true } else onError("Chưa có quyền camera. Bạn có thể bỏ qua phép đo.")
    }
    Text(
        if (lensFacing == CameraCharacteristics.LENS_FACING_BACK)
            "Đặt nhẹ đầu ngón tay che camera sau và đèn flash. Giữ yên ít nhất 20 giây; dừng nếu thấy nóng hoặc khó chịu."
        else
            "Dùng camera trước trong nơi đủ sáng và giữ yên. Camera trước không dùng flash, nên phép đo có thể không đủ chất lượng.",
        style = MaterialTheme.typography.bodySmall,
    )
    if (running) {
        PpgCamera(lensFacing = lensFacing, onResult = { running = false; onResult(it) }, onError = { running = false; onError(it) }, onStop = { running = false })
        TextButton(onClick = { running = false; onResult(null) }) { Text("Dừng phép đo") }
    } else {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = lensFacing == CameraCharacteristics.LENS_FACING_BACK,
                onClick = { lensFacing = CameraCharacteristics.LENS_FACING_BACK },
                label = { Text("Camera sau") },
            )
            FilterChip(
                selected = lensFacing == CameraCharacteristics.LENS_FACING_FRONT,
                onClick = { lensFacing = CameraCharacteristics.LENS_FACING_FRONT },
                label = { Text("Camera trước") },
            )
        }
        OutlinedButton(onClick = { permission.launch(Manifest.permission.CAMERA) }) { Text("Bắt đầu đo / đo lại") }
    }
}

@Composable
private fun PpgCamera(lensFacing: Int, onResult: (ScreeningPpg) -> Unit, onError: (String) -> Unit, onStop: () -> Unit) {
    val context = LocalContext.current
    val owner = LocalLifecycleOwner.current
    val result by rememberUpdatedState(onResult)
    val error by rememberUpdatedState(onError)
    val stop by rememberUpdatedState(onStop)
    var seconds by remember { mutableIntStateOf(0) }
    val controller = remember(lensFacing) { PpgCameraController(context.applicationContext, lensFacing, { seconds = (it / 1000).toInt() }, { result(it) }, { error(it) }) }
    DisposableEffect(owner, controller) {
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_STOP) { controller.close(); stop() } }
        owner.lifecycle.addObserver(observer)
        onDispose { owner.lifecycle.removeObserver(observer); controller.close() }
    }
    AndroidView(factory = { TextureView(it).also(controller::attach) }, modifier = Modifier.fillMaxWidth().height(170.dp))
    LinearProgressIndicator(progress = { (seconds / 30f).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth())
    Text(if (seconds == 0) "Đang tìm tín hiệu từ ngón tay…" else "Tín hiệu liên tục: ${seconds}s / 30s • đang kiểm tra chất lượng")
}

@Suppress("DEPRECATION")
private class PpgCameraController(val context: Context, val lensFacing: Int, val progress: (Long) -> Unit, val done: (ScreeningPpg) -> Unit, val error: (String) -> Unit) {
    private companion object { const val MAX_MEASUREMENT_MS = 30_000L }
    private val handler = Handler(Looper.getMainLooper())
    private var camera: CameraDevice? = null
    private var session: CameraCaptureSession? = null
    private var surface: Surface? = null
    private var active = true
    private var opened = false
    private val signal = CameraPpgSignal()
    private val timeout = Runnable { fail("Chưa thu được tín hiệu đủ chất lượng trong 30 giây. Hãy đo lại bằng camera sau và flash hoặc bỏ qua; không có số đo được lưu.") }
    fun close() { active = false; handler.removeCallbacks(timeout); session?.close(); session = null; camera?.close(); camera = null; surface?.release(); surface = null }
    private fun fail(message: String) { if (active) { close(); error(message) } }
    fun attach(view: TextureView) {
        view.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
            override fun onSurfaceTextureAvailable(texture: SurfaceTexture, width: Int, height: Int) = open(texture)
            override fun onSurfaceTextureSizeChanged(texture: SurfaceTexture, width: Int, height: Int) {}
            override fun onSurfaceTextureDestroyed(texture: SurfaceTexture): Boolean { close(); return true }
            override fun onSurfaceTextureUpdated(texture: SurfaceTexture) {
                if (!active) return
                val bitmap = view.getBitmap(32, 32) ?: return
                try {
                    val pixels = IntArray(32 * 32); bitmap.getPixels(pixels, 0, 32, 0, 0, 32, 32)
                    val red = pixels.sumOf { (it shr 16 and 255).toDouble() } / pixels.size
                    val green = pixels.sumOf { (it shr 8 and 255).toDouble() } / pixels.size
                    val bpm = signal.add(SystemClock.elapsedRealtime(), red, green)
                    progress(signal.duration)
                    if (bpm != null) { val reading = ScreeningPpg(bpm, signal.duration, Instant.now().toString()); close(); done(reading) }
                    else if (signal.duration >= MAX_MEASUREMENT_MS) fail("Tín hiệu chưa đủ để tính nhịp tim sau 30 giây. Hãy đo lại bằng camera sau và flash hoặc bỏ qua; không có số đo được lưu.")
                } finally { bitmap.recycle() }
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
            val id = manager.cameraIdList.firstOrNull { manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING) == lensFacing }
                ?: return fail("Thiết bị không có camera sau phù hợp. Bạn có thể bỏ qua phép đo.")
            val characteristics = manager.getCameraCharacteristics(id)
            val size = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)?.getOutputSizes(SurfaceTexture::class.java)?.minByOrNull { kotlin.math.abs(it.width * it.height - 640 * 480) }
                ?: return fail("Camera không hỗ trợ phép đo này.")
            texture.setDefaultBufferSize(size.width, size.height)
            surface = Surface(texture)
            manager.openCamera(id, object : CameraDevice.StateCallback() {
                override fun onOpened(device: CameraDevice) {
                    if (!active) { device.close(); return }; camera = device
                    try {
                        val target = surface ?: return
                        device.createCaptureSession(listOf(target), object : CameraCaptureSession.StateCallback() {
                            override fun onConfigured(configured: CameraCaptureSession) {
                                if (!active) { configured.close(); return }; session = configured
                                try {
                                    val request = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW).apply {
                                        addTarget(target)
                                        set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO)
                                        if (lensFacing == CameraCharacteristics.LENS_FACING_BACK && characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true)
                                            set(CaptureRequest.FLASH_MODE, CaptureRequest.FLASH_MODE_TORCH)
                                    }
                                    configured.setRepeatingRequest(request.build(), null, handler)
                                } catch (_: Exception) { fail("Camera bị gián đoạn. Vui lòng thử lại.") }
                            }
                            override fun onConfigureFailed(configured: CameraCaptureSession) { configured.close(); fail("Không cấu hình được camera. Vui lòng bỏ qua hoặc thử lại.") }
                        }, handler)
                    } catch (_: Exception) { fail("Không mở được luồng camera.") }
                }
                override fun onDisconnected(device: CameraDevice) { device.close(); fail("Camera đã ngắt kết nối.") }
                override fun onError(device: CameraDevice, code: Int) { device.close(); fail("Camera đang bận hoặc không khả dụng.") }
            }, handler)
        } catch (_: Exception) { fail("Không truy cập được camera. Kiểm tra quyền truy cập hoặc bỏ qua bước này.") }
    }
}
