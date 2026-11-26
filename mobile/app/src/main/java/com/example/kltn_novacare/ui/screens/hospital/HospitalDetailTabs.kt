package com.example.kltn_novacare.ui.screens.hospital

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

private fun formatVnd(amount: Double): String {
    return NumberFormat.getNumberInstance(Locale("vi", "VN")).format(amount.toLong()) + "đ"
}

private fun formatIsoDate(raw: String?): String {
    if (raw.isNullOrBlank()) return ""
    val datePart = raw.substringBefore("T")
    return runCatching {
        java.time.LocalDate.parse(datePart)
            .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    }.getOrDefault(datePart)
}

// =========================================================================
// TAB 1: TỔNG QUAN (OVERVIEW)
// =========================================================================
@Composable
internal fun HospitalOverviewTab(
    hospital: Hospital,
    doctorsCount: Int,
    specialtiesCount: Int,
    branchesCount: Int,
    services: List<MedicalService>,
    galleryImages: List<String>,
    onImageClick: (Int) -> Unit,
    onViewAllDoctors: () -> Unit,
    onViewAllSpecialties: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Introduction Card
        if (!hospital.description.isNullOrBlank()) {
            SectionCard {
                SectionHeading(
                    icon = Icons.Default.AutoAwesome,
                    title = "Giới thiệu tổng quan",
                    subtitle = "Hồ sơ năng lực & chất lượng khám chữa bệnh"
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    text = hospital.description,
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 20.sp
                )
            }
        }

        // Scale Statistics Card (Matching Web's 4 tiles)
        val statTiles = buildList {
            if (doctorsCount > 0) add(StatTileData(Icons.Default.Groups, "$doctorsCount", "Bác sĩ liên kết", HospitalEmeraldLight, HospitalEmeraldBorder, HospitalEmerald, onViewAllDoctors))
            if (specialtiesCount > 0) add(StatTileData(Icons.Default.LocalHospital, "$specialtiesCount", "Chuyên khoa", Color(0xFFEFF6FF), Color(0xFFBFDBFE), Color(0xFF1D4ED8), onViewAllSpecialties))
            if (branchesCount > 0) add(StatTileData(Icons.Default.Apartment, "$branchesCount", "Cơ sở chi nhánh", Color(0xFFEEF2FF), Color(0xFFC7D2FE), Color(0xFF4338CA), null))
            hospital.establishedYear?.let { add(StatTileData(Icons.Default.Verified, "$it", "Năm thành lập", Color(0xFFFFFBEB), Color(0xFFFDE68A), Color(0xFFB45309), null)) }
            hospital.bedCount?.let { add(StatTileData(Icons.Default.Hotel, "$it", "Giường bệnh", Color(0xFFF0FDF4), Color(0xFFBBF7D0), Color(0xFF15803D), null)) }
        }

        if (statTiles.isNotEmpty()) {
            SectionCard {
                SectionHeading(
                    icon = Icons.Default.Assessment,
                    title = "Thống kê quy mô thực tế",
                    subtitle = "Số liệu đồng bộ trực tiếp từ hệ thống NovaCare"
                )
                Spacer(Modifier.height(12.dp))
                statTiles.chunked(2).forEachIndexed { rowIdx, pair ->
                    if (rowIdx > 0) Spacer(Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        pair.forEach { tile ->
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .let { if (tile.onClick != null) it.clickable { tile.onClick.invoke() } else it },
                                shape = RoundedCornerShape(16.dp),
                                color = tile.bg,
                                border = BorderStroke(1.dp, tile.border)
                            ) {
                                Column(
                                    modifier = Modifier.padding(vertical = 14.dp, horizontal = 10.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(tile.icon, contentDescription = null, tint = tile.tint, modifier = Modifier.size(22.dp))
                                    Spacer(Modifier.height(6.dp))
                                    Text(tile.value, fontSize = 19.sp, fontWeight = FontWeight.Black, color = TextPrimary)
                                    Text(tile.label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextSecondary, textAlign = TextAlign.Center)
                                }
                            }
                        }
                        if (pair.size == 1) {
                            Spacer(Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        // Gallery Images Section
        if (galleryImages.isNotEmpty()) {
            SectionCard {
                SectionHeading(
                    icon = Icons.Default.Collections,
                    title = "Hình ảnh cơ sở y tế (${galleryImages.size})",
                    subtitle = "Chạm vào ảnh để xem phóng to"
                )
                Spacer(Modifier.height(12.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    itemsIndexed(galleryImages) { idx, imgUrl ->
                        Box(
                            modifier = Modifier
                                .width(220.dp)
                                .height(140.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .clickable { onImageClick(idx) }
                        ) {
                            AsyncImage(
                                model = imgUrl,
                                contentDescription = "${hospital.name} - Ảnh ${idx + 1}",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.verticalGradient(
                                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.55f))
                                        )
                                    )
                            )
                            Text(
                                "Ảnh ${idx + 1}/${galleryImages.size}",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .align(Alignment.BottomStart)
                                    .padding(10.dp)
                            )
                        }
                    }
                }
            }
        }

        // Highlighted Medical Services
        if (services.isNotEmpty()) {
            SectionCard {
                SectionHeading(
                    icon = Icons.Default.MedicalServices,
                    title = "Dịch vụ y tế tiêu biểu (${services.size})",
                    subtitle = "Các dịch vụ khám & cận lâm sàng hiện có"
                )
                Spacer(Modifier.height(10.dp))
                services.take(6).forEachIndexed { idx, svc ->
                    if (idx > 0) HorizontalDivider(color = BorderLight, modifier = Modifier.padding(vertical = 8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f).padding(end = 10.dp)) {
                            Text(svc.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            if (!svc.description.isNullOrBlank()) {
                                Text(
                                    svc.description,
                                    fontSize = 11.5.sp,
                                    color = TextSecondary,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                        Surface(
                            color = HospitalEmeraldLight,
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(
                                formatVnd(svc.price),
                                color = HospitalEmerald,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

private data class StatTileData(
    val icon: ImageVector,
    val value: String,
    val label: String,
    val bg: Color,
    val border: Color,
    val tint: Color,
    val onClick: (() -> Unit)?
)

// =========================================================================
// TAB 2: THÔNG TIN CHI TIẾT (MATCHING WEB'S 4 SECTIONS)
// =========================================================================
@Composable
internal fun HospitalInfoTab(
    hospital: Hospital,
    branchesCount: Int,
    doctorsCount: Int,
    onDialPhone: (String) -> Unit,
    onSendEmail: (String) -> Unit,
    onOpenWebsite: (String) -> Unit,
    onOpenMaps: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Section 1: Thông tin cơ bản
        SectionCard {
            SectionHeading(
                icon = Icons.Default.Apartment,
                title = "1. Thông tin cơ bản của bệnh viện",
                subtitle = "Hồ sơ & quy mô chứng nhận"
            )
            Spacer(Modifier.height(12.dp))
            InfoFieldBox("TÊN CHÍNH THỨC", hospital.name)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                InfoFieldBox("PHÂN LOẠI CƠ SỞ", hospital.displayTypeLabel, modifier = Modifier.weight(1f))
                InfoFieldBox("TRẠNG THÁI HỆ THỐNG", hospital.displayStatusLabel, modifier = Modifier.weight(1f), valueColor = HospitalEmerald)
            }
            if (hospital.establishedYear != null || hospital.bedCount != null) {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    hospital.establishedYear?.let {
                        InfoFieldBox("NĂM THÀNH LẬP", "Năm $it", modifier = Modifier.weight(1f))
                    }
                    hospital.bedCount?.let {
                        InfoFieldBox("QUY MÔ GIƯỜNG BỆNH", "$it giường bệnh", modifier = Modifier.weight(1f))
                    }
                }
            }
            if (!hospital.operatingHours.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                InfoFieldBox("GIỜ LÀM VIỆC", hospital.operatingHours)
            }
        }

        // Section 2: Thông tin liên hệ
        SectionCard {
            SectionHeading(
                icon = Icons.Default.Phone,
                title = "2. Thông tin liên hệ",
                subtitle = "Kênh hỗ trợ & đường dây nóng",
                iconBg = Color(0xFFEFF6FF),
                iconTint = Color(0xFF1D4ED8)
            )
            Spacer(Modifier.height(12.dp))
            InfoFieldBox("ĐỊA CHỈ TRỤ SỞ CHÍNH", hospital.displayAddress)

            val hotline = hospital.hotline?.takeIf { it.isNotBlank() } ?: hospital.phone
            if (!hotline.isNullOrBlank() || !hospital.emergencyHotline.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (!hotline.isNullOrBlank()) {
                        InfoFieldBox(
                            label = "HOTLINE ĐẶT KHÁM",
                            value = hotline,
                            modifier = Modifier.weight(1f),
                            bgColor = HospitalEmeraldLight,
                            borderColor = HospitalEmeraldBorder,
                            labelColor = HospitalEmerald,
                            valueColor = HospitalEmeraldDark,
                            onClick = { onDialPhone(hotline) }
                        )
                    }
                    if (!hospital.emergencyHotline.isNullOrBlank()) {
                        InfoFieldBox(
                            label = "HOTLINE CẤP CỨU",
                            value = hospital.emergencyHotline,
                            modifier = Modifier.weight(1f),
                            bgColor = Color(0xFFFFF1F2),
                            borderColor = Color(0xFFFECDD3),
                            labelColor = Color(0xFFBE123C),
                            valueColor = Color(0xFF9F1239),
                            onClick = { onDialPhone(hospital.emergencyHotline) }
                        )
                    }
                }
            }

            if (!hospital.phone.isNullOrBlank() && hospital.phone != hospital.hotline) {
                Spacer(Modifier.height(8.dp))
                InfoFieldBox("ĐIỆN THOẠI TỔNG ĐÀI", hospital.phone, onClick = { onDialPhone(hospital.phone) })
            }

            if (!hospital.email.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                InfoFieldBox("EMAIL LIÊN HỆ", hospital.email, onClick = { onSendEmail(hospital.email) })
            }

            if (!hospital.website.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                InfoFieldBox(
                    label = "WEBSITE CHÍNH THỨC",
                    value = hospital.website,
                    valueColor = HospitalEmerald,
                    trailingIcon = Icons.Default.OpenInNew,
                    onClick = { onOpenWebsite(hospital.website) }
                )
            }
        }

        // Section 3: Vị trí địa lý & Bản đồ
        SectionCard {
            SectionHeading(
                icon = Icons.Default.Map,
                title = "3. Vị trí địa lý & Bản đồ",
                subtitle = "Định vị trực tuyến trên Google Maps",
                iconBg = Color(0xFFEEF2FF),
                iconTint = Color(0xFF4338CA)
            )
            Spacer(Modifier.height(12.dp))
            if (!hospital.city.isNullOrBlank()) {
                InfoFieldBox("TỈNH / THÀNH PHỐ", hospital.city)
                Spacer(Modifier.height(8.dp))
            }
            InfoFieldBox("ĐỊA CHỈ CHI TIẾT", hospital.displayAddress)
            if (hospital.latitude != null && hospital.longitude != null) {
                Spacer(Modifier.height(8.dp))
                InfoFieldBox(
                    label = "TỌA ĐỘ ĐỊA LÝ (GPS)",
                    value = "${hospital.latitude}, ${hospital.longitude}",
                    mono = true
                )
            }
            Spacer(Modifier.height(12.dp))
            OutlinedButton(
                onClick = onOpenMaps,
                modifier = Modifier.fillMaxWidth().height(44.dp),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.2.dp, HospitalEmerald)
            ) {
                Icon(Icons.Default.LocationOn, contentDescription = null, tint = HospitalEmerald, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Mở Google Maps chỉ đường", color = HospitalEmerald, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }

        // Section 4: Thông tin kết nối hệ thống NovaCare
        SectionCard {
            SectionHeading(
                icon = Icons.Default.Dns,
                title = "4. Thông tin kết nối hệ thống NovaCare",
                subtitle = "Trạng thái đồng bộ dữ liệu hạ tầng y tế",
                iconBg = Color(0xFFF3E8FF),
                iconTint = Color(0xFF7E22CE)
            )
            Spacer(Modifier.height(12.dp))
            InfoFieldBox(
                label = if (!hospital.hospitalCode.isNullOrBlank()) "MÃ CƠ SỞ Y TẾ" else "MÃ ID HỆ THỐNG",
                value = hospital.hospitalCode?.takeIf { it.isNotBlank() } ?: hospital.id,
                mono = true
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                InfoFieldBox(
                    label = "TRẠNG THÁI API",
                    value = if (hospital.isActive) "● Kết nối trực tuyến" else "Tạm ngưng",
                    valueColor = if (hospital.isActive) HospitalEmerald else StatusErrorText,
                    modifier = Modifier.weight(1f)
                )
                InfoFieldBox(
                    label = "ĐỒNG BỘ NHÂN LỰC",
                    value = "$doctorsCount BS · $branchesCount CS",
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

// =========================================================================
// TAB 3: CHI NHÁNH (BRANCHES)
// =========================================================================
@Composable
internal fun HospitalBranchesTab(
    branches: List<HospitalBranch>,
    onDialPhone: (String) -> Unit,
    onOpenMap: (HospitalBranch) -> Unit,
    onBookAtBranch: (HospitalBranch) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (branches.isEmpty()) {
            EmptyTabState(
                icon = Icons.Default.Apartment,
                title = "Chưa có chi nhánh phụ",
                subtitle = "Cơ sở y tế hiện tiếp nhận bệnh nhân tại địa chỉ trụ sở chính."
            )
        } else {
            branches.forEach { br ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Border),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column {
                        if (!br.image.isNullOrBlank()) {
                            AsyncImage(
                                model = br.image,
                                contentDescription = br.name ?: "Chi nhánh",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(145.dp),
                                contentScale = ContentScale.Crop
                            )
                        }
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(HospitalEmeraldLight, RoundedCornerShape(10.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Apartment, contentDescription = null, tint = HospitalEmerald, modifier = Modifier.size(18.dp))
                                }
                                Text(
                                    text = br.name?.takeIf { it.isNotBlank() } ?: "Cơ sở chi nhánh",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = TextPrimary,
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Icon(Icons.Default.LocationOn, contentDescription = null, tint = HospitalEmerald, modifier = Modifier.size(15.dp).padding(top = 2.dp))
                                Text(br.address, fontSize = 12.5.sp, color = TextSecondary, lineHeight = 18.sp)
                            }

                            if (!br.phone.isNullOrBlank()) {
                                Row(
                                    modifier = Modifier.clickable { onDialPhone(br.phone) },
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(Icons.Default.Call, contentDescription = null, tint = HospitalEmerald, modifier = Modifier.size(15.dp))
                                    Text("Điện thoại: ${br.phone}", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = HospitalEmerald)
                                }
                            }

                            if (!br.workingHours.isNullOrBlank()) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Icon(Icons.Default.Schedule, contentDescription = null, tint = TextMuted, modifier = Modifier.size(15.dp))
                                    Text("Giờ làm việc: ${br.workingHours}", fontSize = 12.sp, color = TextSecondary)
                                }
                            }

                            Spacer(Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(
                                    onClick = { onOpenMap(br) },
                                    modifier = Modifier.weight(1f).height(40.dp),
                                    shape = RoundedCornerShape(10.dp),
                                    border = BorderStroke(1.dp, Border),
                                    contentPadding = PaddingValues(horizontal = 8.dp)
                                ) {
                                    Icon(Icons.Default.Map, contentDescription = null, tint = HospitalEmerald, modifier = Modifier.size(15.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("Bản đồ", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                                Button(
                                    onClick = { onBookAtBranch(br) },
                                    modifier = Modifier.weight(1f).height(40.dp),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = HospitalEmerald),
                                    contentPadding = PaddingValues(horizontal = 8.dp)
                                ) {
                                    Text("Đặt lịch tại đây", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// =========================================================================
// TAB 4: BÁC SĨ (DOCTORS)
// =========================================================================
@Composable
internal fun HospitalDoctorsTab(
    doctors: List<Doctor>,
    specialties: List<Specialty>,
    hospitalId: String,
    onDoctorDetailClick: (String) -> Unit,
    onBookDoctorClick: (Doctor, DoctorWorkplace?) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedSpecId by remember { mutableStateOf<String?>(null) }

    val filteredDoctors = remember(doctors, searchQuery, selectedSpecId) {
        doctors.filter { doc ->
            val matchName = searchQuery.isBlank() ||
                doc.displayFullNameWithTitle.contains(searchQuery, ignoreCase = true) ||
                doc.displaySpecialty.contains(searchQuery, ignoreCase = true)
            val matchSpec = selectedSpecId == null ||
                doc.workPlaces.orEmpty().any { (it.specialtyId ?: it.specialty?.id) == selectedSpecId } ||
                doc.specialties.orEmpty().any { it.id == selectedSpecId }
            matchName && matchSpec
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Search Input
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Tìm tên bác sĩ hoặc chuyên khoa...", fontSize = 13.sp, color = TextMuted) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = HospitalEmerald) },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { searchQuery = "" }) {
                        Icon(Icons.Default.Close, contentDescription = "Xóa", tint = TextMuted)
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = HospitalEmerald,
                unfocusedBorderColor = Border,
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White
            )
        )

        // Specialty Filter Chips
        if (specialties.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedSpecId == null,
                    onClick = { selectedSpecId = null },
                    label = { Text("Tất cả (${doctors.size})", fontSize = 11.5.sp, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = HospitalEmerald,
                        selectedLabelColor = Color.White,
                        containerColor = Color.White
                    )
                )
                specialties.forEach { spec ->
                    FilterChip(
                        selected = selectedSpecId == spec.id,
                        onClick = { selectedSpecId = if (selectedSpecId == spec.id) null else spec.id },
                        label = { Text(spec.name, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = HospitalEmerald,
                            selectedLabelColor = Color.White,
                            containerColor = Color.White
                        )
                    )
                }
            }
        }

        if (filteredDoctors.isEmpty()) {
            EmptyTabState(
                icon = Icons.Default.PersonSearch,
                title = "Không tìm thấy bác sĩ phù hợp",
                subtitle = "Vui lòng thử từ khóa hoặc chọn chuyên khoa khác."
            )
        } else {
            filteredDoctors.forEach { doc ->
                val matchingWp = doc.workPlaces.orEmpty().firstOrNull { it.hospitalId == hospitalId }
                    ?: doc.workPlaces.orEmpty().firstOrNull()
                val fee = matchingWp?.consultationFee ?: matchingWp?.price ?: doc.displayPrice

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onDoctorDetailClick(doc.id) },
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Border),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            AsyncImage(
                                model = doc.displayAvatarUrl,
                                contentDescription = doc.displayFullNameWithTitle,
                                modifier = Modifier
                                    .size(62.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(HospitalEmeraldLight),
                                contentScale = ContentScale.Crop
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = doc.displayFullNameWithTitle,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 14.5.sp,
                                    color = TextPrimary,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(Modifier.height(3.dp))
                                Text(
                                    text = matchingWp?.specialty?.name ?: doc.displaySpecialty,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = HospitalEmerald,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(Modifier.height(5.dp))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(14.dp))
                                        Spacer(Modifier.width(3.dp))
                                        Text(
                                            String.format("%.1f", doc.displayRating),
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = TextPrimary
                                        )
                                        Text(
                                            " (${doc.displayReviewCount})",
                                            fontSize = 11.sp,
                                            color = TextSecondary
                                        )
                                    }
                                    if ((doc.yearsOfExperience ?: 0) > 0) {
                                        Text("·", color = TextMuted)
                                        Text(
                                            "${doc.yearsOfExperience} năm KN",
                                            fontSize = 11.sp,
                                            color = TextSecondary,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(Modifier.height(10.dp))
                        HorizontalDivider(color = BorderLight)
                        Spacer(Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Giá khám tham khảo", fontSize = 10.5.sp, color = TextMuted)
                                Text(
                                    formatVnd(fee),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = HospitalEmerald
                                )
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(
                                    onClick = { onDoctorDetailClick(doc.id) },
                                    shape = RoundedCornerShape(10.dp),
                                    border = BorderStroke(1.dp, Border),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Text("Hồ sơ", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                                Button(
                                    onClick = { onBookDoctorClick(doc, matchingWp) },
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = HospitalEmerald),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Text("Đặt khám", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// =========================================================================
// TAB 5: CHUYÊN KHOA (SPECIALTIES)
// =========================================================================
@Composable
internal fun HospitalSpecialtiesTab(
    specialties: List<Specialty>,
    onBookSpecialty: (Specialty) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        if (specialties.isEmpty()) {
            EmptyTabState(
                icon = Icons.Default.LocalHospital,
                title = "Đang cập nhật chuyên khoa",
                subtitle = "Danh sách chuyên khoa của cơ sở đang được đồng bộ."
            )
        } else {
            specialties.forEach { spec ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onBookSpecialty(spec) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Border),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .background(HospitalEmeraldLight, RoundedCornerShape(14.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.LocalHospital,
                                contentDescription = null,
                                tint = HospitalEmerald,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                spec.name,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 14.sp,
                                color = TextPrimary
                            )
                            if (!spec.description.isNullOrBlank()) {
                                Spacer(Modifier.height(3.dp))
                                Text(
                                    spec.description,
                                    fontSize = 12.sp,
                                    color = TextSecondary,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                    lineHeight = 17.sp
                                )
                            }
                        }

                        Surface(
                            color = HospitalEmeraldLight,
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(
                                "Đặt khám",
                                color = HospitalEmerald,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.5.sp,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// =========================================================================
// TAB 6: ĐÁNH GIÁ (REVIEWS)
// =========================================================================
@Composable
internal fun HospitalReviewsTab(
    hospital: Hospital,
    stats: PublicReviewStats?,
    reviews: List<PublicReviewItem>
) {
    val avgRating = stats?.averageRating?.takeIf { it > 0.0 } ?: (hospital.rating ?: 4.8)
    val totalReviews = stats?.totalReviews?.takeIf { it > 0 } ?: (hospital.reviewCount ?: 0)

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // Rating Overview Card
        SectionCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(96.dp)) {
                    Text(
                        text = String.format("%.1f", avgRating),
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Black,
                        color = TextPrimary
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                        repeat(5) { idx ->
                            Icon(
                                Icons.Default.Star,
                                contentDescription = null,
                                tint = if (idx < avgRating.toInt()) Color(0xFFF59E0B) else Color(0xFFE2E8F0),
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "$totalReviews đánh giá",
                        fontSize = 11.sp,
                        color = TextSecondary,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // Star distribution bars (5 -> 1)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    (5 downTo 1).forEach { star ->
                        val entry = stats?.starDistribution?.get(star.toString())
                        val pct = ((entry?.percentage ?: 0.0) / 100.0).toFloat().coerceIn(0f, 1f)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("$star★", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextSecondary, modifier = Modifier.width(22.dp))
                            LinearProgressIndicator(
                                progress = { pct },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(7.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = Color(0xFFF59E0B),
                                trackColor = Color(0xFFF1F5F9)
                            )
                            Text(
                                "${entry?.count ?: 0}",
                                fontSize = 10.5.sp,
                                color = TextMuted,
                                modifier = Modifier.width(24.dp),
                                textAlign = TextAlign.End
                            )
                        }
                    }
                }
            }

            // Criteria Breakdown if available
            val criteriaMap = stats?.criteriaAverages.orEmpty().filterValues { it > 0.0 }
            if (criteriaMap.isNotEmpty()) {
                Spacer(Modifier.height(14.dp))
                HorizontalDivider(color = BorderLight)
                Spacer(Modifier.height(12.dp))
                Text("Chi tiết theo tiêu chí", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                Spacer(Modifier.height(8.dp))
                criteriaMap.entries.forEach { (key, score) ->
                    val label = when (key) {
                        "hospitalFacility", "facility" -> "Cơ sở vật chất"
                        "hospitalHygiene", "hygiene" -> "Vệ sinh phòng khám"
                        "hospitalReception", "reception" -> "Thái độ tiếp đón"
                        "hospitalWaitingTime", "waitingTime" -> "Thời gian chờ đợi"
                        "hospitalStaffAttitude", "staffAttitude" -> "Thái độ nhân viên"
                        else -> key
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(label, fontSize = 12.sp, color = TextSecondary)
                        Text(
                            String.format("%.1f / 5.0", score),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = HospitalEmerald
                        )
                    }
                }
            }
        }

        // Individual Reviews List
        if (reviews.isEmpty()) {
            EmptyTabState(
                icon = Icons.Default.Star,
                title = "Chưa có nhận xét chi tiết",
                subtitle = "Hãy đặt lịch khám và chia sẻ trải nghiệm thực tế của bạn về ${hospital.name}."
            )
        } else {
            reviews.forEach { rev ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, Border)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .background(HospitalEmeraldLight, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    rev.displayAuthor.take(1).uppercase(),
                                    color = HospitalEmerald,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(rev.displayAuthor, fontWeight = FontWeight.Bold, fontSize = 13.5.sp, color = TextPrimary)
                                    if (rev.isVerifiedVisit) {
                                        Surface(color = HospitalEmeraldLight, shape = RoundedCornerShape(6.dp)) {
                                            Text(
                                                "Đã khám",
                                                color = HospitalEmerald,
                                                fontSize = 9.5.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row {
                                        repeat(5) { idx ->
                                            Icon(
                                                Icons.Default.Star,
                                                contentDescription = null,
                                                tint = if (idx < rev.rating) Color(0xFFF59E0B) else Color(0xFFE2E8F0),
                                                modifier = Modifier.size(13.dp)
                                            )
                                        }
                                    }
                                    val dateText = formatIsoDate(rev.createdAt)
                                    if (dateText.isNotBlank()) {
                                        Text("· $dateText", fontSize = 11.sp, color = TextMuted)
                                    }
                                }
                            }
                        }

                        if (!rev.comment.isNullOrBlank()) {
                            Text(rev.comment, fontSize = 13.sp, color = TextPrimary, lineHeight = 19.sp)
                        }

                        rev.responses.orEmpty().forEach { resp ->
                            if (!resp.responseContent.isNullOrBlank()) {
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = Background,
                                    border = BorderStroke(1.dp, BorderLight)
                                ) {
                                    Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
                                        Text(
                                            "Phản hồi từ ${resp.responderName ?: hospital.name}",
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = HospitalEmerald
                                        )
                                        Spacer(Modifier.height(3.dp))
                                        Text(resp.responseContent, fontSize = 12.sp, color = TextSecondary, lineHeight = 17.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// =========================================================================
// REUSABLE BUILDING BLOCKS
// =========================================================================
@Composable
private fun SectionCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), content = content)
    }
}

@Composable
private fun SectionHeading(
    icon: ImageVector,
    title: String,
    subtitle: String,
    iconBg: Color = HospitalEmeraldLight,
    iconTint: Color = HospitalEmerald
) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .background(iconBg, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = TextPrimary)
            Text(subtitle, fontSize = 11.5.sp, color = TextSecondary)
        }
    }
}

@Composable
private fun InfoFieldBox(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    bgColor: Color = Background,
    borderColor: Color = BorderLight,
    labelColor: Color = TextMuted,
    valueColor: Color = TextPrimary,
    mono: Boolean = false,
    trailingIcon: ImageVector? = null,
    onClick: (() -> Unit)? = null
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .let { if (onClick != null) it.clickable { onClick() } else it },
        shape = RoundedCornerShape(14.dp),
        color = bgColor,
        border = BorderStroke(1.dp, borderColor)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    label,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = labelColor,
                    letterSpacing = 0.4.sp
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    value,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = valueColor,
                    fontFamily = if (mono) FontFamily.Monospace else FontFamily.Default,
                    lineHeight = 18.sp
                )
            }
            trailingIcon?.let {
                Icon(it, contentDescription = null, tint = valueColor, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun EmptyTabState(
    icon: ImageVector,
    title: String,
    subtitle: String
) {
    SectionCard {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 24.dp, horizontal = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .background(Color(0xFFF1F5F9), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = TextMuted, modifier = Modifier.size(26.dp))
            }
            Spacer(Modifier.height(12.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
            Spacer(Modifier.height(4.dp))
            Text(subtitle, fontSize = 12.sp, color = TextSecondary, textAlign = TextAlign.Center)
        }
    }
}
