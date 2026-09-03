package com.shannu.tdpnative

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.google.firebase.messaging.FirebaseMessaging
import com.shannu.tdpnative.call.CallActivity
import com.shannu.tdpnative.databinding.ActivityMainBinding
import com.shannu.tdpnative.network.ApiClient
import com.shannu.tdpnative.network.dto.SaveFcmTokenRequest
import com.shannu.tdpnative.ui.home.HomeFragment
import com.shannu.tdpnative.ui.leaders.LeadersFragment
import com.shannu.tdpnative.ui.messages.MessagesFragment
import com.shannu.tdpnative.ui.profile.ProfileFragment
import kotlinx.coroutines.launch
import androidx.lifecycle.lifecycleScope

/**
 * Native shell of the app: bottom navigation across the same sections shown
 * on the website (Home/party works, Leaders, Messages incl. calls, Profile),
 * so it "feels" like the real app rather than a browser wrapper.
 */
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        requestRuntimePermissions()
        registerFcmToken()
        registerIncomingCallListener()

        binding.bottomNavigation.setOnItemSelectedListener { item ->
            val fragment: Fragment = when (item.itemId) {
                R.id.nav_home -> HomeFragment()
                R.id.nav_leaders -> LeadersFragment()
                R.id.nav_messages -> MessagesFragment()
                R.id.nav_profile -> ProfileFragment()
                else -> HomeFragment()
            }
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragmentContainer, fragment)
                .commit()
            true
        }

        if (savedInstanceState == null) {
            binding.bottomNavigation.selectedItemId = R.id.nav_home
        }

        handlePushIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handlePushIntent(intent)
    }

    /**
     * Opens the incoming-call screen directly when the activity is launched
     * from a notification tap while the app was closed/backgrounded - the
     * native equivalent of `window.handlePushOpen` in src/contexts/AppContext.tsx.
     */
    private fun handlePushIntent(intent: Intent?) {
        val type = intent?.getStringExtra("type") ?: return
        if (type == "call") {
            val fromUserId = intent.getStringExtra("fromUserId") ?: return
            val callId = intent.getStringExtra("callId")
            val kind = intent.getStringExtra("kind") ?: "audio"
            startActivity(
                Intent(this, CallActivity::class.java).apply {
                    putExtra(CallActivity.EXTRA_PEER_ID, fromUserId)
                    putExtra(CallActivity.EXTRA_CALL_ID, callId)
                    putExtra(CallActivity.EXTRA_IS_VIDEO, kind == "video")
                    putExtra(CallActivity.EXTRA_IS_OUTGOING, false)
                }
            )
        }
    }

    /**
     * Listens for `call:incoming` while the socket is connected (app in the
     * foreground/background but not killed) and opens [CallActivity]
     * immediately, the same way src/components/party/MessagesPage.tsx shows
     * the incoming-call sheet on the website.
     */
    private fun registerIncomingCallListener() {
        val socket = com.shannu.tdpnative.realtime.SocketManager.connect() ?: return
        socket.off("call:incoming")
        socket.on("call:incoming") { args ->
            val obj = args.firstOrNull() as? org.json.JSONObject ?: return@on
            val fromObj = obj.optJSONObject("from")
            val fromId = fromObj?.optString("_id") ?: return@on
            val fromName = fromObj.optString("name", "Member")
            val kind = obj.optString("kind", "audio")
            val callId = obj.optString("callId")
            runOnUiThread {
                startActivity(
                    Intent(this, CallActivity::class.java).apply {
                        putExtra(CallActivity.EXTRA_PEER_ID, fromId)
                        putExtra(CallActivity.EXTRA_PEER_NAME, fromName)
                        putExtra(CallActivity.EXTRA_CALL_ID, callId)
                        putExtra(CallActivity.EXTRA_IS_VIDEO, kind == "video")
                        putExtra(CallActivity.EXTRA_IS_OUTGOING, false)
                    }
                )
            }
        }
    }

    private fun registerFcmToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) return@addOnCompleteListener
            val token = task.result ?: return@addOnCompleteListener
            TdpApplication.instance.sessionManager.fcmToken = token
            lifecycleScope.launch {
                try {
                    ApiClient.service.saveFcmToken(SaveFcmTokenRequest(token))
                } catch (e: Exception) {
                    // Best effort - will retry next launch / onNewToken.
                }
            }
        }
    }

    private fun requestRuntimePermissions() {
        val needed = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            needed.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        val missing = needed.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 1001)
        }
    }
}
