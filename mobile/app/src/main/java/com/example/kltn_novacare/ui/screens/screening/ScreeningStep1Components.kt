package com.example.kltn_novacare.ui.screens.screening

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.HealthAndSafety
import androidx.compose.material.icons.outlined.LocalHospital
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.Hospital
import com.example.kltn_novacare.data.model.ScreeningRegion
import com.example.kltn_novacare.ui.theme.*

// ==============================================================================
// STEP 1 - COMPONENT 1: PATIENT INFO CARD
// ==============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientInfoCard(
    age: String,
    onAgeChange: (String) -> Unit,
    hospitalId: String?,
    hospitals: List<Hospital>,
    onSelectHospital: (String?) -> Unit,
    modifier: Modifier = Modifier
) {
    var hospitalDropdownOpen by remember { mutableStateOf(false) }
    val selectedHospitalName = hospitals.find { it.id == hospitalId }?.name ?: "Tất cả cơ sở (hoặc chọn sau)"

    ScreeningSectionCard(
        title = "Thông tin cơ bản",
        subtitle = "Dùng tuổi thực tế của người có triệu chứng để AI định hướng chuẩn xác.",
        icon = Icons.Outlined.Person,
        modifier = modifier
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Tuổi
            OutlinedTextField(
                value = age,
                onValueChange = onAgeChange,
                label = { Text("Số tuổi của người khám") },
                placeholder = { Text("Ví dụ: 35") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    focusedLabelColor = PrimaryDark,
                    cursorColor = Primary
                ),
                modifier = Modifier.fillMaxWidth()
            )

            // Chọn cơ sở y tế
            ExposedDropdownMenuBox(
                expanded = hospitalDropdownOpen,
                onExpandedChange = { hospitalDropdownOpen = it },
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = selectedHospitalName,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Cơ sở y tế mong muốn (tùy chọn)") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = hospitalDropdownOpen) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Outlined.LocalHospital,
                            contentDescription = null,
                            tint = if (hospitalId != null) PrimaryDark else TextMuted,
                            modifier = Modifier.size(20.dp)
                        )
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary,
                        focusedLabelColor = PrimaryDark,
                        cursorColor = Primary
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor()
                )

                ExposedDropdownMenu(
                    expanded = hospitalDropdownOpen,
                    onDismissRequest = { hospitalDropdownOpen = false }
                ) {
                    DropdownMenuItem(
                        text = {
                            Text(
                                "Chọn cơ sở sau (không giới hạn)",
                                fontWeight = if (hospitalId == null) FontWeight.Bold else FontWeight.Normal,
                                color = if (hospitalId == null) PrimaryDark else TextPrimary
                            )
                        },
                        onClick = {
                            onSelectHospital(null)
                            hospitalDropdownOpen = false
                        }
                    )
                    HorizontalDivider()
                    hospitals.forEach { h ->
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = h.name,
                                    fontWeight = if (h.id == hospitalId) FontWeight.Bold else FontWeight.Normal,
                                    color = if (h.id == hospitalId) PrimaryDark else TextPrimary
                                )
                            },
                            onClick = {
                                onSelectHospital(h.id)
                                hospitalDropdownOpen = false
                            }
                        )
                    }
                }
            }
        }
    }
}

// ==============================================================================
// STEP 1 - COMPONENT 2: BODY REGION SELECTOR CARD
// ==============================================================================
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun BodyRegionSelectorCard(
    catalogRegions: List<ScreeningRegion>,
    selectedRegions: Set<String>,
    onToggleRegion: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategoryIndex by remember { mutableIntStateOf(0) }

    val categories = listOf("Tất cả", "Đầu & Mặt", "Cổ & Vai", "Ngực & Lưng", "Bụng & Hông", "Tay", "Chân", "Khác")

    // Filter regions by search and category
    val filteredRegions = remember(catalogRegions, searchQuery, selectedCategoryIndex) {
        catalogRegions.filter { region ->
            val matchesQuery = searchQuery.isBlank() || region.name.contains(searchQuery.trim(), ignoreCase = true)
            val matchesCategory = when (selectedCategoryIndex) {
                1 -> region.name.contains("đầu", true) || region.name.contains("mặt", true) || region.name.contains("mắt", true) || region.name.contains("tai", true) || region.name.contains("mũi", true) || region.name.contains("họng", true)
                2 -> region.name.contains("cổ", true) || region.name.contains("vai", true) || region.name.contains("gáy", true)
                3 -> region.name.contains("ngực", true) || region.name.contains("lưng", true) || region.name.contains("sườn", true) || region.name.contains("cột sống", true)
                4 -> region.name.contains("bụng", true) || region.name.contains("hông", true) || region.name.contains("dạ dày", true) || region.name.contains("eo", true)
                5 -> region.name.contains("tay", true) || region.name.contains("khuỷu", true) || region.name.contains("cánh", true) || region.name.contains("cổ tay", true) || region.name.contains("bàn tay", true)
                6 -> region.name.contains("chân", true) || region.name.contains("gối", true) || region.name.contains("đùi", true) || region.name.contains("cổ chân", true) || region.name.contains("bàn chân", true)
                7 -> true
                else -> true
            }
            matchesQuery && matchesCategory
        }
    }

    ScreeningSectionCard(
        title = "1. Vị trí khó chịu / tổn thương",
        subtitle = "Có thể chọn nhiều vị trí (tối đa 10 vùng). Trái/phải tính theo cơ thể của bạn.",
        icon = Icons.Outlined.HealthAndSafety,
        badgeText = "${selectedRegions.size}/10 đã chọn",
        badgeColor = if (selectedRegions.isNotEmpty()) PrimaryDark else TextMuted,
        modifier = modifier
    ) {
        // Selected chips row with remove button
        AnimatedVisibility(visible = selectedRegions.isNotEmpty(), enter = fadeIn(), exit = fadeOut()) {
            Column(modifier = Modifier.padding(bottom = 6.dp)) {
                Text(
                    text = "Vùng đã chọn:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryDark
                )
                Spacer(modifier = Modifier.height(6.dp))
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val selectedObjects = catalogRegions.filter { it.id in selectedRegions }
                    selectedObjects.forEach { region ->
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = PrimaryLight,
                            border = BorderStroke(1.dp, PrimaryBorder),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(start = 10.dp, end = 6.dp)
                            ) {
                                Text(
                                    text = region.name,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = PrimaryDark
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clip(CircleShape)
                                        .clickable { onToggleRegion(region.id) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Bỏ chọn",
                                        tint = PrimaryDark,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Tìm nhanh: đầu, gối, ngực, lưng...") },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(20.dp)
                )
            },
            trailingIcon = {
                if (searchQuery.isNotBlank()) {
                    IconButton(onClick = { searchQuery = "" }) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Xóa tìm kiếm",
                            tint = TextMuted,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary,
                cursorColor = Primary
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Category Filter Chips
        if (searchQuery.isBlank()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                categories.forEachIndexed { idx, cat ->
                    FilterChip(
                        selected = selectedCategoryIndex == idx,
                        onClick = { selectedCategoryIndex = idx },
                        label = { Text(cat, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Primary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        // Region items
        if (filteredRegions.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Không tìm thấy vùng phù hợp với từ khóa.",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            }
        } else {
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                filteredRegions.forEach { region ->
                    val isSelected = region.id in selectedRegions
                    FilterChip(
                        selected = isSelected,
                        onClick = { onToggleRegion(region.id) },
                        label = {
                            Text(
                                text = region.name,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        },
                        leadingIcon = if (isSelected) {
                            {
                                Icon(
                                    imageVector = Icons.Outlined.CheckCircle,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = PrimaryDark
                                )
                            }
                        } else null,
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryLight,
                            selectedLabelColor = PrimaryDark,
                            containerColor = Color(0xFFF8FAFC),
                            labelColor = TextPrimary
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = isSelected,
                            borderColor = BorderLight,
                            selectedBorderColor = Primary
                        ),
                        modifier = Modifier.heightIn(min = 44.dp)
                    )
                }
            }
        }
    }
}

// ==============================================================================
// STEP 1 - COMPONENT 3: SYMPTOM DESCRIPTION CARD
// ==============================================================================
@Composable
fun SymptomDescriptionCard(
    symptoms: String,
    onSymptomsChange: (String) -> Unit,
    onUrgentCheck: () -> Unit,
    hasSelectedRegions: Boolean,
    modifier: Modifier = Modifier
) {
    ScreeningSectionCard(
        title = "Mô tả triệu chứng cụ thể",
        subtitle = "Kể chi tiết cảm giác khó chịu, hoàn cảnh xuất hiện hoặc dấu hiệu đi kèm (tùy chọn).",
        modifier = modifier
    ) {
        OutlinedTextField(
            value = symptoms,
            onValueChange = onSymptomsChange,
            placeholder = { Text("Ví dụ: Đau âm ỉ từ sáng nay, tăng lên khi cử động hoặc ấn vào...") },
            minLines = 3,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary,
                cursorColor = Primary
            ),
            modifier = Modifier.fillMaxWidth()
        )

        if (hasSelectedRegions) {
            Surface(
                color = PrimaryLight.copy(alpha = 0.5f),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, PrimaryBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Cần kiểm tra cảnh báo gấp?",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryDark
                        )
                        Text(
                            text = "Đánh giá sơ bộ ngay không cần đợi trắc nghiệm.",
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }

                    TextButton(
                        onClick = onUrgentCheck,
                        colors = ButtonDefaults.textButtonColors(contentColor = PrimaryDark)
                    ) {
                        Text(
                            text = "Kiểm tra ngay",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }
        }
    }
}
