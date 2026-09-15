package operit.plugin.sdk

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.msgpack.MessagePackFactory
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.DataInputStream
import java.io.DataOutputStream
import java.net.Socket
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** One Core watch event returned through Plugin SDK IPC. */
data class OperitPluginSdkEvent(
    val requestId: String?,
    val targetObjectId: Int,
    val propertyName: String,
    val kind: String,
    val value: Any?,
)

/** One caller-owned Core push stream. */
interface OperitPluginSdkPushSink {
    /** Sends one ordered Link value to Core. */
    suspend fun add(value: Any?)
    /** Closes the Core push stream. */
    suspend fun close()
}

/** Concrete JVM Plugin SDK client using the standard framed Link IPC carrier. */
class OperitPluginSdkClient private constructor(private val socket: Socket) {
    private val mapper = ObjectMapper(MessagePackFactory())
    private val input = DataInputStream(socket.getInputStream())
    private val output = DataOutputStream(socket.getOutputStream())
    private val nextId = AtomicLong(1)
    private val pending = ConcurrentHashMap<String, (Any?) -> Unit>()
    private val watches = ConcurrentHashMap<String, Channel<OperitPluginSdkEvent>>()

    init {
        Thread(::readLoop, "operit-plugin-sdk-ipc").apply { isDaemon = true }.start()
    }

    /** Calls one generated Core method. */
    suspend fun call(targetObjectId: Int, methodName: String, args: Any?): Any? {
        val id = requestId()
        return request(id, mapOf("type" to "Call", "body" to mapOf("requestId" to id, "targetObjectId" to targetObjectId, "methodName" to methodName, "args" to (args ?: emptyMap<String, Any?>()))))
    }

    /** Calls one route and decodes its MessagePack value. */
    suspend fun <T> callTyped(targetObjectId: Int, methodName: String, args: Any?, decode: (Any?) -> T): T = decode(call(targetObjectId, methodName, args))

    /** Watches one generated Core property. */
    fun watch(targetObjectId: Int, propertyName: String, args: Any?): Flow<OperitPluginSdkEvent> = flow {
        val id = requestId()
        val channel = Channel<OperitPluginSdkEvent>(Channel.BUFFERED)
        watches[id] = channel
        send(mapOf("type" to "WatchOpen", "body" to mapOf("subscriptionId" to id, "request" to mapOf("requestId" to id, "targetObjectId" to targetObjectId, "propertyName" to propertyName, "args" to (args ?: emptyMap<String, Any?>())))))
        try {
            for (event in channel) emit(event)
        } finally {
            watches.remove(id)
            send(mapOf("type" to "WatchClose", "body" to mapOf("subscriptionId" to id, "error" to null)))
        }
    }

    /** Watches one route and decodes each MessagePack event value. */
    fun <T> watchTyped(targetObjectId: Int, propertyName: String, args: Any?, decode: (Any?) -> T): Flow<T> = flow {
        watch(targetObjectId, propertyName, args).collect { emit(decode(it.value)) }
    }

    /** Opens one generated caller-owned Core input stream. */
    suspend fun push(targetObjectId: Int, methodName: String, args: Any?): OperitPluginSdkPushSink {
        val id = requestId()
        request(id, mapOf("type" to "PushOpen", "body" to mapOf("requestId" to id, "targetObjectId" to targetObjectId, "methodName" to methodName, "args" to (args ?: emptyMap<String, Any?>()))))
        return object : OperitPluginSdkPushSink {
            private var sequence = 0L
            override suspend fun add(value: Any?) { request("$id:$sequence", mapOf("type" to "PushItem", "body" to mapOf("pushId" to id, "sequence" to sequence++, "args" to value))) }
            override suspend fun close() { request(id, mapOf("type" to "PushClose", "body" to mapOf("pushId" to id))) }
        }
    }

    /** Connects to the standard TCP loopback endpoint. */
    companion object {
        fun connect(host: String = "127.0.0.1", port: Int = 18732): OperitPluginSdkClient = OperitPluginSdkClient(Socket(host, port))
    }

    /** Allocates one session-local request id. */
    private fun requestId(): String = "plugin-sdk-${nextId.getAndIncrement()}"

    /** Registers one request and sends its MessagePack envelope. */
    private suspend fun request(id: String, message: Any?): Any? = suspendCancellableCoroutine { continuation ->
        pending[id] = { value -> continuation.resume(value) }
        send(message)
    }

    /** Writes one big-endian length-prefixed MessagePack frame. */
    private fun send(message: Any?) {
        val bytes = mapper.writeValueAsBytes(message)
        synchronized(output) { output.writeInt(bytes.size); output.write(bytes); output.flush() }
    }

    /** Reads and dispatches framed MessagePack messages. */
    private fun readLoop() {
        while (!socket.isClosed) {
            val length = input.readInt()
            val bytes = ByteArray(length)
            input.readFully(bytes)
            dispatch(mapper.readValue(bytes, Map::class.java))
        }
    }

    /** Routes one decoded protocol envelope. */
    @Suppress("UNCHECKED_CAST")
    private fun dispatch(message: Map<*, *>) {
        val type = message["type"]
        val body = message["body"] as Map<*, *>
        when (type) {
            "CallResponse" -> complete(body["requestId"].toString(), body["result"])
            "PushOpened", "PushClosed" -> complete(body["pushId"].toString(), body["result"])
            "PushItemResult" -> complete("${body["pushId"]}:${body["sequence"]}", body["result"])
            "WatchEvent" -> {
                val event = body["event"] as Map<*, *>
                watches[body["subscriptionId"].toString()]?.trySend(OperitPluginSdkEvent(event["requestId"] as String?, (event["targetObjectId"] as Number).toInt(), event["propertyName"].toString(), event["kind"].toString(), event["value"]))
            }
            "WatchClose" -> watches.remove(body["subscriptionId"].toString())?.close()
        }
    }

    /** Completes one pending request with its Result payload. */
    private fun complete(id: String, result: Any?) { pending.remove(id)?.invoke(result) }
}
