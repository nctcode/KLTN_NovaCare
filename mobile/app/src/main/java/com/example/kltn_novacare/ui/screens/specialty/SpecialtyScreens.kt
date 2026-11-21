package com.example.kltn_novacare.ui.screens.specialty

import android.Manifest
import android.app.Application
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.screens.search.location.UserLocationState
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.DoctorViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import com.example.kltn_novacare.ui.viewmodel.SearchViewModel

private val NovaGreen = Color(0xFF009A62)
private val PageBackground = Color(0xFFF5F8F7)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SpecialtyCatalogScreen(
    navController: NavController,
    doctorViewModel: DoctorViewModel
) {
    val specialtiesState by doctorViewModel.specialties.collectAsState()
    var query by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(Unit) { doctorViewModel.loadSpecialties() }

    val specialties = (specialtiesState as? NetworkState.Success)?.data.orEmpty()
    val filtered = remember(specialties, query) {
        specialties.filter { it.name.contains(query.trim(), ignoreCase = true) }
    }

    Scaffold(
        containerColor = PageBackground,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Tất cả chuyên khoa", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                        Text("Chọn chuyên khoa bạn cần khám", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(Modifier.height(14.dp))
            SearchField(
                value = query,
                onValueChange = { query = it },
                placeholder = "Tìm chuyên khoa"
            )
            Spacer(Modifier.height(16.dp))

            when (specialtiesState) {
                NetworkState.Loading, NetworkState.Idle -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NovaGreen)
                }
                is NetworkState.Error -> EmptyMessage(
                    icon = Icons.Outlined.CloudOff,
                    title = "Chưa thể tải chuyên khoa",
                    subtitle = (specialtiesState as NetworkState.Error).message,
                    action = "Thử lại",
                    onAction = { doctorViewModel.loadSpecialties() }
                )
                is NetworkState.Success -> {
                    Text(
                        "${filtered.size} chuyên khoa",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF64748B)
                    )
                    Spacer(Modifier.height(10.dp))
                    if (filtered.isEmpty()) {
                        EmptyMessage(Icons.Outlined.SearchOff, "Không tìm thấy chuyên khoa", "Hãy thử một từ khóa khác")
                    } else {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            contentPadding = PaddingValues(bottom = 24.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(filtered, key = { it.id }) { specialty ->
                                SpecialtyCard(specialty) {
                                    navController.navigate(Screen.SpecialtyResults.createRoute(specialty.id, specialty.name))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SpecialtyResultsScreen(
    navController: NavController,
    specialtyId: String,
    specialtyName: String,
    viewModel: SearchViewModel = viewModel(
        factory = SearchViewModel.Factory(LocalContext.current.applicationContext as Application)
    )
) {
    val state by viewModel.uiState.collectAsState()
    var selectedCategory by rememberSaveable { mutableStateOf(SearchCategory.DOCTOR) }
    var sortMode by rememberSaveable { mutableStateOf(ResultSort.RECOMMENDED) }
    var ratingOnly by rememberSaveable { mutableStateOf(false) }
    var showFilters by rememberSaveable { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        viewModel.onLocationPermissionResult(
            result[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                result[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        )
    }

    fun requestLocation() {
        viewModel.requestNearestLocation {
            permissionLauncher.launch(
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
            )
        }
    }

    LaunchedEffect(specialtyId) {
        viewModel.showSpecialtyResults(specialtyId, SearchCategory.DOCTOR)
        requestLocation()
    }

    LaunchedEffect(state.locationState) {
        if (state.locationState is UserLocationState.Available && !state.filters.isNearMe) {
            viewModel.applyDraftFilters()
        }
    }

    val doctors = remember(state.doctors, sortMode, ratingOnly) {
        state.doctors
            .filter { !ratingOnly || it.rating >= 4.5 }
            .sortedFor(sortMode) { Triple(it.rating, it.reviewCount, it.distanceKm) }
    }
    val facilities = remember(state.facilities, sortMode, ratingOnly) {
        state.facilities
            .filter { !ratingOnly || it.rating >= 4.5 }
            .sortedFor(sortMode) { Triple(it.rating, it.reviewCount, it.distanceKm) }
    }

    if (showFilters) {
        FilterSheet(
            selectedSort = sortMode,
            ratingOnly = ratingOnly,
            onDismiss = { showFilters = false },
            onApply = { sort, highRating ->
                sortMode = sort
                ratingOnly = highRating
                showFilters = false
                if (sort == ResultSort.NEAREST && !state.filters.isNearMe) requestLocation()
            }
        )
    }

    Scaffold(
        containerColor = PageBackground,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(specialtyName, fontWeight = FontWeight.Bold, fontSize = 19.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text("Chọn nơi khám phù hợp với bạn", fontSize = 12.sp, color = Color(0xFF64748B))
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            Column(Modifier.background(Color.White).padding(horizontal = 16.dp)) {
                SearchField(
                    value = state.query,
                    onValueChange = viewModel::onQueryChanged,
                    placeholder = if (selectedCategory == SearchCategory.DOCTOR) "Tìm bác sĩ" else "Tìm bệnh viện, phòng khám",
                    trailing = {
                        BadgedBox(
                            badge = {
                                if (ratingOnly || sortMode != ResultSort.RECOMMENDED) Badge(containerColor = NovaGreen)
                            }
                        ) {
                            IconButton(onClick = { showFilters = true }) {
                                Icon(Icons.Outlined.Tune, contentDescription = "Bộ lọc", tint = NovaGreen)
                            }
                        }
                    }
                )
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth().background(Color(0xFFF0F5F3), RoundedCornerShape(12.dp)).padding(4.dp)
                ) {
                    ResultTab("Bác sĩ", Icons.Outlined.MedicalServices, selectedCategory == SearchCategory.DOCTOR, Modifier.weight(1f)) {
                        selectedCategory = SearchCategory.DOCTOR
                        viewModel.showSpecialtyResults(specialtyId, SearchCategory.DOCTOR)
                    }
                    ResultTab("Cơ sở y tế", Icons.Outlined.LocalHospital, selectedCategory == SearchCategory.HOSPITAL, Modifier.weight(1f)) {
                        selectedCategory = SearchCategory.HOSPITAL
                        viewModel.showSpecialtyResults(specialtyId, SearchCategory.HOSPITAL)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = state.filters.isNearMe,
                        onClick = {
                            if (state.filters.isNearMe) viewModel.disableNearestLocation() else requestLocation()
                        },
                        label = {
                            Text(if (state.locationState is UserLocationState.Locating) "Đang định vị..." else "Gần tôi")
                        },
                        leadingIcon = { Icon(Icons.Outlined.NearMe, null, Modifier.size(16.dp)) }
                    )
                    AssistChip(
                        onClick = { showFilters = true },
                        label = { Text(sortMode.label) },
                        leadingIcon = { Icon(Icons.Outlined.SwapVert, null, Modifier.size(16.dp)) }
                    )
                }
                Spacer(Modifier.height(10.dp))
            }

            val resultCount = if (selectedCategory == SearchCategory.DOCTOR) doctors.size else facilities.size
            Text(
                "$resultCount kết quả phù hợp",
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                fontWeight = FontWeight.SemiBold,
                fontSize = 13.sp,
                color = Color(0xFF475569)
            )

            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NovaGreen)
                }
                state.errorMessage != null -> EmptyMessage(
                    Icons.Outlined.CloudOff,
                    "Không thể tải kết quả",
                    state.errorMessage.orEmpty(),
                    "Thử lại",
                    { viewModel.performSearch() }
                )
                resultCount == 0 -> EmptyMessage(
                    Icons.Outlined.SearchOff,
                    "Chưa có kết quả phù hợp",
                    "Bạn có thể đổi từ khóa hoặc bộ lọc"
                )
                else -> LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 28.dp)
                ) {
                    if (selectedCategory == SearchCategory.DOCTOR) {
                        items(doctors, key = { it.id }) { doctor ->
                            DoctorResultCard(doctor) {
                                val workplace = doctor.workPlaces?.firstOrNull { it.specialtyId == specialtyId || it.specialty?.id == specialtyId }
                                    ?: doctor.workPlaces?.firstOrNull()
                                if (workplace != null) {
                                    navController.navigate(Screen.Booking.createRoute(doctor.id, workplace.id))
                                } else {
                                    navController.navigate(Screen.DoctorDetail.createRoute(doctor.id))
                                }
                            }
                        }
                    } else {
                        items(facilities, key = { it.id }) { facility ->
                            FacilityResultCard(facility) {
                                navController.navigate(Screen.HospitalBooking.createRoute(facility.id, specialtyId))
                            }
                        }
                    }
                    val hasMore = if (selectedCategory == SearchCategory.DOCTOR) state.doctorHasMore else state.facilityHasMore
                    if (hasMore) {
                        item {
                            OutlinedButton(
                                onClick = viewModel::loadMore,
                                enabled = !state.isLoadingMore,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                if (state.isLoadingMore) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                                else Text("Xem thêm kết quả")
                            }
                        }
                    }
                }
            }
        }
    }
}

private enum class ResultSort(val label: String) {
    RECOMMENDED("Phù hợp nhất"), NEAREST("Gần nhất"), RATING("Đánh giá cao"), MOST_REVIEWED("Nhiều đánh giá")
}

private fun <T> List<T>.sortedFor(
    sort: ResultSort,
    values: (T) -> Triple<Double, Int, Double?>
): List<T> = when (sort) {
    ResultSort.RECOMMENDED -> this
    ResultSort.NEAREST -> sortedBy { values(it).third ?: Double.MAX_VALUE }
    ResultSort.RATING -> sortedByDescending { values(it).first }
    ResultSort.MOST_REVIEWED -> sortedByDescending { values(it).second }
}

@Composable
private fun SpecialtyCard(specialty: Specialty, onClick: () -> Unit) {
    val (icon, color) = specialtyVisual(specialty.name)
    Card(
        modifier = Modifier.fillMaxWidth().height(142.dp).clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFE5ECE9)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(Modifier.padding(14.dp)) {
            Box(Modifier.size(44.dp).background(color.copy(alpha = .11f), RoundedCornerShape(13.dp)), contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.height(10.dp))
            Text(specialty.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF17211D), maxLines = 2, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.weight(1f))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Xem bác sĩ & cơ sở", fontSize = 11.sp, color = NovaGreen, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.width(3.dp))
                Icon(Icons.Default.ChevronRight, null, tint = NovaGreen, modifier = Modifier.size(15.dp))
            }
        }
    }
}

@Composable
private fun DoctorResultCard(doctor: SearchDoctorItem, onBook: () -> Unit) {
    ResultCard {
        Row(verticalAlignment = Alignment.Top) {
            Box(Modifier.size(68.dp).clip(CircleShape).background(Color(0xFFE8F3EF)), contentAlignment = Alignment.Center) {
                if (!doctor.avatarUrl.isNullOrBlank()) AsyncImage(doctor.avatarUrl, doctor.fullName, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                else Icon(Icons.Default.Person, null, tint = NovaGreen, modifier = Modifier.size(34.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(doctor.displayTitle, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF17211D), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(doctor.displaySpecialties, fontSize = 12.sp, color = NovaGreen, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(5.dp))
                RatingLine(doctor.rating, doctor.reviewCount)
            }
        }
        Spacer(Modifier.height(10.dp))
        HorizontalDivider(color = Color(0xFFEDF1EF))
        Spacer(Modifier.height(9.dp))
        InfoLine(Icons.Outlined.LocationOn, doctor.nearestFacilityName ?: doctor.hospital?.name ?: doctor.workPlaces?.firstOrNull()?.hospital?.name ?: "Cơ sở NovaCare")
        doctor.distanceKm?.let { InfoLine(Icons.Outlined.NearMe, "Cách ${formatDistance(it)}") }
        Spacer(Modifier.height(10.dp))
        Button(
            onClick = onBook,
            modifier = Modifier.fillMaxWidth().height(42.dp),
            colors = ButtonDefaults.buttonColors(containerColor = NovaGreen),
            shape = RoundedCornerShape(12.dp)
        ) { Text("Chọn bác sĩ", fontWeight = FontWeight.Bold) }
    }
}

@Composable
private fun FacilityResultCard(facility: SearchFacilityItem, onSelect: () -> Unit) {
    ResultCard {
        Row(verticalAlignment = Alignment.Top) {
            Box(Modifier.size(72.dp).clip(RoundedCornerShape(14.dp)).background(Color(0xFFE8F3EF)), contentAlignment = Alignment.Center) {
                val image = facility.logoUrl ?: facility.coverImageUrl
                if (!image.isNullOrBlank()) AsyncImage(image, facility.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                else Icon(Icons.Default.LocalHospital, null, tint = NovaGreen, modifier = Modifier.size(34.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(facility.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF17211D), maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(5.dp))
                RatingLine(facility.rating, facility.reviewCount)
            }
        }
        Spacer(Modifier.height(10.dp))
        InfoLine(Icons.Outlined.LocationOn, facility.displayAddress)
        facility.distanceKm?.let { InfoLine(Icons.Outlined.NearMe, "Cách ${formatDistance(it)}") }
        Spacer(Modifier.height(10.dp))
        Button(
            onClick = onSelect,
            modifier = Modifier.fillMaxWidth().height(42.dp),
            colors = ButtonDefaults.buttonColors(containerColor = NovaGreen),
            shape = RoundedCornerShape(12.dp)
        ) { Text("Chọn cơ sở", fontWeight = FontWeight.Bold) }
    }
}

@Composable
private fun ResultCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFE2EAE6)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) { Column(Modifier.padding(14.dp), content = content) }
}

@Composable
private fun RatingLine(rating: Double, reviews: Int) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Default.Star, null, tint = Color(0xFFF5A623), modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(3.dp))
        Text(String.format(java.util.Locale.US, "%.1f", if (rating > 0) rating else 5.0), fontWeight = FontWeight.Bold, fontSize = 12.sp)
        Spacer(Modifier.width(5.dp))
        Text("($reviews đánh giá)", fontSize = 12.sp, color = Color(0xFF64748B))
    }
}

@Composable
private fun InfoLine(icon: ImageVector, text: String) {
    Row(Modifier.padding(vertical = 2.dp), verticalAlignment = Alignment.Top) {
        Icon(icon, null, tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(text, fontSize = 12.sp, color = Color(0xFF52615B), maxLines = 2, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun SearchField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    trailing: @Composable (() -> Unit)? = null
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, fontSize = 14.sp) },
        leadingIcon = { Icon(Icons.Outlined.Search, null, tint = Color(0xFF64748B)) },
        trailingIcon = trailing,
        singleLine = true,
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = NovaGreen,
            unfocusedBorderColor = Color(0xFFDCE5E1),
            focusedContainerColor = Color.White,
            unfocusedContainerColor = Color.White
        ),
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
private fun ResultTab(label: String, icon: ImageVector, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Row(
        modifier = modifier.clip(RoundedCornerShape(9.dp)).background(if (selected) Color.White else Color.Transparent).clickable(onClick = onClick).padding(vertical = 10.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = if (selected) NovaGreen else Color(0xFF64748B), modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(6.dp))
        Text(label, fontSize = 13.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium, color = if (selected) NovaGreen else Color(0xFF64748B))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterSheet(
    selectedSort: ResultSort,
    ratingOnly: Boolean,
    onDismiss: () -> Unit,
    onApply: (ResultSort, Boolean) -> Unit
) {
    var draftSort by remember(selectedSort) { mutableStateOf(selectedSort) }
    var draftRating by remember(ratingOnly) { mutableStateOf(ratingOnly) }
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = Color.White) {
        Column(Modifier.padding(horizontal = 20.dp).navigationBarsPadding()) {
            Text("Sắp xếp & bộ lọc", fontWeight = FontWeight.Bold, fontSize = 20.sp)
            Text("Tùy chỉnh danh sách phù hợp với nhu cầu", color = Color(0xFF64748B), fontSize = 13.sp)
            Spacer(Modifier.height(18.dp))
            Text("Sắp xếp theo", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            ResultSort.entries.forEach { option ->
                Row(Modifier.fillMaxWidth().clickable { draftSort = option }.padding(vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = draftSort == option, onClick = { draftSort = option }, colors = RadioButtonDefaults.colors(selectedColor = NovaGreen))
                    Text(option.label, fontSize = 14.sp)
                }
            }
            HorizontalDivider(Modifier.padding(vertical = 8.dp), color = Color(0xFFE5ECE9))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Đánh giá từ 4,5 sao", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text("Chỉ hiện bác sĩ, cơ sở được đánh giá cao", fontSize = 12.sp, color = Color(0xFF64748B))
                }
                Switch(checked = draftRating, onCheckedChange = { draftRating = it }, colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = NovaGreen))
            }
            Spacer(Modifier.height(18.dp))
            Button(
                onClick = { onApply(draftSort, draftRating) },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NovaGreen)
            ) { Text("Áp dụng", fontWeight = FontWeight.Bold) }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun EmptyMessage(
    icon: ImageVector,
    title: String,
    subtitle: String,
    action: String? = null,
    onAction: (() -> Unit)? = null
) {
    Column(Modifier.fillMaxSize().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Box(Modifier.size(64.dp).background(Color(0xFFE8F3EF), CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, null, tint = NovaGreen, modifier = Modifier.size(30.dp))
        }
        Spacer(Modifier.height(14.dp))
        Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Spacer(Modifier.height(5.dp))
        Text(subtitle, color = Color(0xFF64748B), fontSize = 13.sp)
        if (action != null && onAction != null) {
            TextButton(onClick = onAction) { Text(action, color = NovaGreen, fontWeight = FontWeight.Bold) }
        }
    }
}

private fun specialtyVisual(name: String): Pair<ImageVector, Color> {
    val value = name.lowercase()
    return when {
        "tim" in value -> Icons.Outlined.FavoriteBorder to Color(0xFFE11D48)
        "mắt" in value || "nhãn" in value -> Icons.Outlined.Visibility to Color(0xFF0D9488)
        "xương" in value -> Icons.Outlined.AccessibilityNew to Color(0xFF7C3AED)
        "thần kinh" in value -> Icons.Outlined.Psychology to Color(0xFF4F46E5)
        "sản" in value || "nhi" in value -> Icons.Outlined.ChildCare to Color(0xFFDB2777)
        "hô hấp" in value || "phổi" in value -> Icons.Outlined.Air to Color(0xFF0284C7)
        "y học cổ" in value -> Icons.Outlined.Spa to Color(0xFFD97706)
        else -> Icons.Outlined.HealthAndSafety to NovaGreen
    }
}
