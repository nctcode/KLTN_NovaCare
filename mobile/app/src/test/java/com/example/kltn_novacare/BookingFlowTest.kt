package com.example.kltn_novacare

import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.ApiService
import com.example.kltn_novacare.data.repository.AppointmentRepository
import com.example.kltn_novacare.ui.screens.booking.isBookableSlot
import com.example.kltn_novacare.ui.viewmodel.*
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import org.junit.Assert.*
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.time.Instant
import java.util.Collections

class BookingFlowTest {
    private val calls = Collections.synchronizedList(mutableListOf<Request>())
    private val profile = PatientProfile("patient-id", "user-id", "Nguyễn An")
    private val slot = AppointmentSlot("real-slot-id", doctorWorkplaceId = "workplace-id",
        startTime = "2099-01-01T01:00:00Z", endTime = "2099-01-01T01:30:00Z", capacity = 3)
    private val appointment = """{"id":"appointment-id","userId":"user-id","patientProfileId":"patient-id","slotId":"real-slot-id","bookingCode":"NC-123","status":"AWAITING_PAYMENT","totalPrice":"350000","createdAt":"2026-01-01T00:00:00Z","expiresAt":"2099-01-01T00:00:00Z"}"""
    private fun envelope(data: String) = """{"statusCode":200,"data":$data}"""
    private fun vm(reply: (Request) -> Pair<Int, String>): BookingViewModel {
        val client = OkHttpClient.Builder().addInterceptor { chain ->
            calls.add(chain.request())
            val (code, body) = reply(chain.request())
            Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1).code(code).message("Test")
                .body(body.toResponseBody("application/json".toMediaType())).build()
        }.build()
        val api = Retrofit.Builder().baseUrl("https://example.invalid/api/v1/").client(client)
            .addConverterFactory(GsonConverterFactory.create()).build().create(ApiService::class.java)
        return BookingViewModel(AppointmentRepository(api), Dispatchers.Unconfined)
    }
    private fun draft(vm: BookingViewModel) {
        vm.selectDoctor(Doctor("doctor-id", "Bác sĩ An"), DoctorWorkplace("workplace-id", consultationFee = 350000.0))
        vm.selectDateTime("2099-01-01", slot)
        vm.setStep(2)
        vm.selectProfile(profile)
        vm.setStep(3)
        vm.setDetails("Đau đầu", "Mệt mỏi")
        vm.setStep(4)
    }
    private suspend fun settled(vm: BookingViewModel) = withTimeout(10_000) { vm.uiState.first { !it.busy } }
    private fun Request.json(): JsonObject = Gson().fromJson(Buffer().also { body!!.writeTo(it) }.readUtf8(), JsonObject::class.java)

    @Test fun slotSelectionCannotSkipPatientProfile() {
        val vm = vm { error("No API expected") }
        vm.selectDateTime("2099-01-01", slot)
        vm.setStep(2)
        assertEquals(2, vm.uiState.value.currentStep)
        vm.setStep(3)
        assertEquals(2, vm.uiState.value.currentStep)
        vm.selectProfile(profile)
        assertEquals(2, vm.uiState.value.currentStep)
        vm.setStep(3)
        assertEquals(profile.id, vm.uiState.value.selectedProfile?.id)
        assertEquals(3, vm.uiState.value.currentStep)
    }

    @Test fun changingDoctorOrDateClearsPreviouslySelectedSlot() {
        val vm = vm { error("No API expected") }
        draft(vm)
        vm.selectDate("2099-01-02")
        assertNull(vm.uiState.value.selectedSlot)
        vm.selectDateTime("2099-01-01", slot)
        vm.selectDoctor(Doctor("other", "Bác sĩ B"), DoctorWorkplace("other-workplace"))
        assertNull(vm.uiState.value.selectedSlot)
    }

    @Test fun missingProfileShowsErrorWithoutCreatingAppointment() {
        val vm = vm { error("No API expected") }
        vm.selectDateTime("2099-01-01", slot)
        vm.checkout()
        assertTrue(vm.uiState.value.checkoutState is NetworkState.Error)
        assertTrue(calls.isEmpty())
    }

    @Test fun cashCreatesThenConfirmsWithWebContract() = runBlocking {
        val vm = vm { request ->
            when (request.url.encodedPath) {
                "/api/v1/appointments" -> {
                    val json = request.json()
                    assertEquals("real-slot-id", json["slotId"].asString)
                    assertEquals("patient-id", json["patientProfileId"].asString)
                    assertFalse(json.has("paymentMethod"))
                    assertTrue(json["idempotencyKey"].asString.isNotBlank())
                    201 to envelope(appointment)
                }
                "/api/v1/appointments/appointment-id/confirm" -> {
                    assertEquals("PATCH", request.method)
                    200 to envelope(appointment.replace("AWAITING_PAYMENT", "CONFIRMED"))
                }
                else -> error("Unexpected path")
            }
        }
        draft(vm)
        vm.checkout()
        val state = settled(vm)
        assertEquals("CONFIRMED", state.createdAppointment?.status)
        assertEquals(5, state.currentStep)
        assertEquals(2, calls.size)
    }

    @Test fun simulationIsExplicitAndReusesCreatedAppointment() = runBlocking {
        val vm = vm { request ->
            when (request.url.encodedPath) {
                "/api/v1/appointments" -> 201 to envelope(appointment)
                "/api/v1/payments/status/appointment-id" -> 200 to envelope("""{"paymentStatus":"UNPAID"}""")
                "/api/v1/payments/simulate-success" -> {
                    assertEquals("MOMO", request.json()["paymentMethod"].asString)
                    assertEquals("appointment-id", request.json()["appointmentId"].asString)
                    200 to envelope("""{"appointmentId":"appointment-id","status":"PAID","bookingCode":"NC-123","paymentMethod":"MOMO"}""")
                }
                else -> error("Unexpected path")
            }
        }
        draft(vm)
        vm.setPaymentMethod("MOMO")
        vm.checkout()
        assertTrue(settled(vm).showSimulation)
        assertEquals("AWAITING_PAYMENT", vm.uiState.value.createdAppointment?.status)
        vm.dismissSimulation()
        vm.checkout()
        settled(vm)
        assertEquals(1, calls.count { it.url.encodedPath == "/api/v1/appointments" })
        vm.simulatePayment()
        val paid = settled(vm)
        assertEquals("PAID", paid.createdAppointment?.status)
        assertEquals(5, paid.currentStep)
    }

    @Test fun failedPaymentStaysPendingAndCanReconcileSuccessfulRetry() = runBlocking {
        var alreadyPaid = false
        val vm = vm { request -> when (request.url.encodedPath) {
            "/api/v1/appointments" -> 201 to envelope(appointment)
            "/api/v1/payments/status/appointment-id" -> 200 to envelope("""{"paymentStatus":"${if (alreadyPaid) "PAID" else "UNPAID"}"}""")
            "/api/v1/payments/simulate-success" -> { alreadyPaid = true; 503 to """{"message":"Mất kết nối"}""" }
            else -> error("Unexpected path")
        } }
        draft(vm)
        vm.setPaymentMethod("VNPAY")
        vm.checkout(); settled(vm)
        vm.simulatePayment()
        val failed = settled(vm)
        assertTrue(failed.checkoutState is NetworkState.Error)
        assertEquals(4, failed.currentStep)
        vm.simulatePayment()
        assertEquals(5, settled(vm).currentStep)
        assertEquals(1, calls.count { it.url.encodedPath.endsWith("simulate-success") })
    }

    @Test fun createRetryKeepsIdempotencyKeyAndBlocksDoubleSubmit() = runBlocking {
        var creates = 0
        val vm = vm { request ->
            assertEquals("/api/v1/appointments", request.url.encodedPath)
            creates++
            if (creates == 1) 409 to """{"message":"Khung giờ vừa được đặt"}""" else 201 to envelope(appointment)
        }
        draft(vm)
        vm.setPaymentMethod("VIETQR")
        vm.checkout(); settled(vm)
        val firstKey = calls.first().json()["idempotencyKey"].asString
        vm.checkout(); vm.checkout()
        settled(vm)
        assertEquals(2, creates)
        assertEquals(firstKey, calls.last().json()["idempotencyKey"].asString)
    }

    @Test fun expiredAppointmentCannotBeSimulated() {
        val vm = vm { error("No API expected") }
        val expired = Gson().fromJson(appointment.replace("2099-01-01T00:00:00Z", "2000-01-01T00:00:00Z"), Appointment::class.java)
        vm.resumePayment(expired)
        vm.simulatePayment()
        assertTrue(vm.uiState.value.checkoutState is NetworkState.Error)
        assertEquals(4, vm.uiState.value.currentStep)
        assertTrue(calls.isEmpty())
    }

    @Test fun unavailableFullAndPastSlotsAreNotSelectable() {
        val now = Instant.parse("2026-09-27T00:00:00Z")
        assertTrue(isBookableSlot(slot, "2099-01-01", now))
        assertFalse(isBookableSlot(slot.copy(bookedCount = 3), "2099-01-01", now))
        assertFalse(isBookableSlot(slot.copy(status = "BLOCKED"), "2099-01-01", now))
        assertFalse(isBookableSlot(slot.copy(isAvailable = false), "2099-01-01", now))
        assertFalse(isBookableSlot(slot.copy(startTime = "2000-01-01T00:00:00Z"), "2000-01-01", now))
    }
}
