---
phase: 4
plan: 3
wave: 3
---

# Plan 4.3: Authentication UI Flows

## Objective
Build the modals and UI flows for users to sign in with Clerk or join as a guest with a PIN, applying Aurora Forest design tokens.

## Context
- .gsd/SPEC.md
- client/src/pages/Landing.jsx
- client/src/components/auth/SignInModal.jsx
- client/src/components/auth/PINVerification.jsx
- client/src/components/auth/GuestJoinModal.jsx

## Tasks

<task type="auto">
  <name>Create Auth Components</name>
  <files>
    client/src/components/auth/SignInModal.jsx
    client/src/components/auth/PINVerification.jsx
    client/src/components/auth/GuestJoinModal.jsx
  </files>
  <action>
    - Create `SignInModal.jsx` using Clerk's `<SignIn />` component wrapped in a modal.
    - Create `PINVerification.jsx` for the 6-digit masked input (shake animation on error, auto-advance).
    - Create `GuestJoinModal.jsx` containing a group code input and the `PINVerification` component. On submit, it calls `/api/auth/jwt-bridge` with `{ type: 'guest', code, pin }` and signs into Firebase.
  </action>
  <verify>test -f client/src/components/auth/PINVerification.jsx</verify>
  <done>Auth components are built with error states and animations.</done>
</task>

<task type="auto">
  <name>Implement Routing & Landing Page</name>
  <files>
    client/src/pages/Landing.jsx
    client/src/App.jsx
  </files>
  <action>
    - Update `Landing.jsx` to show two primary CTAs: "Sign in with Clerk" and "Join with a code".
    - Wire the CTAs to open the respective modals.
    - Update `App.jsx` router: redirect to `/dashboard` upon successful auth.
    - Ensure Group Setup page is protected (only `authMode === 'clerk'`).
    - Add an auth mode badge in the Settings page ("Signed in" vs "Guest access").
  </action>
  <verify>grep "GuestJoinModal" client/src/pages/Landing.jsx</verify>
  <done>Landing page and routing correctly handle hybrid auth flows.</done>
</task>

## Success Criteria
- [ ] Users can log in via Clerk.
- [ ] Guests can log in via Code + PIN.
- [ ] Routing redirects correctly based on auth status.
