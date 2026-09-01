package com.shannu.mytdp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        String title = null;
        String body = null;

        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
        }

        Map<String, String> data = remoteMessage.getData();
        if (data != null && data.size() > 0) {
            if (title == null) title = data.get("title");
            if (body == null) body = data.get("body");

            String type = data.get("type");
            String scope = data.get("scope");
            boolean isCall = "call".equals(type);

            if (isCall) {
                if (title == null || title.trim().isEmpty()) title = "Incoming call";
                if (body == null || body.trim().isEmpty()) body = "Tap to open";
            } else if (title == null || title.trim().isEmpty()) {
                title = "community".equals(scope) ? "Community" : "New message";
            }

            if (body == null) body = "";

            // Every push (private/group/community message or call) is sent as a
            // data-only, high-priority message from the backend so this method
            // is always invoked here, even while the app is asleep, backgrounded,
            // or another app is in the foreground - matching WhatsApp-style
            // delivery instead of relying on the OS's own notification tray
            // (which bypasses this service and our custom handling once the
            // app is no longer in the foreground).
            sendNotification(title, body, isCall, data);
            return;
        }

        if (title == null || title.trim().isEmpty()) title = "Notification";
        if (body == null) body = "";

        sendNotification(title, body, false, data);
    }

    private void sendNotification(String title, String messageBody, boolean isCall, Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);

        if (data != null) {
            try {
                if (data.containsKey("type")) intent.putExtra("type", data.get("type"));
                if (data.containsKey("scope")) intent.putExtra("scope", data.get("scope"));
                if (data.containsKey("fromUserId")) intent.putExtra("fromUserId", data.get("fromUserId"));
                if (data.containsKey("toUserId")) intent.putExtra("toUserId", data.get("toUserId"));
                if (data.containsKey("callId")) intent.putExtra("callId", data.get("callId"));
                if (data.containsKey("kind")) intent.putExtra("kind", data.get("kind"));
                if (data.containsKey("groupId")) intent.putExtra("groupId", data.get("groupId"));
                if (data.containsKey("messageId")) intent.putExtra("messageId", data.get("messageId"));
                if (data.containsKey("autoAnswer")) intent.putExtra("autoAnswer", data.get("autoAnswer"));
                if (data.containsKey("fromRole")) intent.putExtra("fromRole", data.get("fromRole"));
            } catch (Exception ignored) {
            }
        }

        int flags;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        } else {
            flags = PendingIntent.FLAG_UPDATE_CURRENT;
        }

        int requestCode = (int) (System.currentTimeMillis() & 0xfffffff);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, requestCode, intent, flags);

        String channelId = isCall ? "calls_channel" : "messages_channel";
        String channelName = isCall ? "Calls" : "Messages";

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(
                isCall ? RingtoneManager.TYPE_RINGTONE : RingtoneManager.TYPE_NOTIFICATION
        );

        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, channelId)
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle(title)
                        .setContentText(messageBody)
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setCategory(isCall ? NotificationCompat.CATEGORY_CALL : NotificationCompat.CATEGORY_MESSAGE)
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setContentIntent(pendingIntent);

        if (isCall) {
            // Bring the call to the foreground immediately - ringing over the
            // lock screen and over whatever app is currently open - the same
            // way WhatsApp surfaces incoming calls instead of waiting for the
            // user to pull down the notification shade.
            notificationBuilder
                    .setOngoing(true)
                    .setFullScreenIntent(pendingIntent, true);
        }

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_HIGH);

            try {
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(isCall ? AudioAttributes.USAGE_NOTIFICATION_RINGTONE : AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                channel.setSound(defaultSoundUri, attrs);
                channel.enableVibration(true);
                channel.setBypassDnd(isCall);
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            } catch (Exception ignored) {
            }

            notificationManager.createNotificationChannel(channel);
        }

        notificationManager.notify((int) System.currentTimeMillis(), notificationBuilder.build());
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Token syncing is handled by MainActivity injecting token into WebView via window.setFcmToken(token).
    }
}
