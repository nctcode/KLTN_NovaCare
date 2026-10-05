package com.example.kltn_novacare.ui.screens.appointment

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
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
        QRCodeDraw(payload)
        TextButton(onClick = { showQr = true }) { Text("Phóng to QR phiếu khám") }
        TextButton(onClick = { clipboard.setText(AnnotatedString(appointment.bookingCode)) }) { Text("Sao chép mã ${appointment.bookingCode}") }
    }
    if (encounter != null) Button(onClick = { showRecord = true }) { Text("Xem bệnh án") }
    if (BuildConfig.DEBUG && encounter == null && appointment.status in listOf("CONFIRMED", "PAID")) {
        OutlinedButton(enabled = !busy, onClick = { confirm = true }) { Text(if (busy) "Đang tạo bệnh án…" else "Mô phỏng hoàn tất khám") }
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
