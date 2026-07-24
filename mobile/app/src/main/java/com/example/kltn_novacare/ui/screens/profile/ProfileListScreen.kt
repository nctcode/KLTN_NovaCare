package com.example.kltn_novacare.ui.screens.profile

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.PatientProfile
import com.example.kltn_novacare.data.remote.CreatePatientProfileRequest
import com.example.kltn_novacare.ui.components.BottomNavigationBar
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.Primary
import com.example.kltn_novacare.ui.theme.Secondary
import com.example.kltn_novacare.ui.theme.TextSecondary
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import com.example.kltn_novacare.ui.viewmodel.PatientViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileListScreen(
    navController: NavController,
    patientViewModel: PatientViewModel
) {
    val profilesState by patientViewModel.profiles.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var editingProfile by remember { mutableStateOf<PatientProfile?>(null) }

    LaunchedEffect(Unit) {
        patientViewModel.loadProfiles()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Hồ sơ bệnh nhân", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Thêm mới", tint = Primary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            BottomNavigationBar(navController = navController, currentRoute = Screen.Profiles.route)
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFF8F9FA))
        ) {
            when (profilesState) {
                is NetworkState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = Primary)
                }
                is NetworkState.Success -> {
                    val list = (profilesState as NetworkState.Success<List<PatientProfile>>).data
                    if (list.isEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Chưa có hồ sơ người bệnh", fontWeight = FontWeight.Bold, color = Secondary, fontSize = 16.sp)
                            Text("Tạo hồ sơ bệnh nhân để đặt lịch nhanh hơn.", color = TextSecondary, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp))
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { showAddDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Primary)
                            ) {
                                Text("Tạo hồ sơ đầu tiên", color = Color.White)
                            }
                        }
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(list) { profile ->
                                ProfileItem(
                                    profile = profile,
                                    onEdit = { editingProfile = profile },
                                    onDelete = { patientViewModel.deleteProfile(profile.id) },
                                    onSetDefault = { patientViewModel.setDefaultProfile(profile.id) }
                                )
                            }
                        }
                    }
                }
                is NetworkState.Error -> {
                    Text("Lỗi tải dữ liệu", color = Color.Red, modifier = Modifier.align(Alignment.Center))
                }
                else -> {}
            }
        }
    }

    // Add Profile Dialog
    if (showAddDialog) {
        ProfileFormDialog(
            title = "Thêm hồ sơ mới",
            onDismiss = { showAddDialog = false },
            onSubmit = { request ->
                patientViewModel.createProfile(request) {
                    showAddDialog = false
                }
            }
        )
    }

    // Edit Profile Dialog
    if (editingProfile != null) {
        ProfileFormDialog(
            title = "Chỉnh sửa hồ sơ",
            profile = editingProfile,
            onDismiss = { editingProfile = null },
            onSubmit = { request ->
                patientViewModel.updateProfile(editingProfile!!.id, request) {
                    editingProfile = null
                }
            }
        )
    }
}

@Composable
fun ProfileItem(
    profile: PatientProfile,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onSetDefault: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(profile.fullName, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Secondary)
                    if (profile.isDefault) {
                        Spacer(modifier = Modifier.width(8.dp))
                        SuggestionChip(
                            onClick = {},
                            label = { Text("Mặc định", fontSize = 10.sp) },
                            colors = SuggestionChipDefaults.suggestionChipColors(labelColor = Primary)
                        )
                    }
                }
                Row {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, contentDescription = "Sửa", tint = Primary, modifier = Modifier.size(20.dp))
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Default.Delete, contentDescription = "Xóa", tint = Color.Red, modifier = Modifier.size(20.dp))
                    }
                }
            }
            Text("SĐT: ${profile.phone}", fontSize = 13.sp, color = TextSecondary)
            Text("Ngày sinh: ${profile.dateOfBirth}", fontSize = 13.sp, color = TextSecondary, modifier = Modifier.padding(top = 2.dp))
            Text(
                text = "Quan hệ: " + when (profile.relationship) {
                    "BAN_THAN" -> "Bản thân"
                    "CHA_ME" -> "Bố mẹ"
                    "VO_CHONG" -> "Vợ/Chồng"
                    "CON_CAI" -> "Con cái"
                    else -> "Người thân"
                },
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Primary,
                modifier = Modifier.padding(top = 4.dp)
            )

            if (!profile.isDefault) {
                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))
                Text(
                    text = "Đặt làm hồ sơ mặc định",
                    color = Primary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clickable { onSetDefault() }
                        .padding(vertical = 4.dp)
                )
            }
        }
    }
}

@Composable
fun ProfileFormDialog(
    title: String,
    profile: PatientProfile? = null,
    onDismiss: () -> Unit,
    onSubmit: (CreatePatientProfileRequest) -> Unit
) {
    var fullName by remember { mutableStateOf(profile?.fullName ?: "") }
    var phone by remember { mutableStateOf(profile?.phone ?: "") }
    var email by remember { mutableStateOf(profile?.email ?: "") }
    var dateOfBirth by remember { mutableStateOf(profile?.dateOfBirth ?: "1995-01-01") }
    var gender by remember { mutableStateOf(profile?.gender ?: "NAM") }
    var cccd by remember { mutableStateOf(profile?.identityCard ?: "") }
    var bhyt by remember { mutableStateOf(profile?.healthInsurance ?: "") }
    var address by remember { mutableStateOf(profile?.address ?: "") }
    var relationship by remember { mutableStateOf(profile?.relationship ?: "BAN_THAN") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = fullName,
                    onValueChange = { fullName = it },
                    label = { Text("Họ tên") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Số điện thoại") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email (nếu có)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = dateOfBirth,
                    onValueChange = { dateOfBirth = it },
                    label = { Text("Ngày sinh (yyyy-MM-dd)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Gender Select
                Text("Giới tính", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Secondary)
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = gender == "NAM", onClick = { gender = "NAM" })
                        Text("Nam")
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = gender == "NU", onClick = { gender = "NU" })
                        Text("Nữ")
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = gender == "KHAC", onClick = { gender = "KHAC" })
                        Text("Khác")
                    }
                }

                // Relationship Select
                Text("Quan hệ", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Secondary)
                val relations = listOf("BAN_THAN" to "Bản thân", "CHA_ME" to "Bố mẹ", "VO_CHONG" to "Vợ/Chồng", "CON_CAI" to "Con cái", "HO_HANG" to "Họ hàng")
                var expandedRel by remember { mutableStateOf(false) }
                Box {
                    OutlinedCard(
                        onClick = { expandedRel = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = relations.firstOrNull { it.first == relationship }?.second ?: "Bản thân",
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                    DropdownMenu(expanded = expandedRel, onDismissRequest = { expandedRel = false }) {
                        relations.forEach { rel ->
                            DropdownMenuItem(
                                text = { Text(rel.second) },
                                onClick = {
                                    relationship = rel.first
                                    expandedRel = false
                                }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = cccd,
                    onValueChange = { cccd = it },
                    label = { Text("Số CCCD (nếu có)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = bhyt,
                    onValueChange = { bhyt = it },
                    label = { Text("Mã BHYT (nếu có)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Địa chỉ") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (fullName.isNotBlank() && phone.isNotBlank()) {
                        onSubmit(
                            CreatePatientProfileRequest(
                                fullName = fullName,
                                phone = phone,
                                email = email.ifBlank { null },
                                dateOfBirth = dateOfBirth,
                                gender = gender,
                                identityCard = cccd.ifBlank { null },
                                healthInsurance = bhyt.ifBlank { null },
                                address = address.ifBlank { null },
                                relationship = relationship
                            )
                        )
                    }
                },
                enabled = fullName.isNotBlank() && phone.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Text("Lưu hồ sơ", color = Color.White)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Hủy", color = TextSecondary)
            }
        }
    )
}
