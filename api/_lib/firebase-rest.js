/**
 * Cloudflare-compatible Firebase Service
 * Uses standard Web Crypto API (crypto.subtle) and Firestore REST API.
 * Zero external Node-only dependencies (no grpc, no http2, no firebase-admin).
 */

let cachedAccessToken = null;
let cachedTokenExpiry = 0;
let cachedCryptoKey = null;
let cachedPrivateKeyPem = null;

// Base64URL helper
export function base64UrlEncode(input) {
  let str;
  if (typeof input === 'string') {
    str = btoa(input);
  } else if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    str = btoa(binary);
  } else {
    str = btoa(JSON.stringify(input));
  }
  return str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function parseServiceAccount(saInput) {
  if (!saInput) return null;
  if (typeof saInput === 'object') return saInput;
  try {
    let raw = saInput.trim();
    // If double quoted, strip quotes
    if (raw.startsWith('"') && raw.endsWith('"')) {
      raw = raw.slice(1, -1);
    }
    // Try parsing as base64 first
    try {
      const decoded = atob(raw);
      return JSON.parse(decoded);
    } catch {
      // Try parsing as JSON directly
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse service account JSON/B64', err);
    return null;
  }
}

async function getCryptoKey(privateKeyPem) {
  if (cachedCryptoKey && cachedPrivateKeyPem === privateKeyPem) {
    return cachedCryptoKey;
  }

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKeyPem
    .substring(
      privateKeyPem.indexOf(pemHeader) + pemHeader.length,
      privateKeyPem.indexOf(pemFooter)
    )
    .replace(/\s/g, '');

  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const subtle = crypto.subtle;
  const key = await subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  cachedCryptoKey = key;
  cachedPrivateKeyPem = privateKeyPem;
  return key;
}

async function signJwt(header, payload, privateKeyPem) {
  const subtle = crypto.subtle;
  const key = await getCryptoKey(privateKeyPem);
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  
  const signature = await subtle.sign('RSASSA-PKCS1-v1_5', key, data);
  const encodedSignature = base64UrlEncode(signature);
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Creates a Firebase Custom Token (RS256 JWT) accepted by Firebase Auth signInWithCustomToken.
 */
export async function createFirebaseCustomToken(sa, uid, claims = {}) {
  const iat = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat,
    exp: iat + 3600,
    uid,
    claims
  };

  return signJwt(header, payload, sa.private_key);
}

/**
 * Generates or returns a cached Google Cloud OAuth2 access token for Firestore REST calls.
 */
export async function getGoogleAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedTokenExpiry > now + 60) {
    return cachedAccessToken;
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const assertion = await signJwt(header, payload, sa.private_key);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Google OAuth token: ${res.status} ${errorText}`);
  }

  const tokenData = await res.json();
  cachedAccessToken = tokenData.access_token;
  cachedTokenExpiry = now + (tokenData.expires_in || 3600);
  return cachedAccessToken;
}

// ── Firestore Value Transformers ─────────────────────────────────────────────

export function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(val) {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in val) {
    const res = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}

export function fromFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const data = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    data[k] = fromFirestoreValue(v);
  }
  const id = doc.name ? doc.name.split('/').pop() : null;
  return { id, ...data };
}

// ── Firestore REST API Operations ────────────────────────────────────────────

const BASE_URL = 'https://firestore.googleapis.com/v1';

async function firestoreRequest(sa, path, options = {}) {
  const token = await getGoogleAccessToken(sa);
  const url = `${BASE_URL}/projects/${sa.project_id}/databases/(default)/documents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  return res;
}

export async function getDoc(sa, docPath) {
  const res = await firestoreRequest(sa, docPath, { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore getDoc error ${res.status}: ${errText}`);
  }
  const doc = await res.json();
  return fromFirestoreDoc(doc);
}

export async function setDoc(sa, docPath, data, options = {}) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }

  let query = '';
  if (options.merge) {
    const maskParams = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`);
    query = `?${maskParams.join('&')}`;
  }

  const res = await firestoreRequest(sa, `${docPath}${query}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore setDoc error ${res.status}: ${errText}`);
  }

  return res.json();
}

export async function deleteDoc(sa, docPath) {
  const res = await firestoreRequest(sa, docPath, { method: 'DELETE' });
  if (res.status === 404) return true;
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore deleteDoc error ${res.status}: ${errText}`);
  }
  return true;
}

/**
 * Finds a group by 6-character group code.
 */
export async function findGroupByCode(sa, code) {
  const cleanCode = code.trim().toUpperCase();
  const token = await getGoogleAccessToken(sa);
  const url = `${BASE_URL}/projects/${sa.project_id}/databases/(default)/documents:runQuery`;
  
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'groups' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'code' },
          op: 'EQUAL',
          value: { stringValue: cleanCode }
        }
      },
      limit: 1
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(query)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore findGroupByCode error ${res.status}: ${errText}`);
  }

  const results = await res.json();
  if (!Array.isArray(results)) return null;

  for (const item of results) {
    if (item.document) {
      return fromFirestoreDoc(item.document);
    }
  }
  return null;
}

/**
 * Lists subcollection documents for recursive deletion.
 */
export async function listCollectionDocs(sa, collectionPath) {
  const res = await firestoreRequest(sa, collectionPath, { method: 'GET' });
  if (res.status === 404) return [];
  if (!res.ok) return [];
  const data = await res.json();
  return data.documents || [];
}

/**
 * Recursively deletes a group document and all known subcollections.
 */
export async function recursiveDeleteGroup(sa, groupId) {
  const subcollections = ['members', 'categories', 'expenses', 'scenarios', 'settlements'];

  for (const sub of subcollections) {
    try {
      const docs = await listCollectionDocs(sa, `groups/${groupId}/${sub}`);
      for (const doc of docs) {
        const docId = doc.name.split('/').pop();
        await deleteDoc(sa, `groups/${groupId}/${sub}/${docId}`);
      }
    } catch (e) {
      console.warn(`Error clearing subcollection ${sub} for group ${groupId}:`, e.message);
    }
  }

  // Delete the root group document
  await deleteDoc(sa, `groups/${groupId}`);
  return true;
}
