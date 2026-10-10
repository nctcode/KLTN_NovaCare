package com.example.kltn_novacare.ui.screens.consultation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cameraswitch
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.viewmodel.VideoCallState
import io.livekit.android.room.Room
import kotlin.math.roundToInt

@Composable
fun LocalVideoPip(
    room: Room,
    state: VideoCallState,
    onSwitchCamera: () -> Unit,
    modifier: Modifier = Modifier
) {
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }

    Surface(
        modifier = modifier
            .offset { IntOffset(offsetX.roundToInt(), offsetY.roundToInt()) }
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    // Allow dragging across corners within reasonable bounds
                    offsetX = (offsetX + dragAmount.x).coerceIn(-600f, 600f)
                    offsetY = (offsetY + dragAmount.y).coerceIn(-900f, 400f)
                }
            }
            .width(110.dp)
            .height(148.dp)
            .shadow(12.dp, RoundedCornerShape(16.dp))
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF161F1B))
            .border(
                width = 1.5.dp,
                color = if (state.camera) Primary.copy(alpha = 0.8f) else Color(0x33FFFFFF),
                shape = RoundedCornerShape(16.dp)
            ),
        color = Color(0xFF161F1B)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            val localVideo = state.localVideo
            if (state.camera && localVideo != null) {
                // Live user preview
                LiveKitVideoTrackView(
                    room = room,
                    track = localVideo,
                    modifier = Modifier.fillMaxSize()
                )

                // Quick flip camera button at bottom-right
                IconButton(
                    onClick = onSwitchCamera,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(6.dp)
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(Color(0x99000000))
                ) {
                    Icon(
                        imageVector = Icons.Default.Cameraswitch,
                        contentDescription = "Đổi camera",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            } else {
                // User camera is off
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color(0x33000000)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.VideocamOff,
                            contentDescription = null,
                            tint = Color(0xFFA1A1AA),
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Camera tắt",
                        color = Color(0xB3FFFFFF),
                        fontSize = 11.sp
                    )
                }
            }

            // "Bạn" label chip at top-left
            Box(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(6.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0x99000000))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "Bạn",
                    color = Color.White,
                    fontSize = 10.sp
                )
            }
        }
    }
}
