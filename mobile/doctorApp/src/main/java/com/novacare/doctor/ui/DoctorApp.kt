package com.novacare.doctor.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import coil.compose.AsyncImage
import com.novacare.doctor.data.*
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

internal val DoctorGreen = Color(0xFF087F5B)
internal val DoctorLight = Color(0xFFF4F8F6)
internal val TextDark = Color(0xFF102A23)

@Composable
fun NovaCareDoctorTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = DoctorGreen,
            onPrimary = Color.White,
            secondaryContainer = Color(0xFFD1FAE5),
            onSecondaryContainer = Color(0xFF064E3B),
            background = DoctorLight,
            surface = Color.White,
            onSurface = TextDark
        ),
        content = content
    )
}

internal object Route {
    const val Dashboard = "dashboard"
    const val Schedule = "schedule"
    const val Appointments = "appointments"
    const val Consultations = "consultations"
    const val Notifications = "notifications"
    const val Profile = "profile"
    const val Appointment = "appointment/{id}"
    const val Consultation = "consultation/{id}"
    const val ConsultationVideo = "consultation-video/{id}"
    fun appointment(id: String) = "appointment/$id"
}

@Composable
fun DoctorApp(viewModel: DoctorViewModel = viewModel()) {
    val authenticated by viewModel.authenticated.collectAsState()
    Surface(Modifier.fillMaxSize(), color = DoctorLight) {
        if (authenticated) DoctorNavigation(viewModel) else DoctorLoginScreen(viewModel)
    }
}

@Composable
private fun DoctorLoginScreen(viewModel: DoctorViewModel) {
    val auth by viewModel.auth.collectAsState()
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var serverMode by remember { mutableStateOf(DoctorApiClient.getServerMode()) }
    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Card(shape = RoundedCornerShape(28.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(Modifier.padding(26.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Image(
                    painter = painterResource(id = com.novacare.doctor.R.drawable.novacare_logo),
                    contentDescription = "NovaCare Doctor",
                    modifier = Modifier.height(48.dp).padding(horizontal = 8.dp),
                    contentScale = ContentScale.Fit
                )
                Surface(
                    color = DoctorGreen.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    Text(
                        "CỔNG BÁC SĨ (DOCTOR PORTAL)",
                        color = DoctorGreen,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                    )
                }
                Text("Không gian làm việc dành riêng cho bác sĩ", color = Color(0xFF64748B), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp, bottom = 22.dp))
                OutlinedTextField(
                    value = username, onValueChange = { username = it }, singleLine = true,
                    label = { Text("Email hoặc số điện thoại") }, leadingIcon = { Icon(Icons.Outlined.AccountCircle, null) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = password, onValueChange = { password = it }, singleLine = true,
                    label = { Text("Mật khẩu") }, leadingIcon = { Icon(Icons.Outlined.Lock, null) },
                    visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
                )
                if (auth is LoadState.Error) Text((auth as LoadState.Error).message, color = MaterialTheme.colorScheme.error, fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(top = 10.dp))
                Button(
                    onClick = { viewModel.login(username, password) }, enabled = auth !is LoadState.Loading,
                    modifier = Modifier.fillMaxWidth().height(52.dp).padding(top = 12.dp), shape = RoundedCornerShape(14.dp)
                ) {
                    if (auth is LoadState.Loading) CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text("Đăng nhập dành cho Bác sĩ", fontWeight = FontWeight.Bold)
                }
                Text("Ứng dụng chỉ chấp nhận tài khoản có vai trò DOCTOR.", color = Color(0xFF64748B), fontSize = 10.sp, modifier = Modifier.padding(top = 14.dp))
                Spacer(Modifier.height(12.dp))
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = DoctorLight,
                    border = BorderStroke(1.dp, Color(0xFFD8E6E0)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(Modifier.padding(4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        DoctorServerMode.entries.forEach { mode ->
                            val selected = serverMode == mode
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(9.dp))
                                    .background(if (selected) DoctorGreen else Color.Transparent)
                                    .clickable {
                                        DoctorApiClient.setServerMode(mode)
                                        serverMode = mode
                                    }
                                    .padding(vertical = 8.dp, horizontal = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (mode == DoctorServerMode.PRODUCTION) Icons.Outlined.Cloud else Icons.Outlined.Usb,
                                        contentDescription = null,
                                        tint = if (selected) Color.White else Color(0xFF475569),
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(Modifier.width(5.dp))
                                    Text(
                                        text = mode.label,
                                        fontSize = 11.sp,
                                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                        color = if (selected) Color.White else Color(0xFF475569)
                                    )
                                }
                            }
                        }
                    }
                }
                Text(
                    text = DoctorApiClient.getBaseUrl().removeSuffix("/"),
                    color = Color(0xFF94A3B8),
                    fontSize = 10.sp,
                    modifier = Modifier.padding(top = 5.dp)
                )
            }
        }
    }
}

@Composable
private fun DoctorNavigation(viewModel: DoctorViewModel) {
    val nav = rememberNavController()
    val consultationViewModel: DoctorConsultationViewModel = viewModel()
    NavHost(navController = nav, startDestination = Route.Dashboard) {
        composable(Route.Dashboard) { DashboardScreen(nav, viewModel) }
        composable(Route.Schedule) { ScheduleScreen(nav, viewModel) }
        composable(Route.Appointments) { AppointmentsScreen(nav, viewModel) }
        composable(Route.Consultations) { DoctorConsultationsScreen(nav, consultationViewModel) }
        composable(Route.Notifications) { NotificationsScreen(nav, viewModel) }
        composable(Route.Profile) { ProfileScreen(nav, viewModel) }
        composable(Route.Appointment, arguments = listOf(navArgument("id") { type = NavType.StringType })) {
            AppointmentDetailScreen(nav, viewModel, it.arguments?.getString("id").orEmpty())
        }
        composable(Route.Consultation, arguments = listOf(navArgument("id") { type = NavType.StringType })) {
            DoctorConsultationChatScreen(it.arguments?.getString("id").orEmpty(), nav, consultationViewModel)
        }
        composable(Route.ConsultationVideo, arguments = listOf(navArgument("id") { type = NavType.StringType })) {
            val videoViewModel: DoctorVideoViewModel = viewModel()
            DoctorConsultationVideoScreen(it.arguments?.getString("id").orEmpty(), nav, videoViewModel)
        }
    }
}

private data class NavItem(val route: String, val label: String, val icon: ImageVector)
private val navItems = listOf(
    NavItem(Route.Dashboard, "Tổng quan", Icons.Outlined.Home),
    NavItem(Route.Schedule, "Lịch trực", Icons.Outlined.DateRange),
    NavItem(Route.Appointments, "Lịch hẹn", Icons.Outlined.EventNote),
    NavItem(Route.Consultations, "Tư vấn", Icons.Outlined.Forum),
    NavItem(Route.Notifications, "Thông báo", Icons.Outlined.Notifications),
    NavItem(Route.Profile, "Hồ sơ", Icons.Outlined.Person)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun DoctorScaffold(
    nav: NavHostController,
    route: String,
    title: String,
    canBack: Boolean = false,
    topBar: (@Composable () -> Unit)? = null,
    content: @Composable (PaddingValues) -> Unit
) {
    Scaffold(
        containerColor = DoctorLight,
        topBar = {
            if (topBar != null) {
                topBar()
            } else {
                TopAppBar(
                    title = { Text(title, fontWeight = FontWeight.Black) },
                    navigationIcon = { if (canBack) IconButton(onClick = { nav.popBackStack() }) { Icon(Icons.Default.ArrowBack, "Quay lại") } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                )
            }
        },
        bottomBar = {
            if (!canBack) NavigationBar(containerColor = Color.White) {
                navItems.forEach { item ->
                    NavigationBarItem(
                        selected = route == item.route,
                        onClick = { if (route != item.route) nav.navigate(item.route) { popUpTo(Route.Dashboard); launchSingleTop = true } },
                        icon = { Icon(item.icon, item.label) }, label = { Text(item.label, fontSize = 9.sp) }
                    )
                }
            }
        }, content = content
    )
}

@Composable
private fun DashboardScreen(nav: NavHostController, viewModel: DoctorViewModel) {
    val state by viewModel.dashboard.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadDashboard() }
    DoctorScaffold(nav, Route.Dashboard, "Tổng quan bác sĩ") { padding ->
        StateContent(state, Modifier.padding(padding), viewModel::loadDashboard) { dashboard ->
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = DoctorGreen), shape = RoundedCornerShape(22.dp)) {
                        Column(Modifier.fillMaxWidth().padding(20.dp)) {
                            Text("XIN CHÀO", color = Color(0xFFB7F7D4), fontWeight = FontWeight.Black, fontSize = 11.sp)
                            Text("${dashboard.doctor.title.orEmpty()} ${dashboard.doctor.fullName}".trim(), color = Color.White, fontWeight = FontWeight.Black, fontSize = 22.sp)
                            Text("Lịch trực và bệnh nhân được phân công hôm nay", color = Color(0xFFD1FAE5), fontSize = 12.sp)
                        }
                    }
                }
                item { Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { StatCard("Lịch hẹn", dashboard.stats.totalToday, Icons.Outlined.Event, Modifier.weight(1f)); StatCard("Chờ khám", dashboard.stats.upcomingToday, Icons.Outlined.Schedule, Modifier.weight(1f)) } }
                item { Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { StatCard("Hoàn thành", dashboard.stats.completedToday, Icons.Outlined.CheckCircle, Modifier.weight(1f)); StatCard("Ca trực", dashboard.stats.slotsToday, Icons.Outlined.DateRange, Modifier.weight(1f)) } }
                item { Text("Lịch hẹn sắp tới", fontSize = 17.sp, fontWeight = FontWeight.Black) }
                if (dashboard.nextAppointments.isEmpty()) item { EmptyCard("Không có lịch hẹn sắp tới") }
                items(dashboard.nextAppointments, key = { it.id }) { AppointmentCard(it) { nav.navigate(Route.appointment(it.id)) } }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: Int, icon: ImageVector, modifier: Modifier) {
    Card(modifier, colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = DoctorGreen); Spacer(Modifier.width(9.dp)); Column { Text(value.toString(), fontSize = 21.sp, fontWeight = FontWeight.Black); Text(label, color = Color(0xFF64748B), fontSize = 10.sp) }
        }
    }
}

@Composable
private fun AppointmentsScreen(nav: NavHostController, viewModel: DoctorViewModel) {
    var status by remember { mutableStateOf<String?>(null) }
    val start = remember { LocalDate.now().minusDays(7).toString() }
    val end = remember { LocalDate.now().plusDays(30).toString() }
    val state by viewModel.appointments.collectAsState()
    fun reload() = viewModel.loadAppointments(start, end, status)
    LaunchedEffect(status) { reload() }
    DoctorScaffold(nav, Route.Appointments, "Lịch hẹn bệnh nhân") { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            val filters = listOf(null to "Tất cả", "CONFIRMED" to "Đã xác nhận", "PAID" to "Đã thanh toán", "COMPLETED" to "Hoàn thành")
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                filters.forEach { (key, label) -> FilterChip(selected = status == key, onClick = { status = key }, label = { Text(label) }) }
            }
            StateContent(state, Modifier.weight(1f), ::reload) { result ->
                LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    item { Text("${result.total} lịch hẹn thuộc phạm vi được phân công", color = Color(0xFF64748B), fontSize = 11.sp) }
                    if (result.items.isEmpty()) item { EmptyCard("Không có lịch hẹn phù hợp") }
                    items(result.items, key = { it.id }) { AppointmentCard(it) { nav.navigate(Route.appointment(it.id)) } }
                }
            }
        }
    }
}

@Composable
private fun AppointmentCard(item: DoctorAppointment, onClick: () -> Unit) {
    Card(Modifier.fillMaxWidth().clickable(onClick = onClick), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(16.dp)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Person, null, tint = DoctorGreen, modifier = Modifier.size(36.dp)); Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(item.patientProfile.fullName, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(formatDateTime(item.slot.startTime), color = Color(0xFF475569), fontSize = 11.sp)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 3.dp)) {
                    Surface(
                        color = when {
                            item.serviceBookingMode == "ONLINE" || item.consultation != null -> Color(0xFFE0F2FE)
                            item.serviceBookingMode == "AFTER_HOURS" -> Color(0xFFFEF3C7)
                            item.serviceBookingMode == "SERVICE" || item.medicalService != null -> Color(0xFFF3E8FF)
                            else -> Color(0xFFF1F5F9)
                        },
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = item.appointmentTypeLabel,
                            color = when {
                                item.serviceBookingMode == "ONLINE" || item.consultation != null -> Color(0xFF0369A1)
                                item.serviceBookingMode == "AFTER_HOURS" -> Color(0xFFB45309)
                                item.serviceBookingMode == "SERVICE" || item.medicalService != null -> Color(0xFF7E22CE)
                                else -> Color(0xFF475569)
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.sp,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Text(statusLabel(item.status), color = DoctorGreen, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                }
            }
            Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF94A3B8))
        }
    }
}

@Composable
private fun NotificationsScreen(nav: NavHostController, viewModel: DoctorViewModel) {
    val state by viewModel.notifications.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadNotifications() }
    DoctorScaffold(nav, Route.Notifications, "Thông báo") { padding ->
        StateContent(state, Modifier.padding(padding), viewModel::loadNotifications) { notifications ->
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                item { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { TextButton(onClick = viewModel::markAllNotificationsRead) { Icon(Icons.Default.DoneAll, null); Text("Đọc tất cả") } } }
                if (notifications.isEmpty()) item { EmptyCard("Chưa có thông báo") }
                items(notifications, key = { it.id }) { notification ->
                    val consultationId = notification.data
                        ?.takeIf { it.isJsonObject }
                        ?.asJsonObject
                        ?.get("consultationId")
                        ?.takeIf { it.isJsonPrimitive }
                        ?.asString
                    Card(
                        Modifier.fillMaxWidth().clickable {
                            if (!notification.isRead) viewModel.markNotificationRead(notification.id)
                            if (!consultationId.isNullOrBlank()) nav.navigate("consultation/$consultationId")
                        },
                        colors = CardDefaults.cardColors(containerColor = if (notification.isRead) Color.White else Color(0xFFEAF8EE)), shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
                            Icon(Icons.Outlined.Notifications, null, tint = DoctorGreen); Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) { Text(notification.title, fontWeight = FontWeight.Black, fontSize = 13.sp); Text(notification.content, color = Color(0xFF475569), fontSize = 11.sp); Text(formatDateTime(notification.createdAt), color = Color(0xFF94A3B8), fontSize = 9.sp) }
                            if (!notification.isRead) Box(Modifier.size(8.dp).background(DoctorGreen, RoundedCornerShape(50)))
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProfileScreen(nav: NavHostController, viewModel: DoctorViewModel) {
    val state by viewModel.profile.collectAsState()
    var name by remember { mutableStateOf("") }
    var avatar by remember { mutableStateOf("") }
    var bio by remember { mutableStateOf("") }
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showAvatarDialog by remember { mutableStateOf(false) }
    var showSuccessBanner by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { viewModel.loadProfile() }
    LaunchedEffect(state) {
        if (state is LoadState.Data) {
            val prof = (state as LoadState.Data<DoctorProfile>).value
            name = prof.fullName
            avatar = prof.avatarUrl.orEmpty()
            bio = prof.bio.orEmpty()
        }
    }

    DoctorScaffold(
        nav = nav,
        route = Route.Profile,
        title = "Hồ sơ bác sĩ",
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(34.dp)
                                .background(Color.White.copy(alpha = 0.15f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.MedicalServices, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text("Hồ sơ bác sĩ", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 17.sp)
                            Text("NovaCare Medical Center", color = Color(0xFFD1FAE5), fontSize = 11.sp)
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { showLogoutDialog = true }) {
                        Icon(Icons.Outlined.Logout, contentDescription = "Đăng xuất", tint = Color.White.copy(alpha = 0.9f))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF064E3B))
            )
        }
    ) { padding ->
        StateContent(state, Modifier.padding(padding), viewModel::loadProfile) { profile ->
            LazyColumn(
                contentPadding = PaddingValues(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                item {
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color(0xFF064E3B), DoctorGreen)
                                )
                            )
                            .padding(horizontal = 20.dp, vertical = 20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            contentAlignment = Alignment.BottomEnd,
                            modifier = Modifier.padding(bottom = 12.dp)
                        ) {
                            if (avatar.isNotBlank()) {
                                AsyncImage(
                                    model = avatar,
                                    contentDescription = name,
                                    modifier = Modifier
                                        .size(96.dp)
                                        .clip(CircleShape)
                                        .border(BorderStroke(3.dp, Color.White), CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(96.dp)
                                        .clip(CircleShape)
                                        .border(BorderStroke(3.dp, Color.White), CircleShape)
                                        .background(Color.White.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(52.dp))
                                }
                            }
                            Surface(
                                onClick = { showAvatarDialog = true },
                                shape = CircleShape,
                                color = Color.White,
                                shadowElevation = 4.dp,
                                modifier = Modifier.size(32.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.CameraAlt, contentDescription = "Đổi ảnh đại diện", tint = DoctorGreen, modifier = Modifier.size(16.dp))
                                }
                            }
                        }

                        Text(
                            text = name.ifBlank { profile.fullName },
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 21.sp,
                            color = Color.White
                        )

                        Text(
                            text = profile.qualification.ifBlank { "Bác sĩ điều trị NovaCare" },
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFD1FAE5),
                            modifier = Modifier.padding(top = 4.dp)
                        )

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(top = 10.dp)
                        ) {
                            Surface(
                                color = Color.White.copy(alpha = 0.16f),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                ) {
                                    Icon(Icons.Default.Verified, null, tint = Color(0xFF34D399), modifier = Modifier.size(14.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("Bác sĩ chính thức", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                            profile.workPlaces.firstOrNull()?.specialty?.name?.let { specialty ->
                                Surface(
                                    color = Color.White.copy(alpha = 0.16f),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Text(
                                        specialty,
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                item {
                    Box(Modifier.padding(horizontal = 16.dp)) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(16.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 14.dp),
                                horizontalArrangement = Arrangement.SpaceEvenly,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("${profile.yearsOfExperience} năm", fontWeight = FontWeight.Black, fontSize = 16.sp, color = DoctorGreen)
                                    Text("Kinh nghiệm", fontSize = 11.sp, color = Color(0xFF64748B))
                                }
                                Box(Modifier.width(1.dp).height(28.dp).background(Color(0xFFE2E8F0)))
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("${profile.workPlaces.size} cơ sở", fontWeight = FontWeight.Black, fontSize = 16.sp, color = DoctorGreen)
                                    Text("Nơi công tác", fontSize = 11.sp, color = Color(0xFF64748B))
                                }
                                Box(Modifier.width(1.dp).height(28.dp).background(Color(0xFFE2E8F0)))
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Hoạt động", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF059669))
                                    Text("Trạng thái", fontSize = 11.sp, color = Color(0xFF64748B))
                                }
                            }
                        }
                    }
                }

                if (showSuccessBanner) {
                    item {
                        Box(Modifier.padding(horizontal = 16.dp)) {
                            Surface(
                                color = Color(0xFFECFDF5),
                                border = BorderStroke(1.dp, Color(0xFFA7F3D0)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF059669), modifier = Modifier.size(20.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text("Đã cập nhật thông tin hồ sơ thành công!", color = Color(0xFF065F46), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                    IconButton(onClick = { showSuccessBanner = false }, modifier = Modifier.size(20.dp)) {
                                        Icon(Icons.Default.Close, null, tint = Color(0xFF065F46), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                item {
                    Box(Modifier.padding(horizontal = 16.dp)) {
                        DetailSection("Thông tin hiển thị", Icons.Outlined.EditNote) {
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it; showSuccessBanner = false },
                                label = { Text("Họ và tên bác sĩ") },
                                leadingIcon = { Icon(Icons.Outlined.Person, null, tint = DoctorGreen) },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = DoctorGreen,
                                    focusedLabelColor = DoctorGreen
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(Modifier.height(8.dp))
                            OutlinedTextField(
                                value = bio,
                                onValueChange = { bio = it; showSuccessBanner = false },
                                label = { Text("Giới thiệu chuyên môn") },
                                leadingIcon = { Icon(Icons.Outlined.Description, null, tint = DoctorGreen) },
                                minLines = 3,
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = DoctorGreen,
                                    focusedLabelColor = DoctorGreen
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(Modifier.height(8.dp))
                            OutlinedTextField(
                                value = avatar,
                                onValueChange = { avatar = it; showSuccessBanner = false },
                                label = { Text("URL ảnh đại diện") },
                                leadingIcon = { Icon(Icons.Outlined.Image, null, tint = DoctorGreen) },
                                trailingIcon = {
                                    if (avatar.isNotBlank()) {
                                        IconButton(onClick = { avatar = ""; showSuccessBanner = false }) {
                                            Icon(Icons.Default.Clear, null, tint = Color(0xFF64748B))
                                        }
                                    }
                                },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = DoctorGreen,
                                    focusedLabelColor = DoctorGreen
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(Modifier.height(10.dp))
                            Button(
                                onClick = {
                                    viewModel.updateProfile(name, avatar, bio)
                                    showSuccessBanner = true
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = DoctorGreen)
                            ) {
                                Icon(Icons.Default.Save, null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Lưu thay đổi", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                item {
                    Box(Modifier.padding(horizontal = 16.dp)) {
                        DetailSection("Học vị & Chứng chỉ hành nghề", Icons.Outlined.School) {
                            InfoLine("Học vị chuyên môn", profile.qualification.ifBlank { "Chưa cập nhật" })
                            InfoLine("Kinh nghiệm lâm sàng", "${profile.yearsOfExperience} năm")
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFFF1F8F5), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                            ) {
                                Icon(Icons.Default.VerifiedUser, null, tint = DoctorGreen, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    "Thông tin học vị và chứng chỉ do Quản trị viên NovaCare kiểm duyệt.",
                                    color = Color(0xFF102A23),
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp
                                )
                            }
                        }
                    }
                }

                item {
                    Box(Modifier.padding(horizontal = 16.dp)) {
                        DetailSection("Cơ sở công tác", Icons.Outlined.LocalHospital) {
                            if (profile.workPlaces.isEmpty()) {
                                Text("Chưa được phân công cơ sở công tác.", color = Color(0xFF64748B), fontSize = 12.sp)
                            } else {
                                profile.workPlaces.forEach { workplace ->
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAF9)),
                                        shape = RoundedCornerShape(12.dp),
                                        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 4.dp)
                                    ) {
                                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Row(
                                                Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(workplace.hospital.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextDark)
                                                if (workplace.isPrimary) {
                                                    Surface(color = DoctorGreen.copy(alpha = 0.12f), shape = RoundedCornerShape(8.dp)) {
                                                        Text("Cơ sở chính", color = DoctorGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                                    }
                                                }
                                            }
                                            Text(
                                                "${workplace.branch?.name ?: "Cơ sở chính"} · ${workplace.specialty.name}",
                                                color = Color(0xFF059669),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Medium
                                            )
                                            workplace.hospital.address?.takeIf(String::isNotBlank)?.let {
                                                Text(it, color = Color(0xFF64748B), fontSize = 11.sp)
                                            }
                                        }
                                    }
                                }
                                Text("Chuyên khoa và nơi công tác do Quản trị viên quản lý.", color = Color(0xFF94A3B8), fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
                            }
                        }
                    }
                }

                item {
                    Box(Modifier.padding(horizontal = 16.dp)) {
                        DetailSection("Tài khoản & Liên hệ", Icons.Outlined.AccountCircle) {
                            InfoLine("Email công vụ", profile.user.email ?: "—")
                            InfoLine("Số điện thoại", profile.user.phone ?: "Chưa cập nhật")
                            InfoLine("Vai trò hệ thống", "Bác sĩ điều trị (${profile.user.role})")
                        }
                    }
                }

                item {
                    Box(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                        OutlinedButton(
                            onClick = { showLogoutDialog = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFFFCA5A5)),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626))
                        ) {
                            Icon(Icons.Default.Logout, null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Đăng xuất tài khoản", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
            }
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            icon = { Icon(Icons.Default.Logout, null, tint = Color(0xFFDC2626)) },
            title = { Text("Đăng xuất tài khoản", fontWeight = FontWeight.Bold) },
            text = { Text("Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng NovaCare Doctor không?") },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        viewModel.logout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) {
                    Text("Đăng xuất", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showLogoutDialog = false }) {
                    Text("Hủy")
                }
            }
        )
    }

    if (showAvatarDialog) {
        var tempAvatarUrl by remember { mutableStateOf(avatar) }
        AlertDialog(
            onDismissRequest = { showAvatarDialog = false },
            title = { Text("Cập nhật ảnh đại diện", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Nhập liên kết ảnh chân dung bác sĩ (URL):", fontSize = 13.sp, color = Color(0xFF64748B))
                    OutlinedTextField(
                        value = tempAvatarUrl,
                        onValueChange = { tempAvatarUrl = it },
                        label = { Text("URL hình ảnh") },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (tempAvatarUrl.isNotBlank()) {
                        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                            AsyncImage(
                                model = tempAvatarUrl,
                                contentDescription = "Xem trước",
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                                    .border(1.dp, DoctorGreen, CircleShape),
                                contentScale = ContentScale.Crop
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        avatar = tempAvatarUrl
                        showAvatarDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = DoctorGreen)
                ) {
                    Text("Áp dụng", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAvatarDialog = false }) { Text("Hủy") }
            }
        )
    }
}

@Composable
internal fun <T> StateContent(state: LoadState<T>, modifier: Modifier = Modifier, retry: () -> Unit, content: @Composable (T) -> Unit) {
    Box(modifier.fillMaxSize()) {
        when (state) {
            is LoadState.Data -> content(state.value)
            is LoadState.Error -> Column(Modifier.align(Alignment.Center).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(state.message, color = MaterialTheme.colorScheme.error); TextButton(onClick = retry) { Text("Thử lại") } }
            else -> CircularProgressIndicator(Modifier.align(Alignment.Center), color = DoctorGreen)
        }
    }
}

@Composable private fun DetailCard(content: @Composable ColumnScope.() -> Unit) = Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(16.dp)) { Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp), content = content) }
@Composable private fun DetailSection(title: String, icon: ImageVector, content: @Composable ColumnScope.() -> Unit) = DetailCard { Row(verticalAlignment = Alignment.CenterVertically) { Icon(icon, null, tint = DoctorGreen); Spacer(Modifier.width(8.dp)); Text(title, fontWeight = FontWeight.Black, fontSize = 16.sp) }; Spacer(Modifier.height(6.dp)); content() }
@Composable private fun InfoLine(label: String, value: String) { Column(Modifier.padding(vertical = 3.dp)) { Text(label, color = Color(0xFF64748B), fontWeight = FontWeight.Bold, fontSize = 10.sp); Text(value, fontSize = 13.sp) } }
@Composable private fun EmptyCard(text: String) = DetailCard { Box(Modifier.fillMaxWidth().padding(18.dp), contentAlignment = Alignment.Center) { Text(text, color = Color(0xFF64748B), fontSize = 12.sp) } }

internal val vietnamZone = ZoneId.of("Asia/Ho_Chi_Minh")
internal fun formatDateTime(value: String): String = runCatching { OffsetDateTime.parse(value).atZoneSameInstant(vietnamZone).format(DateTimeFormatter.ofPattern("dd/MM/yyyy · HH:mm")) }.getOrElse { value.replace("T", " ").take(16) }
internal fun formatBirthDate(value: String?): String = value?.takeIf(String::isNotBlank)?.let { runCatching { LocalDate.parse(it.substringBefore('T')).format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) }.getOrDefault(it.substringBefore('T')) } ?: "Chưa cung cấp"
internal fun genderLabel(value: String?): String = when (value?.uppercase()) { "MALE", "NAM" -> "Nam"; "FEMALE", "NU", "NỮ" -> "Nữ"; "OTHER", "KHAC", "KHÁC" -> "Khác"; else -> "Chưa cung cấp" }
internal fun riskLabel(value: String?): String = when (value?.uppercase()) {
    "LOW" -> "Nguy cơ thấp"
    "MONITOR" -> "Theo dõi tại nhà"
    "MODERATE", "MEDIUM" -> "Nguy cơ trung bình"
    "HIGH" -> "Nguy cơ cao"
    "URGENT" -> "Cần bác sĩ đánh giá sớm"
    "EMERGENCY" -> "Cần xử trí khẩn cấp"
    "CONSULT" -> "Nên tham vấn bác sĩ"
    else -> "Chưa phân loại"
}
internal fun nextActionLabel(value: String?): String = when (value?.trim()?.uppercase()) {
    "BOOK_SPECIALTY" -> "Đặt lịch khám đúng chuyên khoa gợi ý"
    "CHOOSE_FACILITY" -> "Chọn cơ sở y tế có cung cấp chuyên khoa phù hợp"
    "EMERGENCY_GUIDANCE" -> "Cảnh báo khẩn cấp — Hướng dẫn gọi cấp cứu 115"
    "URGENT_GUIDANCE" -> "Khuyến nghị đến cơ sở y tế để bác sĩ đánh giá sớm"
    "ASK_MORE" -> "Cần bổ sung thêm thông tin triệu chứng trước khi định hướng"
    "REVIEW_REQUIRED" -> "Cần nhân viên y tế hoặc bác sĩ xem xét trực tiếp"
    "CONTACT_FACILITY" -> "Liên hệ trực tiếp cơ sở y tế để được hướng dẫn phù hợp"
    else -> value?.takeIf(String::isNotBlank) ?: "Chưa xác định"
}
internal fun decisionReasonLabel(value: String?): String = when (value?.trim()?.uppercase()) {
    "SUPPORTED_AND_AVAILABLE" -> "Đủ dữ kiện triệu chứng và chuyên khoa hiện có tại cơ sở đã chọn"
    "SPECIALTY_NOT_AT_FACILITY" -> "Đã xác định chuyên khoa phù hợp, nhưng cơ sở đã chọn chưa xác nhận cung cấp chuyên khoa này"
    "SPECIALTY_NOT_IN_CATALOG" -> "Danh mục hệ thống hiện chưa có chuyên khoa tương ứng với triệu chứng đã cung cấp"
    "AMBIGUOUS_SPECIALTIES" -> "Thông tin hiện tại còn giao thoa giữa nhiều chuyên khoa, cần khai thác thêm"
    "INSUFFICIENT_EVIDENCE" -> "Chưa đủ bằng chứng y khoa để xác nhận một chuyên khoa duy nhất"
    "MISSING_INFORMATION" -> "Còn thiếu thông tin bắt buộc để hoàn tất phân loại"
    "REGION_CONFLICT" -> "Vùng cơ thể đã chọn chưa khớp với vị trí triệu chứng trong lời kể"
    else -> value?.takeIf(String::isNotBlank) ?: "Chưa có lý do chi tiết"
}
internal fun recommendationSummary(value: com.google.gson.JsonElement?): String {
    if (value == null || value.isJsonNull) return "Chưa có nhận định"
    if (value.isJsonPrimitive) return value.asString.takeIf(String::isNotBlank) ?: "Chưa có nhận định"
    if (!value.isJsonObject) return "Chưa có nhận định"
    val summary = value.asJsonObject.get("summary")
    return if (summary != null && summary.isJsonPrimitive) summary.asString.takeIf(String::isNotBlank) ?: "Chưa có nhận định" else "Chưa có nhận định"
}
internal fun recommendationDetails(value: com.google.gson.JsonElement?): List<Pair<String, String>> {
    if (value == null || !value.isJsonObject) return emptyList()
    val data = value.asJsonObject
    val items = mutableListOf<Pair<String, String>>()
    data.get("nextAction")?.takeIf { it.isJsonPrimitive && it.asString.isNotBlank() }?.asString?.let {
        items.add("Hướng xử trí" to nextActionLabel(it))
    }
    data.get("decisionReason")?.takeIf { it.isJsonPrimitive && it.asString.isNotBlank() }?.asString?.let {
        items.add("Lý do khuyến nghị" to decisionReasonLabel(it))
    }
    data.get("ppgExplanation")?.takeIf { it.isJsonPrimitive && it.asString.isNotBlank() }?.asString?.let {
        items.add("Nhận định nhịp tim PPG" to it)
    }
    return items
}
internal fun dateOnly(date: LocalDate) = date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
internal fun dayLabel(day: Int) = listOf("Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy").getOrElse(day) { "" }
internal fun statusLabel(status: String) = mapOf("PENDING" to "Chờ xác nhận", "AWAITING_PAYMENT" to "Chờ thanh toán", "CONFIRMED" to "Đã xác nhận", "PAID" to "Đã thanh toán", "COMPLETED" to "Hoàn thành", "CANCELLED" to "Đã hủy", "NO_SHOW" to "Không đến")[status] ?: status
