package com.example.kltn_novacare

import com.example.kltn_novacare.ui.theme.KLTN_NovaCareTheme
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.kltn_novacare.data.api.PreExamApiService
import com.example.kltn_novacare.ui.screens.PreExamScreeningScreen
import com.example.kltn_novacare.ui.viewmodel.PreExamViewModel
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
import java.util.concurrent.atomic.AtomicReference

@RunWith(AndroidJUnit4::class)
class MobileScreeningJourneyTest {
    @get:Rule val compose = createComposeRule()
    private lateinit var vm: PreExamViewModel
    private val submitted = AtomicReference("")
    private var applied: List<String?>? = null
    private fun screenshot(name: String) {
        val bitmap = compose.onRoot().captureToImage().asAndroidBitmap()
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        File(context.getExternalFilesDir(null), name).outputStream().use { bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
    }
    private fun launch(action: String = "BOOK_SPECIALTY", failure: Boolean = false) {
        val client = OkHttpClient.Builder().addInterceptor { chain ->
            val request = chain.request()
            val data = when (request.url.encodedPath.substringAfterLast('/')) {
                "screening-catalog" -> """{"version":"test-v3","regions":[{"id":"head","name":"Đầu"}],"questions":[{"id":"head_safety","question":"Đau đầu đột ngột?","regionIds":["head"],"type":"boolean","category":"red_flag","priority":100},{"id":"head_q","question":"Đau đầu tái diễn?","regionIds":["head"],"type":"boolean","priority":50}]}"""
                "hospitals" -> """[{"id":"h1","name":"Nova Test"}]"""
                "analyze-smartphone" -> {
                    val buffer = Buffer(); request.body!!.writeTo(buffer); val body = buffer.readUtf8(); submitted.set(body)
                    val revision = Regex("name=\"inputRevision\"\\r\\n[^\\r]*\\r\\n\\r\\n(\\d+)").find(body)?.groupValues?.get(1)
                        ?: Regex("name=\"inputRevision\"[\\s\\S]*?\\r\\n\\r\\n(\\d+)").find(body)!!.groupValues[1]
                    """{"schemaVersion":"3","inputRevision":"$revision","riskLevel":"CONSULT","riskLabel":"Định hướng khám","summary":"Dựa trên thông tin đã cung cấp.","nextAction":"$action","canApply":${action == "BOOK_SPECIALTY"},"recommendedSpecialtyId":"neuro","recommendedSpecialtyName":"Thần kinh","hospitalAvailability":{"hospitalId":"h1","available":true},"recommendationSource":"QUESTIONNAIRE_RULES","triageDetails":{"keyObservations":["Đau đầu tái diễn"]}}"""
                }
                else -> "{}"
            }
            val fail = failure && request.url.encodedPath.endsWith("analyze-smartphone")
            Response.Builder().request(request).protocol(Protocol.HTTP_1_1).code(if (fail) 503 else 200).message("Test")
                .body("""{"data":$data}""".toResponseBody("application/json".toMediaType())).build()
        }.build()
        val api = Retrofit.Builder().baseUrl("https://example.invalid/api/v1/").client(client).addConverterFactory(GsonConverterFactory.create()).build().create(PreExamApiService::class.java)
        compose.runOnUiThread { vm = PreExamViewModel(api) }
        compose.setContent { KLTN_NovaCareTheme { PreExamScreeningScreen({}, { _, specialty, hospital, reason -> applied = listOf(specialty, hospital, reason) }, vm) } }
        compose.waitUntil(10000) { vm.uiState.value.catalog != null }
    }
    private fun prepare() {
        compose.onNodeWithText("Tuổi").performScrollTo().performTextInput("30")
        compose.onNodeWithText("Đầu", useUnmergedTree = true).performScrollTo().performClick()
        compose.runOnIdle { vm.hospital("h1"); vm.answer("head_safety", "no"); vm.answer("head_q", "yes"); vm.step(4) }
    }
    @Test fun realMultipartContractAndApplyUsesServerSpecialty() {
        launch(); screenshot("screening-start.png"); prepare()
        compose.onNodeWithText("Phân tích và xem gợi ý").performScrollTo().performClick()
        compose.waitUntil(10000) { vm.uiState.value.result != null }
        screenshot("screening-result.png")
        compose.onNodeWithText("Áp dụng chuyên khoa vào đặt khám").performScrollTo().performClick()
        assertEquals("neuro", applied?.get(0)); assertEquals("h1", applied?.get(1))
        assertTrue(submitted.get().contains("test-v3")); assertTrue(submitted.get().contains("head_q")); assertFalse(submitted.get().contains("heartRateBpm"))
    }
    @Test fun editingInputInvalidatesThePreviousRecommendation() {
        launch(); prepare(); compose.runOnIdle { vm.analyze() }
        compose.waitUntil(10000) { vm.uiState.value.result != null }
        compose.runOnIdle { vm.symptoms("Triệu chứng đã đổi") }
        compose.onNodeWithText("Áp dụng chuyên khoa vào đặt khám").assertDoesNotExist()
        assertNull(applied)
    }
    @Test fun unavailableSpecialtyCannotBeApplied() {
        launch(action = "CONTACT_FACILITY"); prepare(); compose.runOnIdle { vm.analyze() }
        compose.waitUntil(10000) { vm.uiState.value.result != null }
        compose.onNodeWithText("Áp dụng chuyên khoa vào đặt khám").assertDoesNotExist()
    }
    @Test fun networkFailureDoesNotManufactureAResult() {
        launch(failure = true); prepare(); compose.runOnIdle { vm.analyze() }
        compose.waitUntil(10000) { vm.uiState.value.error != null }
        assertNull(vm.uiState.value.result)
        compose.onNodeWithText("Áp dụng chuyên khoa vào đặt khám").assertDoesNotExist()
    }
}
