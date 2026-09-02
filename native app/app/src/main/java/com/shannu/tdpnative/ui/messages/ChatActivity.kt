package com.shannu.tdpnative.ui.messages

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.shannu.tdpnative.TdpApplication
import com.shannu.tdpnative.call.CallActivity
import com.shannu.tdpnative.databinding.ActivityChatBinding
import com.shannu.tdpnative.network.dto.MessageDto
import com.shannu.tdpnative.realtime.SocketManager
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * One-to-one chat + call launcher for a single conversation. Text messages
 * use the same `private:send` / `private:new` Socket.IO events as
 * src/components/party/MessagesPage.tsx, so messages sent from the website
 * appear here live, and vice versa. Call buttons start [CallActivity].
 */
class ChatActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChatBinding
    private val messages = mutableListOf<MessageDto>()
    private lateinit var adapter: ChatAdapter

    private lateinit var otherUserId: String
    private var otherUserName: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        otherUserId = intent.getStringExtra(EXTRA_USER_ID) ?: run { finish(); return }
        otherUserName = intent.getStringExtra(EXTRA_USER_NAME) ?: ""
        binding.toolbar.title = otherUserName
        setSupportActionBar(binding.toolbar)
        binding.toolbar.setNavigationOnClickListener { finish() }

        val myId = TdpApplication.instance.sessionManager.currentUserId()
        adapter = ChatAdapter(messages) { myId }
        binding.recyclerMessages.layoutManager = LinearLayoutManager(this).apply { stackFromEnd = true }
        binding.recyclerMessages.adapter = adapter

        binding.buttonSend.setOnClickListener { sendMessage() }
        binding.buttonAudioCall.setOnClickListener { startCall(video = false) }
        binding.buttonVideoCall.setOnClickListener { startCall(video = true) }

        loadHistory()
        listenForIncoming()
    }

    private fun loadHistory() {
        lifecycleScope.launch {
            MessagesRepository.history(otherUserId).onSuccess { list ->
                messages.clear()
                messages.addAll(list)
                adapter.notifyDataSetChanged()
                scrollToBottom()
            }
        }
    }

    private fun listenForIncoming() {
        val socket = SocketManager.connect() ?: return
        socket.emit("private:join", JSONObject().put("otherUserId", otherUserId))
        socket.on("private:new") { args ->
            val obj = args.firstOrNull() as? org.json.JSONObject ?: return@on
            val msg = com.google.gson.Gson().fromJson(obj.toString(), MessageDto::class.java)
            val fromId = msg.fromUserId()
            val myId = TdpApplication.instance.sessionManager.currentUserId()
            val relevant = (fromId == otherUserId && msg.to == myId) || (fromId == myId && msg.to == otherUserId)
            if (!relevant) return@on
            runOnUiThread {
                messages.add(msg)
                adapter.notifyItemInserted(messages.size - 1)
                scrollToBottom()
            }
        }
    }

    private fun sendMessage() {
        val text = binding.inputMessage.text?.toString()?.trim().orEmpty()
        if (text.isEmpty()) return
        val socket = SocketManager.connect() ?: return
        val payload = JSONObject().apply {
            put("toUserId", otherUserId)
            put("text", text)
        }
        socket.emit("private:send", payload) { _ -> }
        binding.inputMessage.setText("")
    }

    private fun startCall(video: Boolean) {
        val intent = Intent(this, CallActivity::class.java).apply {
            putExtra(CallActivity.EXTRA_PEER_ID, otherUserId)
            putExtra(CallActivity.EXTRA_PEER_NAME, otherUserName)
            putExtra(CallActivity.EXTRA_IS_VIDEO, video)
            putExtra(CallActivity.EXTRA_IS_OUTGOING, true)
        }
        startActivity(intent)
    }

    private fun scrollToBottom() {
        if (messages.isNotEmpty()) {
            binding.recyclerMessages.scrollToPosition(messages.size - 1)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        SocketManager.current()?.off("private:new")
    }

    companion object {
        const val EXTRA_USER_ID = "extra_user_id"
        const val EXTRA_USER_NAME = "extra_user_name"
    }
}
