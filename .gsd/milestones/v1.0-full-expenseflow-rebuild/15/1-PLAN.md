---
phase: 15
plan: 1
wave: 1
---

# Plan 15.1: Auth Hook, Permissions, and Badge

## Objective
Implement hybrid authentication state hooks, secure group creation permissions, and display auth status in Settings.

## Context
- .gsd/SPEC.md
- client/src/hooks/useAuth.jsx
- client/src/pages/GroupSetup.jsx
- client/src/pages/Settings.jsx

## Tasks

<task type="auto">
  <name>Enforce authMode in useAuth.js</name>
  <files>
    client/src/hooks/useAuth.jsx
  </files>
  <action>
    - Update `useAuth.jsx` to ensure `authMode` is strictly exactly `'clerk'` or `'guest'`.
    - If `user` is not loaded or not logged in, `authMode` should be `null`.
    - Double check the token claims logic: if `claims.guestGroupId` is present, it's `'guest'`, otherwise if a Clerk user exists, it's `'clerk'`, else `null`.
  </action>
  <verify>grep -A 10 "authMode" client/src/hooks/useAuth.jsx</verify>
  <done>authMode logic strictly enforces only 'clerk', 'guest', or null states.</done>
</task>

<task type="auto">
  <name>Block Guest Group Creation</name>
  <files>
    client/src/pages/GroupSetup.jsx
  </files>
  <action>
    - Import `useAuth` hook in `GroupSetup.jsx`.
    - Retrieve `authMode` and `user` (Clerk user).
    - Add a check before allowing group creation: if `authMode === 'guest'`, render a UI message or disable creation.
    - Also verify the Clerk user's email is verified (`user.primaryEmailAddress?.verification?.status === 'verified'`). If not, block creation with an appropriate message.
  </action>
  <verify>grep -E "authMode|verified" client/src/pages/GroupSetup.jsx</verify>
  <done>UI blocks group creation when signed in as a guest or with unverified email.</done>
</task>

<task type="auto">
  <name>Add Auth Badge to Settings</name>
  <files>
    client/src/pages/Settings.jsx
  </files>
  <action>
    - Open `client/src/pages/Settings.jsx`.
    - Retrieve `authMode` from `useAuth()`.
    - Render a prominent badge (e.g. using a label/chip) that says "Signed in" (if 'clerk') or "Guest" (if 'guest').
  </action>
  <verify>grep -C 3 "authMode" client/src/pages/Settings.jsx</verify>
  <done>Settings page correctly renders an auth mode badge based on the current user.</done>
</task>

## Success Criteria
- [ ] `useAuth.jsx` exports strict authMode values.
- [ ] Guests and unverified Clerk users cannot create groups.
- [ ] Settings page displays Auth mode badge.
