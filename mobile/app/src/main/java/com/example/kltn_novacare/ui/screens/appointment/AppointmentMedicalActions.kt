package com.example.kltn_novacare.ui.screens.appointment

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.BuildConfig
import com.example.kltn_novacare.data.model.Appointment
import com.example.kltn_novacare.data.remote.*
import com.example.kltn_novacare.ui.components.QRCodeDraw
import com.google.gson.JsonObject
import kotlinx.coroutines.launch

internal fun JsonObject.text(key: String): String = get(key)?.takeUnless { it.isJsonNull }?.asString.orEmpty()

@Composable
fun AppointmentMedicalActions(appointment: Appointment, onRefresh: () -> Unit) {
    var confirm by remember { mutableStateOf(false) }
    var showRecord by remember { mutableStateOf(false) }
    var showQr by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val clipboard = LocalClipboardManager.current
    val encounter = appointment.medicalEncounter
    val workplace = appointment.workplace ?: appointment.slot?.doctorWorkplace
    val payload = remember(appointment) { JsonObject().apply {
        addProperty("bookingCode", appointment.bookingCode)
        addProperty("patientName", appointment.patientProfile?.fullName)
        addProperty("doctorName", workplace?.doctor?.fullName)
        addProperty("hospitalName", workplace?.hospital?.name)
        addProperty("startTime", appointment.slot?.startTime)
    }.toString() }
    if (appointment.status in listOf("CONFIRMED", "PAID")) {
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 14.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(108.dp).background(Color.White, RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) { QRCodeDraw(payload, Modifier.size(100.dp)) }
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.QrCode2, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Mã tiếp nhận", color = Color(0xFF475569), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Text(appointment.bookingCode, color = Color(0xFF0F172A), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 4.dp))
                    Text("Xuất trình tại quầy tiếp đón", color = Color(0xFF64748B), fontSize = 11.sp, lineHeight = 15.sp, modifier = Modifier.padding(top = 3.dp))
                    Row(Modifier.padding(top = 7.dp)) {
                        TextButton(onClick = { showQr = true }, contentPadding = PaddingValues(horizontal = 0.dp)) { Text("Phóng to", color = Color(0xFF047857), fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                        Spacer(Modifier.width(12.dp))
                        TextButton(onClick = { clipboard.setText(AnnotatedString(appointment.bookingCode)) }, contentPadding = PaddingValues(horizontal = 0.dp)) {
                            Icon(Icons.Default.ContentCopy, contentDescription = null, tint = Color(0xFF047857), modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Sao chép", color = Color(0xFF047857), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
    if (encounter != null) Button(
        onClick = { showRecord = true },
        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).height(48.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
    ) {
        Icon(Icons.Default.Description, contentDescription = null)
        Spacer(Modifier.width(8.dp))
        Text("Xem hồ sơ khám bệnh", fontWeight = FontWeight.Bold)
    }
    if (BuildConfig.DEBUG && encounter == null && appointment.status in listOf("CONFIRMED", "PAID")) {
        OutlinedButton(
            enabled = !busy,
            onClick = { confirm = true },
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).height(44.dp),
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, Color(0xFFCBD5E1))
        ) { Text(if (busy) "Đang tạo dữ liệu mô phỏng…" else "Mô phỏng hoàn tất khám", color = Color(0xFF475569), fontSize = 12.sp) }
    }
    error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    if (showQr) AlertDialog(onDismissRequest = { showQr = false }, title = { Text(appointment.bookingCode) },
        text = { QRCodeDraw(payload, Modifier.size(280.dp)) }, confirmButton = { TextButton(onClick = { showQr = false }) { Text("Đóng") } })
    if (confirm) AlertDialog(onDismissRequest = { confirm = false }, title = { Text("Tạo bệnh án mô phỏng?") },
        text = { Text("Dữ liệu sinh tự động phục vụ thử nghiệm, không phải kết quả khám thực tế.") },
        confirmButton = { Button(onClick = {
            confirm = false; busy = true; error = null
            scope.launch {
                healthApiResult("Không thể mô phỏng hoàn tất khám", { ApiClient.getService().mockFulfill(appointment.id) }) { it.data }
                    .fold(onSuccess = { onRefresh() }, onFailure = { error = it.message })
                busy = false
            }
        }) { Text("Xác nhận mô phỏng") } }, dismissButton = { TextButton(onClick = { confirm = false }) { Text("Hủy") } })
    if (showRecord && encounter != null) {
        MedicalRecordDetailSheet(
            encounter = encounter,
            appointment = appointment,
            onDismiss = { showRecord = false }
        )
    }
}
