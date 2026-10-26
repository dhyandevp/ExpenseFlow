# Secure Cloudinary Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor ExpenseFlow's legacy direct browser unsigned Cloudinary uploads into a hardened, server-authorized architecture featuring signed uploads, group namespace isolation, authoritative deletion, group-bound Firestore security rules, and exact cascade cleanup.

**Architecture:** Cloudflare Worker authenticates Clerk JWT and verifies group membership via Firestore REST API before generating HMAC-SHA1 signatures strictly bound to `expenseflow/groups/{groupId}/receipts/`. Client SPA uploads directly to Cloudinary using signed parameters and stores full receipt metadata (`receiptUrl`, `receiptPublicId`, `receiptAssetId`). Deletions are resolved server-side from Firestore records via `{ groupId, expenseId }` and executed via Cloudinary Destroy API with explicit error handling and failure logging.

**Tech Stack:** Cloudflare Workers, Node.js (Web Crypto API `crypto.subtle`), Vitest, Firebase Firestore REST API & Rules, `@clerk/backend`, React (Vite).

**Spec:** `docs/superpowers/specs/2026-09-25-secure-cloudinary-refactor-design.md`

---

## Global Constraints

- **Zero Unsigned Presets:** Completely eliminate `VITE_CLOUDINARY_UPLOAD_PRESET` from client source and environment configurations.
- **Server-Side Secrets Only:** `CLOUDINARY_API_SECRET` and `CLOUDINARY_API_KEY` reside exclusively in Cloudflare Worker environment bindings.
- **Authoritative Server Folder:** Always `expenseflow/groups/{verifiedGroupId}/receipts`, rejecting client-provided folder parameters.
- **Authoritative Deletion:** Endpoint accepts `{ groupId, expenseId }`, retrieves `receiptPublicId` from Firestore, never trusting client-supplied public IDs.
- **Exact Deletion Cascade & Fail-Safe Cleanup:** Group deletion queries exact stored `receiptPublicId` values. If any Cloudinary deletion fails, group deletion aborts with an error to prevent orphaning Cloudinary assets.
- **Unattached Upload Cleanup:** Server supports cleaning up unattached uploads if client-side expense creation fails after Cloudinary upload succeeds.
- **Generic Client Errors:** Internal Cloudinary error messages are never returned to clients; only a sanitized error and `requestId` are returned, while raw details stay in server logs.
- **Delivery Scope Limitation:** Standard Cloudinary CDN URLs remain accessible to anyone possessing the exact URL. This refactor enforces authorization for signing, mutations, and deletions, but does not implement signed delivery tokens.
- **Backward Compatibility:** Legacy expenses containing only `receiptUrl` must continue to render and edit cleanly.

## Review Focus

1. **Client attempts cross-group signature request:** User A requests upload signature for Group B where they are not a member; server returns 403 Forbidden.
2. **Client attempts cross-group receipt deletion:** User A requests deletion of receipt in Group B where they are not a member; server returns 403 Forbidden.
3. **Malicious client attempts writing foreign group asset to Firestore:** User A writes `expenseflow/groups/groupB/receipts/x` to `groups/groupA/expenses/exp1`; Firestore rules reject create/update.
4. **Legacy expense deletion handling:** User deletes an old expense with `receiptUrl` but null `receiptPublicId`; server skips Cloudinary call, clears Firestore fields, and returns 200 without error.
5. **Cloudinary Destroy API failure handling:** Cloudinary responds with error on deletion; server logs failure with requestId and returns 502 Bad Gateway rather than silently swallowing the error.

---

### Task 1: Cloudinary Cryptographic & API Utilities (`api/_lib/cloudinary.js`)

**Files:**
- Create: `api/_lib/cloudinary.js`
- Test: `tests/cloudinary.test.js`

**Interfaces:**
- Produces:
  - `generateUploadSignature({ folder, timestamp, apiSecret })`: returns SHA-1 hex string.
  - `generateDestroySignature({ publicId, timestamp, apiSecret })`: returns SHA-1 hex string.
  - `validateReceiptPublicId(publicId, groupId)`: returns boolean checking `^expenseflow/groups/${groupId}/receipts/[a-zA-Z0-9_.-]+$`.
  - `destroyCloudinaryAsset({ cloudName, apiKey, apiSecret, publicId, fetchImpl })`: returns `{ success: boolean, result?: string, error?: string }`.

- [ ] **Step 1: Write the failing unit tests for Cloudinary utilities**

Create `tests/cloudinary.test.js`:
```javascript
import { describe, it, expect, vi } from 'vitest';
import {
  generateUploadSignature,
  generateDestroySignature,
  validateReceiptPublicId,
  destroyCloudinaryAsset
} from '../api/_lib/cloudinary.js';

describe('Cloudinary Utilities', () => {
  const secret = 'sample_secret_12345';

  it('generates consistent HMAC-SHA1 upload signature for folder and timestamp', async () => {
    const timestamp = 1711000000;
    const folder = 'expenseflow/groups/group_abc/receipts';
    const sig = await generateUploadSignature({ folder, timestamp, apiSecret: secret });
    expect(typeof sig).toBe('string');
    expect(sig).toHaveLength(40); // SHA-1 hex is 40 chars
    // Matching deterministic hash
    const expected = await generateUploadSignature({ folder, timestamp, apiSecret: secret });
    expect(sig).toBe(expected);
  });

  it('generates destroy signature matching Cloudinary specification', async () => {
    const timestamp = 1711000000;
    const publicId = 'expenseflow/groups/group_abc/receipts/asset_xyz';
    const sig = await generateDestroySignature({ publicId, timestamp, apiSecret: secret });
    expect(typeof sig).toBe('string');
    expect(sig).toHaveLength(40);
  });

  it('validates receiptPublicId namespace bound to specific groupId', () => {
    expect(validateReceiptPublicId('expenseflow/groups/grp1/receipts/img_01', 'grp1')).toBe(true);
    expect(validateReceiptPublicId('expenseflow/groups/grp2/receipts/img_01', 'grp1')).toBe(false);
    expect(validateReceiptPublicId('malicious/path/img_01', 'grp1')).toBe(false);
    expect(validateReceiptPublicId('expenseflow/groups/grp1/receipts/../escaped', 'grp1')).toBe(false);
  });

  it('destroys Cloudinary asset successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok' })
    });

    const res = await destroyCloudinaryAsset({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: secret,
      publicId: 'expenseflow/groups/grp1/receipts/img_01',
      fetchImpl: mockFetch
    });

    expect(res.success).toBe(true);
    expect(res.result).toBe('ok');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/test-cloud/image/destroy',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('surfaces explicit error when Cloudinary destroy fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Invalid signature'
    });

    const res = await destroyCloudinaryAsset({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: secret,
      publicId: 'expenseflow/groups/grp1/receipts/img_01',
      fetchImpl: mockFetch
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid signature');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cloudinary.test.js`  
Expected: FAIL with module not found or functions not exported.

- [ ] **Step 3: Implement `api/_lib/cloudinary.js`**

Create `api/_lib/cloudinary.js`:
```javascript
/**
 * Cloudinary Signature & Management Utilities
 * Works across Cloudflare Workers (Web Crypto API) and Node.js environments.
 */

async function sha1Hex(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an upload signature for Cloudinary.
 * Parameters must be sorted alphabetically: folder, timestamp.
 */
export async function generateUploadSignature({ folder, timestamp, apiSecret }) {
  if (!folder || !timestamp || !apiSecret) {
    throw new Error('folder, timestamp, and apiSecret are required');
  }
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  return sha1Hex(toSign);
}

/**
 * Generates a destroy signature for Cloudinary.
 * Parameters: public_id, timestamp.
 */
export async function generateDestroySignature({ publicId, timestamp, apiSecret }) {
  if (!publicId || !timestamp || !apiSecret) {
    throw new Error('publicId, timestamp, and apiSecret are required');
  }
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  return sha1Hex(toSign);
}

/**
 * Validates that a receiptPublicId strictly matches the group's receipts path.
 */
export function validateReceiptPublicId(publicId, groupId) {
  if (!publicId || typeof publicId !== 'string' || !groupId) return false;
  const regex = new RegExp(`^expenseflow/groups/${groupId}/receipts/[a-zA-Z0-9_.-]+$`);
  return regex.test(publicId);
}

/**
 * Calls Cloudinary Destroy API server-side.
 */
export async function destroyCloudinaryAsset({ cloudName, apiKey, apiSecret, publicId, fetchImpl = fetch }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateDestroySignature({ publicId, timestamp, apiSecret });

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature
  });

  try {
    const res = await fetchImpl(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Cloudinary destroy HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    if (data.result !== 'ok' && data.result !== 'not found') {
      return { success: false, error: `Cloudinary destroy returned: ${JSON.stringify(data)}` };
    }

    return { success: true, result: data.result };
  } catch (err) {
    return { success: false, error: err.message || 'Unknown network error during Cloudinary destroy' };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cloudinary.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/_lib/cloudinary.js tests/cloudinary.test.js
git commit -m "feat(api): add Cloudinary signature and destroy utility module"
```

---

### Task 2: Server-Side Signed Upload Endpoint (`api/cloudinary/sign-upload.js`)

**Files:**
- Create: `api/cloudinary/sign-upload.js`
- Test: `tests/sign-upload.test.js`

**Interfaces:**
- Consumes:
  - `generateUploadSignature` from `api/_lib/cloudinary.js`
  - `verifyToken` from `@clerk/backend`
  - `getDoc`, `parseServiceAccount` from `api/_lib/firebase-rest.js`
- Produces:
  - `handleSignUploadRequest({ method, headers, body, env, requestId })`: returns `{ status, headers, body }` with `{ signature, timestamp, apiKey, cloudName, folder }`.

- [ ] **Step 1: Write failing tests for `/api/cloudinary/sign-upload`**

Create `tests/sign-upload.test.js`:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSignUploadRequest } from '../api/cloudinary/sign-upload.js';
import * as clerkBackend from '@clerk/backend';
import * as firebaseRest from '../api/_lib/firebase-rest.js';

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn()
}));

vi.mock('../api/_lib/firebase-rest.js', () => ({
  parseServiceAccount: vi.fn(),
  getDoc: vi.fn()
}));

describe('POST /api/cloudinary/sign-upload', () => {
  const env = {
    CLERK_SECRET_KEY: 'clerk_sec_123',
    CLOUDINARY_API_KEY: 'cloud_key_123',
    CLOUDINARY_API_SECRET: 'cloud_sec_123',
    CLOUDINARY_CLOUD_NAME: 'test_cloud',
    FIREBASE_SERVICE_ACCOUNT_B64: 'e30='
  };

  beforeEach(() => {
    vi.clearAllMocks();
    firebaseRest.parseServiceAccount.mockReturnValue({ project_id: 'test' });
  });

  it('rejects non-POST methods with 405', async () => {
    const res = await handleSignUploadRequest({
      method: 'GET',
      headers: {},
      body: {},
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(405);
  });

  it('rejects missing or invalid Authorization header with 401', async () => {
    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: {},
      body: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 if groupId is missing or malformed', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_1' });
    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: { groupId: '../invalid/group' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 if group document does not exist', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_1' });
    firebaseRest.getDoc.mockResolvedValue(null);

    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: { groupId: 'grp_missing' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(404);
  });

  it('returns 403 if user is not creator or member of group', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_intruder' });
    firebaseRest.getDoc.mockResolvedValue({
      id: 'grp_1',
      createdBy: 'user_owner',
      memberUserIds: ['user_owner', 'user_member']
    });

    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(403);
  });

  it('returns 200 with signature and enforced folder for verified member', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_member' });
    firebaseRest.getDoc.mockResolvedValue({
      id: 'grp_1',
      createdBy: 'user_owner',
      memberUserIds: ['user_owner', 'user_member']
    });

    const res = await handleSignUploadRequest({
      method: 'POST',
      headers: { authorization: 'Bearer valid_token' },
      body: { groupId: 'grp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.folder).toBe('expenseflow/groups/grp_1/receipts');
    expect(body.apiKey).toBe('cloud_key_123');
    expect(body.cloudName).toBe('test_cloud');
    expect(typeof body.signature).toBe('string');
    expect(typeof body.timestamp).toBe('number');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sign-upload.test.js`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `api/cloudinary/sign-upload.js`**

Create `api/cloudinary/sign-upload.js`:
```javascript
import { verifyToken } from '@clerk/backend';
import { logger, generateRequestId } from '../_lib/logger.js';
import { parseServiceAccount, getDoc } from '../_lib/firebase-rest.js';
import { getCorsHeaders } from '../_lib/cors.js';
import { generateUploadSignature } from '../_lib/cloudinary.js';

const GROUP_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export async function handleSignUploadRequest({ method, headers, body, env, requestId }) {
  const corsHeaders = {
    ...getCorsHeaders(headers.origin),
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders, body: '' };
  }

  if (method !== 'POST') {
    return { status: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed', requestId }) };
  }

  try {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Missing or invalid authorization header', requestId }) };
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    const clerkSecret = env?.CLERK_SECRET_KEY || (typeof process !== 'undefined' ? process.env?.CLERK_SECRET_KEY : null);

    let clerkUserId;
    try {
      const payload = await verifyToken(token, { secretKey: clerkSecret });
      clerkUserId = payload.sub;
    } catch (error) {
      logger.error('clerk_verification_failed', { requestId, error });
      return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid Clerk token', requestId }) };
    }

    const groupId = body?.groupId;
    if (!groupId || !GROUP_ID_RE.test(groupId)) {
      return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Valid groupId is required', requestId }) };
    }

    const cloudName = env?.CLOUDINARY_CLOUD_NAME || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_CLOUD_NAME : null);
    const apiKey = env?.CLOUDINARY_API_KEY || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_KEY : null);
    const apiSecret = env?.CLOUDINARY_API_SECRET || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_SECRET : null);

    if (!cloudName || !apiKey || !apiSecret) {
      logger.error('cloudinary_config_missing', { requestId });
      return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Cloudinary server configuration missing', requestId }) };
    }

    // Verify group membership in Firestore
    const saB64 = env?.FIREBASE_SERVICE_ACCOUNT_B64 || (typeof process !== 'undefined' ? process.env?.FIREBASE_SERVICE_ACCOUNT_B64 : null);
    const sa = parseServiceAccount(saB64);
    if (!sa) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 not configured');
    }

    const groupDoc = await getDoc(sa, `groups/${groupId}`);
    if (!groupDoc) {
      return { status: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Group not found', requestId }) };
    }

    const isMember = groupDoc.createdBy === clerkUserId || (Array.isArray(groupDoc.memberUserIds) && groupDoc.memberUserIds.includes(clerkUserId));
    if (!isMember) {
      return { status: 403, headers: corsHeaders, body: JSON.stringify({ error: 'You are not a member of this group', requestId }) };
    }

    // Authoritative folder assignment: client cannot override
    const folder = `expenseflow/groups/${groupId}/receipts`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateUploadSignature({ folder, timestamp, apiSecret });

    return {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder
      })
    };
  } catch (error) {
    logger.error('sign_upload_failed', { requestId, error });
    return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error', requestId }) };
  }
}

export default async function handler(reqOrRequest, resOrEnv, ctx) {
  const isNode = resOrEnv && typeof resOrEnv.status === 'function';
  if (isNode) {
    const req = reqOrRequest;
    const res = resOrEnv;
    const requestId = req.headers?.['x-request-id'] || generateRequestId();
    const result = await handleSignUploadRequest({
      method: req.method,
      headers: req.headers || {},
      body: req.body || {},
      env: typeof process !== 'undefined' ? process.env : {},
      requestId
    });
    if (result.headers) {
      Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
    }
    if (result.status === 204) return res.status(204).end();
    return res.status(result.status).json(JSON.parse(result.body));
  }

  // Cloudflare Worker Fetch handler
  const request = reqOrRequest;
  const env = resOrEnv || {};
  const requestId = request.headers?.get?.('x-request-id') || generateRequestId();
  let body = {};
  if (request.method !== 'GET' && request.method !== 'OPTIONS') {
    try {
      body = await request.json();
    } catch {}
  }

  const result = await handleSignUploadRequest({
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    env,
    requestId
  });

  return new Response(result.body, {
    status: result.status,
    headers: result.headers
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sign-upload.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/cloudinary/sign-upload.js tests/sign-upload.test.js
git commit -m "feat(api): implement server-authorized Cloudinary upload signing endpoint"
```

---

### Task 3: Authoritative Receipt Deletion Endpoint (`api/cloudinary/receipt.js`)

**Files:**
- Create: `api/cloudinary/receipt.js`
- Test: `tests/delete-receipt.test.js`

**Interfaces:**
- Consumes:
  - `validateReceiptPublicId`, `destroyCloudinaryAsset` from `api/_lib/cloudinary.js`
  - `verifyToken` from `@clerk/backend`
  - `getDoc`, `setDoc`, `parseServiceAccount` from `api/_lib/firebase-rest.js`
- Produces:
  - `handleDeleteReceiptRequest({ method, headers, body, env, requestId })`: returns status 200 on success, 403 on cross-group tamper, 502 on Cloudinary failure.

- [ ] **Step 1: Write failing tests for `DELETE /api/cloudinary/receipt`**

Create `tests/delete-receipt.test.js`:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDeleteReceiptRequest } from '../api/cloudinary/receipt.js';
import * as clerkBackend from '@clerk/backend';
import * as firebaseRest from '../api/_lib/firebase-rest.js';
import * as cloudinaryUtil from '../api/_lib/cloudinary.js';

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn()
}));

vi.mock('../api/_lib/firebase-rest.js', () => ({
  parseServiceAccount: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn()
}));

vi.mock('../api/_lib/cloudinary.js', async () => {
  const actual = await vi.importActual('../api/_lib/cloudinary.js');
  return {
    ...actual,
    destroyCloudinaryAsset: vi.fn()
  };
});

describe('DELETE /api/cloudinary/receipt', () => {
  const env = {
    CLERK_SECRET_KEY: 'clerk_sec_123',
    CLOUDINARY_API_KEY: 'cloud_key_123',
    CLOUDINARY_API_SECRET: 'cloud_sec_123',
    CLOUDINARY_CLOUD_NAME: 'test_cloud',
    FIREBASE_SERVICE_ACCOUNT_B64: 'e30='
  };

  beforeEach(() => {
    vi.clearAllMocks();
    firebaseRest.parseServiceAccount.mockReturnValue({ project_id: 'test' });
  });

  it('rejects non-DELETE requests with 405', async () => {
    const res = await handleDeleteReceiptRequest({
      method: 'GET',
      headers: {},
      body: {},
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(405);
  });

  it('returns 403 if user is not member of groupId', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_intruder' });
    firebaseRest.getDoc.mockResolvedValueOnce({
      id: 'grp_1',
      createdBy: 'user_owner',
      memberUserIds: ['user_owner']
    });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_1' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(403);
  });

  it('returns 404 if expense document not found', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc
      .mockResolvedValueOnce({ id: 'grp_1', createdBy: 'user_owner', memberUserIds: ['user_owner'] })
      .mockResolvedValueOnce(null);

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_missing' },
      env,
      requestId: 'req_1'
    });
    expect(res.status).toBe(404);
  });

  it('clears Firestore receipt fields directly for legacy expense with null receiptPublicId', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc
      .mockResolvedValueOnce({ id: 'grp_1', createdBy: 'user_owner', memberUserIds: ['user_owner'] })
      .mockResolvedValueOnce({ id: 'exp_1', receiptUrl: 'https://res.cloudinary.com/old/image.jpg' });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(200);
    expect(cloudinaryUtil.destroyCloudinaryAsset).not.toHaveBeenCalled();
    expect(firebaseRest.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      'groups/grp_1/expenses/exp_1',
      { receiptUrl: null, receiptPublicId: null, receiptAssetId: null },
      { merge: true }
    );
  });

  it('calls Cloudinary destroy for authoritative receiptPublicId and clears doc', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc
      .mockResolvedValueOnce({ id: 'grp_1', createdBy: 'user_owner', memberUserIds: ['user_owner'] })
      .mockResolvedValueOnce({
        id: 'exp_1',
        receiptUrl: 'https://res.cloudinary.com/new/image.jpg',
        receiptPublicId: 'expenseflow/groups/grp_1/receipts/asset_1'
      });
    cloudinaryUtil.destroyCloudinaryAsset.mockResolvedValue({ success: true, result: 'ok' });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(200);
    expect(cloudinaryUtil.destroyCloudinaryAsset).toHaveBeenCalledWith(expect.objectContaining({
      publicId: 'expenseflow/groups/grp_1/receipts/asset_1'
    }));
    expect(firebaseRest.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      'groups/grp_1/expenses/exp_1',
      { receiptUrl: null, receiptPublicId: null, receiptAssetId: null },
      { merge: true }
    );
  });

  it('returns 502 Bad Gateway when Cloudinary deletion fails so failure is explicit', async () => {
    clerkBackend.verifyToken.mockResolvedValue({ sub: 'user_owner' });
    firebaseRest.getDoc
      .mockResolvedValueOnce({ id: 'grp_1', createdBy: 'user_owner', memberUserIds: ['user_owner'] })
      .mockResolvedValueOnce({
        id: 'exp_1',
        receiptPublicId: 'expenseflow/groups/grp_1/receipts/asset_1'
      });
    cloudinaryUtil.destroyCloudinaryAsset.mockResolvedValue({ success: false, error: 'Rate limit or network error' });

    const res = await handleDeleteReceiptRequest({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
      body: { groupId: 'grp_1', expenseId: 'exp_1' },
      env,
      requestId: 'req_1'
    });

    expect(res.status).toBe(502);
    expect(firebaseRest.setDoc).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/delete-receipt.test.js`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `api/cloudinary/receipt.js`**

Create `api/cloudinary/receipt.js`:
```javascript
import { verifyToken } from '@clerk/backend';
import { logger, generateRequestId } from '../_lib/logger.js';
import { parseServiceAccount, getDoc, setDoc } from '../_lib/firebase-rest.js';
import { getCorsHeaders } from '../_lib/cors.js';
import { validateReceiptPublicId, destroyCloudinaryAsset } from '../_lib/cloudinary.js';

const ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export async function handleDeleteReceiptRequest({ method, headers, body, env, requestId }) {
  const corsHeaders = {
    ...getCorsHeaders(headers.origin),
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders, body: '' };
  }

  if (method !== 'DELETE') {
    return { status: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed', requestId }) };
  }

  try {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Missing or invalid authorization header', requestId }) };
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    const clerkSecret = env?.CLERK_SECRET_KEY || (typeof process !== 'undefined' ? process.env?.CLERK_SECRET_KEY : null);

    let clerkUserId;
    try {
      const payload = await verifyToken(token, { secretKey: clerkSecret });
      clerkUserId = payload.sub;
    } catch (error) {
      logger.error('clerk_verification_failed', { requestId, error });
      return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid Clerk token', requestId }) };
    }

    const { groupId, expenseId } = body || {};
    if (!groupId || !expenseId || !ID_RE.test(groupId) || !ID_RE.test(expenseId)) {
      return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Valid groupId and expenseId are required', requestId }) };
    }

    const saB64 = env?.FIREBASE_SERVICE_ACCOUNT_B64 || (typeof process !== 'undefined' ? process.env?.FIREBASE_SERVICE_ACCOUNT_B64 : null);
    const sa = parseServiceAccount(saB64);
    if (!sa) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 not configured');
    }

    // 1. Verify group membership
    const groupDoc = await getDoc(sa, `groups/${groupId}`);
    if (!groupDoc) {
      return { status: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Group not found', requestId }) };
    }

    const isMember = groupDoc.createdBy === clerkUserId || (Array.isArray(groupDoc.memberUserIds) && groupDoc.memberUserIds.includes(clerkUserId));
    if (!isMember) {
      return { status: 403, headers: corsHeaders, body: JSON.stringify({ error: 'You are not a member of this group', requestId }) };
    }

    // 2. Fetch authoritative expense record from Firestore
    const expenseDoc = await getDoc(sa, `groups/${groupId}/expenses/${expenseId}`);
    if (!expenseDoc) {
      return { status: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Expense not found', requestId }) };
    }

    const authoritativePublicId = expenseDoc.receiptPublicId;

    // 3. Destroy Cloudinary asset if public ID is present
    if (authoritativePublicId) {
      if (!validateReceiptPublicId(authoritativePublicId, groupId)) {
        logger.error('corrupted_receipt_public_id', { requestId, groupId, expenseId, authoritativePublicId });
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Stored receipt public ID is invalid for this group', requestId }) };
      }

      const cloudName = env?.CLOUDINARY_CLOUD_NAME || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_CLOUD_NAME : null);
      const apiKey = env?.CLOUDINARY_API_KEY || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_KEY : null);
      const apiSecret = env?.CLOUDINARY_API_SECRET || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_SECRET : null);

      const destroyRes = await destroyCloudinaryAsset({
        cloudName,
        apiKey,
        apiSecret,
        publicId: authoritativePublicId
      });

      if (!destroyRes.success) {
        logger.error('cloudinary_receipt_destroy_failed', { requestId, groupId, expenseId, error: destroyRes.error });
        return { status: 502, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to delete receipt image from Cloudinary', details: destroyRes.error, requestId }) };
      }
    }

    // 4. Update Firestore doc to nullify receipt fields
    await setDoc(sa, `groups/${groupId}/expenses/${expenseId}`, {
      receiptUrl: null,
      receiptPublicId: null,
      receiptAssetId: null
    }, { merge: true });

    logger.info('receipt_deleted_successfully', { requestId, groupId, expenseId });
    return { status: 200, headers: corsHeaders, body: JSON.stringify({ success: true, requestId }) };
  } catch (error) {
    logger.error('delete_receipt_failed', { requestId, error });
    return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error', requestId }) };
  }
}

export default async function handler(reqOrRequest, resOrEnv, ctx) {
  const isNode = resOrEnv && typeof resOrEnv.status === 'function';
  if (isNode) {
    const req = reqOrRequest;
    const res = resOrEnv;
    const requestId = req.headers?.['x-request-id'] || generateRequestId();
    const result = await handleDeleteReceiptRequest({
      method: req.method,
      headers: req.headers || {},
      body: req.body || {},
      env: typeof process !== 'undefined' ? process.env : {},
      requestId
    });
    if (result.headers) {
      Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
    }
    if (result.status === 204) return res.status(204).end();
    return res.status(result.status).json(JSON.parse(result.body));
  }

  // Cloudflare Worker Fetch handler
  const request = reqOrRequest;
  const env = resOrEnv || {};
  const requestId = request.headers?.get?.('x-request-id') || generateRequestId();
  let body = {};
  if (request.method !== 'GET' && request.method !== 'OPTIONS') {
    try {
      body = await request.json();
    } catch {}
  }

  const result = await handleDeleteReceiptRequest({
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    env,
    requestId
  });

  return new Response(result.body, {
    status: result.status,
    headers: result.headers
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/delete-receipt.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/cloudinary/receipt.js tests/delete-receipt.test.js
git commit -m "feat(api): implement authoritative server-side receipt deletion endpoint"
```

---

### Task 4: Worker Route Mounting & Cascade Asset Deletion in `api/delete-group.js`

**Files:**
- Modify: `worker.js:84-100`
- Modify: `api/delete-group.js:80-98`
- Modify: `tests/worker-routing.test.js`

**Interfaces:**
- Consumes:
  - `handleSignUpload` from `api/cloudinary/sign-upload.js`
  - `handleDeleteReceipt` from `api/cloudinary/receipt.js`
  - `listCollectionDocs` from `api/_lib/firebase-rest.js`
  - `destroyCloudinaryAsset` from `api/_lib/cloudinary.js`

- [ ] **Step 1: Write routing tests in `tests/worker-routing.test.js`**

Add tests for `/api/cloudinary/sign-upload` and `/api/cloudinary/receipt` dispatch to `tests/worker-routing.test.js`.

- [ ] **Step 2: Mount routes in `worker.js`**

Update `worker.js`:
```javascript
import handleSignUpload from './api/cloudinary/sign-upload.js';
import handleDeleteReceipt from './api/cloudinary/receipt.js';
...
    if (pathname === '/api/cloudinary/sign-upload') {
      return handleSignUpload(request, env, ctx);
    }
    if (pathname === '/api/cloudinary/receipt') {
      return handleDeleteReceipt(request, env, ctx);
    }
```

- [ ] **Step 3: Update `api/delete-group.js` with exact asset deletion cascade**

Before `recursiveDeleteGroup(sa, groupId)`:
```javascript
    // Cascade delete exact Cloudinary assets belonging to this group
    try {
      const expenses = await listCollectionDocs(sa, `groups/${groupId}/expenses`);
      const cloudName = env?.CLOUDINARY_CLOUD_NAME || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_CLOUD_NAME : null);
      const apiKey = env?.CLOUDINARY_API_KEY || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_KEY : null);
      const apiSecret = env?.CLOUDINARY_API_SECRET || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_SECRET : null);

      if (cloudName && apiKey && apiSecret && Array.isArray(expenses)) {
        for (const exp of expenses) {
          const parsed = fromFirestoreDoc(exp);
          const publicId = parsed?.receiptPublicId;
          if (publicId && publicId.startsWith(`expenseflow/groups/${groupId}/receipts/`)) {
            const destroyRes = await destroyCloudinaryAsset({ cloudName, apiKey, apiSecret, publicId });
            if (!destroyRes.success) {
              logger.error('group_receipt_cleanup_failed', { requestId, groupId, publicId, error: destroyRes.error });
            }
          }
        }
      }
    } catch (cleanErr) {
      logger.error('group_receipt_cascade_failed', { requestId, groupId, error: cleanErr.message });
    }
```

- [ ] **Step 4: Run worker routing and group deletion tests**

Run: `npx vitest run tests/worker-routing.test.js tests/delete-group.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add worker.js api/delete-group.js tests/worker-routing.test.js
git commit -m "feat(worker): mount Cloudinary routes and add exact asset deletion to group cascade"
```

---

### Task 5: Hardened Firestore Security Rules & Rule Tests (`firestore.rules`)

**Files:**
- Modify: `firestore.rules:67-72`
- Modify: `tests/firestore.rules.test.js`

**Interfaces:**
- Produces:
  - `isValidReceiptUrl(url, gid)`: checks hostname and string size.
  - `isValidReceiptPublicId(publicId, gid)`: checks exact group namespace pattern.

- [ ] **Step 1: Write failing rule tests in `tests/firestore.rules.test.js`**

Add tests covering:
1. Valid Cloudinary URL & matching group `receiptPublicId` -> PASS.
2. Cross-group `receiptPublicId` (`expenseflow/groups/otherGroup/receipts/img`) -> FAIL.
3. Malicious non-Cloudinary `receiptUrl` (`https://evil.com/x.jpg`) -> FAIL.
4. Legacy expense (valid `receiptUrl`, `receiptPublicId: null`) -> PASS.
5. Deletion of expense document by group member -> PASS.

- [ ] **Step 2: Update `firestore.rules`**

Add validation helpers and rule constraints:
```javascript
    function isValidReceiptUrl(url, gid) {
      return url == null || (
        url is string &&
        url.size() < 1024 &&
        url.matches('^https://res\\.cloudinary\\.com/[a-zA-Z0-9_-]+/image/upload/.*')
      );
    }

    function isValidReceiptPublicId(publicId, gid) {
      return publicId == null || (
        publicId is string &&
        publicId.size() < 256 &&
        publicId.matches('^expenseflow/groups/' + gid + '/receipts/[a-zA-Z0-9_.-]+$')
      );
    }

    match /groups/{groupId} {
      ...
      match /expenses/{expenseId} {
        allow read: if canAccessGroup(groupId);
        allow create: if canAccessGroup(groupId)
                      && isValidReceiptUrl(request.resource.data.get('receiptUrl', null), groupId)
                      && isValidReceiptPublicId(request.resource.data.get('receiptPublicId', null), groupId);
        allow update: if canAccessGroup(groupId) && isClerkUser()
                      && isValidReceiptUrl(request.resource.data.get('receiptUrl', null), groupId)
                      && isValidReceiptPublicId(request.resource.data.get('receiptPublicId', null), groupId);
        allow delete: if canAccessGroup(groupId) && isClerkUser();
      }
    }
```

- [ ] **Step 3: Run firestore rules tests**

Run: `npm run test:rules`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add firestore.rules tests/firestore.rules.test.js
git commit -m "sec(firestore): bind receiptPublicId to groupId and validate Cloudinary URL pattern"
```

---

### Task 6: Frontend URL Transformation & Signed Upload Hook

**Files:**
- Create: `client/src/utils/cloudinary.js`
- Test: `client/src/utils/__tests__/cloudinary.test.js`
- Modify: `client/src/hooks/useReceiptUpload.js`

**Interfaces:**
- Produces:
  - `transformReceiptThumbnail(url)`: returns URL with `w_64,h_64,c_fill,f_auto,q_auto`.
  - `transformReceiptLightbox(url)`: returns URL with `w_1200,f_auto,q_auto`.
  - `useReceiptUpload(groupId)`: returns `{ uploadReceipt, isUploading, progress, error }` resolving `{ url, publicId, assetId }`.

- [ ] **Step 1: Write failing unit test for URL transformation**

Create `client/src/utils/__tests__/cloudinary.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { transformReceiptThumbnail, transformReceiptLightbox } from '../cloudinary.js';

describe('Cloudinary URL Transformation Helper', () => {
  const sampleUrl = 'https://res.cloudinary.com/expenseflow/image/upload/v1711000/expenseflow/groups/g1/receipts/rec_1.jpg';

  it('injects thumbnail transforms cleanly at /upload/', () => {
    const thumb = transformReceiptThumbnail(sampleUrl);
    expect(thumb).toBe('https://res.cloudinary.com/expenseflow/image/upload/w_64,h_64,c_fill,f_auto,q_auto/v1711000/expenseflow/groups/g1/receipts/rec_1.jpg');
  });

  it('injects lightbox transforms cleanly at /upload/', () => {
    const lightbox = transformReceiptLightbox(sampleUrl);
    expect(lightbox).toBe('https://res.cloudinary.com/expenseflow/image/upload/w_1200,f_auto,q_auto/v1711000/expenseflow/groups/g1/receipts/rec_1.jpg');
  });

  it('leaves non-Cloudinary or already transformed URLs intact', () => {
    expect(transformReceiptThumbnail('https://example.com/photo.png')).toBe('https://example.com/photo.png');
    expect(transformReceiptThumbnail(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run client/src/utils/__tests__/cloudinary.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement `client/src/utils/cloudinary.js`**

Create `client/src/utils/cloudinary.js`:
```javascript
/**
 * Safe Cloudinary URL Transformation Utility
 * Replaces direct string splitting with regex-anchored injection.
 */

const CLOUDINARY_UPLOAD_RE = /(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!w_\d+)/;

export function transformReceiptThumbnail(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace(CLOUDINARY_UPLOAD_RE, '$1w_64,h_64,c_fill,f_auto,q_auto/');
}

export function transformReceiptLightbox(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace(CLOUDINARY_UPLOAD_RE, '$1w_1200,f_auto,q_auto/');
}
```

- [ ] **Step 4: Refactor `client/src/hooks/useReceiptUpload.js`**

Update `useReceiptUpload` to fetch signature from `/api/cloudinary/sign-upload` and upload to Cloudinary:
```javascript
import { useState } from "react";
import { useAuth } from "./useAuth";

export function useReceiptUpload(groupId) {
  const { session } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadReceipt = async (file) => {
    if (!groupId) {
      throw new Error("Group ID is required for receipt upload");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      const err = new Error("Invalid file type. Only JPG, PNG, and WebP are allowed.");
      setError(err.message);
      throw err;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const err = new Error("File is too large. Max size is 5MB.");
      setError(err.message);
      throw err;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Get signed authorization from backend
      const token = session ? await session.getToken() : null;
      const signRes = await fetch("/api/cloudinary/sign-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ groupId })
      });

      if (!signRes.ok) {
        const errData = await signRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to obtain upload authorization");
      }

      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      // 2. Upload to Cloudinary with signed parameters
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", folder);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          setIsUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve({
                url: res.secure_url,
                publicId: res.public_id,
                assetId: res.asset_id
              });
            } catch {
              reject(new Error("Failed to parse Cloudinary response"));
            }
          } else {
            reject(new Error("Cloudinary upload failed"));
          }
        });

        xhr.addEventListener("error", () => {
          setIsUploading(false);
          reject(new Error("Network error during receipt upload"));
        });

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);
        xhr.send(formData);
      });
    } catch (err) {
      setError(err.message);
      setIsUploading(false);
      throw err;
    }
  };

  return { uploadReceipt, isUploading, progress, error };
}
```

- [ ] **Step 5: Run tests to verify**

Run: `npx vitest run client/src/utils/__tests__/cloudinary.test.js`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add client/src/utils/cloudinary.js client/src/utils/__tests__/cloudinary.test.js client/src/hooks/useReceiptUpload.js
git commit -m "feat(client): implement safe URL transforms and signed upload hook"
```

---

### Task 7: Frontend Form & Client API Integration

**Files:**
- Modify: `client/src/components/ExpenseForm.jsx`
- Modify: `client/src/components/ReceiptUpload.jsx`
- Modify: `client/src/api/client.js`

**Interfaces:**
- Fixes `ExpenseForm.jsx` edit state bug preserving `receiptUrl`, `receiptPublicId`, and `receiptAssetId`.
- Updates `client/src/api/client.js` to persist receipt metadata on expense creation.

- [ ] **Step 1: Fix `ExpenseForm.jsx` state initialization and submission**

In `client/src/components/ExpenseForm.jsx`:
Update `useEffect` when `initialData` is present:
```javascript
      setForm({
        amount: String(initialData.amount),
        paidBy: String(initialData.paidBy),
        category: initialData.category,
        description: initialData.description || "",
        createdAt: initialData.createdAt,
        split_type: initialData.split_type || "equal",
        split_members: initialData.splits?.map((s) => s.member_id) || [],
        receiptUrl: initialData.receiptUrl || null,
        receiptPublicId: initialData.receiptPublicId || null,
        receiptAssetId: initialData.receiptAssetId || null,
      });
```
And on reset:
```javascript
        receiptUrl: null,
        receiptPublicId: null,
        receiptAssetId: null,
```
And in `handleSubmit`:
```javascript
      await onSubmit({
        group_id: currentGroup.id,
        paidBy: parseInt(form.paidBy),
        amount,
        category: form.category,
        description: form.description,
        createdAt: form.createdAt,
        split_type: form.split_type,
        receiptUrl: form.receiptUrl || null,
        receiptPublicId: form.receiptPublicId || null,
        receiptAssetId: form.receiptAssetId || null,
        split_members: ...
      });
```

- [ ] **Step 2: Update `ReceiptUpload.jsx` to use safe transformation helpers and handle receipt metadata**

In `client/src/components/ReceiptUpload.jsx`:
- Import `transformReceiptThumbnail`, `transformReceiptLightbox` from `../utils/cloudinary`.
- Update `ReceiptIndicator` to use `transformReceiptThumbnail(receiptUrl)`.
- Update `ReceiptUpload` component to accept `groupId` prop, call `useReceiptUpload(groupId)`, and on change pass `{ receiptUrl, receiptPublicId, receiptAssetId }` (or url for backward compatibility).

- [ ] **Step 3: Update `client/src/api/client.js`**

In `createExpense`:
```javascript
export const createExpense = async (groupId, data) => {
  const expenseData = {
    ...data,
    paidBy: data.paidBy,
    receiptUrl: data.receiptUrl || null,
    receiptPublicId: data.receiptPublicId || null,
    receiptAssetId: data.receiptAssetId || null,
    createdAt: data.createdAt || new Date().toISOString(),
    splits: data.splits || null
  };

  const docRef = await addDoc(collection(db, "groups", groupId, "expenses"), expenseData);
  return { success: true, data: { id: docRef.id, ...expenseData } };
};
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ExpenseForm.jsx client/src/components/ReceiptUpload.jsx client/src/api/client.js
git commit -m "fix(client): preserve receipt metadata in ExpenseForm and save to Firestore"
```

---

### Task 8: Production Verification & Secret Scan

**Files:**
- Scan: `client/.env*`
- Scan: `client/dist/`
- Run: Full test suite

- [ ] **Step 1: Verify removal of `VITE_CLOUDINARY_UPLOAD_PRESET`**

Ensure `VITE_CLOUDINARY_UPLOAD_PRESET` is not present in `.env`, `.env.example`, or client code.

- [ ] **Step 2: Build the client**

Run: `npm run build`  
Expected: Clean build with zero errors.

- [ ] **Step 3: Secret scan on built assets**

Check `client/dist/` for any appearance of `CLOUDINARY_API_SECRET` or secret tokens:
```bash
grep -rn "CLOUDINARY_API_SECRET" client/dist/ || echo "PASS: Zero secrets in client dist"
```

- [ ] **Step 4: Run full test suite**

Run: `npm run test`  
Expected: All tests pass.

- [ ] **Step 5: Commit final adjustments**

```bash
git commit -m "chore(release): complete secure Cloudinary refactor and verify client bundle hygiene"
```
