package app.operit

import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import app.operit.util.AppLogger
import java.util.concurrent.CountDownLatch
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

class RuntimeCoreLinkChannel(
    private val runtimeHost: AndroidRuntimeHost,
) {
    private companion object {
        private const val TAG = "RuntimeCoreLink"
        private val mainHandler = Handler(Looper.getMainLooper())
        private val watchPumpLock = Any()
        private val watchChannelLock = Object()

        @Volatile
        private var watchPumpRunning = false

        @Volatile
        private var runtimeChannel: MethodChannel? = null

        private var watchPumpFrameIndex = 0L
    }

    private var attachedChannel: MethodChannel? = null

    /** Attaches the Dart runtime channel and wakes pending watch delivery. */
    fun attach(channel: MethodChannel) {
        attachedChannel = channel
        synchronized(watchChannelLock) {
            runtimeChannel = channel
            watchChannelLock.notifyAll()
        }
        AppLogger.d(TAG, "runtime channel attached")
    }

    /** Clears this channel instance while preserving native watch queue ordering. */
    fun clear() {
        val channel = attachedChannel
        attachedChannel = null
        synchronized(watchChannelLock) {
            if (runtimeChannel === channel) {
                runtimeChannel = null
            }
        }
        AppLogger.d(TAG, "runtime channel cleared")
    }

    /** Handles one Dart-to-native runtime channel method call. */
    fun handle(call: MethodCall, result: MethodChannel.Result): Boolean {
        when (call.method) {
            "call" -> callRuntime(call, result, OperitRuntimeNative::call)
            "pushOpen" -> callRuntime(call, result, OperitRuntimeNative::pushOpen)
            "pushItem" -> callRuntime(call, result, OperitRuntimeNative::pushItem)
            "pushClose" -> pushClose(call, result)
            "watchSnapshot" -> callRuntime(call, result, OperitRuntimeNative::watchSnapshot)
            "watchStream" -> watchStream(call, result)
            "closeWatchStream" -> closeWatchStream(call, result)
            else -> return false
        }
        return true
    }

    /** Runs one encoded Core call on the runtime executor. */
    private fun callRuntime(
        call: MethodCall,
        result: MethodChannel.Result,
        nativeCall: (Long, ByteArray) -> ByteArray,
    ) {
        val request = call.arguments as? ByteArray
        if (request == null) {
            result.error("INVALID_ARGS", "${call.method} expects MessagePack bytes", null)
            return
        }
        runtimeHost.runRuntime(result) {
            nativeCall(runtimeHost.ensureRuntimeHandle(), request)
        }
    }

    /** Opens one Core watch stream and starts the shared event pump. */
    private fun watchStream(call: MethodCall, result: MethodChannel.Result) {
        val request = call.arguments as? ByteArray
        if (request == null) {
            result.error("INVALID_ARGS", "watchStream expects MessagePack bytes", null)
            return
        }
        AppLogger.d(
            TAG,
            "watch stream open requested bytes=${request.size}",
        )
        runtimeHost.runRuntime(result) {
            val response = OperitRuntimeNative.watchStream(
                runtimeHost.ensureRuntimeHandle(),
                request,
            )
            AppLogger.d(
                TAG,
                "watch stream native open returned bytes=${response.size}",
            )
            ensureWatchPump()
            response
        }
    }

    /** Closes one Core watch stream by subscription id. */
    private fun closeWatchStream(call: MethodCall, result: MethodChannel.Result) {
        val subscriptionId = call.arguments as? String
        if (subscriptionId == null) {
            result.error("INVALID_ARGS", "closeWatchStream expects a subscription id", null)
            return
        }
        AppLogger.d(
            TAG,
            "watch stream close requested subscription=$subscriptionId",
        )
        runtimeHost.runRuntime(result) {
            OperitRuntimeNative.closeWatchStream(runtimeHost.ensureRuntimeHandle(), subscriptionId)
        }
    }

    /** Closes one local Link push stream. */
    private fun pushClose(call: MethodCall, result: MethodChannel.Result) {
        val pushId = call.arguments as? String
        if (pushId == null) {
            result.error("INVALID_ARGS", "pushClose expects a push id", null)
            return
        }
        runtimeHost.runRuntime(result) {
            OperitRuntimeNative.pushClose(runtimeHost.ensureRuntimeHandle(), pushId)
        }
    }

    /** Starts the shared native watch pump when it is not already active. */
    private fun ensureWatchPump() {
        synchronized(watchPumpLock) {
            if (watchPumpRunning) {
                AppLogger.d(TAG, "watch pump already running")
                return
            }
            watchPumpRunning = true
        }
        AppLogger.d(TAG, "watch pump started")
        runtimeHost.runBackground {
            try {
                while (watchPumpRunning) {
                    waitForRuntimeChannel()
                    val frame = OperitRuntimeNative.nextWatchChannelEvent(
                        runtimeHost.ensureRuntimeHandle(),
                    )
                    if (frame == null) {
                        AppLogger.d(
                            TAG,
                            "watch pump stopped reason=native_channel_closed",
                        )
                        synchronized(watchPumpLock) { watchPumpRunning = false }
                        return@runBackground
                    }
                    val frameIndex = synchronized(watchPumpLock) {
                        val index = watchPumpFrameIndex
                        watchPumpFrameIndex += 1L
                        index
                    }
                    val dequeuedAt = SystemClock.elapsedRealtime()
                    val sampled = frameIndex < 20L || frameIndex % 50L == 0L
                    if (sampled) {
                        AppLogger.d(
                            TAG,
                            "watch frame dequeued index=$frameIndex bytes=${frame.size}",
                        )
                    }
                    deliverWatchFrame(frame, frameIndex, dequeuedAt, sampled)
                }
            } catch (error: Throwable) {
                AppLogger.e(
                    TAG,
                    "watch pump failed running=$watchPumpRunning",
                    error,
                )
                synchronized(watchPumpLock) {
                    watchPumpRunning = false
                }
            }
        }
    }

    /** Waits until a Dart runtime channel is attached. */
    private fun waitForRuntimeChannel(): MethodChannel {
        synchronized(watchChannelLock) {
            while (true) {
                val channel = runtimeChannel
                if (channel != null) {
                    return channel
                }
                watchChannelLock.wait()
            }
        }
    }

    /** Delivers one watch frame to the currently attached Dart runtime channel. */
    private fun deliverWatchFrame(
        frame: ByteArray,
        frameIndex: Long,
        dequeuedAt: Long,
        sampled: Boolean,
    ) {
        while (watchPumpRunning) {
            val channel = waitForRuntimeChannel()
            val delivered = AtomicBoolean(false)
            val deliveryError = AtomicReference<Throwable?>()
            val latch = CountDownLatch(1)
            mainHandler.post {
                try {
                    if (runtimeChannel !== channel) {
                        latch.countDown()
                        return@post
                    }
                    channel.invokeMethod(
                        "watchChannelEvent",
                        frame,
                        object : MethodChannel.Result {
                            /** Records successful Dart receipt of one watch frame. */
                            override fun success(result: Any?) {
                                delivered.set(true)
                                latch.countDown()
                            }

                            /** Records Dart-side delivery errors for the pump thread. */
                            override fun error(
                                errorCode: String,
                                errorMessage: String?,
                                errorDetails: Any?,
                            ) {
                                deliveryError.set(
                                    IllegalStateException(
                                        "watchChannelEvent failed: $errorCode $errorMessage",
                                    ),
                                )
                                latch.countDown()
                            }

                            /** Records a missing Dart handler for the pump thread. */
                            override fun notImplemented() {
                                deliveryError.set(
                                    IllegalStateException(
                                        "watchChannelEvent is not implemented",
                                    ),
                                )
                                latch.countDown()
                            }
                        },
                    )
                } catch (error: Throwable) {
                    deliveryError.set(error)
                    latch.countDown()
                }
            }
            latch.await()
            val error = deliveryError.get()
            if (error != null) {
                throw error
            }
            if (delivered.get()) {
                if (sampled) {
                    AppLogger.d(
                        TAG,
                        "watch frame delivered index=$frameIndex uiQueueMs=${SystemClock.elapsedRealtime() - dequeuedAt}",
                    )
                }
                return
            }
        }
    }
}
