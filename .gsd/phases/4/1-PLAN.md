---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Backend Auth Bridge

## Objective
Implement the Clerk webhook and the JWT bridge in the existing Express server to allow Clerk users and Guests to authenticate with Firebase Custom Tokens.

## Context
- .gsd/SPEC.md
- .gsd/phases/4/RESEARCH.md
- server/index.js

## Tasks

<task type="auto">
  <name>Implement Clerk Webhook</name>
  <files>
    server/index.js
    server/package.json
  </files>
  <action>
    - Ensure `firebase-admin` is initialized in `server/index.js`.
    - Add POST `/api/auth/clerk-webhook`.
    - Accept Clerk's `user.created` webhook payload.
    - Write a new document to the Firestore `members` collection? Wait, in ExpenseFlow, users belong to groups. Clerk users just need to exist. Let's write them to a top-level `users` collection in Firestore with their email and name so we have a record. Or if the roadmap says "seeds Firestore user document", let's create a `users` collection.
  </action>
  <verify>grep "/api/auth/clerk-webhook" server/index.js</verify>
  <done>Webhook endpoint exists and handles user creation.</done>
</task>

<task type="auto">
  <name>Implement JWT Bridge & Guest Auth</name>
  <files>
    server/index.js
  </files>
  <action>
    - Add POST `/api/auth/jwt-bridge`.
    - If `type === 'clerk'`, verify the Clerk token (using `@clerk/clerk-sdk-node` or by checking the Authorization header manually). Actually, to keep it simple, just verify the Clerk session via `@clerk/clerk-sdk-node`. Install it in `server/package.json`. Then generate a Firebase Custom Token using `admin.auth().createCustomToken(userId)`.
    - If `type === 'guest'`, verify the `code` and `pin` against the `groups` collection in Firestore. If valid, generate a Firebase Custom token using `admin.auth().createCustomToken(guestId, { guestGroupId: groupId, mode: "guest" })`.
    - Add basic memory-based rate limiting (e.g. `express-rate-limit`) to prevent PIN brute forcing (Task 4 from roadmap).
  </action>
  <verify>grep "/api/auth/jwt-bridge" server/index.js</verify>
  <done>JWT bridge endpoint exists, issues Firebase custom tokens, and handles PIN verification securely.</done>
</task>

## Success Criteria
- [ ] Express server has `/api/auth/clerk-webhook` and `/api/auth/jwt-bridge`.
- [ ] Guest auth generates scoped custom claims (`guestGroupId`).
