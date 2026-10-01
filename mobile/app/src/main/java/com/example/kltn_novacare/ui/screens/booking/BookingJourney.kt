package com.example.kltn_novacare.ui.screens.booking

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.viewmodel.*
import java.text.NumberFormat
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

fun bookingMoney(amount: Double) = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(amount)
fun bookingTime(value: String): String = runCatching {
    DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(Instant.parse(value))
}.getOrDefault(value.take(5))
fun bookingDate(value: String?): String = value?.substringBefore('T').orEmpty()

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingJourney(
    bookingViewModel: BookingViewModel,
    patientViewModel: PatientViewModel,
    navController: NavController,
    onBackFromInfo: () -> Unit,
    info: @Composable () -> Unit
) {
    val state by bookingViewModel.uiState.collectAsState()
    val back = {
        if (!state.busy) {
            when {
                state.createdAppointment != null -> navController.popBackStack()
                state.currentStep > 1 -> bookingViewModel.setStep(state.currentStep - 1)
                else -> onBackFromInfo()
            }
        }
        Unit
    }
    BackHandler(onBack = back)
    Scaffold(topBar = {
        TopAppBar(title = { Text(when (state.currentStep) {
            1 -> "1. Chọn thông tin khám"
            2 -> "2. Chọn hồ sơ"
            3 -> "3. Xác nhận thông tin"
            4 -> "4. Thanh toán"
            else -> "Phiếu khám điện tử"
        }) }, navigationIcon = {
            IconButton(enabled = !state.busy, onClick = back) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
            }
        })
    }) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (state.currentStep) {
                1 -> info()
                2 -> BookingProfileStep(state, patientViewModel, bookingViewModel)
                3 -> BookingReviewStep(state, bookingViewModel)
                4 -> BookingCheckoutStep(state, bookingViewModel)
                5 -> BookingReceipt(state, onDetails = {
                    state.createdAppointment?.let {
                        navController.navigate(Screen.AppointmentDetail.createRoute(it.id)) {
                            popUpTo(navController.currentDestination?.route ?: Screen.Home.route) { inclusive = true }
                        }
                    }
                }, onAppointments = {
                    navController.navigate(Screen.Appointments.route) {
                        popUpTo(Screen.Home.route)
                        launchSingleTop = true
                    }
                })
            }
        }
    }
    if (state.showSimulation) {
        AlertDialog(onDismissRequest = { bookingViewModel.dismissSimulation() },
            title = { Text("Thanh toán ${state.paymentMethod} — mô phỏng") },
            text = { Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Mã lịch khám: ${state.createdAppointment?.bookingCode.orEmpty()}")
                Text("Số tiền: ${bookingMoney(state.createdAppointment?.totalAmount ?: 0.0)}", fontWeight = FontWeight.Bold)
                Text("Đây là thanh toán mô phỏng, không trừ tiền thật. Nhấn xác nhận để cập nhật trạng thái thanh toán của lịch khám.")
                (state.checkoutState as? NetworkState.Error)?.let { Text(it.message, color = MaterialTheme.colorScheme.error) }
            } },
            confirmButton = { Button(enabled = !state.busy, onClick = { bookingViewModel.simulatePayment() }) {
                Text(if (state.busy) "Đang xác nhận..." else "Xác nhận thanh toán mô phỏng")
            } },
            dismissButton = { TextButton(enabled = !state.busy, onClick = { bookingViewModel.dismissSimulation() }) { Text("Để sau") } })
    }
}

@Composable
private fun BookingProfileStep(state: BookingUiState, patientVM: PatientViewModel, bookingVM: BookingViewModel) {
    val profiles by patientVM.profiles.collectAsState()
    var creating by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(Unit) { patientVM.loadProfiles() }
    val list = (profiles as? NetworkState.Success)?.data.orEmpty()
    LaunchedEffect(profiles) {
        if (profiles is NetworkState.Success) {
            val selected = list.find { it.id == state.selectedProfile?.id }
            (selected ?: list.find { it.isDefault } ?: list.firstOrNull())?.let { bookingVM.selectProfile(it) }
        }
    }
    BookingProfilePicker(profiles, state.selectedProfile?.id,
        onSelect = { bookingVM.selectProfile(it) },
        onCreate = { creating = true }, onRetry = { patientVM.loadProfiles() },
        onContinue = { bookingVM.setStep(3) })
    if (creating) CreatePatientProfileModal(patientVM, onDismiss = { creating = false }, onCreated = {
        bookingVM.selectProfile(it)
        creating = false
    })
}

@Composable
fun BookingProfilePicker(
    profiles: NetworkState<List<PatientProfile>>, selectedId: String?,
    onSelect: (PatientProfile) -> Unit, onCreate: () -> Unit, onRetry: () -> Unit, onContinue: () -> Unit
) {
    val list = (profiles as? NetworkState.Success)?.data.orEmpty()
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Chọn người sẽ đi khám", style = MaterialTheme.typography.titleMedium)
        OutlinedButton(onClick = onCreate, modifier = Modifier.fillMaxWidth()) { Text("Thêm hồ sơ mới") }
        LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            when (profiles) {
                is NetworkState.Success -> {
                    if (list.isEmpty()) item { Text("Bạn chưa có hồ sơ. Thêm hồ sơ để tiếp tục đặt khám.") }
                    items(list, key = { it.id }) { profile ->
                        OutlinedCard(onClick = { onSelect(profile) }, modifier = Modifier.fillMaxWidth(),
                            border = BorderStroke(if (profile.id == selectedId) 2.dp else 1.dp,
                                if (profile.id == selectedId) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant)) {
                            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(selected = profile.id == selectedId, onClick = { onSelect(profile) })
                                Column(Modifier.weight(1f)) {
                                    Text(profile.fullName, fontWeight = FontWeight.Bold)
                                    Text("${profile.displayRelationship} • ${profile.displayGender}")
                                    Text("Ngày sinh: ${profile.formattedDateOfBirth}")
                                    if (profile.isDefault) Text("Hồ sơ khám chính", color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                }
                is NetworkState.Error -> item {
                    Text(profiles.message, color = MaterialTheme.colorScheme.error)
                    TextButton(onClick = onRetry) { Text("Thử lại") }
                }
                else -> item { CircularProgressIndicator() }
            }
        }
        Button(enabled = list.any { it.id == selectedId }, onClick = onContinue, modifier = Modifier.fillMaxWidth()) {
            Text("Tiếp tục với hồ sơ đã chọn")
        }
    }
}

@Composable
private fun BookingSummary(state: BookingUiState) {
    val appointment = state.createdAppointment
    val profile = state.selectedProfile ?: appointment?.patientProfile
    val slot = state.selectedSlot ?: appointment?.slot
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            profile?.let { Text(it.fullName, fontWeight = FontWeight.Bold); Text("${it.displayGender} • ${it.formattedDateOfBirth}") }
            (state.hospital ?: state.workplace?.hospital)?.let { Text(it.name) }
            state.doctor?.let { Text("Bác sĩ: ${it.fullName}") }
            state.workplace?.specialty?.let { Text("Chuyên khoa: ${it.name}") }
            state.selectedService?.let { Text("Dịch vụ: ${it.name}") }
            slot?.let { Text("Ngày: ${state.selectedDate ?: bookingDate(it.startTime)} • ${bookingTime(it.startTime)} – ${bookingTime(it.endTime)}") }
            if (state.reason.isNotBlank()) Text("Lý do khám: ${state.reason}")
            val total = appointment?.totalAmount ?: ((state.workplace?.consultationFee ?: 0.0) + (state.selectedService?.price ?: 0.0))
            Text("${if (appointment == null) "Phí dự kiến" else "Tổng tiền"}: ${bookingMoney(total)}", fontWeight = FontWeight.Bold)
            if (appointment == null) Text("Số tiền cuối cùng được xác nhận khi tạo lịch khám.", style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun BookingReviewStep(state: BookingUiState, vm: BookingViewModel) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        BookingSummary(state)
        OutlinedTextField(value = state.reason, onValueChange = { vm.setDetails(it, state.symptoms) },
            label = { Text("Lý do khám") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = state.symptoms, onValueChange = { vm.setDetails(state.reason, it) },
            label = { Text("Triệu chứng (nếu có)") }, modifier = Modifier.fillMaxWidth())
        Button(onClick = { vm.setStep(4) }, modifier = Modifier.fillMaxWidth()) { Text("Xác nhận thông tin") }
    }
}

@Composable
fun BookingCheckoutStep(state: BookingUiState, vm: BookingViewModel) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BookingSummary(state)
        Text("Chọn hình thức thanh toán", style = MaterialTheme.typography.titleMedium)
        listOf("CASH" to "Thanh toán tại cơ sở y tế", "MOMO" to "MoMo (mô phỏng)",
            "VNPAY" to "VNPay (mô phỏng)", "VIETQR" to "VietQR (mô phỏng)", "CARD" to "Thẻ (mô phỏng)").forEach { (method, label) ->
            OutlinedCard(onClick = { vm.setPaymentMethod(method) }, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = state.paymentMethod == method, enabled = !state.busy, onClick = { vm.setPaymentMethod(method) })
                    Text(label)
                }
            }
        }
        if (state.createdAppointment != null) {
            Text("Lịch ${state.createdAppointment.bookingCode} đã được tạo. Bạn có thể thử thanh toán lại hoặc thanh toán sau trong Lịch hẹn.")
            state.createdAppointment.expiresAt?.let { Text("Hạn giữ chỗ: ${bookingDate(it)} ${bookingTime(it)} (giờ Việt Nam)") }
        }
        (state.checkoutState as? NetworkState.Error)?.let { Text(it.message, color = MaterialTheme.colorScheme.error) }
        Button(enabled = !state.busy, onClick = { vm.checkout() }, modifier = Modifier.fillMaxWidth()) {
            Text(if (state.busy) "Đang xử lý..." else if (state.paymentMethod == "CASH") "Đặt khám — thanh toán tại viện" else "Tiếp tục thanh toán mô phỏng")
        }
    }
}

@Composable
private fun BookingReceipt(state: BookingUiState, onDetails: () -> Unit, onAppointments: () -> Unit) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Đặt khám thành công", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary)
        Text("Mã lịch khám: ${state.createdAppointment?.bookingCode.orEmpty()}", fontWeight = FontWeight.Bold)
        Text(if (state.createdAppointment?.status == "PAID") "Đã thanh toán mô phỏng" else "Đã xác nhận lịch — thanh toán tại cơ sở y tế")
        BookingSummary(state)
        Button(onClick = onDetails, modifier = Modifier.fillMaxWidth()) { Text("Xem chi tiết lịch khám") }
        OutlinedButton(onClick = onAppointments, modifier = Modifier.fillMaxWidth()) { Text("Danh sách lịch hẹn") }
    }
}
