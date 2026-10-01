package com.example.kltn_novacare

import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.navigation.compose.rememberNavController
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.ApiService
import com.example.kltn_novacare.data.repository.AppointmentRepository
import com.example.kltn_novacare.data.repository.PatientRepository
import com.example.kltn_novacare.ui.screens.booking.BookingJourney
import com.example.kltn_novacare.ui.viewmodel.BookingViewModel
import com.example.kltn_novacare.ui.viewmodel.PatientViewModel
import com.google.gson.Gson
import com.google.gson.JsonObject
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.Collections

@RunWith(AndroidJUnit4::class)
class BookingJourneyTest {
    @get:Rule val compose = createComposeRule()
    private val requests = Collections.synchronizedList(mutableListOf<Request>())
    private fun launch(failSimulation: Boolean = false) {
        val profile = """{"id":"relative-id","userId":"user-id","fullName":"Người thân thử nghiệm","gender":"FEMALE","dateOfBirth":"2000-01-01","relation":"Con cái"}"""
        val appointment = """{"id":"appointment-id","userId":"user-id","patientProfileId":"relative-id","slotId":"slot-id","bookingCode":"NC-TEST-01","status":"AWAITING_PAYMENT","totalPrice":"350000","createdAt":"2026-01-01T00:00:00Z","expiresAt":"2099-01-01T00:00:00Z"}"""
        val client = OkHttpClient.Builder().addInterceptor { chain ->
            val request = chain.request()
            requests.add(request)
            val (status, data) = when (request.url.encodedPath) {
                "/api/v1/patient-profiles" -> 200 to """[{"id":"self-id","userId":"user-id","fullName":"Bản thân thử nghiệm","isDefault":true,"gender":"MALE"},$profile]"""
                "/api/v1/appointments" -> 201 to appointment
                "/api/v1/appointments/appointment-id/confirm" -> 200 to appointment.replace("AWAITING_PAYMENT", "CONFIRMED")
                "/api/v1/payments/status/appointment-id" -> 200 to """{"paymentStatus":"UNPAID"}"""
                "/api/v1/payments/simulate-success" -> if (failSimulation) 503 to "null" else 200 to """{"appointmentId":"appointment-id","status":"PAID","bookingCode":"NC-TEST-01","paymentMethod":"MOMO"}"""
                else -> 404 to "null"
            }
            val body = if (status >= 400) """{"message":"Thanh toán chưa thành công"}""" else """{"statusCode":$status,"data":$data}"""
            Response.Builder().request(request).protocol(Protocol.HTTP_1_1).code(status).message("Test")
                .body(body.toResponseBody("application/json".toMediaType())).build()
        }.build()
        val api = Retrofit.Builder().baseUrl("https://example.invalid/api/v1/").client(client)
            .addConverterFactory(GsonConverterFactory.create()).build().create(ApiService::class.java)
        val booking = BookingViewModel(AppointmentRepository(api))
        val patients = PatientViewModel(PatientRepository(api))
        booking.selectDoctor(Doctor("doctor-id", "Bác sĩ thử nghiệm"), DoctorWorkplace("workplace-id", consultationFee = 350000.0))
        booking.selectDateTime("2099-01-01", AppointmentSlot("slot-id", startTime = "2099-01-01T01:00:00Z", endTime = "2099-01-01T01:30:00Z"))
        booking.setStep(2)
        compose.setContent { MaterialTheme {
            BookingJourney(booking, patients, rememberNavController(), onBackFromInfo = {}, info = {})
        } }
        compose.waitUntil(15_000) { compose.onAllNodesWithText("Người thân thử nghiệm").fetchSemanticsNodes().isNotEmpty() }
    }
    private fun selectRelativeAndReview() {
        compose.onNodeWithText("Người thân thử nghiệm").performClick()
        compose.onNodeWithText("Tiếp tục với hồ sơ đã chọn").performClick()
        compose.onNodeWithText("Người thân thử nghiệm").assertIsDisplayed()
        compose.onNodeWithText("Xác nhận thông tin").performScrollTo().performClick()
    }
    private fun submittedProfile(): String {
        val body = Buffer().also { requests.first { request -> request.url.encodedPath == "/api/v1/appointments" }.body!!.writeTo(it) }.readUtf8()
        return Gson().fromJson(body, JsonObject::class.java)["patientProfileId"].asString
    }
    @Test fun selectRelativePayMomoAndReceiveTicket() {
        launch()
        selectRelativeAndReview()
        compose.onNodeWithText("MoMo (mô phỏng)").performScrollTo().performClick()
        compose.onNodeWithText("Tiếp tục thanh toán mô phỏng").performScrollTo().performClick()
        compose.waitUntil(15_000) { compose.onAllNodesWithText("Xác nhận thanh toán mô phỏng").fetchSemanticsNodes().isNotEmpty() }
        assertFalse(requests.any { it.url.encodedPath.endsWith("simulate-success") })
        compose.onNodeWithText("Xác nhận thanh toán mô phỏng").performClick()
        compose.waitUntil(15_000) { compose.onAllNodesWithText("Đặt khám thành công").fetchSemanticsNodes().isNotEmpty() }
        compose.onNodeWithText("Đã thanh toán mô phỏng").assertIsDisplayed()
        assertEquals("relative-id", submittedProfile())
        assertEquals(1, requests.count { it.url.encodedPath == "/api/v1/appointments" })
    }
    @Test fun cashConfirmsBookingWithoutMarkingPaid() {
        launch()
        selectRelativeAndReview()
        compose.onNodeWithText("Đặt khám — thanh toán tại viện").performScrollTo().performClick()
        compose.waitUntil(15_000) { compose.onAllNodesWithText("Đặt khám thành công").fetchSemanticsNodes().isNotEmpty() }
        compose.onNodeWithText("Đã xác nhận lịch — thanh toán tại cơ sở y tế").assertIsDisplayed()
        assertEquals("relative-id", submittedProfile())
        assertFalse(requests.any { it.url.encodedPath.endsWith("simulate-success") })
    }
    @Test fun failedSimulationKeepsDialogAndShowsError() {
        launch(failSimulation = true)
        selectRelativeAndReview()
        compose.onNodeWithText("MoMo (mô phỏng)").performScrollTo().performClick()
        compose.onNodeWithText("Tiếp tục thanh toán mô phỏng").performScrollTo().performClick()
        compose.waitUntil(15_000) { compose.onAllNodesWithText("Xác nhận thanh toán mô phỏng").fetchSemanticsNodes().isNotEmpty() }
        compose.onNodeWithText("Xác nhận thanh toán mô phỏng").performClick()
        compose.waitUntil(15_000) { compose.onAllNodesWithText("Thanh toán chưa thành công").fetchSemanticsNodes().isNotEmpty() }
        compose.onNodeWithText("Xác nhận thanh toán mô phỏng").assertIsEnabled()
        compose.onNodeWithText("Đặt khám thành công").assertDoesNotExist()
    }
}
