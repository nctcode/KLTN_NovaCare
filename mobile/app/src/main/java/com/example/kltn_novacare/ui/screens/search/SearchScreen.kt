package com.example.kltn_novacare.ui.screens.search

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.kltn_novacare.data.model.SearchCategory
import com.example.kltn_novacare.ui.screens.search.components.*
import com.example.kltn_novacare.ui.screens.search.filter.SearchFilterSheet
import com.example.kltn_novacare.ui.screens.search.location.UserLocationState
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.SearchViewModel

@Composable
fun SearchScreen(
    onNavigateBack: () -> Unit,
    onNavigateToDoctor: (String) -> Unit = {},
    onNavigateToBooking: (String) -> Unit = {},
    onNavigateToFacility: (String) -> Unit = {},
    viewModel: SearchViewModel = run {
        val app = androidx.compose.ui.platform.LocalContext.current.applicationContext as android.app.Application
        viewModel(factory = SearchViewModel.Factory(app))
    }
) {
    val uiState by viewModel.uiState.collectAsState()

    // Permission Launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        viewModel.onLocationPermissionResult(granted)
    }

    var showPermissionRationaleDialog by remember { mutableStateOf(false) }
    var showGpsDisabledDialog by remember { mutableStateOf(false) }

    LaunchedEffect(uiState.locationState) {
        when (uiState.locationState) {
            is UserLocationState.LocationDisabled -> showGpsDisabledDialog = true
            is UserLocationState.PermissionDenied -> showPermissionRationaleDialog = true
            else -> Unit
        }
    }

    Scaffold(
        topBar = {
            NovaSearchHeader(
                query = uiState.query,
                category = uiState.category,
                onQueryChange = viewModel::onQueryChanged,
                onSearchAction = {
                    viewModel.saveCurrentQueryToHistory()
                    viewModel.performSearch(resetPagination = true)
                },
                onCloseClick = onNavigateBack
            )
        },
        containerColor = Background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Category Tabs Bar
            SearchCategoryTabs(
                selectedCategory = uiState.category,
                onCategorySelected = viewModel::onCategorySelected,
                activeFilterCount = uiState.filters.activeCount,
                onFilterClick = viewModel::openFilterSheet
            )

            // Active Filter Chips
            ActiveFilterChips(
                filters = uiState.filters,
                specialties = uiState.popularData?.popularSpecialties ?: emptyList(),
                onRemoveChip = viewModel::removeFilterChip,
                onClearAll = viewModel::clearFilters
            )

            // Content Body
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
            ) {
                when {
                    // Empty query & no filters -> Show History & Popular
                    uiState.isQueryEmpty && !uiState.filters.hasActiveFilters() -> {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                        ) {
                            RecentSearchSection(
                                recentSearches = uiState.recentSearches,
                                onItemClick = viewModel::onRecentQueryClicked,
                                onRemoveItem = viewModel::removeRecentQuery,
                                onClearAll = viewModel::clearRecentQueries
                            )

                            HorizontalDivider(color = Color(0xFFF1F5F9))

                            PopularSearchSection(
                                popularData = uiState.popularData,
                                onSpecialtyClick = { spec ->
                                    viewModel.onQueryChanged(spec.name)
                                    viewModel.saveCurrentQueryToHistory()
                                },
                                onFacilityClick = { fac ->
                                    onNavigateToFacility(fac.id)
                                }
                            )
                        }
                    }

                    // Loading State
                    uiState.isLoading -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                CircularProgressIndicator(color = Primary)
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "Đang tìm kiếm cơ sở y tế & bác sĩ...",
                                    fontSize = 13.sp,
                                    color = TextMuted
                                )
                            }
                        }
                    }

                    // Error State
                    uiState.errorMessage != null -> {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.ErrorOutline,
                                    contentDescription = null,
                                    tint = Danger,
                                    modifier = Modifier.size(48.dp)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = uiState.errorMessage ?: "Đã xảy ra lỗi",
                                    fontSize = 14.sp,
                                    color = TextPrimary,
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = { viewModel.performSearch(resetPagination = true) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                                ) {
                                    Text(text = "Thử lại", color = Color.White)
                                }
                            }
                        }
                    }

                    // Empty Results State
                    uiState.showEmptyState -> {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier
                                        .size(72.dp)
                                        .clip(CircleShape)
                                        .background(PrimaryLight),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.SearchOff,
                                        contentDescription = null,
                                        tint = Primary,
                                        modifier = Modifier.size(36.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "Không tìm thấy kết quả phù hợp",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Thử tìm kiếm với từ khóa khác hoặc bỏ bớt các bộ lọc để có nhiều kết quả hơn.",
                                    fontSize = 13.sp,
                                    color = TextMuted,
                                    textAlign = TextAlign.Center
                                )
                                if (uiState.filters.hasActiveFilters()) {
                                    Spacer(modifier = Modifier.height(16.dp))
                                    OutlinedButton(
                                        onClick = viewModel::clearFilters,
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text(text = "Xóa tất cả bộ lọc", color = Primary)
                                    }
                                }
                            }
                        }
                    }

                    // Results Display
                    else -> {
                        when (uiState.category) {
                            SearchCategory.ALL -> {
                                val grouped = uiState.groupedData
                                if (grouped != null) {
                                    LazyColumn(
                                        modifier = Modifier.fillMaxSize(),
                                        contentPadding = PaddingValues(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(16.dp)
                                    ) {
                                        // DOCTORS SECTION
                                        if (grouped.doctors.isNotEmpty()) {
                                            item {
                                                SectionHeader(
                                                    title = "Bác sĩ",
                                                    count = grouped.doctorsCount,
                                                    onSeeAll = { viewModel.onCategorySelected(SearchCategory.DOCTOR) }
                                                )
                                            }
                                            items(grouped.doctors.take(3)) { doc ->
                                                DoctorSearchItem(
                                                    doctor = doc,
                                                    onClick = { onNavigateToDoctor(doc.id) },
                                                    onBookClick = { onNavigateToBooking(doc.id) }
                                                )
                                                Spacer(modifier = Modifier.height(10.dp))
                                            }
                                        }

                                        // HOSPITALS SECTION
                                        if (grouped.hospitals.isNotEmpty()) {
                                            item {
                                                SectionHeader(
                                                    title = "Bệnh viện",
                                                    count = grouped.hospitalsCount,
                                                    onSeeAll = { viewModel.onCategorySelected(SearchCategory.HOSPITAL) }
                                                )
                                            }
                                            items(grouped.hospitals.take(3)) { hosp ->
                                                FacilitySearchItem(
                                                    facility = hosp,
                                                    onClick = { onNavigateToFacility(hosp.id) }
                                                )
                                                Spacer(modifier = Modifier.height(10.dp))
                                            }
                                        }

                                        // CLINICS SECTION
                                        if (grouped.clinics.isNotEmpty()) {
                                            item {
                                                SectionHeader(
                                                    title = "Phòng khám",
                                                    count = grouped.clinicsCount,
                                                    onSeeAll = { viewModel.onCategorySelected(SearchCategory.CLINIC) }
                                                )
                                            }
                                            items(grouped.clinics.take(3)) { clinic ->
                                                FacilitySearchItem(
                                                    facility = clinic,
                                                    onClick = { onNavigateToFacility(clinic.id) }
                                                )
                                                Spacer(modifier = Modifier.height(10.dp))
                                            }
                                        }

                                        // SPECIALTIES SECTION
                                        if (grouped.specialties.isNotEmpty()) {
                                            item {
                                                SectionHeader(
                                                    title = "Chuyên khoa",
                                                    count = grouped.specialtiesCount,
                                                    onSeeAll = { viewModel.onCategorySelected(SearchCategory.SPECIALTY) }
                                                )
                                            }
                                            items(grouped.specialties.take(3)) { spec ->
                                                SpecialtySearchItem(
                                                    specialty = spec,
                                                    onClick = {
                                                        viewModel.onCategorySelected(SearchCategory.DOCTOR)
                                                        viewModel.updateDraftFilters { cur ->
                                                            cur.copy(selectedSpecialtyIds = setOf(spec.id))
                                                        }
                                                        viewModel.applyDraftFilters()
                                                    }
                                                )
                                                Spacer(modifier = Modifier.height(10.dp))
                                            }
                                        }
                                    }
                                }
                            }

                            SearchCategory.DOCTOR -> {
                                val listState = rememberLazyListState()
                                val shouldLoadMore = remember {
                                    derivedStateOf {
                                        val totalItems = listState.layoutInfo.totalItemsCount
                                        val lastVisibleItem = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
                                        totalItems > 0 && lastVisibleItem >= totalItems - 3
                                    }
                                }

                                LaunchedEffect(shouldLoadMore.value) {
                                    if (shouldLoadMore.value && uiState.doctorHasMore && !uiState.isLoadingMore) {
                                        viewModel.loadMore()
                                    }
                                }

                                LazyColumn(
                                    state = listState,
                                    modifier = Modifier.fillMaxSize(),
                                    contentPadding = PaddingValues(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    items(uiState.doctors, key = { it.id }) { doc ->
                                        DoctorSearchItem(
                                            doctor = doc,
                                            onClick = { onNavigateToDoctor(doc.id) },
                                            onBookClick = { onNavigateToBooking(doc.id) }
                                        )
                                    }

                                    if (uiState.isLoadingMore) {
                                        item {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(16.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                CircularProgressIndicator(
                                                    modifier = Modifier.size(24.dp),
                                                    strokeWidth = 2.dp,
                                                    color = Primary
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            SearchCategory.HOSPITAL, SearchCategory.CLINIC -> {
                                val listState = rememberLazyListState()
                                val shouldLoadMore = remember {
                                    derivedStateOf {
                                        val totalItems = listState.layoutInfo.totalItemsCount
                                        val lastVisibleItem = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
                                        totalItems > 0 && lastVisibleItem >= totalItems - 3
                                    }
                                }

                                LaunchedEffect(shouldLoadMore.value) {
                                    if (shouldLoadMore.value && uiState.facilityHasMore && !uiState.isLoadingMore) {
                                        viewModel.loadMore()
                                    }
                                }

                                LazyColumn(
                                    state = listState,
                                    modifier = Modifier.fillMaxSize(),
                                    contentPadding = PaddingValues(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    items(uiState.facilities, key = { it.id }) { fac ->
                                        FacilitySearchItem(
                                            facility = fac,
                                            onClick = { onNavigateToFacility(fac.id) }
                                        )
                                    }

                                    if (uiState.isLoadingMore) {
                                        item {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(16.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                CircularProgressIndicator(
                                                    modifier = Modifier.size(24.dp),
                                                    strokeWidth = 2.dp,
                                                    color = Primary
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            SearchCategory.SPECIALTY -> {
                                LazyColumn(
                                    modifier = Modifier.fillMaxSize(),
                                    contentPadding = PaddingValues(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    items(uiState.specialties, key = { it.id }) { spec ->
                                        SpecialtySearchItem(
                                            specialty = spec,
                                            onClick = {
                                                viewModel.onCategorySelected(SearchCategory.DOCTOR)
                                                viewModel.updateDraftFilters { cur ->
                                                    cur.copy(selectedSpecialtyIds = setOf(spec.id))
                                                }
                                                viewModel.applyDraftFilters()
                                            }
                                        )
                                    }
                                }
                            }

                            SearchCategory.SERVICE -> Unit
                        }
                    }
                }
            }
        }
    }

    // Filter Sheet Modal
    SearchFilterSheet(
        isVisible = uiState.isFilterSheetVisible,
        filters = uiState.draftFilters,
        locations = uiState.locations,
        specialties = uiState.popularData?.popularSpecialties ?: emptyList(),
        locationState = uiState.locationState,
        onDismiss = viewModel::closeFilterSheet,
        onUpdateFilters = viewModel::updateDraftFilters,
        onRequestNearMe = {
            viewModel.requestNearestLocation {
                permissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    )
                )
            }
        },
        onApply = viewModel::applyDraftFilters,
        onReset = viewModel::clearFilters
    )

    // Location Permission Rationale Dialog
    if (showPermissionRationaleDialog) {
        AlertDialog(
            onDismissRequest = { showPermissionRationaleDialog = false },
            title = {
                Text(
                    text = "Quyền truy cập vị trí",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )
            },
            text = {
                Text(
                    text = "NovaCare cần quyền truy cập vị trí để tìm kiếm các cơ sở y tế và bác sĩ gần bạn nhất.",
                    fontSize = 14.sp,
                    color = TextPrimary
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showPermissionRationaleDialog = false
                        viewModel.locationHelper.openAppSettings()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) {
                    Text(text = "Cài đặt ứng dụng", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showPermissionRationaleDialog = false }) {
                    Text(text = "Để sau", color = TextMuted)
                }
            }
        )
    }

    // GPS Disabled Dialog
    if (showGpsDisabledDialog) {
        AlertDialog(
            onDismissRequest = { showGpsDisabledDialog = false },
            title = {
                Text(
                    text = "Bật định vị GPS",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )
            },
            text = {
                Text(
                    text = "Dịch vụ định vị trên thiết bị của bạn đang tắt. Vui lòng bật GPS để tìm kiếm cơ sở y tế gần bạn.",
                    fontSize = 14.sp,
                    color = TextPrimary
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showGpsDisabledDialog = false
                        viewModel.locationHelper.openLocationSettings()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) {
                    Text(text = "Bật GPS", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showGpsDisabledDialog = false }) {
                    Text(text = "Để sau", color = TextMuted)
                }
            }
        )
    }
}

@Composable
private fun SectionHeader(
    title: String,
    count: Int,
    onSeeAll: () -> Unit
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Spacer(modifier = Modifier.width(6.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(PrimaryLight)
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = count.toString(),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryDark
                )
            }
        }

        Text(
            text = "Xem tất cả ›",
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = Primary,
            modifier = Modifier
                .clickable { onSeeAll() }
                .padding(vertical = 4.dp, horizontal = 2.dp)
        )
    }
}
