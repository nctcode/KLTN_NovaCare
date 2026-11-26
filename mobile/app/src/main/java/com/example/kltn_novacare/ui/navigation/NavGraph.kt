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
import com.example.kltn_novacare.ui.screens.booking.DoctorBookingScreen
import com.example.kltn_novacare.ui.screens.profile.ProfileListScreen
import com.example.kltn_novacare.ui.screens.appointment.AppointmentListScreen
import com.example.kltn_novacare.ui.screens.appointment.AppointmentDetailScreen
import com.example.kltn_novacare.ui.screens.payment.PaymentScreen
import com.example.kltn_novacare.ui.screens.notification.NotificationScreen
import com.example.kltn_novacare.ui.screens.consultation.ConsultationChatScreen
import com.example.kltn_novacare.ui.screens.consultation.ConsultationHomeScreen
import com.example.kltn_novacare.ui.screens.consultation.VideoBookingScreen
import com.example.kltn_novacare.ui.screens.consultation.VideoDoctorCatalogScreen
import com.example.kltn_novacare.ui.screens.settings.SettingsScreen
import com.example.kltn_novacare.ui.screens.specialty.SpecialtyCatalogScreen
import com.example.kltn_novacare.ui.screens.specialty.SpecialtyResultsScreen
import com.example.kltn_novacare.ui.viewmodel.*

@Composable
fun NavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel = viewModel(),
    doctorViewModel: DoctorViewModel = viewModel(),
    patientViewModel: PatientViewModel = viewModel(),
    bookingViewModel: BookingViewModel = viewModel(),
    appointmentViewModel: AppointmentViewModel = viewModel(),
    consultationViewModel: ConsultationViewModel = viewModel()
) {
    // Check initial start destination based on login status
    val isUserLoggedIn = authViewModel.getCurrentUser() != null
    val startDestination = if (!isUserLoggedIn) Screen.Login.route else Screen.Home.route

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable("forgot-password") {
            com.example.kltn_novacare.ui.screens.auth.ForgotPasswordScreen(onBack = { navController.popBackStack() })
        }
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
                appointmentViewModel = appointmentViewModel,
                authViewModel = authViewModel
            )
        }

        composable(Screen.SpecialtyCatalog.route) {
            SpecialtyCatalogScreen(
                navController = navController,
                doctorViewModel = doctorViewModel
            )
        }

        composable(
            route = Screen.SpecialtyResults.route,
            arguments = listOf(
                navArgument("specialtyId") { type = NavType.StringType },
                navArgument("specialtyName") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            SpecialtyResultsScreen(
                navController = navController,
                specialtyId = backStackEntry.arguments?.getString("specialtyId").orEmpty(),
                specialtyName = backStackEntry.arguments?.getString("specialtyName").orEmpty()
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
            com.example.kltn_novacare.ui.screens.search.SearchScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToDoctor = { doctorId ->
                    navController.navigate(Screen.DoctorDetail.createRoute(doctorId))
                },
                onNavigateToBooking = { doctorId ->
                    navController.navigate(Screen.DoctorDetail.createRoute(doctorId))
                },
                onNavigateToFacility = { facilityId ->
                    navController.navigate(Screen.HospitalDetail.createRoute(facilityId))
                }
            )
        }

        composable(
            route = Screen.HospitalDetail.route,
            arguments = listOf(navArgument("hospitalId") { type = NavType.StringType })
        ) { backStackEntry ->
            val hospitalId = backStackEntry.arguments?.getString("hospitalId") ?: ""
            com.example.kltn_novacare.ui.screens.hospital.HospitalDetailScreen(
                hospitalId = hospitalId,
                navController = navController
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

        composable(Screen.DoctorBooking.route) {
            DoctorBookingScreen(
                navController = navController,
                doctorViewModel = doctorViewModel
            )
        }
        
        composable(Screen.Profiles.route) {
            ProfileListScreen(
                navController = navController,
                patientViewModel = patientViewModel,
                onBookProfile = { profile ->
                    bookingViewModel.resetBooking()
                    bookingViewModel.selectProfile(profile)
                    bookingViewModel.setStep(1)
                    navController.navigate(Screen.Search.route)
                }
            )
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
                appointmentViewModel = appointmentViewModel,
                onPay = { appointment ->
                    bookingViewModel.resumePayment(appointment)
                    navController.navigate(Screen.BookingCheckout.route)
                }
            )
        }

        composable(Screen.Consultations.route) {
            ConsultationHomeScreen(navController, consultationViewModel)
        }
        composable(Screen.VideoDoctors.route) {
            VideoDoctorCatalogScreen(navController, doctorViewModel)
        }
        composable(
            route = Screen.VideoBooking.route,
            arguments = listOf(
                navArgument("doctorId") { type = NavType.StringType },
                navArgument("workplaceId") { type = NavType.StringType }
            )
        ) { entry ->
            VideoBookingScreen(
                doctorId = entry.arguments?.getString("doctorId").orEmpty(),
                workplaceId = entry.arguments?.getString("workplaceId").orEmpty(),
                navController = navController,
                bookingViewModel = bookingViewModel,
                doctorViewModel = doctorViewModel,
                patientViewModel = patientViewModel,
                consultationViewModel = consultationViewModel
            )
        }
        composable(Screen.ConsultationVideo.route, arguments = listOf(navArgument("consultationId") { type = NavType.StringType })) { entry ->
            com.example.kltn_novacare.ui.screens.consultation.ConsultationVideoScreen(
                entry.arguments?.getString("consultationId").orEmpty(), navController
            )
        }

        composable(
            route = Screen.ConsultationChat.route,
            arguments = listOf(navArgument("consultationId") { type = NavType.StringType })
        ) { entry ->
            ConsultationChatScreen(
                consultationId = entry.arguments?.getString("consultationId").orEmpty(),
                navController = navController,
                viewModel = consultationViewModel
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
        
        composable(Screen.BookingCheckout.route) {
            com.example.kltn_novacare.ui.screens.booking.BookingJourney(
                bookingViewModel, patientViewModel, navController,
                onBackFromInfo = { navController.popBackStack() }, info = {}
            )
        }

        composable(Screen.Notifications.route) {
            NotificationScreen(navController = navController, appointmentViewModel = appointmentViewModel)
        }
        
        composable(Screen.Settings.route) {
            SettingsScreen(navController = navController, authViewModel = authViewModel)
        }

        composable(
            route = Screen.HospitalBooking.route,
            arguments = listOf(
                navArgument("hospitalId") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("specialtyId") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("specialtyName") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("reason") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("doctorId") { type = NavType.StringType; nullable = true; defaultValue = null },
                navArgument("mode") { type = NavType.StringType; nullable = true; defaultValue = null }
            )
        ) { backStackEntry ->
            val hospitalId = backStackEntry.arguments?.getString("hospitalId")
            com.example.kltn_novacare.ui.screens.booking.HospitalFacilityBookingScreen(
                initialHospitalId = hospitalId,
                initialSpecialtyId = backStackEntry.arguments?.getString("specialtyId"),
                initialSpecialtyName = backStackEntry.arguments?.getString("specialtyName"),
                initialReason = backStackEntry.arguments?.getString("reason"),
                initialDoctorId = backStackEntry.arguments?.getString("doctorId"),
                initialMode = backStackEntry.arguments?.getString("mode"),
                navController = navController,
                bookingViewModel = bookingViewModel,
                doctorViewModel = doctorViewModel,
                patientViewModel = patientViewModel
            )
        }

        composable(Screen.PreExamScreening.route) {
            com.example.kltn_novacare.ui.screens.PreExamScreeningScreen(
                onSkipScreening = {
                    navController.navigate(Screen.HospitalBooking.createRoute(null)) { popUpTo(Screen.PreExamScreening.route) { inclusive = true } }
                },
                onCompletedToBooking = { doctorId, specialtyId, specialtyName, hospitalId, symptoms, summary, sessionId ->
                    bookingViewModel.prepareFromScreening(sessionId, symptoms, summary)
                    navController.navigate(
                        Screen.HospitalBooking.createRoute(
                            hospitalId = hospitalId,
                            specialtyId = specialtyId,
                            reason = symptoms,
                            specialtyName = specialtyName,
                            doctorId = doctorId
                        )
                    ) { popUpTo(Screen.PreExamScreening.route) { inclusive = true } }
                }
            )
        }
    }
}
