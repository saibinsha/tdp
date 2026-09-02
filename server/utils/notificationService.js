const fs = require('fs');
const path = require('path');

let admin;
let initialized = false;

function tryParseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function tryParseBase64Json(raw) {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(String(raw), 'base64').toString('utf8');
    return tryParseJson(decoded);
  } catch {
    return null;
  }
}

function initFirebase() {
  if (initialized) return;

  // Lazy-load so the app can still boot without Firebase configured.
  // Only push features will be disabled.
  try {
    // eslint-disable-next-line global-require
    admin = require('firebase-admin');
  } catch {
    initialized = true;
    return;
  }

  if (admin.apps && admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const jsonFromEnv =
    tryParseJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ||
    tryParseJson(process.env.FIREBASE_SERVICE_ACCOUNT) ||
    tryParseBase64Json(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64) ||
    tryParseBase64Json(process.env.FIREBASE_SERVICE_ACCOUNT_B64);

  let serviceAccount = jsonFromEnv;
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const p = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const raw = fs.readFileSync(p, 'utf8');
      serviceAccount = JSON.parse(raw);
    } catch {
      serviceAccount = null;
    }
  }

  if (!serviceAccount) {
    initialized = true;
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
}

async function sendPushNotification(userToken, title, body, data = {}) {
  if (!userToken) return { ok: false, skipped: true, reason: 'missing_token' };

  initFirebase();
  if (!admin || !admin.messaging) {
    return { ok: false, skipped: true, reason: 'firebase_not_configured' };
  }

  const normalizedData = Object.entries(data || {}).reduce((acc, [k, v]) => {
    acc[String(k)] = String(v);
    return acc;
  }, {});

  if (title && !normalizedData.title) normalizedData.title = String(title);
  if (body && !normalizedData.body) normalizedData.body = String(body);

  // Always send a data-only message (no top-level "notification" payload).
  // When a "notification" payload is present, the OS displays it directly
  // and completely bypasses FirebaseMessagingService.onMessageReceived
  // whenever the app is backgrounded or killed - so our custom ringtone,
  // notification channel and deep-link extras (callId/groupId/messageId)
  // would silently be lost for calls, chat messages and any other push.
  // Sending data-only + android.priority "high" guarantees the app process
  // is woken and onMessageReceived always runs, even while closed.
  const message = {
    token: String(userToken),
    data: normalizedData,
    android: {
      priority: 'high',
    },
  };

  const messageId = await admin.messaging().send(message);
  return { ok: true, messageId };
}

module.exports = {
  initFirebase,
  sendPushNotification,
};
