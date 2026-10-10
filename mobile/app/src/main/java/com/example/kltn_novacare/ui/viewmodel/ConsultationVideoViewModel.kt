package com.example.kltn_novacare.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.kltn_novacare.data.model.Consultation
import com.example.kltn_novacare.data.repository.ConsultationRepository
import com.twilio.audioswitch.AudioDevice
import io.livekit.android.LiveKit
import io.livekit.android.events.collect
import io.livekit.android.room.Room
import io.livekit.android.room.track.LocalVideoTrack
import io.livekit.android.room.track.VideoTrack
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class VideoCallState(
    val connecting: Boolean = false,
    val connected: Boolean = false,
    val reconnecting: Boolean = false,
    val microphone: Boolean = false,
    val camera: Boolean = false,
    val localVideo: VideoTrack? = null,
    val remoteVideo: VideoTrack? = null,
    val remotePresent: Boolean = false,
    val speaker: Boolean = true,
    val error: String? = null,
    val consultation: Consultation? = null,
    val connectedAt: Long? = null,
    val availableAudioDevices: List<AudioDevice> = emptyList(),
    val selectedAudioDevice: AudioDevice? = null
)

class ConsultationVideoViewModel(application: Application) : AndroidViewModel(application) {
    val room = LiveKit.create(application)
    private val repository = ConsultationRepository()
    private val mutable = MutableStateFlow(VideoCallState())
    val state = mutable.asStateFlow()
    private var joining: Job? = null

    init {
        viewModelScope.launch {
            room.events.collect { refresh() }
        }
    }

    private fun refresh() {
        val isConnected = room.state == Room.State.CONNECTED
        val currentConnectedAt = mutable.value.connectedAt ?: if (isConnected) System.currentTimeMillis() else null
        val audioHandler = room.audioSwitchHandler
        val selectedDevice = audioHandler?.selectedAudioDevice
        val availableDevices = audioHandler?.availableAudioDevices.orEmpty()
        val isSpeaker = if (selectedDevice != null) selectedDevice is AudioDevice.Speakerphone else mutable.value.speaker

        mutable.update { it.copy(
            connected = isConnected,
            reconnecting = room.state == Room.State.RECONNECTING,
            localVideo = room.localParticipant.trackPublications.values.mapNotNull { p -> p.track as? VideoTrack }.firstOrNull(),
            remoteVideo = room.remoteParticipants.values.flatMap { p -> p.trackPublications.values }
                .filter { !it.muted }.mapNotNull { p -> p.track as? VideoTrack }.firstOrNull(),
            remotePresent = room.remoteParticipants.isNotEmpty(),
            connectedAt = if (isConnected) currentConnectedAt else null,
            availableAudioDevices = availableDevices,
            selectedAudioDevice = selectedDevice,
            speaker = isSpeaker
        ) }
    }

    fun loadConsultation(id: String) {
        viewModelScope.launch {
            repository.detail(id).onSuccess { c ->
                mutable.update { it.copy(consultation = c) }
            }
        }
    }

    fun join(id: String) {
        if (joining?.isActive == true || room.state != Room.State.DISCONNECTED) return
        loadConsultation(id)
        joining = viewModelScope.launch {
            mutable.update { it.copy(connecting = true, error = null) }
            try {
                val credentials = repository.joinVideo(id).getOrThrow()
                room.connect(credentials.serverUrl, credentials.participantToken)
                room.localParticipant.setMicrophoneEnabled(true)
                room.localParticipant.setCameraEnabled(true)
                mutable.update { it.copy(connecting = false, microphone = true, camera = true) }
                refresh()
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (error: Exception) {
                room.disconnect()
                mutable.update { it.copy(
                    connecting = false,
                    connected = false,
                    error = if (error is IllegalStateException) error.message
                    else "Không thể kết nối camera, micro hoặc dịch vụ video. Kiểm tra quyền và mạng rồi thử lại."
                ) }
            }
        }
    }

    fun permissionDenied() {
        mutable.update { it.copy(error = "Cần quyền camera và micro để gọi video. Bạn có thể cấp quyền trong Cài đặt ứng dụng.") }
    }

    fun dismissError() {
        mutable.update { it.copy(error = null) }
    }

    fun microphone() = control {
        val enabled = !mutable.value.microphone
        room.localParticipant.setMicrophoneEnabled(enabled)
        mutable.update { it.copy(microphone = enabled) }
    }

    fun camera() = control {
        val enabled = !mutable.value.camera
        room.localParticipant.setCameraEnabled(enabled)
        mutable.update { it.copy(camera = enabled) }
    }

    fun switchCamera() = control {
        (mutable.value.localVideo as? LocalVideoTrack)?.switchCamera()
    }

    fun speaker() = control {
        val handler = room.audioSwitchHandler ?: return@control
        val enabled = !mutable.value.speaker
        val device = handler.availableAudioDevices.firstOrNull {
            if (enabled) it is AudioDevice.Speakerphone else it is AudioDevice.Earpiece
        }
        if (device == null) {
            mutable.update { it.copy(error = "Thiết bị không có đầu ra âm thanh này.") }
        } else {
            handler.selectDevice(device)
            mutable.update { it.copy(speaker = enabled, selectedAudioDevice = device) }
        }
    }

    fun selectAudioDevice(device: AudioDevice) = control {
        val handler = room.audioSwitchHandler ?: return@control
        handler.selectDevice(device)
        mutable.update { it.copy(
            selectedAudioDevice = device,
            speaker = device is AudioDevice.Speakerphone
        ) }
    }

    private fun control(action: suspend () -> Unit) {
        viewModelScope.launch {
            try {
                action()
                refresh()
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                mutable.update { it.copy(error = "Không thể thay đổi thiết bị. Vui lòng thử lại.") }
            }
        }
    }

    fun leave() {
        joining?.cancel()
        room.disconnect()
        mutable.value = VideoCallState()
    }

    override fun onCleared() {
        room.disconnect()
        room.release()
        super.onCleared()
    }
}
