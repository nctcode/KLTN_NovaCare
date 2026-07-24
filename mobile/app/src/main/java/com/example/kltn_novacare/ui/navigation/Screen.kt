package com.example.kltn_novacare.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Search : Screen("search")
    
    object DoctorDetail : Screen("doctor/{doctorId}") {
        fun createRoute(doctorId: String) = "doctor/$doctorId"
    }
    
    object Booking : Screen("booking/{doctorId}/{workplaceId}") {
        fun createRoute(doctorId: String, workplaceId: String) = "booking/$doctorId/$workplaceId"
    }
    
    object Profiles : Screen("profiles")
    object Appointments : Screen("appointments")
    
    object AppointmentDetail : Screen("appointment/{appointmentId}") {
        fun createRoute(appointmentId: String) = "appointment/$appointmentId"
    }
    
    object Notifications : Screen("notifications")
    object Settings : Screen("settings")
    object Payment : Screen("payment/{url}") {
        fun createRoute(url: String) = "payment/${java.net.URLEncoder.encode(url, "UTF-8")}"
    }
}
