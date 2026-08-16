---
phase: 9
plan: 2
wave: 1
---

# Plan 9.2: Documentation & README Update

## Objective
Update the `README.md` to reflect the final architecture, ensuring new developers or users understand the fully serverless stack (Firebase, Netlify Functions, Clerk, Cloudinary) rather than the legacy Express+SQLite stack.

## Context
- .gsd/SPEC.md
- /README.md

## Tasks

<task type="auto">
  <name>Update README architecture and setup</name>
  <files>
    - /README.md
  </files>
  <action>
    - Rewrite the architecture section to clearly mention the use of Firebase Firestore, Netlify Functions, Clerk Auth, and Cloudinary.
    - Remove references to spinning up an Express server or setting up SQLite.
    - Provide clear, updated local setup instructions (e.g., `npm install`, setting up `.env` files for the client and Netlify functions, starting the Vite dev server).
    - Provide updated deployment guidelines focusing on Netlify.
  </action>
  <verify>grep -i -E "firebase|netlify|clerk|cloudinary" README.md > /dev/null && ! grep -i -E "express|sqlite" README.md</verify>
  <done>README.md accurately describes the new architecture and deployment process</done>
</task>

## Success Criteria
- [ ] `README.md` details the serverless architecture.
- [ ] Legacy setup steps are completely removed from `README.md`.
