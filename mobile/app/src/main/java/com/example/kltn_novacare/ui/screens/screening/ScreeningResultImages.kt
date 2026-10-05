package com.example.kltn_novacare.ui.screens.screening

import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.ScreeningImageAssessment
import com.example.kltn_novacare.ui.viewmodel.ScreeningImage

@Composable
fun ScreeningResultImages(images: List<ScreeningImage>, assessments: List<ScreeningImageAssessment>?) {
    var expanded by remember { mutableStateOf<ScreeningImage?>(null) }
    images.forEachIndexed { index, image ->
        val assessment = assessments?.find { it.imageIndex == index }
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Ảnh ${index + 1} • Chạm để phóng to", style = MaterialTheme.typography.titleSmall)
                AsyncImage(model = image.file, contentDescription = "Ảnh đã gửi ${index + 1}",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxWidth().height(200.dp).clickable { expanded = image })
                assessment?.observations.orEmpty().forEach { Text("• $it") }
                if (assessment?.observations.isNullOrEmpty()) Text(when (assessment?.status) {
                    "FAILED" -> "Phân tích ảnh chưa thành công."
                    "LOW_QUALITY_OR_UNRELATED" -> "Ảnh chưa đủ rõ hoặc chưa phù hợp với vùng đã chọn."
                    "ANALYZED" -> "Chưa ghi nhận quan sát cụ thể từ ảnh này."
                    else -> "Chưa có quan sát riêng cho ảnh này."
                })
            }
        }
    }
    expanded?.let { image ->
        var scale by remember(image) { mutableFloatStateOf(1f) }
        AlertDialog(onDismissRequest = { expanded = null },
            title = { Text("Ảnh đã gửi • Chụm hai ngón để thu/phóng") },
            text = { AsyncImage(model = image.file, contentDescription = "Ảnh gốc đã gửi", contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxWidth().height(380.dp)
                    .pointerInput(image) { detectTransformGestures { _, _, zoom, _ -> scale = (scale * zoom).coerceIn(1f, 4f) } }
                    .graphicsLayer { scaleX = scale; scaleY = scale; clip = true }) },
            confirmButton = { TextButton(onClick = { expanded = null }) { Text("Đóng") } })
    }
}
