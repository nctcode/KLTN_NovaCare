package com.example.kltn_novacare.ui.screens.appointment

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.ui.draw.clip
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.Appointment
import com.example.kltn_novacare.data.model.AppointmentScreening
import com.example.kltn_novacare.data.model.BodyRegionMapper
import com.example.kltn_novacare.data.remote.ApiClient
import com.example.kltn_novacare.ui.screens.booking.bookingTime
import com.example.kltn_novacare.ui.screens.booking.RecordConsentPanel
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.Secondary
import com.example.kltn_novacare.ui.theme.TextSecondary
import com.example.kltn_novacare.ui.viewmodel.AppointmentViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import java.text.NumberFormat
import java.util.*
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlinx.coroutines.delay
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import coil.request.ImageRequest
import androidx.compose.material.icons.filled.AutoAwesome

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppointmentDetailScreen(
    appointmentId: String,
    navController: NavController,
    appointmentViewModel: AppointmentViewModel,
    onPay: (Appointment) -> Unit = {}
) {
    val detailState by appointmentViewModel.appointmentDetails.collectAsState()
    val cancelState by appointmentViewModel.cancelState.collectAsState()
    val screeningState by appointmentViewModel.appointmentScreening.collectAsState()
    val cancelling = cancelState is NetworkState.Loading
    var showCancelDialog by remember { mutableStateOf(false) }
    var cancelReason by remember { mutableStateOf("") }
    
    LaunchedEffect(appointmentId) {
        appointmentViewModel.loadDetails(appointmentId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết lịch hẹn", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            val appointment = (detailState as? NetworkState.Success<Appointment>)?.data
            if (appointment?.status == "AWAITING_PAYMENT") {
                Surface(color = Color.White, shadowElevation = 10.dp) {
                    Button(
                        onClick = { onPay(appointment) },
                        modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(16.dp).height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                    ) {
                        Text("Tiếp tục thanh toán", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFF8F9FA))
        ) {
            when (detailState) {
                is NetworkState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = Primary)
                }
                is NetworkState.Success -> {
                    val appointment = (detailState as NetworkState.Success<Appointment>).data
                    AppointmentDetailContent(
                        appointment = appointment,
                        screening = (screeningState as? NetworkState.Success<AppointmentScreening>)?.data,
                        screeningLoading = screeningState is NetworkState.Loading,
                        onRefresh = { appointmentViewModel.loadDetails(appointmentId); appointmentViewModel.loadUpcoming(); appointmentViewModel.loadHistory() },
                        onCancelClick = {
                            appointmentViewModel.resetCancelState()
                            showCancelDialog = true
                        }
                    )
                }
                is NetworkState.Error -> {
                    Text("Lỗi tải chi tiết lịch hẹn", color = Color.Red, modifier = Modifier.align(Alignment.Center))
                }
                else -> {}
            }
        }
    }

    // Cancel Booking Dialog
    if (showCancelDialog) {
        AlertDialog(
            onDismissRequest = { if (!cancelling) showCancelDialog = false },
            title = { Text("Hủy lịch khám", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Bạn có chắc chắn muốn hủy lịch khám này? Vui lòng nhập lý do hủy lịch khám bên dưới.", fontSize = 13.sp, color = TextSecondary)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        enabled = !cancelling,
                        value = cancelReason,
                        onValueChange = { cancelReason = it },
                        label = { Text("Lý do hủy lịch") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    (cancelState as? NetworkState.Error)?.let {
                        Text(it.message, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 12.dp))
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (cancelReason.isNotBlank()) {
                            appointmentViewModel.cancelAppointment(appointmentId, cancelReason) {
                                showCancelDialog = false
                            }
                        }
                    },
                    enabled = cancelReason.isNotBlank() && !cancelling,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
                ) {
                    Text(if (cancelling) "Đang hủy…" else "Xác nhận hủy", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(enabled = !cancelling, onClick = { showCancelDialog = false }) {
                    Text("Hủy bỏ", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun AppointmentDetailContent(
    appointment: Appointment,
    screening: AppointmentScreening? = null,
    screeningLoading: Boolean = false,
    onRefresh: () -> Unit = {},
    onCancelClick: () -> Unit
) {
    val scrollState = rememberScrollState()
    var now by remember { mutableStateOf(Instant.now()) }
    LaunchedEffect(appointment.id) {
        while (true) {
            now = Instant.now()
            delay(1000)
        }
    }
    val start = runCatching { Instant.parse(appointment.slot?.startTime) }.getOrNull()
    val active = appointment.status in listOf("PENDING", "AWAITING_PAYMENT", "CONFIRMED", "PAID")
    val received = appointment.medicalEncounter?.status in listOf("IN_PROGRESS", "COMPLETED", "PUBLISHED")
    val overdue = active && !received && start != null && !now.isBefore(start)
    // Match the server's existing exception for unpaid reservations.
    val canCancel = active && !received && (appointment.status == "AWAITING_PAYMENT" ||
        (start != null && !now.isAfter(start.minusSeconds(7200))))
    val formattedPrice = NumberFormat.getCurrencyInstance(Locale("vi", "VN")).format(appointment.totalAmount)
    var historyExpanded by rememberSaveable(appointment.id) { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AppointmentHeroCard(appointment)
        Spacer(modifier = Modifier.height(14.dp))

        AppointmentMedicalActions(appointment, onRefresh)
        // NO_SHOW Notice Banner
        if (appointment.status == "NO_SHOW") {
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Cơ sở y tế đã ghi nhận bạn không đến khám",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color(0xFF991B1B)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Lịch khám mã #${appointment.bookingCode} đã qua giờ hẹn và cơ sở y tế đã ghi nhận vắng mặt (NO_SHOW). Nếu có nhầm lẫn hoặc cần hỗ trợ dời lịch, vui lòng liên hệ trực tiếp với cơ sở y tế.",
                        fontSize = 12.sp,
                        color = Color(0xFFB91C1C),
                        lineHeight = 18.sp
                    )
                }
            }
        }

        // Details Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(38.dp).background(Color(0xFFECFDF5), RoundedCornerShape(11.dp)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.ReceiptLong, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Thông tin lịch khám", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF0F172A))
                        Text("Thông tin tiếp nhận và thanh toán", fontSize = 11.sp, color = Color(0xFF64748B))
                    }
                }
                
                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))

                val workplace = appointment.workplace ?: appointment.slot?.doctorWorkplace
                DetailRow("Hình thức khám", appointment.appointmentTypeLabel)
                DetailRow("Bác sĩ khám", workplace?.doctor?.fullName?.let { "BS. $it" } ?: "Chưa cập nhật")
                DetailRow("Cơ sở y tế", workplace?.hospital?.name ?: "Chưa cập nhật")
                
                val time = appointment.slot?.startTime?.let { bookingTime(it) } ?: "Chưa cập nhật"
                val date = appointment.slot?.startTime?.substringBefore("T") ?: ""
                DetailRow("Thời gian khám", "$time ngày $date")
                DetailRow("Bệnh nhân", appointment.patientProfile?.fullName ?: "Bệnh nhân")
                DetailRow("Lý do khám", appointment.reason ?: "Khám tổng quát")
                DetailRow("Phương thức", when (appointment.payment?.paymentMethod ?: appointment.paymentMethod) {
                    "VNPAY" -> "Ví điện tử VNPay"
                    "MOMO" -> "MoMo"
                    "VIETQR" -> "VietQR"
                    "CARD" -> "Thẻ"
                    "CASH" -> "Thanh toán tại quầy"
                    else -> if (appointment.status == "CONFIRMED") "Thanh toán tại cơ sở y tế" else "Chưa cập nhật"
                })
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Color(0xFFF1F5F9))
                DetailRow("Tổng chi phí", formattedPrice, emphasized = true)
                DetailRow("Thanh toán", when (appointment.payment?.status ?: appointment.paymentStatus) {
                    "PAID" -> "Đã thanh toán"
                    "REFUNDED" -> "Đã hoàn tiền"
                    else -> if (appointment.status == "PAID") "Đã thanh toán" else "Chưa xác nhận thanh toán"
                })
                DetailRow("Tình trạng khám", when {
                    appointment.status == "CANCELLED" -> "Đã hủy lịch"
                    appointment.status == "NO_SHOW" -> "Không đến khám"
                    appointment.status == "COMPLETED" || appointment.medicalEncounter?.status in listOf("COMPLETED", "PUBLISHED") -> "Đã hoàn thành khám"
                    received -> "Đã tiếp nhận / đang khám"
                    overdue -> "Đã qua giờ hẹn — chưa xác nhận tiếp nhận"
                    active -> "Chưa tiếp nhận"
                    else -> appointment.status
                })
                if (overdue) Text("Vui lòng liên hệ cơ sở để xác nhận tình trạng khám. Lịch không tự hoàn thành khi qua giờ hẹn.", color = MaterialTheme.colorScheme.error)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (appointment.preExamSession != null) {
            ScreeningAppointmentCard(screening, screeningLoading)
            Spacer(modifier = Modifier.height(16.dp))
        }

        val shareTarget = appointment.workplace?.hospital ?: appointment.slot?.doctorWorkplace?.hospital
        if (active && appointment.patientProfile != null && shareTarget != null) {
            RecordConsentPanel(
                profileId = appointment.patientProfile.id,
                targetId = shareTarget.id,
                targetName = shareTarget.name,
                validUntilAtLeast = appointment.slot?.startTime
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Status history timeline
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { historyExpanded = !historyExpanded },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(Modifier.size(38.dp).background(Color(0xFFEFF6FF), RoundedCornerShape(11.dp)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = Color(0xFF2563EB), modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Lịch sử cập nhật", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF0F172A))
                        Text("${appointment.statusHistory?.size ?: 1} mốc trạng thái", fontSize = 11.sp, color = Color(0xFF64748B))
                    }
                    Icon(if (historyExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, contentDescription = null, tint = Color(0xFF64748B))
                }

                if (historyExpanded) {
                    HorizontalDivider(modifier = Modifier.padding(vertical = 14.dp), color = Color(0xFFF1F5F9))
                    appointment.statusHistory?.let { history ->
                    history.forEachIndexed { index, item ->
                        TimelineItem(
                            title = when (item.status) {
                                "PENDING" -> "Chờ xác nhận"
                                "AWAITING_PAYMENT" -> "Chờ thanh toán"
                                "CONFIRMED" -> "Đã xác nhận lịch"
                                "PAID" -> "Đã thanh toán thành công"
                                "CANCELLED" -> "Đã hủy lịch khám"
                                "COMPLETED" -> "Đã hoàn thành buổi khám"
                                "NO_SHOW" -> "Không đến khám"
                                "EXPIRED" -> "Hết hạn giữ chỗ"
                                "REFUNDED" -> "Đã hoàn tiền"
                                else -> item.status
                            },
                            time = item.createdAt.substringBefore(".").replace("T", " "),
                            note = item.note,
                            isFirst = index == 0,
                            isLast = index == history.size - 1
                        )
                    }
                    } ?: TimelineItem(
                    title = "Đã đặt lịch hẹn",
                    time = appointment.createdAt.substringBefore("T"),
                    note = "Tạo lịch khám thành công trên thiết bị di động",
                    isFirst = true,
                    isLast = true
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Cancel Button if active
        if (active && !canCancel) {
            Text(if (received) "Lịch đã được tiếp nhận. Vui lòng liên hệ cơ sở để được hỗ trợ."
                else if (start == null) "Chưa xác định được thời hạn hủy. Vui lòng tải lại lịch hoặc liên hệ cơ sở."
                else "Đã hết thời hạn tự hủy lịch. Bạn chỉ có thể hủy trước giờ khám ít nhất 2 giờ. Vui lòng liên hệ cơ sở để được hỗ trợ.",
                color = MaterialTheme.colorScheme.error)
        }
        if (canCancel) {
            Button(
                onClick = onCancelClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFF1F2), contentColor = Color(0xFFBE123C))
            ) {
                Text("Hủy lịch hẹn", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
private fun AppointmentHeroCard(appointment: Appointment) {
    val workplace = appointment.workplace ?: appointment.slot?.doctorWorkplace
    val statusText = when (appointment.status) {
        "PENDING" -> "Chờ xác nhận"
        "AWAITING_PAYMENT" -> "Chờ thanh toán"
        "CONFIRMED" -> "Đã xác nhận"
        "PAID" -> "Đã thanh toán"
        "COMPLETED" -> "Đã hoàn thành"
        "CANCELLED" -> "Đã hủy"
        "NO_SHOW" -> "Không đến khám"
        "EXPIRED" -> "Đã hết hạn"
        else -> appointment.status
    }
    val statusColor = when (appointment.status) {
        "CANCELLED", "NO_SHOW", "EXPIRED" -> Color(0xFFFFE4E6) to Color(0xFFBE123C)
        "AWAITING_PAYMENT", "PENDING" -> Color(0xFFFEF3C7) to Color(0xFF92400E)
        else -> Color.White.copy(alpha = 0.18f) to Color.White
    }
    val dateText = appointment.slot?.startTime?.let { raw ->
        runCatching {
            LocalDate.parse(raw.substringBefore('T'))
                .format(DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy", Locale.forLanguageTag("vi-VN")))
                .replaceFirstChar { it.uppercase() }
        }.getOrDefault(raw.substringBefore('T'))
    } ?: "Chưa cập nhật lịch khám"
    val timeText = appointment.slot?.startTime?.let(::bookingTime) ?: "--:--"

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF047857)),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(appointment.appointmentTypeLabel.uppercase(), color = Color(0xFFA7F3D0), fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp, modifier = Modifier.weight(1f))
                Surface(color = statusColor.first, shape = RoundedCornerShape(50)) {
                    Text(statusText, color = statusColor.second, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp))
                }
            }
            Text(appointment.bookingCode, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
            HorizontalDivider(color = Color.White.copy(alpha = 0.16f))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(44.dp).background(Color.White.copy(alpha = 0.14f), RoundedCornerShape(13.dp)), contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = Color.White, modifier = Modifier.size(23.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(dateText, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("$timeText · ${workplace?.doctor?.fullName?.let { "BS. $it" } ?: "Bác sĩ đang cập nhật"}", color = Color.White.copy(alpha = 0.82f), fontSize = 12.sp)
                }
            }
            Row(verticalAlignment = Alignment.Top) {
                Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color(0xFFA7F3D0), modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(workplace?.hospital?.name ?: "Cơ sở y tế đang cập nhật", color = Color.White.copy(alpha = 0.9f), fontSize = 12.sp, lineHeight = 17.sp)
            }
        }
    }
}

@Composable
private fun ScreeningAppointmentCard(screening: AppointmentScreening?, loading: Boolean) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    val context = LocalContext.current
    val recommendation = screening?.recommendations?.takeIf { it.isJsonObject }?.asJsonObject
    val summary = recommendation?.get("summary")?.takeIf { it.isJsonPrimitive }?.asString
    val specialty = recommendation?.get("recommendedSpecialtyName")?.takeIf { it.isJsonPrimitive }?.asString
    val ppg = screening?.structuredData?.get("ppg")?.takeIf { it.isJsonObject }?.asJsonObject
    val bpm = ppg?.get("bpm")?.takeIf { it.isJsonPrimitive }?.asInt
    val regionsArray = screening?.bodyDiagramData?.get("regions")?.takeIf { it.isJsonArray }?.asJsonArray
    val regions = regionsArray?.mapNotNull { item ->
        if (item.isJsonPrimitive) {
            val str = item.asString
            BodyRegionMapper.findRegionById(str)?.name ?: str.replace('_', ' ')
        } else null
    }?.joinToString(", ")
    val riskLabel = when (screening?.riskLevel?.uppercase()) {
        "MONITOR" -> "Theo dõi"
        "CONSULT" -> "Nên khám bác sĩ"
        "URGENT" -> "Cần khám sớm"
        "EMERGENCY" -> "Khẩn cấp"
        else -> screening?.riskLevel
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA7F3D0)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(42.dp).background(Color(0xFF059669), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.White)
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("Phiếu sàng lọc AI trước khám", fontWeight = FontWeight.Bold, color = Color(0xFF065F46), fontSize = 15.sp)
                    Text("Được đính kèm an toàn với lịch khám này", color = Color(0xFF047857), fontSize = 12.sp)
                }
                if (loading) CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.dp, color = Color(0xFF059669))
            }
            if (screening != null) {
                summary?.takeIf(String::isNotBlank)?.let { Text(it, color = Color(0xFF334155), fontSize = 13.sp, lineHeight = 19.sp) }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    specialty?.takeIf(String::isNotBlank)?.let { AssistChip(onClick = {}, label = { Text(it, fontSize = 11.sp) }) }
                    bpm?.let { AssistChip(onClick = {}, label = { Text("$it nhịp/phút", fontSize = 11.sp) }) }
                    riskLabel?.takeIf(String::isNotBlank)?.let { AssistChip(onClick = {}, label = { Text("Mức sàng lọc: $it", fontSize = 11.sp) }) }
                }
                TextButton(onClick = { expanded = !expanded }, contentPadding = PaddingValues(0.dp)) {
                    Text(if (expanded) "Thu gọn phiếu" else "Xem toàn bộ thông tin", fontWeight = FontWeight.Bold, color = Color(0xFF047857))
                    Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, contentDescription = null)
                }
                if (expanded) {
                    HorizontalDivider(color = Color(0xFFA7F3D0))
                    screening.symptoms?.takeIf(String::isNotBlank)?.let { ScreeningValue("Triệu chứng bệnh nhân mô tả", it) }
                    regions?.takeIf(String::isNotBlank)?.let { ScreeningValue("Vùng cơ thể đã chọn", it) }
                    screening.voiceTranscript?.takeIf(String::isNotBlank)?.let { ScreeningValue("Lời kể đã xác nhận", it) }
                    if (!screening.questions.isNullOrEmpty()) {
                        Text("Câu hỏi sàng lọc", fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontSize = 13.sp)
                        screening.questions.forEachIndexed { index, item ->
                            Surface(color = Color.White.copy(alpha = 0.82f), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(12.dp)) {
                                    Text("${index + 1}. ${item.question.orEmpty()}", fontSize = 12.sp, color = Color(0xFF475569))
                                    Text(localizedScreeningAnswer(item.answer), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF065F46), modifier = Modifier.padding(top = 4.dp))
                                }
                            }
                        }
                    }
                    val images = screening.media.orEmpty().filter { it.type == "SYMPTOM_IMAGE" }
                    if (images.isNotEmpty()) {
                        Text("Ảnh tổn thương (${images.size})", fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontSize = 13.sp)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            images.take(3).forEach { media ->
                                val request = remember(media.id) {
                                    ImageRequest.Builder(context)
                                        .data(ApiClient.getRealtimeBaseUrl() + media.fileUrl)
                                        .apply { ApiClient.getTokenManager().getAccessToken()?.let { addHeader("Authorization", "Bearer $it") } }
                                        .crossfade(true).build()
                                }
                                AsyncImage(
                                    model = request,
                                    contentDescription = "Ảnh tổn thương",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.weight(1f).aspectRatio(1f).clip(RoundedCornerShape(12.dp))
                                )
                            }
                        }
                    }
                    Text("Thông tin do bệnh nhân cung cấp và AI hỗ trợ định hướng; không thay thế chẩn đoán của bác sĩ.", fontSize = 11.sp, color = Color(0xFF64748B), lineHeight = 16.sp)
                }
            }
        }
    }
}

private fun localizedScreeningAnswer(value: String?): String = when (value?.trim()?.lowercase()) {
    "yes", "true" -> "Có"
    "no", "false" -> "Không"
    "unknown", "unsure" -> "Không chắc"
    "none" -> "Không có"
    else -> value.orEmpty()
}

@Composable
private fun ScreeningValue(label: String, value: String?) {
    if (value.isNullOrBlank()) return
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(label, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A), fontSize = 12.sp)
        Text(value, color = Color(0xFF475569), fontSize = 13.sp, lineHeight = 18.sp)
    }
}

@Composable
fun DetailRow(label: String, value: String, emphasized: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Text(text = label, color = TextSecondary, fontSize = 12.sp, modifier = Modifier.width(112.dp))
        Text(
            text = value,
            color = if (emphasized) Color(0xFF047857) else Color(0xFF0F172A),
            fontSize = if (emphasized) 15.sp else 13.sp,
            fontWeight = if (emphasized) FontWeight.ExtraBold else FontWeight.SemiBold,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun TimelineItem(
    title: String,
    time: String,
    note: String?,
    isFirst: Boolean,
    isLast: Boolean
) {
    Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(24.dp)) {
            // Circle node
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(if (isFirst) Primary else Color(0xFFE2E8F0))
            )
            // Vertical timeline connecting line
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .width(2.dp)
                        .background(Color(0xFFE2E8F0))
                )
            }
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.padding(bottom = 16.dp)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = if (isFirst) Primary else Secondary)
            Text(time, fontSize = 11.sp, color = TextSecondary, modifier = Modifier.padding(top = 2.dp))
            if (!note.isNullOrBlank()) {
                Text(note, fontSize = 12.sp, color = Secondary, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}
