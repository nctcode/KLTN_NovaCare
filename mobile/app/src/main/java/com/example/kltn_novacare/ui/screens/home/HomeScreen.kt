package com.example.kltn_novacare.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.Doctor
import com.example.kltn_novacare.data.model.Hospital
import com.example.kltn_novacare.data.model.Specialty
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

    LaunchedEffect(Unit) {
        doctorViewModel.loadHomeData()
        appointmentViewModel.loadUnreadCount()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .background(Primary, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("N", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("NovaCare", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Secondary)
                    }
                },
                actions = {
                    Box(modifier = Modifier.padding(end = 12.dp)) {
                        IconButton(onClick = { navController.navigate(Screen.Notifications.route) }) {
                            Icon(Icons.Default.Notifications, contentDescription = "Thông báo", tint = Secondary, modifier = Modifier.size(26.dp))
                        }
                        if (unreadNotificationsCount > 0) {
                            Badge(
                                containerColor = Color.Red,
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
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            BottomNavigationBar(navController = navController, currentRoute = Screen.Home.route)
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFF8F9FA))
                .verticalScroll(rememberScrollState())
        ) {
            // Search Quick Box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                OutlinedCard(
                    onClick = { navController.navigate(Screen.Search.route) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.outlinedCardColors(containerColor = Color(0xFFF1F5F9))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Search, contentDescription = "Tìm kiếm", tint = TextSecondary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Tìm kiếm bác sĩ, chuyên khoa, phòng khám...", color = TextSecondary, fontSize = 14.sp)
                    }
                }
            }

            // Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .height(130.dp)
                    .background(Secondary, RoundedCornerShape(12.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Column {
                    Text("Đặt Lịch Khám Nhanh", color = Primary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "Chăm sóc sức khỏe toàn diện cùng đội ngũ bác sĩ hàng đầu Việt Nam.",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 4.dp, end = 24.dp)
                    )
                }
            }

            // Specialties Section
            Text(
                text = "Chuyên khoa nổi bật",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Secondary,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
            
            when (specialtiesState) {
                is NetworkState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally).padding(16.dp))
                }
                is NetworkState.Success -> {
                    val specialtyList = (specialtiesState as NetworkState.Success<List<Specialty>>).data
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(specialtyList) { spec ->
                            SpecialtyItem(spec) {
                                navController.navigate("${Screen.Search.route}?specialtyId=${spec.id}")
                            }
                        }
                    }
                }
                is NetworkState.Error -> {
                    Text(
                        text = "Không thể tải chuyên khoa",
                        modifier = Modifier.padding(16.dp),
                        color = Color.Red
                    )
                }
                else -> {}
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Hospitals Section
            Text(
                text = "Cơ sở y tế liên kết",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Secondary,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
            
            when (hospitalsState) {
                is NetworkState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally).padding(16.dp))
                }
                is NetworkState.Success -> {
                    val hospitalList = (hospitalsState as NetworkState.Success<List<Hospital>>).data
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(hospitalList) { hosp ->
                            HospitalItem(hosp) {
                                navController.navigate("${Screen.Search.route}?hospitalId=${hosp.id}")
                            }
                        }
                    }
                }
                is NetworkState.Error -> {
                    Text(
                        text = "Không thể tải cơ sở y tế",
                        modifier = Modifier.padding(16.dp),
                        color = Color.Red
                    )
                }
                else -> {}
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Featured Doctors Section
            Text(
                text = "Bác sĩ tiêu biểu",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Secondary,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
            
            when (doctorsState) {
                is NetworkState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally).padding(16.dp))
                }
                is NetworkState.Success -> {
                    val doctorList = (doctorsState as NetworkState.Success<List<Doctor>>).data
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        doctorList.forEach { doc ->
                            DoctorCardItem(doc) {
                                navController.navigate(Screen.DoctorDetail.createRoute(doc.id))
                            }
                        }
                    }
                }
                is NetworkState.Error -> {
                    Text(
                        text = "Không thể tải danh sách bác sĩ",
                        modifier = Modifier.padding(16.dp),
                        color = Color.Red
                    )
                }
                else -> {}
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun SpecialtyItem(specialty: Specialty, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(110.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            AsyncImage(
                model = specialty.image ?: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
                contentDescription = specialty.name,
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = specialty.name,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Secondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun HospitalItem(hospital: Hospital, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(200.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column {
            AsyncImage(
                model = hospital.image ?: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400",
                contentDescription = hospital.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp),
                contentScale = ContentScale.Crop
            )
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = hospital.name,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Secondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = hospital.address,
                    fontSize = 11.sp,
                    color = TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
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
                model = doctor.avatar ?: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150",
                contentDescription = doctor.fullName,
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = doctor.title + " " + doctor.fullName,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Secondary
                )
                Text(
                    text = doctor.specialties?.joinToString { it.name } ?: "Chuyên khoa Ngoại",
                    fontSize = 12.sp,
                    color = Primary,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(top = 2.dp)
                )
                Text(
                    text = doctor.hospital?.name ?: "Bệnh viện Đa khoa NovaCare",
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
                Text(text = doctor.rating.toString(), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Secondary)
            }
        }
    }
}
