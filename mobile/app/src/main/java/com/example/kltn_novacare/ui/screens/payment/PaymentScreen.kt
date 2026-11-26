package com.example.kltn_novacare.ui.screens.payment

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.navigation.NavController
import com.example.kltn_novacare.ui.components.QRCodeDraw
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.screens.booking.bookingMoney
import com.example.kltn_novacare.ui.theme.*

@SuppressLint("SetJavaScriptEnabled")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    url: String,
    navController: NavController
) {
    var progress by remember { mutableIntStateOf(0) }
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Thanh toán cổng VNPAY", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 17.sp) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = HeaderGreenDark)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (progress in 1..99) {
                LinearProgressIndicator(
                    progress = { progress / 100f },
                    modifier = Modifier.fillMaxWidth().height(3.dp),
                    color = Primary,
                    trackColor = PrimaryLight
                )
            }
            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        val cookieManager = CookieManager.getInstance()
                        cookieManager.setAcceptCookie(true)
                        cookieManager.setAcceptThirdPartyCookies(this, true)
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.loadWithOverviewMode = true
                        settings.useWideViewPort = true
                        settings.builtInZoomControls = true
                        settings.displayZoomControls = false
                        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                        webChromeClient = object : WebChromeClient() {
                            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                progress = newProgress
                            }
                        }
                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(
                                view: WebView?,
                                request: WebResourceRequest?
                            ): Boolean {
                                val redirectUrl = request?.url?.toString() ?: return false
                                if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
                                    runCatching {
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(redirectUrl)))
                                    }
                                    return true
                                }
                                if (redirectUrl.contains("thanh-toan/return") || redirectUrl.contains("payments/status")) {
                                    navController.navigate(Screen.Appointments.route) {
                                        popUpTo(Screen.Home.route)
                                    }
                                    return true
                                }
                                return false
                            }
                        }
                        loadUrl(url)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VnpaySandboxPaymentDialog(
    bookingCode: String,
    amount: Double,
    vnpayUrl: String?,
    busy: Boolean,
    errorMessage: String?,
    onVnpayReturn: (Map<String, String>) -> Unit,
    onSimulatePayment: () -> Unit,
    onRefresh: () -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var loadProgress by remember { mutableIntStateOf(0) }
    var vnpayErrorCode by remember(vnpayUrl) { mutableStateOf<String?>(null) }
    var showRawWebView by remember(vnpayUrl) { mutableStateOf(false) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    Dialog(
        onDismissRequest = { if (!busy) onDismiss() },
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            dismissOnBackPress = !busy,
            dismissOnClickOutside = false
        )
    ) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = Background,
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                "Cổng thanh toán VNPAY",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                "VNPAY Sandbox · VNPAY-QR",
                                color = Color(0xFFA7F3D0),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    },
                    navigationIcon = {
                        IconButton(enabled = !busy, onClick = onDismiss) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Đóng",
                                tint = Color.White
                            )
                        }
                    },
                    actions = {
                        IconButton(
                            enabled = !busy,
                            onClick = {
                                vnpayErrorCode = null
                                showRawWebView = false
                                if (vnpayUrl != null && webViewRef != null) {
                                    webViewRef?.loadUrl(vnpayUrl)
                                } else {
                                    onRefresh()
                                }
                            }
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Tải lại", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = HeaderGreenDark)
                )
            },
            bottomBar = {
                Surface(
                    color = Color.White,
                    shadowElevation = 14.dp,
                    border = BorderStroke(0.5.dp, Border)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (!errorMessage.isNullOrBlank()) {
                            Surface(
                                color = StatusErrorBg,
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = errorMessage,
                                    color = StatusErrorText,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)
                                )
                            }
                        }

                        Text(
                            text = "Quét mã QR trên cổng VNPAY Sandbox bằng ứng dụng hỗ trợ, hoặc nhấn nút mô phỏng để hoàn tất nhanh.",
                            fontSize = 11.5.sp,
                            color = TextSecondary,
                            lineHeight = 16.sp
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                enabled = !busy,
                                onClick = onDismiss,
                                modifier = Modifier.height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, Border),
                                contentPadding = PaddingValues(horizontal = 16.dp)
                            ) {
                                Text("Để sau", color = TextSecondary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }

                            Button(
                                enabled = !busy,
                                onClick = onSimulatePayment,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Primary,
                                    disabledContainerColor = Color(0xFFCBD5E1)
                                )
                            ) {
                                if (busy) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(18.dp),
                                        color = Color.White,
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text("Đang xác nhận...", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                } else {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("Mô phỏng thanh toán", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 13.5.sp)
                                }
                            }
                        }
                    }
                }
            }
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                // Transaction Summary Ribbon
                Surface(
                    color = Color.White,
                    border = BorderStroke(0.5.dp, Border)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Mã lịch khám", fontSize = 10.5.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
                            Text(
                                bookingCode.ifBlank { "Đang khởi tạo..." },
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                fontFamily = FontFamily.Monospace,
                                color = TextPrimary
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Số tiền thanh toán", fontSize = 10.5.sp, color = TextMuted, fontWeight = FontWeight.SemiBold)
                            Text(
                                bookingMoney(amount),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF0C4B39)
                            )
                        }
                    }
                }

                if (loadProgress in 1..99 && vnpayUrl != null && vnpayErrorCode == null) {
                    LinearProgressIndicator(
                        progress = { loadProgress / 100f },
                        modifier = Modifier.fillMaxWidth().height(3.dp),
                        color = Primary,
                        trackColor = PrimaryLight
                    )
                }

                // Main Content: Live VNPAY Sandbox WebView OR Friendly Sandbox QR Fallback on error
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    if (!vnpayUrl.isNullOrBlank() && (vnpayErrorCode == null || showRawWebView)) {
                        AndroidView(
                            factory = { ctx ->
                                WebView(ctx).apply {
                                    webViewRef = this
                                    val cookieManager = CookieManager.getInstance()
                                    cookieManager.setAcceptCookie(true)
                                    cookieManager.setAcceptThirdPartyCookies(this, true)
                                    settings.javaScriptEnabled = true
                                    settings.domStorageEnabled = true
                                    settings.loadWithOverviewMode = true
                                    settings.useWideViewPort = true
                                    settings.builtInZoomControls = true
                                    settings.displayZoomControls = false
                                    settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                                    webChromeClient = object : WebChromeClient() {
                                        override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                            loadProgress = newProgress
                                        }
                                    }
                                    webViewClient = object : WebViewClient() {
                                        override fun shouldOverrideUrlLoading(
                                            view: WebView?,
                                            request: WebResourceRequest?
                                        ): Boolean {
                                            val target = request?.url?.toString() ?: return false
                                            return handleUrlNavigation(
                                                target = target,
                                                onExternalScheme = { uri ->
                                                    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                                                },
                                                onReturn = onVnpayReturn,
                                                onVnpayError = { code -> vnpayErrorCode = code }
                                            )
                                        }

                                        override fun onPageFinished(view: WebView?, url: String?) {
                                            super.onPageFinished(view, url)
                                            if (url != null && url.contains("Error.html", ignoreCase = true)) {
                                                val parsed = runCatching { Uri.parse(url).getQueryParameter("code") }.getOrNull()
                                                vnpayErrorCode = parsed ?: "UNKNOWN"
                                            }
                                        }
                                    }
                                    loadUrl(vnpayUrl)
                                }
                            },
                            update = { view ->
                                if (view.tag != vnpayUrl) {
                                    view.tag = vnpayUrl
                                    view.loadUrl(vnpayUrl)
                                }
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        VnpaySandboxFallbackQrView(
                            bookingCode = bookingCode,
                            amount = amount,
                            vnpayUrl = vnpayUrl,
                            vnpayErrorCode = vnpayErrorCode,
                            onReload = {
                                vnpayErrorCode = null
                                showRawWebView = false
                                onRefresh()
                            },
                            onOpenRawPage = if (!vnpayUrl.isNullOrBlank()) {
                                { showRawWebView = true }
                            } else null
                        )
                    }
                }
            }
        }
    }
}

private fun handleUrlNavigation(
    target: String,
    onExternalScheme: (Uri) -> Unit,
    onReturn: (Map<String, String>) -> Unit,
    onVnpayError: (String) -> Unit
): Boolean {
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
        onExternalScheme(Uri.parse(target))
        return true
    }

    if (target.contains("Error.html", ignoreCase = true)) {
        val code = runCatching { Uri.parse(target).getQueryParameter("code") }.getOrNull() ?: "UNKNOWN"
        onVnpayError(code)
        return false
    }

    if (target.contains("thanh-toan/return", ignoreCase = true) || target.contains("vnp_ResponseCode=", ignoreCase = true)) {
        val uri = runCatching { Uri.parse(target) }.getOrNull()
        val params = buildMap {
            uri?.queryParameterNames?.forEach { key ->
                uri.getQueryParameter(key)?.let { value -> put(key, value) }
            }
        }
        onReturn(params)
        return true
    }
    return false
}

@Composable
private fun VnpaySandboxFallbackQrView(
    bookingCode: String,
    amount: Double,
    vnpayUrl: String?,
    vnpayErrorCode: String?,
    onReload: () -> Unit,
    onOpenRawPage: (() -> Unit)?
) {
    val qrPayload = remember(vnpayUrl, bookingCode, amount) {
        vnpayUrl?.takeIf { it.isNotBlank() }
            ?: "VNPAYQR|NovaCare|$bookingCode|${amount.toLong()}VND"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // VNPAY Sandbox QR Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, Border),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFEFF6FF),
                    border = BorderStroke(1.dp, Color(0xFFBFDBFE))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Default.QrCode2, contentDescription = null, tint = Color(0xFF1D4ED8), modifier = Modifier.size(16.dp))
                        Text(
                            "VNPAY-QR SANDBOX",
                            color = Color(0xFF1E3A8A),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 12.sp
                        )
                    }
                }

                Text(
                    "Quét mã thanh toán VNPAY",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )

                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White,
                    border = BorderStroke(1.5.dp, Color(0xFF0C4B39).copy(alpha = 0.25f)),
                    shadowElevation = 2.dp
                ) {
                    Box(modifier = Modifier.padding(12.dp)) {
                        QRCodeDraw(data = qrPayload, modifier = Modifier.size(210.dp))
                    }
                }

                Text(
                    bookingMoney(amount),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF0C4B39)
                )

                Text(
                    "Nội dung: Thanh toan lich kham $bookingCode",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )
            }
        }

        // Sandbox Merchant Status Notice
        if (!vnpayErrorCode.isNullOrBlank()) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = StatusWarningBg,
                border = BorderStroke(1.dp, Color(0xFFFCD34D))
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = StatusWarningText, modifier = Modifier.size(18.dp))
                        Text(
                            "Thông báo từ VNPAY Sandbox (Mã lỗi $vnpayErrorCode)",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 12.5.sp,
                            color = StatusWarningText
                        )
                    }
                    Text(
                        text = if (vnpayErrorCode == "72") {
                            "Mã TmnCode trên server chưa được đăng ký trên VNPAY Sandbox. Hãy đăng ký miễn phí tại sandbox.vnpayment.vn/devreg/ và cập nhật VNP_TMN_CODE + VNP_HASH_SECRET vào backend .env để hiển thị màn hình VNPAY-QR trực tiếp. Hiện bạn vẫn có thể nhấn 'Mô phỏng thanh toán' bên dưới."
                        } else {
                            "Cổng VNPAY Sandbox phản hồi mã lỗi $vnpayErrorCode. Bạn có thể tải lại hoặc sử dụng nút 'Mô phỏng thanh toán' bên dưới."
                        },
                        fontSize = 12.sp,
                        color = StatusWarningText,
                        lineHeight = 17.sp
                    )
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedButton(
                onClick = onReload,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Border)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null, tint = Color(0xFF0C4B39), modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Tải lại VNPAY", color = Color(0xFF0C4B39), fontWeight = FontWeight.Bold, fontSize = 12.5.sp)
            }
            if (onOpenRawPage != null) {
                TextButton(onClick = onOpenRawPage) {
                    Text("Xem trang gốc", color = TextSecondary, fontSize = 12.5.sp)
                }
            }
        }
    }
}
