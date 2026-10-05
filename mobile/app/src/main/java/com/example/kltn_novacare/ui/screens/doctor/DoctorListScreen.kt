package com.example.kltn_novacare.ui.screens.doctor

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.PersonSearch
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.Hospital
import com.example.kltn_novacare.data.model.Specialty
import com.example.kltn_novacare.ui.components.BottomNavigationBar
import com.example.kltn_novacare.ui.screens.home.DoctorCardItem
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.DoctorViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorListScreen(
    navController: NavController,
    doctorViewModel: DoctorViewModel,
    initialSpecialtyId: String? = null,
    initialHospitalId: String? = null
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedSpecialtyId by remember { mutableStateOf(initialSpecialtyId) }
    var selectedHospitalId by remember { mutableStateOf(initialHospitalId) }
    var showFilterDialog by remember { mutableStateOf(false) }

    val doctorsState by doctorViewModel.doctors.collectAsState()
    val specialtiesState by doctorViewModel.specialties.collectAsState()
    val hospitalsState by doctorViewModel.hospitals.collectAsState()

    val hasActiveFilter = selectedSpecialtyId != null || selectedHospitalId != null

    LaunchedEffect(searchQuery, selectedSpecialtyId, selectedHospitalId) {
        doctorViewModel.searchDoctors(
            query = searchQuery.ifBlank { null },
            specialtyId = selectedSpecialtyId,
            hospitalId = selectedHospitalId
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "Tìm kiếm Bác sĩ",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = TextPrimary
                        )
                        Text(
                            "Đội ngũ bác sĩ chuyên khoa đầu ngành",
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }
                },
                actions = {
                    Box(modifier = Modifier.padding(end = 8.dp)) {
                        IconButton(
                            onClick = { showFilterDialog = true },
                            modifier = Modifier
                                .size(40.dp)
                                .background(
                                    if (hasActiveFilter) PrimaryLight else Color(0xFFF1F5F9),
                                    CircleShape
                                )
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Tune,
                                contentDescription = "Bộ lọc",
                                tint = if (hasActiveFilter) PrimaryDark else TextSecondary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        if (hasActiveFilter) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .background(Primary, CircleShape)
                                    .align(Alignment.TopEnd)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            BottomNavigationBar(navController = navController, currentRoute = Screen.Search.route)
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Background)
        ) {
            // Search Input Box & Filter summary
            Surface(
                color = Color.White,
                shadowElevation = 2.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Tên bác sĩ, học hàm, chuyên khoa...", fontSize = 13.sp, color = TextMuted) },
                        leadingIcon = {
                            Icon(
                                Icons.Default.Search,
                                contentDescription = "Tìm",
                                tint = Primary,
                                modifier = Modifier.size(20.dp)
                            )
                        },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(
                                        Icons.Default.Close,
                                        contentDescription = "Xóa",
                                        tint = TextMuted,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Primary,
                            unfocusedBorderColor = Border,
                            focusedContainerColor = Background,
                            unfocusedContainerColor = Background
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true
                    )

                    // Active Filters Bar
                    if (hasActiveFilter) {
                        Spacer(modifier = Modifier.height(10.dp))
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (selectedSpecialtyId != null && specialtiesState is NetworkState.Success) {
                                val specName = (specialtiesState as NetworkState.Success<List<Specialty>>).data
                                    .firstOrNull { it.id == selectedSpecialtyId }?.name ?: "Chuyên khoa"
                                item {
                                    Surface(
                                        color = PrimaryLight,
                                        shape = RoundedCornerShape(8.dp),
                                        border = BorderStroke(1.dp, PrimaryBorder)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                specName,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = PrimaryDark
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Icon(
                                                Icons.Default.Close,
                                                contentDescription = "Xóa lọc",
                                                tint = PrimaryDark,
                                                modifier = Modifier
                                                    .size(14.dp)
                                                    .clickable { selectedSpecialtyId = null }
                                            )
                                        }
                                    }
                                }
                            }

                            if (selectedHospitalId != null && hospitalsState is NetworkState.Success) {
                                val hospName = (hospitalsState as NetworkState.Success<List<Hospital>>).data
                                    .firstOrNull { it.id == selectedHospitalId }?.name ?: "Bệnh viện"
                                item {
                                    Surface(
                                        color = Color(0xFFEFF6FF),
                                        shape = RoundedCornerShape(8.dp),
                                        border = BorderStroke(1.dp, Color(0xFFBFDBFE))
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                hospName,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF1E40AF)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Icon(
                                                Icons.Default.Close,
                                                contentDescription = "Xóa lọc",
                                                tint = Color(0xFF1E40AF),
                                                modifier = Modifier
                                                    .size(14.dp)
                                                    .clickable { selectedHospitalId = null }
                                            )
                                        }
                                    }
                                }
                            }

                            item {
                                Text(
                                    "Xóa tất cả",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFEF4444),
                                    modifier = Modifier
                                        .clickable {
                                            selectedSpecialtyId = null
                                            selectedHospitalId = null
                                        }
                                        .padding(start = 4.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Results List
            when (doctorsState) {
                is NetworkState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Primary, strokeWidth = 3.dp)
                    }
                }
                is NetworkState.Success -> {
                    val doctorList = (doctorsState as NetworkState.Success).data
                    if (doctorList.isEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(72.dp)
                                    .background(Color(0xFFF1F5F9), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Outlined.PersonSearch,
                                    contentDescription = null,
                                    tint = TextMuted,
                                    modifier = Modifier.size(36.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Không tìm thấy bác sĩ phù hợp",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                "Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc chuyên khoa/bệnh viện.",
                                fontSize = 12.sp,
                                color = TextSecondary,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            item {
                                Text(
                                    "Tìm thấy ${doctorList.size} bác sĩ phù hợp",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextSecondary,
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                            }
                            items(doctorList) { doc ->
                                DoctorCardItem(doc) {
                                    navController.navigate(Screen.DoctorDetail.createRoute(doc.id))
                                }
                            }
                        }
                    }
                }
                is NetworkState.Error -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            "Không thể tải danh sách bác sĩ",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = Color(0xFFEF4444)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                doctorViewModel.searchDoctors(
                                    query = searchQuery.ifBlank { null },
                                    specialtyId = selectedSpecialtyId,
                                    hospitalId = selectedHospitalId
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Thử lại", color = Color.White)
                        }
                    }
                }
                else -> {}
            }
        }
    }

    // Filter Dialog Modal
    if (showFilterDialog) {
        AlertDialog(
            onDismissRequest = { showFilterDialog = false },
            title = {
                Text(
                    "Bộ lọc tìm kiếm",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 17.sp,
                    color = TextPrimary
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Specialty Filter
                    Text("Chuyên khoa", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                    var specExpanded by remember { mutableStateOf(false) }

                    if (specialtiesState is NetworkState.Success) {
                        val specs = (specialtiesState as NetworkState.Success<List<Specialty>>).data
                        Box {
                            OutlinedCard(
                                onClick = { specExpanded = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, Border)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = specs.firstOrNull { it.id == selectedSpecialtyId }?.name ?: "Tất cả chuyên khoa",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (selectedSpecialtyId != null) PrimaryDark else TextPrimary
                                    )
                                    Icon(
                                        Icons.Default.FilterList,
                                        contentDescription = null,
                                        tint = TextMuted,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            DropdownMenu(
                                expanded = specExpanded,
                                onDismissRequest = { specExpanded = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Tất cả chuyên khoa", fontWeight = FontWeight.Bold) },
                                    onClick = {
                                        selectedSpecialtyId = null
                                        specExpanded = false
                                    }
                                )
                                specs.forEach { spec ->
                                    DropdownMenuItem(
                                        text = { Text(spec.name) },
                                        onClick = {
                                            selectedSpecialtyId = spec.id
                                            specExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Hospital Filter
                    Text("Cơ sở y tế / Bệnh viện", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                    var hospExpanded by remember { mutableStateOf(false) }

                    if (hospitalsState is NetworkState.Success) {
                        val hosps = (hospitalsState as NetworkState.Success<List<Hospital>>).data
                        Box {
                            OutlinedCard(
                                onClick = { hospExpanded = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, Border)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = hosps.firstOrNull { it.id == selectedHospitalId }?.name ?: "Tất cả bệnh viện",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (selectedHospitalId != null) PrimaryDark else TextPrimary
                                    )
                                    Icon(
                                        Icons.Default.FilterList,
                                        contentDescription = null,
                                        tint = TextMuted,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            DropdownMenu(
                                expanded = hospExpanded,
                                onDismissRequest = { hospExpanded = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Tất cả bệnh viện", fontWeight = FontWeight.Bold) },
                                    onClick = {
                                        selectedHospitalId = null
                                        hospExpanded = false
                                    }
                                )
                                hosps.forEach { hosp ->
                                    DropdownMenuItem(
                                        text = { Text(hosp.name) },
                                        onClick = {
                                            selectedHospitalId = hosp.id
                                            hospExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { showFilterDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Áp dụng", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        selectedSpecialtyId = null
                        selectedHospitalId = null
                        showFilterDialog = false
                    }
                ) {
                    Text("Đặt lại", color = TextSecondary, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}
