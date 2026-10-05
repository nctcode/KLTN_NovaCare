package com.example.kltn_novacare.ui.screens.appointment

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.outlined.*
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
import com.example.kltn_novacare.ui.components.BottomNavigationBar
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.AppointmentViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppointmentListScreen(
    navController: NavController,
    appointmentViewModel: AppointmentViewModel
) {
    var selectedTab by remember { mutableStateOf(0) }
    val upcomingState by appointmentViewModel.upcomingAppointments.collectAsState()
    val historyState by appointmentViewModel.historyAppointments.collectAsState()

    LaunchedEffect(selectedTab) {
        if (selectedTab == 0) {
            appointmentViewModel.loadUpcoming()
        } else {
            appointmentViewModel.loadHistory()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "Lịch khám của tôi",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = TextPrimary
                        )
                        Text(
                            "Theo dõi lịch hẹn và kết quả khám bệnh",
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            BottomNavigationBar(navController = navController, currentRoute = Screen.Appointments.route)
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Background)
        ) {
            // Modern Segmented Tab Bar
            Surface(
                color = Color.White,
                shadowElevation = 1.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFF1F5F9), RoundedCornerShape(12.dp))
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Tab 0: Sắp tới
                        Surface(
                            onClick = { selectedTab = 0 },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            color = if (selectedTab == 0) Color.White else Color.Transparent,
                            shadowElevation = if (selectedTab == 0) 2.dp else 0.dp
                        ) {
                            Box(
                                modifier = Modifier.padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Sắp tới",
                                    fontWeight = if (selectedTab == 0) FontWeight.ExtraBold else FontWeight.SemiBold,
                                    fontSize = 13.sp,
                                    color = if (selectedTab == 0) PrimaryDark else TextSecondary
                                )
                            }
                        }

                        // Tab 1: Lịch sử
                        Surface(
                            onClick = { selectedTab = 1 },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            color = if (selectedTab == 1) Color.White else Color.Transparent,
                            shadowElevation = if (selectedTab == 1) 2.dp else 0.dp
                        ) {
                            Box(
                                modifier = Modifier.padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Lịch sử khám",
                                    fontWeight = if (selectedTab == 1) FontWeight.ExtraBold else FontWeight.SemiBold,
                                    fontSize = 13.sp,
                                    color = if (selectedTab == 1) PrimaryDark else TextSecondary
                                )
                            }
                        }
                    }
                }
            }

            // List content
            val activeState = if (selectedTab == 0) upcomingState else historyState

            Box(modifier = Modifier.weight(1f)) {
                when (activeState) {
                    is NetworkState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Primary, strokeWidth = 3.dp)
                        }
                    }
                    is NetworkState.Success -> {
                        val appointments = (activeState as NetworkState.Success<List<Appointment>>).data
                        if (appointments.isEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(32.dp),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(72.dp)
                                        .background(PrimaryLight, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Outlined.EventAvailable,
                                        contentDescription = null,
                                        tint = PrimaryDark,
                                        modifier = Modifier.size(36.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = if (selectedTab == 0) "Chưa có lịch khám sắp tới" else "Chưa có lịch sử khám bệnh",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = TextPrimary,
                                    fontSize = 16.sp
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = if (selectedTab == 0)
                                        "Hãy chủ động đặt lịch khám định kỳ để bảo vệ sức khỏe của bạn và gia đình."
                                    else
                                        "Các lịch khám đã hoàn tất hoặc đã hủy sẽ hiển thị lưu trữ tại đây.",
                                    color = TextSecondary,
                                    fontSize = 12.sp,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                    lineHeight = 17.sp
                                )
                                if (selectedTab == 0) {
                                    Spacer(modifier = Modifier.height(20.dp))
                                    Button(
                                        onClick = { navController.navigate(Screen.Search.route) },
                                        colors = ButtonDefaults.buttonColors(containerColor = Primary),
                                        shape = RoundedCornerShape(12.dp),
                                        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp)
                                    ) {
                                        Icon(
                                            Icons.Outlined.AddCircleOutline,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Đặt khám ngay", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }
                            }
                        } else {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                item {
                                    Text(
                                        text = if (selectedTab == 0) "Danh sách lịch hẹn sắp tới (${appointments.size})" else "Lịch sử khám (${appointments.size})",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextSecondary,
                                        modifier = Modifier.padding(bottom = 2.dp)
                                    )
                                }
                                items(appointments) { app ->
                                    AppointmentItem(appointment = app) {
                                        navController.navigate(Screen.AppointmentDetail.createRoute(app.id))
                                    }
                                }
                            }
                        }
                    }
                    is NetworkState.Error -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "Lỗi kết nối CSDL",
                                color = Color(0xFFEF4444),
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = {
                                    if (selectedTab == 0) appointmentViewModel.loadUpcoming()
                                    else appointmentViewModel.loadHistory()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Thử lại", color = Color.White)
                            }
                        }
                    }
                    else -> {}
                }
            }
        }
    }
}

@Composable
fun AppointmentItem(appointment: Appointment, onClick: () -> Unit) {
    val statusText = when (appointment.status) {
        "PENDING" -> "Chờ xác nhận"
        "AWAITING_PAYMENT" -> "Chờ thanh toán"
        "CONFIRMED" -> "Đã xác nhận"
        "PAID" -> "Đã thanh toán"
        "COMPLETED" -> "Đã hoàn thành"
        "CANCELLED" -> "Đã hủy"
        "EXPIRED" -> "Đã hết hạn"
        else -> appointment.status
    }

    val (statusBg, statusTextColor) = when (appointment.status) {
        "CONFIRMED", "PAID" -> Pair(StatusSuccessBg, StatusSuccessText)
        "COMPLETED" -> Pair(Color(0xFFEFF6FF), Color(0xFF1E40AF))
        "PENDING", "AWAITING_PAYMENT" -> Pair(StatusWarningBg, StatusWarningText)
        "CANCELLED", "EXPIRED" -> Pair(StatusErrorBg, StatusErrorText)
        else -> Pair(PrimaryLight, PrimaryDark)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row: Code & Soft Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Outlined.ConfirmationNumber,
                        contentDescription = null,
                        tint = TextSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = appointment.bookingCode,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 13.sp,
                        color = TextPrimary
                    )
                }

                Surface(
                    color = statusBg,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = statusText,
                        color = statusTextColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = BorderLight
            )

            // Specialty & Medical Workplace
            Text(
                text = (appointment.workplace ?: appointment.slot?.doctorWorkplace)?.specialty?.name ?: "Khám tổng quát",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 16.sp,
                color = TextPrimary
            )

            // Patient Name
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 6.dp)
            ) {
                Icon(
                    Icons.Outlined.Person,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Bệnh nhân: ${appointment.patientProfile?.fullName ?: "Thành viên"}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = TextSecondary
                )
            }

            // Time & Date Strip
            val time = appointment.slot?.startTime?.let { com.example.kltn_novacare.ui.screens.booking.bookingTime(it) } ?: "Chưa cập nhật"
            val date = appointment.slot?.startTime?.substringBefore("T") ?: ""

            Surface(
                color = Background,
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, Border),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Outlined.AccessTime,
                        contentDescription = null,
                        tint = PrimaryDark,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "$time • $date",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryDark
                    )
                }
            }

            // Bottom CTA row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Xem chi tiết",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryDark
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = PrimaryDark,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
