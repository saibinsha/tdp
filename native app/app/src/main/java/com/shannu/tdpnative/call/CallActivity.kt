package com.shannu.tdpnative.call

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.Manifest
import android.content.pm.PackageManager
import com.shannu.tdpnative.BuildConfig
import com.shannu.tdpnative.databinding.ActivityCallBinding
import com.shannu.tdpnative.realtime.SocketManager
import org.json.JSONObject
import org.webrtc.AudioSource
import org.webrtc.AudioTrack
import org.webrtc.Camera2Enumerator
import org.webrtc.CameraVideoCapturer
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoCapturer
import org.webrtc.VideoSource
import org.webrtc.VideoTrack
import java.util.UUID

/**
 * Native audio/video calling, using the exact same Socket.IO signaling
 * protocol as src/components/party/MessagesPage.tsx and
 * server/sockets/chat.js (call:invite / call:incoming / call:accept /
 * call:accepted / call:offer / call:answer / call:ice / call:hangup), so a
 * call can be placed or received between the website, the WebView wrapper
 * app and this native app interchangeably.
 *
 * Uses the same TURN servers (BuildConfig.TURN_*, from VITE_TURN_* on the
 * website) so mobile connections behind carrier NATs can still relay media
 * instead of getting stuck on "Connecting...".
 */
class CallActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCallBinding
    private lateinit var eglBase: EglBase
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var videoCapturer: VideoCapturer? = null
    private var localVideoTrack: VideoTrack? = null
    private var localAudioTrack: AudioTrack? = null

    private var callId: String = ""
    private var peerId: String = ""
    private var peerName: String = ""
    private var isVideo: Boolean = false
    private var isOutgoing: Boolean = false
    private val pendingRemoteIce = mutableListOf<IceCandidate>()

    private var status = "calling"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCallBinding.inflate(layoutInflater)
        setContentView(binding.root)

        peerId = intent.getStringExtra(EXTRA_PEER_ID).orEmpty()
        peerName = intent.getStringExtra(EXTRA_PEER_NAME).orEmpty()
        isVideo = intent.getBooleanExtra(EXTRA_IS_VIDEO, false)
        isOutgoing = intent.getBooleanExtra(EXTRA_IS_OUTGOING, true)
        callId = intent.getStringExtra(EXTRA_CALL_ID) ?: UUID.randomUUID().toString()

        binding.textPeerName.text = peerName
        binding.buttonEnd.setOnClickListener { hangUp() }
        binding.buttonAccept.setOnClickListener { accept() }
        binding.buttonDecline.setOnClickListener { decline() }
        binding.buttonAccept.visibility = if (isOutgoing) android.view.View.GONE else android.view.View.VISIBLE
        binding.buttonDecline.visibility = if (isOutgoing) android.view.View.GONE else android.view.View.VISIBLE

        if (!ensurePermissions()) return

        eglBase = EglBase.create()
        binding.localView.init(eglBase.eglBaseContext, null)
        binding.remoteView.init(eglBase.eglBaseContext, null)
        binding.remoteView.setMirror(false)
        binding.localView.setMirror(true)

        setAudioMode()
        registerSignaling()
        setStatus(if (isOutgoing) "calling" else "ringing")

        if (isOutgoing) {
            inviteCallee()
        }
    }

    private fun ensurePermissions(): Boolean {
        val needed = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (isVideo) needed.add(Manifest.permission.CAMERA)
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 2001)
            return false
        }
        return true
    }

    private fun setAudioMode() {
        val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
        audioManager.isSpeakerphoneOn = isVideo
    }

    // ---- Signaling (Socket.IO) ----

    private fun registerSignaling() {
        val socket = SocketManager.connect() ?: return

        socket.on("call:accepted") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            if (obj.optString("callId") != callId) return@on
            runOnUiThread {
                setStatus("connecting")
                setAudioMode()
                createPeerConnectionAndOffer()
            }
        }

        socket.on("call:rejected") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            if (obj.optString("callId") != callId) return@on
            runOnUiThread { finishCall() }
        }

        socket.on("call:offer") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            if (obj.optString("callId") != callId) return@on
            val sdp = obj.optJSONObject("sdp") ?: return@on
            runOnUiThread {
                setStatus("connecting")
                handleRemoteOffer(sdp.optString("sdp"))
            }
        }

        socket.on("call:answer") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            if (obj.optString("callId") != callId) return@on
            val sdp = obj.optJSONObject("sdp") ?: return@on
            runOnUiThread { handleRemoteAnswer(sdp.optString("sdp")) }
        }

        socket.on("call:ice") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            if (obj.optString("callId") != callId) return@on
            val candidate = obj.optJSONObject("candidate") ?: return@on
            runOnUiThread { handleRemoteIce(candidate) }
        }

        socket.on("call:hangup") { args ->
            val obj = args.firstOrNull() as? JSONObject ?: return@on
            if (obj.optString("callId") != callId) return@on
            runOnUiThread { finishCall() }
        }
    }

    private fun inviteCallee() {
        val socket = SocketManager.connect() ?: return
        val payload = JSONObject().apply {
            put("toUserId", peerId)
            put("callId", callId)
            put("kind", if (isVideo) "video" else "audio")
        }
        socket.emit("call:invite", payload)
    }

    private fun accept() {
        binding.buttonAccept.visibility = android.view.View.GONE
        binding.buttonDecline.visibility = android.view.View.GONE
        setStatus("connecting")
        createPeerConnectionIfNeeded()
        val socket = SocketManager.connect() ?: return
        socket.emit("call:accept", JSONObject().put("callId", callId).put("toUserId", peerId))
    }

    private fun decline() {
        val socket = SocketManager.connect()
        socket?.emit("call:reject", JSONObject().put("callId", callId).put("toUserId", peerId))
        finishCall()
    }

    private fun hangUp() {
        val socket = SocketManager.connect()
        socket?.emit("call:hangup", JSONObject().put("callId", callId).put("toUserId", peerId))
        finishCall()
    }

    // ---- WebRTC ----

    private fun iceServers(): List<PeerConnection.IceServer> {
        val servers = mutableListOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer()
        )
        val turnUrls = BuildConfig.TURN_URLS.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        if (turnUrls.isNotEmpty() && BuildConfig.TURN_USERNAME.isNotEmpty()) {
            servers.add(
                PeerConnection.IceServer.builder(turnUrls)
                    .setUsername(BuildConfig.TURN_USERNAME)
                    .setPassword(BuildConfig.TURN_CREDENTIAL)
                    .createIceServer()
            )
        }
        return servers
    }

    private fun createPeerConnectionIfNeeded() {
        if (peerConnection != null) return

        val options = PeerConnectionFactory.InitializationOptions.builder(applicationContext)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(options)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(DefaultVideoEncoderFactory(eglBase.eglBaseContext, true, true))
            .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase.eglBaseContext))
            .createPeerConnectionFactory()

        val rtcConfig = PeerConnection.RTCConfiguration(iceServers()).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
        }

        peerConnection = peerConnectionFactory?.createPeerConnection(rtcConfig, object : PeerConnection.Observer {
            override fun onIceCandidate(candidate: IceCandidate) {
                val socket = SocketManager.connect() ?: return
                val json = JSONObject().apply {
                    put("callId", callId)
                    put("toUserId", peerId)
                    put("candidate", JSONObject().apply {
                        put("candidate", candidate.sdp)
                        put("sdpMid", candidate.sdpMid)
                        put("sdpMLineIndex", candidate.sdpMLineIndex)
                    })
                }
                socket.emit("call:ice", json)
            }

            override fun onAddStream(stream: MediaStream) {
                runOnUiThread {
                    stream.videoTracks.firstOrNull()?.addSink(binding.remoteView)
                }
            }

            override fun onConnectionChange(newState: PeerConnection.PeerConnectionState?) {
                runOnUiThread {
                    when (newState) {
                        PeerConnection.PeerConnectionState.CONNECTED -> setStatus("connected")
                        PeerConnection.PeerConnectionState.FAILED,
                        PeerConnection.PeerConnectionState.CLOSED,
                        PeerConnection.PeerConnectionState.DISCONNECTED -> finishCall()
                        else -> Unit
                    }
                }
            }

            override fun onIceConnectionChange(newState: PeerConnection.IceConnectionState?) {}
            override fun onIceConnectionReceivingChange(receiving: Boolean) {}
            override fun onIceGatheringChange(newState: PeerConnection.IceGatheringState?) {}
            override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
            override fun onSignalingChange(newState: PeerConnection.SignalingState?) {}
            override fun onAddTrack(receiver: org.webrtc.RtpReceiver?, streams: Array<out MediaStream>?) {}
            override fun onRemoveStream(stream: MediaStream?) {}
            override fun onDataChannel(channel: org.webrtc.DataChannel?) {}
            override fun onRenegotiationNeeded() {}
        })

        attachLocalMedia()
    }

    private fun attachLocalMedia() {
        val factory = peerConnectionFactory ?: return
        val audioSource: AudioSource = factory.createAudioSource(MediaConstraints())
        localAudioTrack = factory.createAudioTrack("tdp-audio", audioSource)
        peerConnection?.addTrack(localAudioTrack)

        if (isVideo) {
            val capturer = createCameraCapturer() ?: return
            videoCapturer = capturer
            val surfaceHelper = SurfaceTextureHelper.create("CaptureThread", eglBase.eglBaseContext)
            val videoSource: VideoSource = factory.createVideoSource(false)
            capturer.initialize(surfaceHelper, this, videoSource.capturerObserver)
            capturer.startCapture(1280, 720, 30)
            localVideoTrack = factory.createVideoTrack("tdp-video", videoSource)
            localVideoTrack?.addSink(binding.localView)
            peerConnection?.addTrack(localVideoTrack)
            binding.localView.visibility = android.view.View.VISIBLE
        } else {
            binding.localView.visibility = android.view.View.GONE
        }
    }

    private fun createCameraCapturer(): VideoCapturer? {
        val enumerator = Camera2Enumerator(this)
        val deviceNames = enumerator.deviceNames
        val front = deviceNames.firstOrNull { enumerator.isFrontFacing(it) }
        val chosen = front ?: deviceNames.firstOrNull()
        return chosen?.let { enumerator.createCapturer(it, null) }
    }

    private fun createPeerConnectionAndOffer() {
        createPeerConnectionIfNeeded()
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", if (isVideo) "true" else "false"))
        }
        peerConnection?.createOffer(object : SdpObserverAdapter() {
            override fun onCreateSuccess(desc: SessionDescription) {
                peerConnection?.setLocalDescription(SdpObserverAdapter(), desc)
                val socket = SocketManager.connect() ?: return
                val json = JSONObject().apply {
                    put("callId", callId)
                    put("toUserId", peerId)
                    put("sdp", JSONObject().apply {
                        put("type", desc.type.canonicalForm())
                        put("sdp", desc.description)
                    })
                }
                socket.emit("call:offer", json)
            }
        }, constraints)
    }

    private fun handleRemoteOffer(remoteSdp: String) {
        createPeerConnectionIfNeeded()
        peerConnection?.setRemoteDescription(SdpObserverAdapter(), SessionDescription(SessionDescription.Type.OFFER, remoteSdp))
        drainPendingIce()

        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", if (isVideo) "true" else "false"))
        }
        peerConnection?.createAnswer(object : SdpObserverAdapter() {
            override fun onCreateSuccess(desc: SessionDescription) {
                peerConnection?.setLocalDescription(SdpObserverAdapter(), desc)
                val socket = SocketManager.connect() ?: return
                val json = JSONObject().apply {
                    put("callId", callId)
                    put("toUserId", peerId)
                    put("sdp", JSONObject().apply {
                        put("type", desc.type.canonicalForm())
                        put("sdp", desc.description)
                    })
                }
                socket.emit("call:answer", json)
            }
        }, constraints)
    }

    private fun handleRemoteAnswer(remoteSdp: String) {
        peerConnection?.setRemoteDescription(SdpObserverAdapter(), SessionDescription(SessionDescription.Type.ANSWER, remoteSdp))
        drainPendingIce()
    }

    private fun handleRemoteIce(candidateJson: JSONObject) {
        val candidate = IceCandidate(
            candidateJson.optString("sdpMid"),
            candidateJson.optInt("sdpMLineIndex"),
            candidateJson.optString("candidate")
        )
        if (peerConnection?.remoteDescription == null) {
            pendingRemoteIce.add(candidate)
        } else {
            peerConnection?.addIceCandidate(candidate)
        }
    }

    private fun drainPendingIce() {
        val queued = pendingRemoteIce.toList()
        pendingRemoteIce.clear()
        queued.forEach { peerConnection?.addIceCandidate(it) }
    }

    private fun setStatus(newStatus: String) {
        status = newStatus
        binding.textStatus.text = when (newStatus) {
            "calling" -> "Calling…"
            "ringing" -> "Ringing…"
            "connecting" -> "Connecting…"
            "connected" -> "Connected"
            else -> ""
        }
    }

    private fun finishCall() {
        val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager.mode = AudioManager.MODE_NORMAL
        audioManager.isSpeakerphoneOn = false

        try { videoCapturer?.stopCapture() } catch (e: Exception) { Log.w(TAG, "stopCapture failed", e) }
        videoCapturer?.dispose()
        peerConnection?.close()
        peerConnection = null
        peerConnectionFactory?.dispose()
        peerConnectionFactory = null

        listOf("call:accepted", "call:rejected", "call:offer", "call:answer", "call:ice", "call:hangup")
            .forEach { SocketManager.current()?.off(it) }

        if (!isFinishing) finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        finishCall()
        binding.localView.release()
        binding.remoteView.release()
    }

    companion object {
        private const val TAG = "CallActivity"
        const val EXTRA_PEER_ID = "extra_peer_id"
        const val EXTRA_PEER_NAME = "extra_peer_name"
        const val EXTRA_CALL_ID = "extra_call_id"
        const val EXTRA_IS_VIDEO = "extra_is_video"
        const val EXTRA_IS_OUTGOING = "extra_is_outgoing"
    }
}

private open class SdpObserverAdapter : SdpObserver {
    override fun onCreateSuccess(desc: SessionDescription) {}
    override fun onSetSuccess() {}
    override fun onCreateFailure(error: String?) {}
    override fun onSetFailure(error: String?) {}
}
