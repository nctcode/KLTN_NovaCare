package com.example.kltn_novacare.ui.screens.auth

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.*
import kotlinx.coroutines.delay

@Composable
fun RegisterScreen(
    navController: NavController,
    authViewModel: AuthViewModel,
    otpViewModel: RegistrationOtpViewModel = viewModel()
) {
    val otpState by otpViewModel.state.collectAsState()
    val authState by authViewModel.authState.collectAsState()

    var phone by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }
    var isConfirmVisible by remember { mutableStateOf(false) }
    var localError by remember { mutableStateOf<String?>(null) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    val focusManager = LocalFocusManager.current

    LaunchedEffect(otpState.resendAt) {
        while (now < otpState.resendAt) {
            delay(1000)
            now = System.currentTimeMillis()
        }
    }

    LaunchedEffect(authState) {
        if (authState is AuthState.Authenticated) {
            navController.navigate(Screen.Home.route) {
                popUpTo(Screen.Register.route) { inclusive = true }
            }
        }
    }

    val currentStep = when {
        otpState.verified -> 3
        otpState.requested -> 2
        else -> 1
    }

    val secondsRemaining = ((otpState.resendAt - now).coerceAtLeast(0) + 999) / 1000

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            // Top App Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                AuthBackButton(onClick = {
                    if (currentStep == 2) {
                        otpViewModel.reset()
                    } else {
                        navController.popBackStack()
                    }
                })

                AuthBrandBadge(title = "Đăng ký NovaCare")
            }

            // Stepper indicator
            AuthStepIndicator(
                currentStep = currentStep,
                totalSteps = 3,
                stepLabels = listOf("Số điện thoại", "Xác minh OTP", "Hồ sơ cá nhân"),
                modifier = Modifier.padding(bottom = 24.dp)
            )

            // Main Card Container
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderLight)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    when (currentStep) {
                        1 -> {
                            // Step 1: Phone number
                            AuthHeroHeader(
                                icon = Icons.Default.Phone,
                                title = "Xác minh số điện thoại",
                                subtitle = "Nhập số điện thoại để nhận mã xác thực OTP bảo mật từ hệ thống NovaCare."
                            )

                            Spacer(modifier = Modifier.height(24.dp))

                            val error = localError ?: otpState.error
                            if (error != null) {
                                AuthErrorBanner(message = error)
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            OutlinedTextField(
                                value = phone,
                                onValueChange = {
                                    phone = it
                                    localError = null
                                },
                                enabled = !otpState.busy,
                                label = { Text("Số điện thoại") },
                                placeholder = { Text("09x xxx xxxx") },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Phone,
                                        contentDescription = null,
                                        tint = if (phone.isNotEmpty()) Primary else TextMuted
                                    )
                                },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = authTextFieldColors(),
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.Phone,
                                    imeAction = ImeAction.Done
                                ),
                                keyboardActions = KeyboardActions(onDone = {
                                    focusManager.clearFocus()
                                    if (phone.trim().length < 9) {
                                        localError = "Vui lòng nhập số điện thoại hợp lệ"
                                    } else {
                                        otpViewModel.request(phone)
                                    }
                                })
                            )

                            Spacer(modifier = Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    focusManager.clearFocus()
                                    if (phone.trim().length < 9) {
                                        localError = "Vui lòng nhập số điện thoại hợp lệ"
                                    } else {
                                        otpViewModel.request(phone)
                                    }
                                },
                                enabled = !otpState.busy && phone.isNotBlank(),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Primary,
                                    disabledContainerColor = Primary.copy(alpha = 0.4f)
                                )
                            ) {
                                if (otpState.busy) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        modifier = Modifier.size(22.dp),
                                        strokeWidth = 2.5.dp
                                    )
                                } else {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        Text(
                                            text = "Gửi mã OTP",
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Icon(
                                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Background, RoundedCornerShape(12.dp))
                                    .padding(horizontal = 12.dp, vertical = 10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Security,
                                    contentDescription = null,
                                    tint = PrimaryDark,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "NovaCare cam kết bảo mật 100% dữ liệu sức khỏe",
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                            }
                        }

                        2 -> {
                            // Step 2: OTP verification
                            AuthHeroHeader(
                                icon = Icons.Default.Security,
                                title = "Nhập mã xác thực OTP",
                                subtitle = "Mã xác thực 6 chữ số vừa được gửi đến số điện thoại:"
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            // Phone Target Card with Edit button
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(PrimaryLight, RoundedCornerShape(12.dp))
                                    .border(1.dp, PrimaryBorder, RoundedCornerShape(12.dp))
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Phone,
                                        contentDescription = null,
                                        tint = PrimaryDark,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = otpState.phone,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Secondary
                                    )
                                }
                                Text(
                                    text = "Đổi số",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryDark,
                                    modifier = Modifier
                                        .clickable { otpViewModel.reset() }
                                        .padding(4.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            val error = localError ?: otpState.error
                            if (error != null) {
                                AuthErrorBanner(message = error)
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            OutlinedTextField(
                                value = otp,
                                onValueChange = {
                                    otp = it.filter(Char::isDigit).take(6)
                                    localError = null
                                },
                                label = { Text("Mã OTP 6 chữ số") },
                                placeholder = { Text("• • • • • •") },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Key,
                                        contentDescription = null,
                                        tint = if (otp.isNotEmpty()) Primary else TextMuted
                                    )
                                },
                                singleLine = true,
                                textStyle = TextStyle(
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 6.sp,
                                    textAlign = TextAlign.Center
                                ),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = authTextFieldColors(),
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.NumberPassword,
                                    imeAction = ImeAction.Done
                                ),
                                keyboardActions = KeyboardActions(onDone = {
                                    if (otp.length == 6) {
                                        focusManager.clearFocus()
                                        otpViewModel.verify(otp)
                                    }
                                })
                            )

                            Spacer(modifier = Modifier.height(20.dp))

                            Button(
                                onClick = {
                                    focusManager.clearFocus()
                                    otpViewModel.verify(otp)
                                },
                                enabled = !otpState.busy && otp.length == 6,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Primary,
                                    disabledContainerColor = Primary.copy(alpha = 0.4f)
                                )
                            ) {
                                if (otpState.busy) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        modifier = Modifier.size(22.dp),
                                        strokeWidth = 2.5.dp
                                    )
                                } else {
                                    Text(
                                        text = "Xác nhận OTP",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Resend timer
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Chưa nhận được mã? ",
                                    fontSize = 13.sp,
                                    color = TextSecondary
                                )
                                if (secondsRemaining > 0) {
                                    Text(
                                        text = "Gửi lại sau (${secondsRemaining}s)",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextMuted
                                    )
                                } else {
                                    Text(
                                        text = "Gửi lại mã OTP",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryDark,
                                        modifier = Modifier
                                            .clickable(enabled = !otpState.busy) {
                                                otpViewModel.resend()
                                            }
                                            .padding(4.dp)
                                    )
                                }
                            }
                        }

                        3 -> {
                            // Step 3: Profile & Password Details
                            AuthHeroHeader(
                                icon = Icons.Default.PersonAdd,
                                title = "Thông tin tài khoản",
                                subtitle = "Số điện thoại đã được xác thực thành công. Vui lòng thiết lập thông tin hồ sơ của bạn."
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            // Verified badge
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(StatusSuccessBg, RoundedCornerShape(12.dp))
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = StatusSuccessText,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Đã xác minh: ${otpState.phone}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = StatusSuccessText
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            val error = localError ?: (authState as? AuthState.Error)?.message
                            if (error != null) {
                                AuthErrorBanner(message = error)
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            // Full Name
                            OutlinedTextField(
                                value = name,
                                onValueChange = {
                                    name = it
                                    localError = null
                                },
                                label = { Text("Họ và tên *") },
                                placeholder = { Text("Ví dụ: Nguyễn Văn A") },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Person,
                                        contentDescription = null,
                                        tint = if (name.isNotEmpty()) Primary else TextMuted
                                    )
                                },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = authTextFieldColors(),
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.Text,
                                    imeAction = ImeAction.Next
                                )
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            // Email (Optional)
                            OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                label = { Text("Email (tùy chọn)") },
                                placeholder = { Text("email@example.com để nhận kết quả khám") },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Email,
                                        contentDescription = null,
                                        tint = if (email.isNotEmpty()) Primary else TextMuted
                                    )
                                },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = authTextFieldColors(),
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.Email,
                                    imeAction = ImeAction.Next
                                )
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            // Password
                            OutlinedTextField(
                                value = password,
                                onValueChange = {
                                    password = it
                                    localError = null
                                },
                                label = { Text("Mật khẩu (tối thiểu 8 ký tự) *") },
                                placeholder = { Text("Nhập mật khẩu") },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = null,
                                        tint = if (password.isNotEmpty()) Primary else TextMuted
                                    )
                                },
                                trailingIcon = {
                                    IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                        Icon(
                                            imageVector = if (isPasswordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                                            contentDescription = "Ẩn/hiện mật khẩu",
                                            tint = TextMuted
                                        )
                                    }
                                },
                                visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = authTextFieldColors(),
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.Password,
                                    imeAction = ImeAction.Next
                                )
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            // Confirm Password
                            OutlinedTextField(
                                value = confirm,
                                onValueChange = {
                                    confirm = it
                                    localError = null
                                },
                                label = { Text("Xác nhận lại mật khẩu *") },
                                placeholder = { Text("Nhập lại mật khẩu") },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.LockReset,
                                        contentDescription = null,
                                        tint = if (confirm.isNotEmpty()) Primary else TextMuted
                                    )
                                },
                                trailingIcon = {
                                    IconButton(onClick = { isConfirmVisible = !isConfirmVisible }) {
                                        Icon(
                                            imageVector = if (isConfirmVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                                            contentDescription = "Ẩn/hiện mật khẩu",
                                            tint = TextMuted
                                        )
                                    }
                                },
                                visualTransformation = if (isConfirmVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = authTextFieldColors(),
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.Password,
                                    imeAction = ImeAction.Done
                                ),
                                keyboardActions = KeyboardActions(onDone = {
                                    focusManager.clearFocus()
                                    localError = when {
                                        name.isBlank() -> "Vui lòng nhập họ và tên"
                                        password.length < 8 -> "Mật khẩu cần ít nhất 8 ký tự"
                                        password != confirm -> "Mật khẩu xác nhận không khớp"
                                        else -> null
                                    }
                                    if (localError == null) {
                                        authViewModel.register(
                                            name.trim(),
                                            email.trim().ifBlank { null },
                                            otpState.phone,
                                            password,
                                            otpState.token
                                        ) {}
                                    }
                                })
                            )

                            Spacer(modifier = Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    focusManager.clearFocus()
                                    localError = when {
                                        name.isBlank() -> "Vui lòng nhập họ và tên"
                                        password.length < 8 -> "Mật khẩu cần ít nhất 8 ký tự"
                                        password != confirm -> "Mật khẩu xác nhận không khớp"
                                        else -> null
                                    }
                                    if (localError == null) {
                                        authViewModel.register(
                                            name.trim(),
                                            email.trim().ifBlank { null },
                                            otpState.phone,
                                            password,
                                            otpState.token
                                        ) {}
                                    }
                                },
                                enabled = authState !is AuthState.Loading,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Primary)
                            ) {
                                if (authState is AuthState.Loading) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        modifier = Modifier.size(22.dp),
                                        strokeWidth = 2.5.dp
                                    )
                                } else {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        Text(
                                            text = "Đăng ký tài khoản",
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Footer Link: Login
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Đã có tài khoản? ",
                    fontSize = 14.sp,
                    color = TextSecondary
                )
                Text(
                    text = "Đăng nhập ngay",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryDark,
                    modifier = Modifier
                        .clickable { navController.popBackStack() }
                        .padding(4.dp)
                )
            }
        }
    }
}
