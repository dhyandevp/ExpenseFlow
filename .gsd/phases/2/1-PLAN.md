---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Firebase Client SDK & Core Utils

## Objective
Set up the Firebase Client SDK with offline persistence and port the backend math logic (balances, greedy settlement, fairness scores) to the frontend as pure functions. This is a Ponytail Ultra simplification to avoid unnecessary Netlify Functions.

## Context
- .gsd/SPEC.md
- .gsd/phases/2/RESEARCH.md
- server/routes/balances.js
- server/routes/reports.js

## Tasks

<task type="auto">
  <name>Install Firebase SDK</name>
  <files>
    client/package.json
    client/src/firebase.js
  </files>
  <action>
    - Install `firebase` dependency in the client via npm.
    - Create `client/src/firebase.js` that initializes the Firebase app.
    - Enable offline IndexedDB persistence for Firestore.
    - Export `db` (Firestore instance).
    - Read configuration from `import.meta.env` (VITE_FIREBASE_*).
  </action>
  <verify>grep "firebase" client/package.json && test -f client/src/firebase.js</verify>
  <done>Firebase client SDK is installed and config file exists.</done>
</task>

<task type="auto">
  <name>Port Math Logic to Client</name>
  <files>
    client/src/utils/balanceMath.js
  </files>
  <action>
    - Extract the math and logic from `server/routes/balances.js` (greedy settlement, net balances).
    - Extract the math and logic from `server/routes/reports.js` (fairness scores, category breakdown).
    - Write these as pure, exported JS functions in `client/src/utils/balanceMath.js`.
    - Functions should take raw arrays of members and expenses as input, and return the computed values (balances, suggestions, scores, insights).
    - Do NOT import any database logic here, just pure math.
    - Apply Ponytail: Add a comment documenting that client-side dynamic calculation replaces the need for a backend trigger.
  </action>
  <verify>test -f client/src/utils/balanceMath.js && grep "export" client/src/utils/balanceMath.js</verify>
  <done>All math logic is extracted into pure, testable client-side functions.</done>
</task>

## Success Criteria
- [ ] Firebase SDK installed in client.
- [ ] `firebase.js` config created with offline persistence.
- [ ] `balanceMath.js` created with all necessary pure functions for balances, settlements, and fairness scores.
