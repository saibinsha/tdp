// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAwithJ3_8TxjV_H9do2lUbI-Q8W3fSLaI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tdp2-4d674.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tdp2-4d674",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tdp2-4d674.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "386414628105",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:386414628105:web:2a8547550f4d24820157d8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L0ZPR0NLMG"
};

// Initialize Firebase safely
let app = null;
let analytics = null;

try {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (err) {
  console.warn('[AI Studio] Firebase init failed or skipped:', err);
}

export { app, analytics, firebaseConfig };
