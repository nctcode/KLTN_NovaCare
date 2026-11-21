package com.novacare.doctor.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.novacare.doctor.data.*
import com.twilio.audioswitch.AudioDevice
import io.livekit.android.LiveKit
import io.livekit.android.events.collect
import io.livekit.android.room.Room
import io.livekit.android.room.track.LocalVideoTrack
import io.livekit.android.room.track.VideoTrack
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import java.util.UUID

data class ConsultationListState(
    val loading: Boolean = false,
    val items: List<Consultation> = emptyList(),
    val error: String? = null
)

data class DoctorChatState(
    val loading: Boolean = false,
    val consultation: Consultation? = null,
    val messages: List<ConsultationMessage> = emptyList(),
    val connection: String = "DISCONNECTED",
    val updatingStatus: Boolean = false,
    val sendingAttachment: Boolean = false,
    val patientTyping: Boolean = false,
    val error: String? = null
)

class DoctorConsultationViewModel(
    private val repository: DoctorConsultationRepository = DoctorConsultationRepository(),
    private val realtime: DoctorConsultationRealtime = DoctorConsultationRealtime()
) : ViewModel() {
    private val _list = MutableStateFlow(ConsultationListState())
    val list = _list.asStateFlow()
    private val _chat = MutableStateFlow(DoctorChatState())
    val chat = _chat.asStateFlow()
    private var typingReset: Job? = null
    private var lastReadId: String? = null

    fun loadConsultations() = viewModelScope.launch {
        _list.value = _list.value.copy(loading = true, error = null)
        repository.list().fold(
            onSuccess = { _list.value = ConsultationListState(items = it) },
            onFailure = { _list.value = _list.value.copy(loading = false, error = it.message ?: "Không thể tải danh sách tư vấn") }
        )
    }

    fun open(id: String) {
        leave()
        _chat.value = DoctorChatState(loading = true)
        viewModelScope.launch {
            val detail = repository.detail(id)
            val messages = repository.messages(id)
            if (detail.isSuccess && messages.isSuccess) {
                _chat.value = DoctorChatState(
                    consultation = detail.getOrThrow(),
                    messages = messages.getOrThrow().items
                )
                connect(id)
                markLatestIncomingRead()
            } else {
                _chat.value = DoctorChatState(error = detail.exceptionOrNull()?.message
                    ?: messages.exceptionOrNull()?.message ?: "Không thể tải phiên tư vấn")
            }
        }
    }

    fun refresh() = _chat.value.consultation?.id?.let(::open)

    fun transition(action: String) {
        val id = _chat.value.consultation?.id ?: return
        if (_chat.value.updatingStatus) return
        _chat.value = _chat.value.copy(updatingStatus = true, error = null)
        viewModelScope.launch {
            repository.transition(id, action).fold(
                onSuccess = { updated ->
                    _chat.value = _chat.value.copy(consultation = updated, updatingStatus = false)
                    loadConsultations()
                },
                onFailure = { _chat.value = _chat.value.copy(updatingStatus = false, error = it.message ?: "Không thể cập nhật phiên") }
            )
        }
    }

    fun sendText(text: String) {
        val consultation = _chat.value.consultation ?: return
        val clean = text.trim()
        if (clean.isEmpty() || !canSend(consultation)) return
        realtime.sendTyping(false)
        val clientId = UUID.randomUUID().toString()
        val optimistic = ConsultationMessage(
            id = "local-$clientId",
            consultationId = consultation.id,
            senderUserId = currentDoctorUserId(consultation),
            senderType = "DOCTOR",
            messageType = "TEXT",
            clientMessageId = clientId,
            text = clean,
            sentAt = Instant.now().toString(),
            localDeliveryStatus = "SENDING"
        )
        _chat.value = _chat.value.copy(messages = _chat.value.messages + optimistic, error = null)
        viewModelScope.launch {
            repository.sendText(consultation.id, clean, clientId).fold(
                onSuccess = { sent -> replaceOptimistic(clientId, sent) },
                onFailure = { error ->
                    _chat.value = _chat.value.copy(
                        messages = _chat.value.messages.map { if (it.clientMessageId == clientId) it.copy(localDeliveryStatus = "FAILED") else it },
                        error = error.message ?: "Không thể gửi tin nhắn"
                    )
                }
            )
        }
    }

    fun retry(message: ConsultationMessage) {
        val text = message.text ?: return
        _chat.value = _chat.value.copy(messages = _chat.value.messages.filterNot { it.clientMessageId == message.clientMessageId })
        sendText(text)
    }

    fun sendAttachment(fileName: String, mimeType: String, bytes: ByteArray) {
        val consultation = _chat.value.consultation ?: return
        if (!canSend(consultation) || _chat.value.sendingAttachment) return
        if (bytes.isEmpty() || bytes.size > 10 * 1024 * 1024) {
            _chat.value = _chat.value.copy(error = "Tệp phải có dung lượng từ 1 byte đến 10 MB")
            return
        }
        _chat.value = _chat.value.copy(sendingAttachment = true, error = null)
        viewModelScope.launch {
            repository.sendAttachment(consultation.id, fileName, mimeType, bytes).fold(
                onSuccess = { sent -> _chat.value = _chat.value.copy(messages = _chat.value.messages + sent, sendingAttachment = false) },
                onFailure = { _chat.value = _chat.value.copy(sendingAttachment = false, error = it.message ?: "Không thể gửi tài liệu") }
            )
        }
    }

    fun setTyping(value: Boolean) = realtime.sendTyping(value)
    fun clearError() { _chat.value = _chat.value.copy(error = null) }
    fun reportError(message: String) { _chat.value = _chat.value.copy(error = message) }

    private fun connect(id: String) {
        realtime.connect(
            id,
            onConnectionChanged = { _chat.value = _chat.value.copy(connection = it) },
            onMessage = message@{ incoming ->
                if (incoming.consultationId != _chat.value.consultation?.id) return@message
                val unique = _chat.value.messages.filterNot { it.id == incoming.id || it.clientMessageId == incoming.clientMessageId }
                _chat.value = _chat.value.copy(messages = unique + incoming, error = null)
                if (incoming.senderType == "PATIENT") markLatestIncomingRead()
            },
            onStatus = status@{ updated ->
                if (updated.id != _chat.value.consultation?.id) return@status
                _chat.value = _chat.value.copy(consultation = updated, updatingStatus = false)
            },
            onReceipt = ::applyReceipt,
            onTyping = { userId, typing ->
                val consultation = _chat.value.consultation
                if (consultation != null && userId != currentDoctorUserId(consultation)) {
                    typingReset?.cancel()
                    _chat.value = _chat.value.copy(patientTyping = typing)
                    if (typing) typingReset = viewModelScope.launch {
                        delay(4_000)
                        _chat.value = _chat.value.copy(patientTyping = false)
                    }
                }
            }
        )
    }

    private fun markLatestIncomingRead() {
        val state = _chat.value
        val consultation = state.consultation ?: return
        val doctorId = currentDoctorUserId(consultation)
        val message = state.messages.lastOrNull { it.senderUserId != doctorId && it.readAt == null && !it.id.startsWith("local-") } ?: return
        if (lastReadId == message.id) return
        lastReadId = message.id
        viewModelScope.launch {
            repository.markRead(consultation.id, message.id).fold(
                onSuccess = { applyReceipt(ConsultationReadReceipt(it.updatedCount, it.readAt, it.lastReadMessageId, doctorId)) },
                onFailure = { if (lastReadId == message.id) lastReadId = null }
            )
        }
    }

    private fun applyReceipt(receipt: ConsultationReadReceipt) {
        val index = _chat.value.messages.indexOfFirst { it.id == receipt.lastReadMessageId }
        if (index < 0) return
        _chat.value = _chat.value.copy(messages = _chat.value.messages.mapIndexed { position, message ->
            if (position <= index && message.senderUserId != receipt.readerUserId) message.copy(readAt = receipt.readAt) else message
        })
    }

    private fun replaceOptimistic(clientId: String, sent: ConsultationMessage) {
        _chat.value = _chat.value.copy(messages = _chat.value.messages.map { if (it.clientMessageId == clientId) sent else it })
    }

    private fun currentDoctorUserId(consultation: Consultation): String =
        DoctorApiClient.session().userId() ?: consultation.doctor.userId.orEmpty()

    private fun canSend(consultation: Consultation): Boolean =
        consultation.status in listOf("ACCEPTED", "ACTIVE") &&
            (consultation.chatOpenAt?.let { runCatching { !Instant.now().isBefore(Instant.parse(it)) }.getOrDefault(true) } ?: true)

    fun leave() {
        typingReset?.cancel()
        realtime.sendTyping(false)
        realtime.disconnect()
        lastReadId = null
    }

    override fun onCleared() {
        leave()
        super.onCleared()
    }
}

data class DoctorVideoState(
    val connecting: Boolean = false,
    val connected: Boolean = false,
    val microphone: Boolean = false,
    val camera: Boolean = false,
    val speaker: Boolean = true,
    val localVideo: VideoTrack? = null,
    val remoteVideo: VideoTrack? = null,
    val remotePresent: Boolean = false,
    val consultation: Consultation? = null,
    val error: String? = null
)

class DoctorVideoViewModel(application: Application) : AndroidViewModel(application) {
    val room: Room = LiveKit.create(application)
    private val repository = DoctorConsultationRepository()
    private val _state = MutableStateFlow(DoctorVideoState())
    val state = _state.asStateFlow()
    private var joinJob: Job? = null

    init { viewModelScope.launch { room.events.collect { refreshTracks() } } }

    fun join(id: String) {
        if (joinJob?.isActive == true || room.state != Room.State.DISCONNECTED) return
        joinJob = viewModelScope.launch {
            _state.value = _state.value.copy(connecting = true, error = null)
            repository.detail(id).onSuccess { detail -> _state.value = _state.value.copy(consultation = detail) }
            try {
                val credentials = repository.joinVideo(id).getOrThrow()
                room.connect(credentials.serverUrl, credentials.participantToken)
                room.localParticipant.setMicrophoneEnabled(true)
                room.localParticipant.setCameraEnabled(true)
                _state.value = _state.value.copy(connecting = false, connected = true, microphone = true, camera = true)
                refreshTracks()
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (error: Exception) {
                room.disconnect()
                _state.value = _state.value.copy(connecting = false, connected = false, error = error.message ?: "Không thể tham gia phòng video")
            }
        }
    }

    fun permissionDenied() { _state.value = _state.value.copy(error = "Cần cấp quyền Camera và Micro để tư vấn video") }
    fun dismissError() { _state.value = _state.value.copy(error = null) }
    fun toggleMicrophone() = control {
        val enabled = !_state.value.microphone
        room.localParticipant.setMicrophoneEnabled(enabled)
        _state.value = _state.value.copy(microphone = enabled)
    }
    fun toggleCamera() = control {
        val enabled = !_state.value.camera
        room.localParticipant.setCameraEnabled(enabled)
        _state.value = _state.value.copy(camera = enabled)
    }
    fun switchCamera() = control { (_state.value.localVideo as? LocalVideoTrack)?.switchCamera() }
    fun toggleSpeaker() = control {
        val handler = room.audioSwitchHandler ?: return@control
        val enabled = !_state.value.speaker
        val device = handler.availableAudioDevices.firstOrNull {
            if (enabled) it is AudioDevice.Speakerphone else it is AudioDevice.Earpiece
        } ?: throw IllegalStateException("Thiết bị không hỗ trợ đầu ra âm thanh này")
        handler.selectDevice(device)
        _state.value = _state.value.copy(speaker = enabled)
    }

    private fun control(action: suspend () -> Unit) = viewModelScope.launch {
        runCatching { action(); refreshTracks() }.onFailure { _state.value = _state.value.copy(error = it.message ?: "Không thể thay đổi thiết bị") }
    }

    private fun refreshTracks() {
        _state.value = _state.value.copy(
            connected = room.state == Room.State.CONNECTED,
            localVideo = room.localParticipant.trackPublications.values.mapNotNull { it.track as? VideoTrack }.firstOrNull(),
            remoteVideo = room.remoteParticipants.values.flatMap { it.trackPublications.values }.filter { !it.muted }.mapNotNull { it.track as? VideoTrack }.firstOrNull(),
            remotePresent = room.remoteParticipants.isNotEmpty()
        )
    }

    fun leave() {
        joinJob?.cancel()
        room.disconnect()
        _state.value = DoctorVideoState()
    }

    override fun onCleared() {
        room.disconnect()
        room.release()
        super.onCleared()
    }
}
