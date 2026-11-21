package com.example.kltn_novacare.ui.screens.booking

import android.app.DatePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.*
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

val MedproBlue = NovaCareGreen
val MedproBlueLight = NovaCareGreenLight
val MedproTextDark = Color(0xFF0F172A)
val MedproSubText = Color(0xFF475569)

data class BookingDateChipData(
    val dateStr: String,
    val displayDate: String,
    val displayDayOfWeek: String
)

data class HospitalBookingMode(
    val id: String,
    val title: String,
    val description: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val iconBgColor: Color,
    val iconTint: Color,
    val badge: String? = null
)

@Suppress("UNUSED_PARAMETER")
fun getAvailableBookingModesForHospital(hospital: Hospital): List<HospitalBookingMode> {
    return listOf(
        HospitalBookingMode(
            id = "DOCTOR",
            title = "Khám theo bác sĩ",
            description = "Chủ động lựa chọn bác sĩ chuyên khoa, xem học vị và khung giờ trống.",
            icon = Icons.Default.Person,
            iconBgColor = Color(0xFFECFDF5),
            iconTint = Color(0xFF0C4B39),
            badge = "Khuyên dùng"
        ),
        HospitalBookingMode(
            id = "SERVICE",
            title = "Khám dịch vụ",
            description = "Chọn chuyên khoa, dịch vụ, phòng khám và thời gian phù hợp.",
            icon = Icons.Default.MedicalServices,
            iconBgColor = Color(0xFFEFF6FF),
            iconTint = Color(0xFF2563EB),
            badge = null
        ),
        HospitalBookingMode(
            id = "AFTER_HOURS",
            title = "Khám ngoài giờ",
            description = "Chọn dịch vụ, phòng khám và lịch cuối tuần còn chỗ.",
            icon = Icons.Default.MedicalServices,
            iconBgColor = Color(0xFFEAF8F2),
            iconTint = Color(0xFF075E47)
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HospitalFacilityBookingScreen(
    initialHospitalId: String?, navController: NavController, bookingViewModel: BookingViewModel,
    doctorViewModel: DoctorViewModel, patientViewModel: PatientViewModel,
    initialSpecialtyId: String? = null, initialSpecialtyName: String? = null,
    initialReason: String? = null, initialDoctorId: String? = null
) {
    var choosingHospital by rememberSaveable { mutableStateOf(initialHospitalId == null) }
    var initialized by rememberSaveable { mutableStateOf(false) }
    var appliedInitial by rememberSaveable { mutableStateOf(false) }
    var appliedSuggestion by rememberSaveable { mutableStateOf(false) }
    var appliedDoctor by rememberSaveable { mutableStateOf(false) }

    val hospitals by doctorViewModel.hospitals.collectAsState()
    val specialties by doctorViewModel.specialties.collectAsState()

    LaunchedEffect(Unit) {
        if (!initialized) {
            if (bookingViewModel.uiState.value.screeningSessionId == null) bookingViewModel.resetBooking()
            initialized = true
        }
        doctorViewModel.loadHospitals()
        doctorViewModel.loadSpecialties()
    }

    LaunchedEffect(specialties, initialSpecialtyId, initialSpecialtyName) {
        if (!appliedSuggestion && (!initialSpecialtyId.isNullOrBlank() || !initialSpecialtyName.isNullOrBlank())) {
            val specList = (specialties as? NetworkState.Success)?.data.orEmpty()
            if (specList.isNotEmpty()) {
                val found = specList.find { spec ->
                    (!initialSpecialtyId.isNullOrBlank() && spec.id.equals(initialSpecialtyId, ignoreCase = true)) ||
                    (!initialSpecialtyName.isNullOrBlank() && (
                        spec.name.equals(initialSpecialtyName, ignoreCase = true) ||
                        spec.name.contains(initialSpecialtyName, ignoreCase = true) ||
                        initialSpecialtyName.contains(spec.name, ignoreCase = true)
                    ))
                }
                if (found != null) {
                    bookingViewModel.selectSpecialty(found)
                    if (bookingViewModel.uiState.value.screeningSessionId == null && !initialReason.isNullOrBlank()) {
                        bookingViewModel.setDetails(initialReason, "")
                    }
                    appliedSuggestion = true
                }
            }
        }
    }

    LaunchedEffect(hospitals, initialHospitalId) {
        if (!appliedInitial && initialHospitalId != null) {
            (hospitals as? NetworkState.Success)?.data?.find { it.id == initialHospitalId }?.let {
                bookingViewModel.selectHospital(it)
                appliedInitial = true
                choosingHospital = false
            }
        }
    }

    LaunchedEffect(initialDoctorId, initialHospitalId) {
        if (!appliedDoctor && !initialDoctorId.isNullOrBlank()) {
            try {
                val doctorRepo = com.example.kltn_novacare.data.repository.DoctorRepository()
                val docRes = doctorRepo.getDoctorById(initialDoctorId)
                docRes.onSuccess { doc ->
                    val wp = doc.workPlaces?.find { it.hospitalId == initialHospitalId }
                        ?: doc.workPlaces?.firstOrNull()
                    if (wp != null) {
                        bookingViewModel.selectDoctor(doc, wp)
                        appliedDoctor = true
                    }
                }
            } catch (_: Exception) {}
        }
    }

    if (choosingHospital) {
        Scaffold(topBar = { TopAppBar(title = { Text("Đặt khám theo cơ sở") },
            navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Quay lại")
            } }) }) { padding ->
            Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp)) {
                StepSelectHospital(doctorViewModel) { hospital, mode ->
                    bookingViewModel.selectHospital(hospital)
                    bookingViewModel.setBookingType(mode)
                    choosingHospital = false
                    appliedInitial = true
                }
            }
        }
    } else {
        BookingJourney(bookingViewModel, patientViewModel, navController, onBackFromInfo = { choosingHospital = true }) {
            BookingInfoContent(bookingViewModel, doctorViewModel, allowDoctorSelection = true)
        }
    }
}

@Composable
fun DoctorSelectionModal(
    hospital: Hospital?,
    doctorViewModel: DoctorViewModel,
    onDismiss: () -> Unit,
    onDoctorSelected: (Doctor, DoctorWorkplace) -> Unit,
    specialtyId: String? = null
) {
    val doctorsState by doctorViewModel.doctors.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
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

    LaunchedEffect(hospital?.id, specialtyId) {
        doctorViewModel.searchDoctors(hospitalId = hospital?.id, specialtyId = specialtyId)
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
                .clip(RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)),
            color = Color.White
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(4.dp)
                        .background(Color(0xFFCBD5E1), CircleShape)
                        .align(Alignment.CenterHorizontally)
                )

                Spacer(modifier = Modifier.height(12.dp))

                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.align(Alignment.CenterStart)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.Black)
                    }

                    Text(
                        "Chọn bác sĩ",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = MedproTextDark
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Tìm kiếm", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFF94A3B8)) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFFF8FAFC),
                            unfocusedContainerColor = Color(0xFFF8FAFC),
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent
                        )
                    )

                    Surface(
                        modifier = Modifier
                            .height(52.dp)
                            .clickable { showFilterDialog = true },
                        shape = RoundedCornerShape(12.dp),
                        color = if (activeFilterCount > 0) NovaCareGreenLight else Color(0xFFF8FAFC),
                        border = if (activeFilterCount > 0) BorderStroke(1.dp, NovaCareGreenBorder) else null
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                Icons.Default.Tune,
                                contentDescription = "Lọc",
                                tint = if (activeFilterCount > 0) NovaCareGreen else Color(0xFF475569),
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                if (activeFilterCount > 0) "Lọc ($activeFilterCount)" else "Lọc",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = if (activeFilterCount > 0) NovaCareGreenDark else MedproTextDark
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                when (doctorsState) {
                    is NetworkState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = MedproBlue)
                        }
                    }
                    is NetworkState.Success -> {
                        val doctors = (doctorsState as NetworkState.Success<List<Doctor>>).data
                        val filteredDoctors = remember(
                            doctors, searchQuery, hospital?.id, specialtyId,
                            selectedGender, minimumExperience, maximumFee, sortOption
                        ) {
                            val matches = doctors.mapNotNull { doc ->
                                val workplace = doc.workPlaces.orEmpty().firstOrNull {
                                    (hospital == null || it.hospitalId == hospital.id) &&
                                        (specialtyId == null || (it.specialtyId ?: it.specialty?.id) == specialtyId)
                                } ?: return@mapNotNull null
                                val fee = workplace.consultationFee ?: workplace.price ?: doc.displayPrice
                                val matchesSearch = searchQuery.isBlank() ||
                                    doc.displayFullNameWithTitle.contains(searchQuery, ignoreCase = true) ||
                                    doc.displaySpecialty.contains(searchQuery, ignoreCase = true) ||
                                    workplace.hospital?.name?.contains(searchQuery, ignoreCase = true) == true
                                val matchesGender = selectedGender == null || doc.gender?.uppercase() == selectedGender
                                val matchesExperience = minimumExperience == null ||
                                    (doc.yearsOfExperience ?: 0) >= minimumExperience!!
                                val matchesFee = maximumFee == null || fee <= maximumFee!!
                                if (matchesSearch && matchesGender && matchesExperience && matchesFee) doc to workplace else null
                            }
                            when (sortOption) {
                                "RATING" -> matches.sortedByDescending { it.first.displayRating }
                                "EXPERIENCE" -> matches.sortedByDescending { it.first.yearsOfExperience ?: 0 }
                                "PRICE_ASC" -> matches.sortedBy {
                                    it.second.consultationFee ?: it.second.price ?: it.first.displayPrice
                                }
                                else -> matches
                            }
                        }

                        if (filteredDoctors.isEmpty()) {
                            Column(
                                modifier = Modifier.fillMaxSize().padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    Icons.Default.PersonSearch,
                                    contentDescription = null,
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(38.dp)
                                )
                                Spacer(Modifier.height(10.dp))
                                Text(
                                    if (activeFilterCount > 0) "Không có bác sĩ phù hợp với bộ lọc" else "Không tìm thấy bác sĩ nào.",
                                    color = MedproSubText,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    textAlign = TextAlign.Center
                                )
                                if (activeFilterCount > 0) {
                                    TextButton(onClick = {
                                        selectedGender = null
                                        minimumExperience = null
                                        maximumFee = null
                                        sortOption = "RECOMMENDED"
                                    }) {
                                        Text("Xóa bộ lọc", color = NovaCareGreen, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                items(filteredDoctors, key = { "${it.first.id}-${it.second.id}" }) { (doc, workplace) ->

                                    OutlinedCard(
                                        onClick = { onDoctorSelected(doc, workplace) },
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(16.dp),
                                        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                        colors = CardDefaults.outlinedCardColors(containerColor = Color.White)
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            AsyncImage(
                                                model = doc.displayAvatarUrl,
                                                contentDescription = doc.fullName,
                                                modifier = Modifier
                                                    .size(60.dp)
                                                    .clip(CircleShape)
                                                    .background(Color(0xFFF1F5F9)),
                                                contentScale = ContentScale.Crop
                                            )

                                            Spacer(modifier = Modifier.width(14.dp))

                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "${doc.displayFullNameWithTitle} | ${doc.displaySpecialty}",
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 14.5.sp,
                                                    color = MedproBlue,
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = "Chuyên trị: ${doc.bio?.takeIf { it.isNotBlank() } ?: "Chưa cập nhật"}",
                                                    fontSize = 12.sp,
                                                    color = MedproSubText,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                Text(
                                                    text = "Chọn bác sĩ để xem lịch còn trống",
                                                    fontSize = 12.sp,
                                                    color = MedproSubText
                                                )
                                                Spacer(modifier = Modifier.height(2.dp))
                                                Text(
                                                    text = "Giá khám: ${NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(workplace.consultationFee ?: workplace.price ?: doc.displayPrice)}",
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 13.sp,
                                                    color = MedproTextDark
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    is NetworkState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Lỗi kết nối máy chủ khi tải danh sách bác sĩ", color = Color.Red)
                        }
                    }
                    else -> {}
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
fun DoctorFilterDialog(
    selectedGender: String?,
    minimumExperience: Int?,
    maximumFee: Double?,
    sortOption: String,
    onDismiss: () -> Unit,
    onApply: (String?, Int?, Double?, String) -> Unit
) {
    var gender by rememberSaveable { mutableStateOf(selectedGender) }
    var experience by rememberSaveable { mutableStateOf(minimumExperience) }
    var fee by rememberSaveable { mutableStateOf(maximumFee) }
    var sort by rememberSaveable { mutableStateOf(sortOption) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(0.92f).wrapContentHeight(),
            shape = RoundedCornerShape(22.dp),
            color = Color.White
        ) {
            Column(Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Lọc bác sĩ", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MedproTextDark)
                        Text("Chọn tiêu chí phù hợp với nhu cầu", fontSize = 12.sp, color = MedproSubText)
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color(0xFF64748B))
                    }
                }

                Spacer(Modifier.height(14.dp))
                DoctorFilterSection("Giới tính") {
                    FilterChoiceRow(
                        options = listOf(null to "Tất cả", "MALE" to "Nam", "FEMALE" to "Nữ"),
                        selected = gender,
                        onSelect = { gender = it }
                    )
                }

                DoctorFilterSection("Kinh nghiệm") {
                    FilterChoiceRow(
                        options = listOf(null to "Tất cả", 5 to "Từ 5 năm", 10 to "Từ 10 năm", 15 to "Từ 15 năm"),
                        selected = experience,
                        onSelect = { experience = it }
                    )
                }

                DoctorFilterSection("Mức phí khám") {
                    FilterChoiceRow(
                        options = listOf(
                            null to "Tất cả",
                            300_000.0 to "≤ 300.000đ",
                            500_000.0 to "≤ 500.000đ",
                            1_000_000.0 to "≤ 1 triệu"
                        ),
                        selected = fee,
                        onSelect = { fee = it }
                    )
                }

                DoctorFilterSection("Sắp xếp theo") {
                    FilterChoiceRow(
                        options = listOf(
                            "RECOMMENDED" to "Đề xuất",
                            "RATING" to "Đánh giá cao",
                            "EXPERIENCE" to "Kinh nghiệm",
                            "PRICE_ASC" to "Phí thấp"
                        ),
                        selected = sort,
                        onSelect = { sort = it }
                    )
                }

                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(
                        onClick = {
                            gender = null
                            experience = null
                            fee = null
                            sort = "RECOMMENDED"
                        },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, NovaCareGreenBorder)
                    ) {
                        Text("Đặt lại", color = NovaCareGreenDark, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = { onApply(gender, experience, fee, sort) },
                        modifier = Modifier.weight(1.35f).height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NovaCareGreen)
                    ) {
                        Text("Áp dụng", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun DoctorFilterSection(title: String, content: @Composable () -> Unit) {
    Text(title, color = MedproTextDark, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(8.dp))
    content()
    Spacer(Modifier.height(16.dp))
}

@Composable
private fun <T> FilterChoiceRow(
    options: List<Pair<T, String>>,
    selected: T,
    onSelect: (T) -> Unit
) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(options) { (value, label) ->
            val isSelected = selected == value
            Surface(
                modifier = Modifier.clickable { onSelect(value) },
                shape = RoundedCornerShape(10.dp),
                color = if (isSelected) NovaCareGreenLight else Color(0xFFF8FAFC),
                border = BorderStroke(1.dp, if (isSelected) NovaCareGreen else Color(0xFFE2E8F0))
            ) {
                Text(
                    label,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                    color = if (isSelected) NovaCareGreenDark else Color(0xFF475569),
                    fontSize = 12.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun CreatePatientProfileModal(
    patientViewModel: PatientViewModel,
    onDismiss: () -> Unit,
    onCreated: (PatientProfile) -> Unit
) {
    val operation by patientViewModel.profileOperation.collectAsState()
    LaunchedEffect(Unit) { patientViewModel.resetOperation() }
    com.example.kltn_novacare.ui.screens.profile.FullProfileFormDialog(
        title = "Tạo hồ sơ bệnh nhân mới",
        subtitle = "Hồ sơ được lưu để sử dụng trên cả mobile và web",
        isSaving = operation is NetworkState.Loading,
        error = (operation as? NetworkState.Error)?.message,
        onDismiss = onDismiss,
        onSubmit = { request -> patientViewModel.createProfile(request, onCreated) }
    )
}

@Composable
fun StepSelectHospital(
    doctorViewModel: DoctorViewModel,
    onHospitalAndModeSelected: (Hospital, String) -> Unit
) {
    val hospitalsState by doctorViewModel.hospitals.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedProvince by remember { mutableStateOf<String?>(null) }
    var selectedDistrict by remember { mutableStateOf<String?>(null) }
    var detailHospital by remember { mutableStateOf<Hospital?>(null) }
    var bookingModesModalHospital by remember { mutableStateOf<Hospital?>(null) }

    LaunchedEffect(Unit) {
        doctorViewModel.loadHospitals()
    }

    fun getProvince(hosp: Hospital): String {
        val p = hosp.province?.takeIf { it.isNotBlank() } ?: hosp.city?.takeIf { it.isNotBlank() }
        if (!p.isNullOrBlank()) return p
        val addr = hosp.address ?: ""
        return when {
            addr.contains("Hồ Chí Minh") || addr.contains("TP.HCM") || addr.contains("TP. HCM") -> "TP. Hồ Chí Minh"
            addr.contains("Hà Nội") -> "Hà Nội"
            addr.contains("Đà Nẵng") -> "Đà Nẵng"
            addr.contains("Cần Thơ") -> "Cần Thơ"
            addr.contains("Hải Phòng") -> "Hải Phòng"
            else -> "TP. Hồ Chí Minh"
        }
    }

    fun getDistrict(hosp: Hospital): String {
        val d = hosp.district?.takeIf { it.isNotBlank() }
        if (!d.isNullOrBlank()) return d
        val addr = hosp.address ?: ""
        val regex = "(Quận\\s+\\d+|Quận\\s+[^,]+|Huyện\\s+[^,]+|TP\\.\\s*Thủ\\s*Đức)".toRegex(RegexOption.IGNORE_CASE)
        val match = regex.find(addr)
        return match?.value?.trim() ?: "Khác"
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
                "Bước 1: Chọn cơ sở y tế hoặc bệnh viện",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 17.sp,
            color = Color(0xFF0F172A)
        )
        Text(
            "Vui lòng chọn bệnh viện hoặc cơ sở y tế bạn muốn đăng ký khám bệnh.",
            fontSize = 12.sp,
            color = TextSecondary
        )

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Tìm tên cơ sở, bệnh viện, địa chỉ...", fontSize = 13.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Tìm kiếm", tint = Color(0xFF0C4B39)) },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { searchQuery = "" }) {
                        Icon(Icons.Default.Close, contentDescription = "Xóa", tint = Color.Gray)
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFF0C4B39),
                unfocusedBorderColor = Color(0xFFCBD5E1),
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White
            )
        )

        when (hospitalsState) {
            is NetworkState.Loading -> {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Primary)
                }
            }
            is NetworkState.Success -> {
                val allHospitals = (hospitalsState as NetworkState.Success<List<Hospital>>).data

                val availableProvinces = remember(allHospitals) {
                    allHospitals.map { getProvince(it) }.distinct().sorted()
                }

                val availableDistricts = remember(allHospitals, selectedProvince) {
                    allHospitals
                        .filter { selectedProvince == null || getProvince(it) == selectedProvince }
                        .map { getDistrict(it) }
                        .filter { it.isNotBlank() }
                        .distinct()
                        .sorted()
                }

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Bộ lọc theo tỉnh/thành và quận/huyện có cơ sở:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF334155))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        var provinceExpanded by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.weight(1f)) {
                            OutlinedCard(
                                onClick = { provinceExpanded = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                border = BorderStroke(1.dp, if (selectedProvince != null) Color(0xFF0C4B39) else Color(0xFFCBD5E1)),
                                colors = CardDefaults.outlinedCardColors(containerColor = Color.White)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                    text = selectedProvince ?: "Tất cả tỉnh/thành",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (selectedProvince != null) Color(0xFF0C4B39) else Color(0xFF334155),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(18.dp))
                                }
                            }
                            DropdownMenu(
                                expanded = provinceExpanded,
                                onDismissRequest = { provinceExpanded = false }
                            ) {
                                DropdownMenuItem(
                            text = { Text("Tất cả tỉnh/thành", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                                    onClick = {
                                        selectedProvince = null
                                        selectedDistrict = null
                                        provinceExpanded = false
                                    }
                                )
                                availableProvinces.forEach { prov ->
                                    DropdownMenuItem(
                                        text = { Text(prov, fontSize = 12.sp) },
                                        onClick = {
                                            selectedProvince = prov
                                            selectedDistrict = null
                                            provinceExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        var districtExpanded by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.weight(1f)) {
                            OutlinedCard(
                                onClick = { districtExpanded = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                border = BorderStroke(1.dp, if (selectedDistrict != null) Color(0xFF0C4B39) else Color(0xFFCBD5E1)),
                                colors = CardDefaults.outlinedCardColors(containerColor = Color.White)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                    text = selectedDistrict ?: "Tất cả quận/huyện",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (selectedDistrict != null) Color(0xFF0C4B39) else Color(0xFF334155),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(18.dp))
                                }
                            }
                            DropdownMenu(
                                expanded = districtExpanded,
                                onDismissRequest = { districtExpanded = false }
                            ) {
                                DropdownMenuItem(
                            text = { Text("Tất cả quận/huyện", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                                    onClick = {
                                        selectedDistrict = null
                                        districtExpanded = false
                                    }
                                )
                                availableDistricts.forEach { dist ->
                                    DropdownMenuItem(
                                        text = { Text(dist, fontSize = 12.sp) },
                                        onClick = {
                                            selectedDistrict = dist
                                            districtExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }

                val filteredHospitals = remember(allHospitals, searchQuery, selectedProvince, selectedDistrict) {
                    allHospitals.filter { hosp ->
                        val matchesQuery = searchQuery.isBlank() ||
                                hosp.name.contains(searchQuery, ignoreCase = true) ||
                                (hosp.address?.contains(searchQuery, ignoreCase = true) == true)

                        val matchesProvince = selectedProvince == null || getProvince(hosp) == selectedProvince
                        val matchesDistrict = selectedDistrict == null || getDistrict(hosp) == selectedDistrict

                        matchesQuery && matchesProvince && matchesDistrict
                    }
                }

                if (filteredHospitals.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "Không tìm thấy cơ sở y tế nào phù hợp với bộ lọc.",
                            color = TextSecondary,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        filteredHospitals.forEach { hosp ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                shape = RoundedCornerShape(16.dp),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        AsyncImage(
                                            model = hosp.displayLogo
                                                ?: hosp.displayCoverImage
                                                ?: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=300&auto=format&fit=crop&q=80",
                                            contentDescription = hosp.name,
                                            modifier = Modifier
                                                .size(64.dp)
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(Color(0xFFF1F5F9)),
                                            contentScale = ContentScale.Crop
                                        )

                                        Spacer(modifier = Modifier.width(12.dp))

                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = hosp.name,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                color = Color(0xFF0F172A),
                                                maxLines = 2,
                                                overflow = TextOverflow.Ellipsis
                                            )

                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                modifier = Modifier.padding(top = 4.dp)
                                            ) {
                                                Icon(
                                                    Icons.Default.Star,
                                                    contentDescription = "Rating",
                                                    tint = Color(0xFFFFB300),
                                                    modifier = Modifier.size(15.dp)
                                                )
                                                Spacer(modifier = Modifier.width(3.dp))
                                                Text(
                                                    text = "${hosp.rating ?: 4.8}",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color(0xFF0F172A)
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = "(${hosp.reviewCount ?: 150}+ lượt khám)",
                                                    fontSize = 11.sp,
                                                    color = TextSecondary
                                                )
                                            }

                                            Row(
                                                verticalAlignment = Alignment.Top,
                                                modifier = Modifier.padding(top = 4.dp)
                                            ) {
                                                Icon(
                                                    Icons.Default.LocationOn,
                                                    contentDescription = "Địa chỉ",
                                                    tint = Color(0xFF0C4B39),
                                                    modifier = Modifier
                                                        .size(14.dp)
                                                        .padding(top = 2.dp)
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = hosp.displayAddress,
                                                    fontSize = 11.sp,
                                                    color = TextSecondary,
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))
                                    HorizontalDivider(color = Color(0xFFF1F5F9))

                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(top = 10.dp),
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        OutlinedButton(
                                            onClick = { detailHospital = hosp },
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(10.dp),
                                            border = BorderStroke(1.dp, Color(0xFF0C4B39)),
                                            contentPadding = PaddingValues(vertical = 8.dp)
                                        ) {
                                            Text(
                                                "Xem chi tiết",
                                                color = Color(0xFF0C4B39),
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp
                                            )
                                        }

                                        Button(
                                            onClick = { bookingModesModalHospital = hosp },
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(10.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0C4B39)),
                                            contentPadding = PaddingValues(vertical = 8.dp)
                                        ) {
                                            Text(
                                                "Đặt khám ngay",
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is NetworkState.Error -> {
                Text("Không thể tải danh sách bệnh viện từ hệ thống", color = Color.Red, fontSize = 13.sp)
            }
            else -> {}
        }
    }

    detailHospital?.let { hosp ->
        AlertDialog(
            onDismissRequest = { detailHospital = null },
            title = {
                Text(hosp.name, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF0F172A))
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AsyncImage(
                        model = hosp.displayCoverImage ?: hosp.displayLogo ?: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80",
                        contentDescription = hosp.name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .clip(RoundedCornerShape(10.dp)),
                        contentScale = ContentScale.Crop
                    )
                    Text("📍 Địa chỉ: ${hosp.displayAddress}", fontSize = 12.sp, color = TextSecondary)
                    hosp.phone?.let { Text("📞 Điện thoại: $it", fontSize = 12.sp, color = TextSecondary) }
                    hosp.hotline?.let { Text("☎️ Hotline: $it", fontSize = 12.sp, color = Color(0xFF0C4B39), fontWeight = FontWeight.Bold) }
                    hosp.operatingHours?.let { Text("⏰ Giờ làm việc: $it", fontSize = 12.sp, color = TextSecondary) }
                    hosp.description?.let {
                        Text("ℹ️ Giới thiệu: $it", fontSize = 11.sp, color = Color(0xFF475569), modifier = Modifier.padding(top = 4.dp))
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val selected = hosp
                        detailHospital = null
                        bookingModesModalHospital = selected
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0C4B39))
                ) {
                    Text("Đặt khám ngay", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { detailHospital = null }) {
                    Text("Đóng", color = TextSecondary)
                }
            }
        )
    }

    bookingModesModalHospital?.let { hosp ->
        val availableModes = remember(hosp) { getAvailableBookingModesForHospital(hosp) }

        Dialog(
            onDismissRequest = { bookingModesModalHospital = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .padding(16.dp),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
            ) {
                Column(
                    modifier = Modifier
                        .padding(18.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        AsyncImage(
                            model = hosp.displayLogo ?: hosp.displayCoverImage ?: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=300&auto=format&fit=crop&q=80",
                            contentDescription = hosp.name,
                            modifier = Modifier
                                .size(46.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFF1F5F9)),
                            contentScale = ContentScale.Crop
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "Hình thức đặt khám",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 16.sp,
                                color = Color(0xFF0F172A)
                            )
                            Text(
                                hosp.name,
                                fontSize = 12.sp,
                                color = Color(0xFF0C4B39),
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        IconButton(
                            onClick = { bookingModesModalHospital = null },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Đóng",
                                tint = Color.Gray,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    HorizontalDivider(color = Color(0xFFF1F5F9))

                    Text(
                        "Vui lòng chọn hình thức đăng ký khám tại cơ sở này:",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        availableModes.forEach { mode ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        val selectedHosp = hosp
                                        val selectedMode = mode.id
                                        bookingModesModalHospital = null
                                        onHospitalAndModeSelected(selectedHosp, selectedMode)
                                    },
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 14.dp, vertical = 14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .background(mode.iconBgColor, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = mode.icon,
                                            contentDescription = null,
                                            tint = mode.iconTint,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Text(
                                        text = mode.title,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = Color(0xFF0F172A),
                                        modifier = Modifier.weight(1f)
                                    )

                                    mode.badge?.let { badgeText ->
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Surface(
                                            color = mode.iconBgColor,
                                            shape = RoundedCornerShape(10.dp)
                                        ) {
                                            Text(
                                                text = badgeText,
                                                color = mode.iconTint,
                                                fontSize = 9.5.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                softWrap = false,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.width(6.dp))

                                    Icon(
                                        imageVector = Icons.Default.ChevronRight,
                                        contentDescription = null,
                                        tint = Color.Gray,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }

                    OutlinedButton(
                        onClick = { bookingModesModalHospital = null },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color(0xFFCBD5E1))
                    ) {
                        Text("Đóng", color = Color(0xFF475569), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
