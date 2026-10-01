package com.example.kltn_novacare.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.kltn_novacare.ui.viewmodel.PreExamViewModel
import com.example.kltn_novacare.ui.screens.screening.*

private val ScreeningGreen = Color(0xFF0C4B39)
@Composable
fun ScreeningPanel(title: String, subtitle: String? = null, content: @Composable ColumnScope.() -> Unit) {
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            subtitle?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            content()
        }
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PreExamScreeningScreen(onSkipScreening: () -> Unit,
    onCompletedToBooking: (String?, String?, String?, String) -> Unit,
    viewModel: PreExamViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    val stepsScroll = rememberScrollState()
    var leaving by remember { mutableStateOf(false) }
    var applied by remember(state.result) { mutableStateOf(false) }
    val locked = state.busy || state.transcribing || state.importing
    val titles = listOf("Vùng đau", "Trắc nghiệm", "Ảnh", "Nhịp tim", "Giọng nói", "Kết quả")
    BackHandler { if (state.step > 0 && !locked) viewModel.step(state.step - 1) else leaving = true }
    if (leaving) AlertDialog(onDismissRequest = { leaving = false }, title = { Text("Rời phiên sàng lọc?") },
        text = { Text("Thông tin và dữ liệu thu thập của phiên này sẽ được xóa khi rời màn hình.") },
        confirmButton = { TextButton(onClick = { leaving = false; onSkipScreening() }) { Text("Rời phiên") } },
        dismissButton = { TextButton(onClick = { leaving = false }) { Text("Tiếp tục") } })
    Scaffold(topBar = { TopAppBar(title = { Text("AI gợi ý chuyên khoa", fontWeight = FontWeight.Bold) },
        navigationIcon = { IconButton(onClick = { if (state.step > 0 && !locked) viewModel.step(state.step - 1) else leaving = true }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Quay lại") } },
        actions = { TextButton(onClick = { leaving = true }) { Text("Đóng") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .3f))) {
            Row(Modifier.fillMaxWidth().horizontalScroll(stepsScroll).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                titles.forEachIndexed { index, label -> FilterChip(selected = state.step == index,
                    enabled = !locked && (index == 0 || state.regions.isNotEmpty()) && (index < 5 || state.result != null),
                    onClick = { viewModel.step(index) }, label = { Text("${index + 1}. $label") }) }
            }
            val scroll = rememberScrollState()
            LaunchedEffect(state.step) { focus.clearFocus(); keyboard?.hide(); scroll.scrollTo(0); stepsScroll.animateScrollTo((stepsScroll.maxValue * state.step / 5f).toInt()) }
            Column(Modifier.weight(1f).verticalScroll(scroll).padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("5 bước thu thập • Kết quả hỗ trợ chọn nơi khám, không thay thế chẩn đoán.", style = MaterialTheme.typography.bodySmall)
                state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.fillMaxWidth()) }
                if (state.error?.contains("Bộ câu hỏi") == true) TextButton(onClick = viewModel::load, enabled = !state.loading) { Text("Tải lại bộ câu hỏi") }
                if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
                if (state.catalog == null && !state.loading) Button(onClick = viewModel::load) { Text("Tải lại dữ liệu") }
                if (state.catalog != null) {
                    if (state.hasWarning && state.step != 5) ScreeningPanel("Câu trả lời cần được đánh giá y tế sớm") {
                        Text("Không cần chờ chụp ảnh, đo nhịp tim hay ghi âm.")
                        Button(onClick = { viewModel.analyze(true) }, enabled = !locked) { Text("Xem hướng dẫn ngay") }
                    }
                    when (state.step) {
                        0 -> {
                            ScreeningPanel("Thông tin người cần khám", "Dùng tuổi của người có triệu chứng, kể cả khi đặt cho người thân.") {
                                OutlinedTextField(state.age, viewModel::age, label = { Text("Tuổi") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true, modifier = Modifier.fillMaxWidth())
                                var hospitalsOpen by remember { mutableStateOf(false) }
                                OutlinedButton(onClick = { hospitalsOpen = true }, modifier = Modifier.fillMaxWidth()) { Text(state.hospitals.find { it.id == state.hospitalId }?.name ?: "Chọn cơ sở y tế (tùy chọn)") }
                                DropdownMenu(expanded = hospitalsOpen, onDismissRequest = { hospitalsOpen = false }) {
                                    DropdownMenuItem(text = { Text("Chọn cơ sở sau") }, onClick = { viewModel.hospital(null); hospitalsOpen = false })
                                    state.hospitals.forEach { h -> DropdownMenuItem(text = { Text(h.name) }, onClick = { viewModel.hospital(h.id); hospitalsOpen = false }) }
                                }
                            }
                            ScreeningPanel("1. Chọn vùng bất thường", "Có thể chọn nhiều vị trí; trái/phải tính theo cơ thể của bạn.") {
                                var query by remember { mutableStateOf("") }
                                OutlinedTextField(query, { query = it }, label = { Text("Tìm vùng, ví dụ: gối, tay, đầu") }, modifier = Modifier.fillMaxWidth())
                                val regions = state.catalog!!.regions.filter { it.name.contains(query, true) }
                                regions.chunked(2).forEach { row -> Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    row.forEach { region -> FilterChip(selected = region.id in state.regions, onClick = { viewModel.region(region.id) }, label = { Text(region.name) }, modifier = Modifier.weight(1f)) }
                                    if (row.size == 1) Spacer(Modifier.weight(1f))
                                } }
                                Text("Đã chọn: " + state.catalog!!.regions.filter { it.id in state.regions }.joinToString { it.name })
                                OutlinedTextField(state.symptoms, viewModel::symptoms, label = { Text("Mô tả triệu chứng thực tế") }, minLines = 3, modifier = Modifier.fillMaxWidth())
                                TextButton(onClick = { viewModel.analyze(true) }, enabled = state.regions.isNotEmpty()) { Text("Kiểm tra lời kể / cảnh báo ngay") }
                            }
                        }
                        1 -> {
                            ScreeningPanel("2. Trắc nghiệm theo vùng", "${state.questions.count { state.answers.containsKey(it.id) }}/${state.questions.size} câu đã trả lời. Không rõ không được xem là Không.") {
                                OutlinedTextField(state.pain, viewModel::pain, label = { Text("Mức đau 0–10 (có thể để trống)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(state.duration, viewModel::duration, label = { Text("Triệu chứng bắt đầu khi nào?") }, modifier = Modifier.fillMaxWidth())
                            }
                            state.questions.forEachIndexed { index, q -> ScreeningPanel("${index + 1}. " + q.question.replace("{regionName}", state.catalog!!.regions.filter { it.id in state.regions && it.id in q.regionIds }.joinToString { it.name }), if (q.safety) "Câu hỏi cảnh báo • cần xác nhận" else null) {
                                val choices = if (q.type == "boolean") listOf("yes" to "Có", "no" to "Không", "unknown" to "Không rõ") else q.options.orEmpty().map { it.value to it.label } + ("unknown" to "Không rõ")
                                choices.forEach { (value, label) -> OutlinedButton(onClick = { viewModel.answer(q.id, value) }, modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.outlinedButtonColors(containerColor = if (state.answers[q.id] == value) ScreeningGreen.copy(alpha = .12f) else Color.Transparent)) {
                                    if (state.answers[q.id] == value) Icon(Icons.Default.Check, null, Modifier.size(18.dp)); Text(label, Modifier.padding(start = 6.dp))
                                } }
                            } }
                            if (state.unansweredSafety.isNotEmpty()) Text("Còn ${state.unansweredSafety.size} câu cảnh báo chưa được xác nhận. Hệ thống có thể cần hỏi thêm trước khi gợi ý.", color = MaterialTheme.colorScheme.error)
                        }
                        2 -> ScreeningPanel("3. Ảnh tổn thương", "Tùy chọn • Tối đa 3 ảnh JPEG/PNG/WebP, mỗi ảnh không quá 5 MB. Chỉ dùng cho tổn thương nhìn thấy bên ngoài.") {
                            ScreeningConsent(state.consent, viewModel::consent)
                            ScreeningImages(state.images, !locked, { uri, file -> viewModel.addImage(context.applicationContext, uri, file) }, viewModel::removeImage, viewModel::error)
                        }
                        3 -> ScreeningPanel("4. Nhịp tim qua camera", "Tùy chọn • Chỉ ghi nhận số đo khi tín hiệu đủ chất lượng. Không dùng để loại trừ tình trạng khẩn cấp.") {
                            state.ppg?.let { Text("${it.bpm} BPM • Ước lượng", style = MaterialTheme.typography.headlineSmall, color = ScreeningGreen) }
                            ScreeningPpgCapture(onResult = viewModel::ppg, onError = viewModel::error)
                        }
                        4 -> ScreeningPanel("5. Giọng nói", "Tùy chọn • Kể triệu chứng thật; hệ thống chuyển thành văn bản, không chẩn đoán qua âm sắc.") {
                            ScreeningConsent(state.consent, viewModel::consent)
                            if (state.consent) ScreeningVoiceCapture(state.transcribing, viewModel::transcribe, viewModel::error)
                            if (state.transcribing) LinearProgressIndicator(Modifier.fillMaxWidth())
                            OutlinedTextField(state.transcript, viewModel::transcript, label = { Text("Lời kể đã chuyển / nhập trực tiếp") }, minLines = 3, modifier = Modifier.fillMaxWidth(), enabled = !state.transcribing)
                            Row(verticalAlignment = Alignment.CenterVertically) { Checkbox(state.confirmed, viewModel::confirm, enabled = state.transcript.isNotBlank() && !state.transcribing); Text("Tôi xác nhận nội dung đúng với triệu chứng của mình.", style = MaterialTheme.typography.bodySmall) }
                        }
                        5 -> {
                            if (state.busy) ScreeningPanel("Đang kiểm tra thông tin") { LinearProgressIndicator(Modifier.fillMaxWidth()); Text("Vui lòng chờ. Ảnh và lời kể có thể cần thêm thời gian xử lý.") }
                            state.result?.let { result -> ScreeningPanel(result.riskLabel ?: "Kết quả sàng lọc") {
                                Text(result.summary.orEmpty())
                                result.recommendedSpecialtyName?.let { Text(it, color = ScreeningGreen, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold) }
                                result.triageDetails?.keyObservations.orEmpty().forEach { Text("• $it", style = MaterialTheme.typography.bodyMedium) }
                                val hasProviderFailure = result.providerErrors.orEmpty().isNotEmpty()
                                val hasRulesRecommendation = result.recommendationSource == "QUESTIONNAIRE_RULES" &&
                                    !result.recommendedSpecialtyId.isNullOrBlank()
                                if (hasRulesRecommendation) {
                                    Text(
                                        "Định hướng sàng lọc đã hoàn tất bằng thông tin đã xác nhận và quy tắc sàng lọc.",
                                        color = ScreeningGreen,
                                        style = MaterialTheme.typography.bodySmall,
                                    )
                                    if (hasProviderFailure) Text(
                                        "Phần đối chiếu RAG/LLM hiện chưa khả dụng; gợi ý này không phải chẩn đoán.",
                                        style = MaterialTheme.typography.bodySmall,
                                    )
                                } else if (hasProviderFailure) {
                                    Text(
                                        if (result.providerErrors.orEmpty().any { it.code == "INSUFFICIENT_BALANCE" })
                                            "Không thể hoàn tất phân tích RAG/LLM vì tài khoản nhà cung cấp đã hết số dư."
                                        else "Không thể hoàn tất phân tích RAG/LLM. Vui lòng thử lại sau.",
                                        color = MaterialTheme.colorScheme.error,
                                    )
                                }
                                if (result.recommendationSource == "RAG_LLM") Text("Gợi ý có đối chiếu tài liệu tham khảo.", style = MaterialTheme.typography.bodySmall)
                                Text(result.ppg?.bpm?.let { "Nhịp tim: $it BPM (ước lượng)" } ?: "Chưa có số đo nhịp tim đủ chất lượng.")
                                if (result.modalityStatuses?.get("image") in listOf("PARTIAL_OR_FAILED", "LOW_QUALITY_OR_UNRELATED")) Text("Ảnh chưa đủ rõ hoặc chưa phân tích được.")
                                result.imageAnalysisFindings.orEmpty().forEach { Text("Quan sát ảnh: $it") }
                                result.citations.orEmpty().forEach { citation -> TextButton(onClick = { if (citation.sourceUrl.startsWith("https://")) runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(citation.sourceUrl))) } }) { Text(citation.title) } }
                                if (result.nextAction == "EMERGENCY_GUIDANCE") Button(onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:115"))) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) { Text("Gọi 115 / tìm hỗ trợ cấp cứu") }
                                if (state.canApply) Button(onClick = {
                                    if (!applied && viewModel.uiState.value.canApply) { applied = true; onCompletedToBooking(null, result.recommendedSpecialtyId, state.hospitalId, result.summary.orEmpty()) }
                                }, enabled = !applied, modifier = Modifier.fillMaxWidth()) { Text("Áp dụng chuyên khoa vào đặt khám") }
                                if (result.nextAction == "CHOOSE_FACILITY") TextButton(onClick = { viewModel.step(0) }) { Text("Chọn cơ sở và kiểm tra lại") }
                                TextButton(onClick = { viewModel.step(if (result.decisionReason == "REGION_CONFLICT") 0 else 1) }) { Text("Kiểm tra lại thông tin") }
                            } }
                            if (!state.busy) OutlinedButton(onClick = { viewModel.analyze() }) { Text("${if (state.result == null) "Thử" else "Phân tích"} lại") }
                        }
                    }
                    if (state.step < 5) {
                        Button(onClick = { if (state.step == 4) viewModel.analyze() else viewModel.step(state.step + 1) }, enabled = !locked && state.regions.isNotEmpty(), modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp), colors = ButtonDefaults.buttonColors(containerColor = ScreeningGreen), shape = RoundedCornerShape(14.dp)) {
                            Text(if (state.step == 4) "Phân tích và xem gợi ý" else "Tiếp tục")
                        }
                        if (state.step in 2..4) TextButton(onClick = {
                            when (state.step) { 2 -> state.images.forEach(viewModel::removeImage); 3 -> viewModel.ppg(null); 4 -> viewModel.transcript("") }
                            if (state.step == 4) viewModel.analyze() else viewModel.step(state.step + 1)
                        }, enabled = !locked, modifier = Modifier.fillMaxWidth()) { Text("Bỏ qua bước này") }
                    }
                }
            }
        }
    }
}

@Composable
private fun ScreeningConsent(checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.Top) { Checkbox(checked, onChange); Text("Tôi đồng ý gửi ảnh/bản ghi đã chọn đến nhà cung cấp AI được NovaCare cấu hình để xử lý. File của phiên này không được lưu vào hồ sơ; có thể bỏ qua các bước này.", style = MaterialTheme.typography.bodySmall) }
}
