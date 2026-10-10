package com.example.kltn_novacare.ui.screens.consultation.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.Consultation
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.viewmodel.VideoCallState
import kotlinx.coroutines.delay

@Composable
fun VideoCallHeader(
    state: VideoCallState,
    onBackClick: () -> Unit,
    onOpenChat: () -> Unit,
    onOpenInfo: () -> Unit,
    modifier: Modifier = Modifier
) {
    val consultation = state.consultation
    val doctor = consultation?.doctor
    val doctorName = if (doctor != null) {
        listOfNotNull(doctor.title, doctor.fullName).joinToString(" ")
    } else {
        "Bác sĩ chuyên khoa"
    }
    val specialty = consultation?.doctorWorkplace?.specialty?.name ?: "Tư vấn từ xa"
    val hospital = consultation?.doctorWorkplace?.hospital?.name

    // Calculate real-time duration
    val durationText = rememberFormattedCallDuration(state.connected, state.connectedAt)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xE60A0F0D),
                        Color(0x990A0F0D),
                        Color.Transparent
                    )
                )
            )
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Back button + Doctor info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f, fill = false)
            ) {
                IconButton(
                    onClick = onBackClick,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color(0x33FFFFFF))
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Quay lại",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = doctorName,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Text(
                        text = if (hospital != null) "$specialty · $hospital" else specialty,
                        color = Color(0xB3FFFFFF),
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Spacer(modifier = Modifier.height(2.dp))

                    // Status line
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        when {
                            state.connected -> {
                                PulsingGreenDot()
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Đang tư vấn",
                                    color = Color(0xFF4ADE80),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "·",
                                    color = Color(0x80FFFFFF),
                                    fontSize = 11.sp
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = durationText,
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            state.reconnecting -> {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFFB923C))
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Đang kết nối lại…",
                                    color = Color(0xFFFB923C),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            state.connecting -> {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(10.dp),
                                    strokeWidth = 1.5.dp,
                                    color = Color(0xFFFBBF24)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Đang kết nối…",
                                    color = Color(0xFFFBBF24),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            else -> {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .clip(CircleShape)
                                        .background(Color(0x80FFFFFF))
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (state.remotePresent) "Bác sĩ đã vào phòng" else "Chờ bác sĩ tham gia",
                                    color = Color(0xB3FFFFFF),
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Right Action buttons
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Chat button
                IconButton(
                    onClick = onOpenChat,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color(0x33FFFFFF))
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Outlined.Chat,
                        contentDescription = "Trò chuyện trong phiên",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                // Info / More button
                IconButton(
                    onClick = onOpenInfo,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(Color(0x33FFFFFF))
                ) {
                    Icon(
                        imageVector = Icons.Default.MoreVert,
                        contentDescription = "Thông tin cuộc tư vấn",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun PulsingGreenDot() {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Box(
        modifier = Modifier
            .size(8.dp)
            .clip(CircleShape)
            .background(Primary.copy(alpha = alpha))
    )
}

@Composable
fun rememberFormattedCallDuration(connected: Boolean, connectedAt: Long?): String {
    var elapsedSeconds by remember(connected, connectedAt) {
        if (!connected || connectedAt == null) mutableLongStateOf(0L)
        else {
            val sec = maxOf(0L, (System.currentTimeMillis() - connectedAt) / 1000L)
            mutableLongStateOf(sec)
        }
    }

    LaunchedEffect(connected, connectedAt) {
        if (!connected || connectedAt == null) {
            elapsedSeconds = 0L
            return@LaunchedEffect
        }
        while (true) {
            val sec = maxOf(0L, (System.currentTimeMillis() - connectedAt) / 1000L)
            elapsedSeconds = sec
            delay(1000)
        }
    }

    val hours = elapsedSeconds / 3600
    val minutes = (elapsedSeconds % 3600) / 60
    val seconds = elapsedSeconds % 60

    return if (hours > 0) {
        String.format("%02d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format("%02d:%02d", minutes, seconds)
    }
}
