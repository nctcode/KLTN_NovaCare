package com.example.kltn_novacare.ui.screens.profile

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.kltn_novacare.data.model.CreateHealthShareRequest
import com.example.kltn_novacare.data.model.HealthShare
import com.example.kltn_novacare.data.model.healthShareSections
import com.example.kltn_novacare.ui.viewmodel.HealthShareViewModel
import com.example.kltn_novacare.ui.viewmodel.NetworkState
import kotlinx.coroutines.delay
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private fun shareExpiry(value: String): String = runCatching {
    DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault()).format(Instant.parse(value))
}.getOrDefault(value)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicalPassportShareDialog(onDismiss: () -> Unit, shareViewModel: HealthShareViewModel = viewModel()) {
    val shares by shareViewModel.shares.collectAsState()
    val operation by shareViewModel.operation.collectAsState()
    val busy = operation is NetworkState.Loading
    val error = (operation as? NetworkState.Error)?.message
    var createOpen by rememberSaveable { mutableStateOf(false) }
    var revokeTarget by remember { mutableStateOf<HealthShare?>(null) }
    var now by remember { mutableStateOf(Instant.now()) }
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current

    LaunchedEffect(Unit) {
        shareViewModel.resetOperation()
        shareViewModel.loadShares()
        while (true) {
            now = Instant.now()
            delay(1_000)
        }
    }

    Dialog(onDismissRequest = { if (!busy) onDismiss() }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Scaffold(
            topBar = {
                TopAppBar(title = { Text("Chia sẻ hồ sơ y tế") }, navigationIcon = {
                    IconButton(onClick = onDismiss, enabled = !busy) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                }, actions = {
                    IconButton(onClick = { shareViewModel.loadShares() }, enabled = !busy && shares !is NetworkState.Loading) {
                        Icon(Icons.Default.Refresh, contentDescription = "Tải lại mã chia sẻ")
                    }
                })
            }
        ) { padding ->
            LazyColumn(Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Text("Mã chia sẻ dùng hồ sơ khám chính của tài khoản, giống trang liên thông trên web.",
                        style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = { shareViewModel.resetOperation(); createOpen = true },
                        enabled = !busy && shares is NetworkState.Success, modifier = Modifier.fillMaxWidth()) {
                        Text("Tạo mã chia sẻ")
                    }
                }
                if (error != null && !createOpen && revokeTarget == null) item {
                    Text(error, color = MaterialTheme.colorScheme.error)
                }
                when (val state = shares) {
                    is NetworkState.Success -> {
                        if (state.data.isEmpty()) item { Text("Chưa có mã chia sẻ. Tạo mã để cơ sở y tế tra cứu hồ sơ.") }
                        items(state.data, key = { it.id }) { share ->
                            val usable = share.isUsable(now)
                            Card(Modifier.fillMaxWidth()) {
                                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(share.shareToken, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                    Text(when {
                                        share.isActive == false || share.revokedAt != null -> "Đã thu hồi"
                                        usable -> "Đang có hiệu lực"
                                        else -> "Đã hết hạn"
                                    }, color = if (usable) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text("Hết hạn: ${shareExpiry(share.validUntil)}")
                                    share.sharedWith?.let { Text("Nơi nhận: $it") }
                                    if (usable && !share.pinCode.isNullOrBlank()) Text("PIN: ${share.pinCode}", fontWeight = FontWeight.SemiBold)
                                    Text("Phạm vi: ${share.allowedSections.orEmpty().joinToString(", ")}", style = MaterialTheme.typography.bodySmall)
                                    Text("Số lượt truy cập: ${share.accessCount}", style = MaterialTheme.typography.bodySmall)
                                    if (usable) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedButton(enabled = !busy, onClick = {
                                            // Recheck time at click; never copy a code that has just expired.
                                            if (share.isUsable()) {
                                                val pinText = share.pinCode?.let { "\nPIN: $it" }.orEmpty()
                                                clipboard.setText(AnnotatedString("Mã hồ sơ NovaCare: ${share.shareToken}$pinText\nHết hạn: ${shareExpiry(share.validUntil)}"))
                                                Toast.makeText(context, "Đã sao chép mã chia sẻ", Toast.LENGTH_SHORT).show()
                                            }
                                        }) { Text("Sao chép") }
                                        TextButton(enabled = !busy, onClick = { shareViewModel.resetOperation(); revokeTarget = share }) { Text("Thu hồi") }
                                    }
                                }
                            }
                        }
                    }
                    is NetworkState.Error -> item {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        TextButton(onClick = { shareViewModel.loadShares() }) { Text("Thử lại") }
                    }
                    else -> item { Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
                }
            }
        }
    }

    if (createOpen) CreateHealthShareDialog(busy, error,
        onDismiss = { createOpen = false },
        onCreate = { request -> shareViewModel.createShare(request) { createOpen = false } })

    revokeTarget?.let { share ->
        AlertDialog(onDismissRequest = { if (!busy) revokeTarget = null }, title = { Text("Thu hồi mã chia sẻ?") },
            text = { Column {
                Text("Mã ${share.shareToken} sẽ không còn dùng để tra cứu hồ sơ.")
                error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            } },
            confirmButton = { Button(enabled = !busy, onClick = {
                shareViewModel.revokeShare(share.id) { revokeTarget = null }
            }) { Text(if (busy) "Đang thu hồi..." else "Thu hồi") } },
            dismissButton = { TextButton(enabled = !busy, onClick = { revokeTarget = null }) { Text("Hủy") } })
    }
}

@Composable
private fun CreateHealthShareDialog(busy: Boolean, error: String?, onDismiss: () -> Unit, onCreate: (CreateHealthShareRequest) -> Unit) {
    var duration by rememberSaveable { mutableStateOf(1440) }
    var sections by remember { mutableStateOf(healthShareSections) }
    var recipient by rememberSaveable { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }
    var submitted by rememberSaveable { mutableStateOf(false) }
    val validation = when {
        sections.isEmpty() -> "Chọn ít nhất một loại dữ liệu"
        pin.isNotBlank() && !Regex("[0-9]{4,6}").matches(pin) -> "PIN phải gồm 4–6 chữ số"
        else -> null
    }
    AlertDialog(onDismissRequest = { if (!busy) onDismiss() }, title = { Text("Tạo mã chia sẻ") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Thời hạn hiệu lực", fontWeight = FontWeight.Bold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(listOf(15 to "15 phút", 60 to "1 giờ", 1440 to "1 ngày", 4320 to "3 ngày", 10080 to "7 ngày")) { (minutes, label) ->
                        FilterChip(selected = duration == minutes, enabled = !busy, onClick = { duration = minutes }, label = { Text(label) })
                    }
                }
                OutlinedTextField(value = recipient, onValueChange = { recipient = it }, enabled = !busy,
                    label = { Text("Tên cơ sở nhận (tùy chọn)") }, modifier = Modifier.fillMaxWidth())
                Text("Để trống nếu chia sẻ cho bất kỳ cơ sở y tế nào có mã.", style = MaterialTheme.typography.bodySmall)
                OutlinedTextField(value = pin, onValueChange = { pin = it }, enabled = !busy,
                    label = { Text("PIN riêng (tùy chọn)") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword), modifier = Modifier.fillMaxWidth())
                Text("Để trống để máy chủ tạo PIN tự động.", style = MaterialTheme.typography.bodySmall)
                Text("Phạm vi dữ liệu", fontWeight = FontWeight.Bold)
                healthShareSections.forEach { section ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = section in sections, enabled = !busy, onCheckedChange = { checked ->
                            sections = if (checked) sections + section else sections - section
                        })
                        Text(section)
                    }
                }
            }
        },
        confirmButton = { Column {
            val message = error ?: validation.takeIf { submitted }
            message?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            Button(enabled = !busy, onClick = {
                submitted = true
                if (validation == null) onCreate(CreateHealthShareRequest(duration, sections,
                    recipient.trim().ifBlank { "Bất kỳ bệnh viện nào có mã" }, pin.ifBlank { null }))
            }) { Text(if (busy) "Đang tạo..." else "Tạo mã") }
        } },
        dismissButton = { TextButton(enabled = !busy, onClick = onDismiss) { Text("Hủy") } })
}
