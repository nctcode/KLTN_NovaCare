package com.example.kltn_novacare.data.api

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

data class StartSessionRequest(
    val age: Int,
    val gender: String,
    val medicalHistory: List<String>? = null,
    val medications: String? = null,
    val allergies: String? = null
)

data class StartSessionResponse(val data: SessionData)
data class SessionData(val sessionId: String)

data class SubmitSymptomsResponse(val data: SymptomsData)
data class SymptomsData(
    val sessionId: String,
    val transcript: String?,
    val questions: List<QuestionData>?
)
data class QuestionData(
    val id: String,
    val question: String,
    val order: Int,
    val options: List<String>?
)

data class AnswerQuestionRequest(val questionId: String, val answer: String)
data class GenericResponse(val data: Any?)

data class CompleteSessionResponse(
    val data: CompleteData
)
data class CompleteData(
    val sessionId: String,
    val riskAssessment: RiskAssessment,
    val recommendations: Recommendations?
)
data class RiskAssessment(
    val level: String,
    val label: String,
    val reason: String
)
data class Recommendations(
    val suggestedSpecialty: String?,
    val doctors: List<DoctorItem>?
)
data class DoctorItem(
    val doctorId: String,
    val doctorName: String,
    val qualification: String,
    val hospitalId: String,
    val hospitalName: String,
    val fee: Double
)

interface PreExamApiService {

    @POST("api/v1/pre-exam-v2/start")
    suspend fun startSession(
        @Header("Authorization") token: String,
        @Body request: StartSessionRequest
    ): Response<StartSessionResponse>

    @Multipart
    @POST("api/v1/pre-exam-v2/{id}/symptoms")
    suspend fun submitSymptoms(
        @Header("Authorization") token: String,
        @Path("id") sessionId: String,
        @Part("text") text: RequestBody,
        @Part("bodyDiagram") bodyDiagram: RequestBody?,
        @Part voice: MultipartBody.Part?,
        @Part images: List<MultipartBody.Part>?
    ): Response<SubmitSymptomsResponse>

    @POST("api/v1/pre-exam-v2/{id}/answer")
    suspend fun answerQuestion(
        @Header("Authorization") token: String,
        @Path("id") sessionId: String,
        @Body request: AnswerQuestionRequest
    ): Response<GenericResponse>

    @POST("api/v1/pre-exam-v2/{id}/complete")
    suspend fun completeSession(
        @Header("Authorization") token: String,
        @Path("id") sessionId: String
    ): Response<CompleteSessionResponse>
}
