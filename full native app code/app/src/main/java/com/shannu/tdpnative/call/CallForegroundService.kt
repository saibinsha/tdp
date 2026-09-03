package com.shannu.tdpnative.call

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.shannu.tdpnative.R

/**
 * Minimal foreground service that keeps an active call alive if the user
 * navigates away from [CallActivity] (e.g. presses Home), matching the
 * "ongoing call" behaviour of a real phone dialer / WhatsApp.
 */
class CallForegroundService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        return START_NOT_STICKY
    }

    private fun buildNotification(): android.app.Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Ongoing call", NotificationManager.IMPORTANCE_LOW)
            manager.createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Call in progress")
            .setOngoing(true)
            .build()
    }

    companion object {
        private const val CHANNEL_ID = "call_ongoing_channel"
        private const val NOTIFICATION_ID = 42
    }
}
