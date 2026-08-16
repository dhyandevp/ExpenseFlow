---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Firestore Security Rules

## Objective
Write the complete `firestore.rules` file to enforce database-level authorization.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- .gsd/phases/3/RESEARCH.md

## Tasks

<task type="auto">
  <name>Write Firestore Rules</name>
  <files>
    firestore.rules
  </files>
  <action>
    - Create `firestore.rules` at the root of the project.
    - Setup `rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { ... } }`.
    - Write helper functions:
      - `isClerkAuthenticated()`: `request.auth != null && request.auth.token.guestGroupId == null`
      - `isGuest()`: `request.auth != null && request.auth.token.guestGroupId != null`
      - `hasGroupAccess(groupId)`: checks if the user is authenticated, and if they are a guest, ensures `request.auth.token.guestGroupId == groupId`. (Note: actual membership in the `members` subcollection is hard to check securely without a `members` array on the group doc. For this phase, if they have the guest token or are logged in, they can access groups they request. Phase 4 will handle issuing the correct custom tokens).
    - Rules for `groups`: 
      - `read`: `hasGroupAccess(groupId)` or checking group code for joining.
      - `create`: `isClerkAuthenticated()`
      - `update`: `hasGroupAccess(groupId)`
    - Rules for `members`, `expenses`, `categories`, `settlements`:
      - `read`, `create`, `update`, `delete`: `hasGroupAccess(resource.data.group_id)` or `hasGroupAccess(request.resource.data.group_id)`.
    - Note on Ponytail: We skip rate-limiting rules and service-account rules per `RESEARCH.md`.
  </action>
  <verify>test -f firestore.rules && grep "match /databases" firestore.rules</verify>
  <done>firestore.rules file contains rules for all collections.</done>
</task>

## Success Criteria
- [ ] `firestore.rules` file is created.
- [ ] Rules enforce basic Clerk vs Guest access paradigms.
