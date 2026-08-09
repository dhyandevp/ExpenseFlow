---
phase: 5
plan: 2
wave: 2
---

# Plan 5.2: Cloudinary Integration

## Objective
Create the Cloudinary upload hook and refactor the ReceiptUpload component to use it.

## Context
- .gsd/SPEC.md
- client/src/hooks/useReceiptUpload.js
- client/src/components/ReceiptUpload.jsx

## Tasks

<task type="auto">
  <name>Create Cloudinary Upload Hook</name>
  <files>
    client/src/hooks/useReceiptUpload.js
  </files>
  <action>
    - Create `useReceiptUpload.js`.
    - Expose `uploadReceipt(file)`, `isUploading`, `progress`, `error`.
    - Ensure `uploadReceipt` validates the file type (jpg, png, webp) and size (< 5MB).
    - Use XMLHttpRequest to `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload` so we can track upload progress.
    - Append `file` and `upload_preset` (`import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET`) to FormData.
    - Return the `secure_url` on success.
  </action>
  <verify>grep "api.cloudinary.com" client/src/hooks/useReceiptUpload.js</verify>
  <done>Hook successfully encapsulates Cloudinary upload logic with progress tracking.</done>
</task>

<task type="auto">
  <name>Refactor ReceiptUpload Component</name>
  <files>
    client/src/components/ReceiptUpload.jsx
  </files>
  <action>
    - Import and use the new `useReceiptUpload` hook.
    - Remove old Firebase Storage logic (`uploadBytesResumable`, `getDownloadURL`).
    - The `onUploadComplete` callback should now receive the Cloudinary URL (e.g., `secure_url`) instead of a Firebase storage path.
    - Display the `progress` from the hook in the UI.
  </action>
  <verify>! grep "getDownloadURL" client/src/components/ReceiptUpload.jsx</verify>
  <done>ReceiptUpload component leverages Cloudinary hook and passes URL to parent.</done>
</task>

## Success Criteria
- [ ] Hook is built.
- [ ] UI component uses the new hook exclusively.
