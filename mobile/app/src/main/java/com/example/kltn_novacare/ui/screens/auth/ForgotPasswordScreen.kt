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
import androidx.compose.runtime.saveable.rememberSaveable
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
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.PasswordResetViewModel
import kotlinx.coroutines.delay

@Composable
fun ForgotPasswordScreen(
    onBack: () -> Unit,
    vm: PasswordResetViewModel = viewModel()
) {
    val state by vm.state.collectAsState()
    var identifier by rememberSaveable { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }
    var isConfirmVisible by remember { mutableStateOf(false) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    val focusManager = LocalFocusManager.current

    LaunchedEffect(state.resendAt) {
        while (now < state.resendAt) {
            delay(1000)
            now = System.currentTimeMillis()
        }
    }

    // Current step (1: Identifier, 2: OTP, 3: Password, 4: Done)
    val currentStep = when {
        state.done -> 4
        state.verified -> 3
        state.requested -> 2
        else -> 1
    }

    val secondsRemaining = ((state.resendAt - now).coerceAtLeast(0) + 999) / 1000

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
                AuthBackButton(onClick = onBack)
                AuthBrandBadge(title = "Bảo mật NovaCare")
            }

            // Stepper indicator (Only when in progress)
            if (currentStep < 4) {
                AuthStepIndicator(
                    currentStep = currentStep,
                    totalSteps = 3,
                    stepLabels = listOf("Tài khoản", "Mã xác thực", "Mật khẩu mới"),
                    modifier = Modifier.padding(bottom = 24.dp)
                )
            }

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
                            // Step 1: Identifier
                            AuthHeroHeader(
                                icon = Icons.Default.LockReset,
                                title = "Quên mật khẩu?",
                                subtitle = "Nhập số điện thoại hoặc email đã đăng ký để nhận mã OTP khôi phục mật khẩu tài khoản."
                            )

                            Spacer(modifier = Modifier.height(24.dp))

                            state.error?.let {
                                AuthErrorBanner(message = it)
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            OutlinedTextField(
                                value = identifier,
                                onValueChange = { identifier = it },
                                enabled = !state.busy,
                                label = { Text("Số điện thoại hoặc Email") },
                                placeholder = { Text("09x xxx xxxx hoặc email@domain.com") },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.Person,
                                        contentDescription = null,
                                        tint = if (identifier.isNotEmpty()) Primary else TextMuted
                                    )
                                },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = authTextFieldColors(),
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.Email,
                                    imeAction = ImeAction.Done
                                ),
                                keyboardActions = KeyboardActions(onDone = {
                                    focusManager.clearFocus()
                                    vm.request(identifier)
                                })
                            )

                            Spacer(modifier = Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    focusManager.clearFocus()
                                    vm.request(identifier)
                                },
                                enabled = !state.busy && identifier.isNotBlank(),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Primary,
                                    disabledContainerColor = Primary.copy(alpha = 0.4f)
                                )
                            ) {
                                if (state.busy) {
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
                                            text = "Gửi mã xác thực",
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
                                    text = "NovaCare bảo mật 100% dữ liệu hồ sơ bệnh án",
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                            }
                        }

                        2 -> {
                            // Step 2: OTP Verification
                            AuthHeroHeader(
                                icon = Icons.Default.Security,
                                title = "Xác thực mã OTP",
                                subtitle = "Nhập mã OTP 6 chữ số vừa được gửi đến thông tin của bạn."
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            // Account target pill
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
                                        imageVector = Icons.Default.Info,
                                        contentDescription = null,
                                        tint = PrimaryDark,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = state.identifier.ifBlank { identifier },
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Secondary
                                    )
                                }
                                Text(
                                    text = "Đổi lại",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PrimaryDark,
                                    modifier = Modifier
                                        .clickable { vm.resetState() }
                                        .padding(4.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            state.error?.let {
                                AuthErrorBanner(message = it)
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            OutlinedTextField(
                                value = otp,
                                onValueChange = { otp = it.filter(Char::isDigit).take(6) },
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
                                        vm.verify(otp)
                                    }
                                })
                            )

                            Spacer(modifier = Modifier.height(20.dp))

                            Button(
                                onClick = {
                                    focusManager.clearFocus()
                                    vm.verify(otp)
                                },
                                enabled = !state.busy && otp.length == 6,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Primary,
                                    disabledContainerColor = Primary.copy(alpha = 0.4f)
                                )
                            ) {
                                if (state.busy) {
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
                                        text = "Gửi lại mã",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryDark,
                                        modifier = Modifier
                                            .clickable(enabled = !state.busy) {
                                                vm.resend()
                                            }
                                            .padding(4.dp)
                                    )
                                }
                            }
                        }

                        3 -> {
                            // Step 3: Set New Password
                            AuthHeroHeader(
                                icon = Icons.Default.Lock,
                                title = "Mật khẩu mới",
                                subtitle = "Nhập mật khẩu an toàn từ 6 đến 128 ký tự để bảo vệ tài khoản của bạn."
                            )

                            Spacer(modifier = Modifier.height(24.dp))

                            state.error?.let {
                                AuthErrorBanner(message = it)
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            OutlinedTextField(
                                value = password,
                                onValueChange = { password = it },
                                label = { Text("Mật khẩu mới") },
                                placeholder = { Text("Tối thiểu 6 ký tự") },
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

                            Spacer(modifier = Modifier.height(16.dp))

                            OutlinedTextField(
                                value = confirm,
                                onValueChange = { confirm = it },
                                label = { Text("Xác nhận lại mật khẩu") },
                                placeholder = { Text("Nhập lại mật khẩu mới") },
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
                                    vm.reset(password, confirm)
                                })
                            )

                            Spacer(modifier = Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    focusManager.clearFocus()
                                    vm.reset(password, confirm)
                                },
                                enabled = !state.busy && password.isNotBlank() && confirm.isNotBlank(),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Primary,
                                    disabledContainerColor = Primary.copy(alpha = 0.4f)
                                )
                            ) {
                                if (state.busy) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        modifier = Modifier.size(22.dp),
                                        strokeWidth = 2.5.dp
                                    )
                                } else {
                                    Text(
                                        text = "Cập nhật mật khẩu",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            }
                        }

                        4 -> {
                            // Step 4: Done
                            Box(
                                modifier = Modifier
                                    .size(88.dp)
                                    .background(PrimaryLight, CircleShape)
                                    .border(2.dp, PrimaryBorder, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = Primary,
                                    modifier = Modifier.size(52.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            Text(
                                text = "Đổi mật khẩu thành công!",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = Secondary,
                                textAlign = TextAlign.Center
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "Mật khẩu mới đã được cập nhật. Bạn có thể sử dụng mật khẩu này để đăng nhập ngay bây giờ.",
                                fontSize = 14.sp,
                                color = TextSecondary,
                                textAlign = TextAlign.Center,
                                lineHeight = 20.sp
                            )

                            Spacer(modifier = Modifier.height(28.dp))

                            Button(
                                onClick = onBack,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Primary)
                            ) {
                                Text(
                                    text = "Đăng nhập ngay",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }

            if (currentStep < 4) {
                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Nhớ lại mật khẩu? ",
                        fontSize = 14.sp,
                        color = TextSecondary
                    )
                    Text(
                        text = "Đăng nhập ngay",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryDark,
                        modifier = Modifier
                            .clickable(onClick = onBack)
                            .padding(4.dp)
                    )
                }
            }
        }
    }
}
