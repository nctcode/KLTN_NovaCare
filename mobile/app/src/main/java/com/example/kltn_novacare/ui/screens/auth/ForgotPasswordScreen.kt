package com.example.kltn_novacare.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.kltn_novacare.ui.viewmodel.PasswordResetViewModel
import kotlinx.coroutines.delay

@Composable
fun ForgotPasswordScreen(onBack: () -> Unit, vm: PasswordResetViewModel = viewModel()) {
    val state by vm.state.collectAsState()
    var identifier by rememberSaveable { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(state.resendAt) { while (now < state.resendAt) { delay(1000); now = System.currentTimeMillis() } }
    Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().imePadding().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        TextButton(onClick = onBack) { Text("Quay lại đăng nhập") }
        Text("Quên mật khẩu", style = MaterialTheme.typography.headlineMedium)
        if (state.done) {
            Text("Đổi mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.")
            Button(onClick = onBack) { Text("Đăng nhập") }
        } else {
            OutlinedTextField(identifier, { identifier = it }, enabled = !state.requested && !state.busy, label = { Text("Số điện thoại hoặc email") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            if (state.requested && !state.verified) {
                Text("Nếu tài khoản hợp lệ, mã sẽ được gửi đến thông tin bạn cung cấp. Mã có hiệu lực 5 phút.")
                OutlinedTextField(otp, { otp = it.filter(Char::isDigit).take(6) }, label = { Text("Mã OTP 6 chữ số") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                Button(onClick = { vm.verify(otp) }, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Xác nhận OTP") }
            }
            if (state.verified) {
                Text("OTP đã được xác minh. Hãy nhập mật khẩu mới.")
                OutlinedTextField(password, { password = it }, label = { Text("Mật khẩu mới") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(confirm, { confirm = it }, label = { Text("Nhập lại mật khẩu") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth(), singleLine = true)
                Button(onClick = { vm.reset(password, confirm) }, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Đổi mật khẩu") }
            }
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            val seconds = ((state.resendAt - now).coerceAtLeast(0) + 999) / 1000
            if (!state.verified) OutlinedButton(onClick = { vm.request(identifier) }, enabled = !state.busy && seconds == 0L, modifier = Modifier.fillMaxWidth()) { Text(if (!state.requested) "Gửi mã xác thực" else if (seconds > 0) "Gửi lại sau ${seconds}s" else "Gửi lại mã") }
            if (state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        }
    }
}
