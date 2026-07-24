package com.example.kltn_novacare.ui.screens.appointment

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.Secondary
import com.example.kltn_novacare.ui.theme.TextSecondary
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
                title = { Text("Lịch khám của tôi", fontWeight = FontWeight.Bold) },
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
                .background(Color(0xFFF8F9FA))
        ) {
            // Tabs
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White,
                contentColor = Primary
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Sắp tới", fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Lịch sử", fontWeight = FontWeight.Bold, fontSize = 14.sp) }
                )
            }

            // List content
            val activeState = if (selectedTab == 0) upcomingState else historyState
            
            Box(modifier = Modifier.weight(1f)) {
                when (activeState) {
                    is NetworkState.Loading -> {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = Primary)
                    }
                    is NetworkState.Success -> {
                        val appointments = (activeState as NetworkState.Success<List<Appointment>>).data
                        if (appointments.isEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(24.dp),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = if (selectedTab == 0) "Bạn không có lịch khám sắp tới" else "Chưa có lịch sử khám bệnh",
                                    fontWeight = FontWeight.Bold,
                                    color = Secondary,
                                    fontSize = 15.sp
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Hãy đặt khám ngay để bảo vệ sức khỏe của bạn.",
                                    color = TextSecondary,
                                    fontSize = 12.sp
                                )
                            }
                        } else {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(appointments) { app ->
                                    AppointmentItem(appointment = app) {
                                        navController.navigate(Screen.AppointmentDetail.createRoute(app.id))
                                    }
                                }
                            }
                        }
                    }
                    is NetworkState.Error -> {
                        Text(
                            text = "Lỗi kết nối CSDL",
                            color = Color.Red,
                            modifier = Modifier.align(Alignment.Center)
                        )
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

    val statusColor = when (appointment.status) {
        "CONFIRMED", "PAID" -> Color(0xFF10B981) // Green
        "PENDING", "AWAITING_PAYMENT" -> Color(0xFFF59E0B) // Amber
        "CANCELLED", "EXPIRED" -> Color(0xFFEF4444) // Red
        else -> Primary
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Mã lịch: ${appointment.bookingCode}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Secondary
                )
                Surface(
                    color = statusColor.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = statusText,
                        color = statusColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            
            Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))

            Text(
                text = appointment.workplace?.specialty?.name ?: "Chuyên khoa Ngoại",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = Secondary
            )
            
            Text(
                text = appointment.patientProfile?.fullName ?: "Bệnh nhân",
                fontSize = 13.sp,
                color = TextSecondary,
                modifier = Modifier.padding(top = 4.dp)
            )

            val time = appointment.slot?.startTime?.substringBeforeLast(":")?.substringAfter("T") ?: "08:00"
            val date = appointment.slot?.startTime?.substringBefore("T") ?: "2026-07-20"
            Text(
                text = "Thời gian: $time ngày $date",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Primary,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}
