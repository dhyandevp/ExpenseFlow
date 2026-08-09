# Plan 12.1 Summary

## Completed Tasks
- Rewrote `firestore.rules` for Subcollections.
- Implemented default deny-all policy.
- Added and updated helper functions `isGroupMember`, `isClerkMember`, and `isGuestMember`.
- Implemented read restrictions on groups (unauthenticated users blocked, strict boundaries for Clerk and guests).
- Blocked guests from creating groups.
- Restricted `currentBalances`, `settlementSuggestions`, and `fairnessScores` updates, effectively locking them to service accounts only.
- Mapped all subcollection match paths (e.g. `match /groups/{groupId}/expenses/{expenseId}`).
- Locked down `settlements` so they can only be created and read, but not updated or deleted.
- Updated the emulator tests in `tests/firestore.rules.test.js` to match the subcollection architecture and the new strict rules.
- Ran `npm run test:rules` with 12/12 emulator tests passing successfully.
