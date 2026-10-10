package com.example.kltn_novacare.ui.screens.consultation

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.kltn_novacare.ui.navigation.Screen
import com.example.kltn_novacare.ui.screens.consultation.components.*
import com.example.kltn_novacare.ui.viewmodel.ConsultationVideoViewModel
import kotlinx.coroutines.delay

@Composable
fun ConsultationVideoScreen(
    id: String,
    navController: NavController,
    model: ConsultationVideoViewModel = viewModel()
) {
    val state by model.state.collectAsState()
    val context = LocalContext.current
    val activity = context as? Activity
    val owner = LocalLifecycleOwner.current

    // Modal & Sheet visibility states
    var showAudioSheet by remember { mutableStateOf(false) }
    var showInfoSheet by remember { mutableStateOf(false) }
    var showEndDialog by remember { mutableStateOf(false) }
    var showSafetyBanner by remember { mutableStateOf(true) }

    // Controls auto-hide timer
    var controlsVisible by remember { mutableStateOf(true) }
    var lastInteractionTime by remember { mutableLongStateOf(System.currentTimeMillis()) }

    // Permission launcher
    val permissionsLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val cameraGranted = grants[Manifest.permission.CAMERA] == true
        val audioGranted = grants[Manifest.permission.RECORD_AUDIO] == true
        if (cameraGranted && audioGranted) {
            model.join(id)
        } else {
            model.permissionDenied()
        }
    }

    // Permission check
    val hasCameraPermission = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.CAMERA
    ) == PackageManager.PERMISSION_GRANTED
    val hasAudioPermission = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.RECORD_AUDIO
    ) == PackageManager.PERMISSION_GRANTED
    val hasRequiredPermissions = hasCameraPermission && hasAudioPermission

    // Keep screen on during consultation
    DisposableEffect(Unit) {
        activity?.window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        onDispose {
            activity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    // Auto-join if permissions are already present
    LaunchedEffect(id) {
        if (hasRequiredPermissions) {
            model.join(id)
        }
    }

    // Auto-hide controls after 6 seconds of inactivity when connected
    LaunchedEffect(state.connected, controlsVisible, lastInteractionTime) {
        if (state.connected && controlsVisible) {
            delay(6000)
            if (System.currentTimeMillis() - lastInteractionTime >= 5500) {
                controlsVisible = false
            }
        }
    }

    val leaveCall: () -> Unit = {
        model.leave()
        navController.popBackStack()
    }

    // Handle back button with confirmation if connected
    BackHandler {
        if (state.connected || state.connecting) {
            showEndDialog = true
        } else {
            leaveCall()
        }
    }

    // App backgrounding observer: leave call when app stops completely
    DisposableEffect(owner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_STOP && activity?.isChangingConfigurations != true) {
                model.leave()
            }
        }
        owner.lifecycle.addObserver(observer)
        onDispose {
            owner.lifecycle.removeObserver(observer)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF101513))
    ) {
        if (!hasRequiredPermissions && !state.connected && !state.connecting) {
            // Permission request screen
            PermissionStateView(
                onRequestPermission = {
                    permissionsLauncher.launch(
                        arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
                    )
                },
                onBack = { navController.popBackStack() },
                context = context
            )
        } else {
            // Active Telemedicine Video Room Layout
            // 1. Remote Video Layer (Fills entire screen)
            RemoteVideoSurface(
                room = model.room,
                state = state,
                modifier = Modifier
                    .fillMaxSize()
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        controlsVisible = !controlsVisible
                        lastInteractionTime = System.currentTimeMillis()
                    }
            )

            // 2. Local Video PiP Layer (Floating at bottom-right, draggable)
            LocalVideoPip(
                room = model.room,
                state = state,
                onSwitchCamera = {
                    model.switchCamera()
                    lastInteractionTime = System.currentTimeMillis()
                },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 16.dp, bottom = 204.dp)
            )

            // 3. Top Overlay: Header, Safety Banner, Reconnection, Error
            AnimatedVisibility(
                visible = controlsVisible,
                enter = fadeIn() + slideInVertically { -it },
                exit = fadeOut() + slideOutVertically { -it },
                modifier = Modifier.align(Alignment.TopCenter)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    VideoCallHeader(
                        state = state,
                        onBackClick = {
                            if (state.connected || state.connecting) {
                                showEndDialog = true
                            } else {
                                leaveCall()
                            }
                        },
                        onOpenChat = {
                            navController.navigate(Screen.ConsultationChat.createRoute(id))
                        },
                        onOpenInfo = {
                            showInfoSheet = true
                        }
                    )

                    CompactSafetyBanner(
                        visible = showSafetyBanner,
                        onDismiss = { showSafetyBanner = false }
                    )

                    ReconnectingBanner(visible = state.reconnecting)

                    ErrorBanner(
                        message = state.error,
                        onDismiss = model::dismissError
                    )
                }
            }

            // 4. Bottom Overlay: Modern Call Control Bar
            AnimatedVisibility(
                visible = controlsVisible,
                enter = fadeIn() + slideInVertically { it },
                exit = fadeOut() + slideOutVertically { it },
                modifier = Modifier.align(Alignment.BottomCenter)
            ) {
                VideoControlBar(
                    state = state,
                    onToggleMicrophone = {
                        model.microphone()
                        lastInteractionTime = System.currentTimeMillis()
                    },
                    onToggleCamera = {
                        model.camera()
                        lastInteractionTime = System.currentTimeMillis()
                    },
                    onSwitchCamera = {
                        model.switchCamera()
                        lastInteractionTime = System.currentTimeMillis()
                    },
                    onAudioRouteClick = {
                        showAudioSheet = true
                        lastInteractionTime = System.currentTimeMillis()
                    },
                    onOpenChat = {
                        navController.navigate(Screen.ConsultationChat.createRoute(id))
                    },
                    onEndCallClick = {
                        showEndDialog = true
                    }
                )
            }
        }

        // ==========================================
        // SHEETS AND DIALOGS
        // ==========================================

        // Audio Device Picker Sheet
        if (showAudioSheet) {
            AudioDevicePickerSheet(
                availableDevices = state.availableAudioDevices,
                selectedDevice = state.selectedAudioDevice,
                onSelectDevice = { device ->
                    model.selectAudioDevice(device)
                    showAudioSheet = false
                },
                onDismiss = { showAudioSheet = false }
            )
        }

        // Consultation Details & Info Sheet
        if (showInfoSheet) {
            ConsultationDetailsSheet(
                consultation = state.consultation,
                onOpenChat = {
                    showInfoSheet = false
                    navController.navigate(Screen.ConsultationChat.createRoute(id))
                },
                onLeaveCall = {
                    showInfoSheet = false
                    leaveCall()
                },
                onDismiss = { showInfoSheet = false }
            )
        }

        // End Call Confirmation Dialog
        if (showEndDialog) {
            EndCallConfirmDialog(
                onConfirm = {
                    showEndDialog = false
                    leaveCall()
                },
                onDismiss = { showEndDialog = false }
            )
        }
    }
}
