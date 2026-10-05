package com.example.kltn_novacare.ui.screens.booking

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.viewmodel.BookingViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val RoomGreen = Color(0xFF075E47)
private fun roomDate(value: String) = Instant.parse(value).atZone(ZoneId.of("Asia/Ho_Chi_Minh"))

@Composable
fun RoomServiceBookingContent(vm: BookingViewModel) {
    val state by vm.uiState.collectAsState()
    val catalog by vm.roomCatalog.collectAsState()
    LaunchedEffect(state.hospital?.id, state.bookingType) { vm.loadRoomCatalog() }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(if (state.bookingType == "AFTER_HOURS") "Khám ngoài giờ" else "Khám dịch vụ", style = MaterialTheme.typography.titleLarge, color = RoomGreen)
        Text(state.hospital?.name.orEmpty(), style = MaterialTheme.typography.titleMedium)
        when (val result = catalog) {
            is NetworkState.Success -> {
                val sessions = result.data
                if (sessions.isEmpty()) {
                    Text("Chưa có lịch phòng khám còn chỗ cho hình thức này. Vui lòng chọn hình thức khác hoặc thử lại sau.")
                    OutlinedButton(onClick = vm::loadRoomCatalog) { Text("Tải lại lịch") }
                } else {
                    Text("1. Chuyên khoa", style = MaterialTheme.typography.titleMedium)
                    sessions.mapNotNull { it.service.specialty }.distinctBy { it.id }.forEach { specialty ->
                        RoomChoice(specialty.name, state.selectedSpecialty?.id == specialty.id) { vm.selectRoomSpecialty(specialty) }
                    }
                    val specialtySessions = sessions.filter { it.room.specialtyId == state.selectedSpecialty?.id }
                    if (state.selectedSpecialty != null) {
                        Text("2. Dịch vụ", style = MaterialTheme.typography.titleMedium)
                        specialtySessions.map { it.service }.distinctBy { it.id }.forEach { service ->
                            val weekdays = specialtySessions.filter { it.service.id == service.id }.map { roomDate(it.slot.startTime).dayOfWeek }.distinct().sortedBy { it.value }
                            val schedule = weekdays.joinToString(", ") { if (it.value == 7) "CN" else "Thứ ${it.value + 1}" }
                            RoomChoice("${service.name}\nLịch khám: $schedule\nGiá: ${String.format(Locale.forLanguageTag("vi-VN"), "%,.0f", service.price)} đ", state.selectedService?.id == service.id) { vm.selectRoomService(service) }
                        }
                    }
                    val serviceSessions = specialtySessions.filter { it.service.id == state.selectedService?.id }
                    if (state.selectedService != null) {
                        Text("3. Phòng khám", style = MaterialTheme.typography.titleMedium)
                        serviceSessions.map { it.room }.distinctBy { it.id }.forEach { room ->
                            RoomChoice("${room.code} · ${room.name}", state.selectedRoom?.id == room.id) { vm.selectRoom(room) }
                        }
                    }
                    val roomSessions = serviceSessions.filter { it.room.id == state.selectedRoom?.id }
                    if (state.selectedRoom != null) {
                        Text("4. Ngày khám", style = MaterialTheme.typography.titleMedium)
                        roomSessions.map { roomDate(it.slot.startTime).toLocalDate() }.distinct().forEach { date ->
                            RoomChoice(date.format(DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy", Locale.forLanguageTag("vi-VN"))), state.selectedDate == date.toString()) { vm.selectDate(date.toString()) }
                        }
                    }
                    if (state.selectedDate != null) {
                        Text("5. Giờ khám", style = MaterialTheme.typography.titleMedium)
                        roomSessions.filter { roomDate(it.slot.startTime).toLocalDate().toString() == state.selectedDate }.forEach { session ->
                            val format = DateTimeFormatter.ofPattern("HH:mm")
                            RoomChoice("${roomDate(session.slot.startTime).format(format)} – ${roomDate(session.slot.endTime).format(format)}", state.selectedSlot?.id == session.slot.id) { vm.selectRoomTime(state.selectedDate!!, session) }
                        }
                    }
                    Button(onClick = { vm.setStep(2) }, enabled = state.selectedSlot != null && !state.locked, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = RoomGreen)) { Text("Tiếp tục") }
                }
            }
            is NetworkState.Error -> {
                Text(result.message, color = MaterialTheme.colorScheme.error)
                OutlinedButton(onClick = vm::loadRoomCatalog) { Text("Thử lại") }
            }
            else -> CircularProgressIndicator(color = RoomGreen)
        }
    }
}

@Composable
private fun RoomChoice(label: String, selected: Boolean, onClick: () -> Unit) {
    OutlinedCard(onClick = onClick, modifier = Modifier.fillMaxWidth(), border = BorderStroke(1.dp, if (selected) RoomGreen else Color(0xFFE1E8E5)), colors = CardDefaults.outlinedCardColors(containerColor = if (selected) Color(0xFFEAF8F2) else Color.White)) {
        Text(label, Modifier.padding(16.dp), color = RoomGreen)
    }
}
