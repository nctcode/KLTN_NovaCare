package com.example.kltn_novacare.ui.screens.booking

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.kltn_novacare.data.model.Hospital
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.BookingViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private fun roomDate(value: String) = Instant.parse(value).atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
private fun roomPrice(value: Double) = String.format(Locale.forLanguageTag("vi-VN"), "%,.0f đ", value)
private fun sentenceCase(value: String): String = value.replaceFirstChar {
    if (it.isLowerCase()) it.titlecase(Locale.forLanguageTag("vi-VN")) else it.toString()
}
private data class CatalogChoice(val id: String, val label: String, val supportingText: String? = null)

@Composable
fun RoomServiceBookingContent(vm: BookingViewModel) {
    val state by vm.uiState.collectAsState()
    val catalog by vm.roomCatalog.collectAsState()
    val isAfterHours = state.bookingType == "AFTER_HOURS"
    var dialog by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(state.hospital?.id, state.bookingType) { vm.loadRoomCatalog() }
    val sessions = (catalog as? NetworkState.Success)?.data.orEmpty()
    val specialties = remember(sessions) { sessions.mapNotNull { it.service.specialty }.distinctBy { it.id } }
    val specialtySessions = remember(sessions, state.selectedSpecialty?.id) {
        sessions.filter { (it.service.specialty?.id ?: it.room.specialtyId) == state.selectedSpecialty?.id }
    }
    val services = remember(specialtySessions) { specialtySessions.map { it.service }.distinctBy { it.id } }
    val serviceSessions = remember(specialtySessions, state.selectedService?.id) {
        specialtySessions.filter { it.service.id == state.selectedService?.id }
    }
    val rooms = remember(serviceSessions) { serviceSessions.map { it.room }.distinctBy { it.id } }
    val roomSessions = remember(serviceSessions, state.selectedRoom?.id) {
        serviceSessions.filter { it.room.id == state.selectedRoom?.id }
    }
    val dates = remember(roomSessions) { roomSessions.map { roomDate(it.slot.startTime).toLocalDate() }.distinct().sorted() }
    val selectedDateSessions = remember(roomSessions, state.selectedDate) {
        roomSessions.filter { roomDate(it.slot.startTime).toLocalDate().toString() == state.selectedDate }
    }

    Column(Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            HospitalInformationCard(state.hospital)
            Spacer(Modifier.height(8.dp))
            when (val result = catalog) {
                is NetworkState.Loading, NetworkState.Idle -> BookingCatalogLoading()
                is NetworkState.Error -> BookingCatalogError(result.message, vm::loadRoomCatalog)
                is NetworkState.Success -> if (sessions.isEmpty()) BookingCatalogEmpty(isAfterHours, vm::loadRoomCatalog) else {
                    BookingSectionHeader("Chuyên khoa")
                    BookingSelectionCard(Icons.Default.MedicalServices, state.selectedSpecialty?.name.orEmpty(), "Chọn chuyên khoa", state.selectedSpecialty != null, true) { dialog = "SPECIALTY" }

                    BookingSectionHeader("Dịch vụ")
                    BookingSelectionCard(
                        Icons.Default.VolunteerActivism,
                        state.selectedService?.let { "${it.name} · ${roomPrice(it.price)}" }.orEmpty(),
                        if (state.selectedSpecialty == null) "Chọn chuyên khoa trước" else "Chọn dịch vụ",
                        state.selectedService != null,
                        state.selectedSpecialty != null,
                    ) { dialog = "SERVICE" }

                    BookingSectionHeader("Phòng khám")
                    BookingSelectionCard(
                        Icons.Default.MeetingRoom,
                        state.selectedRoom?.let { "${it.code} · ${it.name}" }.orEmpty(),
                        if (state.selectedService == null) "Chọn dịch vụ trước" else "Chọn phòng khám",
                        state.selectedRoom != null,
                        state.selectedService != null,
                    ) { dialog = "ROOM" }

                    BookingSectionHeader("Ngày khám")
                    if (state.selectedRoom == null) {
                        BookingSelectionCard(Icons.Default.CalendarMonth, "", "Chọn phòng khám trước", false, false) {}
                    } else {
                        RoomDateChoices(
                            dates = dates,
                            selectedDate = state.selectedDate,
                            onSelect = vm::selectDate,
                            onMore = { dialog = "DATE" },
                        )
                    }

                    BookingSectionHeader("Giờ khám")
                    if (state.selectedDate == null) {
                        BookingSelectionCard(Icons.Default.Schedule, "", "Chọn ngày khám trước", false, false) {}
                    } else {
                        RoomTimeChoices(
                            sessions = selectedDateSessions,
                            selectedSlotId = state.selectedSlot?.id,
                            onSelect = { vm.selectRoomTime(state.selectedDate!!, it) },
                        )
                    }
                }
            }
        }

        Surface(color = Color.White, shadowElevation = 8.dp) {
            val canContinue = state.selectedSpecialty != null && state.selectedService != null &&
                state.selectedRoom != null && state.selectedDate != null && state.selectedSlot != null
            Button(
                onClick = { vm.setStep(2) }, enabled = canContinue && !state.locked,
                modifier = Modifier.navigationBarsPadding().padding(16.dp).fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NovaCareGreen, disabledContainerColor = Color(0xFFCBD5E1)),
            ) { Text("TIẾP TỤC", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp) }
        }
    }

    when (dialog) {
        "SPECIALTY" -> CatalogChoiceDialog("Chọn chuyên khoa", specialties.map { CatalogChoice(it.id, it.name) }, state.selectedSpecialty?.id, { dialog = null }) { id -> specialties.firstOrNull { it.id == id }?.let(vm::selectRoomSpecialty); dialog = null }
        "SERVICE" -> CatalogChoiceDialog("Chọn dịch vụ", services.map { CatalogChoice(it.id, it.name, "Giá dịch vụ: ${roomPrice(it.price)}") }, state.selectedService?.id, { dialog = null }) { id -> services.firstOrNull { it.id == id }?.let(vm::selectRoomService); dialog = null }
        "ROOM" -> CatalogChoiceDialog("Chọn phòng khám", rooms.map { CatalogChoice(it.id, it.name, "Mã phòng: ${it.code}") }, state.selectedRoom?.id, { dialog = null }) { id -> rooms.firstOrNull { it.id == id }?.let(vm::selectRoom); dialog = null }
        "DATE" -> CatalogChoiceDialog("Chọn ngày khám", dates.map { CatalogChoice(it.toString(), sentenceCase(it.format(DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy", Locale.forLanguageTag("vi-VN"))))) }, state.selectedDate, { dialog = null }) { id -> vm.selectDate(id); dialog = null }
    }
}

@Composable
private fun RoomDateChoices(
    dates: List<java.time.LocalDate>,
    selectedDate: String?,
    onSelect: (String) -> Unit,
    onMore: () -> Unit,
) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        dates.take(4).forEach { date ->
            val value = date.toString()
            val selected = selectedDate == value
            Surface(
                modifier = Modifier.weight(1f).height(68.dp).clickable { onSelect(value) },
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(if (selected) 1.5.dp else 1.dp, if (selected) NovaCareGreen else Color(0xFFE2E8F0)),
                color = if (selected) NovaCareGreenLight else Color.White,
            ) {
                Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("(%02d/%02d)".format(date.dayOfMonth, date.monthValue), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (selected) NovaCareGreen else TextPrimary)
                    Text(if (date == java.time.LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))) "Hôm nay" else formatDayOfWeekVi(date), fontSize = 11.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal, color = if (selected) NovaCareGreen else TextSecondary)
                }
            }
        }
        repeat((4 - dates.take(4).size).coerceAtLeast(0)) { Spacer(Modifier.weight(1f)) }
        Surface(
            modifier = Modifier.weight(1.1f).height(68.dp).clickable(onClick = onMore),
            shape = RoundedCornerShape(12.dp), border = BorderStroke(1.dp, Color(0xFFE2E8F0)), color = Color.White,
        ) {
            Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = NovaCareGreen, modifier = Modifier.size(20.dp))
                Text("Ngày khác", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            }
        }
    }
}

@Composable
private fun RoomTimeChoices(
    sessions: List<com.example.kltn_novacare.data.model.ClinicRoomSession>,
    selectedSlotId: String?,
    onSelect: (com.example.kltn_novacare.data.model.ClinicRoomSession) -> Unit,
) {
    val morning = sessions.filter { roomDate(it.slot.startTime).hour < 12 }
    val afternoon = sessions.filter { roomDate(it.slot.startTime).hour >= 12 }
    if (sessions.isEmpty()) {
        Surface(Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), color = Color(0xFFF1F5F9)) {
            Text("Không còn khung giờ trống trong ngày này.", modifier = Modifier.padding(16.dp), color = TextSecondary, fontSize = 13.sp)
        }
        return
    }
    TimePeriod("Buổi sáng", morning, selectedSlotId, onSelect)
    Spacer(Modifier.height(10.dp))
    TimePeriod("Buổi chiều", afternoon, selectedSlotId, onSelect)
}

@Composable
private fun TimePeriod(
    title: String,
    sessions: List<com.example.kltn_novacare.data.model.ClinicRoomSession>,
    selectedSlotId: String?,
    onSelect: (com.example.kltn_novacare.data.model.ClinicRoomSession) -> Unit,
) {
    if (sessions.isEmpty()) return
    val formatter = DateTimeFormatter.ofPattern("HH:mm")
    Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary, modifier = Modifier.padding(vertical = 8.dp))
    sessions.chunked(3).forEach { row ->
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            row.forEach { session ->
                val selected = selectedSlotId == session.slot.id
                val remaining = (session.slot.capacity - session.slot.bookedCount).coerceAtLeast(0)
                Surface(
                    modifier = Modifier.weight(1f).height(52.dp).clickable { onSelect(session) },
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(if (selected) 1.5.dp else 1.dp, if (selected) NovaCareGreen else Color(0xFFE2E8F0)),
                    color = if (selected) NovaCareGreenLight else Color.White,
                ) {
                    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${roomDate(session.slot.startTime).format(formatter)} - ${roomDate(session.slot.endTime).format(formatter)}", fontSize = 11.5.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium, color = if (selected) NovaCareGreen else TextPrimary)
                        Text("Còn $remaining chỗ", fontSize = 10.sp, color = if (selected) NovaCareGreen else TextSecondary)
                    }
                }
            }
            repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun CatalogChoiceDialog(title: String, choices: List<CatalogChoice>, selectedId: String?, onDismiss: () -> Unit, onSelect: (String) -> Unit) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxWidth(.92f).fillMaxHeight(.72f), shape = RoundedCornerShape(20.dp), color = Color.White) {
            Column(Modifier.padding(16.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(title, fontWeight = FontWeight.Bold, fontSize = 17.sp, color = TextPrimary)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = "Đóng") }
                }
                if (choices.isEmpty()) Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Không có dữ liệu phù hợp", color = TextSecondary) }
                else LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(choices, key = { it.id }) { choice ->
                        val selected = choice.id == selectedId
                        Surface(
                            Modifier.fillMaxWidth().clickable { onSelect(choice.id) },
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(if (selected) 1.5.dp else 1.dp, if (selected) NovaCareGreen else Color(0xFFE2E8F0)),
                            color = if (selected) NovaCareGreenLight else Color.White,
                        ) {
                            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(choice.label, fontWeight = FontWeight.SemiBold, color = if (selected) NovaCareGreen else TextPrimary)
                                    choice.supportingText?.let { Text(it, fontSize = 12.sp, color = TextSecondary) }
                                }
                                if (selected) Icon(Icons.Default.Check, contentDescription = null, tint = NovaCareGreen)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HospitalInformationCard(hospital: Hospital?) {
    Surface(
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.5.dp, NovaCareGreenBorder),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    hospital?.name ?: "Cơ sở khám bệnh",
                    modifier = Modifier.weight(1f),
                    color = TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                )
                Icon(Icons.Default.CheckCircle, contentDescription = "Đã xác thực", tint = NovaCareGreen, modifier = Modifier.size(17.dp))
            }
            Spacer(Modifier.height(4.dp))
            Text(
                hospital?.displayAddress?.takeIf { it.isNotBlank() } ?: "Địa chỉ cơ sở y tế đang cập nhật",
                color = TextSecondary,
                fontSize = 11.5.sp,
                lineHeight = 16.sp,
            )
        }
    }
}

@Composable private fun BookingCatalogLoading() = Box(Modifier.fillMaxWidth().height(180.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = NovaCareGreen) }
@Composable private fun BookingCatalogError(message: String, retry: () -> Unit) { Column(Modifier.fillMaxWidth().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(message, color = StatusErrorText); TextButton(onClick = retry) { Text("Thử lại") } } }
@Composable private fun BookingCatalogEmpty(afterHours: Boolean, retry: () -> Unit) { Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.EventBusy, null, tint = TextMuted); Text(if (afterHours) "Cơ sở chưa mở ca phòng khám ngoài giờ." else "Cơ sở chưa phân phòng cho dịch vụ.", fontWeight = FontWeight.Bold); TextButton(onClick = retry) { Text("Tải lại lịch") } } }
