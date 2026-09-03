package com.shannu.tdpnative.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.shannu.tdpnative.MainActivity
import com.shannu.tdpnative.R
import com.shannu.tdpnative.TdpApplication
import com.shannu.tdpnative.network.ApiClient
import com.shannu.tdpnative.network.dto.SaveFcmTokenRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Receives push notifications for calls, chat messages and announcements.
 * The server (server/utils/notificationService.js) always sends data-only,
 * high-priority messages, so this service reliably runs even while the app
 * is fully closed - unlike a "notification" payload, which the OS would
 * otherwise show automatically and never hand back to this code.
 */
class TdpFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data
        if (data.isEmpty()) return

        val type = data["type"]
        val isCall = type == "call"
        val title = data["title"] ?: if (isCall) "Incoming call" else "Notification"
        val body = data["body"] ?: if (isCall) "Tap to answer" else ""

        showNotification(title, body, isCall, data)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        TdpApplication.instance.sessionManager.fcmToken = token
        if (TdpApplication.instance.sessionManager.isLoggedIn) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    ApiClient.service.saveFcmToken(SaveFcmTokenRequest(token))
                } catch (e: Exception) {
                    // Best effort - MainActivity retries this on next launch too.
                }
            }
        }
    }

    private fun showNotification(title: String, body: String, isCall: Boolean, data: Map<String, String>) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            data.forEach { (key, value) -> putExtra(key, value) }
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val requestCode = (System.currentTimeMillis() and 0xfffffff).toInt()
        val pendingIntent = PendingIntent.getActivity(this, requestCode, intent, flags)

        val channelId = if (isCall) CHANNEL_CALLS else CHANNEL_DEFAULT
        val soundUri = RingtoneManager.getDefaultUri(
            if (isCall) RingtoneManager.TYPE_RINGTONE else RingtoneManager.TYPE_NOTIFICATION
        )

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setSound(soundUri)
            .setPriority(if (isCall) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_HIGH)
            .setCategory(if (isCall) NotificationCompat.CATEGORY_CALL else NotificationCompat.CATEGORY_MESSAGE)
            .setContentIntent(pendingIntent)

        if (isCall) {
            builder.setFullScreenIntent(pendingIntent, true)
            builder.setOngoing(true)
        }

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = if (isCall) NotificationManager.IMPORTANCE_HIGH else NotificationManager.IMPORTANCE_DEFAULT
            val channelName = if (isCall) "Calls" else "General"
            val channel = NotificationChannel(channelId, channelName, importance)
            val attrs = AudioAttributes.Builder()
                .setUsage(if (isCall) AudioAttributes.USAGE_NOTIFICATION_RINGTONE else AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            channel.setSound(soundUri, attrs)
            channel.enableVibration(true)
            manager.createNotificationChannel(channel)
        }

        manager.notify(System.currentTimeMillis().toInt(), builder.build())
    }

    companion object {
        private const val CHANNEL_CALLS = "calls_channel"
        private const val CHANNEL_DEFAULT = "default_channel"
    }
}
