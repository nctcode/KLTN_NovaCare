package com.example.kltn_novacare.ui.screens.booking

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.screens.profile.FullProfileFormDialog
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.*
import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

fun bookingMoney(amount: Double) = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(amount)
fun bookingTime(value: String): String = runCatching {
    DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh")).format(Instant.parse(value))
}.getOrDefault(value.take(5))
fun bookingDate(value: String?): String = value?.substringBefore('T').orEmpty()

@Composable
fun DashedDivider(
    color: Color = Color(0xFFE2E8F0),
    thickness: Dp = 1.dp,
    dashLength: Dp = 6.dp,
    gapLength: Dp = 4.dp,
    modifier: Modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
) {
    val density = LocalDensity.current
    val strokeWidth = with(density) { thickness.toPx() }
    val dashPx = with(density) { dashLength.toPx() }
    val gapPx = with(density) { gapLength.toPx() }
    Canvas(modifier = modifier.height(thickness)) {
        drawLine(
            color = color,
            start = Offset(0f, size.height / 2),
            end = Offset(size.width, size.height / 2),
            strokeWidth = strokeWidth,
            pathEffect = PathEffect.dashPathEffect(floatArrayOf(dashPx, gapPx), 0f)
        )
    }
}

@Composable
fun MedproBookingHeader(
    title: String,
    currentStep: Int,
    onBack: () -> Unit
) {
    Surface(
        color = NovaCareGreen,
        shadowElevation = 3.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(bottom = 12.dp)
        ) {
            // App Bar Row
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .padding(horizontal = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.align(Alignment.CenterStart)
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Quay lại",
                        tint = Color.White
                    )
                }

                Text(
                    text = title,
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            }

            // Stepper Row (4 steps)
            if (currentStep in 1..4) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val steps = listOf(
                        1 to Icons.Default.MedicalServices,
                        2 to Icons.Default.Person,
                        3 to Icons.Default.Check,
                        4 to Icons.Default.AccountBalanceWallet
                    )

                    steps.forEachIndexed { index, (stepNum, icon) ->
                        val isActive = currentStep == stepNum
                        val isPassed = currentStep > stepNum

                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.size(40.dp)
                        ) {
                            if (isActive) {
                                // Outer ring
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .border(2.dp, Color.White, CircleShape)
                                )
                                // Inner white circle with green icon
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(Color.White, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = null,
                                        tint = NovaCareGreen,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            } else {
                                // Inactive or Passed
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .background(
                                            if (isPassed) Color.White.copy(alpha = 0.9f)
                                            else Color.White.copy(alpha = 0.25f),
                                            CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = null,
                                        tint = if (isPassed) NovaCareGreen else Color.White,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }

                        // Connecting line between step icons
                        if (index < steps.size - 1) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(2.dp)
                                    .padding(horizontal = 4.dp)
                                    .background(Color.White.copy(alpha = 0.7f))
                            )
                        }
                    }
                }
            }
        }
    }
}

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

    val currentTitle = when (state.currentStep) {
        1 -> "Chọn thông tin khám"
        2 -> "Chọn hồ sơ"
        3 -> "Xác nhận thông tin"
        4 -> "Thông tin thanh toán"
        else -> "Phiếu khám điện tử"
    }

    Scaffold(
        topBar = {
            MedproBookingHeader(
                title = currentTitle,
                currentStep = state.currentStep,
                onBack = back
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color(0xFFF8FAFC))
        ) {
            when (state.currentStep) {
                1 -> info()
                2 -> BookingProfileStep(state, patientViewModel, bookingViewModel)
                3 -> BookingReviewStep(state, bookingViewModel)
                4 -> BookingCheckoutStep(state, bookingViewModel)
                5 -> BookingReceipt(
                    state = state,
                    onDetails = {
                        state.createdAppointment?.let {
                            navController.navigate(Screen.AppointmentDetail.createRoute(it.id)) {
                                popUpTo(navController.currentDestination?.route ?: Screen.Home.route) { inclusive = true }
                            }
                        }
                    },
                    onAppointments = {
                        navController.navigate(Screen.Appointments.route) {
                            popUpTo(Screen.Home.route)
                            launchSingleTop = true
                        }
                    }
                )
            }
        }
    }

    if (state.showSimulation) {
        AlertDialog(
            onDismissRequest = { bookingViewModel.dismissSimulation() },
            title = { Text("Thanh toán ${state.paymentMethod} — mô phỏng", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Mã lịch khám: ${state.createdAppointment?.bookingCode.orEmpty()}", fontWeight = FontWeight.Bold)
                    Text("Số tiền: ${bookingMoney(state.createdAppointment?.totalAmount ?: 0.0)}", fontWeight = FontWeight.Bold, color = NovaCareGreen)
                    Text("Đây là thanh toán mô phỏng trong môi trường đồ án. Nhấn xác nhận để hoàn tất.")
                    (state.checkoutState as? NetworkState.Error)?.let { Text(it.message, color = MaterialTheme.colorScheme.error) }
                }
            },
            confirmButton = {
                Button(
                    enabled = !state.busy,
                    onClick = { bookingViewModel.simulatePayment() },
                    colors = ButtonDefaults.buttonColors(containerColor = NovaCareGreen)
                ) {
                    Text(if (state.busy) "Đang xác nhận..." else "Xác nhận thanh toán mô phỏng", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(enabled = !state.busy, onClick = { bookingViewModel.dismissSimulation() }) {
                    Text("Để sau", color = Color(0xFF64748B))
                }
            }
        )
    }
}

@Composable
private fun BookingProfileStep(
    state: BookingUiState,
    patientVM: PatientViewModel,
    bookingVM: BookingViewModel
) {
    val profiles by patientVM.profiles.collectAsState()
    val profileOperation by patientVM.profileOperation.collectAsState()
    var creating by rememberSaveable { mutableStateOf(false) }
    var detailProfile by remember { mutableStateOf<PatientProfile?>(null) }
    var editingProfile by remember { mutableStateOf<PatientProfile?>(null) }

    LaunchedEffect(Unit) { patientVM.loadProfiles() }
    val list = (profiles as? NetworkState.Success)?.data.orEmpty()
    LaunchedEffect(profiles) {
        if (profiles is NetworkState.Success) {
            val selected = list.find { it.id == state.selectedProfile?.id }
            (selected ?: list.find { it.isDefault } ?: list.firstOrNull())?.let { bookingVM.selectProfile(it) }
        }
    }

    BookingProfilePicker(
        profiles = profiles,
        selectedId = state.selectedProfile?.id,
        onSelect = { bookingVM.selectProfile(it) },
        onViewDetails = { detailProfile = it },
        onEdit = {
            patientVM.resetOperation()
            editingProfile = it
        },
        onCreate = { creating = true },
        onRetry = { patientVM.loadProfiles() },
        onContinue = { bookingVM.setStep(3) }
    )

    if (creating) {
        CreatePatientProfileModal(
            patientViewModel = patientVM,
            onDismiss = { creating = false },
            onCreated = {
                bookingVM.selectProfile(it)
                creating = false
            }
        )
    }

    detailProfile?.let { profile ->
        BookingProfileDetailDialog(profile = profile, onDismiss = { detailProfile = null })
    }

    editingProfile?.let { profile ->
        FullProfileFormDialog(
            title = "Chỉnh sửa hồ sơ",
            subtitle = "Cập nhật thông tin người sẽ đi khám.",
            profile = profile,
            isSaving = profileOperation is NetworkState.Loading,
            error = (profileOperation as? NetworkState.Error)?.message,
            onDismiss = {
                patientVM.resetOperation()
                editingProfile = null
            },
            onSubmit = { request ->
                patientVM.updateProfile(profile.id, request) {
                    patientVM.resetOperation()
                    editingProfile = null
                }
            }
        )
    }
}

@Composable
fun BookingProfilePicker(
    profiles: NetworkState<List<PatientProfile>>,
    selectedId: String?,
    onSelect: (PatientProfile) -> Unit,
    onViewDetails: (PatientProfile) -> Unit,
    onEdit: (PatientProfile) -> Unit,
    onCreate: () -> Unit,
    onRetry: () -> Unit,
    onContinue: () -> Unit
) {
    val list = (profiles as? NetworkState.Success)?.data.orEmpty()
    val context = LocalContext.current

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header row: "Hồ sơ đặt khám" + "+ Thêm"
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Hồ sơ đặt khám",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = Color(0xFF0F172A)
                        )

                        Surface(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .clickable { onCreate() },
                            color = NovaCareGreen
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    Icons.Default.PersonAdd,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "Thêm",
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                when (profiles) {
                    is NetworkState.Loading -> {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(color = NovaCareGreen)
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
                                Text(profiles.message, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                                TextButton(onClick = onRetry) { Text("Thử lại", color = NovaCareGreen) }
                            }
                        }
                    }
                    is NetworkState.Success -> {
                        if (list.isEmpty()) {
                            item {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp),
                                    color = Color.White,
                                    border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                                ) {
                                    Column(
                                        modifier = Modifier.padding(24.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Icon(
                                            Icons.Default.Badge,
                                            contentDescription = null,
                                            tint = Color(0xFF94A3B8),
                                            modifier = Modifier.size(48.dp)
                                        )
                                        Spacer(modifier = Modifier.height(10.dp))
                                        Text(
                                            "Bạn chưa có hồ sơ bệnh nhân nào.",
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 14.sp,
                                            color = Color(0xFF0F172A)
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            "Nhấn '+ Thêm' ở góc trên để tạo hồ sơ khám bệnh.",
                                            fontSize = 12.sp,
                                            color = Color(0xFF64748B)
                                        )
                                    }
                                }
                            }
                        } else {
                            items(list, key = { it.id }) { profile ->
                                val isSelected = profile.id == selectedId
                                var menuExpanded by remember(profile.id) { mutableStateOf(false) }

                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { onSelect(profile) },
                                    shape = RoundedCornerShape(16.dp),
                                    border = BorderStroke(
                                        if (isSelected) 1.5.dp else 1.dp,
                                        if (isSelected) NovaCareGreen else Color(0xFFE2E8F0)
                                    ),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        // Line 1: Name + MoreVert
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                Icons.Default.Person,
                                                contentDescription = null,
                                                tint = if (isSelected) NovaCareGreen else Color(0xFF0284C7),
                                                modifier = Modifier.size(20.dp)
                                            )
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Text(
                                                text = profile.fullName.uppercase(),
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                color = if (isSelected) NovaCareGreen else Color(0xFF0284C7),
                                                modifier = Modifier.weight(1f)
                                            )
                                            Box {
                                                IconButton(
                                                    onClick = { menuExpanded = true },
                                                    modifier = Modifier.size(28.dp)
                                                ) {
                                                    Icon(
                                                        Icons.Default.MoreVert,
                                                        contentDescription = "Tùy chọn",
                                                        tint = Color(0xFF64748B)
                                                    )
                                                }
                                                DropdownMenu(
                                                    expanded = menuExpanded,
                                                    onDismissRequest = { menuExpanded = false }
                                                ) {
                                                    DropdownMenuItem(
                                                        text = { Text("Xem chi tiết") },
                                                        leadingIcon = { Icon(Icons.Default.Visibility, contentDescription = null) },
                                                        onClick = {
                                                            menuExpanded = false
                                                            onViewDetails(profile)
                                                        }
                                                    )
                                                    DropdownMenuItem(
                                                        text = { Text("Chỉnh sửa") },
                                                        leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) },
                                                        onClick = {
                                                            menuExpanded = false
                                                            onEdit(profile)
                                                        }
                                                    )
                                                }
                                            }
                                        }

                                        // Line 2: Phone
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.Phone,
                                                contentDescription = null,
                                                tint = Color(0xFF0284C7),
                                                modifier = Modifier.size(18.dp)
                                            )
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Text(
                                                text = profile.phone?.takeIf { it.isNotBlank() } ?: "Chưa cập nhật SĐT",
                                                fontSize = 13.5.sp,
                                                color = Color(0xFF0F172A)
                                            )
                                        }

                                        // Line 3: Birthday
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.Cake,
                                                contentDescription = null,
                                                tint = Color(0xFF0284C7),
                                                modifier = Modifier.size(18.dp)
                                            )
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Text(
                                                text = profile.formattedDateOfBirth,
                                                fontSize = 13.5.sp,
                                                color = Color(0xFF0F172A)
                                            )
                                        }

                                        // Line 4: Address
                                        Row(verticalAlignment = Alignment.Top) {
                                            Icon(
                                                Icons.Default.LocationOn,
                                                contentDescription = null,
                                                tint = Color(0xFF0284C7),
                                                modifier = Modifier.size(18.dp).padding(top = 2.dp)
                                            )
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Column {
                                                Text(
                                                    text = profile.address?.takeIf { it.isNotBlank() } ?: "Chưa có địa chỉ",
                                                    fontSize = 13.sp,
                                                    color = Color(0xFF0F172A),
                                                    lineHeight = 18.sp
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else -> {}
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }
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
                    Button(
                        enabled = list.any { it.id == selectedId },
                        onClick = onContinue,
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

        // Floating Action Button Hotline
        FloatingActionButton(
            onClick = {
                runCatching {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:19002115"))
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
}

@Composable
private fun BookingProfileDetailDialog(profile: PatientProfile, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Chi tiết hồ sơ", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                Modifier.fillMaxWidth().heightIn(max = 520.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(profile.fullName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = NovaCareGreen)
                ProfileDetailItem("Quan hệ", profile.displayRelationship)
                ProfileDetailItem("Giới tính", profile.displayGender)
                ProfileDetailItem("Ngày sinh", profile.formattedDateOfBirth)
                HorizontalDivider()
                ProfileDetailItem("Số điện thoại", profile.phone)
                ProfileDetailItem("Email", profile.email)
                ProfileDetailItem("CCCD / CMND", profile.identityCard)
                ProfileDetailItem("Mã số thẻ BHYT", profile.healthInsurance)
                ProfileDetailItem("Địa chỉ", profile.address)
                HorizontalDivider()
                ProfileDetailItem("Tiền sử bệnh lý", profile.medicalHistory)
                ProfileDetailItem("Dị ứng", profile.allergies)
                ProfileDetailItem("Người liên hệ khẩn cấp", profile.emergencyContact)
                ProfileDetailItem("Số điện thoại khẩn cấp", profile.emergencyPhone)
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Đóng", color = NovaCareGreen, fontWeight = FontWeight.Bold) }
        }
    )
}

@Composable
private fun ProfileDetailItem(label: String, value: String?) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = Color(0xFF64748B))
        Text(value?.takeIf { it.isNotBlank() } ?: "Chưa cập nhật", fontSize = 13.5.sp, color = Color(0xFF0F172A))
    }
}

@Composable
fun MedproBookingSummaryCard(state: BookingUiState) {
    val appointment = state.createdAppointment
    val profile = state.selectedProfile ?: appointment?.patientProfile
    val hospital = state.hospital ?: state.workplace?.hospital
    val specialty = state.workplace?.specialty ?: state.selectedSpecialty
    val slot = state.selectedSlot ?: appointment?.slot
    val total = appointment?.totalAmount
        ?: state.estimatedPrice

    OutlinedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.5.dp, Color(0xFFBAE6FD)),
        colors = CardDefaults.outlinedCardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // 1. Hospital Info
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

            DashedDivider()

            // 2. Patient Info
            Text(
                text = "Thông tin bệnh nhân",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Color(0xFF0F172A)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    tint = Color(0xFF0284C7),
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = profile?.fullName?.uppercase() ?: "Chưa chọn bệnh nhân",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color(0xFF0F172A),
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = Color(0xFF64748B),
                    modifier = Modifier.size(20.dp)
                )
            }

            DashedDivider()

            // 3. Booking Info
            Text(
                text = "Thông tin đặt khám",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Color(0xFF0F172A)
            )
            Spacer(modifier = Modifier.height(10.dp))

            // Chuyên khoa
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.MedicalServices,
                    contentDescription = null,
                    tint = NovaCareGreen,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = specialty?.name ?: "Nội Tim mạch - Tổng quát",
                    fontSize = 13.5.sp,
                    color = Color(0xFF0F172A)
                )
            }

            // Dịch vụ
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.VolunteerActivism,
                    contentDescription = null,
                    tint = NovaCareGreen,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = state.selectedService?.name ?: "Khám dịch vụ",
                    fontSize = 13.5.sp,
                    color = Color(0xFF0F172A)
                )
            }

            state.selectedRoom?.let { room ->
                Text("Phòng khám: ${room.code} · ${room.name}", modifier = Modifier.padding(vertical = 8.dp), color = NovaCareGreen)
            }
            // Ngày giờ khám
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.DateRange,
                    contentDescription = null,
                    tint = Color(0xFF0284C7),
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                val dateDisplay = state.selectedDate?.let {
                    runCatching {
                        val parsed = LocalDate.parse(it)
                        String.format("%02d/%02d/%d", parsed.dayOfMonth, parsed.monthValue, parsed.year)
                    }.getOrDefault(it)
                } ?: "Chưa chọn ngày"
                val timeRange = if (slot != null) " (${bookingTime(slot.startTime)} - ${bookingTime(slot.endTime)})" else ""
                Text(
                    text = "$dateDisplay$timeRange",
                    fontSize = 13.5.sp,
                    color = Color(0xFF0F172A)
                )
            }

            // Giá tiền
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.AccountBalanceWallet,
                    contentDescription = null,
                    tint = Color(0xFF0284C7),
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "${bookingMoney(total)} (Thanh toán tại Bệnh viện)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.5.sp,
                    color = Color(0xFF0F172A)
                )
            }
        }
    }
}

@Composable
private fun BookingReviewStep(state: BookingUiState, vm: BookingViewModel) {
    var sharingBusy by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val total = state.createdAppointment?.totalAmount
        ?: state.estimatedPrice

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Summary Card (Medpro style)
                item {
                    MedproBookingSummaryCard(state)
                }

                // Lý do khám / Triệu chứng
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "Lý do khám/Triệu chứng",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF0F172A)
                        )
                        OutlinedTextField(
                            value = state.reason,
                            onValueChange = { vm.setDetails(it, state.symptoms) },
                            placeholder = { Text("Nhập triệu chứng", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NovaCareGreen,
                                unfocusedBorderColor = Color(0xFFCBD5E1),
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White
                            )
                        )
                    }
                }

                // Chia sẻ hồ sơ bệnh án điện tử (NovaCare Consent)
                item {
                    val target = state.hospital ?: state.workplace?.hospital
                    if (target != null && state.selectedProfile != null) {
                        RecordConsentPanel(
                            profileId = state.selectedProfile.id,
                            targetId = target.id,
                            targetName = target.name,
                            onBusy = { sharingBusy = it }
                        )
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }
            }

            // Sticky Bottom Bar
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color.White,
                shadowElevation = 8.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Phí khám bệnh", fontSize = 13.sp, color = Color(0xFF64748B))
                        Text("0 đ", fontSize = 13.sp, color = Color(0xFF0F172A))
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Tạm tính", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        Text(
                            text = "${bookingMoney(total)} (Thanh toán tại Bệnh viện)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = NovaCareGreen
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Button(
                        enabled = !sharingBusy,
                        onClick = { vm.setStep(4) },
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

        // Floating Action Button Hotline
        FloatingActionButton(
            onClick = {
                runCatching {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:19002115"))
                    context.startActivity(intent)
                }
            },
            containerColor = NovaCareOrangeFab,
            contentColor = Color.White,
            shape = CircleShape,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 120.dp)
                .size(54.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Call,
                contentDescription = "Hotline",
                modifier = Modifier.size(26.dp)
            )
        }
    }
}

@Composable
fun BookingCheckoutStep(state: BookingUiState, vm: BookingViewModel) {
    var promoCode by remember { mutableStateOf("") }
    var showPaymentMethods by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val total = state.createdAppointment?.totalAmount
        ?: state.estimatedPrice

    val paymentMethodLabel = when (state.paymentMethod) {
        "CASH" -> "Thanh toán tại cơ sở y tế (Tiền mặt)"
        "MOMO" -> "Ví điện tử MoMo (mô phỏng)"
        "VNPAY" -> "Cổng thanh toán VNPAY (mô phỏng)"
        "VIETQR" -> "Quét mã VietQR (mô phỏng)"
        "CARD" -> "Thẻ ATM / Quốc tế (mô phỏng)"
        else -> "Chọn phương thức thanh toán"
    }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFC))) {
        Column(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Summary Card
                item {
                    MedproBookingSummaryCard(state)
                }

                // Mã giới thiệu
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "Mã giới thiệu",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF0F172A)
                        )
                        OutlinedTextField(
                            value = promoCode,
                            onValueChange = { promoCode = it },
                            placeholder = { Text("Nhập mã giới thiệu", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NovaCareGreen,
                                unfocusedBorderColor = Color(0xFFCBD5E1),
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White
                            )
                        )
                    }
                }

                // Phí khám bệnh
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Phí khám bệnh",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.5.sp,
                            color = Color(0xFF0F172A)
                        )
                        Text(
                            text = "${bookingMoney(total)} (Thanh toán tại Bệnh viện)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF0F172A)
                        )
                    }
                }

                // Chọn phương thức thanh toán
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Chọn phương thức thanh toán",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF0F172A)
                        )

                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showPaymentMethods = true },
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFFCBD5E1)),
                            color = Color.White
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AccountBalanceWallet,
                                    contentDescription = null,
                                    tint = NovaCareGreen,
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = paymentMethodLabel,
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color(0xFF0F172A),
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = null,
                                    tint = NovaCareGreen,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }

                if (state.createdAppointment != null) {
                    item {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFF0FDF4),
                            border = BorderStroke(1.dp, NovaCareGreenBorder)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(
                                    text = "Lịch khám ${state.createdAppointment.bookingCode} đã được tạo.",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.5.sp,
                                    color = NovaCareGreen
                                )
                                state.createdAppointment.expiresAt?.let {
                                    Text(
                                        text = "Hạn giữ chỗ: ${bookingDate(it)} ${bookingTime(it)} (giờ Việt Nam)",
                                        fontSize = 12.sp,
                                        color = Color(0xFF64748B)
                                    )
                                }
                            }
                        }
                    }
                }

                (state.checkoutState as? NetworkState.Error)?.let { err ->
                    item {
                        Text(
                            text = err.message,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 13.sp
                        )
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }
            }

            // Sticky Bottom Bar
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
                    Button(
                        enabled = !state.busy,
                        onClick = { vm.checkout() },
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
                            text = if (state.busy) "ĐANG XỬ LÝ..." else "THANH TOÁN",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }

        // Floating Action Button Hotline
        FloatingActionButton(
            onClick = {
                runCatching {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:19002115"))
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

    if (showPaymentMethods) {
        PaymentMethodSelectionDialog(
            currentMethod = state.paymentMethod,
            onDismiss = { showPaymentMethods = false },
            onSelect = { method ->
                vm.setPaymentMethod(method)
                showPaymentMethods = false
            }
        )
    }
}

@Composable
fun PaymentMethodSelectionDialog(
    currentMethod: String,
    onDismiss: () -> Unit,
    onSelect: (String) -> Unit
) {
    val methods = listOf(
        Triple("CASH", "Thanh toán tại cơ sở y tế", Icons.Default.LocalAtm),
        Triple("MOMO", "Ví điện tử MoMo (mô phỏng)", Icons.Default.AccountBalanceWallet),
        Triple("VNPAY", "Cổng VNPAY (mô phỏng)", Icons.Default.QrCode2),
        Triple("VIETQR", "Quét mã VietQR (mô phỏng)", Icons.Default.QrCode),
        Triple("CARD", "Thẻ ATM / Visa / Master (mô phỏng)", Icons.Default.CreditCard)
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .clip(RoundedCornerShape(20.dp)),
            color = Color.White
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "Phương thức thanh toán",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = Color(0xFF0F172A)
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    methods.forEach { (code, label, icon) ->
                        val isSelected = currentMethod == code
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onSelect(code)
                                    onDismiss()
                                },
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
                                    imageVector = icon,
                                    contentDescription = null,
                                    tint = if (isSelected) NovaCareGreen else Color(0xFF64748B),
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = label,
                                    fontSize = 14.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) NovaCareGreen else Color(0xFF0F172A),
                                    modifier = Modifier.weight(1f)
                                )
                                RadioButton(
                                    selected = isSelected,
                                    onClick = {
                                        onSelect(code)
                                        onDismiss()
                                    },
                                    colors = RadioButtonDefaults.colors(
                                        selectedColor = NovaCareGreen
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BookingReceipt(state: BookingUiState, onDetails: () -> Unit, onAppointments: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = NovaCareGreenLight,
            border = BorderStroke(1.5.dp, NovaCareGreenBorder)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = NovaCareGreen,
                    modifier = Modifier.size(52.dp)
                )
                Text(
                    "Đặt khám thành công",
                    style = MaterialTheme.typography.headlineSmall,
                    color = NovaCareGreen,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Mã phiếu: ${state.createdAppointment?.bookingCode.orEmpty()}",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = Color(0xFF0F172A)
                )
            }
        }

        state.createdAppointment?.let {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        "Quét mã QR để làm thủ tục tại viện",
                        fontSize = 13.sp,
                        color = Color(0xFF64748B)
                    )
                    com.example.kltn_novacare.ui.components.QRCodeDraw(
                        com.google.gson.JsonObject().apply {
                            addProperty("bookingCode", it.bookingCode)
                            addProperty("patientName", state.selectedProfile?.fullName)
                            addProperty("doctorName", state.doctor?.fullName)
                            addProperty("hospitalName", (state.hospital ?: state.workplace?.hospital)?.name)
                            addProperty("startTime", state.selectedSlot?.startTime)
                        }.toString()
                    )
                    Text(
                        text = if (state.createdAppointment.status == "PAID") "ĐÃ THANH TOÁN (MÔ PHỎNG)" else "XÁC NHẬN — THANH TOÁN TẠI BỆNH VIỆN",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = NovaCareGreen
                    )
                }
            }
        }

        MedproBookingSummaryCard(state)

        Button(
            onClick = onDetails,
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = NovaCareGreen)
        ) {
            Text("Xem chi tiết lịch khám", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.White)
        }

        OutlinedButton(
            onClick = onAppointments,
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, NovaCareGreen)
        ) {
            Text("Danh sách lịch hẹn", color = NovaCareGreen, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }
    }
}
