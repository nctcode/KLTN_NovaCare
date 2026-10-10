package com.example.kltn_novacare.ui.screens.consultation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.ui.viewmodel.VideoCallState
import com.twilio.audioswitch.AudioDevice

@Composable
fun VideoControlBar(
    state: VideoCallState,
    onToggleMicrophone: () -> Unit,
    onToggleCamera: () -> Unit,
    onSwitchCamera: () -> Unit,
    onAudioRouteClick: () -> Unit,
    onOpenChat: () -> Unit,
    onEndCallClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color.Transparent,
                        Color(0xB3000000),
                        Color(0xF2050A08)
                    )
                )
            )
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Main Controls Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 1. Microphone
                CallControlButton(
                    icon = if (state.microphone) Icons.Default.Mic else Icons.Default.MicOff,
                    label = if (state.microphone) "Micro" else "Đã tắt",
                    isActive = state.microphone,
                    isMuted = !state.microphone,
                    onClick = onToggleMicrophone
                )

                // 2. Camera
                CallControlButton(
                    icon = if (state.camera) Icons.Default.Videocam else Icons.Default.VideocamOff,
                    label = if (state.camera) "Camera" else "Đã tắt",
                    isActive = state.camera,
                    isMuted = !state.camera,
                    onClick = onToggleCamera
                )

                // 3. Switch Camera
                CallControlButton(
                    icon = Icons.Default.Cameraswitch,
                    label = "Đổi camera",
                    isActive = true,
                    enabled = state.camera,
                    onClick = onSwitchCamera
                )

                // 4. Audio output device
                val audioIcon = when (state.selectedAudioDevice) {
                    is AudioDevice.BluetoothHeadset -> Icons.Default.BluetoothAudio
                    is AudioDevice.WiredHeadset -> Icons.Default.Headset
                    is AudioDevice.Earpiece -> Icons.Default.Hearing
                    else -> Icons.AutoMirrored.Filled.VolumeUp
                }
                val audioLabel = when (state.selectedAudioDevice) {
                    is AudioDevice.BluetoothHeadset -> "Bluetooth"
                    is AudioDevice.WiredHeadset -> "Tai nghe"
                    is AudioDevice.Earpiece -> "Loa thoại"
                    else -> "Loa ngoài"
                }

                CallControlButton(
                    icon = audioIcon,
                    label = audioLabel,
                    isActive = true,
                    onClick = onAudioRouteClick
                )

                // 5. Open Chat
                CallControlButton(
                    icon = Icons.AutoMirrored.Outlined.Chat,
                    label = "Nhắn tin",
                    isActive = true,
                    onClick = onOpenChat
                )
            }

            // End Call Button (Centered Red Button)
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(bottom = 6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFDC2626))
                        .clickable(onClick = onEndCallClick),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CallEnd,
                        contentDescription = "Kết thúc cuộc gọi",
                        tint = Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Kết thúc cuộc tư vấn",
                    color = Color(0xB3FFFFFF),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun CallControlButton(
    icon: ImageVector,
    label: String,
    isActive: Boolean,
    isMuted: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    val bgColor = when {
        !enabled -> Color(0x1AFFFFFF)
        isMuted -> Color(0xFFE5484D)
        else -> Color(0x33FFFFFF)
    }

    val iconColor = when {
        !enabled -> Color(0x4DFFFFFF)
        else -> Color.White
    }

    val labelColor = when {
        !enabled -> Color(0x4DFFFFFF)
        isMuted -> Color(0xFFFCA5A5)
        else -> Color(0xB3FFFFFF)
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .width(62.dp)
            .clickable(enabled = enabled, onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(bgColor),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = iconColor,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(5.dp))

        Text(
            text = label,
            color = labelColor,
            fontSize = 11.sp,
            maxLines = 1,
            fontWeight = FontWeight.Medium
        )
    }
}
