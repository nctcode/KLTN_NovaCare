package com.example.kltn_novacare.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.*
import com.example.kltn_novacare.data.repository.AppointmentRepository
import com.example.kltn_novacare.data.repository.ConsultationRepository
import com.example.kltn_novacare.data.remote.ConsultationReadReceipt
import com.example.kltn_novacare.data.remote.ConsultationRealtimeTransport
import com.example.kltn_novacare.data.remote.ApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.util.UUID

data class ConsultationChatUiState(
    val consultation: Consultation? = null,
    val messages: List<ConsultationMessage> = emptyList(),
    val isInitialLoading: Boolean = false,
    val isLoadingOlder: Boolean = false,
    val hasMore: Boolean = false,
    val nextCursor: String? = null,
    val connectionState: String = "DISCONNECTED",
    val isUpdatingSession: Boolean = false,
    val isOtherTyping: Boolean = false,
    val error: String? = null
)

class ConsultationViewModel(
    private val repository: ConsultationRepository = ConsultationRepository(),
    private val appointmentRepository: AppointmentRepository = AppointmentRepository(),
    private val realtime: ConsultationRealtimeTransport = ConsultationRealtimeTransport()
) : ViewModel() {
    val currentUserId: String get() = ApiClient.getTokenManager().getUserId().orEmpty()
    fun isAssignedDoctor(consultation: Consultation) = consultation.doctor.userId == currentUserId

    fun transitionSession(action: String) {
        val id = _chat.value.consultation?.id ?: return
        if (_chat.value.isUpdatingSession) return
        _chat.value = _chat.value.copy(isUpdatingSession = true, error = null)
        viewModelScope.launch {
            repository.transition(id, action).fold(
                onSuccess = { updated ->
                    if (_chat.value.consultation?.id == id) {
                        _chat.value = _chat.value.copy(consultation = updated, isUpdatingSession = false)
                    }
                },
                onFailure = {
                    if (_chat.value.consultation?.id == id) {
                        _chat.value = _chat.value.copy(error = it.message, isUpdatingSession = false)
                    }
                }
            )
        }
    }
    private data class PendingAttachment(val fileName: String, val mimeType: String, val bytes: ByteArray)
    private val pendingAttachments = mutableMapOf<String, PendingAttachment>()
    private val _consultations = MutableStateFlow<NetworkState<List<Consultation>>>(NetworkState.Idle)
    val consultations = _consultations.asStateFlow()

    private val _chat = MutableStateFlow(ConsultationChatUiState())
    val chat = _chat.asStateFlow()

    private val _appointment = MutableStateFlow<NetworkState<Appointment>>(NetworkState.Idle)
    val appointment = _appointment.asStateFlow()

    private val _createState = MutableStateFlow<NetworkState<Consultation>>(NetworkState.Idle)
    val createState = _createState.asStateFlow()

    fun loadConsultations() {
        viewModelScope.launch {
            _consultations.value = NetworkState.Loading
            repository.list().fold(
                onSuccess = { _consultations.value = NetworkState.Success(it.items) },
                onFailure = { _consultations.value = NetworkState.Error(it.message ?: "Không thể tải cuộc tư vấn") }
            )
        }
    }

    fun prepareAppointment(appointmentId: String) {
        viewModelScope.launch {
            _appointment.value = NetworkState.Loading
            appointmentRepository.getAppointmentById(appointmentId).fold(
                onSuccess = { _appointment.value = NetworkState.Success(it) },
                onFailure = { _appointment.value = NetworkState.Error(it.message ?: "Không thể tải lịch tư vấn") }
            )
        }
    }

    private val _videoAvailable = MutableStateFlow(false)
    val videoAvailable = _videoAvailable.asStateFlow()
    fun loadVideoCapabilities() { viewModelScope.launch {
        _videoAvailable.value = repository.videoCapabilities().getOrNull()?.videoEnabled == true
    } }

    fun createConsultation(appointmentId: String, topic: String, description: String, channel: String = "CHAT", onCreated: (String) -> Unit) {
        if (_createState.value is NetworkState.Loading) return
        viewModelScope.launch {
            _createState.value = NetworkState.Loading
            repository.create(CreateConsultationRequest(
                appointmentId = appointmentId,
                channel = channel,
                topic = topic.trim(),
                description = description.trim(),
                consentAccepted = true,
                idempotencyKey = UUID.randomUUID().toString()
            )).fold(
                onSuccess = {
                    _createState.value = NetworkState.Success(it)
                    loadConsultations()
                    onCreated(it.id)
                },
                onFailure = { _createState.value = NetworkState.Error(it.message ?: "Không thể tạo phiên tư vấn") }
            )
        }
    }

    fun resetCreateState() { if (_createState.value !is NetworkState.Loading) _createState.value = NetworkState.Idle }

    fun openConversation(id: String) {
        _chat.value = ConsultationChatUiState(isInitialLoading = true)
        viewModelScope.launch {
            val detail = repository.detail(id)
            val messages = repository.messages(id)
            if (detail.isSuccess && messages.isSuccess) {
                val page = messages.getOrThrow()
                val consultation = detail.getOrThrow()
                _chat.value = ConsultationChatUiState(
                    consultation = consultation,
                    messages = page.items,
                    hasMore = page.nextCursor != null,
                    nextCursor = page.nextCursor
                )
                connectRealtime(consultation.id)
            } else {
                _chat.value = ConsultationChatUiState(error = detail.exceptionOrNull()?.message
                    ?: messages.exceptionOrNull()?.message ?: "Không thể tải cuộc trò chuyện")
            }
        }
    }

    fun refreshConversation() {
        _chat.value.consultation?.id?.let(::openConversation)
    }

    fun loadOlder() {
        val current = _chat.value
        val id = current.consultation?.id ?: return
        val cursor = current.nextCursor ?: return
        if (current.isLoadingOlder) return
        _chat.value = current.copy(isLoadingOlder = true)
        viewModelScope.launch {
            repository.messages(id, cursor).fold(
                onSuccess = { page ->
                    _chat.value = _chat.value.copy(
                        messages = page.items + _chat.value.messages,
                        isLoadingOlder = false,
                        hasMore = page.nextCursor != null,
                        nextCursor = page.nextCursor
                    )
                },
                onFailure = { _chat.value = _chat.value.copy(isLoadingOlder = false, error = it.message) }
            )
        }
    }

    fun sendText(text: String, clientMessageId: String = UUID.randomUUID().toString()) {
        val consultation = _chat.value.consultation ?: return
        if (text.isBlank()) return
        setTyping(false)
        val optimistic = ConsultationMessage(
            id = "local-$clientMessageId",
            consultationId = consultation.id,
            senderUserId = currentUserId,
            senderType = if (isAssignedDoctor(consultation)) "DOCTOR" else "PATIENT",
            messageType = "TEXT",
            clientMessageId = clientMessageId,
            text = text.trim(),
            sentAt = Instant.now().toString(),
            localDeliveryStatus = "SENDING"
        )
        _chat.value = _chat.value.copy(messages = _chat.value.messages + optimistic, error = null)
        viewModelScope.launch {
            repository.send(consultation.id, clientMessageId, text).fold(
                onSuccess = { sent ->
                    _chat.value = _chat.value.copy(messages = _chat.value.messages.map {
                        if (it.clientMessageId == clientMessageId) sent else it
                    })
                },
                onFailure = { error ->
                    _chat.value = _chat.value.copy(
                        messages = _chat.value.messages.map {
                            if (it.clientMessageId == clientMessageId) it.copy(localDeliveryStatus = "FAILED") else it
                        },
                        error = error.message
                    )
                }
            )
        }
    }

    fun retry(message: ConsultationMessage) {
        if (message.text == null && message.attachments.isNotEmpty()) {
            val pending = pendingAttachments[message.clientMessageId] ?: return
            _chat.value = _chat.value.copy(messages = _chat.value.messages.map {
                if (it.clientMessageId == message.clientMessageId) it.copy(localDeliveryStatus = "SENDING") else it
            })
            uploadAttachment(_chat.value.consultation?.id ?: return, message.clientMessageId, pending)
            return
        }
        val text = message.text ?: return
        _chat.value = _chat.value.copy(messages = _chat.value.messages.filterNot { it.clientMessageId == message.clientMessageId })
        sendText(text, message.clientMessageId)
    }

    fun sendAttachment(fileName: String, mimeType: String, bytes: ByteArray, localUri: String? = null) {
        val consultation = _chat.value.consultation ?: return
        if (bytes.isEmpty() || bytes.size > 10 * 1024 * 1024) {
            _chat.value = _chat.value.copy(error = "Tệp phải có dung lượng từ 1 byte đến 10 MB")
            return
        }
        setTyping(false)
        val clientMessageId = UUID.randomUUID().toString()
        val type = if (mimeType.startsWith("image/")) "IMAGE" else "DOCUMENT"
        val localAttachment = ConsultationAttachment(
            id = "local-$clientMessageId",
            type = type,
            fileName = fileName,
            mimeType = mimeType,
            sizeBytes = bytes.size,
            status = "PENDING",
            localUri = localUri
        )
        pendingAttachments[clientMessageId] = PendingAttachment(fileName, mimeType, bytes)
        val optimistic = ConsultationMessage(
            id = "local-$clientMessageId",
            consultationId = consultation.id,
            senderUserId = currentUserId,
            senderType = if (isAssignedDoctor(consultation)) "DOCTOR" else "PATIENT",
            messageType = type,
            clientMessageId = clientMessageId,
            sentAt = Instant.now().toString(),
            attachments = listOf(localAttachment),
            localDeliveryStatus = "SENDING"
        )
        _chat.value = _chat.value.copy(messages = _chat.value.messages + optimistic, error = null)
        uploadAttachment(consultation.id, clientMessageId, pendingAttachments.getValue(clientMessageId))
    }

    private fun uploadAttachment(consultationId: String, clientMessageId: String, pending: PendingAttachment) {
        viewModelScope.launch {
            repository.sendAttachment(consultationId, clientMessageId, pending.fileName, pending.mimeType, pending.bytes).fold(
                onSuccess = { sent ->
                    pendingAttachments.remove(clientMessageId)
                    _chat.value = _chat.value.copy(messages = _chat.value.messages.map {
                        if (it.clientMessageId == clientMessageId) sent else it
                    })
                },
                onFailure = { error ->
                    _chat.value = _chat.value.copy(
                        messages = _chat.value.messages.map {
                            if (it.clientMessageId == clientMessageId) it.copy(localDeliveryStatus = "FAILED") else it
                        },
                        error = error.message ?: "Không thể tải tệp lên"
                    )
                }
            )
        }
    }

    private var typingResetJob: kotlinx.coroutines.Job? = null

    fun setTyping(isTyping: Boolean) {
        realtime.sendTyping(isTyping)
    }

    private fun connectRealtime(id: String) {
        realtime.connect(
            id = id,
            onConnectionChanged = { state -> _chat.value = _chat.value.copy(connectionState = state) },
            onMessage = message@{ incoming ->
                val current = _chat.value
                if (incoming.consultationId != current.consultation?.id) return@message
                if (incoming.senderUserId != currentUserId) {
                    typingResetJob?.cancel()
                    _chat.value = _chat.value.copy(isOtherTyping = false)
                }
                val withoutDuplicate = current.messages.filterNot {
                    it.id == incoming.id || it.clientMessageId == incoming.clientMessageId
                }
                _chat.value = current.copy(messages = withoutDuplicate + incoming, error = null)
            },
            onStatus = status@{ updated ->
                if (updated.id != _chat.value.consultation?.id) return@status
                _chat.value = _chat.value.copy(consultation = updated)
            },
            onReceipt = ::applyReadReceipt,
            onTyping = { userId, isTyping ->
                if (userId != currentUserId) {
                    typingResetJob?.cancel()
                    if (isTyping) {
                        _chat.value = _chat.value.copy(isOtherTyping = true)
                        typingResetJob = viewModelScope.launch {
                            kotlinx.coroutines.delay(4000)
                            _chat.value = _chat.value.copy(isOtherTyping = false)
                        }
                    } else {
                        _chat.value = _chat.value.copy(isOtherTyping = false)
                    }
                }
            }
        )
    }

    private fun applyReadReceipt(receipt: ConsultationReadReceipt) {
        val messages = _chat.value.messages
        val lastIndex = messages.indexOfFirst { it.id == receipt.lastReadMessageId }
        if (lastIndex < 0) return
        _chat.value = _chat.value.copy(messages = messages.mapIndexed { index, message ->
            if (index <= lastIndex && message.senderUserId != receipt.readerUserId) {
                message.copy(deliveredAt = message.deliveredAt ?: receipt.readAt, readAt = receipt.readAt)
            } else message
        })
    }

    private var lastReadRequest: String? = null

    fun markVisibleMessageRead(messageId: String) {
        val current = _chat.value
        val id = current.consultation?.id ?: return
        val message = current.messages.find { it.id == messageId } ?: return
        if (message.senderUserId == currentUserId || message.readAt != null || lastReadRequest == messageId) return
        lastReadRequest = messageId
        viewModelScope.launch {
            repository.markRead(id, messageId).fold(
                onSuccess = { receipt ->
                    if (_chat.value.consultation?.id == id) {
                        applyReadReceipt(ConsultationReadReceipt(receipt.updatedCount, receipt.readAt, receipt.lastReadMessageId, currentUserId))
                    }
                },
                onFailure = { if (lastReadRequest == messageId) lastReadRequest = null }
            )
        }
    }

    fun leaveConversation() {
        typingResetJob?.cancel()
        setTyping(false)
        realtime.disconnect()
        lastReadRequest = null
    }

    override fun onCleared() {
        typingResetJob?.cancel()
        realtime.disconnect()
        super.onCleared()
    }
}
