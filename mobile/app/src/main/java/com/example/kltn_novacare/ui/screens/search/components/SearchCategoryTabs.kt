package com.example.kltn_novacare.ui.screens.search.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Tune
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
import com.example.kltn_novacare.data.model.SearchCategory
import com.example.kltn_novacare.ui.theme.*

@Composable
fun SearchCategoryTabs(
    selectedCategory: SearchCategory,
    onCategorySelected: (SearchCategory) -> Unit,
    activeFilterCount: Int,
    onFilterClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    val categories = listOf(
        SearchCategory.ALL,
        SearchCategory.DOCTOR,
        SearchCategory.HOSPITAL,
        SearchCategory.CLINIC,
        SearchCategory.SPECIALTY
    )

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        // Filter Button with Badge
        Box(
            modifier = Modifier
                .height(36.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(if (activeFilterCount > 0) PrimaryLight else Surface)
                .border(
                    width = 1.dp,
                    color = if (activeFilterCount > 0) Primary else Border,
                    shape = RoundedCornerShape(18.dp)
                )
                .clickable { onFilterClick() }
                .padding(horizontal = 12.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Tune,
                    contentDescription = "Bộ lọc",
                    tint = if (activeFilterCount > 0) PrimaryDark else TextSecondary,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Bộ lọc",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (activeFilterCount > 0) PrimaryDark else TextSecondary
                )
                if (activeFilterCount > 0) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .size(18.dp)
                            .clip(CircleShape)
                            .background(Primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = activeFilterCount.toString(),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        // Category Pills
        categories.forEach { cat ->
            val isSelected = cat == selectedCategory
            Box(
                modifier = Modifier
                    .height(36.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(if (isSelected) PrimaryLight else Surface)
                    .border(
                        width = 1.dp,
                        color = if (isSelected) PrimaryBorder else Border,
                        shape = RoundedCornerShape(18.dp)
                    )
                    .clickable { onCategorySelected(cat) }
                    .padding(horizontal = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = cat.label,
                    fontSize = 13.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                    color = if (isSelected) PrimaryDark else TextSecondary
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }
    }
}
