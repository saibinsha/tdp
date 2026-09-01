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

    private static final String CALLS_CHANNEL_ID = "calls_channel";
    private static final String GENERAL_CHANNEL_ID = "general_channel";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        String title = null;
        String body = null;

        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
        }

        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            if (title == null) title = data.get("title");
            if (body == null) body = data.get("body");
        }

        String type = data != null ? data.get("type") : null;
        boolean isCall = "call".equalsIgnoreCase(type);

        if (title == null || title.trim().isEmpty()) {
            title = isCall ? "Incoming call" : "Notification";
        }
        if (body == null) {
            body = isCall ? "Tap to answer or reject" : "";
        }

        sendNotification(title, body, isCall, data);
    }

    private PendingIntent buildMainPendingIntent(int requestCode, String autoAnswerValue, Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);

        if (data != null) {
            if (data.containsKey("type")) intent.putExtra("type", data.get("type"));
            if (data.containsKey("scope")) intent.putExtra("scope", data.get("scope"));
            if (data.containsKey("fromUserId")) intent.putExtra("fromUserId", data.get("fromUserId"));
            if (data.containsKey("toUserId")) intent.putExtra("toUserId", data.get("toUserId"));
            if (data.containsKey("callId")) intent.putExtra("callId", data.get("callId"));
            if (data.containsKey("kind")) intent.putExtra("kind", data.get("kind"));
            if (data.containsKey("groupId")) intent.putExtra("groupId", data.get("groupId"));
            if (data.containsKey("messageId")) intent.putExtra("messageId", data.get("messageId"));
            if (data.containsKey("chatId")) intent.putExtra("chatId", data.get("chatId"));
        }

        if (autoAnswerValue != null) {
            intent.putExtra("autoAnswer", autoAnswerValue);
        }

        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;

        return PendingIntent.getActivity(this, requestCode, intent, flags);
    }

    private void sendNotification(String title, String messageBody, boolean isCall, Map<String, String> data) {
        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        String channelId = isCall ? CALLS_CHANNEL_ID : GENERAL_CHANNEL_ID;
        ensureChannel(notificationManager, isCall);

        Uri soundUri = RingtoneManager.getDefaultUri(
                isCall ? RingtoneManager.TYPE_RINGTONE : RingtoneManager.TYPE_NOTIFICATION
        );

        int baseRequestCode = (int) (System.currentTimeMillis() & 0x7fffffff);
        PendingIntent openIntent = buildMainPendingIntent(baseRequestCode, null, data);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(messageBody)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(messageBody))
                .setAutoCancel(true)
                .setSound(soundUri)
                .setPriority(isCall ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH)
                .setCategory(isCall ? NotificationCompat.CATEGORY_CALL : NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(openIntent);

        if (isCall) {
            PendingIntent answerIntent = buildMainPendingIntent(baseRequestCode + 1, "answer", data);
            PendingIntent rejectIntent = buildMainPendingIntent(baseRequestCode + 2, "reject", data);

            builder
                    .setOngoing(true)
                    .setTimeoutAfter(60000)
                    .addAction(0, "Reject", rejectIntent)
                    .addAction(0, "Answer", answerIntent)
                    .setFullScreenIntent(openIntent, true);
        }

        notificationManager.notify(baseRequestCode, builder.build());
    }

    private void ensureChannel(NotificationManager notificationManager, boolean isCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        String channelId = isCall ? CALLS_CHANNEL_ID : GENERAL_CHANNEL_ID;
        String channelName = isCall ? "Calls" : "Messages";
        int importance = isCall ? NotificationManager.IMPORTANCE_HIGH : NotificationManager.IMPORTANCE_DEFAULT;

        NotificationChannel channel = new NotificationChannel(channelId, channelName, importance);
        channel.enableVibration(true);

        Uri soundUri = RingtoneManager.getDefaultUri(
                isCall ? RingtoneManager.TYPE_RINGTONE : RingtoneManager.TYPE_NOTIFICATION
        );

        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(isCall ? AudioAttributes.USAGE_NOTIFICATION_RINGTONE : AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

        channel.setSound(soundUri, attrs);
        notificationManager.createNotificationChannel(channel);
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
    }
}
