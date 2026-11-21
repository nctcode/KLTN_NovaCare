package com.example.kltn_novacare.ui.screens.booking

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
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.DoctorViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import java.text.NumberFormat
import java.util.Locale

private data class DoctorBookingEntry(val doctor: Doctor, val workplace: DoctorWorkplace)

/** Full-screen doctor catalog opened from the home "Đặt khám bác sĩ" shortcut. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorBookingScreen(navController: NavController, doctorViewModel: DoctorViewModel) {
    val doctorsState by doctorViewModel.doctors.collectAsState()
    val specialtiesState by doctorViewModel.specialties.collectAsState()
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var selectedSpecialtyId by rememberSaveable { mutableStateOf<String?>(null) }
    var showFilterDialog by remember { mutableStateOf(false) }
    var selectedGender by rememberSaveable { mutableStateOf<String?>(null) }
    var minimumExperience by rememberSaveable { mutableStateOf<Int?>(null) }
    var maximumFee by rememberSaveable { mutableStateOf<Double?>(null) }
    var sortOption by rememberSaveable { mutableStateOf("RECOMMENDED") }

    val activeFilterCount = listOfNotNull(
        selectedGender,
        minimumExperience,
        maximumFee,
        sortOption.takeUnless { it == "RECOMMENDED" }
    ).size

    LaunchedEffect(Unit) {
        doctorViewModel.loadSpecialties()
        doctorViewModel.searchDoctors()
    }

    val entries = remember(
        doctorsState, searchQuery, selectedSpecialtyId,
        selectedGender, minimumExperience, maximumFee, sortOption
    ) {
        val doctors = (doctorsState as? NetworkState.Success)?.data.orEmpty()
        val matches = doctors.mapNotNull { doctor ->
            val workplace = doctor.workPlaces.orEmpty().firstOrNull {
                selectedSpecialtyId == null || (it.specialtyId ?: it.specialty?.id) == selectedSpecialtyId
            } ?: return@mapNotNull null
            val hospital = workplace.hospital ?: doctor.hospital
            val fee = workplace.consultationFee ?: workplace.price ?: doctor.displayPrice
            val matchesSearch = searchQuery.isBlank() ||
                doctor.displayFullNameWithTitle.contains(searchQuery, ignoreCase = true) ||
                doctor.displaySpecialty.contains(searchQuery, ignoreCase = true) ||
                hospital?.name?.contains(searchQuery, ignoreCase = true) == true ||
                hospital?.displayAddress?.contains(searchQuery, ignoreCase = true) == true
            val matchesGender = selectedGender == null || doctor.gender?.uppercase() == selectedGender
            val matchesExperience = minimumExperience == null || (doctor.yearsOfExperience ?: 0) >= minimumExperience!!
            val matchesFee = maximumFee == null || fee <= maximumFee!!
            if (matchesSearch && matchesGender && matchesExperience && matchesFee) {
                DoctorBookingEntry(doctor, workplace)
            } else null
        }
        when (sortOption) {
            "RATING" -> matches.sortedByDescending { it.doctor.displayRating }
            "EXPERIENCE" -> matches.sortedByDescending { it.doctor.yearsOfExperience ?: 0 }
            "PRICE_ASC" -> matches.sortedBy {
                it.workplace.consultationFee ?: it.workplace.price ?: it.doctor.displayPrice
            }
            else -> matches
        }
    }

    Scaffold(
        containerColor = Background,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Đặt khám bác sĩ", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Chọn bác sĩ phù hợp với bạn", color = Color.White.copy(alpha = 0.78f), fontSize = 11.sp)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = HeaderGreenDark)
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            DoctorBookingSearchBar(
                query = searchQuery,
                activeFilterCount = activeFilterCount,
                onQueryChange = { searchQuery = it },
                onFilterClick = { showFilterDialog = true }
            )

            val specialties = (specialtiesState as? NetworkState.Success)?.data.orEmpty()
            if (specialties.isNotEmpty()) {
                SpecialtyQuickFilters(
                    specialties = specialties,
                    selectedId = selectedSpecialtyId,
                    onSelect = { selectedSpecialtyId = it }
                )
            }

            when (val state = doctorsState) {
                is NetworkState.Loading, NetworkState.Idle -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NovaCareGreen)
                }
                is NetworkState.Error -> DoctorListError(state.message) { doctorViewModel.searchDoctors() }
                is NetworkState.Success -> {
                    if (entries.isEmpty()) {
                        DoctorListEmpty(activeFilterCount > 0 || selectedSpecialtyId != null) {
                            searchQuery = ""
                            selectedSpecialtyId = null
                            selectedGender = null
                            minimumExperience = null
                            maximumFee = null
                            sortOption = "RECOMMENDED"
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 10.dp, bottom = 24.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            item {
                                Text(
                                    "${entries.size} bác sĩ đang nhận lịch",
                                    color = TextSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            items(entries, key = { "${it.doctor.id}-${it.workplace.id}" }) { entry ->
                                DoctorBookingCard(
                                    entry = entry,
                                    onDetails = { navController.navigate(Screen.DoctorDetail.createRoute(entry.doctor.id)) },
                                    onBook = { navController.navigate(Screen.Booking.createRoute(entry.doctor.id, entry.workplace.id)) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showFilterDialog) {
        DoctorFilterDialog(
            selectedGender = selectedGender,
            minimumExperience = minimumExperience,
            maximumFee = maximumFee,
            sortOption = sortOption,
            onDismiss = { showFilterDialog = false },
            onApply = { gender, experience, fee, sort ->
                selectedGender = gender
                minimumExperience = experience
                maximumFee = fee
                sortOption = sort
                showFilterDialog = false
            }
        )
    }
}

@Composable
private fun DoctorBookingSearchBar(
    query: String,
    activeFilterCount: Int,
    onQueryChange: (String) -> Unit,
    onFilterClick: () -> Unit
) {
    Surface(color = Color.White, shadowElevation = 3.dp) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                placeholder = { Text("Tên bác sĩ, chuyên khoa, bệnh viện...", fontSize = 12.sp, color = TextMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = NovaCareGreen) },
                trailingIcon = if (query.isNotBlank()) {{
                    IconButton(onClick = { onQueryChange("") }) {
                        Icon(Icons.Default.Close, contentDescription = "Xóa tìm kiếm", tint = TextMuted)
                    }
                }} else null,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(14.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = NovaCareGreen,
                    unfocusedBorderColor = Border,
                    focusedContainerColor = Background,
                    unfocusedContainerColor = Background
                )
            )
            Surface(
                modifier = Modifier.height(56.dp).clickable(onClick = onFilterClick),
                shape = RoundedCornerShape(14.dp),
                color = if (activeFilterCount > 0) NovaCareGreenLight else Background,
                border = BorderStroke(1.dp, if (activeFilterCount > 0) NovaCareGreen else Border)
            ) {
                Row(Modifier.padding(horizontal = 13.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Tune, contentDescription = "Lọc", tint = if (activeFilterCount > 0) NovaCareGreen else TextSecondary, modifier = Modifier.size(19.dp))
                    if (activeFilterCount > 0) {
                        Spacer(Modifier.width(4.dp))
                        Text("$activeFilterCount", color = NovaCareGreenDark, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun SpecialtyQuickFilters(specialties: List<Specialty>, selectedId: String?, onSelect: (String?) -> Unit) {
    LazyRow(
        modifier = Modifier.fillMaxWidth().background(Color.White),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item { SpecialtyFilterChip("Tất cả", selectedId == null) { onSelect(null) } }
        items(specialties, key = { it.id }) { specialty ->
            SpecialtyFilterChip(specialty.name, selectedId == specialty.id) { onSelect(specialty.id) }
        }
    }
}

@Composable
private fun SpecialtyFilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.clickable(onClick = onClick),
        color = if (selected) NovaCareGreen else Color.White,
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, if (selected) NovaCareGreen else Border)
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 13.dp, vertical = 8.dp),
            color = if (selected) Color.White else TextSecondary,
            fontSize = 12.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun DoctorBookingCard(entry: DoctorBookingEntry, onDetails: () -> Unit, onBook: () -> Unit) {
    val doctor = entry.doctor
    val workplace = entry.workplace
    val hospital = workplace.hospital ?: doctor.hospital
    val fee = workplace.consultationFee ?: workplace.price ?: doctor.displayPrice
    val feeText = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(fee)

    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onDetails),
        color = Color.White,
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(1.dp, Border),
        shadowElevation = 1.dp
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Box(contentAlignment = Alignment.BottomEnd) {
                    AsyncImage(
                        model = doctor.displayAvatarUrl,
                        contentDescription = doctor.displayFullNameWithTitle,
                        modifier = Modifier.size(74.dp).clip(CircleShape).background(Color(0xFFF1F5F9)),
                        contentScale = ContentScale.Crop
                    )
                    Box(Modifier.size(20.dp).background(NovaCareGreen, CircleShape), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Check, contentDescription = "Đã xác thực", tint = Color.White, modifier = Modifier.size(12.dp))
                    }
                }
                Spacer(Modifier.width(13.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        doctor.displayFullNameWithTitle,
                        color = NovaCareGreenDark,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(5.dp))
                    Surface(color = NovaCareGreenLight, shape = RoundedCornerShape(7.dp)) {
                        Text(
                            workplace.specialty?.name ?: doctor.displaySpecialty,
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                            color = NovaCareGreenDark,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(Modifier.height(7.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(3.dp))
                        Text("${doctor.displayRating}", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        doctor.yearsOfExperience?.takeIf { it > 0 }?.let {
                            Text("  •  $it năm kinh nghiệm", fontSize = 11.5.sp, color = TextSecondary)
                        }
                    }
                }
            }

            HorizontalDivider(Modifier.padding(vertical = 12.dp), color = BorderLight)

            DoctorInfoLine(Icons.Default.LocalHospital, hospital?.name ?: "Cơ sở khám bệnh", TextPrimary, FontWeight.Bold)
            Spacer(Modifier.height(7.dp))
            DoctorInfoLine(Icons.Default.LocationOn, hospital?.displayAddress ?: "Địa chỉ đang cập nhật", TextSecondary)
            Spacer(Modifier.height(9.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = NovaCareGreen, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text("Lịch khám", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Text("Chọn để xem ngày và giờ còn trống", color = TextSecondary, fontSize = 11.sp)
                }
                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = NovaCareGreen)
            }

            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Giá khám", color = TextSecondary, fontSize = 11.sp)
                    Text(feeText, color = TextPrimary, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                }
                Button(
                    onClick = onBook,
                    shape = RoundedCornerShape(11.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = NovaCareGreen),
                    contentPadding = PaddingValues(horizontal = 18.dp, vertical = 10.dp)
                ) {
                    Text("Đặt lịch", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun DoctorInfoLine(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String, color: Color, weight: FontWeight = FontWeight.Normal) {
    Row(verticalAlignment = Alignment.Top) {
        Icon(icon, contentDescription = null, tint = NovaCareGreen, modifier = Modifier.size(17.dp))
        Spacer(Modifier.width(8.dp))
        Text(text, color = color, fontSize = 11.5.sp, fontWeight = weight, lineHeight = 16.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun DoctorListError(message: String, onRetry: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(Icons.Default.CloudOff, contentDescription = null, tint = StatusErrorText, modifier = Modifier.size(42.dp))
        Spacer(Modifier.height(12.dp))
        Text("Không thể tải danh sách bác sĩ", color = TextPrimary, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(4.dp))
        Text(message, color = TextSecondary, fontSize = 12.sp)
        Spacer(Modifier.height(14.dp))
        Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = NovaCareGreen)) { Text("Thử lại") }
    }
}

@Composable
private fun DoctorListEmpty(hasFilters: Boolean, onClear: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Box(Modifier.size(70.dp).background(Color(0xFFF1F5F9), CircleShape), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.PersonSearch, contentDescription = null, tint = TextMuted, modifier = Modifier.size(34.dp))
        }
        Spacer(Modifier.height(14.dp))
        Text("Không tìm thấy bác sĩ phù hợp", color = TextPrimary, fontWeight = FontWeight.Bold)
        if (hasFilters) TextButton(onClick = onClear) { Text("Xóa tìm kiếm và bộ lọc", color = NovaCareGreen, fontWeight = FontWeight.Bold) }
    }
}
