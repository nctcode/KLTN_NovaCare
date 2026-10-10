package com.example.kltn_novacare.ui.screens.consultation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.Consultation
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.PrimaryDark
import com.example.kltn_novacare.ui.theme.PrimaryLight
import com.twilio.audioswitch.AudioDevice

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AudioDevicePickerSheet(
    availableDevices: List<AudioDevice>,
    selectedDevice: AudioDevice?,
    onSelectDevice: (AudioDevice) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1E2824),
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .navigationBarsPadding()
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = "Đầu ra âm thanh",
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (availableDevices.isEmpty()) {
                Text(
                    text = "Không tìm thấy thiết bị âm thanh bổ sung",
                    color = Color(0xB3FFFFFF),
                    fontSize = 13.sp,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            } else {
                availableDevices.forEach { device ->
                    val isSelected = selectedDevice == device
                    val (label, icon) = when (device) {
                        is AudioDevice.Speakerphone -> "Loa ngoài (Speaker)" to Icons.AutoMirrored.Filled.VolumeUp
                        is AudioDevice.Earpiece -> "Loa trong (Tai nghe thoại)" to Icons.Default.Hearing
                        is AudioDevice.BluetoothHeadset -> "Tai nghe Bluetooth" to Icons.Default.BluetoothAudio
                        is AudioDevice.WiredHeadset -> "Tai nghe có dây" to Icons.Default.Headset
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                onSelectDevice(device)
                                onDismiss()
                            }
                            .padding(vertical = 12.dp, horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = if (isSelected) Primary else Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(14.dp))
                            Text(
                                text = label,
                                color = if (isSelected) Primary else Color.White,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 14.sp
                            )
                        }

                        if (isSelected) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Đang chọn",
                                tint = Primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0x33FFFFFF)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Đóng", color = Color.White)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConsultationDetailsSheet(
    consultation: Consultation?,
    onOpenChat: () -> Unit,
    onLeaveCall: () -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1E2824),
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .navigationBarsPadding()
                .padding(bottom = 24.dp)
        ) {
            // Header
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF283630)),
                    contentAlignment = Alignment.Center
                ) {
                    if (!consultation?.doctor?.avatarUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = consultation?.doctor?.avatarUrl,
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = Primary,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column {
                    val doctor = consultation?.doctor
                    val name = if (doctor != null) {
                        listOfNotNull(doctor.title, doctor.fullName).joinToString(" ")
                    } else "Bác sĩ phụ trách"

                    Text(
                        text = name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Color.White
                    )
                    Text(
                        text = consultation?.doctorWorkplace?.specialty?.name ?: "Tư vấn từ xa",
                        color = Color(0xFF6EE7B7),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = consultation?.doctorWorkplace?.hospital?.name ?: "NovaCare Telemedicine",
                        color = Color(0xB3FFFFFF),
                        fontSize = 12.sp
                    )
                }
            }

            HorizontalDivider(Modifier.padding(vertical = 16.dp), color = Color(0x33FFFFFF))

            // Details card
            Surface(
                color = Color(0xFF141C18),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color(0x26FFFFFF))
            ) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Bệnh nhân", color = Color(0x99FFFFFF), fontSize = 12.sp)
                        Text(
                            consultation?.patientProfile?.fullName ?: "Bệnh nhân",
                            color = Color.White,
                            fontWeight = FontWeight.Medium,
                            fontSize = 12.sp
                        )
                    }

                    if (consultation?.appointment?.bookingCode != null) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Mã đặt lịch", color = Color(0x99FFFFFF), fontSize = 12.sp)
                            Text(
                                "#${consultation.appointment.bookingCode}",
                                color = Primary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }

                    if (consultation?.topic != null && consultation.topic.isNotBlank()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Chủ đề tư vấn", color = Color(0x99FFFFFF), fontSize = 12.sp)
                            Text(
                                consultation.topic,
                                color = Color.White,
                                fontWeight = FontWeight.Medium,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Privacy Notice
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0x1A10A66A))
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Outlined.Shield,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Cuộc gọi được mã hóa và bảo mật y tế. Không ghi hình tự động.",
                    color = Color(0xFFD1FAE5),
                    fontSize = 11.sp
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Action: Mở chat
            OutlinedButton(
                onClick = {
                    onDismiss()
                    onOpenChat()
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                border = BorderStroke(1.dp, Color(0x4DFFFFFF))
            ) {
                Icon(Icons.AutoMirrored.Outlined.Chat, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Mở khung trò chuyện", fontWeight = FontWeight.SemiBold)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Action: Rời cuộc gọi
            Button(
                onClick = {
                    onDismiss()
                    onLeaveCall()
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.CallEnd, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Rời phòng tư vấn", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
fun EndCallConfirmDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1E2824),
        titleContentColor = Color.White,
        textContentColor = Color(0xCCFFFFFF),
        title = {
            Text("Kết thúc cuộc tư vấn?", fontWeight = FontWeight.Bold)
        },
        text = {
            Text(
                "Bạn có chắc chắn muốn rời khỏi phòng tư vấn video với bác sĩ không? Lịch hẹn vẫn được lưu giữ trong danh sách tư vấn của bạn."
            )
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Kết thúc", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Tiếp tục tư vấn", color = Color.White)
            }
        }
    )
}
