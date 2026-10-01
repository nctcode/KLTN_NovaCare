package com.example.kltn_novacare

import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.ApiService
import com.example.kltn_novacare.data.repository.HealthShareRepository
import com.example.kltn_novacare.data.repository.PatientRepository
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import org.junit.Assert.*
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.time.Instant
import java.time.LocalDate

class HealthProfileContractTest {
    private val gson = Gson()
    private val webProfile = """{"id":"server-profile","userId":"owner","fullName":"Nguyễn An","gender":"FEMALE","dateOfBirth":"2000-02-29T00:00:00.000Z","identityNumber":"012345678901","relation":"Con cái","allergies":"Hải sản","isDefault":true}"""

    private fun api(status: Int = 200, response: String, inspect: (Request) -> Unit = {}): ApiService {
        val client = OkHttpClient.Builder().addInterceptor { chain ->
            inspect(chain.request())
            Response.Builder().request(chain.request()).protocol(Protocol.HTTP_1_1)
                .code(status).message("Test response")
                .body(response.toResponseBody("application/json".toMediaType())).build()
        }.build()
        return Retrofit.Builder().baseUrl("https://example.invalid/api/v1/")
            .client(client).addConverterFactory(GsonConverterFactory.create()).build().create(ApiService::class.java)
    }

    private fun Request.json(): JsonObject {
        val buffer = Buffer()
        body!!.writeTo(buffer)
        return gson.fromJson(buffer.readUtf8(), JsonObject::class.java)
    }

    @Test fun readsProfilesCreatedOnWeb() = runBlocking {
        val repository = PatientRepository(api(response = """{"statusCode":200,"data":[$webProfile]}"""))
        val profile = repository.getPatientProfiles().getOrThrow().single()
        assertEquals("012345678901", profile.identityCard)
        assertEquals("Con cái", profile.displayRelationship)
        assertEquals("Nữ", profile.displayGender)
        assertEquals("29/02/2000", profile.formattedDateOfBirth)
        val form = PatientProfileFormData.from(profile)
        assertEquals("2000-02-29", form.dateOfBirth)
        assertEquals("Hải sản", form.allergies)
        assertTrue(form.validationErrors().isEmpty())
    }

    @Test fun createsWithWebFieldNamesAndReturnsServerId() = runBlocking {
        val repository = PatientRepository(api(status = 201, response = """{"statusCode":201,"data":$webProfile}""") { request ->
            assertEquals("POST", request.method)
            assertEquals("/api/v1/patient-profiles", request.url.encodedPath)
            val body = request.json()
            assertEquals("FEMALE", body["gender"].asString)
            assertEquals("012345678901", body["identityNumber"].asString)
            assertEquals("Con cái", body["relation"].asString)
            assertFalse(body.has("identityCard"))
            assertFalse(body.has("relationship"))
            assertFalse(body.has("email"))
            assertFalse(body.has("isDefault"))
        })
        val request = PatientProfileFormData(fullName = " Nguyễn An ", dateOfBirth = "2000-02-29", gender = "NU",
            identityNumber = "012345678901", relation = "Con cái").toRequest(false)
        assertEquals("server-profile", repository.createPatientProfile(request).getOrThrow().id)
    }

    @Test fun updatesCanClearOptionalFields() = runBlocking {
        val repository = PatientRepository(api(response = """{"statusCode":200,"data":$webProfile}""") { request ->
            assertEquals("PUT", request.method)
            assertEquals("/api/v1/patient-profiles/server-profile", request.url.encodedPath)
            val body = request.json()
            listOf("identityNumber", "healthInsurance", "address", "medicalHistory", "allergies", "emergencyContact", "emergencyPhone")
                .forEach { assertTrue("$it must be explicitly cleared", body[it]?.isJsonNull == true) }
        })
        repository.updatePatientProfile("server-profile", PatientProfileFormData(fullName = "An", dateOfBirth = "2000-01-01").toRequest(true)).getOrThrow()
        Unit
    }

    @Test fun deletionAcceptsSuccessWithoutData() = runBlocking {
        val repository = PatientRepository(api(response = """{"statusCode":200,"message":"Đã xóa"}""") {
            assertEquals("DELETE", it.method)
        })
        assertTrue(repository.deletePatientProfile("server-profile").isSuccess)
    }

    @Test fun deletionDisplaysServerRestriction() = runBlocking {
        val message = "Không thể xóa hồ sơ mặc định. Hãy đặt hồ sơ khác làm mặc định trước"
        val repository = PatientRepository(api(status = 400, response = """{"statusCode":400,"message":"$message","error":"Bad Request"}"""))
        assertEquals(message, repository.deletePatientProfile("server-profile").exceptionOrNull()?.message)
    }

    @Test fun validationErrorsFromServerAreReadable() = runBlocking {
        val repository = PatientRepository(api(status = 400, response = """{"statusCode":400,"message":["Giới tính không hợp lệ","Ngày sinh không hợp lệ"]}"""))
        val result = repository.createPatientProfile(PatientProfileFormData().toRequest(false))
        assertEquals("Giới tính không hợp lệ\nNgày sinh không hợp lệ", result.exceptionOrNull()?.message)
    }

    @Test fun defaultUsesSameEndpointAsWeb() = runBlocking {
        val repository = PatientRepository(api(response = """{"statusCode":200,"data":$webProfile}""") {
            assertEquals("PATCH", it.method)
            assertEquals("/api/v1/patient-profiles/server-profile/default", it.url.encodedPath)
        })
        assertTrue(repository.setDefaultPatientProfile("server-profile").getOrThrow().isDefault)
    }

    @Test fun datesAreStrictAndPhoneIsOptional() {
        val today = LocalDate.of(2026, 9, 27)
        assertTrue(PatientProfileFormData(fullName = "An", dateOfBirth = "2000-02-29").validationErrors(today).isEmpty())
        listOf("", "2025-02-29", "2026-02-30", "2027-01-01").forEach {
            assertTrue(PatientProfileFormData(fullName = "An", dateOfBirth = it).validationErrors(today).containsKey("dateOfBirth"))
        }
        assertTrue(PatientProfileFormData(fullName = " ", dateOfBirth = "2000-01-01").validationErrors(today).containsKey("fullName"))
    }

    @Test fun shareCreationUsesPortalAndServerCredentials() = runBlocking {
        val repository = HealthShareRepository(api(status = 201, response = """{"statusCode":201,"data":{"id":"share-1","shareToken":"NC-SERVER-CODE","pinCode":"1234","validUntil":"2027-01-01T00:00:00.000Z"}}""") {
            assertEquals("/api/v1/interoperability/portal/share-codes", it.url.encodedPath)
            val body = it.json()
            assertEquals(60, body["validMinutes"].asInt)
            assertFalse(body.has("customToken"))
            assertFalse(body.has("pinCode"))
            assertEquals("Điều trị", body["allowedSections"].asJsonArray[0].asString)
        })
        val share = repository.createShare(CreateHealthShareRequest(60, listOf("Điều trị"))).getOrThrow()
        assertEquals("NC-SERVER-CODE", share.shareToken)
        assertEquals("1234", share.pinCode)
        assertTrue(share.isUsable(Instant.parse("2026-09-27T00:00:00Z")))
    }

    @Test fun failedCreationDoesNotProduceShareCode() = runBlocking {
        val repository = HealthShareRepository(api(status = 503, response = """{"message":"Dịch vụ tạm thời gián đoạn"}"""))
        val result = repository.createShare(CreateHealthShareRequest(60, listOf("Điều trị")))
        assertTrue(result.isFailure)
        assertNull(result.getOrNull())
    }

    @Test fun readsAndRevokesWebShares() = runBlocking {
        val repository = HealthShareRepository(api(response = """{"statusCode":200,"data":[{"id":"share-1","shareToken":"NC-WEB-CODE","isActive":true,"validUntil":"2027-01-01T00:00:00Z"}]}"""))
        assertEquals("NC-WEB-CODE", repository.getShares().getOrThrow().single().shareToken)
        val revoker = HealthShareRepository(api(response = """{"statusCode":200,"data":{"message":"Đã thu hồi"}}""") {
            assertEquals("PATCH", it.method)
            assertEquals("/api/v1/interoperability/portal/share-codes/share-1/revoke", it.url.encodedPath)
        })
        assertTrue(revoker.revokeShare("share-1").isSuccess)
    }

    @Test fun expiredRevokedAndInvalidSharesCannotBeUsed() {
        val now = Instant.parse("2026-09-27T00:00:00Z")
        val share = HealthShare("share-1", "NC-WEB-CODE", "2026-09-28T00:00:00Z", isActive = true)
        assertTrue(share.isUsable(now))
        assertFalse(share.copy(validUntil = now.toString()).isUsable(now))
        assertFalse(share.copy(validUntil = "invalid").isUsable(now))
        assertFalse(share.copy(isActive = false).isUsable(now))
        assertFalse(share.copy(revokedAt = now.toString()).isUsable(now))
    }
}
