package com.example.kltn_novacare.ui.screens.consultation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Videocam
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
import com.example.kltn_novacare.data.model.displayFullNameWithTitle
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.screens.booking.BookingInfoContent
import com.example.kltn_novacare.ui.screens.booking.BookingJourney
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.*

@Composable
fun VideoBookingScreen(
    doctorId: String,
    workplaceId: String,
    navController: NavController,
    bookingViewModel: BookingViewModel,
    doctorViewModel: DoctorViewModel,
    patientViewModel: PatientViewModel,
    consultationViewModel: ConsultationViewModel
) {
    val bookingState by bookingViewModel.uiState.collectAsState()
    val doctorDetails by doctorViewModel.doctorDetails.collectAsState()
    var initialized by rememberSaveable(doctorId, workplaceId) { mutableStateOf(false) }

    LaunchedEffect(doctorId, workplaceId) {
        if (!initialized) {
            val profile = bookingState.selectedProfile
            bookingViewModel.resetBooking()
            profile?.let(bookingViewModel::selectProfile)
            bookingViewModel.setBookingType("VIDEO")
            consultationViewModel.resetCreateState()
            initialized = true
        }
        doctorViewModel.getDoctorById(doctorId)
    }

    LaunchedEffect(doctorDetails) {
        val doctor = (doctorDetails as? NetworkState.Success)?.data
        if (doctor?.id == doctorId) {
            doctor.workPlaces?.firstOrNull { it.id == workplaceId }?.let {
                bookingViewModel.selectDoctor(doctor, it)
            }
        }
    }

    BookingJourney(
        bookingViewModel = bookingViewModel,
        patientViewModel = patientViewModel,
        navController = navController,
        onBackFromInfo = { navController.popBackStack() },
        completionContent = { state ->
            VideoBookingCompleted(
                state = state,
                viewModel = consultationViewModel,
                onOpen = { id ->
                    navController.navigate(Screen.ConsultationChat.createRoute(id)) {
                        popUpTo(Screen.VideoDoctors.route)
                    }
                },
                onHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            )
        }
    ) {
        if (bookingState.workplace?.id == workplaceId && bookingState.doctor?.id == doctorId) {
            BookingInfoContent(bookingViewModel, doctorViewModel, allowDoctorSelection = false)
        } else {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                when (val current = doctorDetails) {
                    is NetworkState.Error -> Text(current.message, color = StatusErrorText)
                    else -> CircularProgressIndicator(color = Primary)
                }
            }
        }
    }
}

@Composable
private fun VideoBookingCompleted(
    state: BookingUiState,
    viewModel: ConsultationViewModel,
    onOpen: (String) -> Unit,
    onHome: () -> Unit
) {
    val createState by viewModel.createState.collectAsState()
    val appointment = state.createdAppointment
    var requested by rememberSaveable(appointment?.id) { mutableStateOf(false) }

    LaunchedEffect(appointment?.id, appointment?.status) {
        if (!requested && appointment != null && appointment.status in listOf("PAID", "CONFIRMED")) {
            requested = true
            viewModel.createVideoConsultation(appointment.id, onOpen)
        }
    }

    Column(
        Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            Modifier.size(82.dp).background(PrimaryLight, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Videocam, contentDescription = null, tint = Primary, modifier = Modifier.size(42.dp))
            Box(Modifier.size(25.dp).background(Primary, CircleShape).align(Alignment.BottomEnd), contentAlignment = Alignment.Center) {
                Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
            }
        }
        Spacer(Modifier.height(18.dp))
        Text("Đã đặt lịch gọi video", color = TextPrimary, fontWeight = FontWeight.ExtraBold, fontSize = 21.sp)
        Text(
            "NovaCare đang chuẩn bị phòng video và chat cho lịch hẹn của bạn.",
            color = TextSecondary,
            fontSize = 13.sp,
            lineHeight = 19.sp
        )
        Spacer(Modifier.height(18.dp))
        Surface(
            color = Color.White,
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, Border),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Schedule, contentDescription = null, tint = Primary)
                Spacer(Modifier.width(10.dp))
                Column {
                    Text(state.doctor?.displayFullNameWithTitle ?: "Bác sĩ tư vấn", fontWeight = FontWeight.Bold, color = TextPrimary)
                    Text("Mã lịch: ${appointment?.bookingCode.orEmpty()}", color = TextSecondary, fontSize = 12.sp)
                }
            }
        }
        Spacer(Modifier.height(18.dp))
        when (val current = createState) {
            is NetworkState.Loading, NetworkState.Idle -> {
                CircularProgressIndicator(color = Primary)
                Text("Đang tạo phòng video...", color = TextSecondary, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
            }
            is NetworkState.Error -> {
                Text(current.message, color = StatusErrorText, fontSize = 12.sp)
                Spacer(Modifier.height(10.dp))
                Button(
                    onClick = {
                        appointment?.let { viewModel.createVideoConsultation(it.id, onOpen) }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) { Text("Thử tạo lại phòng video") }
            }
            is NetworkState.Success -> {
                Button(
                    onClick = { onOpen(current.data.id) },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) { Text("Mở phòng tư vấn", color = Color.White, fontWeight = FontWeight.Bold) }
            }
        }
        TextButton(onClick = onHome) { Text("Về trang chủ", color = PrimaryDark) }
    }
}
