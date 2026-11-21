package com.example.kltn_novacare.ui.screens.doctor

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.DoctorViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorDetailScreen(
    doctorId: String,
    navController: NavController,
    doctorViewModel: DoctorViewModel
) {
    val doctorDetailsState by doctorViewModel.doctorDetails.collectAsState()
    LaunchedEffect(doctorId) { doctorViewModel.getDoctorById(doctorId) }

    Scaffold(
        containerColor = Background,
        topBar = {
            TopAppBar(
                title = { Text("Thông tin bác sĩ", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = HeaderGreenDark)
            )
        }
    ) { innerPadding ->
        Box(Modifier.fillMaxSize().padding(innerPadding).background(Background)) {
            when (val state = doctorDetailsState) {
                is NetworkState.Loading, NetworkState.Idle -> CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center), color = Primary, strokeWidth = 3.dp
                )
                is NetworkState.Success -> DoctorDetailContent(state.data, navController)
                is NetworkState.Error -> DoctorDetailError(state.message) { doctorViewModel.getDoctorById(doctorId) }
            }
        }
    }
}

@Composable
private fun DoctorDetailError(message: String, onRetry: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(Modifier.size(72.dp).background(StatusErrorBg, CircleShape), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.PersonOff, contentDescription = null, tint = StatusErrorText, modifier = Modifier.size(34.dp))
        }
        Spacer(Modifier.height(16.dp))
        Text("Không thể tải thông tin bác sĩ", fontWeight = FontWeight.Bold, color = TextPrimary)
        Spacer(Modifier.height(6.dp))
        Text(message, color = TextSecondary, fontSize = 13.sp)
        Spacer(Modifier.height(16.dp))
        Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = Primary), shape = RoundedCornerShape(12.dp)) {
            Text("Thử lại", color = Color.White, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun DoctorDetailContent(doctor: Doctor, navController: NavController) {
    val workplaces = remember(doctor.id, doctor.workPlaces) { doctor.workPlaces.orEmpty().filter { it.id.isNotBlank() } }
    var selectedWorkplaceId by rememberSaveable(doctor.id) { mutableStateOf(workplaces.firstOrNull()?.id) }
    val selectedWorkplace = workplaces.firstOrNull { it.id == selectedWorkplaceId }

    Scaffold(
        containerColor = Background,
        bottomBar = {
            Surface(color = Color.White, shadowElevation = 12.dp) {
                Column(Modifier.navigationBarsPadding().padding(horizontal = 16.dp, vertical = 12.dp)) {
                    if (selectedWorkplace == null) {
                        Text("Bác sĩ chưa có cơ sở nhận lịch trực tuyến.", color = StatusWarningText, fontSize = 12.sp, modifier = Modifier.padding(bottom = 8.dp))
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(
                            onClick = { selectedWorkplace?.let { navController.navigate(Screen.VideoBooking.createRoute(doctor.id, it.id)) } },
                            enabled = selectedWorkplace != null,
                            modifier = Modifier.weight(1f).height(52.dp),
                            shape = RoundedCornerShape(14.dp),
                            border = BorderStroke(1.dp, Primary)
                        ) {
                            Icon(Icons.Default.Videocam, contentDescription = null, tint = Primary, modifier = Modifier.size(19.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Gọi video", color = PrimaryDark, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        Button(
                            onClick = { selectedWorkplace?.let { navController.navigate(Screen.Booking.createRoute(doctor.id, it.id)) } },
                            enabled = selectedWorkplace != null,
                            modifier = Modifier.weight(1f).height(52.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Primary, disabledContainerColor = Color(0xFFCBD5E1))
                        ) {
                            Icon(Icons.Default.CalendarMonth, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Đặt khám", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    ) { contentPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(contentPadding),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            item { DoctorHero(doctor) }
            item {
                DoctorMetrics(doctor)
                DetailSectionTitle("Nơi khám", if (workplaces.size > 1) "Chọn cơ sở bạn muốn đến khám" else "Cơ sở bác sĩ đang nhận lịch")
            }
            if (workplaces.isEmpty()) item { EmptyWorkplaceCard() }
            else items(workplaces, key = { it.id }) { workplace ->
                WorkplaceCard(workplace, doctor, workplace.id == selectedWorkplaceId) { selectedWorkplaceId = workplace.id }
            }
            item {
                DetailSectionTitle("Thông tin chuyên môn")
                DoctorProfessionalCard(doctor)
            }
        }
    }
}

@Composable
private fun DoctorHero(doctor: Doctor) {
    Column(
        Modifier.fillMaxWidth().background(HeaderGreenGradient).padding(horizontal = 20.dp, vertical = 22.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(contentAlignment = Alignment.BottomEnd) {
            AsyncImage(
                model = doctor.displayAvatarUrl,
                contentDescription = doctor.displayFullNameWithTitle,
                modifier = Modifier.size(104.dp).clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            Box(Modifier.size(28.dp).background(Primary, CircleShape), contentAlignment = Alignment.Center) {
                Icon(Icons.Default.Check, contentDescription = "Đã xác thực", tint = Color.White, modifier = Modifier.size(16.dp))
            }
        }
        Spacer(Modifier.height(14.dp))
        Text(doctor.displayFullNameWithTitle, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
        Spacer(Modifier.height(7.dp))
        Surface(color = Color.White.copy(alpha = 0.14f), shape = RoundedCornerShape(20.dp)) {
            Text(doctor.displaySpecialty, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
        }
    }
}

@Composable
private fun DoctorMetrics(doctor: Doctor) {
    Row(
        Modifier.fillMaxWidth().background(Color.White).padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        MetricItem(Icons.Default.Star, "${doctor.displayRating}", "Đánh giá", Color(0xFFF59E0B))
        MetricDivider()
        MetricItem(Icons.Default.WorkHistory, "${doctor.yearsOfExperience ?: 0}+", "Năm kinh nghiệm", Primary)
        MetricDivider()
        val visits = if (doctor.consultationCount > 0) doctor.consultationCount else doctor.displayReviewCount
        MetricItem(Icons.Default.Groups, "$visits", "Lượt khám", Color(0xFF2563EB))
    }
}

@Composable
private fun RowScope.MetricItem(icon: ImageVector, value: String, label: String, tint: Color) {
    Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(19.dp))
        Spacer(Modifier.height(4.dp))
        Text(value, color = TextPrimary, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
        Text(label, color = TextSecondary, fontSize = 10.sp, maxLines = 1)
    }
}

@Composable
private fun RowScope.MetricDivider() {
    Box(Modifier.width(1.dp).height(42.dp).background(Border))
}

@Composable
private fun DetailSectionTitle(title: String, subtitle: String? = null) {
    Column(Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 10.dp)) {
        Text(title, color = TextPrimary, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
        subtitle?.let { Spacer(Modifier.height(2.dp)); Text(it, color = TextSecondary, fontSize = 12.sp) }
    }
}

@Composable
private fun WorkplaceCard(workplace: DoctorWorkplace, doctor: Doctor, selected: Boolean, onClick: () -> Unit) {
    val hospital = workplace.hospital ?: doctor.hospital
    val fee = workplace.consultationFee ?: workplace.price ?: doctor.displayPrice
    val formattedFee = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(fee)
    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp).clickable(onClick = onClick),
        color = if (selected) PrimaryLight else Color.White,
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(if (selected) 1.5.dp else 1.dp, if (selected) Primary else Border),
        shadowElevation = if (selected) 0.dp else 1.dp
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
            Box(
                Modifier.size(42.dp).background(if (selected) PrimarySubtle else Color(0xFFF1F5F9), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) { Icon(Icons.Default.LocalHospital, contentDescription = null, tint = if (selected) PrimaryDark else TextSecondary) }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        hospital?.name ?: workplace.position ?: "Cơ sở khám bệnh",
                        color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.5.sp,
                        maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f)
                    )
                    RadioButton(selected = selected, onClick = onClick, colors = RadioButtonDefaults.colors(selectedColor = Primary))
                }
                val address = hospital?.displayAddress
                if (!address.isNullOrBlank()) {
                    Row(verticalAlignment = Alignment.Top) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = TextMuted, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(address, color = TextSecondary, fontSize = 11.5.sp, lineHeight = 16.sp)
                    }
                    Spacer(Modifier.height(7.dp))
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Payments, contentDescription = null, tint = Primary, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(5.dp))
                    Text("Phí khám $formattedFee", color = PrimaryDark, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun EmptyWorkplaceCard() {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), color = StatusWarningBg,
        shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, Color(0xFFFDE68A))
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Info, contentDescription = null, tint = StatusWarningText)
            Spacer(Modifier.width(10.dp))
            Text("Thông tin cơ sở và lịch khám đang được cập nhật. Vui lòng quay lại sau.", color = StatusWarningText, fontSize = 12.5.sp, lineHeight = 18.sp)
        }
    }
}

@Composable
private fun DoctorProfessionalCard(doctor: Doctor) {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), color = Color.White,
        shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, Border)
    ) {
        Column(Modifier.padding(16.dp)) {
            ProfessionalBlock(
                Icons.Default.Badge, "Giới thiệu",
                doctor.bio?.takeIf { it.isNotBlank() } ?: doctor.description?.takeIf { it.isNotBlank() }
                ?: "Bác sĩ có nhiều năm kinh nghiệm khám và điều trị chuyên khoa, tận tâm với người bệnh."
            )
            HorizontalDivider(Modifier.padding(vertical = 14.dp), color = BorderLight)
            ProfessionalBlock(
                Icons.Default.MedicalServices, "Kinh nghiệm chuyên môn",
                doctor.experience?.takeIf { it.isNotBlank() } ?: doctor.qualification?.takeIf { it.isNotBlank() }
                ?: doctor.yearsOfExperience?.takeIf { it > 0 }?.let { "$it năm kinh nghiệm trong ngành y tế." }
                ?: "Thông tin kinh nghiệm đang được cập nhật."
            )
        }
    }
}

@Composable
private fun ProfessionalBlock(icon: ImageVector, title: String, body: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = Primary, modifier = Modifier.size(19.dp))
        Spacer(Modifier.width(8.dp))
        Text(title, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
    }
    Spacer(Modifier.height(7.dp))
    Text(body, color = TextSecondary, fontSize = 12.5.sp, lineHeight = 19.sp)
}
