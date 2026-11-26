package com.novacare.doctor.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.novacare.doctor.data.DoctorSchedule
import com.novacare.doctor.data.DoctorSlot
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

private val ScheduleEmeraldDark = Color(0xFF064E3B)
private val ScheduleEmeraldMid = Color(0xFF087F5B)
private val ScheduleEmeraldSoft = Color(0xFFECFDF5)
private val ScheduleEmeraldBorder = Color(0xFFA7F3D0)
private val ScheduleTextMuted = Color(0xFF64748B)
private val ScheduleBorder = Color(0xFFE2E8F0)
private val ScheduleSurfaceAlt = Color(0xFFF8FAFC)

private data class ShiftGroupKey(
    val date: LocalDate,
    val facilityName: String,
    val hospitalName: String,
    val specialtyName: String,
    val roomName: String?
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ScheduleScreen(nav: NavHostController, viewModel: DoctorViewModel) {
    val today = remember { LocalDate.now(vietnamZone) }
    val currentWeekStart = remember(today) { today.minusDays((today.dayOfWeek.value - 1).toLong()) }
    var weekStart by remember { mutableStateOf(currentWeekStart) }
    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    var inspectedSlot by remember { mutableStateOf<DoctorSlot?>(null) }
    val state by viewModel.schedule.collectAsState()

    fun reload() = viewModel.loadSchedule(weekStart.toString(), weekStart.plusDays(6).toString())
    LaunchedEffect(weekStart) {
        selectedDate = null
        reload()
    }

    val weekDays = remember(weekStart) { (0..6).map { weekStart.plusDays(it.toLong()) } }
    val isCurrentWeek = weekStart == currentWeekStart

    DoctorScaffold(
        nav = nav,
        route = Route.Schedule,
        title = "Lịch làm việc & ca trực",
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(ScheduleEmeraldDark, ScheduleEmeraldMid)
                        )
                    )
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .background(Color.White.copy(alpha = 0.16f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Outlined.CalendarMonth,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(
                                "Lịch làm việc & ca trực",
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp
                            )
                            Text(
                                "Lịch do cơ sở y tế phân công · Chỉ đọc",
                                color = Color(0xFFD1FAE5),
                                fontSize = 11.5.sp
                            )
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        if (!isCurrentWeek) {
                            Surface(
                                onClick = { weekStart = currentWeekStart },
                                shape = RoundedCornerShape(20.dp),
                                color = Color.White.copy(alpha = 0.18f),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.25f))
                            ) {
                                Text(
                                    "Tuần này",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                )
                            }
                        }
                        IconButton(
                            onClick = ::reload,
                            modifier = Modifier
                                .size(34.dp)
                                .background(Color.White.copy(alpha = 0.14f), CircleShape)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Làm mới", tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                    }
                }

                Spacer(Modifier.height(14.dp))

                // Week Navigator Bar
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = Color.White.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.18f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        IconButton(
                            onClick = { weekStart = weekStart.minusWeeks(1) },
                            modifier = Modifier.size(34.dp)
                        ) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Tuần trước", tint = Color.White)
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Outlined.DateRange, contentDescription = null, tint = Color(0xFFA7F3D0), modifier = Modifier.size(15.dp))
                            Text(
                                text = "${weekStart.format(DateTimeFormatter.ofPattern("dd/MM"))} – ${dateOnly(weekStart.plusDays(6))}",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp
                            )
                        }
                        IconButton(
                            onClick = { weekStart = weekStart.plusWeeks(1) },
                            modifier = Modifier.size(34.dp)
                        ) {
                            Icon(Icons.Default.ChevronRight, contentDescription = "Tuần sau", tint = Color.White)
                        }
                    }
                }
            }
        }
    ) { padding ->
        StateContent(state, Modifier.padding(padding), ::reload) { schedule ->
            val slotsByDate = remember(schedule.slots) {
                schedule.slots
                    .sortedBy { it.startTime }
                    .groupBy { parseLocalDate(it.startTime) }
            }
            val totalSlots = schedule.slots.size
            val totalBooked = schedule.slots.sumOf { it.bookedCount }
            val totalOpen = schedule.slots.sumOf { (it.capacity - it.bookedCount).coerceAtLeast(0) }

            val visibleDates = remember(slotsByDate, selectedDate) {
                if (selectedDate != null) {
                    slotsByDate.keys.filter { it == selectedDate }.sorted()
                } else {
                    slotsByDate.keys.sorted()
                }
            }

            Column(Modifier.fillMaxSize()) {
                // Interactive 7-Day Strip
                Surface(
                    color = Color.White,
                    shadowElevation = 2.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            weekDays.forEach { day ->
                                val daySlots = slotsByDate[day].orEmpty()
                                val hasSlots = daySlots.isNotEmpty()
                                val hasBooked = daySlots.any { it.bookedCount > 0 }
                                val isSelected = selectedDate == day
                                val isToday = day == today

                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(12.dp))
                                        .clickable {
                                            selectedDate = if (isSelected) null else day
                                        },
                                    shape = RoundedCornerShape(12.dp),
                                    color = when {
                                        isSelected -> ScheduleEmeraldDark
                                        isToday -> ScheduleEmeraldSoft
                                        else -> Color.Transparent
                                    },
                                    border = when {
                                        isSelected -> null
                                        isToday -> BorderStroke(1.dp, ScheduleEmeraldBorder)
                                        else -> null
                                    }
                                ) {
                                    Column(
                                        modifier = Modifier.padding(vertical = 8.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(3.dp)
                                    ) {
                                        Text(
                                            text = shortWeekday(day),
                                            fontSize = 10.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = when {
                                                isSelected -> Color(0xFFA7F3D0)
                                                isToday -> ScheduleEmeraldMid
                                                else -> ScheduleTextMuted
                                            }
                                        )
                                        Text(
                                            text = day.dayOfMonth.toString(),
                                            fontSize = 14.5.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = when {
                                                isSelected -> Color.White
                                                isToday -> ScheduleEmeraldDark
                                                hasSlots -> TextDark
                                                else -> Color(0xFF94A3B8)
                                            }
                                        )
                                        Box(
                                            modifier = Modifier
                                                .size(5.dp)
                                                .background(
                                                    when {
                                                        !hasSlots -> Color.Transparent
                                                        isSelected -> Color(0xFF34D399)
                                                        hasBooked -> ScheduleEmeraldMid
                                                        else -> Color(0xFF94A3B8)
                                                    },
                                                    CircleShape
                                                )
                                        )
                                    }
                                }
                            }
                        }

                        if (selectedDate != null) {
                            Spacer(Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "Đang lọc: ${fullVietnameseDate(selectedDate!!)}",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = ScheduleEmeraldDark
                                )
                                Text(
                                    "Xem cả tuần",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ScheduleEmeraldMid,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable { selectedDate = null }
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Weekly KPI Summary Card
                    if (schedule.slots.isNotEmpty()) {
                        item(key = "summary") {
                            ScheduleStatsCard(
                                totalSlots = totalSlots,
                                totalBooked = totalBooked,
                                totalOpen = totalOpen
                            )
                        }
                    }

                    // Grouped Daily Shift Cards
                    if (schedule.slots.isNotEmpty()) {
                        if (visibleDates.isEmpty()) {
                            item(key = "empty-day") {
                                ScheduleEmptyCard(
                                    title = "Không có ca trực ngày ${dateOnly(selectedDate ?: today)}",
                                    subtitle = "Nhấn vào ngày có dấu chấm xanh trên thanh lịch hoặc xem cả tuần."
                                )
                            }
                        } else {
                            items(visibleDates, key = { "day-$it" }) { date ->
                                val daySlots = slotsByDate[date].orEmpty()
                                DayScheduleSection(
                                    date = date,
                                    isToday = date == today,
                                    slots = daySlots,
                                    onSelectSlot = { inspectedSlot = it }
                                )
                            }
                        }
                    } else if (schedule.recurringSchedules.isNotEmpty()) {
                        item(key = "recurring-header") {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Outlined.EventRepeat, contentDescription = null, tint = ScheduleEmeraldMid, modifier = Modifier.size(18.dp))
                                Text(
                                    "Lịch trực cố định hàng tuần",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = TextDark
                                )
                            }
                        }
                        items(schedule.recurringSchedules.sortedBy { if (it.dayOfWeek == 0) 7 else it.dayOfWeek }, key = { it.id }) { recurring ->
                            RecurringShiftCard(recurring)
                        }
                    } else {
                        item(key = "empty-week") {
                            ScheduleEmptyCard(
                                title = "Chưa có ca trực trong tuần này",
                                subtitle = "Lịch làm việc sẽ hiển thị tự động khi cơ sở y tế phân công ca khám cho bạn."
                            )
                        }
                    }

                    // Color Legend
                    if (schedule.slots.isNotEmpty()) {
                        item(key = "legend") {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 2.dp, bottom = 8.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                LegendDot(color = ScheduleEmeraldMid, label = "Đã có bệnh nhân")
                                Spacer(Modifier.width(16.dp))
                                LegendDot(color = Color(0xFF94A3B8), label = "Khung giờ trống")
                            }
                        }
                    }
                }
            }
        }
    }

    // Slot Quick Detail Popup
    inspectedSlot?.let { slot ->
        SlotDetailDialog(slot = slot, onDismiss = { inspectedSlot = null })
    }
}

@Composable
private fun ScheduleStatsCard(totalSlots: Int, totalBooked: Int, totalOpen: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, ScheduleBorder),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 14.dp, horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ScheduleKpiItem(
                value = "$totalSlots",
                label = "Khung giờ trực",
                color = ScheduleEmeraldDark,
                modifier = Modifier.weight(1f)
            )
            Box(Modifier.width(1.dp).height(30.dp).background(ScheduleBorder))
            ScheduleKpiItem(
                value = "$totalBooked",
                label = "Lịch đã đặt",
                color = Color(0xFF059669),
                modifier = Modifier.weight(1f)
            )
            Box(Modifier.width(1.dp).height(30.dp).background(ScheduleBorder))
            ScheduleKpiItem(
                value = "$totalOpen",
                label = "Lượt còn trống",
                color = Color(0xFF475569),
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun ScheduleKpiItem(value: String, label: String, color: Color, modifier: Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 19.sp, fontWeight = FontWeight.Black, color = color)
        Spacer(Modifier.height(2.dp))
        Text(label, fontSize = 11.sp, color = ScheduleTextMuted, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun DayScheduleSection(
    date: LocalDate,
    isToday: Boolean,
    slots: List<DoctorSlot>,
    onSelectSlot: (DoctorSlot) -> Unit
) {
    val dayBooked = slots.sumOf { it.bookedCount }
    val dayCapacity = slots.sumOf { it.capacity }

    // Group slots within the same day by facility / room / specialty so header isn't repeated per 30-min slot
    val shiftGroups = remember(slots) {
        slots.groupBy { slot ->
            val facility = slot.doctorWorkplace.branch?.name ?: slot.doctorWorkplace.hospital.name
            ShiftGroupKey(
                date = date,
                facilityName = facility,
                hospitalName = slot.doctorWorkplace.hospital.name,
                specialtyName = slot.doctorWorkplace.specialty.name,
                roomName = slot.roomSession?.room?.name
            )
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        // Day Header Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(width = 4.dp, height = 18.dp)
                        .background(if (isToday) ScheduleEmeraldMid else Color(0xFF94A3B8), RoundedCornerShape(4.dp))
                )
                Text(
                    text = fullVietnameseDate(date),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.5.sp,
                    color = TextDark
                )
                if (isToday) {
                    Surface(
                        color = ScheduleEmeraldSoft,
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, ScheduleEmeraldBorder)
                    ) {
                        Text(
                            "Hôm nay",
                            color = ScheduleEmeraldDark,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            Surface(
                shape = RoundedCornerShape(10.dp),
                color = if (dayBooked > 0) ScheduleEmeraldSoft else Color(0xFFF1F5F9)
            ) {
                Text(
                    text = "$dayBooked/$dayCapacity lượt hẹn",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (dayBooked > 0) ScheduleEmeraldDark else ScheduleTextMuted,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }
        }

        // Shift Group Cards
        shiftGroups.forEach { (group, groupSlots) ->
            val sortedSlots = groupSlots.sortedBy { it.startTime }
            val firstTime = formatTimeOnly(sortedSlots.first().startTime)
            val lastTime = formatTimeOnly(sortedSlots.last().endTime)
            val groupBooked = sortedSlots.sumOf { it.bookedCount }
            val groupCapacity = sortedSlots.sumOf { it.capacity }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, ScheduleBorder),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Facility + Specialty Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .background(ScheduleEmeraldSoft, RoundedCornerShape(11.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Outlined.LocalHospital,
                                contentDescription = null,
                                tint = ScheduleEmeraldMid,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = group.facilityName,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 14.sp,
                                color = TextDark,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Surface(
                                    color = ScheduleEmeraldSoft,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = group.specialtyName,
                                        color = ScheduleEmeraldDark,
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                    )
                                }
                                group.roomName?.takeIf(String::isNotBlank)?.let { room ->
                                    Surface(
                                        color = Color(0xFFF1F5F9),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = room,
                                            color = Color(0xFF475569),
                                            fontSize = 10.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(Icons.Outlined.Schedule, contentDescription = null, tint = ScheduleTextMuted, modifier = Modifier.size(13.dp))
                                Text(
                                    text = "$firstTime – $lastTime · ${sortedSlots.size} khung giờ · Đã đặt $groupBooked/$groupCapacity",
                                    fontSize = 11.5.sp,
                                    color = ScheduleTextMuted
                                )
                            }
                        }
                    }

                    HorizontalDivider(color = Color(0xFFF1F5F9))

                    // Compact 3-Column Time Slot Grid
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        sortedSlots.chunked(3).forEach { rowSlots ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                rowSlots.forEach { slot ->
                                    SlotGridTile(
                                        slot = slot,
                                        modifier = Modifier.weight(1f),
                                        onClick = { onSelectSlot(slot) }
                                    )
                                }
                                repeat(3 - rowSlots.size) {
                                    Spacer(Modifier.weight(1f))
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
private fun SlotGridTile(
    slot: DoctorSlot,
    modifier: Modifier,
    onClick: () -> Unit
) {
    val isBooked = slot.bookedCount > 0
    val isFull = slot.bookedCount >= slot.capacity && slot.capacity > 0
    val timeText = formatTimeOnly(slot.startTime)

    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        color = when {
            isFull -> ScheduleEmeraldSoft
            isBooked -> Color(0xFFF0FDF4)
            else -> ScheduleSurfaceAlt
        },
        border = BorderStroke(
            width = 1.dp,
            color = when {
                isFull -> ScheduleEmeraldBorder
                isBooked -> Color(0xFFBBF7D0)
                else -> ScheduleBorder
            }
        )
    ) {
        Column(
            modifier = Modifier.padding(vertical = 9.dp, horizontal = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(3.dp)
        ) {
            Text(
                text = timeText,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 13.5.sp,
                color = if (isBooked) ScheduleEmeraldDark else TextDark
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .background(
                            if (isBooked) ScheduleEmeraldMid else Color(0xFFCBD5E1),
                            CircleShape
                        )
                )
                Text(
                    text = "${slot.bookedCount}/${slot.capacity} hẹn",
                    fontSize = 10.5.sp,
                    fontWeight = if (isBooked) FontWeight.Bold else FontWeight.Medium,
                    color = if (isBooked) ScheduleEmeraldMid else ScheduleTextMuted
                )
            }
        }
    }
}

@Composable
private fun RecurringShiftCard(recurring: DoctorSchedule) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, ScheduleBorder)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = ScheduleEmeraldSoft,
                border = BorderStroke(1.dp, ScheduleEmeraldBorder)
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        dayLabel(recurring.dayOfWeek),
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = ScheduleEmeraldDark
                    )
                    Text(
                        "${recurring.startTime}–${recurring.endTime}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = ScheduleEmeraldMid
                    )
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    recurring.doctorWorkplace.branch?.name ?: recurring.doctorWorkplace.hospital.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.5.sp,
                    color = TextDark
                )
                Text(
                    recurring.doctorWorkplace.specialty.name,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = ScheduleEmeraldMid
                )
                if (!recurring.breakStart.isNullOrBlank() && !recurring.breakEnd.isNullOrBlank()) {
                    Text(
                        "Nghỉ giữa ca: ${recurring.breakStart} – ${recurring.breakEnd}",
                        fontSize = 11.sp,
                        color = ScheduleTextMuted
                    )
                }
            }
        }
    }
}

@Composable
private fun SlotDetailDialog(slot: DoctorSlot, onDismiss: () -> Unit) {
    val isFull = slot.bookedCount >= slot.capacity && slot.capacity > 0
    AlertDialog(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(22.dp),
        containerColor = Color.White,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Chi tiết khung giờ trực", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = TextDark)
                    Text(
                        "${dateOnly(parseLocalDate(slot.startTime))} · ${formatTimeOnly(slot.startTime)} – ${formatTimeOnly(slot.endTime)}",
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = ScheduleEmeraldMid
                    )
                }
                IconButton(onClick = onDismiss, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Đóng", tint = ScheduleTextMuted, modifier = Modifier.size(18.dp))
                }
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (isFull) ScheduleEmeraldSoft else ScheduleSurfaceAlt,
                    border = BorderStroke(1.dp, if (isFull) ScheduleEmeraldBorder else ScheduleBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Tình trạng đặt lịch", fontSize = 12.sp, color = ScheduleTextMuted, fontWeight = FontWeight.SemiBold)
                        Text(
                            "${slot.bookedCount}/${slot.capacity} lịch hẹn" + if (isFull) " (Đã kín)" else " (Còn trống)",
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isFull) ScheduleEmeraldDark else TextDark
                        )
                    }
                }
                SlotMetaRow("Cơ sở y tế", slot.doctorWorkplace.hospital.name)
                slot.doctorWorkplace.branch?.name?.takeIf(String::isNotBlank)?.let {
                    SlotMetaRow("Chi nhánh", it)
                }
                SlotMetaRow("Chuyên khoa", slot.doctorWorkplace.specialty.name)
                slot.roomSession?.room?.let { room ->
                    SlotMetaRow("Phòng khám", "${room.code} · ${room.name}")
                }
                slot.roomSession?.service?.name?.takeIf(String::isNotBlank)?.let {
                    SlotMetaRow("Dịch vụ", it)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ScheduleEmeraldDark)
            ) {
                Text("Đóng", fontWeight = FontWeight.Bold)
            }
        }
    )
}

@Composable
private fun SlotMetaRow(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(label, fontSize = 11.sp, color = ScheduleTextMuted, fontWeight = FontWeight.SemiBold)
        Text(value, fontSize = 13.5.sp, color = TextDark, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ScheduleEmptyCard(title: String, subtitle: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, ScheduleBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(ScheduleEmeraldSoft, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.EventBusy, contentDescription = null, tint = ScheduleEmeraldMid, modifier = Modifier.size(26.dp))
            }
            Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 14.5.sp, color = TextDark, textAlign = TextAlign.Center)
            Text(subtitle, fontSize = 12.sp, color = ScheduleTextMuted, textAlign = TextAlign.Center, lineHeight = 17.sp)
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        Box(Modifier.size(8.dp).background(color, CircleShape))
        Text(label, fontSize = 11.sp, color = ScheduleTextMuted, fontWeight = FontWeight.Medium)
    }
}

private fun parseLocalDate(iso: String): LocalDate =
    runCatching { OffsetDateTime.parse(iso).atZoneSameInstant(vietnamZone).toLocalDate() }
        .getOrElse {
            runCatching { LocalDate.parse(iso.substringBefore('T')) }.getOrDefault(LocalDate.now(vietnamZone))
        }

private fun formatTimeOnly(iso: String): String =
    runCatching { OffsetDateTime.parse(iso).atZoneSameInstant(vietnamZone).format(DateTimeFormatter.ofPattern("HH:mm")) }
        .getOrElse { iso.substringAfter('T', iso).take(5) }

private fun shortWeekday(date: LocalDate): String = when (date.dayOfWeek.value) {
    1 -> "T2"
    2 -> "T3"
    3 -> "T4"
    4 -> "T5"
    5 -> "T6"
    6 -> "T7"
    else -> "CN"
}

private fun fullVietnameseDate(date: LocalDate): String {
    val dow = when (date.dayOfWeek.value) {
        1 -> "Thứ 2"
        2 -> "Thứ 3"
        3 -> "Thứ 4"
        4 -> "Thứ 5"
        5 -> "Thứ 6"
        6 -> "Thứ 7"
        else -> "Chủ nhật"
    }
    return "$dow, ${dateOnly(date)}"
}
