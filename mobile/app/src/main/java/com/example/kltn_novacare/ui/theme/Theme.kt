package com.example.kltn_novacare.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = Primary,
    secondary = Secondary,
    background = Secondary,
    surface = Secondary,
    onPrimary = Surface,
    onSecondary = Surface
)

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    secondary = Secondary,
    background = Background,
    surface = Surface,
    onPrimary = Surface,
    onSecondary = Surface,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun KLTN_NovaCareTheme(
    darkTheme: Boolean = false, // Luôn hiển thị Light Theme cao cấp để đồng bộ với Web
    dynamicColor: Boolean = false, // Không dùng dynamicColor để giữ bảng màu thương hiệu nhất quán
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}