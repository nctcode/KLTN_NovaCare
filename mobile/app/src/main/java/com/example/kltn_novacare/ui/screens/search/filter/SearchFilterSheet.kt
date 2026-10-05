package com.example.kltn_novacare.ui.screens.search.filter

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.LocationDivision
import com.example.kltn_novacare.data.model.SearchFilters
import com.example.kltn_novacare.data.model.Specialty
import com.example.kltn_novacare.ui.screens.search.location.UserLocationState
import com.example.kltn_novacare.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchFilterSheet(
    isVisible: Boolean,
    filters: SearchFilters,
    locations: List<LocationDivision>,
    specialties: List<Specialty>,
    locationState: UserLocationState,
    onDismiss: () -> Unit,
    onUpdateFilters: ((SearchFilters) -> SearchFilters) -> Unit,
    onRequestNearMe: () -> Unit,
    onApply: () -> Unit,
    onReset: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (!isVisible) return

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var showLocationPickerDialog by remember { mutableStateOf(false) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Surface,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 10.dp)
                    .width(40.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color(0xFFCBD5E1))
            )
        },
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.88f)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
            ) {
                Text(
                    text = "Bộ lọc tìm kiếm",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = TextSecondary
                    )
                }
            }

            HorizontalDivider(color = Color(0xFFE2E8F0))

            // Body
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                // SECTION 1: ĐỊA ĐIỂM
                Text(
                    text = "Địa điểm",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(10.dp))

                // Option: Gần nhất (Near Me)
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (filters.isNearMe) PrimaryLight else Surface
                    ),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(if (filters.isNearMe) Primary else Border)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onRequestNearMe() }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(14.dp)
                    ) {
                        RadioButton(
                            selected = filters.isNearMe,
                            onClick = { onRequestNearMe() },
                            colors = RadioButtonDefaults.colors(selectedColor = Primary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Gần nhất (Vị trí hiện tại)",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Sắp xếp theo khoảng cách từ thiết bị của bạn",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }
                        if (locationState is UserLocationState.Locating) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = Primary
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.MyLocation,
                                contentDescription = null,
                                tint = if (filters.isNearMe) Primary else TextMuted,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Option: Chọn khu vực (Province / District)
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (!filters.isNearMe && (!filters.province.isNullOrBlank() || !filters.district.isNullOrBlank())) PrimaryLight else Surface
                    ),
                    border = CardDefaults.outlinedCardBorder().copy(
                        brush = androidx.compose.ui.graphics.SolidColor(
                            if (!filters.isNearMe && (!filters.province.isNullOrBlank() || !filters.district.isNullOrBlank())) Primary else Border
                        )
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showLocationPickerDialog = true }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(14.dp)
                    ) {
                        RadioButton(
                            selected = !filters.isNearMe && (!filters.province.isNullOrBlank() || !filters.district.isNullOrBlank()),
                            onClick = { showLocationPickerDialog = true },
                            colors = RadioButtonDefaults.colors(selectedColor = Primary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Chọn theo khu vực",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextPrimary
                            )
                            val locationText = when {
                                !filters.district.isNullOrBlank() && !filters.province.isNullOrBlank() ->
                                    "${filters.district}, ${filters.province}"
                                !filters.province.isNullOrBlank() -> filters.province!!
                                else -> "Tất cả tỉnh / thành"
                            }
                            Text(
                                text = locationText,
                                fontSize = 12.sp,
                                color = if (!filters.isNearMe && !filters.province.isNullOrBlank()) PrimaryDark else TextMuted
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = TextMuted,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // SECTION 2: LOẠI NƠI KHÁM
                Text(
                    text = "Loại nơi khám",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(10.dp))

                val placeTypes = listOf("Tất cả", "Bác sĩ", "Bệnh viện", "Phòng khám")
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    placeTypes.forEach { pt ->
                        val isSelected = if (pt == "Tất cả") filters.placeType.isNullOrBlank() else filters.placeType == pt
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                onUpdateFilters { cur ->
                                    cur.copy(placeType = if (pt == "Tất cả") null else pt)
                                }
                            },
                            label = {
                                Text(
                                    text = pt,
                                    fontSize = 13.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryLight,
                                selectedLabelColor = PrimaryDark
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSelected,
                                borderColor = Border,
                                selectedBorderColor = Primary
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // SECTION 3: DỊCH VỤ Y TẾ
                Text(
                    text = "Dịch vụ y tế",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(10.dp))

                val serviceOptions = listOf(
                    "KhamBenh" to "Khám trực tiếp",
                    "TuVanTuXa" to "Tư vấn từ xa (Online)",
                    "GoiKham" to "Gói khám sức khỏe"
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    serviceOptions.forEach { (key, label) ->
                        val isSelected = filters.selectedServices.contains(key)
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                onUpdateFilters { cur ->
                                    val updated = if (isSelected) cur.selectedServices - key else cur.selectedServices + key
                                    cur.copy(selectedServices = updated)
                                }
                            },
                            label = {
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            leadingIcon = if (isSelected) {
                                {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = PrimaryDark,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            } else null,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryLight,
                                selectedLabelColor = PrimaryDark
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                enabled = true,
                                selected = isSelected,
                                borderColor = Border,
                                selectedBorderColor = Primary
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // SECTION 4: CHUYÊN KHOA
                if (specialties.isNotEmpty()) {
                    Text(
                        text = "Chuyên khoa",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    // Wrapping chips
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        specialties.forEach { spec ->
                            val isSelected = filters.selectedSpecialtyIds.contains(spec.id)
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    onUpdateFilters { cur ->
                                        val updated = if (isSelected) {
                                            cur.selectedSpecialtyIds - spec.id
                                        } else {
                                            cur.selectedSpecialtyIds + spec.id
                                        }
                                        cur.copy(selectedSpecialtyIds = updated)
                                    }
                                },
                                label = {
                                    Text(
                                        text = "${spec.icon ?: ""} ${spec.name}",
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = PrimaryLight,
                                    selectedLabelColor = PrimaryDark
                                ),
                                border = FilterChipDefaults.filterChipBorder(
                                    enabled = true,
                                    selected = isSelected,
                                    borderColor = Border,
                                    selectedBorderColor = Primary
                                ),
                                shape = RoundedCornerShape(16.dp)
                            )
                        }
                    }
                }
            }

            HorizontalDivider(color = Color(0xFFE2E8F0))

            // Sticky Footer
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onReset,
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Border),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    Text(
                        text = "Thiết lập lại",
                        color = TextSecondary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Button(
                    onClick = onApply,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    val active = filters.activeCount
                    Text(
                        text = if (active > 0) "Áp dụng ($active)" else "Áp dụng",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }

    // Location Hierarchy Picker Dialog
    if (showLocationPickerDialog) {
        LocationHierarchyDialog(
            locations = locations,
            currentProvince = filters.province,
            currentDistrict = filters.district,
            onDismiss = { showLocationPickerDialog = false },
            onSelectLocation = { prov, dist ->
                onUpdateFilters { cur ->
                    cur.copy(
                        isNearMe = false,
                        province = prov,
                        district = dist,
                        userLat = null,
                        userLng = null
                    )
                }
                showLocationPickerDialog = false
            }
        )
    }
}

@Composable
fun LocationHierarchyDialog(
    locations: List<LocationDivision>,
    currentProvince: String?,
    currentDistrict: String?,
    onDismiss: () -> Unit,
    onSelectLocation: (province: String?, district: String?) -> Unit
) {
    var selectedProvince by remember { mutableStateOf(currentProvince) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Chọn khu vực",
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp)
            ) {
                // Clear selection option
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectLocation(null, null) }
                        .padding(vertical = 10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Public,
                        contentDescription = null,
                        tint = Primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Toàn quốc (Không lọc khu vực)",
                        fontSize = 14.sp,
                        fontWeight = if (currentProvince.isNullOrBlank()) FontWeight.Bold else FontWeight.Normal,
                        color = if (currentProvince.isNullOrBlank()) Primary else TextPrimary
                    )
                }

                HorizontalDivider(color = Color(0xFFE2E8F0))

                LazyColumn(modifier = Modifier.weight(1f)) {
                    locations.forEach { loc ->
                        item {
                            val isProvSelected = selectedProvince == loc.province
                            Column {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            if (selectedProvince == loc.province) {
                                                // If already selected, tap selects this province with all districts
                                                onSelectLocation(loc.province, null)
                                            } else {
                                                selectedProvince = loc.province
                                            }
                                        }
                                        .padding(vertical = 12.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocationCity,
                                        contentDescription = null,
                                        tint = if (isProvSelected) Primary else TextMuted,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(
                                        text = loc.province,
                                        fontSize = 14.sp,
                                        fontWeight = if (isProvSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isProvSelected) PrimaryDark else TextPrimary,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Icon(
                                        imageVector = if (isProvSelected) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                        contentDescription = null,
                                        tint = TextMuted,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }

                                // If province expanded, show districts
                                if (isProvSelected) {
                                    Column(modifier = Modifier.padding(start = 28.dp, bottom = 8.dp)) {
                                        // "Tất cả quận/huyện" item
                                        Text(
                                            text = "Tất cả ${loc.province}",
                                            fontSize = 13.sp,
                                            fontWeight = if (currentDistrict.isNullOrBlank()) FontWeight.Bold else FontWeight.Normal,
                                            color = if (currentDistrict.isNullOrBlank()) Primary else TextSecondary,
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable { onSelectLocation(loc.province, null) }
                                                .padding(vertical = 8.dp)
                                        )

                                        loc.districts.forEach { dist ->
                                            val isDistSelected = currentDistrict == dist
                                            Text(
                                                text = dist,
                                                fontSize = 13.sp,
                                                fontWeight = if (isDistSelected) FontWeight.Bold else FontWeight.Normal,
                                                color = if (isDistSelected) Primary else TextSecondary,
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clickable { onSelectLocation(loc.province, dist) }
                                                    .padding(vertical = 8.dp)
                                            )
                                        }
                                    }
                                }
                                HorizontalDivider(color = Color(0xFFF1F5F9))
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(text = "Đóng", color = Primary)
            }
        }
    )
}
