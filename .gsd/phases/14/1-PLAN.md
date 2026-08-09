---
phase: 14
plan: 1
wave: 1
---

# Plan 14.1: Clerk Webhook and Svix Setup

## Objective
Implement `clerk-webhook.js` to sync Clerk `user.created` events with the Firestore `users` collection.

## Context
- .gsd/SPEC.md
- netlify/functions/jwt-bridge.js (for firebase admin init reference)

## Tasks

<task type="auto">
  <name>Install Svix and Configure Webhook</name>
  <files>
    package.json
    netlify/functions/clerk-webhook.js
    tests/clerk-webhook.test.js
  </files>
  <action>
    - Install `svix` in the root `package.json` so it is available for Netlify Functions.
    - Create `netlify/functions/clerk-webhook.js` (HTTP POST endpoint).
    - Initialize Firebase Admin inside the handler (using the same pattern as `jwt-bridge.js`).
    - Use `svix.Webhook(process.env.CLERK_WEBHOOK_SECRET).verify(payload, headers)` to verify the webhook request.
    - If the event type is `user.created`, extract the user's `id`, `email_addresses[0].email_address`, `first_name`, and `last_name`.
    - Create a document in the Firestore `users` collection using the Clerk user ID as the document ID, saving the extracted details.
    - Create `tests/clerk-webhook.test.js` using Vitest to mock Svix and Firestore, ensuring the verification and Firestore seeding work as expected.
  </action>
  <verify>npx vitest run tests/clerk-webhook.test.js</verify>
  <done>clerk-webhook.js correctly verifies Svix signatures and seeds Firestore user documents, passing all tests.</done>
</task>
