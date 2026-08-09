---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Setup & Cleanup

## Objective
Remove all Firebase Storage dependencies and configure environment variables for Cloudinary.

## Context
- .gsd/SPEC.md
- client/package.json
- client/src/firebase.js

## Tasks

<task type="auto">
  <name>Environment & Dependencies</name>
  <files>
    client/.env.example
    client/package.json
  </files>
  <action>
    - Add `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` to `client/.env.example`.
    - Run `npm uninstall browser-image-compression` in the `client` directory.
  </action>
  <verify>grep "VITE_CLOUDINARY" client/.env.example && ! grep "browser-image-compression" client/package.json</verify>
  <done>Cloudinary env vars are documented and image compression library is removed.</done>
</task>

<task type="auto">
  <name>Remove Firebase Storage</name>
  <files>
    client/src/firebase.js
  </files>
  <action>
    - Remove the `getStorage` import and initialization from `client/src/firebase.js`.
    - Remove any exports related to Firebase Storage (`export const storage = ...`).
  </action>
  <verify>! grep "getStorage" client/src/firebase.js</verify>
  <done>Firebase Storage is completely removed from the Firebase SDK initialization.</done>
</task>

## Success Criteria
- [ ] Dependencies are updated.
- [ ] Firebase Storage is stripped from the app context.
