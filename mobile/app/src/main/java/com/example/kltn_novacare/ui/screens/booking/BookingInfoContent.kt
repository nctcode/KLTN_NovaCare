package com.example.kltn_novacare.ui.screens.booking

import android.app.DatePickerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.repository.DoctorRepository
import com.example.kltn_novacare.ui.viewmodel.*
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

fun isBookableSlot(slot: AppointmentSlot, date: String, now: Instant = Instant.now()): Boolean {
    val starts = runCatching { Instant.parse(slot.startTime) }.getOrElse {
        runCatching { LocalDate.parse(date).atTime(LocalTime.parse(slot.startTime)).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant() }.getOrNull()
    } ?: return false
    return slot.id.isNotBlank() && slot.capacity > slot.bookedCount && slot.isActive != false &&
        slot.isAvailable != false && (slot.status == null || slot.status == "AVAILABLE") && starts.isAfter(now)
}

@Composable
fun BookingInfoContent(vm: BookingViewModel, doctorVM: DoctorViewModel, allowDoctorSelection: Boolean) {
    val state by vm.uiState.collectAsState()
    val context = LocalContext.current
    val repository = remember { DoctorRepository() }
    val today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))
    val date = state.selectedDate ?: today.toString()
    var refresh by remember { mutableIntStateOf(0) }
    var showDoctors by remember { mutableStateOf(false) }
    var servicesExpanded by remember { mutableStateOf(false) }
    val slots by produceState<NetworkState<List<AppointmentSlot>>>(NetworkState.Loading, state.doctor?.id, state.workplace?.id, date, refresh) {
        value = NetworkState.Loading
        val doctorId = state.doctor?.id
        val workplaceId = state.workplace?.id
        if (doctorId == null || workplaceId == null) value = NetworkState.Idle
        else value = repository.getAvailableSlots(doctorId, workplaceId, date).fold(
            onSuccess = { NetworkState.Success(it) }, onFailure = { NetworkState.Error(it.message ?: "Không thể tải khung giờ") })
    }
    val services by produceState<NetworkState<List<MedicalService>>>(NetworkState.Idle, state.workplace?.id) {
        val hospitalId = state.workplace?.hospitalId
        value = NetworkState.Loading
        value = if (hospitalId == null) NetworkState.Idle else repository.getMedicalServices(hospitalId, state.workplace?.specialtyId).fold(
            onSuccess = { NetworkState.Success(it.filter { service -> service.isActive }) },
            onFailure = { NetworkState.Error(it.message ?: "Không thể tải dịch vụ") })
    }
    val available = (slots as? NetworkState.Success)?.data.orEmpty().filter { isBookableSlot(it, date) }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Text(state.hospital?.name ?: state.workplace?.hospital?.name.orEmpty(), style = MaterialTheme.typography.titleMedium)
                Text(state.doctor?.fullName ?: "Chưa chọn bác sĩ", fontWeight = FontWeight.Bold)
                state.workplace?.specialty?.let { Text(it.name) }
                if (state.workplace == null) state.selectedSpecialty?.let { Text("Chuyên khoa đã chọn: ${it.name}", color = MaterialTheme.colorScheme.primary) }
                if (allowDoctorSelection) OutlinedButton(onClick = { showDoctors = true }) { Text("Chọn / đổi bác sĩ") }
            }
            if (state.workplace != null) item {
                Text("Dịch vụ khám", fontWeight = FontWeight.Bold)
                Box {
                    OutlinedButton(onClick = { servicesExpanded = true }) {
                        Text(state.selectedService?.name ?: "Khám theo bác sĩ")
                    }
                    DropdownMenu(expanded = servicesExpanded, onDismissRequest = { servicesExpanded = false }) {
                        DropdownMenuItem(text = { Text("Khám theo bác sĩ") }, onClick = { vm.selectService(null); servicesExpanded = false })
                        (services as? NetworkState.Success)?.data.orEmpty().forEach { service ->
                            DropdownMenuItem(text = { Text("${service.name} (+${bookingMoney(service.price)})") }, onClick = {
                                vm.selectService(service); servicesExpanded = false
                            })
                        }
                    }
                }
                if (services is NetworkState.Loading) Text("Đang tải dịch vụ...")
                if (services is NetworkState.Error) Text((services as NetworkState.Error).message, color = MaterialTheme.colorScheme.error)
                Text("Ngày khám: $date", fontWeight = FontWeight.Bold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items((0L..13L).map { today.plusDays(it) }) { day ->
                        FilterChip(selected = date == day.toString(), onClick = { vm.selectDate(day.toString()) },
                            label = { Text("${day.dayOfMonth}/${day.monthValue}") })
                    }
                }
                TextButton(onClick = {
                    val selected = LocalDate.parse(date)
                    DatePickerDialog(context, { _, year, month, day -> vm.selectDate(LocalDate.of(year, month + 1, day).toString()) },
                        selected.year, selected.monthValue - 1, selected.dayOfMonth).apply {
                        datePicker.minDate = today.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
                    }.show()
                }) { Text("Chọn ngày khác") }
            }
            when (val result = slots) {
                is NetworkState.Loading -> item { CircularProgressIndicator() }
                is NetworkState.Error -> item {
                    Text(result.message, color = MaterialTheme.colorScheme.error)
                    TextButton(onClick = { refresh++ }) { Text("Tải lại khung giờ") }
                }
                is NetworkState.Success -> {
                    item {
                        Text("Khung giờ trống (giờ Việt Nam)", fontWeight = FontWeight.Bold)
                        if (available.isEmpty()) Text("Không còn khung giờ trống trong ngày này. Hãy chọn ngày hoặc bác sĩ khác.")
                        TextButton(onClick = { refresh++ }) { Text("Làm mới khung giờ") }
                    }
                    items(available, key = { it.id }) { slot ->
                        FilterChip(selected = state.selectedSlot?.id == slot.id,
                            onClick = { vm.selectDateTime(date, slot) }, modifier = Modifier.fillMaxWidth(),
                            label = { Text("${bookingTime(slot.startTime)} – ${bookingTime(slot.endTime)} • Còn ${slot.capacity - slot.bookedCount} chỗ") })
                    }
                }
                else -> item { Text("Vui lòng chọn bác sĩ để xem lịch khám.") }
            }
        }
        Button(onClick = { vm.setStep(2) }, enabled = state.workplace != null && available.any { it.id == state.selectedSlot?.id }, modifier = Modifier.fillMaxWidth()) {
            Text("Tiếp tục chọn hồ sơ")
        }
    }
    if (showDoctors) DoctorSelectionModal(state.hospital, doctorVM, specialtyId = state.selectedSpecialty?.id, onDismiss = { showDoctors = false }, onDoctorSelected = { doctor, workplace ->
        vm.selectDoctor(doctor, workplace)
        showDoctors = false
    })
}
