package com.example.kltn_novacare.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.data.model.BodyRegion
import com.example.kltn_novacare.data.model.BodyRegionCode
import com.example.kltn_novacare.data.model.BodyRegionMapper
import com.example.kltn_novacare.ui.components.body.*

/**
 * Public composable consumed by [PreExamScreeningScreen].
 *
 * Bridges the existing [BodyRegion] data-class state in [PreExamViewModel]
 * with the new [BodyRegionCode] enum used internally by [BodyCanvas].
 *
 * Handles:
 *  - Front / Back view switching
 *  - Interactive 3D canvas rendering with tap → glow → multi-select
 *  - Horizontal chip strip of selected regions (with × remove)
 *  - "Chọn từ danh sách" button → BodyRegionBottomSheet fallback
 *  - Both selection paths share the same Set<BodyRegionCode> state
 *  - Converts BodyRegionCode ↔ BodyRegion for ViewModel compatibility
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Body3DView(
    // Legacy BodyRegion set from ViewModel
    selectedRegions: Set<BodyRegion>,
    onRegionSelected: (BodyRegion) -> Unit,
    onClearAll: () -> Unit,
    modifier: Modifier = Modifier
) {
    val primaryGreen = Color(0xFF0C4B39)

    // Map incoming BodyRegion → BodyRegionCode for internal canvas usage
    val selectedCodes: Set<BodyRegionCode> = remember(selectedRegions) {
        selectedRegions.mapNotNull { BodyRegionCode.fromBodyRegion(it) }.toSet()
    }

    var isFrontView by remember { mutableStateOf(true) }
    var showBottomSheet by remember { mutableStateOf(false) }

    // Helper: toggle by BodyRegionCode → convert back to BodyRegion for ViewModel
    val onCodeToggled: (BodyRegionCode) -> Unit = { code ->
        // Find matching BodyRegion in mapper or create one
        val region = BodyRegionMapper.allRegions.firstOrNull {
            it.id.equals(code.code, ignoreCase = true) ||
            it.displayName.equals(code.displayName, ignoreCase = true)
        } ?: BodyRegion(
            id          = code.code.lowercase(),
            name        = code.displayName,
            displayName = code.displayName,
            side        = code.side.lowercase(),
            category    = code.group.name.lowercase()
        )
        onRegionSelected(region)
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // ── 1. Front / Back / Reset controls ──────────────────
        BodyViewControls(
            isFrontView = isFrontView,
            onFront  = { isFrontView = true },
            onBack   = { isFrontView = false },
            onReset  = { isFrontView = true }
        )

        // ── 2. 3D Canvas card ─────────────────────────────────
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(20.dp),
            border = BorderStroke(1.dp, Color(0xFFCBD5E1)),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // View label
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isFrontView) "🧍 Mặt Trước (Anterior)"
                               else "🧍‍♂️ Mặt Sau (Posterior)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF64748B)
                    )
                    if (selectedCodes.isNotEmpty()) {
                        Surface(
                            color = Color(0xFFDCFCE7),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                "${selectedCodes.size} vùng đã chọn",
                                color = primaryGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                            )
                        }
                    }
                }

                // THE INTERACTIVE BODY CANVAS
                BodyCanvas(
                    selectedRegions  = selectedCodes,
                    isFrontView      = isFrontView,
                    onRegionToggled  = onCodeToggled,
                    canvasHeight     = 340.dp
                )

                // Zoom hint
                Text(
                    "🔍 Chụm 2 ngón để Zoom • Chạm vùng để chọn",
                    fontSize = 10.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // ── 3. Selected region chips ──────────────────────────
        SelectedRegionChips(
            selectedRegions = selectedCodes,
            onRemove = { code -> onCodeToggled(code) },
            onClearAll = onClearAll
        )

        // ── 4. Fallback "Chọn từ danh sách" button ───────────
        OutlinedButton(
            onClick = { showBottomSheet = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = primaryGreen),
            border = BorderStroke(1.5.dp, primaryGreen),
            shape = RoundedCornerShape(14.dp),
            contentPadding = PaddingValues(vertical = 12.dp)
        ) {
            Text(
                "☰  Chọn vùng từ danh sách",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 13.sp,
                color = primaryGreen
            )
        }
    }

    // ── 5. Bottom sheet fallback ──────────────────────────────
    if (showBottomSheet) {
        BodyRegionBottomSheet(
            selectedRegions = selectedCodes,
            onToggle = { code -> onCodeToggled(code) },
            onDismiss = { showBottomSheet = false }
        )
    }
}
