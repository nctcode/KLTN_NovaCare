package com.example.kltn_novacare.ui.screens.consultation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.kltn_novacare.data.model.displayFullNameWithTitle
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.ConsultationViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConsultationPrecheckScreen(appointmentId: String, navController: NavController, viewModel: ConsultationViewModel) {
    val appointmentState by viewModel.appointment.collectAsState()
    val createState by viewModel.createState.collectAsState()
    var topic by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    var consent by rememberSaveable { mutableStateOf(false) }
    var video by rememberSaveable { mutableStateOf(false) }
    val videoAvailable by viewModel.videoAvailable.collectAsState()
    LaunchedEffect(appointmentId) {
        viewModel.resetCreateState()
        viewModel.prepareAppointment(appointmentId)
        viewModel.loadVideoCapabilities()
    }
    val busy = createState is NetworkState.Loading

    Scaffold(
        containerColor = Background,
        topBar = {
            TopAppBar(
                title = { Text("Thông tin trước tư vấn", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            when (val current = appointmentState) {
                NetworkState.Loading -> LinearProgressIndicator(Modifier.fillMaxWidth(), color = Primary)
                is NetworkState.Error -> InlineConsultationError(current.message) { viewModel.prepareAppointment(appointmentId) }
                is NetworkState.Success -> {
                    val appointment = current.data
                    Card(colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, Border)) {
                        Column(Modifier.padding(16.dp)) {
                            Text("Lịch tư vấn", fontWeight = FontWeight.Bold)
                            Text(appointment.slot?.doctorWorkplace?.doctor?.displayFullNameWithTitle ?: "Bác sĩ chưa cập nhật", color = TextPrimary)
                            Text(appointment.slot?.doctorWorkplace?.specialty?.name ?: "Chuyên khoa chưa cập nhật", color = PrimaryDark)
                            Text(formatConsultationTime(appointment.slot?.startTime), color = TextSecondary, fontSize = 13.sp)
                            Text(appointment.patientProfile?.fullName ?: "Hồ sơ bệnh nhân", color = TextSecondary, fontSize = 13.sp)
                        }
                    }
                }
                else -> Unit
            }

            val topicValid = topic.trim().length >= 2
            val descriptionValid = description.trim().length >= 10
            val topicError = topic.isNotEmpty() && !topicValid
            val descriptionError = description.isNotEmpty() && !descriptionValid

            Text("Hình thức tư vấn", fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                FilterChip(selected = !video, onClick = { video = false }, enabled = !busy, label = { Text("Nhắn tin") })
                if (videoAvailable) FilterChip(selected = video, onClick = { video = true }, enabled = !busy, label = { Text("Video và chat") })
            }
            if (!videoAvailable) Text("Dịch vụ video chưa sẵn sàng tại hệ thống.", color = TextSecondary, fontSize = 12.sp)
            Text("Bạn cần tư vấn vấn đề gì?", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            OutlinedTextField(
                value = topic,
                onValueChange = { if (it.length <= 120) topic = it },
                label = { Text("Chủ đề") },
                placeholder = { Text("Ví dụ: Đau khớp gối") },
                modifier = Modifier.fillMaxWidth(),
                enabled = !busy,
                isError = topicError,
                supportingText = {
                    Text(
                        if (topicError) "Chủ đề cần ít nhất 2 ký tự (${topic.trim().length}/120)"
                        else "${topic.length}/120 (Tối thiểu 2 ký tự)",
                        color = if (topicError) StatusErrorText else TextSecondary
                    )
                },
                shape = RoundedCornerShape(12.dp)
            )
            OutlinedTextField(
                value = description,
                onValueChange = { if (it.length <= 4000) description = it },
                label = { Text("Mô tả") },
                placeholder = { Text("Mô tả triệu chứng, thời điểm bắt đầu và điều bạn muốn hỏi bác sĩ...") },
                modifier = Modifier.fillMaxWidth().heightIn(min = 150.dp),
                enabled = !busy,
                minLines = 5,
                isError = descriptionError,
                supportingText = {
                    Text(
                        if (descriptionError) "Mô tả cần ít nhất 10 ký tự (hiện có ${description.trim().length}/4000)"
                        else "${description.length}/4000 (Tối thiểu 10 ký tự)",
                        color = if (descriptionError) StatusErrorText else TextSecondary
                    )
                },
                shape = RoundedCornerShape(12.dp)
            )

            Card(colors = CardDefaults.cardColors(containerColor = PrimaryLight), border = BorderStroke(1.dp, PrimaryBorder)) {
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                    Icon(Icons.Outlined.Info, contentDescription = null, tint = PrimaryDark)
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Thông tin y tế của bạn", fontWeight = FontWeight.Bold)
                        Text("Nội dung bạn gửi được sử dụng để bác sĩ hỗ trợ trong phiên tư vấn này.", color = TextSecondary, fontSize = 13.sp)
                    }
                }
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = consent, onCheckedChange = { consent = it }, enabled = !busy, colors = CheckboxDefaults.colors(checkedColor = Primary))
                    Text("Tôi đồng ý chia sẻ thông tin này với bác sĩ tư vấn.", fontSize = 13.sp, modifier = Modifier.weight(1f))
                }
            }

            if (createState is NetworkState.Error) {
                InlineConsultationError((createState as NetworkState.Error).message) { viewModel.resetCreateState() }
            }

            val missingConditions = buildList {
                if (!topicValid) add("Chủ đề cần tối thiểu 2 ký tự")
                if (!descriptionValid) add("Mô tả cần tối thiểu 10 ký tự (đã nhập ${description.trim().length}/10)")
                if (!consent) add("Vui lòng tích chọn đồng ý chia sẻ thông tin")
            }
            if (missingConditions.isNotEmpty() && (topic.isNotEmpty() || description.isNotEmpty())) {
                Surface(
                    color = StatusWarningBg,
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, StatusWarningText.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(Modifier.padding(12.dp)) {
                        Text("Chưa đủ điều kiện tạo phiên:", fontWeight = FontWeight.SemiBold, fontSize = 12.sp, color = StatusWarningText)
                        Spacer(Modifier.height(4.dp))
                        missingConditions.forEach { condition ->
                            Text("• $condition", fontSize = 12.sp, color = StatusWarningText)
                        }
                    }
                }
            }

            Button(
                onClick = {
                    viewModel.createConsultation(appointmentId, topic, description, if (video && videoAvailable) "VIDEO" else "CHAT") { id ->
                        navController.navigate(Screen.ConsultationChat.createRoute(id)) {
                            popUpTo(Screen.ConsultationPrecheck.route) { inclusive = true }
                        }
                    }
                },
                enabled = !busy && appointmentState is NetworkState.Success && topicValid && descriptionValid && consent,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(14.dp)
            ) {
                if (busy) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                else Text("Tạo phiên tư vấn", fontWeight = FontWeight.Bold)
            }
            Text("NovaCare không tự động chia sẻ bệnh án hoặc kết quả AI trong bước này.", color = TextMuted, fontSize = 12.sp)
        }
    }
}
