---
phase: 17
plan: 1
wave: 1
---

# Plan 17.1: Cloudinary Receipt Uploads Cleanup

## Objective
Finalize the Cloudinary direct upload integration by removing legacy mocked Firebase storage functions. The hook `useReceiptUpload.js` already implements `XMLHttpRequest`, 5MB size limits, and JPG/PNG/WEBP validation according to requirements.

## Context
- .gsd/SPEC.md
- client/src/api/client.js

## Tasks

<task type="auto">
  <name>Remove Legacy Mock Upload</name>
  <files>
    client/src/api/client.js
  </files>
  <action>
    - Remove the unused `uploadReceipt` mock function from `client/src/api/client.js`.
  </action>
  <verify>! grep "uploadReceipt = async" client/src/api/client.js</verify>
  <done>Legacy mock uploadReceipt function is removed.</done>
</task>

## Success Criteria
- [ ] `uploadReceipt` mock is removed from `client/src/api/client.js`.
- [ ] `useReceiptUpload.js` remains the sole source of truth for Cloudinary uploads.
