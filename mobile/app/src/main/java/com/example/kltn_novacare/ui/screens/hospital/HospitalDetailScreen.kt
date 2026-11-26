package com.example.kltn_novacare.ui.screens.hospital

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.Hospital
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.screens.booking.getAvailableBookingModesForHospital
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.HospitalDetailUiState
import com.example.kltn_novacare.ui.viewmodel.HospitalDetailViewModel

internal val HospitalEmeraldDark = Color(0xFF064E3B)
internal val HospitalEmerald = Color(0xFF0C4B39)
internal val HospitalEmeraldLight = Color(0xFFECFDF5)
internal val HospitalEmeraldBorder = Color(0xFFA7F3D0)

private enum class HospitalTab(val id: String, val label: String, val icon: ImageVector) {
    OVERVIEW("overview", "Tổng quan", Icons.Default.AutoAwesome),
    INFO("info", "Thông tin chi tiết", Icons.Default.Info),
    BRANCHES("branches", "Chi nhánh", Icons.Default.Apartment),
    DOCTORS("doctors", "Bác sĩ", Icons.Default.MedicalServices),
    SPECIALTIES("specialties", "Chuyên khoa", Icons.Default.LocalHospital),
    REVIEWS("reviews", "Đánh giá", Icons.Default.Star)
}

@Composable
fun HospitalDetailScreen(
    hospitalId: String,
    navController: NavController,
    viewModel: HospitalDetailViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(hospitalId) {
        viewModel.loadHospitalDetail(hospitalId)
    }

    when {
        uiState.isLoading && uiState.hospital == null -> {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Background),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Primary, strokeWidth = 3.dp)
                    Spacer(Modifier.height(14.dp))
                    Text(
                        "Đang tải thông tin cơ sở y tế...",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextSecondary
                    )
                }
            }
        }

        uiState.error != null && uiState.hospital == null -> {
            HospitalDetailErrorView(
                message = uiState.error ?: "Không tìm thấy cơ sở y tế",
                onBack = { navController.popBackStack() },
                onRetry = { viewModel.loadHospitalDetail(hospitalId, forceRefresh = true) }
            )
        }

        uiState.hospital != null -> {
            HospitalDetailBody(
                uiState = uiState,
                hospital = uiState.hospital!!,
                navController = navController
            )
        }
    }
}

@Composable
private fun HospitalDetailErrorView(
    message: String,
    onBack: () -> Unit,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(76.dp)
                .background(StatusErrorBg, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.Default.LocalHospital,
                contentDescription = null,
                tint = StatusErrorText,
                modifier = Modifier.size(36.dp)
            )
        }
        Spacer(Modifier.height(16.dp))
        Text(
            "Không tìm thấy cơ sở y tế",
            fontWeight = FontWeight.ExtraBold,
            fontSize = 18.sp,
            color = TextPrimary
        )
        Spacer(Modifier.height(6.dp))
        Text(
            message,
            color = TextSecondary,
            fontSize = 13.sp,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(20.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedButton(
                onClick = onBack,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Border)
            ) {
                Text("Quay lại", color = TextPrimary, fontWeight = FontWeight.Bold)
            }
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(containerColor = HospitalEmerald),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Thử lại", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun HospitalDetailBody(
    uiState: HospitalDetailUiState,
    hospital: Hospital,
    navController: NavController
) {
    val context = LocalContext.current
    var selectedTabId by rememberSaveable(hospital.id) { mutableStateOf(HospitalTab.OVERVIEW.id) }
    val selectedTab = HospitalTab.entries.find { it.id == selectedTabId } ?: HospitalTab.OVERVIEW

    var showBookingModeModal by remember { mutableStateOf(false) }
    var lightboxIndex by remember { mutableStateOf<Int?>(null) }

    val galleryImages = remember(hospital.images) {
        hospital.images.orEmpty().filter { it.isNotBlank() }
    }
    val phoneNumber = remember(hospital.hotline, hospital.phone) {
        hospital.hotline?.takeIf { it.isNotBlank() } ?: hospital.phone?.takeIf { it.isNotBlank() }
    }

    Scaffold(
        containerColor = Background,
        bottomBar = {
            HospitalDetailBottomBar(
                phoneNumber = phoneNumber,
                onCallClick = { phoneNumber?.let { dialPhone(context, it) } },
                onBookClick = { showBookingModeModal = true }
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding()),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            // 1. Hero Banner + Overlapping Summary Card
            item {
                HospitalHeroAndSummary(
                    hospital = hospital,
                    doctorCount = uiState.doctors.size,
                    reviewCount = uiState.reviewStats?.totalReviews?.takeIf { it > 0 } ?: (hospital.reviewCount ?: 0),
                    averageRating = uiState.reviewStats?.averageRating?.takeIf { it > 0.0 } ?: (hospital.rating ?: 4.8),
                    onBack = { navController.popBackStack() },
                    onAddressClick = { openGoogleMaps(context, hospital.googleMapUrl, hospital.latitude, hospital.longitude, hospital.displayAddress) },
                    onPhoneClick = { phoneNumber?.let { dialPhone(context, it) } }
                )
            }

            // 2. Horizontal Tabs Navigation Strip
            item {
                HospitalTabsBar(
                    selectedTab = selectedTab,
                    branchesCount = uiState.branches.size,
                    doctorsCount = uiState.doctors.size,
                    specialtiesCount = uiState.specialties.size,
                    reviewsCount = uiState.reviewStats?.totalReviews?.takeIf { it > 0 } ?: (hospital.reviewCount ?: 0),
                    onSelect = { selectedTabId = it.id }
                )
            }

            // 3. Active Tab Body
            item {
                Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                    when (selectedTab) {
                        HospitalTab.OVERVIEW -> HospitalOverviewTab(
                            hospital = hospital,
                            doctorsCount = uiState.doctors.size,
                            specialtiesCount = uiState.specialties.size,
                            branchesCount = uiState.branches.size,
                            services = uiState.services,
                            galleryImages = galleryImages,
                            onImageClick = { idx -> lightboxIndex = idx },
                            onViewAllDoctors = { selectedTabId = HospitalTab.DOCTORS.id },
                            onViewAllSpecialties = { selectedTabId = HospitalTab.SPECIALTIES.id }
                        )

                        HospitalTab.INFO -> HospitalInfoTab(
                            hospital = hospital,
                            branchesCount = uiState.branches.size,
                            doctorsCount = uiState.doctors.size,
                            onDialPhone = { dialPhone(context, it) },
                            onSendEmail = { openEmail(context, it) },
                            onOpenWebsite = { openUrl(context, it) },
                            onOpenMaps = {
                                openGoogleMaps(
                                    context,
                                    hospital.googleMapUrl,
                                    hospital.latitude,
                                    hospital.longitude,
                                    hospital.displayAddress
                                )
                            }
                        )

                        HospitalTab.BRANCHES -> HospitalBranchesTab(
                            branches = uiState.branches,
                            onDialPhone = { dialPhone(context, it) },
                            onOpenMap = { br ->
                                openGoogleMaps(context, br.mapEmbedUrl, br.latitude, br.longitude, br.address)
                            },
                            onBookAtBranch = {
                                showBookingModeModal = true
                            }
                        )

                        HospitalTab.DOCTORS -> HospitalDoctorsTab(
                            doctors = uiState.doctors,
                            specialties = uiState.specialties,
                            hospitalId = hospital.id,
                            onDoctorDetailClick = { docId ->
                                navController.navigate(Screen.DoctorDetail.createRoute(docId))
                            },
                            onBookDoctorClick = { doc, wp ->
                                if (wp != null && wp.id.isNotBlank()) {
                                    navController.navigate(Screen.Booking.createRoute(doc.id, wp.id))
                                } else {
                                    navController.navigate(
                                        Screen.HospitalBooking.createRoute(
                                            hospitalId = hospital.id,
                                            doctorId = doc.id,
                                            mode = "DOCTOR"
                                        )
                                    )
                                }
                            }
                        )

                        HospitalTab.SPECIALTIES -> HospitalSpecialtiesTab(
                            specialties = uiState.specialties,
                            onBookSpecialty = { spec ->
                                navController.navigate(
                                    Screen.HospitalBooking.createRoute(
                                        hospitalId = hospital.id,
                                        specialtyId = spec.id,
                                        specialtyName = spec.name
                                    )
                                )
                            }
                        )

                        HospitalTab.REVIEWS -> HospitalReviewsTab(
                            hospital = hospital,
                            stats = uiState.reviewStats,
                            reviews = uiState.reviews
                        )
                    }
                }
            }
        }
    }

    // Full-screen Gallery Lightbox
    lightboxIndex?.let { startIndex ->
        if (galleryImages.isNotEmpty()) {
            GalleryLightboxDialog(
                images = galleryImages,
                initialIndex = startIndex,
                hospitalName = hospital.name,
                onDismiss = { lightboxIndex = null }
            )
        }
    }

    // Booking Mode Modal (Doctor / Service / After-hours)
    if (showBookingModeModal) {
        HospitalBookingModeDialog(
            hospital = hospital,
            onDismiss = { showBookingModeModal = false },
            onSelectMode = { modeId ->
                showBookingModeModal = false
                navController.navigate(
                    Screen.HospitalBooking.createRoute(
                        hospitalId = hospital.id,
                        mode = modeId
                    )
                )
            }
        )
    }
}

@Composable
private fun HospitalHeroAndSummary(
    hospital: Hospital,
    doctorCount: Int,
    reviewCount: Int,
    averageRating: Double,
    onBack: () -> Unit,
    onAddressClick: () -> Unit,
    onPhoneClick: () -> Unit
) {
    val coverUrl = hospital.displayCoverImage
        ?: hospital.displayLogo
        ?: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80"
    val logoUrl = hospital.displayLogo

    Column(modifier = Modifier.fillMaxWidth()) {
        // Cover Image Banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(235.dp)
                .background(Color(0xFF06281E))
        ) {
            AsyncImage(
                model = coverUrl,
                contentDescription = hospital.name,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            // Gradient overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Black.copy(alpha = 0.45f),
                                Color.Transparent,
                                Color(0xFF06281E).copy(alpha = 0.85f)
                            )
                        )
                    )
            )

            // Top Floating Navigation Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    onClick = onBack,
                    shape = CircleShape,
                    color = Color.White.copy(alpha = 0.94f),
                    shadowElevation = 4.dp
                ) {
                    Box(
                        modifier = Modifier.size(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Quay lại",
                            tint = HospitalEmerald,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = HospitalEmerald.copy(alpha = 0.94f),
                    border = BorderStroke(1.dp, Color(0xFF6EE7B7).copy(alpha = 0.45f)),
                    shadowElevation = 4.dp
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            Icons.Default.Verified,
                            contentDescription = null,
                            tint = Color(0xFF6EE7B7),
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            "Đối tác NovaCare",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Overlapping Summary Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .offset(y = (-34).dp),
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            border = BorderStroke(1.dp, Border)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Hospital Logo Box
                    Surface(
                        modifier = Modifier.size(72.dp),
                        shape = RoundedCornerShape(18.dp),
                        color = Color.White,
                        border = BorderStroke(1.dp, Border),
                        shadowElevation = 2.dp
                    ) {
                        if (!logoUrl.isNullOrBlank()) {
                            AsyncImage(
                                model = logoUrl,
                                contentDescription = hospital.name,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(4.dp)
                                    .clip(RoundedCornerShape(14.dp)),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(HospitalEmeraldLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.Apartment,
                                    contentDescription = null,
                                    tint = HospitalEmerald,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                        }
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        // Badges Row: Status + Type
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = HospitalEmeraldLight,
                                border = BorderStroke(1.dp, HospitalEmeraldBorder)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .background(Primary, CircleShape)
                                    )
                                    Text(
                                        hospital.displayStatusLabel,
                                        color = HospitalEmeraldDark,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFFEFF6FF),
                                border = BorderStroke(1.dp, Color(0xFFBFDBFE))
                            ) {
                                Text(
                                    hospital.displayTypeLabel,
                                    color = Color(0xFF1E3A8A),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(6.dp))

                        Text(
                            text = hospital.name,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = TextPrimary,
                            lineHeight = 22.sp
                        )

                        Spacer(Modifier.height(6.dp))

                        // Rating Chip
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFFFFFBEB),
                                border = BorderStroke(1.dp, Color(0xFFFDE68A))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Star,
                                        contentDescription = null,
                                        tint = Color(0xFFF59E0B),
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Text(
                                        text = String.format("%.1f", averageRating),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color(0xFF78350F)
                                    )
                                    if (reviewCount > 0) {
                                        Text(
                                            text = "($reviewCount đánh giá)",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = Color(0xFF92400E)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = BorderLight)
                Spacer(Modifier.height(10.dp))

                // Address (clickable to Maps)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { onAddressClick() }
                        .padding(vertical = 3.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = HospitalEmerald,
                        modifier = Modifier
                            .size(16.dp)
                            .padding(top = 2.dp)
                    )
                    Text(
                        text = hospital.displayAddress,
                        fontSize = 12.5.sp,
                        color = TextPrimary,
                        fontWeight = FontWeight.Medium,
                        lineHeight = 18.sp,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(Modifier.height(10.dp))

                // Quick Info Chips Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val hotlineText = hospital.hotline?.takeIf { it.isNotBlank() } ?: hospital.phone
                    if (!hotlineText.isNullOrBlank()) {
                        QuickPill(
                            icon = Icons.Default.Call,
                            text = "Hotline: $hotlineText",
                            bg = HospitalEmeraldLight,
                            tint = HospitalEmerald,
                            onClick = onPhoneClick
                        )
                    }
                    if (!hospital.operatingHours.isNullOrBlank()) {
                        QuickPill(
                            icon = Icons.Default.Schedule,
                            text = hospital.operatingHours,
                            bg = Color(0xFFF1F5F9),
                            tint = TextSecondary
                        )
                    }
                    if (doctorCount > 0) {
                        QuickPill(
                            icon = Icons.Default.Groups,
                            text = "$doctorCount bác sĩ",
                            bg = Color(0xFFF1F5F9),
                            tint = TextSecondary
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickPill(
    icon: ImageVector,
    text: String,
    bg: Color,
    tint: Color,
    onClick: (() -> Unit)? = null
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = bg,
        modifier = if (onClick != null) Modifier.clickable { onClick() } else Modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(13.dp))
            Text(
                text = text,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = if (onClick != null) tint else TextPrimary,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun HospitalTabsBar(
    selectedTab: HospitalTab,
    branchesCount: Int,
    doctorsCount: Int,
    specialtiesCount: Int,
    reviewsCount: Int,
    onSelect: (HospitalTab) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .offset(y = (-22).dp),
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Border),
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            HospitalTab.entries.forEach { tab ->
                val isSelected = tab == selectedTab
                val label = when (tab) {
                    HospitalTab.BRANCHES -> "Chi nhánh ($branchesCount)"
                    HospitalTab.DOCTORS -> "Bác sĩ ($doctorsCount)"
                    HospitalTab.SPECIALTIES -> "Chuyên khoa ($specialtiesCount)"
                    HospitalTab.REVIEWS -> if (reviewsCount > 0) "Đánh giá ($reviewsCount)" else "Đánh giá"
                    else -> tab.label
                }
                Surface(
                    onClick = { onSelect(tab) },
                    shape = RoundedCornerShape(12.dp),
                    color = if (isSelected) HospitalEmerald else Color(0xFFF1F5F9)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            tab.icon,
                            contentDescription = null,
                            tint = when {
                                isSelected -> Color.White
                                tab == HospitalTab.REVIEWS -> Color(0xFFF59E0B)
                                else -> TextSecondary
                            },
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = label,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.White else TextPrimary,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HospitalDetailBottomBar(
    phoneNumber: String?,
    onCallClick: () -> Unit,
    onBookClick: () -> Unit
) {
    Surface(
        color = Color.White,
        shadowElevation = 14.dp,
        border = BorderStroke(0.5.dp, Border)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (!phoneNumber.isNullOrBlank()) {
                OutlinedButton(
                    onClick = onCallClick,
                    modifier = Modifier.height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.2.dp, HospitalEmerald),
                    contentPadding = PaddingValues(horizontal = 16.dp)
                ) {
                    Icon(
                        Icons.Default.Call,
                        contentDescription = "Gọi hotline",
                        tint = HospitalEmerald,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        "Gọi ngay",
                        color = HospitalEmerald,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }

            Button(
                onClick = onBookClick,
                modifier = Modifier
                    .weight(1f)
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = HospitalEmerald)
            ) {
                Icon(
                    Icons.Default.CalendarMonth,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(19.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "Đặt lịch khám ngay",
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp
                )
            }
        }
    }
}

@Composable
private fun HospitalBookingModeDialog(
    hospital: Hospital,
    onDismiss: () -> Unit,
    onSelectMode: (String) -> Unit
) {
    val modes = remember(hospital) { getAvailableBookingModesForHospital(hospital) }
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(16.dp),
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(18.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    AsyncImage(
                        model = hospital.displayLogo ?: hospital.displayCoverImage
                            ?: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=300&auto=format&fit=crop&q=80",
                        contentDescription = hospital.name,
                        modifier = Modifier
                            .size(46.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFF1F5F9)),
                        contentScale = ContentScale.Crop
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Chọn hình thức đặt khám",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = TextPrimary
                        )
                        Text(
                            hospital.name,
                            fontSize = 12.sp,
                            color = HospitalEmerald,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(30.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Đóng", tint = TextMuted)
                    }
                }

                HorizontalDivider(color = BorderLight)

                modes.forEach { mode ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectMode(mode.id) },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Background),
                        border = BorderStroke(1.dp, Border)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .background(mode.iconBgColor, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(mode.icon, contentDescription = null, tint = mode.iconTint, modifier = Modifier.size(21.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(mode.title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary)
                                    mode.badge?.let { badgeText ->
                                        Spacer(Modifier.width(6.dp))
                                        Surface(color = mode.iconBgColor, shape = RoundedCornerShape(8.dp)) {
                                            Text(
                                                badgeText,
                                                color = mode.iconTint,
                                                fontSize = 9.5.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }
                                Spacer(Modifier.height(2.dp))
                                Text(mode.description, fontSize = 11.5.sp, color = TextSecondary, lineHeight = 16.sp)
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMuted)
                        }
                    }
                }

                OutlinedButton(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Border)
                ) {
                    Text("Đóng", color = TextSecondary, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun GalleryLightboxDialog(
    images: List<String>,
    initialIndex: Int,
    hospitalName: String,
    onDismiss: () -> Unit
) {
    var currentIndex by remember { mutableIntStateOf(initialIndex.coerceIn(0, images.lastIndex)) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.94f))
                .padding(16.dp)
        ) {
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .statusBarsPadding()
                    .background(Color.White.copy(alpha = 0.15f), CircleShape)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Đóng", tint = Color.White)
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                AsyncImage(
                    model = images[currentIndex],
                    contentDescription = "$hospitalName - Ảnh ${currentIndex + 1}",
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 240.dp, max = 460.dp)
                        .clip(RoundedCornerShape(18.dp)),
                    contentScale = ContentScale.Fit
                )

                Spacer(Modifier.height(18.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(
                        onClick = { currentIndex = if (currentIndex == 0) images.lastIndex else currentIndex - 1 },
                        enabled = images.size > 1
                    ) {
                        Text("← Ảnh trước", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Text(
                        "${currentIndex + 1} / ${images.size}",
                        color = Color.White.copy(alpha = 0.85f),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                    TextButton(
                        onClick = { currentIndex = if (currentIndex == images.lastIndex) 0 else currentIndex + 1 },
                        enabled = images.size > 1
                    ) {
                        Text("Ảnh sau →", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

private fun dialPhone(context: Context, phone: String) {
    runCatching {
        val clean = phone.replace(" ", "")
        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$clean")))
    }
}

private fun openEmail(context: Context, email: String) {
    runCatching {
        context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email")))
    }
}

private fun openUrl(context: Context, rawUrl: String) {
    runCatching {
        val url = if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) rawUrl else "https://$rawUrl"
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }
}

private fun openGoogleMaps(
    context: Context,
    explicitUrl: String?,
    lat: Double?,
    lng: Double?,
    address: String?
) {
    runCatching {
        val uri = when {
            !explicitUrl.isNullOrBlank() && explicitUrl.startsWith("http") -> Uri.parse(explicitUrl)
            lat != null && lng != null -> Uri.parse("https://maps.google.com/maps?q=$lat,$lng")
            !address.isNullOrBlank() -> Uri.parse("https://maps.google.com/maps?q=${Uri.encode(address)}")
            else -> return
        }
        context.startActivity(Intent(Intent.ACTION_VIEW, uri))
    }
}
