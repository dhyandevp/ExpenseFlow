import crypto from 'crypto';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));

function createCustomToken(uid, claims = {}) {
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

const token = createCustomToken('test_user_123', { mode: 'guest' });
console.log('Custom Token:', token);

// Verify with firebase-admin to be sure
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}
// We can't easily verify a custom token with getAuth().verifyIdToken() because custom tokens must be EXCHANGED for an ID token on the client first.
// But we can check if it parses.
console.log('Done!');
