package com.example.kltn_novacare.ui.screens.doctor

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Search
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
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.Secondary
import com.example.kltn_novacare.ui.theme.TextSecondary
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
                title = { Text("Tìm kiếm Bác sĩ", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { showFilterDialog = true }) {
                        Icon(
                            imageVector = Icons.Default.FilterList,
                            contentDescription = "Bộ lọc",
                            tint = if (selectedSpecialtyId != null || selectedHospitalId != null) Primary else Secondary
                        )
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
                .background(Color(0xFFF8F9FA))
        ) {
            // Search Input Box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(16.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Tên bác sĩ, chuyên môn...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Tìm") },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Close, contentDescription = "Xóa")
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )
            }

            // Results
            when (doctorsState) {
                is NetworkState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Primary)
                    }
                }
                is NetworkState.Success -> {
                    val doctorList = (doctorsState as NetworkState.Success).data
                    if (doctorList.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Không tìm thấy kết quả phù hợp", color = TextSecondary, fontSize = 14.sp)
                        }
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(doctorList) { doc ->
                                DoctorCardItem(doc) {
                                    navController.navigate(Screen.DoctorDetail.createRoute(doc.id))
                                }
                            }
                        }
                    }
                }
                is NetworkState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Lỗi kết nối máy chủ", color = MaterialTheme.colorScheme.error)
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
            title = { Text("Bộ lọc tìm kiếm", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Specialty Filter
                    Text("Chuyên khoa", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    var specExpanded by remember { mutableStateOf(false) }
                    var specLabel by remember { mutableStateOf("Tất cả chuyên khoa") }
                    
                    if (specialtiesState is NetworkState.Success) {
                        val specs = (specialtiesState as NetworkState.Success<List<Specialty>>).data
                        Box {
                            OutlinedCard(
                                onClick = { specExpanded = true },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = specs.firstOrNull { it.id == selectedSpecialtyId }?.name ?: "Tất cả chuyên khoa",
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                            DropdownMenu(expanded = specExpanded, onDismissRequest = { specExpanded = false }) {
                                DropdownMenuItem(
                                    text = { Text("Tất cả chuyên khoa") },
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
                    Text("Cơ sở y tế", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    var hospExpanded by remember { mutableStateOf(false) }
                    
                    if (hospitalsState is NetworkState.Success) {
                        val hosps = (hospitalsState as NetworkState.Success<List<Hospital>>).data
                        Box {
                            OutlinedCard(
                                onClick = { hospExpanded = true },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = hosps.firstOrNull { it.id == selectedHospitalId }?.name ?: "Tất cả bệnh viện",
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                            DropdownMenu(expanded = hospExpanded, onDismissRequest = { hospExpanded = false }) {
                                DropdownMenuItem(
                                    text = { Text("Tất cả bệnh viện") },
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
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) {
                    Text("Áp dụng", color = Color.White)
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
                    Text("Đặt lại", color = TextSecondary)
                }
            }
        )
    }
}
