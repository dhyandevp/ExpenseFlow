---
phase: 14
plan: 2
wave: 1
---

# Plan 14.2 Summary: Balance Trigger Function

## Work Completed
- Implemented `netlify/functions/balance-trigger.js` as an HTTP POST endpoint.
- Initialized Firebase Admin for backend Firestore operations.
- Fetched the group's `members`, `expenses`, and `settlements` subcollections upon receiving a `groupId`.
- Leveraged existing business logic from `shared/balanceMath.js` (`calculateBalances` and `calculateFairnessScore`) to perform calculations on the backend.
- Updated the group document in Firestore with new `currentBalances`, `settlementSuggestions`, `fairnessScore`, and `lastCalculatedAt`.
- Added unit tests in `tests/balance-trigger.test.js` validating the function's logic and error handling.

## Verifications
- `npx vitest run tests/balance-trigger.test.js` executed 4 tests with a 100% pass rate.
