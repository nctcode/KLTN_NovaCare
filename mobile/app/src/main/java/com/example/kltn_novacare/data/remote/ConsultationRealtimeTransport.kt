package com.example.kltn_novacare.data.remote

import com.example.kltn_novacare.data.model.Consultation
import com.example.kltn_novacare.data.model.ConsultationMessage
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

data class ConsultationTypingEvent(
    val consultationId: String = "",
    val userId: String = "",
    val isTyping: Boolean = false
)

class ConsultationRealtimeTransport {
    private val gson = Gson()
    private var socket: Socket? = null
    private var consultationId: String? = null

    fun connect(
        id: String,
        onConnectionChanged: (String) -> Unit,
        onMessage: (ConsultationMessage) -> Unit,
        onStatus: (Consultation) -> Unit,
        onReceipt: (ConsultationReadReceipt) -> Unit,
        onTyping: ((userId: String, isTyping: Boolean) -> Unit)? = null
    ) {
        disconnect()
        val token = ApiClient.getTokenManager().getAccessToken()
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
        val realtime = IO.socket("${ApiClient.getRealtimeBaseUrl()}/consultations", options)
        socket = realtime
        realtime.on(Socket.EVENT_CONNECT) {
            onConnectionChanged("CONNECTED")
            realtime.emit("consultation.join", JSONObject().put("consultationId", id))
        }
        realtime.on(Socket.EVENT_DISCONNECT) { onConnectionChanged("DISCONNECTED") }
        realtime.on(Socket.EVENT_CONNECT_ERROR) { onConnectionChanged("RECONNECTING") }
        realtime.on("consultation.message.created") { args -> parse<ConsultationMessage>(args.firstOrNull())?.let(onMessage) }
        realtime.on("consultation.status.changed") { args -> parse<Consultation>(args.firstOrNull())?.let(onStatus) }
        realtime.on("consultation.receipt.updated") { args -> parse<ConsultationReadReceipt>(args.firstOrNull())?.let(onReceipt) }
        realtime.on("consultation.typing") { args ->
            parse<ConsultationTypingEvent>(args.firstOrNull())?.let { event ->
                onTyping?.invoke(event.userId, event.isTyping)
            }
        }
        onConnectionChanged("CONNECTING")
        realtime.connect()
    }

    fun sendTyping(isTyping: Boolean) {
        val active = socket ?: return
        val currentId = consultationId ?: return
        runCatching {
            active.emit(
                "consultation.typing",
                JSONObject().put("consultationId", currentId).put("isTyping", isTyping)
            )
        }
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
