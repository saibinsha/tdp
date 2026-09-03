# TDP Native Android App

A **fully native** Android client for the TDP party website
(`https://mytelugudeshamparty.onrender.com`) — not a WebView wrapper. It
talks directly to the same Node/Express + Socket.IO backend and the same
MongoDB database as the website and the WebView wrapper app
(`../andriod wrap`), so a login, message, or call started on the website is
visible here in real time and vice versa.

> **Status:** hand-written and carefully reviewed for correctness against the
> real server contracts (`server/routes/*.js`, `server/controllers/*.js`,
> `server/sockets/chat.js`), but this sandbox has **no Android SDK/emulator**,
> so the module has **not been compiled or run**. Open it in Android Studio,
> let Gradle sync, fix any small API-level issues that only show up at
> compile time, and test on a real device before shipping.

## What's implemented

- **Native Google Sign-In** — in-app popup (`GoogleSignInClient`), not a
  browser redirect. Posts the ID token to `POST /api/auth/google/native`
  (same endpoint the fixed WebView wrapper now also uses).
- **Email/password login & registration** against the existing
  `/api/auth/login` and `/api/auth/register` endpoints.
- **Persistent login** — access/refresh JWTs are stored in
  `SharedPreferences` (`SessionManager`) and silently refreshed via an OkHttp
  `Authenticator` on 401s (same contract as `src/lib/api.ts`), so closing and
  reopening the app does **not** log the user out.
- **Home feed** — party works/announcements list (`GET /api/works`).
- **Leaders directory** — `GET /api/leaders`.
- **Private messaging** — conversation list + one-to-one chat
  (`GET /api/messages/conversations`, `GET/POST /api/messages/private/:userId`)
  plus live delivery over the same Socket.IO events used by
  `src/components/party/MessagesPage.tsx`.
- **Native audio/video calls** — full WebRTC implementation
  (`CallActivity`) using the exact signaling protocol from
  `server/sockets/chat.js`: `call:invite` → `call:incoming` → `call:accept` →
  `call:accepted` → `call:offer`/`call:answer`/`call:ice` →
  `call:hangup`/`call:reject`. Uses the same Twilio TURN servers as the web
  app (`VITE_TURN_URLS` / `VITE_TURN_USERNAME` / `VITE_TURN_CREDENTIAL`).
- **Push notifications** — `TdpFirebaseMessagingService` handles data-only
  FCM messages for chat messages and calls, shows a full-screen incoming-call
  notification (wakes the screen, like a real phone dialer), and deep-links
  notification taps straight into the relevant chat/call screen — including
  when the app process was fully killed.
- **Profile** — shows the signed-in user and a logout action.

## What's intentionally out of scope for this pass

Groups, Polls, Surveys, Blogs/News feed detail pages, and the admin panel are
**not** implemented natively yet (the website has these, the wrapper app
shows them via WebView, but this native pass focused on the features called
out in the request: auth, persistence, calls/video calls, and
messages/notifications). Adding them means new Retrofit endpoints + DTOs +
screens following the same pattern as `ui/leaders` or `ui/home`.

## Project layout

```
full native app code/
  app/src/main/java/com/shannu/tdpnative/
    auth/          LoginActivity, AuthRepository
    call/          CallActivity (WebRTC), CallForegroundService
    data/          SessionManager (JWT persistence)
    network/       ApiService (Retrofit), ApiClient, dto/Models.kt
    push/          TdpFirebaseMessagingService
    realtime/      SocketManager (Socket.IO)
    ui/home        Home/works feed
    ui/leaders     Leaders directory
    ui/messages    Conversations, chat, adapters
    ui/profile     Profile + logout
    MainActivity.kt, SplashActivity.kt, TdpApplication.kt
```

## Building in Android Studio

1. Open the `full native app code` folder as a project (not the repo root).
2. Replace `google-services.json.sample` with your **real**
   `google-services.json` from the same Firebase project used by the
   WebView wrapper app (`tdp2-4d674`), renamed to `google-services.json`, in
   `full native app code/app/`.
3. (Optional) override build-time defaults instead of editing
   `app/build.gradle` directly, by adding to `full native app code/gradle.properties`:
   ```properties
   apiBaseUrl=https://mytelugudeshamparty.onrender.com
   webClientId=<your-web-oauth-client-id>.apps.googleusercontent.com
   turnUrls=turn:global.turn.twilio.com:3478?transport=udp,...
   turnUsername=...
   turnCredential=...
   ```
   The checked-in defaults already point at the production server and the
   real `WEB_OAUTH_CLIENT_ID`/Twilio TURN credentials from the deployment
   env, matching what the web bundle already ships publicly via
   `VITE_TURN_*`.
4. Let Gradle sync, then run on a device or emulator with Google Play
   Services (required for Google Sign-In).

## Server-side note

No server changes are required for this app beyond what was already fixed
in this PR (`server/utils/notificationService.js` sending data-only FCM
messages) — it reuses the exact same REST/Socket.IO API as the website.
