package com.example.kltn_novacare.ui.screens.profile

import android.widget.Toast
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
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.PatientProfile
import com.example.kltn_novacare.ui.components.BottomNavigationBar
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import com.example.kltn_novacare.ui.viewmodel.PatientViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileListScreen(
    navController: NavController,
    patientViewModel: PatientViewModel,
    onBookProfile: (PatientProfile) -> Unit
) {
    val profilesState by patientViewModel.profiles.collectAsState()
    val operation by patientViewModel.profileOperation.collectAsState()
    val busy = operation is NetworkState.Loading
    val operationError = (operation as? NetworkState.Error)?.message
    val snackbar = remember { SnackbarHostState() }
    var showAddDialog by rememberSaveable { mutableStateOf(false) }
    var editingProfile by remember { mutableStateOf<PatientProfile?>(null) }
    var profileToDelete by remember { mutableStateOf<PatientProfile?>(null) }
    var showPassportShareDialog by remember { mutableStateOf(false) }

    var searchQuery by rememberSaveable { mutableStateOf("") }
    var relationFilter by rememberSaveable { mutableStateOf("ALL") }

    val context = LocalContext.current

    LaunchedEffect(Unit) {
        patientViewModel.resetOperation()
        patientViewModel.loadProfiles()
    }
    LaunchedEffect(operationError) {
        if (operationError != null && !showAddDialog && editingProfile == null && profileToDelete == null) {
            snackbar.showSnackbar(operationError)
            patientViewModel.resetOperation()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "Hồ sơ sức khỏe",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp,
                                color = Color(0xFF0F172A)
                            )
                        }
                        Text(
                            "Quản lý hồ sơ y tế & liên thông dữ liệu",
                            fontSize = 11.sp,
                            color = Color(0xFF64748B)
                        )
                    }
                },
                actions = {
                    FilledTonalButton(
                        onClick = { patientViewModel.resetOperation(); showAddDialog = true },
                        enabled = !busy,
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = Color(0xFFDCFCE7),
                            contentColor = Color(0xFF15803D)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Thêm mới", fontWeight = FontWeight.Bold, fontSize = 12.sp)
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
                .background(Color(0xFFF8FAFC))
        ) {
            when (profilesState) {
                is NetworkState.Loading -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(color = Primary)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Đang tải danh sách hồ sơ...", fontSize = 13.sp, color = Color(0xFF64748B))
                    }
                }
                is NetworkState.Success -> {
                    val allList = (profilesState as NetworkState.Success<List<PatientProfile>>).data
                    val defaultProfile = allList.find { it.isDefault }
                    val cccdCount = allList.count { !it.identityCard.isNullOrBlank() }

                    // Filtering
                    val filteredList = allList.filter { p ->
                        val matchesSearch = p.fullName.contains(searchQuery, ignoreCase = true) ||
                                (p.phone?.contains(searchQuery) == true) ||
                                (p.identityCard?.contains(searchQuery) == true)

                        if (!matchesSearch) return@filter false

                        when (relationFilter) {
                            "SELF" -> p.displayRelationship == "Bản thân"
                            "RELATIVE" -> p.displayRelationship != "Bản thân"
                            else -> true
                        }
                    }

                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // 1. BANNER: LIÊN THÔNG Y TẾ & QUYỀN CHIA SẺ HỒ SƠ
                        item {
                            EhrPassportShareBanner(
                                onOpenShare = { showPassportShareDialog = true }
                            )
                        }

                        // 2. STATS OVERVIEW STRIP (3 Thống kê như bản Web)
                        item {
                            StatsOverviewStrip(
                                totalCount = allList.size,
                                defaultProfileName = defaultProfile?.fullName,
                                cccdCount = cccdCount
                            )
                        }

                        // 3. SEARCH & FILTER TOOLBAR
                        item {
                            SearchAndFilterToolbar(
                                searchQuery = searchQuery,
                                onSearchChange = { searchQuery = it },
                                relationFilter = relationFilter,
                                onFilterChange = { relationFilter = it },
                                totalCount = allList.size
                            )
                        }

                        // 4. PROFILES LIST OR EMPTY STATE
                        if (filteredList.isEmpty()) {
                            item {
                                EmptyProfileState(
                                    hasFilter = searchQuery.isNotBlank() || relationFilter != "ALL",
                                    onAddNew = { patientViewModel.resetOperation(); showAddDialog = true }
                                )
                            }
                        } else {
                            items(filteredList, key = { it.id }) { profile ->
                                DetailedProfileCard(
                                    profile = profile,
                                    enabled = !busy,
                                    onSetDefault = {
                                        patientViewModel.setDefaultProfile(profile.id) {
                                            Toast.makeText(context, "Đã đặt ${profile.fullName} làm hồ sơ chính", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    onEdit = { patientViewModel.resetOperation(); editingProfile = profile },
                                    onDelete = { patientViewModel.resetOperation(); profileToDelete = profile },
                                    onBookAppointment = {
                                        onBookProfile(profile)
                                    }
                                )
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(20.dp))
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
                        Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = Color.Red, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Không thể tải danh sách hồ sơ", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(
                            (profilesState as NetworkState.Error).message,
                            fontSize = 13.sp,
                            color = Color(0xFF64748B),
                            modifier = Modifier.padding(top = 4.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { patientViewModel.loadProfiles() },
                            colors = ButtonDefaults.buttonColors(containerColor = Primary)
                        ) {
                            Text("Thử lại", color = Color.White)
                        }
                    }
                }
                else -> {}
            }
        }
    }

    // ==========================================
    // DIALOG: TẠO HỒ SƠ MỚI
    // ==========================================
    if (showAddDialog) {
        FullProfileFormDialog(
            isSaving = busy,
            error = operationError,
            title = "Thêm hồ sơ bệnh nhân mới",
            subtitle = "Nhập đầy đủ thông tin để phục vụ đặt lịch khám và tra cứu liên thông",
            onDismiss = { showAddDialog = false },
            onSubmit = { request ->
                patientViewModel.createProfile(request) {
                    showAddDialog = false
                    Toast.makeText(context, "Tạo hồ sơ thành công", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }

    // ==========================================
    // DIALOG: CHỈNH SỬA HỒ SƠ
    // ==========================================
    if (editingProfile != null) {
        FullProfileFormDialog(
            isSaving = busy,
            error = operationError,
            title = "Chỉnh sửa hồ sơ",
            subtitle = "Cập nhật thông tin y tế của ${editingProfile?.fullName}",
            profile = editingProfile,
            onDismiss = { editingProfile = null },
            onSubmit = { request ->
                patientViewModel.updateProfile(editingProfile!!.id, request) {
                    editingProfile = null
                    Toast.makeText(context, "Cập nhật hồ sơ thành công", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }

    // ==========================================
    // DIALOG: XÁC NHẬN XÓA HỒ SƠ
    // ==========================================
    if (profileToDelete != null) {
        AlertDialog(
            onDismissRequest = { if (!busy) profileToDelete = null },
            icon = { Icon(Icons.Default.DeleteOutline, contentDescription = null, tint = Color.Red) },
            title = { Text("Xác nhận xóa hồ sơ") },
            text = {
                Column {
                    Text("Bạn có chắc chắn muốn xóa hồ sơ của ${profileToDelete?.fullName}?")
                    operationError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        profileToDelete?.let {
                            patientViewModel.deleteProfile(it.id) {
                                profileToDelete = null
                                Toast.makeText(context, "Đã xóa hồ sơ", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    enabled = !busy,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
                ) {
                    Text(if (busy) "Đang xóa..." else "Xóa hồ sơ", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(enabled = !busy, onClick = { profileToDelete = null }) {
                    Text("Hủy", color = Color(0xFF64748B))
                }
            }
        )
    }

    // ==========================================
    // DIALOG: CẤP MÃ CHIA SẺ HỒ SƠ (PASSPORT SHARE)
    // ==========================================
    if (showPassportShareDialog) {
        MedicalPassportShareDialog(
            onDismiss = { showPassportShareDialog = false }
        )
    }
}

// ==============================================================================
// 1. BANNER: LIÊN THÔNG Y TẾ & QUYỀN CHIA SẺ
// ==============================================================================
@Composable
fun EhrPassportShareBanner(onOpenShare: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Color(0xFF0F172A),
                            Color(0xFF1E293B),
                            Color(0xFF1E1B4B)
                        )
                    )
                )
                .padding(18.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        color = Color(0xFF3B82F6).copy(alpha = 0.2f),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.dp, Color(0xFF60A5FA).copy(alpha = 0.4f))
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.Shield, contentDescription = null, tint = Color(0xFF34D399), modifier = Modifier.size(14.dp))
                            Text(
                                "LIÊN THÔNG Y TẾ & PASSPORT",
                                color = Color(0xFF93C5FD),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }
                }

                Text(
                    "Trung Tâm Chia Sẻ Hồ Sơ Y Tế",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )

                Text(
                    "Cấp mã chia sẻ tạm thời và mã PIN bảo mật cho Bác sĩ & Bệnh viện để tra cứu tiền sử bệnh, dị ứng và xét nghiệm liên thông.",
                    fontSize = 12.sp,
                    color = Color(0xFFCBD5E1),
                    lineHeight = 17.sp
                )

                Button(
                    onClick = onOpenShare,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Icon(Icons.Default.VpnKey, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Quản lý mã chia sẻ", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.White)
                }
            }
        }
    }
}

// ==============================================================================
// 2. STATS OVERVIEW STRIP (3 THỐNG KÊ NHƯ BẢN WEB)
// ==============================================================================
@Composable
fun StatsOverviewStrip(
    totalCount: Int,
    defaultProfileName: String?,
    cccdCount: Int
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Stat 1: Tổng số
        Card(
            modifier = Modifier.weight(1f),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0))
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("TỔNG HỒ SƠ", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                Text(
                    "$totalCount",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF0F172A),
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }

        // Stat 2: Hồ sơ chính
        Card(
            modifier = Modifier.weight(1.3f),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0))
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("HỒ SƠ CHÍNH", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF059669))
                Text(
                    defaultProfileName ?: "Chưa chọn",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF047857),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        // Stat 3: Đã gắn CCCD
        Card(
            modifier = Modifier.weight(1f),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0))
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("GẮN CCCD", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF64748B))
                Text(
                    "$cccdCount/$totalCount",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF0F172A),
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
    }
}

// ==============================================================================
// 3. SEARCH & FILTER TOOLBAR
// ==============================================================================
@Composable
fun SearchAndFilterToolbar(
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    relationFilter: String,
    onFilterChange: (String) -> Unit,
    totalCount: Int
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchChange,
                placeholder = { Text("Tìm theo tên, SĐT, số CCCD...", fontSize = 12.sp, color = Color(0xFF94A3B8)) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(18.dp)) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { onSearchChange("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Xóa", tint = Color(0xFF94A3B8), modifier = Modifier.size(16.dp))
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF0F172A),
                    unfocusedBorderColor = Color(0xFFE2E8F0),
                    focusedContainerColor = Color(0xFFF8FAFC),
                    unfocusedContainerColor = Color(0xFFF8FAFC)
                ),
                modifier = Modifier.fillMaxWidth()
            )

            // Filter Chips
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = relationFilter == "ALL",
                        onClick = { onFilterChange("ALL") },
                        label = { Text("Tất cả ($totalCount)", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF0F172A),
                            selectedLabelColor = Color.White
                        )
                    )
                }
                item {
                    FilterChip(
                        selected = relationFilter == "SELF",
                        onClick = { onFilterChange("SELF") },
                        label = { Text("Bản thân", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF0F172A),
                            selectedLabelColor = Color.White
                        )
                    )
                }
                item {
                    FilterChip(
                        selected = relationFilter == "RELATIVE",
                        onClick = { onFilterChange("RELATIVE") },
                        label = { Text("Người thân", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF0F172A),
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }
    }
}

// ==============================================================================
// 4. DETAILED PATIENT PROFILE CARD (ĐẦY ĐỦ THÔNG TIN Y TẾ GIỐNG BẢN WEB)
// ==============================================================================
@Composable
fun DetailedProfileCard(
    profile: PatientProfile,
    enabled: Boolean = true,
    onSetDefault: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onBookAppointment: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(
            width = if (profile.isDefault) 2.dp else 1.dp,
            color = if (profile.isDefault) Color(0xFF10B981) else Color(0xFFE2E8F0)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (profile.isDefault) 3.dp else 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            // Header Row: Avatar, Name, Relationship, Default Badge, Delete
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Circle Avatar with Initial
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(
                            color = if (profile.isDefault) Color(0xFF047857) else Color(0xFF0F172A),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = profile.fullName.take(1).uppercase(),
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        fontSize = 18.sp
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = profile.fullName,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = Color(0xFF0F172A),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(top = 2.dp)
                    ) {
                        Text(
                            text = "Quan hệ: ${profile.displayRelationship}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF64748B)
                        )

                        if (profile.isDefault) {
                            Surface(
                                color = Color(0xFFECFDF5),
                                shape = RoundedCornerShape(6.dp),
                                border = BorderStroke(1.dp, Color(0xFFA7F3D0))
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                                ) {
                                    Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(12.dp))
                                    Text("Hồ sơ chính", color = Color(0xFF047857), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // Delete button
                IconButton(
                    onClick = onDelete,
                    enabled = enabled,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "Xóa", tint = Color(0xFF94A3B8), modifier = Modifier.size(20.dp))
                }
            }

            // Clinical Details Grid
            Surface(
                color = Color(0xFFF8FAFC),
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Row 1: SĐT & Ngày sinh
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Phone, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("SĐT: ", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text(profile.phone ?: "Chưa có", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        }
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Sinh: ", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text(profile.formattedDateOfBirth, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        }
                    }

                    // Row 2: Giới tính & CCCD
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Giới tính: ", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text(profile.displayGender, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        }
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CreditCard, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("CCCD: ", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text(profile.identityCard ?: "Chưa có", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        }
                    }

                    // Thẻ BHYT
                    if (!profile.healthInsurance.isNullOrBlank()) {
                        Divider(color = Color(0xFFE2E8F0), thickness = 0.5.dp)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.HealthAndSafety, contentDescription = null, tint = Color(0xFF059669), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Mã BHYT: ", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text(
                                profile.healthInsurance,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = Color(0xFF047857)
                            )
                        }
                    }

                    // Địa chỉ
                    if (!profile.address.isNullOrBlank()) {
                        Divider(color = Color(0xFFE2E8F0), thickness = 0.5.dp)
                        Row(verticalAlignment = Alignment.Top) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(14.dp).padding(top = 2.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Địa chỉ: ", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text(profile.address, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF0F172A))
                        }
                    }

                    // Tiền sử bệnh
                    if (!profile.medicalHistory.isNullOrBlank()) {
                        Divider(color = Color(0xFFE2E8F0), thickness = 0.5.dp)
                        Row(verticalAlignment = Alignment.Top) {
                            Icon(Icons.Default.MedicalServices, contentDescription = null, tint = Color(0xFF3B82F6), modifier = Modifier.size(14.dp).padding(top = 2.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Tiền sử: ", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text(profile.medicalHistory, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E3A8A))
                        }
                    }

                    // Dị ứng (Cảnh báo đỏ an toàn)
                    if (!profile.allergies.isNullOrBlank()) {
                        Divider(color = Color(0xFFE2E8F0), thickness = 0.5.dp)
                        Row(verticalAlignment = Alignment.Top) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(14.dp).padding(top = 2.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Dị ứng: ", fontSize = 12.sp, color = Color(0xFFDC2626), fontWeight = FontWeight.Bold)
                            Text(profile.allergies, fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFFB91C1C))
                        }
                    }

                    // Khẩn cấp
                    if (!profile.emergencyContact.isNullOrBlank() || !profile.emergencyPhone.isNullOrBlank()) {
                        Divider(color = Color(0xFFE2E8F0), thickness = 0.5.dp)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ContactPhone, contentDescription = null, tint = Color(0xFFD97706), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Khẩn cấp: ", fontSize = 12.sp, color = Color(0xFF64748B))
                            Text(
                                "${profile.emergencyContact ?: ""} (${profile.emergencyPhone ?: "Chưa có"})",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF92400E)
                            )
                        }
                    }
                }
            }

            // Actions Strip
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (!profile.isDefault) {
                        OutlinedButton(
                            onClick = onSetDefault,
                    enabled = enabled,
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            border = BorderStroke(1.dp, Color(0xFFCBD5E1))
                        ) {
                            Text("Đặt làm mặc định", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                        }
                    }

                    OutlinedButton(
                        onClick = onEdit,
                    enabled = enabled,
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        border = BorderStroke(1.dp, Color(0xFFCBD5E1))
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color(0xFF0F172A))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Sửa", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                    }
                }

                Button(
                    onClick = onBookAppointment,
                    enabled = enabled,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A)),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("Đặt khám", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color.White)
                }
            }
        }
    }
}

// ==============================================================================
// 5. EMPTY STATE COMPONENT
// ==============================================================================
@Composable
fun EmptyProfileState(hasFilter: Boolean, onAddNew: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(Icons.Default.PersonOff, contentDescription = null, tint = Color(0xFF94A3B8), modifier = Modifier.size(48.dp))
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                if (hasFilter) "Không tìm thấy hồ sơ phù hợp" else "Chưa có hồ sơ bệnh nhân nào",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = Color(0xFF0F172A)
            )
            Text(
                if (hasFilter) "Vui lòng thử lại với từ khóa hoặc bộ lọc khác." else "Tạo hồ sơ bệnh nhân để đặt lịch khám nhanh chóng và liên thông kết quả y tế.",
                fontSize = 12.sp,
                color = Color(0xFF64748B),
                modifier = Modifier.padding(top = 4.dp),
                lineHeight = 16.sp
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onAddNew,
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Thêm hồ sơ mới", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.White)
            }
        }
    }
}
