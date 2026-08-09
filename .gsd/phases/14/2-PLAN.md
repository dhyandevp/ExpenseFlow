---
phase: 14
plan: 2
wave: 1
---

# Plan 14.2: Balance Trigger Function

## Objective
Implement `balance-trigger.js` as an HTTP endpoint to recalculate group balances server-side after expense updates.

## Context
- shared/balanceMath.js
- netlify/functions/jwt-bridge.js (for firebase admin init reference)

## Tasks

<task type="auto">
  <name>Implement balance-trigger.js</name>
  <files>
    netlify/functions/balance-trigger.js
    tests/balance-trigger.test.js
  </files>
  <action>
    - Create `netlify/functions/balance-trigger.js` (HTTP POST endpoint).
    - Initialize Firebase Admin (using the same pattern as `jwt-bridge.js`).
    - Accept a `groupId` in the POST body.
    - Fetch the group's `members`, `expenses`, and `settlements` subcollections from Firestore.
    - Import `calculateBalances` and `calculateFairnessScore` from `../../shared/balanceMath.js`.
    - Recalculate balances, settlement suggestions, and the fairness score using the fetched data.
    - Write these updated structures back to the `groups/{groupId}` document (`currentBalances`, `settlementSuggestions`, `fairnessScore`).
    - Create a Vitest test in `tests/balance-trigger.test.js` mocking Firestore and the shared math functions to verify the write operation happens correctly with calculated data.
  </action>
  <verify>npx vitest run tests/balance-trigger.test.js</verify>
  <done>balance-trigger.js successfully recalculates balances using shared logic and updates Firestore, passing all tests.</done>
</task>
