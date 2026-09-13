import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

// Copy the logic from jwt-bridge.js exactly
function createFirebaseCustomToken(uid, claims = {}) {
  const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));
  const header = { alg: 'RS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: iat,
    exp: iat + 3600,
    uid: uid,
    claims: claims
  };

  const b64url = str => Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(payload));

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(encodedHeader + '.' + encodedPayload);
  const signature = sign.sign(sa.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return encodedHeader + '.' + encodedPayload + '.' + signature;
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const uid = 'user_2pX5a9v' + Date.now();
const token = createFirebaseCustomToken(uid, { mode: 'clerk' });

console.log("Token:", token.substring(0, 50) + "...");

async function run() {
  try {
    await signInWithCustomToken(auth, token);
    console.log("Signed in! UID:", auth.currentUser.uid);
    
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { displayName: "Test", onboardingCompleted: true }, { merge: true });
    console.log("Firestore write successful!");
    process.exit(0);
  } catch (e) {
    console.error("Firestore write failed:", e.code, e.message);
    process.exit(1);
  }
}
run();
