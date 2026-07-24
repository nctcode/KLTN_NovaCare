package com.example.kltn_novacare.ui.screens.doctor

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.Doctor
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.Secondary
import com.example.kltn_novacare.ui.theme.TextSecondary
import com.example.kltn_novacare.ui.viewmodel.DoctorViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorDetailScreen(
    doctorId: String,
    navController: NavController,
    doctorViewModel: DoctorViewModel
) {
    val doctorDetailsState by doctorViewModel.doctorDetails.collectAsState()

    LaunchedEffect(doctorId) {
        doctorViewModel.getDoctorById(doctorId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết Bác sĩ", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFF8F9FA))
        ) {
            when (doctorDetailsState) {
                is NetworkState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = Primary)
                }
                is NetworkState.Success -> {
                    val doctor = (doctorDetailsState as NetworkState.Success<Doctor>).data
                    DoctorDetailContent(doctor = doctor, navController = navController)
                }
                is NetworkState.Error -> {
                    Text(
                        text = (doctorDetailsState as NetworkState.Error).message,
                        color = Color.Red,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                else -> {}
            }
        }
    }
}

@Composable
fun DoctorDetailContent(doctor: Doctor, navController: NavController) {
    val scrollState = rememberScrollState()
    
    // We mock the doctor's workplaces. If backend provides it in model, we use it, otherwise mock price.
    // In our database design, doctors have workspaces.
    val price = 150000.0
    val formattedPrice = NumberFormat.getCurrencyInstance(Locale("vi", "VN")).format(price)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
    ) {
        // Doctor Card Info
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = doctor.avatar ?: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150",
                    contentDescription = doctor.fullName,
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(
                        text = doctor.title + " " + doctor.fullName,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Secondary
                    )
                    Text(
                        text = doctor.specialties?.joinToString { it.name } ?: "Chuyên khoa Ngoại",
                        fontSize = 13.sp,
                        color = Primary,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                    Row(
                        modifier = Modifier.padding(top = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Star, contentDescription = "Star", tint = Color(0xFFFFB300), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = doctor.rating.toString(), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Secondary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "(${doctor.reviewCount} lượt khám)", fontSize = 12.sp, color = TextSecondary)
                    }
                }
            }
        }

        // Location & Price
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Workspace location
                Row(verticalAlignment = Alignment.Top) {
                    Icon(Icons.Default.Home, contentDescription = "Location", tint = Primary, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(text = doctor.hospital?.name ?: "Bệnh viện Đa khoa NovaCare", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Secondary)
                        Text(text = doctor.hospital?.address ?: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội", fontSize = 12.sp, color = TextSecondary, modifier = Modifier.padding(top = 2.dp))
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))

                // Price
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, contentDescription = "Price", tint = Primary, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(text = "Giá khám bệnh", fontSize = 14.sp, color = Secondary)
                    }
                    Text(text = formattedPrice, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Primary)
                }
            }
        }

        // Bio & Description
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Giới thiệu", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Secondary)
                Text(
                    text = doctor.bio ?: "Bác sĩ có nhiều năm kinh nghiệm khám và điều trị các bệnh chuyên khoa. Chu đáo, tận tâm với người bệnh.",
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 20.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(text = "Kinh nghiệm chuyên môn", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Secondary)
                Text(
                    text = doctor.experience ?: "15 năm kinh nghiệm trong ngành y tế.",
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 20.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }

    // Fixed Bottom Booking Button
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        contentAlignment = Alignment.BottomCenter
    ) {
        Button(
            onClick = {
                // Navigate to Stepper Booking Flow
                // We pass doctor id and workplace id. If doctor has hospital/workplaces, we use it.
                val hospitalId = doctor.hospital?.id ?: "hosp-1"
                navController.navigate(Screen.Booking.createRoute(doctor.id, hospitalId))
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("Đặt lịch khám ngay", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}
