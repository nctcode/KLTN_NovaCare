package com.example.kltn_novacare.ui.components.body

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.BodyRegionCode

@Composable
fun SelectedRegionChips(
    selectedRegions: Set<BodyRegionCode>,
    onRemove: (BodyRegionCode) -> Unit,
    onClearAll: () -> Unit,
    modifier: Modifier = Modifier
) {
    val primaryGreen = Color(0xFF0C4B39)

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // Header row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (selectedRegions.isEmpty()) "Vùng đã chọn"
                       else "Vùng đã chọn (${selectedRegions.size})",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 13.sp,
                color = Color(0xFF0F172A)
            )
            if (selectedRegions.isNotEmpty()) {
                TextButton(
                    onClick = onClearAll,
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
                ) {
                    Text(
                        "Xóa tất cả",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        if (selectedRegions.isEmpty()) {
            Text(
                text = "Chưa có vùng nào được chọn. Hãy chạm vào hình thân người ở trên.",
                fontSize = 11.sp,
                color = Color(0xFF94A3B8),
                modifier = Modifier.padding(bottom = 4.dp)
            )
        } else {
            // Horizontal scrollable chip strip
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                contentPadding = PaddingValues(vertical = 2.dp)
            ) {
                items(selectedRegions.toList()) { region ->
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFFDCFCE7),
                        border = BorderStroke(1.dp, primaryGreen)
                    ) {
                        Row(
                            modifier = Modifier.padding(start = 10.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "✓ ${region.displayName}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = primaryGreen
                            )
                            Spacer(Modifier.width(4.dp))
                            IconButton(
                                onClick = { onRemove(region) },
                                modifier = Modifier.size(18.dp)
                            ) {
                                Icon(
                                    Icons.Default.Close,
                                    contentDescription = "Bỏ chọn ${region.displayName}",
                                    tint = primaryGreen,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
