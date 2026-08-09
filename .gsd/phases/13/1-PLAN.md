---
phase: 13
plan: 1
wave: 1
---

# Plan 13.1: Netlify Functions Setup and Auth Bridge

## Objective
Scaffold the Netlify functions directory and implement the `jwt-bridge.js` serverless function to securely exchange Clerk sessions or verify guest PINs to issue Firebase custom tokens.

## Context
- .gsd/SPEC.md
- netlify.toml

## Tasks

<task type="auto">
  <name>Configure Netlify Functions Environment</name>
  <files>
    netlify.toml
    package.json
  </files>
  <action>
    - Verify or update `netlify.toml` to specify `[build] functions = "netlify/functions"`.
    - Install `firebase-admin` and `@clerk/clerk-sdk-node` as dependencies in the root `package.json` so they are available to Netlify functions.
    - Create the `netlify/functions` directory.
  </action>
  <verify>npm list firebase-admin @clerk/clerk-sdk-node && grep "functions" netlify.toml</verify>
  <done>Dependencies are installed and netlify.toml correctly points to the functions directory.</done>
</task>

<task type="auto">
  <name>Implement jwt-bridge.js Core Logic</name>
  <files>
    netlify/functions/jwt-bridge.js
    tests/jwt-bridge.test.js
  </files>
  <action>
    - Create `netlify/functions/jwt-bridge.js`.
    - Initialize `firebase-admin` using the base64 decoded `FIREBASE_SERVICE_ACCOUNT_B64` environment variable.
    - Implement Mode A (Authenticated): Extract Clerk JWT from `Authorization` header, verify using `@clerk/clerk-sdk-node`, then use `firebase-admin` to generate and return a Firebase Custom Token for the Clerk user ID.
    - Implement Mode B (Guest): Expect `{ code, pinHash }` in the POST body. Look up the group by `code` in Firestore. Compare the provided `pinHash` with the stored `group.pinHash` securely.
    - If Mode B is successful, issue a Firebase Custom Token with claims `{ guestGroupId: groupId, mode: "guest" }` and a 1-hour expiration.
    - Implement Mode B Rate Limiting: Use a `rateLimits` Firestore collection to track attempts by client IP (using `event.headers['x-forwarded-for']` or similar). Max 10 attempts per 15 mins. On 3 consecutive PIN failures, block the IP for 1 hour.
    - Create a test file `tests/jwt-bridge.test.js` using Vitest to mock Firestore and Clerk, verifying that proper tokens are returned and rate limits are enforced.
  </action>
  <verify>npx vitest run tests/jwt-bridge.test.js</verify>
  <done>The jwt-bridge function correctly handles Clerk and Guest auth requests and rate limits are enforced, passing all tests.</done>
</task>

## Success Criteria
- [ ] Netlify functions directory is configured.
- [ ] `jwt-bridge.js` successfully issues Firebase tokens for Clerk sessions.
- [ ] `jwt-bridge.js` successfully issues Firebase tokens for valid guest code+pin combos.
- [ ] `jwt-bridge.js` correctly rate limits invalid guest attempts and blocks IPs after 3 consecutive failures.
