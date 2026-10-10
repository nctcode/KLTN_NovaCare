package com.example.kltn_novacare.ui.screens.settings
 
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.ui.components.BottomNavigationBar
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.AuthState
import com.example.kltn_novacare.ui.viewmodel.AuthViewModel
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: NavController,
    authViewModel: AuthViewModel
) {
    val context = LocalContext.current
    val authState by authViewModel.authState.collectAsState()
    val currentUser = (authState as? AuthState.Authenticated)?.user ?: authViewModel.getCurrentUser()
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showPrivacySheet by remember { mutableStateOf(false) }
    var showSafetyDialog by remember { mutableStateOf(false) }
    var showAvatarSheet by remember { mutableStateOf(false) }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                val inputStream = context.contentResolver.openInputStream(uri)
                val avatarDir = File(context.filesDir, "avatars")
                if (!avatarDir.exists()) avatarDir.mkdirs()
                val destFile = File(avatarDir, "avatar_${currentUser?.id ?: "me"}.jpg")
                destFile.outputStream().use { output ->
                    inputStream?.copyTo(output)
                }
                authViewModel.updateAvatar(destFile.absolutePath)
                showAvatarSheet = false
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "Cài đặt & Tài khoản",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = TextPrimary
                        )
                        Text(
                            "Quản lý thông tin cá nhân và ứng dụng",
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            BottomNavigationBar(navController = navController, currentRoute = Screen.Settings.route)
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Background)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ==========================================
            // 1. PROFILE HEADER CARD
            // ==========================================
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Border),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier.padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Clickable Avatar with Camera Badge
                    Box(
                        modifier = Modifier
                            .size(68.dp)
                            .clickable { showAvatarSheet = true },
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(PrimaryLight)
                                .border(2.dp, PrimaryBorder, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!currentUser?.avatarUrl.isNullOrBlank()) {
                                AsyncImage(
                                    model = currentUser?.avatarUrl,
                                    contentDescription = "Ảnh đại diện",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                )
                            } else {
                                Text(
                                    text = (currentUser?.fullName?.take(1) ?: "N").uppercase(),
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = PrimaryDark
                                )
                            }
                        }

                        // Camera badge icon at bottom-right
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .align(Alignment.BottomEnd)
                                .background(Primary, CircleShape)
                                .border(1.5.dp, Color.White, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.PhotoCamera,
                                contentDescription = "Đổi ảnh đại diện",
                                tint = Color.White,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = currentUser?.fullName ?: "Thành viên NovaCare",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = TextPrimary
                        )
                        Text(
                            text = currentUser?.email ?: "member@novacare.vn",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                        Text(
                            text = "Chạm để đổi ảnh đại diện",
                            fontSize = 11.sp,
                            color = PrimaryDark,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier
                                .clickable { showAvatarSheet = true }
                                .padding(top = 2.dp)
                        )

                        Surface(
                            color = PrimaryLight,
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.padding(top = 6.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .background(Primary, CircleShape)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Đã xác thực tài khoản",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryDark
                                )
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 2. QUICK SHORTCUTS GROUP
            // ==========================================
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Border),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(vertical = 8.dp)) {
                    Text(
                        text = "QUẢN LÝ KHÁM CHỮA BỆNH",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMuted,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )

                    SettingsMenuItem(
                        icon = Icons.Outlined.FolderShared,
                        iconTint = PrimaryDark,
                        iconBg = PrimaryLight,
                        title = "Hồ sơ sức khỏe & Y bạ",
                        subtitle = "Quản lý hồ sơ cá nhân và người thân"
                    ) {
                        navController.navigate(Screen.Profiles.route)
                    }

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderLight)

                    SettingsMenuItem(
                        icon = Icons.Outlined.CalendarMonth,
                        iconTint = Color(0xFF2563EB),
                        iconBg = Color(0xFFEFF6FF),
                        title = "Lịch khám của tôi",
                        subtitle = "Lịch sắp tới và kết quả khám trước đây"
                    ) {
                        navController.navigate(Screen.Appointments.route)
                    }

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderLight)

                    SettingsMenuItem(
                        icon = Icons.Outlined.Notifications,
                        iconTint = Color(0xFFD97706),
                        iconBg = Color(0xFFFEF3C7),
                        title = "Thông báo hệ thống",
                        subtitle = "Nhắc lịch khám, cập nhật hồ sơ y tế"
                    ) {
                        navController.navigate(Screen.Notifications.route)
                    }
                }
            }

            // ==========================================
            // 3. SUPPORT & LEGAL GROUP
            // ==========================================
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, Border),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(vertical = 8.dp)) {
                    Text(
                        text = "HỖ TRỢ & PHÁP LÝ",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMuted,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )

                    SettingsMenuItem(
                        icon = Icons.Outlined.SupportAgent,
                        iconTint = Color(0xFF0D9488),
                        iconBg = Color(0xFFF0FDFA),
                        title = "Tổng đài hỗ trợ y tế",
                        subtitle = "1900 6060 (8:00 - 20:00 các ngày trong tuần)"
                    ) {
                        try {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:19006060"))
                            context.startActivity(intent)
                        } catch (_: Exception) {}
                    }

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderLight)

                    SettingsMenuItem(
                        icon = Icons.Outlined.Gavel,
                        iconTint = Color(0xFF64748B),
                        iconBg = Color(0xFFF1F5F9),
                        title = "Điều khoản và chính sách bảo mật",
                        subtitle = "Quy định bảo mật thông tin bệnh nhân NovaCare"
                    ) {
                        showPrivacySheet = true
                    }

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderLight)

                    SettingsMenuItem(
                        icon = Icons.Outlined.Shield,
                        iconTint = PrimaryDark,
                        iconBg = PrimaryLight,
                        title = "Tiêu chuẩn an toàn y tế",
                        subtitle = "Chứng nhận kết nối & liên thông dữ liệu y tế"
                    ) {
                        showSafetyDialog = true
                    }
                }
            }

            // ==========================================
            // 4. VERSION INFO
            // ==========================================
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "NovaCare Healthcare App",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextSecondary
                )
                Text(
                    text = "Phiên bản 2.5.0 • Khóa luận tốt nghiệp HTTT",
                    fontSize = 11.sp,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            // ==========================================
            // 5. LOGOUT BUTTON
            // ==========================================
            OutlinedButton(
                onClick = { showLogoutDialog = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, Color(0xFFFCA5A5)),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = Color(0xFFFEF2F2),
                    contentColor = Color(0xFFDC2626)
                )
            ) {
                Icon(
                    Icons.Outlined.Logout,
                    contentDescription = "Đăng xuất",
                    tint = Color(0xFFDC2626),
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Đăng xuất tài khoản",
                    color = Color(0xFFDC2626),
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }

    // Confirmation Logout Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = {
                Text(
                    "Đăng xuất tài khoản?",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )
            },
            text = {
                Text(
                    "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng NovaCare? Bạn sẽ cần đăng nhập lại để xem lịch khám và hồ sơ bệnh nhân.",
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 18.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        authViewModel.logout {
                            navController.navigate(Screen.Login.route) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Đăng xuất", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showLogoutDialog = false }
                ) {
                    Text("Hủy", color = TextSecondary, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }

    // ==========================================
    // SAFETY STANDARD DIALOG
    // ==========================================
    if (showSafetyDialog) {
        AlertDialog(
            onDismissRequest = { showSafetyDialog = false },
            icon = {
                Icon(
                    imageVector = Icons.Outlined.Shield,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.size(36.dp)
                )
            },
            title = {
                Text(
                    text = "Tiêu Chuẩn An Toàn Y Tế NovaCare",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    color = TextPrimary
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "• Tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân y tế.",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                    Text(
                        text = "• Mã hóa đường truyền SSL/TLS 1.3 và mã hóa dữ liệu tĩnh AES-256.",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                    Text(
                        text = "• Đáp ứng tiêu chuẩn liên thông Bệnh án điện tử (EMR) và tư vấn khám từ xa (Telemedicine) của Bộ Y tế.",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                    Text(
                        text = "• Không lưu trữ số thẻ ngân hàng, tài khoản thanh toán hay mã CVV của bệnh nhân.",
                        fontSize = 13.sp,
                        color = TextSecondary
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { showSafetyDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Đã hiểu", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    // ==========================================
    // PRIVACY POLICY BOTTOM SHEET
    // ==========================================
    if (showPrivacySheet) {
        ModalBottomSheet(
            onDismissRequest = { showPrivacySheet = false },
            containerColor = Color.White,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = { BottomSheetDefaults.DragHandle() }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 28.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .background(PrimaryLight, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Gavel,
                                contentDescription = null,
                                tint = PrimaryDark,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Chính Sách Bảo Mật",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Hệ thống Y tế Số NovaCare • Nghị định 13",
                                fontSize = 11.sp,
                                color = TextSecondary
                            )
                        }
                    }
                    IconButton(onClick = { showPrivacySheet = false }) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Đóng",
                            tint = TextMuted
                        )
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = BorderLight)

                // Scrollable Articles
                Column(
                    modifier = Modifier
                        .weight(1f, fill = false)
                        .heightIn(max = 500.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    PolicySectionCard(
                        title = "1. Giới thiệu & Căn cứ pháp lý",
                        content = "NovaCare cam kết bảo vệ dữ liệu cá nhân theo Nghị định số 13/2023/NĐ-CP của Chính phủ, Luật Khám bệnh, chữa bệnh số 15/2023/QH15 và Luật An toàn thông tin mạng. Mọi thông tin sức khỏe của bạn được giữ bí mật nghiêm ngặt."
                    )
                    PolicySectionCard(
                        title = "2. Dữ liệu cá nhân & Dữ liệu y tế nhạy cảm",
                        content = "• Dữ liệu cơ bản: Họ tên, ngày sinh, giới tính, số điện thoại, email, số CCCD, địa chỉ cư trú.\n• Dữ liệu y tế nhạy cảm: Hồ sơ y bạ, bệnh sử, toa thuốc, kết quả cận lâm sàng (xét nghiệm, X-quang, CT, siêu âm), thẻ BHYT, nội dung tư vấn Telemedicine và triệu chứng bệnh."
                    )
                    PolicySectionCard(
                        title = "3. Thời điểm thu thập thông tin",
                        content = "Thu thập khi bạn tạo tài khoản, lập hồ sơ y bạ (cho bản thân hoặc người thân), đặt lịch khám, khám trực tuyến, thực hiện sàng lọc triệu chứng 2D/3D, quét mã BHYT/CCCD hoặc thanh toán viện phí."
                    )
                    PolicySectionCard(
                        title = "4. Khám bệnh từ xa (Telemedicine)",
                        content = "• Cuộc gọi video: Lưu trữ tạm thời tối đa 30 ngày để xử lý sự cố y khoa (nếu có yêu cầu từ bệnh nhân hoặc bác sĩ), sau 30 ngày sẽ bị xóa vĩnh viễn khỏi hệ thống.\n• Tin nhắn chat y tế: Được lưu trữ mã hóa để bệnh nhân và bác sĩ tiện tra cứu lại lịch sử điều trị."
                    )
                    PolicySectionCard(
                        title = "5. Biện pháp an toàn kỹ thuật",
                        content = "• Mã hóa đường truyền SSL/TLS 1.3 đối với mọi giao dịch.\n• Mã hóa dữ liệu tĩnh AES-256 đối với hồ sơ bệnh án.\n• Mật khẩu được băm 1 chiều (cryptographic hash).\n• Phân quyền nghiêm ngặt (RBAC): Chỉ bác sĩ phụ trách ca khám mới được quyền truy cập hồ sơ."
                    )
                    PolicySectionCard(
                        title = "6. Cam kết không thương mại hóa dữ liệu",
                        content = "NovaCare tuyệt đối KHÔNG bán, cho thuê hoặc chuyển giao dữ liệu sức khỏe của bạn cho bất kỳ bên thứ ba nào vì mục đích quảng cáo/thương mại. Dữ liệu chỉ chuyển tiếp duy nhất đến Bệnh viện/Bác sĩ tiếp nhận ca khám của bạn."
                    )
                    PolicySectionCard(
                        title = "7. Quyền của người dùng & Đầu mối liên hệ",
                        content = "Bạn có quyền tra cứu, cập nhật hồ sơ, yêu cầu xóa tài khoản hoặc rút lại sự đồng ý.\nLiên hệ Ban Quản Trị NovaCare:\n• Tổng đài y tế: 1900 6060 (8:00 - 20:00)\n• Email bảo vệ dữ liệu: privacy@novacare.vn\n• Website: https://novacare.vn"
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = { showPrivacySheet = false },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) {
                    Text(
                        text = "Đã hiểu & Đồng ý",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        }
    }

    // ==========================================
    // AVATAR PICKER BOTTOM SHEET
    // ==========================================
    if (showAvatarSheet) {
        val presetAvatars = listOf(
            "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1594824813566-81858a78c930?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300"
        )

        ModalBottomSheet(
            onDismissRequest = { showAvatarSheet = false },
            containerColor = Color.White,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = { BottomSheetDefaults.DragHandle() }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Đổi ảnh đại diện",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    IconButton(onClick = { showAvatarSheet = false }) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Đóng",
                            tint = TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Avatar Preview
                Box(
                    modifier = Modifier
                        .size(92.dp)
                        .clip(CircleShape)
                        .background(PrimaryLight)
                        .border(3.dp, Primary, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    if (!currentUser?.avatarUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = currentUser?.avatarUrl,
                            contentDescription = "Avatar hiện tại",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                        )
                    } else {
                        Text(
                            text = (currentUser?.fullName?.take(1) ?: "N").uppercase(),
                            fontSize = 36.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = PrimaryDark
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Option 1: Pick from Gallery
                Button(
                    onClick = { galleryLauncher.launch("image/*") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.PhotoLibrary,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Chọn ảnh từ thư viện thiết bị",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Option 2: Presets
                Text(
                    text = "Hoặc chọn từ bộ sưu tập avatar NovaCare",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextSecondary,
                    modifier = Modifier.align(Alignment.Start)
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    presetAvatars.forEach { url ->
                        val isSelected = currentUser?.avatarUrl == url
                        Box(
                            modifier = Modifier
                                .size(58.dp)
                                .clip(CircleShape)
                                .border(
                                    width = if (isSelected) 3.dp else 1.5.dp,
                                    color = if (isSelected) Primary else Border,
                                    shape = CircleShape
                                )
                                .clickable {
                                    authViewModel.updateAvatar(url)
                                    showAvatarSheet = false
                                }
                        ) {
                            AsyncImage(
                                model = url,
                                contentDescription = "Avatar mẫu",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(CircleShape)
                            )
                        }
                    }
                }

                // Option 3: Remove Avatar (if not default)
                if (!currentUser?.avatarUrl.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(20.dp))
                    OutlinedButton(
                        onClick = {
                            authViewModel.updateAvatar(null)
                            showAvatarSheet = false
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.5f))
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Delete,
                            contentDescription = null,
                            tint = Color(0xFFEF4444),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Xóa ảnh đại diện (Dùng chữ cái)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFFEF4444)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PolicySectionCard(
    title: String,
    content: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = BorderStroke(1.dp, Border)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = title,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = PrimaryDark
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = content,
                fontSize = 12.sp,
                color = TextSecondary,
                lineHeight = 18.sp
            )
        }
    }
}

@Composable
fun SettingsMenuItem(
    icon: ImageVector,
    iconTint: Color,
    iconBg: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(iconBg, RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = iconTint,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = subtitle,
                fontSize = 11.sp,
                color = TextSecondary,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        Icon(
            Icons.Default.ChevronRight,
            contentDescription = null,
            tint = TextMuted,
            modifier = Modifier.size(18.dp)
        )
    }
}
