package com.example.kltn_novacare.ui.screens.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.components.BottomNavigationBar
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.AppointmentViewModel
import com.example.kltn_novacare.ui.viewmodel.AuthViewModel
import com.example.kltn_novacare.ui.viewmodel.AuthState
import com.example.kltn_novacare.ui.viewmodel.DoctorViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    navController: NavController,
    doctorViewModel: DoctorViewModel,
    appointmentViewModel: AppointmentViewModel,
    authViewModel: AuthViewModel? = null
) {
    val specialtiesState by doctorViewModel.specialties.collectAsState()
    val hospitalsState by doctorViewModel.hospitals.collectAsState()
    val doctorsState by doctorViewModel.doctors.collectAsState()
    val unreadNotificationsCount by appointmentViewModel.unreadCount.collectAsState()

    val authState = authViewModel?.authState?.collectAsState()?.value
    val currentUser = (authState as? AuthState.Authenticated)?.user ?: authViewModel?.getCurrentUser()
    val displayName = currentUser?.fullName?.takeIf { it.isNotBlank() } ?: "Thành viên NovaCare"

    val initials = remember(displayName) {
        val parts = displayName.trim().split("\\s+".toRegex()).filter { it.isNotBlank() }
        when {
            parts.size >= 2 -> "${parts.first().take(1)}${parts.last().take(1)}".uppercase()
            parts.size == 1 -> parts[0].take(2).uppercase()
            else -> "NC"
        }
    }

    LaunchedEffect(Unit) {
        doctorViewModel.loadHomeData()
        appointmentViewModel.loadUnreadCount()
        authViewModel?.checkAuthStatus()
    }

    Scaffold(
        bottomBar = {
            BottomNavigationBar(navController = navController, currentRoute = Screen.Home.route)
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Background)
                .verticalScroll(rememberScrollState())
        ) {
            // ==========================================
            // 1. HEADER (Deep Emerald Healthcare Gradient)
            // ==========================================
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(HeaderGreenDark, HeaderGreenMid)
                        )
                    )
                    .padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 22.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // User Avatar & Greeting
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .background(Color.White.copy(alpha = 0.2f), CircleShape)
                                    .border(1.5.dp, Color.White.copy(alpha = 0.4f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(initials, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    "Xin chào,",
                                    color = Color.White.copy(alpha = 0.85f),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    displayName,
                                    color = Color.White,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 17.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        // Notification Icon with Soft Badge
                        Box {
                            IconButton(
                                onClick = { navController.navigate(Screen.Notifications.route) },
                                modifier = Modifier
                                    .size(42.dp)
                                    .background(Color.White.copy(alpha = 0.15f), CircleShape)
                            ) {
                                Icon(
                                    Icons.Outlined.Notifications,
                                    contentDescription = "Thông báo",
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            if (unreadNotificationsCount > 0) {
                                Badge(
                                    containerColor = Color(0xFFEF4444),
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .offset(x = 2.dp, y = (-2).dp)
                                ) {
                                    Text(
                                        text = if (unreadNotificationsCount > 9) "9+" else unreadNotificationsCount.toString(),
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Clean Pill Search Bar
                    Surface(
                        onClick = { navController.navigate(Screen.Search.route) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = Color.White,
                        shadowElevation = 4.dp
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 13.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Outlined.Search,
                                contentDescription = "Tìm kiếm",
                                tint = Primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                "Tìm bác sĩ, chuyên khoa, phòng khám...",
                                color = TextMuted,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Normal
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ==========================================
            // 2. HERO AI SCREENING BANNER
            // ==========================================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clickable { navController.navigate(Screen.PreExamScreening.route) },
                colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color(0xFF065F46), Color(0xFF047857), Color(0xFF059669))
                            )
                        )
                        .padding(18.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                color = Color.White.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(8.dp),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Icon(
                                        Icons.Outlined.AutoAwesome,
                                        contentDescription = null,
                                        tint = Color(0xFFFDE047),
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        "AI MEDICAL TECH",
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        letterSpacing = 0.5.sp
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            "Trợ Lý AI Sàng Lọc & Gợi Ý Khám",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold
                        )

                        Text(
                            "Đo nhịp tim PPG qua camera, phân tích ảnh tổn thương & triệu chứng để gợi ý chuyên khoa tối ưu nhất.",
                            color = Color(0xFFD1FAE5),
                            fontSize = 12.sp,
                            lineHeight = 17.sp,
                            modifier = Modifier.padding(top = 4.dp)
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = { navController.navigate(Screen.PreExamScreening.route) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color.White,
                                contentColor = Color(0xFF065F46)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                Icons.Outlined.AutoAwesome,
                                contentDescription = null,
                                tint = PrimaryDark,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                "Bắt Đầu Sàng Lọc Ngay",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = PrimaryDark
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ==========================================
            // 3. QUICK ACTIONS GRID (8 Balanced Items)
            // ==========================================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, BorderLight),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(vertical = 16.dp, horizontal = 12.dp)) {
                    // Row 1
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        QuickActionItem(
                            label = "Đặt khám\nbác sĩ",
                            icon = Icons.Outlined.PersonSearch,
                            tint = Color(0xFF059669),
                            bgTint = Color(0xFFECFDF5)
                        ) { navController.navigate(Screen.Search.route) }

                        QuickActionItem(
                            label = "Đặt khám\ncơ sở",
                            icon = Icons.Outlined.LocalHospital,
                            tint = Color(0xFF2563EB),
                            bgTint = Color(0xFFEFF6FF)
                        ) { navController.navigate(Screen.HospitalBooking.createRoute(null)) }

                        QuickActionItem(
                            label = "Khám phòng\nkhám",
                            icon = Icons.Outlined.Domain,
                            tint = Color(0xFF7C3AED),
                            bgTint = Color(0xFFF5F3FF)
                        ) { navController.navigate(Screen.HospitalBooking.createRoute(null)) }

                        QuickActionItem(
                            label = "AI sàng lọc\ntriệu chứng",
                            icon = Icons.Outlined.AutoAwesome,
                            tint = Color(0xFFD97706),
                            bgTint = Color(0xFFFEF3C7)
                        ) { navController.navigate(Screen.PreExamScreening.route) }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Row 2
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        QuickActionItem(
                            label = "Tư vấn\nchat",
                            icon = Icons.Outlined.Forum,
                            tint = Color(0xFF0891B2),
                            bgTint = Color(0xFFECFEFF)
                        ) { navController.navigate(Screen.Consultations.route) }

                        QuickActionItem(
                            label = "Gọi video\nbác sĩ",
                            icon = Icons.Outlined.Videocam,
                            tint = Color(0xFFDB2777),
                            bgTint = Color(0xFFFDF2F8)
                        ) { navController.navigate(Screen.Search.route) }

                        QuickActionItem(
                            label = "Hồ sơ\nsức khỏe",
                            icon = Icons.Outlined.FolderShared,
                            tint = Color(0xFF0D9488),
                            bgTint = Color(0xFFF0FDFA)
                        ) { navController.navigate(Screen.Profiles.route) }

                        QuickActionItem(
                            label = "Lịch hẹn\ncủa bạn",
                            icon = Icons.Outlined.CalendarMonth,
                            tint = Color(0xFFE11D48),
                            bgTint = Color(0xFFFFE4E6)
                        ) { navController.navigate(Screen.Appointments.route) }
                    }
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            // ==========================================
            // 4. SECTION: BÁC SĨ CỦA BẠN (Your Doctors)
            // ==========================================
            SectionHeader(
                title = "Bác sĩ của bạn",
                actionText = "Xem tất cả",
                onActionClick = { navController.navigate(Screen.Search.route) }
            )

            Spacer(modifier = Modifier.height(12.dp))

            when (doctorsState) {
                is NetworkState.Success -> {
                    val doctorList = (doctorsState as NetworkState.Success<List<Doctor>>).data
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(doctorList) { doc ->
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .width(84.dp)
                                    .clickable { navController.navigate(Screen.DoctorDetail.createRoute(doc.id)) }
                            ) {
                                Box(contentAlignment = Alignment.BottomEnd) {
                                    AsyncImage(
                                        model = doc.avatar ?: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150",
                                        contentDescription = doc.fullName,
                                        modifier = Modifier
                                            .size(64.dp)
                                            .clip(CircleShape)
                                            .border(2.dp, PrimaryBorder, CircleShape),
                                        contentScale = ContentScale.Crop
                                    )
                                    // Verified Badge Icon
                                    Box(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .background(Primary, CircleShape)
                                            .border(1.5.dp, Color.White, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Default.Check,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(12.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    doc.fullName,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    textAlign = TextAlign.Center
                                )
                                Text(
                                    doc.displaySpecialty,
                                    fontSize = 10.sp,
                                    color = TextSecondary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }
                }
                else -> {}
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ==========================================
            // 5. SECTION: BỆNH VIỆN & PHÒNG KHÁM
            // ==========================================
            SectionHeader(
                title = "Bệnh viện & Phòng khám liên kết",
                actionText = "Xem tất cả",
                onActionClick = { navController.navigate(Screen.HospitalBooking.createRoute(null)) }
            )

            Spacer(modifier = Modifier.height(12.dp))

            when (hospitalsState) {
                is NetworkState.Success -> {
                    val hospitalList = (hospitalsState as NetworkState.Success<List<Hospital>>).data
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        items(hospitalList) { hosp ->
                            Card(
                                modifier = Modifier
                                    .width(240.dp)
                                    .clickable { navController.navigate(Screen.HospitalBooking.createRoute(hosp.id)) },
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                shape = RoundedCornerShape(16.dp),
                                border = BorderStroke(1.dp, Border),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    AsyncImage(
                                        model = hosp.image ?: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=150",
                                        contentDescription = hosp.name,
                                        modifier = Modifier
                                            .size(52.dp)
                                            .clip(RoundedCornerShape(12.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            hosp.name,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = TextPrimary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.padding(top = 4.dp)
                                        ) {
                                            Icon(
                                                Icons.Outlined.LocationOn,
                                                contentDescription = null,
                                                tint = TextMuted,
                                                modifier = Modifier.size(13.dp)
                                            )
                                            Spacer(modifier = Modifier.width(2.dp))
                                            Text(
                                                hosp.displayAddress,
                                                fontSize = 11.sp,
                                                color = TextSecondary,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else -> {}
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ==========================================
            // 6. SECTION: KHÁM THEO CHUYÊN KHOA (Modern Grid)
            // ==========================================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, BorderLight),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(16.dp)
                                    .background(Primary, RoundedCornerShape(2.dp))
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Khám theo chuyên khoa",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 15.sp,
                                color = TextPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    val sampleSpecs = listOf(
                        Triple("Dị ứng - Miễn dịch", Icons.Outlined.Shield, Color(0xFF059669)),
                        Triple("Y học cổ truyền", Icons.Outlined.Spa, Color(0xFFD97706)),
                        Triple("Hô hấp - Phổi", Icons.Outlined.Air, Color(0xFF0284C7)),
                        Triple("Cơ xương khớp", Icons.Outlined.AccessibilityNew, Color(0xFF7C3AED)),
                        Triple("Sản phụ khoa", Icons.Outlined.ChildCare, Color(0xFFDB2777)),
                        Triple("Nhãn khoa", Icons.Outlined.Visibility, Color(0xFF0D9488)),
                        Triple("Tim mạch", Icons.Outlined.FavoriteBorder, Color(0xFFE11D48)),
                        Triple("Thần kinh", Icons.Outlined.Psychology, Color(0xFF4F46E5))
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        sampleSpecs.chunked(4).forEach { row ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                row.forEach { (name, icon, color) ->
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { navController.navigate(Screen.Search.route) }
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(48.dp)
                                                .background(color.copy(alpha = 0.1f), RoundedCornerShape(14.dp)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                icon,
                                                contentDescription = name,
                                                tint = color,
                                                modifier = Modifier.size(24.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            name,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = TextPrimary,
                                            textAlign = TextAlign.Center,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    OutlinedButton(
                        onClick = { navController.navigate(Screen.Search.route) },
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, PrimaryBorder),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryDark),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            "Xem tất cả các chuyên khoa",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = PrimaryDark
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun SectionHeader(
    title: String,
    actionText: String? = null,
    onActionClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(16.dp)
                    .background(Primary, RoundedCornerShape(2.dp))
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                title,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 16.sp,
                color = TextPrimary
            )
        }
        if (actionText != null && onActionClick != null) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable { onActionClick() }
            ) {
                Text(
                    actionText,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryDark
                )
                Spacer(modifier = Modifier.width(2.dp))
                Icon(
                    Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = PrimaryDark,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun QuickActionItem(
    label: String,
    icon: ImageVector,
    tint: Color,
    bgTint: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .width(76.dp)
            .clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .background(bgTint, RoundedCornerShape(14.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon,
                contentDescription = label,
                tint = tint,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            label,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = TextPrimary,
            textAlign = TextAlign.Center,
            lineHeight = 14.sp
        )
    }
}

@Composable
fun DoctorCardItem(doctor: Doctor, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Border),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(contentAlignment = Alignment.BottomEnd) {
                AsyncImage(
                    model = doctor.displayAvatarUrl,
                    contentDescription = doctor.displayFullNameWithTitle,
                    modifier = Modifier
                        .size(62.dp)
                        .clip(CircleShape)
                        .border(1.5.dp, PrimaryBorder, CircleShape),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .background(Primary, CircleShape)
                        .border(1.5.dp, Color.White, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Check,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(10.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = doctor.displayFullNameWithTitle,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextPrimary
                )

                Surface(
                    color = PrimaryLight,
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Text(
                        text = doctor.displaySpecialty,
                        fontSize = 11.sp,
                        color = PrimaryDark,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Icon(
                        Icons.Outlined.LocationOn,
                        contentDescription = null,
                        tint = TextMuted,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(
                        text = doctor.displayHospital,
                        fontSize = 11.sp,
                        color = TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            Column(horizontalAlignment = Alignment.End) {
                Surface(
                    color = Color(0xFFFEF3C7),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    ) {
                        Icon(
                            Icons.Default.Star,
                            contentDescription = "Đánh giá",
                            tint = Color(0xFFD97706),
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = doctor.displayRating.toString(),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF92400E)
                        )
                    }
                }
            }
        }
    }
}
