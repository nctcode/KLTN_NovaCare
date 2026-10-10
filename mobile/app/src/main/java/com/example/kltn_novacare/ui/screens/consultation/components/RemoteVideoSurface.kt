package com.example.kltn_novacare.ui.screens.consultation.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material.icons.outlined.HourglassEmpty
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.AsyncImage
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.viewmodel.VideoCallState
import io.livekit.android.renderer.TextureViewRenderer
import io.livekit.android.room.Room
import io.livekit.android.room.track.VideoTrack

@Composable
fun RemoteVideoSurface(
    room: Room,
    state: VideoCallState,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF101513)),
        contentAlignment = Alignment.Center
    ) {
        val remoteVideo = state.remoteVideo
        if (remoteVideo != null) {
            // Live remote video stream
            LiveKitVideoTrackView(
                room = room,
                track = remoteVideo,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            // Fallback: Doctor camera off or doctor hasn't joined
            val consultation = state.consultation
            val doctor = consultation?.doctor
            val doctorName = if (doctor != null) {
                listOfNotNull(doctor.title, doctor.fullName).joinToString(" ")
            } else {
                "Bác sĩ chuyên khoa"
            }
            val specialty = consultation?.doctorWorkplace?.specialty?.name ?: "Tư vấn từ xa"

            if (state.remotePresent) {
                // Doctor is connected, but camera is off
                DoctorCameraOffView(
                    avatarUrl = doctor?.avatarUrl,
                    doctorName = doctorName,
                    specialty = specialty
                )
            } else {
                // Doctor has not joined yet
                WaitingForDoctorView(
                    avatarUrl = doctor?.avatarUrl,
                    doctorName = doctorName,
                    specialty = specialty
                )
            }
        }
    }
}

@Composable
private fun DoctorCameraOffView(
    avatarUrl: String?,
    doctorName: String,
    specialty: String
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(110.dp)
                .clip(CircleShape)
                .background(Color(0xFF1E2824))
                .border(2.dp, Color(0x33FFFFFF), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (!avatarUrl.isNullOrBlank()) {
                AsyncImage(
                    model = avatarUrl,
                    contentDescription = doctorName,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = Color(0xFF6EE7B7),
                    modifier = Modifier.size(56.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        Text(
            text = doctorName,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = specialty,
            color = Color(0xB3FFFFFF),
            fontSize = 13.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Badge: Camera đang tắt
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0x33000000))
                .border(1.dp, Color(0x26FFFFFF), RoundedCornerShape(20.dp))
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.VideocamOff,
                contentDescription = null,
                tint = Color(0xFFF87171),
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Camera của bác sĩ đang tắt",
                color = Color(0xFFE2E8F0),
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Tín hiệu âm thanh vẫn đang kết nối bình thường",
            color = Color(0x80FFFFFF),
            fontSize = 11.sp,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun WaitingForDoctorView(
    avatarUrl: String?,
    doctorName: String,
    specialty: String
) {
    val infiniteTransition = rememberInfiniteTransition(label = "halo")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size((110 * pulseScale).dp)
                .clip(CircleShape)
                .background(Color(0xFF162520))
                .border(2.dp, Primary.copy(alpha = 0.6f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (!avatarUrl.isNullOrBlank()) {
                AsyncImage(
                    model = avatarUrl,
                    contentDescription = doctorName,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.size(54.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = doctorName,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = specialty,
            color = Color(0xB3FFFFFF),
            fontSize = 13.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Waiting badge
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0x33000000))
                .border(1.dp, Color(0x3310A66A), RoundedCornerShape(20.dp))
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.HourglassEmpty,
                contentDescription = null,
                tint = Primary,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Đang chờ bác sĩ tham gia phòng tư vấn...",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = "Bạn có thể kiểm tra hình ảnh camera và micro ở khung hình bên dưới trong lúc chờ.",
            color = Color(0x80FFFFFF),
            fontSize = 11.sp,
            textAlign = TextAlign.Center,
            lineHeight = 16.sp
        )
    }
}

@Composable
fun LiveKitVideoTrackView(
    room: Room,
    track: VideoTrack,
    modifier: Modifier = Modifier
) {
    key(track) {
        AndroidView(
            modifier = modifier,
            factory = { context ->
                TextureViewRenderer(context).also { renderer ->
                    room.initVideoRenderer(renderer)
                    track.addRenderer(renderer)
                }
            },
            onRelease = { renderer ->
                track.removeRenderer(renderer)
                renderer.release()
            }
        )
    }
}
