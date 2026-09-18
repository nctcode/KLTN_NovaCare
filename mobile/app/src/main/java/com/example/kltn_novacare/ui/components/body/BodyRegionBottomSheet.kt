package com.example.kltn_novacare.ui.components.body

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.BodyRegionCode
import com.example.kltn_novacare.data.model.RegionGroup

/**
 * Bottom sheet fallback: grouped list of all body regions.
 * Shares the same [selectedRegions] state as the 3D canvas — synced bidirectionally.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BodyRegionBottomSheet(
    selectedRegions: Set<BodyRegionCode>,
    onToggle: (BodyRegionCode) -> Unit,
    onDismiss: () -> Unit
) {
    val primaryGreen = Color(0xFF0C4B39)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color.White,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 24.dp)
        ) {
            // Handle + title
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "Chọn vùng cơ thể",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 15.sp,
                    color = Color(0xFF0F172A)
                )
            }

            HorizontalDivider(color = Color(0xFFE2E8F0))
            Spacer(Modifier.height(12.dp))

            // Group by RegionGroup
            val grouped = RegionGroup.entries.map { group ->
                group to BodyRegionCode.entries.filter { it.group == group }
            }

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.heightIn(max = 480.dp)
            ) {
                grouped.forEach { (group, regions) ->
                    item {
                        Text(
                            group.label,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF64748B),
                            modifier = Modifier.padding(top = 10.dp, bottom = 4.dp)
                        )
                    }
                    items(regions) { region ->
                        val isSelected = region in selectedRegions
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onToggle(region) },
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) Color(0xFFDCFCE7) else Color(0xFFF8FAFC),
                            border = BorderStroke(
                                1.dp,
                                if (isSelected) primaryGreen else Color(0xFFCBD5E1)
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    region.displayName,
                                    fontSize = 13.sp,
                                    fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
                                    color = if (isSelected) primaryGreen else Color(0xFF0F172A)
                                )
                                if (isSelected) {
                                    Icon(
                                        Icons.Default.Check,
                                        contentDescription = null,
                                        tint = primaryGreen,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))
            Button(
                onClick = onDismiss,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = primaryGreen),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(
                    "Xong — Đã chọn ${selectedRegions.size} vùng",
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp
                )
            }
        }
    }
}
