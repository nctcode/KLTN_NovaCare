package com.example.kltn_novacare.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.kltn_novacare.ui.theme.*

@Composable
fun AuthBackButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    IconButton(
        onClick = onClick,
        modifier = modifier
            .size(42.dp)
            .background(Surface, CircleShape)
            .border(1.dp, Border, CircleShape)
    ) {
        Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
            contentDescription = "Quay lại",
            tint = TextPrimary,
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
fun AuthBrandBadge(
    title: String = "NovaCare ID",
    modifier: Modifier = Modifier
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .background(PrimaryLight, RoundedCornerShape(20.dp))
            .border(1.dp, PrimaryBorder, RoundedCornerShape(20.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(7.dp)
                .background(Primary, CircleShape)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = title,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = PrimaryDark
        )
    }
}

@Composable
fun AuthStepIndicator(
    currentStep: Int,
    totalSteps: Int,
    stepLabels: List<String>,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            for (i in 1..totalSteps) {
                val isCompleted = i < currentStep
                val isActive = i == currentStep

                // Step Circle
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(
                            when {
                                isCompleted -> Primary
                                isActive -> Primary
                                else -> Color(0xFFE2E8F0)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (isCompleted) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    } else {
                        Text(
                            text = i.toString(),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isActive) Color.White else TextMuted
                        )
                    }
                }

                // Connecting Line
                if (i < totalSteps) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(3.dp)
                            .padding(horizontal = 6.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(
                                if (i < currentStep) Primary else Color(0xFFE2E8F0)
                            )
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Labels
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            stepLabels.forEachIndexed { index, label ->
                val stepNum = index + 1
                val isActiveOrDone = stepNum <= currentStep
                Text(
                    text = label,
                    fontSize = 11.sp,
                    fontWeight = if (stepNum == currentStep) FontWeight.Bold else FontWeight.Normal,
                    color = if (isActiveOrDone) PrimaryDark else TextMuted,
                    modifier = Modifier.weight(1f),
                    textAlign = when (index) {
                        0 -> TextAlign.Start
                        stepLabels.lastIndex -> TextAlign.End
                        else -> TextAlign.Center
                    }
                )
            }
        }
    }
}

@Composable
fun AuthHeroHeader(
    icon: ImageVector,
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(68.dp)
                .background(PrimaryLight, RoundedCornerShape(20.dp))
                .border(1.dp, PrimaryBorder, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = PrimaryDark,
                modifier = Modifier.size(34.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = title,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = Secondary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = subtitle,
            fontSize = 13.sp,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 19.sp,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
    }
}

@Composable
fun AuthErrorBanner(
    message: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(StatusErrorBg, RoundedCornerShape(12.dp))
            .border(1.dp, StatusErrorText.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Warning,
            contentDescription = null,
            tint = StatusErrorText,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = message,
            fontSize = 13.sp,
            color = StatusErrorText,
            lineHeight = 18.sp
        )
    }
}

@Composable
fun authTextFieldColors(): TextFieldColors {
    return OutlinedTextFieldDefaults.colors(
        focusedBorderColor = Primary,
        unfocusedBorderColor = Border,
        focusedLabelColor = PrimaryDark,
        unfocusedLabelColor = TextSecondary,
        focusedContainerColor = Surface,
        unfocusedContainerColor = Surface,
        focusedLeadingIconColor = Primary,
        unfocusedLeadingIconColor = TextMuted,
        focusedTrailingIconColor = PrimaryDark,
        unfocusedTrailingIconColor = TextMuted,
        cursorColor = Primary
    )
}
