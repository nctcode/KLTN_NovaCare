package com.example.kltn_novacare.ui.screens.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.viewmodel.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(navController: NavController, authViewModel: AuthViewModel, otpViewModel: RegistrationOtpViewModel = viewModel()) {
    val otpState by otpViewModel.state.collectAsState(); val authState by authViewModel.authState.collectAsState()
    var phone by remember { mutableStateOf("") }; var otp by remember { mutableStateOf("") }; var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; var confirm by remember { mutableStateOf("") }; var localError by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(authState) { if (authState is AuthState.Authenticated) navController.navigate(Screen.Home.route) { popUpTo(Screen.Register.route) { inclusive = true } } }
    Scaffold(topBar = { TopAppBar(title = { Text("Đăng ký NovaCare") }, navigationIcon = { TextButton(onClick = { navController.popBackStack() }) { Text("Quay lại") } }) }) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(if (!otpState.requested) "Xác minh số điện thoại" else if (!otpState.verified) "Nhập mã OTP" else "Thông tin tài khoản", style = MaterialTheme.typography.headlineSmall)
            (localError ?: otpState.error ?: (authState as? AuthState.Error)?.message)?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            if (!otpState.requested) {
                OutlinedTextField(phone, { phone = it }, label = { Text("Số điện thoại") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                Button(onClick = { otpViewModel.request(phone) }, enabled = !otpState.busy, modifier = Modifier.fillMaxWidth()) { Text("Gửi mã OTP") }
            } else if (!otpState.verified) {
                Text("Mã 6 chữ số đã được gửi đến ${otpState.phone}")
                OutlinedTextField(otp, { otp = it.filter(Char::isDigit).take(6) }, label = { Text("Mã OTP 6 chữ số") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                Button(onClick = { otpViewModel.verify(otp) }, enabled = !otpState.busy, modifier = Modifier.fillMaxWidth()) { Text("Xác nhận OTP") }
            } else {
                Text("Số ${otpState.phone} đã được xác minh.")
                OutlinedTextField(name, { name = it }, label = { Text("Họ và tên") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(email, { email = it }, label = { Text("Email (tùy chọn)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(password, { password = it }, label = { Text("Mật khẩu") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(confirm, { confirm = it }, label = { Text("Xác nhận mật khẩu") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth(), singleLine = true)
                Button(onClick = {
                    localError = when { name.isBlank() -> "Nhập họ và tên"; password.length < 8 -> "Mật khẩu cần ít nhất 8 ký tự"; password != confirm -> "Mật khẩu xác nhận không khớp"; else -> null }
                    if (localError == null) authViewModel.register(name.trim(), email.trim().ifBlank { null }, otpState.phone, password, otpState.token) {}
                }, enabled = authState !is AuthState.Loading, modifier = Modifier.fillMaxWidth()) { Text("Đăng ký tài khoản") }
            }
            if (otpState.busy || authState is AuthState.Loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        }
    }
}
