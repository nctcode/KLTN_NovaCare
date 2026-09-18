package com.example.kltn_novacare.ui.components.body

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun BodyViewControls(
    isFrontView: Boolean,
    onFront: () -> Unit,
    onBack: () -> Unit,
    onReset: () -> Unit,
    modifier: Modifier = Modifier
) {
    val primaryGreen = Color(0xFF0C4B39)

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Button(
            onClick = onFront,
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isFrontView) primaryGreen else Color(0xFFE2E8F0),
                contentColor   = if (isFrontView) Color.White   else Color(0xFF475569)
            ),
            shape = RoundedCornerShape(12.dp),
            contentPadding = PaddingValues(vertical = 10.dp)
        ) {
            Text("👤 Mặt Trước", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
        }

        Button(
            onClick = onBack,
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (!isFrontView) primaryGreen else Color(0xFFE2E8F0),
                contentColor   = if (!isFrontView) Color.White  else Color(0xFF475569)
            ),
            shape = RoundedCornerShape(12.dp),
            contentPadding = PaddingValues(vertical = 10.dp)
        ) {
            Text("🔄 Mặt Sau", fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
        }

        IconButton(
            onClick = onReset,
            modifier = Modifier
                .size(42.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = Color(0xFFE2E8F0),
                modifier = Modifier.fillMaxSize()
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = "Reset về mặt trước",
                        tint = primaryGreen,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
