package com.example.kltn_novacare.ui.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.api.PreExamApiService
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.remote.ApiClient
import com.google.gson.Gson
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

data class ScreeningImage(val file: File, val mime: String)
data class PreExamUiState(
    val step: Int = 0, val catalog: MobileScreeningCatalog? = null, val hospitals: List<Hospital> = emptyList(),
    val loading: Boolean = true, val hospitalId: String? = null, val regions: Set<String> = emptySet(),
    val age: String = "", val symptoms: String = "", val pain: String = "", val duration: String = "",
    val answers: Map<String, String> = emptyMap(), val images: List<ScreeningImage> = emptyList(),
    val consent: Boolean = false, val ppg: ScreeningPpg? = null, val transcript: String = "", val confirmed: Boolean = false,
    val busy: Boolean = false, val importing: Boolean = false, val transcribing: Boolean = false,
    val revision: Long = 0, val result: MobileScreeningResult? = null, val error: String? = null
) {
    val questions get() = catalog?.questions.orEmpty().filter { q -> q.regionIds.any { it in regions } }.sortedWith(compareByDescending<ScreeningQuestion> { it.safety }.thenByDescending { it.priority })
    val unansweredSafety get() = questions.filter { it.safety && answers[it.id] !in listOf("yes", "no") }
    val hasWarning get() = questions.any { it.safety && answers[it.id] == "yes" }
    val canApply get() = result?.applicable(revision, hospitalId) == true
}

class PreExamViewModel(private val api: PreExamApiService = ApiClient.getPreExamApiService()) : ViewModel() {
    private val gson = Gson()
    private val mutable = MutableStateFlow(PreExamUiState())
    val uiState = mutable.asStateFlow()
    private var analysis: Job? = null
    private var voice: Job? = null
    private var voiceGeneration = 0L
    private var importJob: Job? = null
    init { load() }
    fun load() { viewModelScope.launch {
        mutable.value = mutable.value.copy(loading = true, error = null)
        try {
            val response = api.screeningCatalog()
            check(response.isSuccessful) { "Không tải được bộ câu hỏi. Hãy kiểm tra kết nối và thử lại." }
            val catalog = gson.fromJson(unwrapScreeningResponse(response.body()!!), MobileScreeningCatalog::class.java)
            check(catalog.version.isNotBlank() && catalog.regions.isNotEmpty())
            check(catalog.questions.all { it.type in listOf("boolean", "single_choice") })
            val hospitals = api.screeningHospitals()
            analysis?.cancel()
            val changed = mutable.value.catalog?.version != catalog.version
            mutable.value = mutable.value.copy(catalog = catalog, hospitals = hospitals.body()?.data.orEmpty(), loading = false,
                answers = if (changed) emptyMap() else mutable.value.answers, result = null, busy = false, revision = mutable.value.revision + 1,
                step = if (changed && mutable.value.catalog != null) 1 else mutable.value.step,
                error = if (hospitals.isSuccessful) null else "Chưa tải được cơ sở y tế. Bạn vẫn có thể sàng lọc và chọn cơ sở sau.")
        } catch (e: CancellationException) { throw e } catch (_: Exception) {
            mutable.value = mutable.value.copy(loading = false, error = "Chưa tải được dữ liệu sàng lọc. Vui lòng thử lại.")
        }
    } }
    private fun edit(change: (PreExamUiState) -> PreExamUiState) {
        analysis?.cancel()
        mutable.value = change(mutable.value).copy(revision = mutable.value.revision + 1, result = null, busy = false, error = null)
    }
    fun error(message: String) { mutable.value = mutable.value.copy(error = message) }
    fun step(index: Int) {
        if (mutable.value.busy || mutable.value.transcribing || mutable.value.importing) return
        if (index > 0 && mutable.value.regions.isEmpty()) { error("Chọn ít nhất một vùng cơ thể."); return }
        mutable.value = mutable.value.copy(step = index.coerceIn(0, 5), error = null)
    }
    fun region(id: String) {
        val old = mutable.value
        if (id !in old.regions && old.regions.size >= 10) { error("Chọn tối đa 10 vùng cơ thể."); return }
        voiceGeneration++; voice?.cancel(); importJob?.cancel(); old.images.forEach { it.file.delete() }
        edit { it.copy(regions = if (id in it.regions) it.regions - id else it.regions + id,
            answers = emptyMap(), images = emptyList(), ppg = null, transcript = "", confirmed = false, transcribing = false, importing = false) }
    }
    fun hospital(id: String?) = edit { it.copy(hospitalId = id) }
    fun age(value: String) = edit { it.copy(age = value.filter(Char::isDigit).take(3)) }
    fun symptoms(value: String) = edit { it.copy(symptoms = value.take(4000)) }
    fun pain(value: String) = edit { it.copy(pain = value.filter(Char::isDigit).take(2)) }
    fun duration(value: String) = edit { it.copy(duration = value.take(100)) }
    fun answer(id: String, value: String) = edit { it.copy(answers = it.answers + (id to value)) }
    fun consent(value: Boolean) { if (!value) { voiceGeneration++; voice?.cancel() }; edit { it.copy(consent = value, transcribing = if (value) it.transcribing else false, confirmed = if (value) it.confirmed else false) } }
    fun ppg(value: ScreeningPpg?) = edit { it.copy(ppg = value) }
    fun transcript(value: String) = edit { it.copy(transcript = value.take(4000), confirmed = false) }
    fun confirm(value: Boolean) = edit { it.copy(confirmed = value) }
    fun removeImage(image: ScreeningImage) { edit { it.copy(images = it.images - image) }; image.file.delete() }
    fun addImage(context: Context, uri: Uri, capturedFile: File? = null) {
        if (mutable.value.images.size >= 3 || mutable.value.importing) { capturedFile?.delete(); error("Tối đa 3 ảnh mỗi phiên."); return }
        val revision = mutable.value.revision
        importJob = viewModelScope.launch {
            mutable.value = mutable.value.copy(importing = true)
            var copied: File? = null
            try {
                val image = withContext(Dispatchers.IO) {
                    val mime = context.contentResolver.getType(uri)?.substringBefore(';') ?: ""
                    require(mime in listOf("image/jpeg", "image/png", "image/webp"))
                    val file = File.createTempFile("screening-", ".image", context.cacheDir); copied = file
                    context.contentResolver.openInputStream(uri)!!.use { input -> file.outputStream().use { output ->
                        val buffer = ByteArray(8192); var total = 0
                        while (true) { val size = input.read(buffer); if (size < 0) break; total += size; require(total <= 5 * 1024 * 1024); output.write(buffer, 0, size) }
                        require(total > 0)
                    } }
                    ScreeningImage(file, mime)
                }
                if (mutable.value.revision == revision) { edit { it.copy(images = it.images + image) }; copied = null }
            } catch (e: CancellationException) { throw e } catch (_: Exception) { error("Chọn ảnh JPEG, PNG hoặc WebP không quá 5 MB.") }
            finally { copied?.delete(); capturedFile?.delete(); mutable.value = mutable.value.copy(importing = false) }
        }
    }
    fun transcribe(file: File) {
        if (!mutable.value.consent) { file.delete(); error("Cần đồng ý xử lý bản ghi trước khi gửi."); return }
        val generation = ++voiceGeneration
        voice?.cancel(); edit { it.copy(transcript = "", confirmed = false, transcribing = true) }
        val revision = mutable.value.revision
        voice = viewModelScope.launch {
            try {
                val response = api.transcribe(MultipartBody.Part.createFormData("file", "voice.m4a", file.asRequestBody("audio/mp4".toMediaType())), "true".toRequestBody())
                check(response.isSuccessful)
                val text = unwrapScreeningResponse(response.body()!!).get("transcript")?.asString.orEmpty()
                check(text.isNotBlank())
                if (mutable.value.revision == revision) edit { it.copy(transcript = text, confirmed = false) }
            } catch (e: CancellationException) { throw e } catch (_: Exception) {
                if (mutable.value.revision == revision) error("Chưa chuyển được giọng nói. Hãy thử lại hoặc nhập mô tả triệu chứng.")
            } finally { file.delete(); if (voiceGeneration == generation) mutable.value = mutable.value.copy(transcribing = false) }
        }
    }
    fun analyze(urgent: Boolean = false) {
        val state = mutable.value
        if (state.busy || state.transcribing || state.importing) return
        if (state.regions.isEmpty()) { error("Chọn vùng cơ thể."); return }
        if (!urgent && state.age.toIntOrNull()?.let { it in 0..120 } != true) { step(0); error("Nhập tuổi thực tế từ 0 đến 120."); return }
        if (!urgent && state.pain.isNotBlank() && state.pain.toIntOrNull()?.let { it in 0..10 } != true) { step(1); error("Mức đau từ 0 đến 10 hoặc để trống."); return }
        if (!urgent && state.images.isNotEmpty() && !state.consent) { step(2); error("Đồng ý xử lý ảnh hoặc xóa ảnh để tiếp tục."); return }
        if (!urgent && state.transcript.isNotBlank() && !state.confirmed) { step(4); error("Kiểm tra và xác nhận lời kể trước khi phân tích."); return }
        val revision = state.revision
        analysis = viewModelScope.launch {
            mutable.value = mutable.value.copy(busy = true, step = 5, result = null, error = null)
            try {
                val fields = screeningFields(state, gson, urgent).mapValues { it.value.toRequestBody("text/plain".toMediaType()) }
                val images = if (urgent) emptyList() else state.images.map { MultipartBody.Part.createFormData("images", "image", it.file.asRequestBody(it.mime.toMediaType())) }
                val response = api.analyzeV3(fields, images)
                check(response.isSuccessful) { if (response.code() == 400) "Bộ câu hỏi hoặc dữ liệu đã thay đổi. Hãy tải lại bộ câu hỏi và kiểm tra thông tin." else "Chưa nhận được kết quả. Vui lòng thử lại." }
                val result = gson.fromJson(unwrapScreeningResponse(response.body()!!), MobileScreeningResult::class.java)
                check(result.schemaVersion == "3" && result.inputRevision == revision.toString() && !result.summary.isNullOrBlank()) { "Phản hồi sàng lọc không hợp lệ." }
                if (mutable.value.revision == revision) mutable.value = mutable.value.copy(result = result, busy = false)
            } catch (e: CancellationException) { throw e } catch (e: Exception) {
                if (mutable.value.revision == revision) mutable.value = mutable.value.copy(busy = false, error = if (e is IllegalStateException) e.message else "Không kết nối được dịch vụ. Chưa có kết quả AI; hãy thử lại.")
            }
        }
    }
    override fun onCleared() { mutable.value.images.forEach { it.file.delete() }; super.onCleared() }
}

fun screeningFields(state: PreExamUiState, gson: Gson = Gson(), urgent: Boolean = false): Map<String, String> = buildMap {
    put("schemaVersion", "3"); put("inputRevision", state.revision.toString()); put("bodyAreas", gson.toJson(state.regions))
    put("questionnaire", gson.toJson(mapOf("version" to state.catalog?.version, "answers" to state.answers.map { mapOf("questionId" to it.key, "answer" to it.value) },
        "painLevel" to state.pain.toIntOrNull()?.takeIf { it in 0..10 }, "duration" to state.duration.ifBlank { null })))
    state.age.toIntOrNull()?.takeIf { it in 0..120 }?.let { put("age", it.toString()) }
    state.hospitalId?.let { put("hospitalId", it) }; put("symptoms", state.symptoms)
    put("mediaConsent", state.consent.toString())
    if (!urgent) state.ppg?.let { put("ppg", gson.toJson(it)) }
    if (state.confirmed && state.transcript.isNotBlank()) { put("voiceTranscript", state.transcript); put("voiceConfirmed", "true") }
}
