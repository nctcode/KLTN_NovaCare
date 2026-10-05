package com.example.kltn_novacare.ui.screens.search.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.SearchFilters
import com.example.kltn_novacare.data.model.Specialty
import com.example.kltn_novacare.ui.theme.*

@Composable
fun ActiveFilterChips(
    filters: SearchFilters,
    specialties: List<Specialty>,
    onRemoveChip: (type: String, id: String?) -> Unit,
    onClearAll: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (!filters.hasActiveFilters()) return

    val scrollState = rememberScrollState()

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 6.dp)
    ) {
        // Location Chip (Near Me or Region)
        if (filters.isNearMe) {
            RemovableChip(
                label = "Gần nhất",
                hasLocationIcon = true,
                onRemove = { onRemoveChip("LOCATION", null) }
            )
            Spacer(modifier = Modifier.width(8.dp))
        } else if (!filters.locationLabel.isNullOrBlank()) {
            RemovableChip(
                label = filters.locationLabel!!,
                hasLocationIcon = true,
                onRemove = { onRemoveChip("LOCATION", null) }
            )
            Spacer(modifier = Modifier.width(8.dp))
        }

        // Place Type Chip
        if (!filters.placeType.isNullOrBlank()) {
            RemovableChip(
                label = filters.placeType,
                onRemove = { onRemoveChip("PLACE_TYPE", null) }
            )
            Spacer(modifier = Modifier.width(8.dp))
        }

        // Specialty Chips
        filters.selectedSpecialtyIds.forEach { specId ->
            val specName = specialties.find { it.id == specId }?.name ?: "Chuyên khoa"
            RemovableChip(
                label = specName,
                onRemove = { onRemoveChip("SPECIALTY", specId) }
            )
            Spacer(modifier = Modifier.width(8.dp))
        }

        // Services Chips
        filters.selectedServices.forEach { serviceKey ->
            val serviceName = when (serviceKey) {
                "KhamBenh" -> "Khám trực tiếp"
                "TuVanTuXa" -> "Tư vấn từ xa"
                "GoiKham" -> "Gói khám sức khỏe"
                else -> serviceKey
            }
            RemovableChip(
                label = serviceName,
                onRemove = { onRemoveChip("SERVICE", serviceKey) }
            )
            Spacer(modifier = Modifier.width(8.dp))
        }

        // Clear All Chip
        Text(
            text = "Xóa tất cả",
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            color = Primary,
            modifier = Modifier
                .clickable { onClearAll() }
                .padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun RemovableChip(
    label: String,
    hasLocationIcon: Boolean = false,
    onRemove: () -> Unit
) {
    Box(
        modifier = Modifier
            .height(28.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(PrimaryLight)
            .border(1.dp, PrimaryBorder, RoundedCornerShape(14.dp))
            .padding(horizontal = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (hasLocationIcon) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(3.dp))
            }
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = PrimaryDark
            )
            Spacer(modifier = Modifier.width(4.dp))
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Remove",
                tint = PrimaryDark,
                modifier = Modifier
                    .size(13.dp)
                    .clickable { onRemove() }
            )
        }
    }
}
