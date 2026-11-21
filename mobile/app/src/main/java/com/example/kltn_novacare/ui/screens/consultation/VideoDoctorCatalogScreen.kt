package com.example.kltn_novacare.ui.screens.consultation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.screens.booking.DoctorFilterDialog
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.DoctorViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState

private data class VideoDoctorEntry(val doctor: Doctor, val workplace: DoctorWorkplace)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideoDoctorCatalogScreen(navController: NavController, doctorViewModel: DoctorViewModel) {
    val doctorsState by doctorViewModel.doctors.collectAsState()
    val specialtiesState by doctorViewModel.specialties.collectAsState()
    var query by rememberSaveable { mutableStateOf("") }
    var specialtyId by rememberSaveable { mutableStateOf<String?>(null) }
    var showFilters by remember { mutableStateOf(false) }
    var gender by rememberSaveable { mutableStateOf<String?>(null) }
    var experience by rememberSaveable { mutableStateOf<Int?>(null) }
    var maxFee by rememberSaveable { mutableStateOf<Double?>(null) }
    var sort by rememberSaveable { mutableStateOf("RECOMMENDED") }

    LaunchedEffect(Unit) {
        doctorViewModel.loadSpecialties()
        doctorViewModel.searchDoctors()
    }

    val filterCount = listOfNotNull(gender, experience, maxFee, sort.takeUnless { it == "RECOMMENDED" }).size
    val entries = remember(doctorsState, query, specialtyId, gender, experience, maxFee, sort) {
        val source = (doctorsState as? NetworkState.Success)?.data.orEmpty().mapNotNull { doctor ->
            val workplace = doctor.workPlaces.orEmpty().firstOrNull {
                specialtyId == null || (it.specialtyId ?: it.specialty?.id) == specialtyId
            } ?: return@mapNotNull null
            val fee = workplace.consultationFee ?: workplace.price ?: doctor.displayPrice
            val hospital = workplace.hospital ?: doctor.hospital
            val searchMatched = query.isBlank() || doctor.displayFullNameWithTitle.contains(query, true) ||
                doctor.displaySpecialty.contains(query, true) || hospital?.name?.contains(query, true) == true
            val genderMatched = gender == null || doctor.gender?.uppercase() == gender
            val experienceMatched = experience == null || (doctor.yearsOfExperience ?: 0) >= experience!!
            val feeMatched = maxFee == null || fee <= maxFee!!
            if (searchMatched && genderMatched && experienceMatched && feeMatched) VideoDoctorEntry(doctor, workplace) else null
        }
        when (sort) {
            "RATING" -> source.sortedByDescending { it.doctor.displayRating }
            "EXPERIENCE" -> source.sortedByDescending { it.doctor.yearsOfExperience ?: 0 }
            "PRICE_ASC" -> source.sortedBy { it.workplace.consultationFee ?: it.workplace.price ?: it.doctor.displayPrice }
            else -> source
        }
    }

    Scaffold(
        containerColor = Background,
        topBar = {
            TopAppBar(
                title = { Text("Gọi video với bác sĩ", color = Color.White, fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại", tint = Color.White)
                } },
                actions = { IconButton(onClick = { navController.navigate(Screen.Consultations.route) }) {
                    Icon(Icons.Default.History, contentDescription = "Lịch sử tư vấn", tint = Color.White)
                } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = HeaderGreenDark)
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            Row(
                Modifier.fillMaxWidth().background(Color.White).padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Tìm bác sĩ", color = TextMuted) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Primary) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Primary, unfocusedBorderColor = Border)
                )
                Surface(
                    modifier = Modifier.height(56.dp).clickable { showFilters = true },
                    shape = RoundedCornerShape(14.dp),
                    color = if (filterCount > 0) PrimaryLight else Color.White,
                    border = BorderStroke(1.dp, if (filterCount > 0) Primary else Border)
                ) {
                    Row(Modifier.padding(horizontal = 13.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Tune, contentDescription = "Lọc", tint = Primary)
                        if (filterCount > 0) Text(" $filterCount", color = PrimaryDark, fontWeight = FontWeight.Bold)
                    }
                }
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { VideoProcessCard() }
                item {
                    val specialties = (specialtiesState as? NetworkState.Success)?.data.orEmpty()
                    if (specialties.isNotEmpty()) LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item { VideoSpecialtyChip("Tất cả", specialtyId == null) { specialtyId = null } }
                        items(specialties, key = { it.id }) { item ->
                            VideoSpecialtyChip(item.name, specialtyId == item.id) { specialtyId = item.id }
                        }
                    }
                }
                when (val current = doctorsState) {
                    is NetworkState.Loading, NetworkState.Idle -> item {
                        Box(Modifier.fillMaxWidth().height(180.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Primary) }
                    }
                    is NetworkState.Error -> item {
                        InlineConsultationError(current.message) { doctorViewModel.searchDoctors() }
                    }
                    is NetworkState.Success -> {
                        if (entries.isEmpty()) item {
                            Box(Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) {
                                Text("Không tìm thấy bác sĩ phù hợp", color = TextSecondary)
                            }
                        } else items(entries, key = { "${it.doctor.id}-${it.workplace.id}" }) { entry ->
                            VideoDoctorCard(
                                entry = entry,
                                onSchedule = { navController.navigate(Screen.VideoBooking.createRoute(entry.doctor.id, entry.workplace.id)) }
                            )
                        }
                    }
                }
            }
        }
    }

    if (showFilters) DoctorFilterDialog(
        selectedGender = gender,
        minimumExperience = experience,
        maximumFee = maxFee,
        sortOption = sort,
        onDismiss = { showFilters = false },
        onApply = { g, e, fee, s -> gender = g; experience = e; maxFee = fee; sort = s; showFilters = false }
    )
}

@Composable
private fun VideoProcessCard() {
    var expanded by rememberSaveable { mutableStateOf(true) }
    Surface(color = PrimaryLight, shape = RoundedCornerShape(18.dp), border = BorderStroke(1.dp, PrimaryBorder)) {
        Column(Modifier.padding(16.dp)) {
            Row(Modifier.fillMaxWidth().clickable { expanded = !expanded }, verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Videocam, contentDescription = null, tint = Primary, modifier = Modifier.size(24.dp))
                Spacer(Modifier.width(8.dp))
                Text("Quy trình gọi video với bác sĩ", color = PrimaryDark, fontWeight = FontWeight.ExtraBold, modifier = Modifier.weight(1f))
                Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, contentDescription = null, tint = PrimaryDark)
            }
            if (expanded) {
                HorizontalDivider(Modifier.padding(vertical = 12.dp), color = PrimaryBorder)
                Text("1. Chọn bác sĩ và nhấn Đặt lịch hẹn", color = TextPrimary, fontSize = 12.5.sp)
                Text("2. Chọn ngày giờ, hồ sơ và thanh toán", color = TextPrimary, fontSize = 12.5.sp)
                Text("3. NovaCare tạo phòng video và chat", color = TextPrimary, fontSize = 12.5.sp)
                Text("4. Vào phòng đúng giờ để trao đổi với bác sĩ", color = TextPrimary, fontSize = 12.5.sp)
            }
        }
    }
}

@Composable
private fun VideoSpecialtyChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.clickable(onClick = onClick),
        color = if (selected) Primary else Color.White,
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, if (selected) Primary else Border)
    ) { Text(label, Modifier.padding(horizontal = 13.dp, vertical = 8.dp), color = if (selected) Color.White else TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
}

@Composable
private fun VideoDoctorCard(entry: VideoDoctorEntry, onSchedule: () -> Unit) {
    val doctor = entry.doctor
    val workplace = entry.workplace
    val hospital = workplace.hospital ?: doctor.hospital
    Surface(color = Color.White, shape = RoundedCornerShape(18.dp), border = BorderStroke(1.dp, Border), shadowElevation = 1.dp) {
        Column {
            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                AsyncImage(
                    model = doctor.displayAvatarUrl,
                    contentDescription = doctor.displayFullNameWithTitle,
                    modifier = Modifier.size(76.dp).clip(RoundedCornerShape(14.dp)).background(Color(0xFFF1F5F9)),
                    contentScale = ContentScale.Crop
                )
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(doctor.displayFullNameWithTitle, color = PrimaryDark, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Text(workplace.specialty?.name ?: doctor.displaySpecialty, color = Primary, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                    Spacer(Modifier.height(4.dp))
                    Text(hospital?.name ?: "Tư vấn trực tuyến NovaCare", color = TextSecondary, fontSize = 11.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("Lịch khám: Hẹn gọi video", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Text("Giá tư vấn: 150.000 ₫ / lượt", color = TextPrimary, fontSize = 12.5.sp, fontWeight = FontWeight.Bold)
                }
            }
            Box(Modifier.fillMaxWidth().background(PrimaryLight).padding(12.dp)) {
                Button(
                    onClick = onSchedule, modifier = Modifier.fillMaxWidth().height(46.dp),
                    shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) { Text("Đặt lịch hẹn", color = Color.White, fontWeight = FontWeight.Bold) }
            }
        }
    }
}
