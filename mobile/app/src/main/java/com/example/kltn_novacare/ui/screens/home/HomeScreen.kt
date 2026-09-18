package com.example.kltn_novacare.ui.screens.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.graphics.Color
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
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.Secondary
import com.example.kltn_novacare.ui.theme.TextSecondary
import com.example.kltn_novacare.ui.viewmodel.AppointmentViewModel
import com.example.kltn_novacare.ui.viewmodel.DoctorViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    navController: NavController,
    doctorViewModel: DoctorViewModel,
    appointmentViewModel: AppointmentViewModel
) {
    val specialtiesState by doctorViewModel.specialties.collectAsState()
    val hospitalsState by doctorViewModel.hospitals.collectAsState()
    val doctorsState by doctorViewModel.doctors.collectAsState()
    val unreadNotificationsCount by appointmentViewModel.unreadCount.collectAsState()

    val primaryGreen = Color(0xFF0C4B39)
    val goldAccent = Color(0xFFF59E0B)

    LaunchedEffect(Unit) {
        doctorViewModel.loadHomeData()
        appointmentViewModel.loadUnreadCount()
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
                .background(Color(0xFFF1F5F9))
                .verticalScroll(rememberScrollState())
        ) {
            // ==========================================
            // 1. HEADER (YouMed Style in NovaCare Theme)
            // ==========================================
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(primaryGreen)
                    .padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 20.dp)
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
                                    .size(44.dp)
                                    .background(Color.White.copy(alpha = 0.2f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("NT", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Buổi tối an lành!", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                                Text("Nguyễn Chí Thuận", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                            }
                        }

                        // Notification Bell Icon
                        Box {
                            IconButton(onClick = { navController.navigate(Screen.Notifications.route) }) {
                                Icon(Icons.Default.Notifications, contentDescription = "Thông báo", tint = Color.White, modifier = Modifier.size(26.dp))
                            }
                            if (unreadNotificationsCount > 0) {
                                Badge(
                                    containerColor = Color(0xFFEF4444),
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .offset(x = (-4).dp, y = 4.dp)
                                ) {
                                    Text(
                                        text = if (unreadNotificationsCount > 9) "9+" else unreadNotificationsCount.toString(),
                                        color = Color.White,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Embedded Search Bar Pill
                    OutlinedCard(
                        onClick = { navController.navigate(Screen.Search.route) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.outlinedCardColors(containerColor = Color.White),
                        border = BorderStroke(0.dp, Color.Transparent)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Search, contentDescription = "Tìm kiếm", tint = Color.Gray)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Tên bác sĩ, triệu chứng bệnh, chuyên khoa...", color = Color.Gray, fontSize = 13.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // ==========================================
            // 2. HERO AI SCREENING BANNER
            // ==========================================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clickable { navController.navigate(Screen.PreExamScreening.route) },
                colors = CardDefaults.cardColors(containerColor = primaryGreen),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            color = goldAccent,
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text(
                                "100% Smartphone AI",
                                color = Color.Black,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Chưa biết chọn Chuyên khoa nào phù hợp?",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "Sử dụng AI đo Nhịp tim PPG bằng Camera, phân tích ảnh tổn thương/xét nghiệm & giọng nói để gợi ý ngay",
                        color = Color(0xFFA7F3D0),
                        fontSize = 11.sp,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { navController.navigate(Screen.PreExamScreening.route) },
                        colors = ButtonDefaults.buttonColors(containerColor = goldAccent),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("✨ Nhờ AI Sàng Lọc & Gợi Ý Ngay", color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ==========================================
            // 3. YOU MED STYLE 7-ACTION QUICK GRID CARD
            // ==========================================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Row 1: 3 Items
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        QuickGridItem("Đặt khám\nbác sĩ", "👤", Color(0xFFF97316)) {
                            navController.navigate(Screen.Search.route)
                        }
                        QuickGridItem("Đặt khám\nphòng khám", "🩺", Color(0xFF3B82F6)) {
                            navController.navigate(Screen.HospitalBooking.createRoute(null))
                        }
                        QuickGridItem("Đặt khám\ntheo cơ sở", "🏥", Color(0xFFEC4899)) {
                            navController.navigate(Screen.HospitalBooking.createRoute(null))
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Row 2: 3 Items
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        QuickGridItem("AI Sàng lọc\nđa triệu chứng", "✨", Color(0xFFEAB308)) {
                            navController.navigate(Screen.PreExamScreening.route)
                        }
                        QuickGridItem("Chat với\nbác sĩ", "💬", Color(0xFF06B6D4)) {
                            navController.navigate(Screen.Search.route)
                        }
                        QuickGridItem("Gọi video\nvới bác sĩ", "📹", Color(0xFFA855F7)) {
                            navController.navigate(Screen.Search.route)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Row 3: 1 Item
                    Row(modifier = Modifier.fillMaxWidth()) {
                        QuickGridItem("Hồ sơ\nsức khỏe", "📁", Color(0xFF14B8A6)) {
                            navController.navigate(Screen.Profiles.route)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // ==========================================
            // 4. SECTION: BÁC SĨ CỦA BẠN (Your Doctors)
            // ==========================================
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("❄", fontSize = 16.sp, color = primaryGreen)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Bác sĩ của bạn", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = Color(0xFF0F172A))
                }
                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color.Gray)
            }

            Spacer(modifier = Modifier.height(10.dp))

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
                                    .width(80.dp)
                                    .clickable { navController.navigate(Screen.DoctorDetail.createRoute(doc.id)) }
                            ) {
                                AsyncImage(
                                    model = doc.avatar ?: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150",
                                    contentDescription = doc.fullName,
                                    modifier = Modifier
                                        .size(60.dp)
                                        .clip(CircleShape)
                                        .border(2.dp, primaryGreen, CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    doc.fullName,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF0F172A),
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

            Spacer(modifier = Modifier.height(20.dp))

            // ==========================================
            // 5. SECTION: BỆNH VIỆN & PHÒNG KHÁM
            // ==========================================
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("🏢", fontSize = 16.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Bệnh viện & Phòng khám liên kết", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = Color(0xFF0F172A))
                }
                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color.Gray)
            }

            Spacer(modifier = Modifier.height(10.dp))

            when (hospitalsState) {
                is NetworkState.Success -> {
                    val hospitalList = (hospitalsState as NetworkState.Success<List<Hospital>>).data
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(hospitalList) { hosp ->
                            Card(
                                modifier = Modifier
                                    .width(220.dp)
                                    .clickable { navController.navigate(Screen.HospitalBooking.createRoute(hosp.id)) },
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                shape = RoundedCornerShape(16.dp),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                    AsyncImage(
                                        model = hosp.image ?: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=150",
                                        contentDescription = hosp.name,
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(RoundedCornerShape(12.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(hosp.name, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF0F172A), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                        Text(hosp.displayAddress, fontSize = 10.sp, color = TextSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 2.dp))
                                    }
                                }
                            }
                        }
                    }
                }
                else -> {}
            }

            Spacer(modifier = Modifier.height(20.dp))

            // ==========================================
            // 6. SECTION: KHÁM THEO CHUYÊN KHOA (8 Grid)
            // ==========================================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🏥", fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Khám theo chuyên khoa", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = Color(0xFF0F172A))
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    val sampleSpecs = listOf(
                        "Dị ứng - Miễn dịch" to "🛡️",
                        "Y học cổ truyền" to "☯️",
                        "Hô hấp - Phổi" to "🫁",
                        "Y học thể thao" to "🏃",
                        "Cơ xương khớp" to "🦴",
                        "Sản phụ khoa" to "👶",
                        "Nhãn khoa" to "👁️",
                        "Nam khoa" to "🩺"
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        sampleSpecs.chunked(4).forEach { row ->
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                row.forEach { spec ->
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { navController.navigate(Screen.Search.route) }
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(48.dp)
                                                .background(Color(0xFFF8FAFC), CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(spec.second, fontSize = 22.sp)
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            spec.first,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color(0xFF334155),
                                            textAlign = TextAlign.Center,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedButton(
                        onClick = { navController.navigate(Screen.Search.route) },
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Xem tất cả các chuyên khoa", color = primaryGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun QuickGridItem(
    label: String,
    icon: String,
    bgColor: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .width(90.dp)
            .clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .size(50.dp)
                .background(bgColor.copy(alpha = 0.15f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(icon, fontSize = 22.sp)
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF1E293B),
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
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = doctor.displayAvatarUrl,
                contentDescription = doctor.displayFullNameWithTitle,
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = doctor.displayFullNameWithTitle,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Secondary
                )
                Text(
                    text = doctor.displaySpecialty,
                    fontSize = 12.sp,
                    color = Primary,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(top = 2.dp)
                )
                Text(
                    text = doctor.displayHospital,
                    fontSize = 11.sp,
                    color = TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Star, contentDescription = "Đánh giá", tint = Color(0xFFFFB300), modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(2.dp))
                Text(text = doctor.displayRating.toString(), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Secondary)
            }
        }
    }
}
