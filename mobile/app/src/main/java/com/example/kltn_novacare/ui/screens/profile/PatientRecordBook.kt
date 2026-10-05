package com.example.kltn_novacare.ui.screens.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.kltn_novacare.data.model.Appointment
import com.example.kltn_novacare.data.repository.AppointmentRepository
import com.example.kltn_novacare.ui.screens.appointment.AppointmentMedicalActions
import com.example.kltn_novacare.ui.screens.booking.ConsentManagement

@Composable
fun PatientRecordBook(profileId: String, name: String, onDismiss: () -> Unit) {
    var records by remember { mutableStateOf<List<Appointment>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var reload by remember { mutableIntStateOf(0) }
    LaunchedEffect(profileId, reload) {
        loading = true; error = null
        AppointmentRepository().getAppointmentHistory().fold(
            { records = it.filter { a -> a.patientProfileId == profileId && a.medicalEncounter != null } },
            { error = it.message })
        loading = false
    }
    AlertDialog(onDismissRequest = onDismiss, title = { Text("Sổ sức khỏe • $name") }, text = {
        Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            if (!loading && records.isEmpty()) Text("Chưa có bệnh án được trả về.")
            records.forEach { appointment ->
                Text("${appointment.medicalEncounter?.encounterDate?.substringBefore('T').orEmpty()} • ${appointment.slot?.doctorWorkplace?.hospital?.name.orEmpty()}")
                AppointmentMedicalActions(appointment, onRefresh = { reload++ })
                HorizontalDivider()
            }
            Text("Quyền chia sẻ hồ sơ", style = MaterialTheme.typography.titleMedium)
            ConsentManagement(profileId)
        }
    }, confirmButton = { TextButton(onClick = onDismiss) { Text("Đóng") } },
        dismissButton = { TextButton(onClick = { reload++ }) { Text("Làm mới") } })
}
