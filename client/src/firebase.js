import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// Validate required environment variables at startup
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
];

const missingVars = requiredEnvVars.filter(key => !import.meta.env[key]);
if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}. ` +
    `Copy .env.example to client/.env.local and fill in your Firebase project credentials.`
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const app = initializeApp(firebaseConfig);

// Modern persistence API — replaces deprecated enableIndexedDbPersistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  console.log("🔥 Using Firebase Emulators (Firestore & Auth)");
}

const auth = getAuth(app);
if (import.meta.env.DEV) {
  window.__FIREBASE_AUTH__ = auth;
}

export { db, app };
