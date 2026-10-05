package com.example.kltn_novacare.ui.screens.consultation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.kltn_novacare.data.model.Consultation
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.ConsultationViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConsultationHomeScreen(navController: NavController, viewModel: ConsultationViewModel) {
    val state by viewModel.consultations.collectAsState()
    LaunchedEffect(Unit) { viewModel.loadConsultations() }

    val isRefreshing = state is NetworkState.Loading

    Scaffold(
        containerColor = Background,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Tư vấn với bác sĩ", fontWeight = FontWeight.Bold, fontSize = 19.sp)
                        Text("Trao đổi trực tiếp với bác sĩ NovaCare", color = TextSecondary, fontSize = 12.sp)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = viewModel::loadConsultations) {
                        Icon(Icons.Outlined.Refresh, contentDescription = "Làm mới")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = viewModel::loadConsultations,
            modifier = Modifier.fillMaxSize().padding(padding)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    ConsultationModeCard(
                        title = "Đặt lịch tư vấn",
                        description = "Chọn bác sĩ và thời gian tư vấn online phù hợp.",
                        onClick = { navController.navigate(Screen.Search.route) }
                    )
                }
                item {
                    Text("Cuộc tư vấn của bạn", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary,
                        modifier = Modifier.padding(top = 8.dp))
                }
                when (val current = state) {
                    NetworkState.Loading -> items(3) { ConsultationSkeleton() }
                    is NetworkState.Error -> item {
                        InlineConsultationError(current.message, viewModel::loadConsultations)
                    }
                    is NetworkState.Success -> {
                        if (current.data.isEmpty()) item {
                            EmptyConsultations { navController.navigate(Screen.Search.route) }
                        } else items(current.data, key = { it.id }) { consultation ->
                            ConsultationRow(consultation) {
                                navController.navigate(Screen.ConsultationChat.createRoute(consultation.id))
                            }
                        }
                    }
                    else -> Unit
                }
            }
        }
    }
}

@Composable
private fun ConsultationModeCard(title: String, description: String, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = PrimaryLight),
        border = BorderStroke(1.dp, PrimaryBorder)
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = CircleShape, color = Primary, modifier = Modifier.size(48.dp)) {
                Icon(Icons.Outlined.CalendarMonth, contentDescription = null, tint = Color.White, modifier = Modifier.padding(12.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text(description, fontSize = 13.sp, color = TextSecondary, lineHeight = 18.sp)
            }
        }
    }
}

@Composable
private fun ConsultationRow(item: Consultation, onClick: () -> Unit) {
    val last = item.messages.firstOrNull()
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Border)
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = item.doctor.avatarUrl,
                contentDescription = "Ảnh ${item.doctor.fullName}",
                modifier = Modifier.size(48.dp).clip(CircleShape)
            )
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(listOfNotNull(item.doctor.title, item.doctor.fullName).joinToString(" "),
                    fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(item.doctorWorkplace.specialty.name, color = PrimaryDark, fontSize = 12.sp)
                Text(
                    text = last?.let { if (it.senderType == "DOCTOR") "Bác sĩ: ${it.text.orEmpty()}" else it.text.orEmpty() }
                        ?: item.topic,
                    color = TextSecondary,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 5.dp)
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(formatConsultationTime(last?.sentAt ?: item.updatedAt), color = TextMuted, fontSize = 11.sp)
                Spacer(Modifier.height(7.dp))
                ConsultationStatusBadge(item.status)
                if (item.unreadCount > 0) {
                    Spacer(Modifier.height(6.dp))
                    Badge(containerColor = Primary) { Text(item.unreadCount.toString(), color = Color.White) }
                }
            }
        }
    }
}

@Composable
fun ConsultationStatusBadge(status: String) {
    val (label, colors) = when (status) {
        "SCHEDULED" -> "Đã đặt lịch" to (StatusInfoBg to StatusInfoText)
        "WAITING" -> "Chờ bác sĩ" to (StatusWarningBg to StatusWarningText)
        "ACCEPTED" -> "Đã tiếp nhận" to (PrimaryLight to PrimaryDark)
        "ACTIVE" -> "Đang tư vấn" to (StatusSuccessBg to StatusSuccessText)
        "COMPLETED" -> "Đã kết thúc" to (Color(0xFFF1F5F9) to TextSecondary)
        "CANCELLED" -> "Đã hủy" to (StatusErrorBg to StatusErrorText)
        "EXPIRED" -> "Đã hết hạn" to (StatusErrorBg to StatusErrorText)
        else -> status to (Color(0xFFF1F5F9) to TextSecondary)
    }
    Surface(color = colors.first, shape = RoundedCornerShape(20.dp)) {
        Text(label, color = colors.second, fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
    }
}

@Composable
private fun ConsultationSkeleton() {
    Card(Modifier.fillMaxWidth().height(92.dp), colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Border), shape = RoundedCornerShape(16.dp)) {}
}

@Composable
private fun EmptyConsultations(onStart: () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp),
        border = BorderStroke(1.dp, Border)) {
        Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, tint = Primary, modifier = Modifier.size(44.dp))
            Text("Bạn chưa có cuộc tư vấn nào", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 12.dp))
            Text("Đặt lịch online với bác sĩ để bắt đầu trao đổi.", color = TextSecondary, fontSize = 13.sp)
            Button(onClick = onStart, modifier = Modifier.padding(top = 16.dp), colors = ButtonDefaults.buttonColors(containerColor = Primary)) {
                Text("Tìm bác sĩ tư vấn")
            }
        }
    }
}

@Composable
fun InlineConsultationError(message: String, retry: () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = StatusErrorBg), border = BorderStroke(1.dp, StatusErrorText.copy(alpha = .25f))) {
        Column(Modifier.padding(16.dp)) {
            Text(message, color = StatusErrorText)
            TextButton(onClick = retry) { Text("Thử lại") }
        }
    }
}

fun formatConsultationTime(value: String?): String = runCatching {
    Instant.parse(value).atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
        .format(DateTimeFormatter.ofPattern("HH:mm · dd/MM/yyyy"))
}.getOrDefault("")
