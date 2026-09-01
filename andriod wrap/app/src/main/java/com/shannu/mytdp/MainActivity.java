package com.shannu.mytdp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private static final int FILECHOOSER_RESULTCODE = 1;
    private static final int PERMISSIONS_REQUEST_CODE = 1001;
    private static final int GOOGLE_SIGN_IN_REQUEST_CODE = 9001;

    private static final String BASE_WEB_URL = "https://mytelugudeshamparty.onrender.com";
    private static final String LEGACY_WEB_HOST = "telugudeshamparty.onrender.com";
    private static final String CURRENT_WEB_HOST = Uri.parse(BASE_WEB_URL).getHost();

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private GoogleSignInClient googleSignInClient;

    private String pendingPushJson = null;
    private String loginToken = null;
    private String loginEmail = null;
    private String loginName = null;

    private void initGoogleSignIn() {
        try {
            int resId = getResources().getIdentifier("default_web_client_id", "string", getPackageName());
            String webClientId = resId != 0 ? getString(resId) : "";
            if (webClientId == null || webClientId.trim().isEmpty()) {
                googleSignInClient = null;
                return;
            }

            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail()
                    .requestIdToken(webClientId)
                    .build();
            googleSignInClient = GoogleSignIn.getClient(this, gso);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize Google Sign-In", e);
            googleSignInClient = null;
        }
    }

    private boolean startGoogleSignIn() {
        try {
            if (googleSignInClient == null) {
                initGoogleSignIn();
            }
            if (googleSignInClient == null) {
                sendGoogleSignInErrorToWeb("Google Sign-In is not configured.");
                return false;
            }
            Intent signInIntent = googleSignInClient.getSignInIntent();
            startActivityForResult(signInIntent, GOOGLE_SIGN_IN_REQUEST_CODE);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to start Google Sign-In", e);
            sendGoogleSignInErrorToWeb("Failed to start Google Sign-In.");
            return false;
        }
    }

    private void sendGoogleIdTokenToWeb(String idToken) {
        if (webView == null) return;
        String safe = escapeJs(idToken == null ? "" : idToken);
        String js = "(function(){try{if(window.onNativeGoogleSignIn){window.onNativeGoogleSignIn(\"" + safe + "\");}}catch(e){}})();";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private void sendGoogleSignInErrorToWeb(String message) {
        if (webView == null) return;
        String safe = escapeJs(message == null ? "" : message);
        String js = "(function(){try{if(window.onNativeGoogleSignInError){window.onNativeGoogleSignInError(\"" + safe + "\");}}catch(e){}})();";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private void handleIntentData(Intent intent) {
        if (intent == null) return;

        Uri data = intent.getData();
        if (data == null) return;

        if (!"mytdp".equals(data.getScheme())) return;

        String token = data.getQueryParameter("token");
        String email = data.getQueryParameter("email");
        String name = data.getQueryParameter("name");

        if (token != null && !token.trim().isEmpty()) {
            loginToken = token;
            loginEmail = email;
            loginName = name;
            sendLoginDataToWebView(token, email, name);
        }
    }

    private void sendLoginDataToWebView(String token, String email, String name) {
        if (token == null || token.trim().isEmpty()) return;

        if (webView == null) {
            loginToken = token;
            loginEmail = email;
            loginName = name;
            return;
        }

        String js = "(function(){" +
                "try{" +
                "if(window.handleExternalLogin){" +
                "window.handleExternalLogin({" +
                "token:'" + escapeJs(token) + "'," +
                "email:'" + escapeJs(email != null ? email : "") + "'," +
                "name:'" + escapeJs(name != null ? name : "") + "'" +
                "});" +
                "}" +
                "}catch(e){console.error('Login callback error',e);}" +
                "})();";

        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private void checkAndRequestPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();
        permissionsNeeded.add(Manifest.permission.CAMERA);
        permissionsNeeded.add(Manifest.permission.RECORD_AUDIO);
        permissionsNeeded.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
            permissionsNeeded.add(Manifest.permission.READ_MEDIA_IMAGES);
            permissionsNeeded.add(Manifest.permission.READ_MEDIA_VIDEO);
        } else {
            permissionsNeeded.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            permissionsNeeded.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        }

        List<String> listPermissionsNeeded = new ArrayList<>();
        for (String p : permissionsNeeded) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(p);
            }
        }

        if (!listPermissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, listPermissionsNeeded.toArray(new String[0]), PERMISSIONS_REQUEST_CODE);
        }
    }

    private class WebAppBridge {
        @JavascriptInterface
        public void googleSignIn() {
            runOnUiThread(() -> {
                boolean started = startGoogleSignIn();
                if (!started) {
                    openExternalUrl(BASE_WEB_URL + "/api/auth/google");
                }
            });
        }

        @JavascriptInterface
        public void startCall() {
            runOnUiThread(() -> {
                AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                if (audioManager != null) {
                    audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                    audioManager.setSpeakerphoneOn(true);
                }
            });
        }

        @JavascriptInterface
        public void startAudioCall() {
            runOnUiThread(() -> {
                AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                if (audioManager != null) {
                    audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                    audioManager.setSpeakerphoneOn(false);
                    audioManager.setMicrophoneMute(false);
                }
            });
        }

        @JavascriptInterface
        public void endCall() {
            runOnUiThread(() -> {
                AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                if (audioManager != null) {
                    audioManager.setMode(AudioManager.MODE_NORMAL);
                    audioManager.setSpeakerphoneOn(false);
                }
            });
        }

        @JavascriptInterface
        public void enableSpeakerphone() {
            runOnUiThread(() -> {
                AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                if (audioManager != null) {
                    audioManager.setSpeakerphoneOn(true);
                }
            });
        }

        @JavascriptInterface
        public void disableSpeakerphone() {
            runOnUiThread(() -> {
                AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                if (audioManager != null) {
                    audioManager.setSpeakerphoneOn(false);
                }
            });
        }
    }

    private static String escapeJs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private void capturePushFromIntent(Intent intent) {
        if (intent == null) return;
        try {
            String type = intent.getStringExtra("type");
            String scope = intent.getStringExtra("scope");
            String fromUserId = intent.getStringExtra("fromUserId");
            String toUserId = intent.getStringExtra("toUserId");
            String callId = intent.getStringExtra("callId");
            String kind = intent.getStringExtra("kind");
            String groupId = intent.getStringExtra("groupId");
            String messageId = intent.getStringExtra("messageId");
            String autoAnswer = intent.getStringExtra("autoAnswer");
            String callAction = intent.getStringExtra("callAction");
            String fromRole = intent.getStringExtra("fromRole");

            if (type == null && callId == null && fromUserId == null && messageId == null && groupId == null) {
                return;
            }

            pendingPushJson = "{" +
                    "\"type\":\"" + escapeJs(type) + "\"," +
                    "\"scope\":\"" + escapeJs(scope) + "\"," +
                    "\"fromUserId\":\"" + escapeJs(fromUserId) + "\"," +
                    "\"toUserId\":\"" + escapeJs(toUserId) + "\"," +
                    "\"callId\":\"" + escapeJs(callId) + "\"," +
                    "\"kind\":\"" + escapeJs(kind) + "\"," +
                    "\"groupId\":\"" + escapeJs(groupId) + "\"," +
                    "\"messageId\":\"" + escapeJs(messageId) + "\"," +
                    "\"autoAnswer\":\"" + escapeJs(autoAnswer) + "\"," +
                    "\"callAction\":\"" + escapeJs(callAction) + "\"," +
                    "\"fromRole\":\"" + escapeJs(fromRole) + "\"" +
                    "}";
        } catch (Exception ignored) {
        }
    }

    private boolean isAllowedHost(Uri uri) {
        if (uri == null) return false;
        String host = uri.getHost();
        if (host == null) return false;
        return CURRENT_WEB_HOST.equalsIgnoreCase(host) || LEGACY_WEB_HOST.equalsIgnoreCase(host);
    }

    private void openExternalUrl(String url) {
        try {
            Uri uri = Uri.parse(url);
            CustomTabsIntent intent = new CustomTabsIntent.Builder().build();
            intent.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.launchUrl(this, uri);
        } catch (Exception e) {
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(browserIntent);
            } catch (Exception ignored) {
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        handleIntentData(getIntent());
        capturePushFromIntent(getIntent());

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN |
                            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }

        setContentView(R.layout.activity_main);
        checkAndRequestPermissions();

        webView = findViewById(R.id.webview);
        if (webView == null) {
            Log.e(TAG, "WebView not found in layout");
            return;
        }

        initGoogleSignIn();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        String userAgent = settings.getUserAgentString();
        if (userAgent != null) {
            settings.setUserAgentString(userAgent.replace("wv", "").trim());
        }

        webView.addJavascriptInterface(new WebAppBridge(), "Android");

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
            cookieManager.flush();
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return false;

                Uri uri = request.getUrl();
                String scheme = uri.getScheme();

                if ("mytdp".equalsIgnoreCase(scheme)) {
                    handleIntentData(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }

                if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
                    String path = uri.getPath();
                    if ("/api/auth/google".equals(path) || !isAllowedHost(uri)) {
                        openExternalUrl(uri.toString());
                        return true;
                    }
                    return false;
                }

                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                } catch (Exception ignored) {
                    return true;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    CookieManager.getInstance().flush();
                }

                try {
                    FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                        if (!task.isSuccessful()) return;
                        String token = task.getResult();
                        if (token == null || token.trim().isEmpty()) return;

                        String safe = escapeJs(token);
                        webView.evaluateJavascript("window.setFcmToken && window.setFcmToken('" + safe + "')", null);
                    });
                } catch (Exception e) {
                    Log.e(TAG, "Error getting FCM token", e);
                }

                if (loginToken != null) {
                    sendLoginDataToWebView(loginToken, loginEmail, loginName);
                    loginToken = null;
                    loginEmail = null;
                    loginName = null;
                }

                if (pendingPushJson != null) {
                    String js = "(function(){try{if(window.handlePushOpen){window.handlePushOpen(" + pendingPushJson + ");}}catch(e){}})();";
                    webView.evaluateJavascript(js, null);
                    pendingPushJson = null;
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    try {
                        request.grant(request.getResources());
                    } catch (Exception e) {
                        Log.e(TAG, "Permission request failed", e);
                        request.deny();
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("*/*");

                Intent chooserIntent = Intent.createChooser(contentSelectionIntent, "Choose file");
                startActivityForResult(chooserIntent, FILECHOOSER_RESULTCODE);
                return true;
            }
        });

        webView.loadUrl(BASE_WEB_URL + "/");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntentData(intent);
        capturePushFromIntent(intent);

        if (webView != null) {
            webView.post(() -> {
                if (pendingPushJson == null) return;
                String js = "(function(){try{if(window.handlePushOpen){window.handlePushOpen(" + pendingPushJson + ");}}catch(e){}})();";
                webView.evaluateJavascript(js, null);
                pendingPushJson = null;
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == GOOGLE_SIGN_IN_REQUEST_CODE) {
            try {
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
                GoogleSignInAccount account = task.getResult(ApiException.class);
                String idToken = account != null ? account.getIdToken() : null;
                if (idToken == null || idToken.trim().isEmpty()) {
                    sendGoogleSignInErrorToWeb("Google sign-in returned empty token.");
                } else {
                    sendGoogleIdTokenToWeb(idToken);
                }
            } catch (ApiException e) {
                Log.e(TAG, "Google Sign-In ApiException: " + e.getStatusCode(), e);
                sendGoogleSignInErrorToWeb("Google sign-in failed (" + e.getStatusCode() + ").");
            } catch (Exception e) {
                Log.e(TAG, "Google Sign-In failed", e);
                sendGoogleSignInErrorToWeb("Google sign-in failed.");
            }
            return;
        }

        if (requestCode == FILECHOOSER_RESULTCODE && filePathCallback != null) {
            Uri[] result = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                Uri dataUri = data.getData();
                if (dataUri != null) {
                    result = new Uri[]{dataUri};
                }
            }
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_NORMAL);
            }
        } catch (Exception ignored) {
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().flush();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
