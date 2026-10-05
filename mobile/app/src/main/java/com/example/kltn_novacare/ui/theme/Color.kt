package com.example.kltn_novacare.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// ==========================================
// NOVACARE BRAND GREEN DESIGN SYSTEM
// ==========================================
val Primary = Color(0xFF00A86B) // Signature NovaCare Emerald Green (Chuyên nghiệp, dịu mắt, y tế hiện đại)
val PrimaryDark = Color(0xFF008755) // Màu xanh đậm cho text quan trọng & nút hover/pressed
val PrimaryLight = Color(0xFFECFDF5) // Nền xanh nhạt cho badge, highlight, card surface
val PrimarySubtle = Color(0xFFD1FAE5) // Border xanh nhạt
val PrimaryBorder = Color(0xFFA7F3D0)

val Secondary = Color(0xFF0F172A) // Slate-900: Đen than cao cấp thay cho đen thuần
val Background = Color(0xFFF8FAFC) // Slate-50: Nền xám trắng sạch sẽ, hiện đại
val Surface = Color(0xFFFFFFFF) // Trắng tinh khiết cho Card

// Header Gradients
val HeaderGreenDark = Color(0xFF064E3B) // Xanh rêu y tế cao cấp
val HeaderGreenMid = Color(0xFF047857) // Xanh ngọc lục bảo
val HeaderGreenGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFF064E3B), Color(0xFF065F46))
)

// Neutral Text Hierarchy
val TextPrimary = Color(0xFF0F172A) // Tiêu đề, chữ chính
val TextSecondary = Color(0xFF475569) // Phụ đề, mô tả
val TextMuted = Color(0xFF94A3B8) // Placeholder, icon mờ
val TextLight = Color(0xFFFFFFFF) // Chữ trên nền xanh

// Borders & Dividers
val Border = Color(0xFFE2E8F0) // Viền card chuẩn (Slate-200)
val BorderLight = Color(0xFFF1F5F9) // Đường kẻ mờ (Slate-100)

// Medical Status Colors (Soft Badges)
val StatusSuccessBg = Color(0xFFDEF7EC)
val StatusSuccessText = Color(0xFF03543F)

val StatusWarningBg = Color(0xFFFEF3C7)
val StatusWarningText = Color(0xFF92400E)

val StatusErrorBg = Color(0xFFFEE2E2)
val StatusErrorText = Color(0xFFB91C1C)

val StatusInfoBg = Color(0xFFE0F2FE)
val StatusInfoText = Color(0xFF0369A1)

// Legacy Aliases for Backward Compatibility
val PrimaryAccent = Color(0xFF00C875)
val Success = Color(0xFF10B981)
val Warning = Color(0xFFF59E0B)
val Danger = Color(0xFFEF4444)
val Info = Color(0xFF3B82F6)
val NovaCareGreen = Primary
val NovaCareGreenDark = PrimaryDark
val NovaCareGreenLight = PrimaryLight
val NovaCareGreenBorder = PrimaryBorder
val NovaCareGreenSubtle = Color(0xFFE8F5E9)
val NovaCareOrangeFab = Color(0xFFF97316)
val MedproTextDark = TextPrimary
val MedproSubText = TextSecondary