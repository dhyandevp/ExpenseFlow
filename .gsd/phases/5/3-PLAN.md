---
phase: 5
plan: 3
wave: 3
---

# Plan 5.3: Schema & UI Updates

## Objective
Update the data schema to store the Cloudinary URL and update the UI to render it directly.

## Context
- .gsd/SPEC.md
- client/src/components/ExpenseForm.jsx
- client/src/pages/ExpenseLogger.jsx

## Tasks

<task type="auto">
  <name>Update Schema in Form</name>
  <files>
    client/src/components/ExpenseForm.jsx
  </files>
  <action>
    - Change any references of `receiptPath` to `receiptUrl` when setting state and creating/updating the expense document in Firestore.
    - Ensure the `ReceiptUpload` component's `onUploadComplete` passes the URL directly into `receiptUrl`.
  </action>
  <verify>grep "receiptUrl" client/src/components/ExpenseForm.jsx</verify>
  <done>Firestore writes `receiptUrl` instead of `receiptPath`.</done>
</task>

<task type="auto">
  <name>Render Cloudinary Images</name>
  <files>
    client/src/pages/ExpenseLogger.jsx
  </files>
  <action>
    - In `ExpenseLogger.jsx` (or wherever receipts are displayed), remove old logic that calls `getDownloadURL()` to fetch the image URL from Firebase Storage.
    - Use `expense.receiptUrl` directly as the `src` for the `<img>` tag.
    - Implement a small helper to inject Cloudinary transformations for thumbnails. (e.g. replace `/upload/` with `/upload/w_200,f_auto,q_auto/`).
  </action>
  <verify>grep "receiptUrl" client/src/pages/ExpenseLogger.jsx</verify>
  <done>Expense lists display Cloudinary images with auto-transformations.</done>
</task>

## Success Criteria
- [ ] Expenses are saved with `receiptUrl`.
- [ ] Images are rendered rapidly using Cloudinary transformations.
