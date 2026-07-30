package com.example.kltn_novacare.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val bodyAreas = listOf(
    "Đầu / Trán / Mặt",
    "Cổ / Vùng họng",
    "Vùng ngực / Tim",
    "Vùng bụng / Dạ dày",
    "Cánh tay / Bàn tay",
    "Đùi / Bắp chân",
    "Cột sống / Lưng",
    "Bả vai / Cổ vai gáy"
)

@Composable
fun BodyDiagramView(
    selectedAreas: Set<String>,
    onAreaToggle: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Text(
            text = "Vị trí đau hoặc bất thường (Chọn trên cơ thể):",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF1E293B),
            modifier = Modifier.padding(bottom = 8.dp)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.height(180.dp)
        ) {
            items(bodyAreas) { area ->
                val isSelected = selectedAreas.contains(area)
                val bgColor = if (isSelected) Color(0xFF0C4B39) else Color.White
                val textColor = if (isSelected) Color(0xFF66FF33) else Color(0xFF334155)
                val borderColor = if (isSelected) Color(0xFF0C4B39) else Color(0xFFCBD5E1)

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(bgColor, RoundedCornerShape(12.dp))
                        .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                        .clickable { onAreaToggle(area) }
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Text(
                        text = (if (isSelected) "✓ " else "") + area,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = textColor
                    )
                }
            }
        }
    }
}
