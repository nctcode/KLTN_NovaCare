package com.example.kltn_novacare.ui.screens.booking

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.Secondary
import com.example.kltn_novacare.ui.theme.TextSecondary
import com.example.kltn_novacare.ui.viewmodel.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingScreen(
    doctorId: String,
    workplaceId: String,
    navController: NavController,
    bookingViewModel: BookingViewModel,
    doctorViewModel: DoctorViewModel,
    patientViewModel: PatientViewModel
) {
    val uiState by bookingViewModel.uiState.collectAsState()
    val availableSlotsState by doctorViewModel.availableSlots.collectAsState()
    val profilesState by patientViewModel.profiles.collectAsState()

    // 7 Days generator for horizontal scroll
    val calendarDays = remember {
        val list = mutableListOf<Date>()
        val cal = Calendar.getInstance()
        for (i in 0..6) {
            list.add(cal.time)
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        list
    }

    var selectedDateIndex by remember { mutableStateOf(0) }
    val dateFormat = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()) }
    val displayDayFormat = remember { SimpleDateFormat("dd", Locale.getDefault()) }
    val displayDayOfWeekFormat = remember { SimpleDateFormat("EE", Locale("vi")) }

    // Init values
    LaunchedEffect(doctorId, workplaceId, selectedDateIndex) {
        if (uiState.idempotencyKey.isEmpty()) {
            bookingViewModel.resetBooking()
        }
        // Load doctor details if null
        doctorViewModel.getDoctorById(doctorId)
        // Load profiles
        patientViewModel.loadProfiles()
        // Load slots for selected day
        val selectedDateStr = dateFormat.format(calendarDays[selectedDateIndex])
        doctorViewModel.loadAvailableSlots(doctorId, workplaceId, selectedDateStr)
    }

    val doctorDetailsState by doctorViewModel.doctorDetails.collectAsState()

    LaunchedEffect(doctorDetailsState) {
        if (doctorDetailsState is NetworkState.Success) {
            val doctor = (doctorDetailsState as NetworkState.Success).data
            val workplace = doctor.hospital?.let {
                com.example.kltn_novacare.data.model.DoctorWorkplace(
                    id = workplaceId,
                    doctorId = doctorId,
                    hospitalId = it.id,
                    specialtyId = doctor.specialties?.firstOrNull()?.id ?: "",
                    price = 150000.0,
                    hospital = it,
                    specialty = doctor.specialties?.firstOrNull()
                )
            }
            if (workplace != null) {
                bookingViewModel.selectDoctor(doctor, workplace)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Đặt lịch: Bước ${uiState.currentStep}/5", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = {
                        if (uiState.currentStep > 1) {
                            bookingViewModel.setStep(uiState.currentStep - 1)
                        } else {
                            navController.popBackStack()
                        }
                    }) {
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
            when (uiState.currentStep) {
                1 -> StepSelectDateTime(
                    calendarDays = calendarDays,
                    selectedDateIndex = selectedDateIndex,
                    dayOfWeekFormat = displayDayOfWeekFormat,
                    dayFormat = displayDayFormat,
                    onDateSelected = { selectedDateIndex = it },
                    slotsState = availableSlotsState,
                    selectedSlot = uiState.selectedSlot,
                    onSlotSelected = { slot ->
                        val dateStr = dateFormat.format(calendarDays[selectedDateIndex])
                        bookingViewModel.selectDateTime(dateStr, slot)
                    }
                )
                2 -> StepSelectProfile(
                    profilesState = profilesState,
                    selectedProfile = uiState.selectedProfile,
                    onProfileSelected = { profile ->
                        bookingViewModel.selectProfile(profile)
                    },
                    onAddNewProfile = {
                        navController.navigate(Screen.Profiles.route)
                    }
                )
                3 -> StepEnterDetails(
                    reason = uiState.reason,
                    symptoms = uiState.symptoms,
                    onDetailsEntered = { reason, symptoms ->
                        bookingViewModel.setDetails(reason, symptoms)
                        bookingViewModel.setStep(4)
                    }
                )
                4 -> StepConfirmSummary(
                    uiState = uiState,
                    onConfirmed = {
                        bookingViewModel.setStep(5)
                    }
                )
                5 -> StepSelectPayment(
                    uiState = uiState,
                    bookingViewModel = bookingViewModel,
                    navController = navController,
                    onBookingSuccess = { appointment ->
                        if (uiState.paymentMethod == "VNPAY") {
                            bookingViewModel.createVNPayPayment(appointment.id)
                        } else {
                            navController.navigate(Screen.AppointmentDetail.createRoute(appointment.id)) {
                                popUpTo(Screen.Home.route)
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun StepSelectDateTime(
    calendarDays: List<Date>,
    selectedDateIndex: Int,
    dayOfWeekFormat: SimpleDateFormat,
    dayFormat: SimpleDateFormat,
    onDateSelected: (Int) -> Unit,
    slotsState: NetworkState<List<AppointmentSlot>>,
    selectedSlot: AppointmentSlot?,
    onSlotSelected: (AppointmentSlot) -> Unit
) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Chọn ngày khám", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Secondary)
        Spacer(modifier = Modifier.height(8.dp))
        
        // Days row
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(calendarDays.size) { index ->
                val date = calendarDays[index]
                val isSelected = index == selectedDateIndex
                Card(
                    modifier = Modifier
                        .width(60.dp)
                        .height(75.dp)
                        .clickable { onDateSelected(index) },
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) Primary else Color.White
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = dayOfWeekFormat.format(date).uppercase(),
                            fontSize = 11.sp,
                            color = if (isSelected) Color.White else TextSecondary
                        )
                        Text(
                            text = dayFormat.format(date),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.White else Secondary
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text("Chọn giờ khám còn trống", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Secondary)
        Spacer(modifier = Modifier.height(8.dp))

        // Slots grid
        when (slotsState) {
            is NetworkState.Loading -> {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally).padding(32.dp), color = Primary)
            }
            is NetworkState.Success -> {
                val slots = slotsState.data
                if (slots.isEmpty()) {
                    Text(
                        "Không có khung giờ trống nào trong ngày này. Vui lòng chọn ngày khác.",
                        color = TextSecondary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(32.dp)
                    )
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(slots) { slot ->
                            val isSelected = slot.id == selectedSlot?.id
                            val timeText = slot.startTime.substringBeforeLast(":").substringAfter("T").ifBlank { "08:00" }
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(42.dp)
                                    .clickable { onSlotSelected(slot) },
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) Primary else Color.White
                                ),
                                shape = RoundedCornerShape(6.dp),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Text(
                                        text = timeText,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isSelected) Color.White else Secondary
                                    )
                                }
                            }
                        }
                    }
                }
            }
            is NetworkState.Error -> {
                Text("Không thể tải lịch khám", color = Color.Red, modifier = Modifier.align(Alignment.CenterHorizontally))
            }
            else -> {}
        }
    }
}

@Composable
fun StepSelectProfile(
    profilesState: NetworkState<List<PatientProfile>>,
    selectedProfile: PatientProfile?,
    onProfileSelected: (PatientProfile) -> Unit,
    onAddNewProfile: () -> Unit
) {
    Column(modifier = Modifier.padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Chọn hồ sơ người bệnh", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Secondary)
            TextButton(onClick = onAddNewProfile) {
                Text("+ Thêm mới", color = Primary, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        when (profilesState) {
            is NetworkState.Loading -> {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally).padding(32.dp), color = Primary)
            }
            is NetworkState.Success -> {
                val profiles = profilesState.data
                if (profiles.isEmpty()) {
                    Text(
                        "Bạn chưa có hồ sơ người khám nào. Vui lòng bấm Thêm mới để tiếp tục.",
                        color = TextSecondary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(32.dp)
                    )
                } else {
                    Column(
                        modifier = Modifier.verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        profiles.forEach { profile ->
                            val isSelected = profile.id == selectedProfile?.id
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onProfileSelected(profile) },
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = if (isSelected) BorderStroke(2.dp, Primary) else null,
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(selected = isSelected, onClick = { onProfileSelected(profile) })
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(profile.fullName, fontWeight = FontWeight.Bold, color = Secondary)
                                        Text("SĐT: ${profile.phone}", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(top = 2.dp))
                                        Text(
                                            text = "Mối quan hệ: " + when (profile.relationship) {
                                                "BAN_THAN" -> "Bản thân"
                                                "CHA_ME" -> "Bố mẹ"
                                                "VO_CHONG" -> "Vợ/Chồng"
                                                "CON_CAI" -> "Con cái"
                                                else -> "Người thân"
                                            },
                                            fontSize = 11.sp,
                                            color = Primary,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is NetworkState.Error -> {
                Text("Không thể tải hồ sơ người bệnh", color = Color.Red)
            }
            else -> {}
        }
    }
}

@Composable
fun StepEnterDetails(
    reason: String,
    symptoms: String,
    onDetailsEntered: (String, String) -> Unit
) {
    var localReason by remember { mutableStateOf(reason) }
    var localSymptoms by remember { mutableStateOf(symptoms) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Thông tin triệu chứng & lý do khám", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Secondary)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = localReason,
            onValueChange = { localReason = it },
            label = { Text("Lý do khám bệnh (bắt buộc)") },
            placeholder = { Text("Ví dụ: Khám sức khỏe định kỳ, đau dạ dày...") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3,
            shape = RoundedCornerShape(8.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = localSymptoms,
            onValueChange = { localSymptoms = it },
            label = { Text("Mô tả triệu chứng (nếu có)") },
            placeholder = { Text("Ví dụ: Đau tức ngực, ho khan kéo dài...") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3,
            shape = RoundedCornerShape(8.dp)
        )

        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (localReason.isNotBlank()) {
                    onDetailsEntered(localReason, localSymptoms)
                }
            },
            enabled = localReason.isNotBlank(),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("Tiếp tục", color = Color.White, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun StepConfirmSummary(
    uiState: BookingUiState,
    onConfirmed: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("Xác nhận thông tin đặt khám", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Secondary)
        Spacer(modifier = Modifier.height(16.dp))

        // Doctor Card Info
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Bác sĩ khám", fontWeight = FontWeight.Bold, color = Primary, fontSize = 13.sp)
                Text(
                    text = (uiState.doctor?.title ?: "") + " " + (uiState.doctor?.fullName ?: ""),
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Secondary,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Text(
                    text = uiState.workplace?.hospital?.name ?: "Bệnh viện Đa khoa NovaCare",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Time slot card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Thời gian & Ngày khám", fontWeight = FontWeight.Bold, color = Primary, fontSize = 13.sp)
                val time = uiState.selectedSlot?.startTime?.substringBeforeLast(":")?.substringAfter("T") ?: "08:00"
                Text(
                    text = "$time ngày ${uiState.selectedDate ?: ""}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Secondary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Patient Card info
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Bệnh nhân", fontWeight = FontWeight.Bold, color = Primary, fontSize = 13.sp)
                Text(
                    text = uiState.selectedProfile?.fullName ?: "",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Secondary,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Text(
                    text = "Lý do khám: " + uiState.reason,
                    fontSize = 12.sp,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onConfirmed,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("Xác nhận thông tin", color = Color.White, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun StepSelectPayment(
    uiState: BookingUiState,
    bookingViewModel: BookingViewModel,
    navController: NavController,
    onBookingSuccess: (Appointment) -> Unit
) {
    var selectedMethod by remember { mutableStateOf("CASH") }
    val bookingResult by bookingViewModel.uiState.collectAsState()
    val paymentUrlState = bookingResult.paymentUrlState

    // Handle payment redirect on VNPAY
    LaunchedEffect(paymentUrlState) {
        if (paymentUrlState is NetworkState.Success) {
            val url = (paymentUrlState as NetworkState.Success<*>).data as String
            // Redirect to WebView Screen
            navController.navigate("${Screen.Home.route}/payment?url=" + java.net.URLEncoder.encode(url, "UTF-8"))
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("Chọn hình thức thanh toán", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Secondary)
        Spacer(modifier = Modifier.height(16.dp))

        // Pay at hospital (CASH)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { selectedMethod = "CASH" },
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = if (selectedMethod == "CASH") BorderStroke(2.dp, Primary) else null,
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Payments, contentDescription = "Tiền mặt", tint = Primary, modifier = Modifier.size(32.dp))
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Thanh toán tại quầy", fontWeight = FontWeight.Bold, color = Secondary)
                    Text("Nhận phiếu khám điện tử và đóng tiền khi đến khám", fontSize = 12.sp, color = TextSecondary)
                }
                RadioButton(selected = selectedMethod == "CASH", onClick = { selectedMethod = "CASH" })
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Pay online (VNPAY)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { selectedMethod = "VNPAY" },
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = if (selectedMethod == "VNPAY") BorderStroke(2.dp, Primary) else null,
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.CheckCircle, contentDescription = "Online", tint = Primary, modifier = Modifier.size(32.dp))
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Thanh toán điện tử VNPay", fontWeight = FontWeight.Bold, color = Secondary)
                    Text("Thanh toán trực tuyến bằng Thẻ ATM / Mobile Banking", fontSize = 12.sp, color = TextSecondary)
                }
                RadioButton(selected = selectedMethod == "VNPAY", onClick = { selectedMethod = "VNPAY" })
            }
        }

        Spacer(modifier = Modifier.weight(1f))
        Spacer(modifier = Modifier.height(24.dp))

        if (bookingResult.bookingState is NetworkState.Error) {
            Text(
                text = (bookingResult.bookingState as NetworkState.Error).message,
                color = Color.Red,
                modifier = Modifier.padding(bottom = 12.dp)
            )
        }

        Button(
            onClick = {
                bookingViewModel.setPaymentMethod(selectedMethod)
                bookingViewModel.createAppointment { appointment ->
                    onBookingSuccess(appointment)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            if (bookingResult.bookingState is NetworkState.Loading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            } else {
                Text("Xác nhận & Đặt lịch", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}
