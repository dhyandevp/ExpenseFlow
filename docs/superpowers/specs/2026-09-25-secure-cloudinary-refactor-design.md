# Secure & Production-Grade Cloudinary Architecture Design

**Date:** 2026-09-25  
**Topic:** Secure Cloudinary Refactor (Signed Uploads, Strict Group Namespace Isolation, Authoritative Deletion, Firestore Rules Enforcement)  
**Status:** Approved with User Enhancements  

---

## 1. Overview & Objective

Refactor ExpenseFlow's legacy direct browser-to-Cloudinary unsigned upload flow into a hardened, server-authorized architecture.

### Core Invariants & Strict Requirements
1. **Zero Unsigned Presets**: No public unsigned upload presets. All uploads require server-generated HMAC-SHA1 signatures.
2. **Strict Group Namespace Isolation**: Assets stored under `expenseflow/groups/{groupId}/receipts/{asset}`. Client cannot specify or override folder path.
3. **Authoritative Server-Side Resolution for Deletion**: Client never provides `publicId` for deletion. Client provides only `{ groupId, expenseId }`. The Worker retrieves the authoritative `receiptPublicId` directly from Firestore.
4. **Strict Group Membership Verification**: Authenticated Clerk user must be a verified member of `groupId` before generating an upload signature or executing deletion.
5. **Granular Firestore Rule Validation**: `receiptPublicId` must match the specific group ID of the document (`expenseflow/groups/{groupId}/receipts/...`), preventing group members from writing references to another group's assets. `receiptUrl` must match Cloudinary's hostname and expected group path structure.
6. **Explicit Deletion Tracking**: Group deletion queries exact stored `receiptPublicId` values and deletes them specifically, rather than blindly deleting an entire prefix. Cloudinary deletion errors are explicitly logged and surfaced.
7. **No Secret Leakage**: `CLOUDINARY_API_SECRET` remains server-side only in Cloudflare Worker environment bindings.
8. **Delivery Scope**: Option A — standard Cloudinary CDN delivery with random Cloudinary-generated public IDs, with group authorization strictly enforced at upload, mutation, deletion, and database levels.
9. **Backward Compatibility**: Existing expense documents containing only `receiptUrl` continue to render properly.

---

## 2. Architecture & Data Flow

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │ BROWSER (Client SPA)                                                   │
 │                                                                        │
 │  1. User selects receipt in ExpenseForm (for verified groupId)         │
 │  2. Client-side validation (MIME: JPG/PNG/WebP, Size: ≤5MB)            │
 │  3. Request signature:                                                 │
 │     POST /api/cloudinary/sign-upload { groupId }                       │
 │     Header: Authorization: Bearer <clerk_token>                        │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ CLOUDFLARE WORKER (/api/cloudinary/sign-upload)                        │
 │                                                                        │
 │  - Verifies Clerk JWT via @clerk/backend                               │
 │  - Fetches Firestore group doc via service account REST API            │
 │  - Verifies user is member or creator of groupId (403 if not)          │
 │  - Constructs folder: "expenseflow/groups/{verifiedGroupId}/receipts"  │
 │  - Generates HMAC-SHA1 signature over (folder, timestamp)              │
 │  - Returns: { signature, timestamp, apiKey, cloudName, folder }        │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ BROWSER                                                                │
 │                                                                        │
 │  4. POST multipart/form-data to Cloudinary signed upload endpoint:     │
 │     https://api.cloudinary.com/v1_1/{cloudName}/image/upload           │
 │     Payload: file, api_key, timestamp, signature, folder               │
 │  5. Cloudinary returns: secure_url, public_id, asset_id                │
 │  6. Form state updated: { receiptUrl, receiptPublicId, receiptAssetId }│
 │  7. Firestore saves expense document with full receipt metadata        │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ User deletes receipt or expense
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ CLOUDFLARE WORKER (/api/cloudinary/receipt)                            │
 │                                                                        │
 │  1. DELETE /api/cloudinary/receipt { groupId, expenseId }              │
 │  2. Verifies user membership in groupId                                │
 │  3. Reads Firestore doc: groups/{groupId}/expenses/{expenseId}         │
 │  4. Obtains authoritative `receiptPublicId` from database record       │
 │  5. Verifies `receiptPublicId` starts with expected group folder       │
 │  6. Calls Cloudinary Destroy API server-side with API secret           │
 │  7. Updates/clears receipt fields on Firestore expense document        │
 │  8. If Cloudinary fails: logs error, returns explicit error status     │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Server Endpoints & Security

### 3.1 `POST /api/cloudinary/sign-upload`
- **Headers**: `Authorization: Bearer <clerkToken>`
- **Body**: `{ "groupId": "<string>" }`
- **Process**:
  1. Authenticate user via Clerk token $\rightarrow$ extract `userId`.
  2. Validate `groupId` format `/^[a-zA-Z0-9_-]{1,128}$/`.
  3. Load `groups/{groupId}` from Firestore using `FIREBASE_SERVICE_ACCOUNT_B64`.
  4. Verify membership: `group.createdBy === userId || group.memberUserIds.includes(userId)`. Return `403` if unauthorized.
  5. Authoritative folder assignment: `expenseflow/groups/${groupId}/receipts` (reject/ignore any client folder).
  6. Compute SHA-1 signature of parameters `folder=${folder}&timestamp=${timestamp}` appended with `CLOUDINARY_API_SECRET`.
  7. Return `{ signature, timestamp, apiKey: CLOUDINARY_API_KEY, cloudName: CLOUDINARY_CLOUD_NAME, folder }`.

### 3.2 `DELETE /api/cloudinary/receipt`
- **Headers**: `Authorization: Bearer <clerkToken>`
- **Body**: `{ "groupId": "<string>", "expenseId": "<string>" }`
- **Process**:
  1. Authenticate user via Clerk token $\rightarrow$ extract `userId`.
  2. Validate `groupId` and `expenseId`.
  3. Verify user membership in `groupId` from `groups/{groupId}` (Return `403` if unauthorized).
  4. Read `groups/{groupId}/expenses/{expenseId}`. If not found, return `404`.
  5. Extract authoritative `receiptPublicId` from document. If `receiptPublicId` is missing (legacy expense), skip Cloudinary destroy and simply clear Firestore receipt fields.
  6. Security integrity check: Ensure `receiptPublicId.startsWith('expenseflow/groups/' + groupId + '/receipts/')`. Return `400` if compromised.
  7. Call Cloudinary Destroy API: `POST https://api.cloudinary.com/v1_1/${cloudName}/image/destroy` with signed parameters (`public_id`, `timestamp`, `signature`, `api_key`).
  8. If Cloudinary destroy fails: Log `cloudinary_destroy_failed` with `requestId`, `groupId`, `expenseId`, and error details; return `502` / error so failure is explicit and retryable.
  9. Update Firestore expense document to set `receiptUrl = null`, `receiptPublicId = null`, `receiptAssetId = null`.

### 3.3 Group Deletion Cascade (`api/delete-group.js`)
- Before executing `recursiveDeleteGroup(sa, groupId)`:
  1. Query all documents in `groups/${groupId}/expenses`.
  2. Extract all non-null `receiptPublicId` values belonging strictly to `expenseflow/groups/${groupId}/receipts/`.
  3. Sequentially or batch delete each verified `receiptPublicId` via Cloudinary Destroy API.
  4. If any Cloudinary deletion fails, log `group_receipt_cleanup_failed` with exact public IDs for audit and retry.
  5. Complete Firestore recursive group deletion.

---

## 4. Firestore Security Rules Hardening

In `firestore.rules` under `match /groups/{groupId}/expenses/{expenseId}`:

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

match /expenses/{expenseId} {
  allow read: if canAccessGroup(groupId);
  allow create: if canAccessGroup(groupId)
                && isValidReceiptUrl(request.resource.data.get('receiptUrl', null), groupId)
                && isValidReceiptPublicId(request.resource.data.get('receiptPublicId', null), groupId);
  allow update, delete: if canAccessGroup(groupId) && isClerkUser()
                && isValidReceiptUrl(request.resource.data.get('receiptUrl', null), groupId)
                && isValidReceiptPublicId(request.resource.data.get('receiptPublicId', null), groupId);
}
```

This prevents a malicious group member from setting `receiptPublicId` to another group's assets or setting `receiptUrl` to arbitrary phishing or non-Cloudinary links.

---

## 5. Frontend Implementation

### 5.1 `client/src/hooks/useReceiptUpload.js`
- Accepts `groupId`.
- Calls `POST /api/cloudinary/sign-upload` with Clerk session token and `groupId`.
- Executes XHR upload to Cloudinary signed endpoint with `file`, `api_key`, `timestamp`, `signature`, `folder`.
- Resolves `{ url: secure_url, publicId: public_id, assetId: asset_id }`.

### 5.2 `client/src/components/ExpenseForm.jsx`
- Fix edit bug: in `useEffect` when `initialData` exists, include:
  - `receiptUrl: initialData.receiptUrl || null`
  - `receiptPublicId: initialData.receiptPublicId || null`
  - `receiptAssetId: initialData.receiptAssetId || null`
- Upon submission, pass all receipt fields to `onSubmit`.

### 5.3 `client/src/utils/cloudinary.js`
- Robust regex-based URL transformation helper:
  - Injects `w_64,h_64,c_fill,f_auto,q_auto` for thumbnails.
  - Injects `w_1200,f_auto,q_auto` for lightbox modals.
  - Leaves non-Cloudinary URLs untouched.

---

## 6. Test Plan Matrix

| Test Case | Scenario | Expected Result |
| :--- | :--- | :--- |
| **Upload Auth** | User A $\rightarrow$ Group A upload sign request | **PASS (200)** — Valid HMAC signature & folder |
| **Cross-Group Upload** | User A $\rightarrow$ Group B upload sign request | **DENY (403)** — Not a group member |
| **Unauthenticated Upload** | No token $\rightarrow$ sign request | **DENY (401)** |
| **Delete Auth** | User A $\rightarrow$ Group A delete receipt | **PASS (200)** — Cloudinary destroyed & Firestore updated |
| **Cross-Group Delete** | User A $\rightarrow$ Group B delete receipt | **DENY (403)** |
| **Firestore Cross-Group Tamper** | User A attempts writing `expenseflow/groups/groupB/...` to Group A doc | **DENY** — Blocked by Firestore rule |
| **Firestore URL Tamper** | User attempts writing `https://malicious-site.com/exploit.png` | **DENY** — Blocked by Firestore rule |
| **Group Delete Cleanup** | Delete group containing receipts | **PASS** — Cloudinary assets deleted before group purge |
| **Expense Edit Preservation** | Edit unrelated field on expense with receipt | **PASS** — `receiptUrl` and `receiptPublicId` preserved |
| **Backward Compatibility** | Load & render legacy expense with only `receiptUrl` | **PASS** — Renders seamlessly |
| **Secret Scan** | Inspect `client/dist/` build | **PASS** — Zero Cloudinary secrets in client bundle |
