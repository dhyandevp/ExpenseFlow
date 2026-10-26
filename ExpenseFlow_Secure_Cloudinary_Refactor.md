# ExpenseFlow — Secure & Production-Grade Cloudinary Refactor

## Objective

Refactor ExpenseFlow's current Cloudinary integration into a secure, production-ready architecture.

The most important requirement is:

> Every ExpenseFlow group must have its own isolated Cloudinary folder, and users must only be able to upload, access, replace, or delete receipt assets belonging to groups they are authorized to access.

The existing implementation uses direct browser-to-Cloudinary unsigned uploads. The Cloudflare Worker is currently not involved in Cloudinary operations, receipt metadata is incomplete, and Cloudinary assets are not cleaned up when expenses/groups are deleted.

---

# 1. Target Architecture

Replace:

```text
Browser
   ↓
Cloudinary unsigned upload
   ↓
Firestore
```

with:

```text
                    ┌─────────────────────┐
                    │      Browser        │
                    │   ExpenseFlow SPA   │
                    └──────────┬──────────┘
                               │
                     Authenticated request
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Cloudflare Worker  │
                    │                     │
                    │ Auth verification  │
                    │ Group authorization│
                    │ Upload signing     │
                    │ Delete operations  │
                    └──────────┬──────────┘
                               │
                       Signed operation
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Cloudinary      │
                    │                     │
                    │ groups/{groupId}/   │
                    │ receipts/...        │
                    └──────────┬──────────┘
                               │
                         Asset metadata
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Firestore       │
                    │                     │
                    │ receiptUrl          │
                    │ receiptPublicId     │
                    │ receiptAssetId      │
                    │ groupId             │
                    └─────────────────────┘
```

The browser must never receive the Cloudinary API secret.

---

# 2. Group-Based Cloudinary Folder Structure

Change the current user-based structure to:

```text
expenseflow/groups/{groupId}/receipts/
```

Example:

```text
expenseflow/
└── groups/
    ├── group_abc123/
    │   └── receipts/
    │       ├── receipt_001
    │       ├── receipt_002
    │       └── receipt_003
    │
    ├── group_xyz789/
    │   └── receipts/
    │       ├── receipt_001
    │       └── receipt_002
    │
    └── group_test456/
        └── receipts/
```

The group ID must come from the authenticated application's group context.

Do **not** trust an arbitrary folder value supplied by the browser.

---

# 3. Group Authorization

Before generating any Cloudinary upload signature, the Cloudflare Worker must verify:

1. The user is authenticated.
2. The requested group exists.
3. The authenticated user belongs to that group.
4. The user has permission to upload/manage receipts in that group.
5. The group ID used for the Cloudinary folder matches the authorized group.

Flow:

```text
Browser
  ↓
POST /api/cloudinary/sign-upload
  ↓
Authenticate user
  ↓
Extract trusted user ID
  ↓
Validate requested group
  ↓
Check group membership
  ↓
Check upload permission
  ↓
Generate Cloudinary signature
  ↓
Return signed upload parameters
```

Unauthorized requests must receive an appropriate `401` or `403`.

Never generate a Cloudinary signature before authorization succeeds.

---

# 4. Never Trust Client-Supplied Folder Values

The client must not be able to submit an arbitrary Cloudinary folder such as:

```text
folder=expenseflow/groups/some-other-group
```

The client may provide a `groupId`, but the Worker must verify it and construct the folder itself:

```text
Client
  ↓
groupId
  ↓
Worker verifies membership
  ↓
Worker constructs:
expenseflow/groups/{verifiedGroupId}/receipts
```

---

# 5. Signed Cloudinary Uploads

Remove the current unsigned upload architecture.

Implement an authenticated signed-upload endpoint such as:

```text
POST /api/cloudinary/sign-upload
```

The Worker should:

1. Authenticate the request.
2. Verify group membership.
3. Validate upload parameters.
4. Construct the Cloudinary folder.
5. Generate a Cloudinary signature using the server-side API secret.
6. Return only the parameters required by the browser.

Conceptual response:

```json
{
  "signature": "...",
  "timestamp": 1234567890,
  "apiKey": "...",
  "cloudName": "...",
  "folder": "expenseflow/groups/{groupId}/receipts"
}
```

Never return `CLOUDINARY_API_SECRET`.

---

# 6. Cloudinary Secrets

Configure Cloudinary credentials as Cloudflare Worker secrets.

Use server-side secrets such as:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Determine the correct Wrangler/Cloudflare production secret mechanism already used by the project.

Do not place the API secret inside:

- `.env.production`
- `VITE_*`
- client source
- frontend configuration
- static assets
- API responses

After implementation, verify that the production frontend bundle contains no Cloudinary API secret.

---

# 7. Remove the Unsigned Preset Dependency

The existing:

```text
VITE_CLOUDINARY_UPLOAD_PRESET
expenseflow_receipts
```

must no longer be the application's authorization mechanism.

After signed uploads are implemented:

- remove frontend dependence on the unsigned preset
- remove obsolete frontend Cloudinary credentials
- update `.env.example`
- update deployment documentation
- verify the final client bundle
- verify no secret is exposed

Do not delete the Cloudinary preset blindly. First determine whether anything else uses it.

---

# 8. Store Complete Cloudinary Asset Metadata

Do not store only:

```text
receiptUrl
```

Store enough metadata to manage the asset lifecycle.

At minimum, new receipt records should support:

```json
{
  "receiptUrl": "...",
  "receiptPublicId": "...",
  "receiptAssetId": "...",
  "receiptResourceType": "image",
  "receiptFormat": "jpg",
  "receiptVersion": 123,
  "groupId": "..."
}
```

Only store fields actually returned/needed.

The most important fields are:

```text
receiptUrl
receiptPublicId
receiptAssetId
```

---

# 9. Use Cloudinary's Real Public ID

When Cloudinary returns:

```text
public_id
asset_id
secure_url
```

store the actual returned values.

Do not depend on reconstructing `public_id` later by parsing `secure_url`.

---

# 10. Expense Receipt Schema

Review the existing Firestore expense schema.

New documents should contain receipt metadata such as:

```text
groupId
receiptUrl
receiptPublicId
receiptAssetId
```

Existing documents containing only `receiptUrl` must continue rendering correctly.

Do not break existing receipts.

If old assets cannot safely be mapped to a `public_id`, document the migration limitation rather than guessing.

---

# 11. Delete Receipt API

Create a protected backend endpoint such as:

```text
DELETE /api/cloudinary/receipt
```

The endpoint must:

1. Authenticate the user.
2. Identify the expense.
3. Determine its group.
4. Verify group membership.
5. Read the stored `receiptPublicId`.
6. Verify that the asset belongs to the expected group namespace.
7. Delete the Cloudinary asset.
8. Update Firestore.
9. Return a safe result.

Do not allow arbitrary public IDs to be deleted merely because the browser supplied them.

The server must derive the authoritative asset from the Firestore expense record.

---

# 12. Replace Receipt Safely

When replacing a receipt:

```text
Old receipt
     ↓
New upload
     ↓
New Cloudinary asset created
     ↓
Firestore updated
     ↓
Old Cloudinary asset deleted
```

Prefer this order:

```text
Upload new
   ↓
Validate new asset
   ↓
Update Firestore
   ↓
Delete old asset
```

If old-asset deletion fails after a successful update:

- do not unnecessarily roll back the valid new receipt
- log the cleanup failure
- provide a recoverable cleanup path

---

# 13. Delete Expense

When an expense is deleted:

```text
Expense
  ↓
Find receiptPublicId
  ↓
Verify group authorization
  ↓
Delete Cloudinary asset
  ↓
Delete Firestore expense
```

Design the sequence so a Firestore deletion does not silently leave a permanent Cloudinary orphan.

---

# 14. Delete Group

When a group is deleted:

```text
Delete Group
      ↓
Find all group expenses
      ↓
Collect receiptPublicIds
      ↓
Delete associated Cloudinary assets
      ↓
Delete Firestore group data
```

Alternatively, if safely supported, use controlled deletion of the group Cloudinary namespace:

```text
expenseflow/groups/{groupId}/receipts/*
```

Do not blindly delete a Cloudinary prefix without verifying that it belongs exclusively to that group.

---

# 15. User Deletion

Review the existing user deletion webhook.

The group is the ownership boundary, not the individual user.

When a user leaves a group:

- do not delete group receipts if other authorized members still need them
- determine what happens when a user deletes their account
- only remove group assets when the group itself is being deleted or when the application's ownership rules require it

---

# 16. Receipt Delivery Security

Review the current public Cloudinary CDN delivery model.

For sensitive financial receipts, implement an appropriate protected delivery architecture supported by the Cloudinary account, such as:

- authenticated delivery
- signed delivery URLs
- short-lived signed delivery URLs

If using signed delivery URLs:

```text
Browser
  ↓
ExpenseFlow API
  ↓
Verify group membership
  ↓
Generate short-lived Cloudinary delivery URL
  ↓
Browser loads receipt
```

Never expose delivery/signing secrets to the browser.

The application's group authorization must remain the authoritative access-control layer.

---

# 17. Group-Aware Receipt Access

A user viewing Group A must not be able to obtain Group B receipts by changing:

```text
groupId
expenseId
receiptPublicId
receiptUrl
```

in browser requests.

Test:

```text
User A ∈ Group A
User A ∉ Group B

User A attempts:
- upload to Group B
- delete Group B receipt
- retrieve Group B receipt
- manipulate Group B expense
```

All unauthorized operations must be rejected.

---

# 18. Firestore Security Rules

Review and strengthen `firestore.rules`.

Receipt-related fields should be validated.

At minimum:

- validate `receiptUrl`
- validate `receiptPublicId`
- prevent receipt metadata from being assigned across groups
- preserve group membership authorization
- prevent unauthorized expense modification
- prevent arbitrary external receipt URLs if Cloudinary-only storage is required

Test:

```text
authorized group member
unauthorized user
different group member
unauthenticated user
malicious receiptUrl
malicious receiptPublicId
modified groupId
modified expenseId
```

Do not weaken existing group security.

---

# 19. Server-Side File Validation

Do not rely exclusively on:

```text
<input accept="">
file.type
file.size
```

Enforce upload restrictions through the secure backend/Cloudinary configuration.

Allowed formats:

```text
JPEG/JPG
PNG
WebP
```

Maximum:

```text
5 MB
```

Verify the actual Cloudinary configuration rather than assuming it is correct.

---

# 20. Restrict Cloudinary Upload Parameters

The signing endpoint must control security-sensitive parameters.

Do not blindly accept client-controlled:

```text
folder
public_id
resource_type
transformation
eager
context
tags
```

The server should construct:

```text
resource_type = image
folder = expenseflow/groups/{verifiedGroupId}/receipts
```

Use Cloudinary-generated IDs or safely generated IDs rather than predictable identifiers.

---

# 21. Image Optimization

Keep Cloudinary CDN optimization.

Thumbnail delivery should use an optimized transformation such as:

```text
w_64,h_64,c_fill,f_auto,q_auto
```

For full receipt viewing, do not unnecessarily download the original 5 MB image.

Use an appropriate constrained transformation such as:

```text
w_1200,f_auto,q_auto
```

or an equivalent transformation that preserves receipt readability.

---

# 22. Robust Cloudinary URL Handling

Do not rely on fragile string replacement such as:

```javascript
receiptUrl.replace("/upload/", "/upload/w_64,h_64,c_fill,f_auto,q_auto/")
```

Create a safe Cloudinary URL transformation helper that correctly handles:

- versioned URLs
- existing transformations
- different formats
- Cloudinary URLs
- non-Cloudinary URLs

Do not corrupt URLs.

---

# 23. Fix Expense Edit Receipt Loss

Ensure editing an existing expense preserves:

```text
receiptUrl
receiptPublicId
receiptAssetId
```

If there is no receipt, use `null`.

Editing unrelated expense fields must not silently remove receipt metadata.

---

# 24. Upload Transaction Design

The existing system uploads immediately when a file is selected, which can create orphaned assets if the user cancels the form or the Firestore write fails.

Implement a safer lifecycle:

```text
User selects receipt
       ↓
Secure Cloudinary upload
       ↓
Receive asset metadata
       ↓
Keep asset pending
       ↓
User submits expense
       ↓
Firestore stores asset metadata
       ↓
Asset becomes committed
```

If the user cancels:

```text
Cancel
 ↓
Delete pending Cloudinary asset
```

If immediate cleanup cannot be guaranteed, implement a reliable cleanup mechanism for unreferenced assets.

---

# 25. Cloudinary Metadata / Tags

Where useful, add controlled metadata for lifecycle management, such as:

```text
groupId
expenseId
```

Construct security-sensitive metadata server-side.

Do not store sensitive financial information in public Cloudinary metadata.

---

# 26. Logging

Add safe server-side logging for:

- upload authorization failures
- successful signing
- Cloudinary upload failures
- Cloudinary deletion failures
- group cleanup failures
- orphan cleanup failures

Never log:

- `CLOUDINARY_API_SECRET`
- authentication tokens
- sensitive receipt contents
- private signing material

---

# 27. Error Handling

Handle:

```text
400
401
403
413
429
500
Cloudinary errors
Firestore errors
network errors
signature failures
```

Return safe errors to the browser.

Do not expose secrets, stack traces, or internal credentials.

---

# 28. Abuse Protection

Protect the signing endpoint with appropriate controls available in the existing Cloudflare architecture.

Consider:

- per-user rate limiting
- per-group rate limiting
- upload frequency limits
- file-size limits
- authentication requirements

Do not introduce arbitrary limits that break normal ExpenseFlow usage.

---

# 29. Migration of Existing Receipts

Inspect existing Firestore expense documents.

Determine which records have:

```text
receiptUrl
```

but lack:

```text
receiptPublicId
```

Create a migration strategy.

Do not blindly guess public IDs from URLs.

If a reliable mapping exists, verify it before writing migration data.

If not, document which records require manual migration.

---

# 30. Backward Compatibility

Existing expenses containing only:

```text
receiptUrl
```

must continue to render.

New expenses should contain:

```text
receiptUrl
receiptPublicId
receiptAssetId
```

Do not introduce destructive schema changes.

---

# 31. Remove Obsolete Cloudinary Code

After the new system works, search for:

```text
unsigned
upload_preset
VITE_CLOUDINARY_UPLOAD_PRESET
CLOUDINARY_API_SECRET
CLOUDINARY_API_KEY
cloudinary
receiptPublicId
```

Remove obsolete code and configuration.

Do not remove anything still required.

---

# 32. Automated Test Matrix

Create tests for:

## Upload

- authenticated user
- unauthenticated user
- valid group
- invalid group
- user outside group
- valid JPG
- valid PNG
- valid WebP
- oversized file
- invalid format

## Authorization

- Group A member → Group A
- Group A member → Group B
- Group B member → Group A
- non-member → any group

## Delete

- delete receipt
- replace receipt
- delete expense
- delete group

## Security

- forged group ID
- forged expense ID
- forged public ID
- arbitrary folder
- arbitrary public ID
- malicious receipt URL
- direct upload using the old unsigned preset

## Edit

- edit expense with receipt
- edit expense without receipt
- edit unrelated fields while preserving receipt

---

# 33. Production Security Verification

Before declaring completion, verify:

- [ ] Cloudinary API secret exists only as a Worker secret
- [ ] API secret never appears in frontend bundle
- [ ] Unsigned upload is no longer used by ExpenseFlow
- [ ] Upload requires authentication
- [ ] Group membership is verified server-side
- [ ] Folder is generated server-side
- [ ] Every group has its own Cloudinary namespace
- [ ] Client cannot choose another group's folder
- [ ] Public ID is stored
- [ ] Asset ID is stored where useful
- [ ] Receipt deletion removes the Cloudinary asset
- [ ] Receipt replacement cleans the old asset
- [ ] Group deletion cleans group assets
- [ ] Cancelled uploads do not accumulate indefinitely
- [ ] Existing receipts remain compatible
- [ ] Firestore rules validate receipt metadata
- [ ] Cloudinary format restrictions are enforced
- [ ] 5 MB limit is enforced
- [ ] Receipt delivery is appropriately protected
- [ ] Thumbnail delivery is optimized
- [ ] Full receipt delivery is optimized
- [ ] URL transformation is robust
- [ ] Abuse protection is implemented where appropriate
- [ ] Errors do not leak secrets
- [ ] Tests cover cross-group access

---

# 34. Do Not Use a False Security Model

Do **not** claim:

```text
Cloudinary folder = security
```

Folders are an organizational namespace.

The actual security boundary must be:

```text
Authenticated user
        ↓
ExpenseFlow authorization
        ↓
Verified group membership
        ↓
Cloudinary operation
```

A user cannot gain access to another group's assets merely because they know or manipulate a Cloudinary path.

---

# 35. Final Implementation Report

After implementation, provide:

## A. Files Changed

List every modified file and why it changed.

## B. Final Cloudinary Architecture

Show the final architecture diagram.

## C. Group Folder Architecture

Show examples such as:

```text
expenseflow/groups/{groupId}/receipts/{asset}
```

Explain how Group A and Group B are separated.

## D. Authentication

Explain how the Worker authenticates the user.

## E. Authorization

Explain exactly how group membership is verified.

## F. Cloudinary Security

Explain:

- signed uploads
- secret storage
- upload restrictions
- delivery security
- deletion
- cleanup

## G. Database Schema

Show the final receipt fields.

## H. Migration

Explain how old `receiptUrl` records are handled.

## I. Tests

Report each security test as:

```text
PASS
FAIL
NOT VERIFIED
```

## J. Remaining Risks

List anything requiring manual Cloudinary dashboard configuration or production verification.

---

# 36. Final Acceptance Criteria

Do not declare the implementation complete until all are true:

1. No ExpenseFlow receipt upload uses an unsigned public Cloudinary preset.
2. Cloudinary API secret exists only server-side.
3. Every upload requires an authenticated ExpenseFlow user.
4. Every upload requires valid membership in the target group.
5. The server constructs the Cloudinary group folder.
6. A client cannot select another group's folder.
7. Every group uses:

```text
expenseflow/groups/{groupId}/receipts/
```

8. Receipt metadata includes a reliable `receiptPublicId`.
9. Receipt deletion removes the Cloudinary asset.
10. Receipt replacement removes the old asset after successful replacement.
11. Group deletion cleans its receipt assets.
12. Cancelled/failed expense creation cannot cause unlimited permanent orphan uploads.
13. Existing receipts continue to render.
14. Expense editing no longer removes existing receipt metadata.
15. Cross-group upload/delete/access attempts are rejected.
16. Cloudinary upload restrictions are enforced.
17. Receipt delivery is appropriately protected.
18. Images are optimized for thumbnails and full-screen viewing.
19. The frontend bundle contains no Cloudinary API secret.
20. Automated tests cover security-critical paths.

## Final Question

After implementation and testing, answer:

> **Is Cloudinary now securely isolated per group, and can a user from Group A access, upload to, or delete Group B's receipt assets?**

Support the answer with actual test evidence.

---

## Execution Rules

1. Inspect the existing implementation before changing it.
2. Implement the refactor without rewriting unrelated parts of ExpenseFlow.
3. Preserve existing UI/UX unless a change is required for security or correctness.
4. Run tests, build, and lint checks after implementation.
5. Perform a security audit of the resulting implementation.
6. Do not declare success based only on compilation.
7. Mark anything not actually verified as `NOT VERIFIED`.
8. Never expose real credentials or secrets in the final report.
