---
phase: 12
plan: 1
wave: 1
---

# Plan 12.1: Firestore Security Rules

## Objective
Implement strict deny-all default security rules with appropriate role-based access control. Rewrite existing rules to support the new subcollection architecture (e.g. `groups/{groupId}/expenses`).

## Context
- /home/dhyandevp/Documents/project-file/ExpenseFlow/ExpenseFlow_AI_Agent_Implementation_Prompts.md
- /home/dhyandevp/Documents/project-file/ExpenseFlow/firestore.rules
- /home/dhyandevp/Documents/project-file/ExpenseFlow/tests/firestore.rules.test.js

## Tasks

<task type="auto">
  <name>Rewrite firestore.rules for Subcollections</name>
  <files>/home/dhyandevp/Documents/project-file/ExpenseFlow/firestore.rules</files>
  <action>
    - Ensure default is deny all.
    - Add/Update helper functions `isGroupMember`, `isClerkMember`, and `isGuestMember`. (Note: use `request.auth.token.guestGroupId` for guests).
    - Unauthenticated users CANNOT read/list groups.
    - Authenticated Clerk users and guests can *only* read their specific group.
    - Block guests from creating groups.
    - Restrict `currentBalances`, `settlementSuggestions`, and `fairnessScores` on the group document so they can only be written by the Admin SDK (service account). Client updates should be denied for these specific fields (hint: use `request.resource.data.diff(resource.data).affectedKeys()`).
    - Subcollections: Update matches from root-level (e.g. `match /expenses/{expenseId}`) to subcollections `match /groups/{groupId}/{collection}/{docId}`.
    - Lock down `settlements` subcollection so it cannot be edited or deleted by anyone (only create/read).
  </action>
  <verify>cat firestore.rules</verify>
  <done>firestore.rules contains all the correct rules as specified, mapped to the subcollection schema.</done>
</task>

<task type="auto">
  <name>Update Emulator Tests</name>
  <files>/home/dhyandevp/Documents/project-file/ExpenseFlow/tests/firestore.rules.test.js</files>
  <action>
    - Update test setup and queries to match the new subcollection architecture. 
    - Write emulator test cases covering both allowed and denied scenarios for group access, creation, settlement lockdown, and service account restrictions.
    - Test that unauthenticated users cannot read groups.
    - Test that guests cannot create groups.
    - Test that updating restricted fields on groups fails for regular users.
  </action>
  <verify>npm run test:rules</verify>
  <done>All tests pass against the Firestore emulator.</done>
</task>

## Success Criteria
- [ ] `firestore.rules` is updated with strict access controls using subcollections.
- [ ] `tests/firestore.rules.test.js` is updated and comprehensive.
- [ ] `npm run test:rules` executes successfully.
