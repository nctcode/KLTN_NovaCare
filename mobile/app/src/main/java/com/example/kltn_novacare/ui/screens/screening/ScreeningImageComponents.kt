package com.example.kltn_novacare.ui.screens.screening

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.ScreeningImage
import java.io.File

@Composable
fun ScreeningImageSection(
    images: List<ScreeningImage>,
    enabled: Boolean,
    isImporting: Boolean,
    consent: Boolean,
    onConsentChange: (Boolean) -> Unit,
    onAddImage: (Uri, File?) -> Unit,
    onRemoveImage: (ScreeningImage) -> Unit,
    onError: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var pendingPath by rememberSaveable { mutableStateOf<String?>(null) }
    var selectedPreviewImage by remember { mutableStateOf<ScreeningImage?>(null) }
    var cameraPermissionDeniedOnce by rememberSaveable { mutableStateOf(false) }

    DisposableEffect(Unit) {
        onDispose {
            if ((context as? android.app.Activity)?.isChangingConfigurations != true) {
                pendingPath?.let { File(it).delete() }
            }
        }
    }

    // Media picker launcher
    val pickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let { onAddImage(it, null) }
    }

    // Camera capture launcher
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        pendingPath?.let { path ->
            val file = File(path)
            if (success) {
                onAddImage(
                    FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.screening.files",
                        file
                    ),
                    file
                )
            } else {
                file.delete()
            }
        }
        pendingPath = null
    }

    // Camera permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            cameraPermissionDeniedOnce = false
            try {
                val folder = File(context.cacheDir, "screening-capture").apply { mkdirs() }
                val file = File.createTempFile("capture-", ".jpg", folder)
                pendingPath = file.absolutePath
                cameraLauncher.launch(
                    FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.screening.files",
                        file
                    )
                )
            } catch (e: Exception) {
                pendingPath?.let { File(it).delete() }
                pendingPath = null
                onError("Không mở được camera. Bạn có thể chọn ảnh từ thư viện.")
            }
        } else {
            cameraPermissionDeniedOnce = true
            onError("Chưa có quyền camera. Bạn có thể chọn ảnh từ thư viện hoặc mở cài đặt.")
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
            title = "Đồng ý xử lý ảnh y tế bằng AI",
            description = "Ảnh chỉ được gửi đến hệ thống AI để phân tích trong phiên này và không tự động lưu vào hồ sơ công khai."
        )

        // Main Image Upload Card
        ScreeningSectionCard(
            title = "3. Ảnh tổn thương (tùy chọn)",
            subtitle = "Tối đa 3 ảnh JPEG/PNG/WebP, mỗi ảnh <= 5 MB. Áp dụng cho tổn thương ngoài da nhìn thấy được.",
            icon = Icons.Outlined.CameraAlt,
            badgeText = "${images.size}/3 ảnh",
            badgeColor = if (images.isNotEmpty()) PrimaryDark else TextMuted
        ) {
            // Guide Note
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
                        text = "Chụp rõ nét, đủ ánh sáng và tránh bóng mờ che khuất vị trí tổn thương.",
                        fontSize = 11.sp,
                        color = TextSecondary,
                        lineHeight = 15.sp
                    )
                }
            }

            // Image Grid (Display uploaded images or placeholders)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Render 3 slots
                for (i in 0 until 3) {
                    val image = images.getOrNull(i)
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (image != null) Color.Black else Color(0xFFF1F5F9))
                            .border(
                                BorderStroke(
                                    width = 1.dp,
                                    color = if (image != null) PrimaryBorder else Color(0xFFCBD5E1)
                                ),
                                RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        if (image != null) {
                            // Uploaded Image Thumbnail
                            AsyncImage(
                                model = image.file,
                                contentDescription = "Ảnh ${i + 1}",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clickable { selectedPreviewImage = image }
                            )

                            // Delete button badge
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(4.dp)
                                    .size(24.dp)
                                    .background(Color.Black.copy(alpha = 0.65f), CircleShape)
                                    .clickable(enabled = enabled) { onRemoveImage(image) },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Xóa",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        } else {
                            // Empty slot placeholder
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Image,
                                    contentDescription = null,
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Ảnh ${i + 1}",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                        }
                    }
                }
            }

            // Uploading spinner indicator
            if (isImporting) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = Primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Đang xử lý và kiểm tra dung lượng ảnh...",
                        fontSize = 12.sp,
                        color = PrimaryDark
                    )
                }
            }

            // Action Buttons: Camera & Gallery
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                    enabled = enabled && images.size < 3 && !isImporting,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryDark),
                    border = BorderStroke(1.dp, PrimaryBorder),
                    modifier = Modifier
                        .weight(1f)
                        .height(46.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AddAPhoto,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Chụp ảnh", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = { pickerLauncher.launch("image/*") },
                    enabled = enabled && images.size < 3 && !isImporting,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryDark),
                    border = BorderStroke(1.dp, PrimaryBorder),
                    modifier = Modifier
                        .weight(1f)
                        .height(46.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.PhotoLibrary,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Chọn từ máy", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            // Permission denial notice if camera was denied
            if (cameraPermissionDeniedOnce) {
                PermissionNoticeCard(
                    title = "Quyền truy cập Camera bị từ chối",
                    description = "Để chụp trực tiếp ảnh tổn thương, vui lòng cấp quyền cho camera hoặc bạn có thể chọn ảnh từ thư viện thiết bị.",
                    buttonText = "Yêu cầu lại quyền",
                    onRequestPermission = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                    isPermanentlyDenied = false
                )
            }
        }
    }

    // Full-screen image preview dialog with zoom
    selectedPreviewImage?.let { img ->
        var scale by remember(img) { mutableFloatStateOf(1f) }
        AlertDialog(
            onDismissRequest = { selectedPreviewImage = null },
            shape = RoundedCornerShape(16.dp),
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Xem trước ảnh",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    IconButton(onClick = { selectedPreviewImage = null }) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng")
                    }
                }
            },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(300.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.Black),
                        contentAlignment = Alignment.Center
                    ) {
                        AsyncImage(
                            model = img.file,
                            contentDescription = "Chi tiết ảnh",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier
                                .fillMaxSize()
                                .pointerInput(img) {
                                    detectTransformGestures { _, _, zoom, _ ->
                                        scale = (scale * zoom).coerceIn(1f, 4f)
                                    }
                                }
                                .graphicsLayer {
                                    scaleX = scale
                                    scaleY = scale
                                }
                        )
                    }
                    Text(
                        text = "Chụm 2 ngón tay để phóng to / thu nhỏ ảnh.",
                        fontSize = 11.sp,
                        color = TextMuted
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedPreviewImage = null }) {
                    Text("Đóng", fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}
