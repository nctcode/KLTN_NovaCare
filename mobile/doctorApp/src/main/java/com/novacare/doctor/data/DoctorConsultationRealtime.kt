package com.novacare.doctor.data

import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

data class ConsultationReadReceipt(
    val updatedCount: Int = 0,
    val readAt: String,
    val lastReadMessageId: String,
    val readerUserId: String
)

private data class ConsultationTypingEvent(
    val consultationId: String = "",
    val userId: String = "",
    val isTyping: Boolean = false
)

class DoctorConsultationRealtime {
    private val gson = Gson()
    private var socket: Socket? = null
    private var consultationId: String? = null

    fun connect(
        id: String,
        onConnectionChanged: (String) -> Unit,
        onMessage: (ConsultationMessage) -> Unit,
        onStatus: (Consultation) -> Unit,
        onReceipt: (ConsultationReadReceipt) -> Unit,
        onTyping: (String, Boolean) -> Unit
    ) {
        disconnect()
        val token = DoctorApiClient.session().accessToken()
        if (token.isNullOrBlank()) {
            onConnectionChanged("DISCONNECTED")
            return
        }
        consultationId = id
        val options = IO.Options().apply {
            auth = mapOf("token" to token)
            reconnection = true
            reconnectionAttempts = Int.MAX_VALUE
            reconnectionDelay = 1_000
            timeout = 10_000
        }
        val active = IO.socket("${DoctorApiClient.serverBaseUrl()}/consultations", options)
        socket = active
        active.on(Socket.EVENT_CONNECT) {
            onConnectionChanged("CONNECTED")
            active.emit("consultation.join", JSONObject().put("consultationId", id))
        }
        active.on(Socket.EVENT_DISCONNECT) { onConnectionChanged("DISCONNECTED") }
        active.on(Socket.EVENT_CONNECT_ERROR) { onConnectionChanged("RECONNECTING") }
        active.on("consultation.message.created") { args -> parse<ConsultationMessage>(args.firstOrNull())?.let(onMessage) }
        active.on("consultation.status.changed") { args -> parse<Consultation>(args.firstOrNull())?.let(onStatus) }
        active.on("consultation.receipt.updated") { args -> parse<ConsultationReadReceipt>(args.firstOrNull())?.let(onReceipt) }
        active.on("consultation.typing") { args ->
            parse<ConsultationTypingEvent>(args.firstOrNull())?.let { onTyping(it.userId, it.isTyping) }
        }
        onConnectionChanged("CONNECTING")
        active.connect()
    }

    fun sendTyping(isTyping: Boolean) {
        val active = socket ?: return
        val id = consultationId ?: return
        active.emit("consultation.typing", JSONObject().put("consultationId", id).put("isTyping", isTyping))
    }

    fun disconnect() {
        socket?.let { active ->
            consultationId?.let { active.emit("consultation.leave", JSONObject().put("consultationId", it)) }
            active.off()
            active.disconnect()
            active.close()
        }
        socket = null
        consultationId = null
    }

    private inline fun <reified T> parse(value: Any?): T? = runCatching {
        gson.fromJson((value as? JSONObject)?.toString() ?: return null, T::class.java)
    }.getOrNull()
}
