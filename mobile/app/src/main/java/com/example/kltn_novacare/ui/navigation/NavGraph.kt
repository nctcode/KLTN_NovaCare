package com.example.kltn_novacare.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.example.kltn_novacare.ui.screens.auth.LoginScreen
import com.example.kltn_novacare.ui.screens.auth.RegisterScreen
import com.example.kltn_novacare.ui.screens.home.HomeScreen
import com.example.kltn_novacare.ui.screens.doctor.DoctorListScreen
import com.example.kltn_novacare.ui.screens.doctor.DoctorDetailScreen
import com.example.kltn_novacare.ui.screens.booking.BookingScreen
import com.example.kltn_novacare.ui.screens.profile.ProfileListScreen
import com.example.kltn_novacare.ui.screens.appointment.AppointmentListScreen
import com.example.kltn_novacare.ui.screens.appointment.AppointmentDetailScreen
import com.example.kltn_novacare.ui.screens.payment.PaymentScreen
import com.example.kltn_novacare.ui.screens.notification.NotificationScreen
import com.example.kltn_novacare.ui.screens.settings.SettingsScreen
import com.example.kltn_novacare.ui.viewmodel.*

@Composable
fun NavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel = viewModel(),
    doctorViewModel: DoctorViewModel = viewModel(),
    patientViewModel: PatientViewModel = viewModel(),
    bookingViewModel: BookingViewModel = viewModel(),
    appointmentViewModel: AppointmentViewModel = viewModel()
) {
    // Check initial start destination based on login status
    val isUserLoggedIn = authViewModel.getCurrentUser() != null
    val startDestination = if (isUserLoggedIn) Screen.Home.route else Screen.Login.route

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(navController = navController, authViewModel = authViewModel)
        }
        
        composable(Screen.Register.route) {
            RegisterScreen(navController = navController, authViewModel = authViewModel)
        }
        
        composable(Screen.Home.route) {
            HomeScreen(
                navController = navController,
                doctorViewModel = doctorViewModel,
                appointmentViewModel = appointmentViewModel
            )
        }
        
        composable(
            route = Screen.Search.route + "?specialtyId={specialtyId}&hospitalId={hospitalId}",
            arguments = listOf(
                navArgument("specialtyId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                },
                navArgument("hospitalId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val specialtyId = backStackEntry.arguments?.getString("specialtyId")
            val hospitalId = backStackEntry.arguments?.getString("hospitalId")
            DoctorListScreen(
                navController = navController,
                doctorViewModel = doctorViewModel,
                initialSpecialtyId = specialtyId,
                initialHospitalId = hospitalId
            )
        }
        
        // Search route fallback (without parameters)
        composable(Screen.Search.route) {
            DoctorListScreen(
                navController = navController,
                doctorViewModel = doctorViewModel
            )
        }
        
        composable(
            route = Screen.DoctorDetail.route,
            arguments = listOf(navArgument("doctorId") { type = NavType.StringType })
        ) { backStackEntry ->
            val doctorId = backStackEntry.arguments?.getString("doctorId") ?: ""
            DoctorDetailScreen(
                doctorId = doctorId,
                navController = navController,
                doctorViewModel = doctorViewModel
            )
        }
        
        composable(
            route = Screen.Booking.route,
            arguments = listOf(
                navArgument("doctorId") { type = NavType.StringType },
                navArgument("workplaceId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val doctorId = backStackEntry.arguments?.getString("doctorId") ?: ""
            val workplaceId = backStackEntry.arguments?.getString("workplaceId") ?: ""
            BookingScreen(
                doctorId = doctorId,
                workplaceId = workplaceId,
                navController = navController,
                bookingViewModel = bookingViewModel,
                doctorViewModel = doctorViewModel,
                patientViewModel = patientViewModel
            )
        }
        
        composable(Screen.Profiles.route) {
            ProfileListScreen(navController = navController, patientViewModel = patientViewModel)
        }
        
        composable(Screen.Appointments.route) {
            AppointmentListScreen(navController = navController, appointmentViewModel = appointmentViewModel)
        }
        
        composable(
            route = Screen.AppointmentDetail.route,
            arguments = listOf(navArgument("appointmentId") { type = NavType.StringType })
        ) { backStackEntry ->
            val appointmentId = backStackEntry.arguments?.getString("appointmentId") ?: ""
            AppointmentDetailScreen(
                appointmentId = appointmentId,
                navController = navController,
                appointmentViewModel = appointmentViewModel
            )
        }
        
        composable(
            route = Screen.Payment.route,
            arguments = listOf(navArgument("url") { type = NavType.StringType })
        ) { backStackEntry ->
            val url = backStackEntry.arguments?.getString("url") ?: ""
            val decodedUrl = java.net.URLDecoder.decode(url, "UTF-8")
            PaymentScreen(url = decodedUrl, navController = navController)
        }
        
        composable(Screen.Notifications.route) {
            NotificationScreen(navController = navController, appointmentViewModel = appointmentViewModel)
        }
        
        composable(Screen.Settings.route) {
            SettingsScreen(navController = navController, authViewModel = authViewModel)
        }
    }
}
