package com.example.kltn_novacare.ui.screens.booking

import android.app.DatePickerDialog
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.repository.DoctorRepository
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.*
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

fun formatDayOfWeekVi(date: LocalDate): String {
    return when (date.dayOfWeek) {
        DayOfWeek.MONDAY -> "Thứ 2"
        DayOfWeek.TUESDAY -> "Thứ 3"
        DayOfWeek.WEDNESDAY -> "Thứ 4"
        DayOfWeek.THURSDAY -> "Thứ 5"
        DayOfWeek.FRIDAY -> "Thứ 6"
        DayOfWeek.SATURDAY -> "Thứ 7"
        DayOfWeek.SUNDAY -> "Chủ nhật"
    }
}

fun isBookableSlot(slot: AppointmentSlot, date: String, now: Instant = Instant.now()): Boolean {
    val starts = runCatching { Instant.parse(slot.startTime) }.getOrElse {
        runCatching { LocalDate.parse(date).atTime(LocalTime.parse(slot.startTime)).atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant() }.getOrNull()
    } ?: return false
    return slot.id.isNotBlank() && slot.capacity > slot.bookedCount && slot.isActive != false &&
        slot.isAvailable != false && (slot.status == null || slot.status == "AVAILABLE") && starts.isAfter(now)
}

@Composable
fun BookingSectionHeader(title: String, required: Boolean = true) {
    Row(modifier = Modifier.padding(top = 10.dp, bottom = 6.dp)) {
        Text(
            text = title,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            color = Color(0xFF0F172A)
        )
        if (required) {
            Text(
                text = " *",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Color(0xFFEF4444)
            )
        }
    }
}

@Composable
fun BookingSelectionCard(
    icon: ImageVector,
    text: String,
    placeholder: String = "",
    isSelected: Boolean = false,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, if (isSelected) Color(0xFFCBD5E1) else Color(0xFFE2E8F0)),
        color = Color.White
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = NovaCareGreen,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = if (text.isNotBlank()) text else placeholder,
                fontSize = 14.sp,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                color = if (isSelected) Color(0xFF0F172A) else Color(0xFF94A3B8),
                modifier = Modifier.weight(1f)
            )
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Color(0xFF64748B),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
fun BookingInfoContent(vm: BookingViewModel, doctorVM: DoctorViewModel, allowDoctorSelection: Boolean) {
    val state by vm.uiState.collectAsState()
    if (state.bookingType in listOf("SERVICE", "AFTER_HOURS")) {
        RoomServiceBookingContent(vm)
        return
    }
    val context = LocalContext.current
    val repository = remember { DoctorRepository() }
    val today = remember { LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")) }
    val date = state.selectedDate ?: today.toString()

    var refresh by remember { mutableIntStateOf(0) }
    var showDoctors by remember { mutableStateOf(false) }
    var showSpecialties by remember { mutableStateOf(false) }
    var showServices by remember { mutableStateOf(false) }

    // Tải danh sách chuyên khoa
    val specialtiesState by doctorVM.specialties.collectAsState()
    LaunchedEffect(Unit) {
        doctorVM.loadSpecialties()
    }

    // Tải khung giờ trống
    val slots by produceState<NetworkState<List<AppointmentSlot>>>(NetworkState.Loading, state.doctor?.id, state.workplace?.id, date, refresh) {
        value = NetworkState.Loading
        val doctorId = state.doctor?.id
        val workplaceId = state.workplace?.id
        if (doctorId == null || workplaceId == null) value = NetworkState.Idle
        else value = repository.getAvailableSlots(doctorId, workplaceId, date).fold(
            onSuccess = { NetworkState.Success(it) },
            onFailure = { NetworkState.Error(it.message ?: "Không thể tải khung giờ") }
        )
    }

    // Tải danh sách dịch vụ
    val services by produceState<NetworkState<List<MedicalService>>>(NetworkState.Idle, state.workplace?.id, state.hospital?.id) {
        val hospitalId = state.workplace?.hospitalId ?: state.hospital?.id
        value = NetworkState.Loading
        value = if (hospitalId == null) NetworkState.Idle else repository.getMedicalServices(hospitalId, state.workplace?.specialtyId).fold(
            onSuccess = { NetworkState.Success(it.filter { service -> service.isActive }) },
            onFailure = { NetworkState.Error(it.message ?: "Không thể tải dịch vụ") }
        )
    }

    val available = (slots as? NetworkState.Success)?.data.orEmpty().filter { isBookableSlot(it, date) }
    val morningSlots = remember(available) {
        available.filter { slot ->
            val time = bookingTime(slot.startTime)
            val hour = time.take(2).toIntOrNull() ?: 8
            hour < 12
        }
    }
    val afternoonSlots = remember(available) {
        available.filter { slot ->
            val time = bookingTime(slot.startTime)
            val hour = time.take(2).toIntOrNull() ?: 14
            hour >= 12
        }
    }

    val hospital = state.hospital ?: state.workplace?.hospital
    val specialty = state.workplace?.specialty ?: state.selectedSpecialty

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // 1. Thẻ Bệnh viện (Medpro style)
                item {
                    OutlinedCard(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.5.dp, Color(0xFFBAE6FD)),
                        colors = CardDefaults.outlinedCardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = hospital?.name ?: "Bệnh viện",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = Color(0xFF0F172A),
                                    modifier = Modifier.weight(1f)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = "Verified",
                                    tint = Color(0xFF0284C7),
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = hospital?.displayAddress?.takeIf { it.isNotBlank() }
                                    ?: "Địa chỉ cơ sở y tế đang cập nhật",
                                fontSize = 11.5.sp,
                                color = Color(0xFF64748B),
                                lineHeight = 16.sp
                            )
                        }
                    }
                }

                // 2. Chuyên khoa *
                item {
                    BookingSectionHeader(title = "Chuyên khoa")
                    BookingSelectionCard(
                        icon = Icons.Default.MedicalServices,
                        text = specialty?.name.orEmpty(),
                        placeholder = "Chọn chuyên khoa",
                        isSelected = specialty != null,
                        onClick = { showSpecialties = true }
                    )
                }

                // 3. Dịch vụ *
                item {
                    BookingSectionHeader(title = "Dịch vụ")
                    val serviceTitle = state.selectedService?.let {
                        "${it.name} - ${bookingMoney(it.price)} (Thanh toán tại Bệnh viện)"
                    } ?: "Khám dịch vụ (Theo Bác sĩ)"
                    BookingSelectionCard(
                        icon = Icons.Default.VolunteerActivism,
                        text = serviceTitle,
                        placeholder = "Chọn dịch vụ khám",
                        isSelected = true,
                        onClick = { showServices = true }
                    )
                }

                // 4. Phòng khám / Bác sĩ *
                item {
                    BookingSectionHeader(title = "Phòng khám")
                    val doctorOrRoom = state.doctor?.let {
                        "${it.displayFullNameWithTitle} • ${state.workplace?.position ?: "Phòng khám"}"
                    } ?: state.workplace?.position ?: ""
                    BookingSelectionCard(
                        icon = Icons.Default.HomeWork,
                        text = doctorOrRoom,
                        placeholder = "Chọn bác sĩ / phòng khám",
                        isSelected = state.doctor != null || state.workplace != null,
                        onClick = { showDoctors = true }
                    )
                }

                // 5. Ngày khám *
                item {
                    BookingSectionHeader(title = "Ngày khám")
                    val displayDays = remember { (0L..3L).map { today.plusDays(it) } }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        displayDays.forEach { day ->
                            val dateStr = day.toString()
                            val isSelected = date == dateStr
                            val dateLabel = String.format("(%02d/%02d)", day.dayOfMonth, day.monthValue)
                            val dayOfWeekLabel = if (day == today) "Hôm nay" else formatDayOfWeekVi(day)

                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(68.dp)
                                    .clickable { vm.selectDate(dateStr) },
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(
                                    if (isSelected) 1.5.dp else 1.dp,
                                    if (isSelected) NovaCareGreen else Color(0xFFE2E8F0)
                                ),
                                color = if (isSelected) NovaCareGreenLight else Color.White
                            ) {
                                Column(
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.Center,
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = dateLabel,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                                        fontSize = 12.5.sp,
                                        color = if (isSelected) NovaCareGreen else Color(0xFF0F172A)
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = dayOfWeekLabel,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) NovaCareGreen else Color(0xFF64748B)
                                    )
                                }
                            }
                        }

                        // Nút "Ngày khác"
                        Surface(
                            modifier = Modifier
                                .weight(1.1f)
                                .height(68.dp)
                                .clickable {
                                    val selected = LocalDate.parse(date)
                                    DatePickerDialog(
                                        context,
                                        { _, year, month, day ->
                                            vm.selectDate(LocalDate.of(year, month + 1, day).toString())
                                        },
                                        selected.year,
                                        selected.monthValue - 1,
                                        selected.dayOfMonth
                                    ).apply {
                                        datePicker.minDate = today.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
                                    }.show()
                                },
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                            color = Color.White
                        ) {
                            Column(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    Icons.Default.CalendarMonth,
                                    contentDescription = "Ngày khác",
                                    tint = NovaCareGreen,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "Ngày khác",
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.5.sp,
                                    color = Color(0xFF0F172A)
                                )
                            }
                        }
                    }
                }

                // 6. Giờ khám *
                item {
                    BookingSectionHeader(title = "Giờ khám")
                }

                when (slots) {
                    is NetworkState.Loading -> {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(color = NovaCareGreen, modifier = Modifier.size(32.dp))
                            }
                        }
                    }
                    is NetworkState.Error -> {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    (slots as NetworkState.Error).message,
                                    color = MaterialTheme.colorScheme.error,
                                    fontSize = 13.sp
                                )
                                TextButton(onClick = { refresh++ }) {
                                    Text("Tải lại khung giờ", color = NovaCareGreen)
                                }
                            }
                        }
                    }
                    is NetworkState.Success -> {
                        if (available.isEmpty()) {
                            item {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    color = Color(0xFFF1F5F9)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            "Không còn khung giờ trống trong ngày này.",
                                            fontSize = 13.sp,
                                            color = Color(0xFF64748B)
                                        )
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            "Vui lòng chọn ngày khác hoặc đổi bác sĩ.",
                                            fontSize = 12.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }
                            }
                        } else {
                            // Buổi sáng
                            if (morningSlots.isNotEmpty()) {
                                item {
                                    Text(
                                        text = "Buổi sáng",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = Color(0xFF0F172A),
                                        modifier = Modifier.padding(top = 4.dp, bottom = 6.dp)
                                    )
                                }

                                items(morningSlots.chunked(3)) { rowSlots ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        rowSlots.forEach { slot ->
                                            val isSelected = state.selectedSlot?.id == slot.id
                                            val timeLabel = "${bookingTime(slot.startTime)} - ${bookingTime(slot.endTime)}"
                                            val remaining = slot.capacity - slot.bookedCount

                                            Surface(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .height(52.dp)
                                                    .clickable { vm.selectDateTime(date, slot) },
                                                shape = RoundedCornerShape(10.dp),
                                                border = BorderStroke(
                                                    if (isSelected) 1.5.dp else 1.dp,
                                                    if (isSelected) NovaCareGreen else Color(0xFFE2E8F0)
                                                ),
                                                color = if (isSelected) NovaCareGreenLight else Color.White
                                            ) {
                                                Column(
                                                    modifier = Modifier.fillMaxSize(),
                                                    verticalArrangement = Arrangement.Center,
                                                    horizontalAlignment = Alignment.CenterHorizontally
                                                ) {
                                                    Text(
                                                        text = timeLabel,
                                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                                        fontSize = 11.5.sp,
                                                        color = if (isSelected) NovaCareGreen else Color(0xFF0F172A)
                                                    )
                                                    Text(
                                                        text = "Còn $remaining chỗ",
                                                        fontSize = 10.sp,
                                                        color = if (isSelected) NovaCareGreen else Color(0xFF64748B)
                                                    )
                                                }
                                            }
                                        }
                                        // Fill remaining slots in row if less than 3
                                        repeat(3 - rowSlots.size) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }

                            // Buổi chiều
                            if (afternoonSlots.isNotEmpty()) {
                                item {
                                    Text(
                                        text = "Buổi chiều",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = Color(0xFF0F172A),
                                        modifier = Modifier.padding(top = 10.dp, bottom = 6.dp)
                                    )
                                }

                                items(afternoonSlots.chunked(3)) { rowSlots ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        rowSlots.forEach { slot ->
                                            val isSelected = state.selectedSlot?.id == slot.id
                                            val timeLabel = "${bookingTime(slot.startTime)} - ${bookingTime(slot.endTime)}"
                                            val remaining = slot.capacity - slot.bookedCount

                                            Surface(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .height(52.dp)
                                                    .clickable { vm.selectDateTime(date, slot) },
                                                shape = RoundedCornerShape(10.dp),
                                                border = BorderStroke(
                                                    if (isSelected) 1.5.dp else 1.dp,
                                                    if (isSelected) NovaCareGreen else Color(0xFFE2E8F0)
                                                ),
                                                color = if (isSelected) NovaCareGreenLight else Color.White
                                            ) {
                                                Column(
                                                    modifier = Modifier.fillMaxSize(),
                                                    verticalArrangement = Arrangement.Center,
                                                    horizontalAlignment = Alignment.CenterHorizontally
                                                ) {
                                                    Text(
                                                        text = timeLabel,
                                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                                        fontSize = 11.5.sp,
                                                        color = if (isSelected) NovaCareGreen else Color(0xFF0F172A)
                                                    )
                                                    Text(
                                                        text = "Còn $remaining chỗ",
                                                        fontSize = 10.sp,
                                                        color = if (isSelected) NovaCareGreen else Color(0xFF64748B)
                                                    )
                                                }
                                            }
                                        }
                                        repeat(3 - rowSlots.size) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else -> {
                        item {
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                color = Color.White,
                                border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                            ) {
                                Box(
                                    modifier = Modifier.padding(16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "Vui lòng chọn bác sĩ hoặc phòng khám để tải khung giờ.",
                                        fontSize = 13.sp,
                                        color = Color(0xFF64748B)
                                    )
                                }
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }

            // Sticky Bottom Continue Bar
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color.White,
                shadowElevation = 8.dp
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    val canContinue = state.workplace != null && state.selectedSlot != null
                    Button(
                        onClick = { vm.setStep(2) },
                        enabled = canContinue,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = NovaCareGreen,
                            disabledContainerColor = Color(0xFFCBD5E1)
                        )
                    ) {
                        Text(
                            text = "TIẾP TỤC",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }

        // Floating Action Button Hotline (Orange)
        FloatingActionButton(
            onClick = {
                val phone = hospital?.phone ?: hospital?.hotline ?: "19002115"
                runCatching {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                    context.startActivity(intent)
                }
            },
            containerColor = NovaCareOrangeFab,
            contentColor = Color.White,
            shape = CircleShape,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 80.dp)
                .size(54.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Call,
                contentDescription = "Hotline",
                modifier = Modifier.size(26.dp)
            )
        }
    }

    // Modal chọn bác sĩ
    if (showDoctors) {
        DoctorSelectionModal(
            hospital = state.hospital,
            doctorViewModel = doctorVM,
            specialtyId = state.selectedSpecialty?.id,
            onDismiss = { showDoctors = false },
            onDoctorSelected = { doctor, workplace ->
                vm.selectDoctor(doctor, workplace)
                showDoctors = false
            }
        )
    }

    // Modal chọn chuyên khoa
    if (showSpecialties) {
        val specialtiesList = (specialtiesState as? NetworkState.Success)?.data.orEmpty()
        SpecialtySelectionDialog(
            specialties = specialtiesList,
            selectedSpecialtyId = specialty?.id,
            onDismiss = { showSpecialties = false },
            onSelect = { selectedSpec ->
                vm.selectSpecialty(selectedSpec)
                showSpecialties = false
                showDoctors = true // Mở chọn bác sĩ thuộc chuyên khoa đó
            }
        )
    }

    // Modal chọn dịch vụ
    if (showServices) {
        val servicesList = (services as? NetworkState.Success)?.data.orEmpty()
        ServiceSelectionDialog(
            services = servicesList,
            selectedServiceId = state.selectedService?.id,
            onDismiss = { showServices = false },
            onSelect = { selectedServ ->
                vm.selectService(selectedServ)
                showServices = false
            }
        )
    }
}

@Composable
fun SpecialtySelectionDialog(
    specialties: List<Specialty>,
    selectedSpecialtyId: String?,
    onDismiss: () -> Unit,
    onSelect: (Specialty) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    val filtered = remember(specialties, searchQuery) {
        if (searchQuery.isBlank()) specialties
        else specialties.filter { it.name.contains(searchQuery, ignoreCase = true) }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .fillMaxHeight(0.8f)
                .clip(RoundedCornerShape(20.dp)),
            color = Color.White
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "Chọn chuyên khoa",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = Color(0xFF0F172A)
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Tìm chuyên khoa...", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NovaCareGreen,
                        unfocusedBorderColor = Color(0xFFCBD5E1),
                        focusedContainerColor = Color(0xFFF8FAFC),
                        unfocusedContainerColor = Color(0xFFF8FAFC)
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filtered, key = { it.id }) { spec ->
                        val isSelected = spec.id == selectedSpecialtyId
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(spec) },
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(
                                if (isSelected) 1.5.dp else 1.dp,
                                if (isSelected) NovaCareGreen else Color(0xFFE2E8F0)
                            ),
                            color = if (isSelected) NovaCareGreenLight else Color.White
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.MedicalServices,
                                    contentDescription = null,
                                    tint = if (isSelected) NovaCareGreen else Color(0xFF64748B),
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = spec.name,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 14.sp,
                                    color = if (isSelected) NovaCareGreen else Color(0xFF0F172A),
                                    modifier = Modifier.weight(1f)
                                )
                                if (isSelected) {
                                    Icon(
                                        Icons.Default.Check,
                                        contentDescription = null,
                                        tint = NovaCareGreen,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ServiceSelectionDialog(
    services: List<MedicalService>,
    selectedServiceId: String?,
    onDismiss: () -> Unit,
    onSelect: (MedicalService?) -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .fillMaxHeight(0.75f)
                .clip(RoundedCornerShape(20.dp)),
            color = Color.White
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "Chọn dịch vụ khám",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = Color(0xFF0F172A)
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        val isSelected = selectedServiceId == null
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(null) },
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(
                                if (isSelected) 1.5.dp else 1.dp,
                                if (isSelected) NovaCareGreen else Color(0xFFE2E8F0)
                            ),
                            color = if (isSelected) NovaCareGreenLight else Color.White
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.VolunteerActivism,
                                    contentDescription = null,
                                    tint = if (isSelected) NovaCareGreen else Color(0xFF64748B),
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Khám tiêu chuẩn theo bác sĩ",
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 14.sp,
                                        color = if (isSelected) NovaCareGreen else Color(0xFF0F172A)
                                    )
                                    Text(
                                        text = "Khám lâm sàng theo giá niêm yết tại viện",
                                        fontSize = 12.sp,
                                        color = Color(0xFF64748B)
                                    )
                                }
                                if (isSelected) {
                                    Icon(
                                        Icons.Default.Check,
                                        contentDescription = null,
                                        tint = NovaCareGreen,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }

                    items(services, key = { it.id }) { service ->
                        val isSelected = service.id == selectedServiceId
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(service) },
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(
                                if (isSelected) 1.5.dp else 1.dp,
                                if (isSelected) NovaCareGreen else Color(0xFFE2E8F0)
                            ),
                            color = if (isSelected) NovaCareGreenLight else Color.White
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.VolunteerActivism,
                                    contentDescription = null,
                                    tint = if (isSelected) NovaCareGreen else Color(0xFF64748B),
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = service.name,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 14.sp,
                                        color = if (isSelected) NovaCareGreen else Color(0xFF0F172A)
                                    )
                                    Text(
                                        text = "${bookingMoney(service.price)} (Thanh toán tại Bệnh viện)",
                                        fontSize = 12.sp,
                                        color = if (isSelected) NovaCareGreen else Color(0xFF64748B),
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                                if (isSelected) {
                                    Icon(
                                        Icons.Default.Check,
                                        contentDescription = null,
                                        tint = NovaCareGreen,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
