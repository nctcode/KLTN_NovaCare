package com.example.kltn_novacare.ui.screens.appointment

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.ui.draw.clip
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.Appointment
import com.example.kltn_novacare.ui.components.QRCodeDraw
import com.example.kltn_novacare.ui.screens.booking.bookingTime
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.Secondary
import com.example.kltn_novacare.ui.theme.TextSecondary
import com.example.kltn_novacare.ui.viewmodel.AppointmentViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppointmentDetailScreen(
    appointmentId: String,
    navController: NavController,
    appointmentViewModel: AppointmentViewModel,
    onPay: (Appointment) -> Unit = {}
) {
    val detailState by appointmentViewModel.appointmentDetails.collectAsState()
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
                    Column {
                        if (appointment.status == "AWAITING_PAYMENT") {
                            Button(onClick = { onPay(appointment) }, modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                                Text("Tiếp tục thanh toán")
                            }
                        }
                    AppointmentDetailContent(
                        appointment = appointment,
                        onCancelClick = { showCancelDialog = true }
                    )
                    }
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
            onDismissRequest = { showCancelDialog = false },
            title = { Text("Hủy lịch khám", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Bạn có chắc chắn muốn hủy lịch khám này? Vui lòng nhập lý do hủy lịch khám bên dưới.", fontSize = 13.sp, color = TextSecondary)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = cancelReason,
                        onValueChange = { cancelReason = it },
                        label = { Text("Lý do hủy lịch") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
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
                    enabled = cancelReason.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
                ) {
                    Text("Xác nhận hủy", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = false }) {
                    Text("Hủy bỏ", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun AppointmentDetailContent(
    appointment: Appointment,
    onCancelClick: () -> Unit
) {
    val scrollState = rememberScrollState()
    val formattedPrice = NumberFormat.getCurrencyInstance(Locale("vi", "VN")).format(appointment.totalAmount)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // QR Code Ticket
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Mã số tiếp nhận: ${appointment.bookingCode}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Secondary
                )
                Text(
                    text = "Xuất trình mã đặt khám tại quầy tiếp đón của bệnh viện",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Details Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Thông tin lịch khám", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Secondary)
                
                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))

                val workplace = appointment.workplace ?: appointment.slot?.doctorWorkplace
                DetailRow("Bác sĩ khám", workplace?.doctor?.fullName ?: "Chưa cập nhật")
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
                DetailRow("Tổng chi phí", formattedPrice)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Status history timeline
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Trạng thái & Lịch sử cập nhật", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Secondary)
                
                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))

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

        Spacer(modifier = Modifier.height(24.dp))

        // Cancel Button if active
        val isCancellable = appointment.status == "PENDING" || appointment.status == "AWAITING_PAYMENT" || appointment.status == "CONFIRMED" || appointment.status == "PAID"
        if (isCancellable) {
            Button(
                onClick = onCancelClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
            ) {
                Text("Hủy lịch hẹn", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Text(text = label, color = TextSecondary, fontSize = 13.sp, modifier = Modifier.width(120.dp))
        Text(text = value, color = Secondary, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
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
