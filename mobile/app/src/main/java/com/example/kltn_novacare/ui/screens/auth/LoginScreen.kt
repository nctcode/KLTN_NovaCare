package com.example.kltn_novacare.ui.screens.auth

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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.theme.*
import com.example.kltn_novacare.ui.viewmodel.AuthState
import com.example.kltn_novacare.ui.viewmodel.AuthViewModel

@Composable
fun LoginScreen(
    navController: NavController,
    authViewModel: AuthViewModel
) {
    var emailOrPhone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val focusManager = LocalFocusManager.current

    val authState by authViewModel.authState.collectAsState()

    LaunchedEffect(authState) {
        when (authState) {
            is AuthState.Authenticated -> {
                navController.navigate(Screen.Home.route) {
                    popUpTo(Screen.Login.route) { inclusive = true }
                }
            }
            is AuthState.Error -> {
                errorMessage = (authState as AuthState.Error).message
            }
            else -> {}
        }
    }

    fun handleLogin() {
        errorMessage = null
        val trimmedInput = emailOrPhone.trim()
        val trimmedPass = password.trim()

        if (trimmedInput.isBlank()) {
            errorMessage = "Vui lòng nhập email hoặc số điện thoại"
            return
        }
        if (trimmedPass.isBlank()) {
            errorMessage = "Vui lòng nhập mật khẩu"
            return
        }

        val email = if (trimmedInput.contains("@")) trimmedInput else null
        val phone = if (!trimmedInput.contains("@")) trimmedInput else null

        focusManager.clearFocus()
        authViewModel.login(email, phone, trimmedPass) {}
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Top Emerald Gradient Hero Background
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF064E3B), // Deep emerald
                            Color(0xFF047857), // Signature emerald
                            Color(0xFF00A86B)  // Brand Green
                        )
                    )
                )
        ) {
            // Subtle decorative ambient circles
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .offset(x = (-40).dp, y = (-40).dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.05f))
            )
            Box(
                modifier = Modifier
                    .size(200.dp)
                    .align(Alignment.TopEnd)
                    .offset(x = 60.dp, y = (-60).dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.06f))
            )
        }

        // Scrollable content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            // Logo & Brand Header in Top Hero Area
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(horizontal = 24.dp)
            ) {
                // White rounded badge with emerald N logo
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .background(Color.White, RoundedCornerShape(22.dp))
                        .border(1.5.dp, Color.White.copy(alpha = 0.8f), RoundedCornerShape(22.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "N",
                        color = Primary,
                        fontSize = 44.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "NovaCare",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    letterSpacing = 0.5.sp
                )

                Text(
                    text = "Đăng nhập để tiếp tục",
                    fontSize = 14.sp,
                    color = Color(0xFFD1FAE5),
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Main White Card Container
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderLight)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    // Error message banner
                    if (errorMessage != null) {
                        AuthErrorBanner(message = errorMessage!!)
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // Input: Email / Phone
                    OutlinedTextField(
                        value = emailOrPhone,
                        onValueChange = {
                            emailOrPhone = it
                            errorMessage = null
                        },
                        label = { Text("Email hoặc số điện thoại") },
                        placeholder = { Text("09x xxx xxxx hoặc email") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = if (emailOrPhone.isNotEmpty()) Primary else TextMuted
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

                    Spacer(modifier = Modifier.height(16.dp))

                    // Input: Password
                    OutlinedTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            errorMessage = null
                        },
                        label = { Text("Mật khẩu") },
                        placeholder = { Text("Nhập mật khẩu") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = if (password.isNotEmpty()) Primary else TextMuted
                            )
                        },
                        singleLine = true,
                        visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                Icon(
                                    imageVector = if (isPasswordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                                    contentDescription = "Ẩn/hiện mật khẩu",
                                    tint = TextMuted
                                )
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = authTextFieldColors(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(onDone = {
                            handleLogin()
                        })
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Forgot password link (Aligned right, compact)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Text(
                            text = "Quên mật khẩu?",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = PrimaryDark,
                            modifier = Modifier
                                .clickable { navController.navigate("forgot-password") }
                                .padding(vertical = 6.dp, horizontal = 2.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // CTA: Login Button
                    Button(
                        onClick = { handleLogin() },
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
                                    text = "Đăng nhập",
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
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Register Account Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Chưa có tài khoản? ",
                    fontSize = 14.sp,
                    color = TextSecondary
                )
                Text(
                    text = "Đăng ký ngay",
                    color = PrimaryDark,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    modifier = Modifier
                        .clickable { navController.navigate(Screen.Register.route) }
                        .padding(4.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Trust / Security Badge (Concise & Minimal)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(bottom = 20.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Bảo mật y tế chuẩn NovaCare",
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
        }
    }
}
