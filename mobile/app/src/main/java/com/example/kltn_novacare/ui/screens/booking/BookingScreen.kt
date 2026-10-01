package com.example.kltn_novacare.ui.screens.booking

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.kltn_novacare.ui.viewmodel.*

@Composable
fun BookingScreen(
    doctorId: String, workplaceId: String, navController: NavController,
    bookingViewModel: BookingViewModel, doctorViewModel: DoctorViewModel, patientViewModel: PatientViewModel
) {
    val state by bookingViewModel.uiState.collectAsState()
    val details by doctorViewModel.doctorDetails.collectAsState()
    var initialized by rememberSaveable(doctorId, workplaceId) { mutableStateOf(false) }
    LaunchedEffect(doctorId, workplaceId) {
        if (!initialized) {
            val selectedProfile = state.selectedProfile
            bookingViewModel.resetBooking()
            selectedProfile?.let { bookingViewModel.selectProfile(it) }
            initialized = true
        }
        doctorViewModel.getDoctorById(doctorId)
    }
    LaunchedEffect(details) {
        val doctor = (details as? NetworkState.Success)?.data
        if (doctor?.id == doctorId) {
            doctor.workPlaces?.find { it.id == workplaceId }?.let { bookingViewModel.selectDoctor(doctor, it) }
        }
    }
    BookingJourney(bookingViewModel, patientViewModel, navController, onBackFromInfo = { navController.popBackStack() }) {
        if (state.workplace?.id == workplaceId && state.doctor?.id == doctorId) {
            BookingInfoContent(bookingViewModel, doctorViewModel, allowDoctorSelection = false)
        } else {
            Column(Modifier.padding(20.dp)) {
                if (details is NetworkState.Loading || details is NetworkState.Idle) CircularProgressIndicator()
                else {
                    Text((details as? NetworkState.Error)?.message ?: "Không tìm thấy nơi khám của bác sĩ.", color = MaterialTheme.colorScheme.error)
                    TextButton(onClick = { doctorViewModel.getDoctorById(doctorId) }) { Text("Thử lại") }
                }
            }
        }
    }
}
