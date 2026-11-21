package com.example.kltn_novacare.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Search : Screen("search")

    object SpecialtyCatalog : Screen("specialties")

    object SpecialtyResults : Screen("specialty/{specialtyId}/{specialtyName}") {
        fun createRoute(specialtyId: String, specialtyName: String) =
            "specialty/${android.net.Uri.encode(specialtyId)}/${android.net.Uri.encode(specialtyName)}"
    }
    
    object DoctorDetail : Screen("doctor/{doctorId}") {
        fun createRoute(doctorId: String) = "doctor/$doctorId"
    }
    
    object Booking : Screen("booking/{doctorId}/{workplaceId}") {
        fun createRoute(doctorId: String, workplaceId: String) = "booking/$doctorId/$workplaceId"
    }

    object DoctorBooking : Screen("doctor_booking")
    
    object Profiles : Screen("profiles")
    object Appointments : Screen("appointments")
    
    object AppointmentDetail : Screen("appointment/{appointmentId}") {
        fun createRoute(appointmentId: String) = "appointment/$appointmentId"
    }
    
    object Notifications : Screen("notifications")
    object Consultations : Screen("consultations")
    object VideoDoctors : Screen("video_doctors")
    object VideoBooking : Screen("video_booking/{doctorId}/{workplaceId}") {
        fun createRoute(doctorId: String, workplaceId: String) = "video_booking/$doctorId/$workplaceId"
    }
    object ConsultationVideo : Screen("consultations/{consultationId}/video") {
        fun createRoute(id: String) = "consultations/$id/video"
    }
    object ConsultationChat : Screen("consultations/{consultationId}/chat") {
        fun createRoute(consultationId: String) = "consultations/$consultationId/chat"
    }
    object BookingCheckout : Screen("booking_checkout")
    object Settings : Screen("settings")
    object Payment : Screen("payment/{url}") {
        fun createRoute(url: String) = "payment/${java.net.URLEncoder.encode(url, "UTF-8")}"
    }

    object HospitalBooking : Screen("hospital_booking?hospitalId={hospitalId}&specialtyId={specialtyId}&specialtyName={specialtyName}&reason={reason}&doctorId={doctorId}") {
        fun createRoute(
            hospitalId: String? = null,
            specialtyId: String? = null,
            reason: String? = null,
            specialtyName: String? = null,
            doctorId: String? = null
        ): String {
            val parameters = listOfNotNull(
                hospitalId?.let { "hospitalId=${android.net.Uri.encode(it)}" },
                specialtyId?.let { "specialtyId=${android.net.Uri.encode(it)}" },
                specialtyName?.let { "specialtyName=${android.net.Uri.encode(it)}" },
                reason?.let { "reason=${android.net.Uri.encode(it)}" },
                doctorId?.let { "doctorId=${android.net.Uri.encode(it)}" }
            )
            return "hospital_booking" + if (parameters.isEmpty()) "" else "?" + parameters.joinToString("&")
        }
    }

    object PreExamScreening : Screen("pre_exam_screening")
}
