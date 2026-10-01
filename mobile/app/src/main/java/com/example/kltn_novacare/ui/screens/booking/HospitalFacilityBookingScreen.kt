package com.example.kltn_novacare.ui.screens.booking

import android.app.DatePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.TextSecondary
import com.example.kltn_novacare.ui.viewmodel.*
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

val MedproBlue = Color(0xFF0090DA)
val MedproBlueLight = Color(0xFFE0F2FE)
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

fun getAvailableBookingModesForHospital(hospital: Hospital): List<HospitalBookingMode> {
    val modes = mutableListOf<HospitalBookingMode>()

    modes.add(
        HospitalBookingMode(
            id = "DOCTOR",
            title = "Khám Theo Bác Sĩ",
            description = "Chủ động lựa chọn Bác sĩ chuyên khoa, xem học vị & khung giờ trống.",
            icon = Icons.Default.Person,
            iconBgColor = Color(0xFFECFDF5),
            iconTint = Color(0xFF0C4B39),
            badge = "Khuyên dùng"
        )
    )

    modes.add(
        HospitalBookingMode(
            id = "SERVICE",
            title = "Khám Dịch Vụ / Xét Nghiệm",
            description = "Đăng ký siêu âm, xét nghiệm máu, nội soi, chẩn đoán hình ảnh kỹ thuật cao.",
            icon = Icons.Default.MedicalServices,
            iconBgColor = Color(0xFFEFF6FF),
            iconTint = Color(0xFF2563EB),
            badge = "Kết quả nhanh"
        )
    )

    if (hospital.name.contains("Đa khoa") || hospital.name.contains("Y Dược") || hospital.name.contains("Tân Bình") || hospital.name.contains("Sài Gòn")) {
        modes.add(
            HospitalBookingMode(
                id = "SPECIALTY",
                title = "Khám Theo Chuyên Khoa",
                description = "Đăng ký khám theo khoa tiêu chuẩn, hệ thống tự động xếp Bác sĩ trực ca.",
                icon = Icons.Default.LocalHospital,
                iconBgColor = Color(0xFFFAF5FF),
                iconTint = Color(0xFF9333EA)
            )
        )
    }

    if (hospital.name.contains("Quốc tế") || hospital.name.contains("Sài Gòn") || hospital.name.contains("Sản Nhi") || hospital.name.contains("Central")) {
        modes.add(
            HospitalBookingMode(
                id = "PACKAGE",
                title = "Gói Khám Sức Khỏe Tổng Quát",
                description = "Gói khám sức khỏe định kỳ toàn diện, tầm soát ung thư & tim mạch.",
                icon = Icons.Default.HealthAndSafety,
                iconBgColor = Color(0xFFFEF3C7),
                iconTint = Color(0xFFD97706),
                badge = "Ưu đãi"
            )
        )
    }

    return modes
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HospitalFacilityBookingScreen(
    initialHospitalId: String?, navController: NavController, bookingViewModel: BookingViewModel,
    doctorViewModel: DoctorViewModel, patientViewModel: PatientViewModel,
    initialSpecialtyId: String? = null, initialReason: String? = null
) {
    var choosingHospital by rememberSaveable { mutableStateOf(true) }
    var initialized by rememberSaveable { mutableStateOf(false) }
    var appliedInitial by rememberSaveable { mutableStateOf(false) }
    val hospitals by doctorViewModel.hospitals.collectAsState()
    val specialties by doctorViewModel.specialties.collectAsState()
    var appliedSuggestion by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        if (!initialized) {
            bookingViewModel.resetBooking()
            initialized = true
        }
        doctorViewModel.loadHospitals()
        if (initialSpecialtyId != null) doctorViewModel.loadSpecialties()
    }
    LaunchedEffect(appliedInitial, specialties, initialSpecialtyId) {
        if (appliedInitial && !appliedSuggestion && initialSpecialtyId != null) {
            (specialties as? NetworkState.Success)?.data?.find { it.id == initialSpecialtyId }?.let {
                bookingViewModel.selectSpecialty(it)
                bookingViewModel.setDetails(initialReason.orEmpty(), "")
                appliedSuggestion = true
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
                }
            }
        }
    } else if (initialSpecialtyId != null && !appliedSuggestion) {
        Scaffold(topBar = { TopAppBar(title = { Text("Kiểm tra chuyên khoa gợi ý") }) }) { padding ->
            Column(Modifier.padding(padding).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                when (specialties) {
                    is NetworkState.Loading, is NetworkState.Idle -> CircularProgressIndicator()
                    else -> {
                        Text("Chưa xác nhận được chuyên khoa gợi ý trong danh mục hiện tại. Bạn có thể thử lại hoặc tự chọn khi đặt khám.")
                        Button(onClick = { doctorViewModel.loadSpecialties() }) { Text("Thử lại") }
                        TextButton(onClick = { appliedSuggestion = true }) { Text("Tự chọn thông tin khám") }
                    }
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
                            .clickable { /* Filter */ },
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFF8FAFC)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.Tune, contentDescription = "Lọc", tint = Color(0xFF475569), modifier = Modifier.size(18.dp))
                            Text("Lọc", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MedproTextDark)
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
                        val filteredDoctors = remember(doctors, searchQuery, hospital?.id, specialtyId) {
                            doctors.filter { doc ->
                                doc.workPlaces.orEmpty().any { (hospital == null || it.hospitalId == hospital.id) && (specialtyId == null || (it.specialtyId ?: it.specialty?.id) == specialtyId) } &&
                                        (searchQuery.isBlank() ||
                                        doc.displayFullNameWithTitle.contains(searchQuery, ignoreCase = true) ||
                                        doc.displaySpecialty.contains(searchQuery, ignoreCase = true))
                            }
                        }

                        if (filteredDoctors.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text("Không tìm thấy bác sĩ nào.", color = MedproSubText, fontSize = 14.sp)
                            }
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(12.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                items(filteredDoctors) { doc ->
                                    val workplace = doc.workPlaces?.firstOrNull {
                                        (hospital == null || it.hospitalId == hospital.id) && (specialtyId == null || (it.specialtyId ?: it.specialty?.id) == specialtyId)
                                    } ?: return@items

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
                                                    text = "Giá khám: ${NumberFormat.getCurrencyInstance(Locale("vi", "VN")).format(doc.displayPrice)}",
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
            "Bước 1: Chọn Cơ sở Y tế / Bệnh viện",
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
                    Text("Bộ lọc theo Tỉnh thành & Quận huyện có cơ sở:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF334155))

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
                                        text = selectedProvince ?: "Tất cả Tỉnh/Thành",
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
                                    text = { Text("Tất cả Tỉnh/Thành", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
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
                                        text = selectedDistrict ?: "Tất cả Quận/Huyện",
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
                                    text = { Text("Tất cả Quận/Huyện", fontSize = 12.sp, fontWeight = FontWeight.Bold) },
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
