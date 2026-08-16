---
phase: 4
plan: 2
wave: 2
---

# Plan 4.2: Frontend Auth Infrastructure

## Objective
Set up the Clerk provider in the React app and create the `useAuth` hook to bridge Clerk state to Firebase Auth.

## Context
- .gsd/SPEC.md
- client/package.json
- client/src/App.jsx
- client/src/hooks/useAuth.js

## Tasks

<task type="auto">
  <name>Install and Setup Clerk</name>
  <files>
    client/package.json
    client/src/App.jsx
  </files>
  <action>
    - Install `@clerk/clerk-react` in the client.
    - Wrap the application in `client/src/App.jsx` with `<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>`.
  </action>
  <verify>grep "ClerkProvider" client/src/App.jsx</verify>
  <done>ClerkProvider is wrapping the React application.</done>
</task>

<task type="auto">
  <name>Create useAuth Hook</name>
  <files>
    client/src/hooks/useAuth.js
    client/src/App.jsx
  </files>
  <action>
    - Create `client/src/hooks/useAuth.js`.
    - This hook should manage the complex state: Are we authenticated via Clerk? Are we a Guest?
    - If Clerk is signed in, fetch the Firebase Custom Token from our `/api/auth/jwt-bridge` and call `firebase.auth().signInWithCustomToken()`.
    - Expose `{ user, authMode, groupAccess, signOut, isLoaded }` where `authMode` is `'clerk'` or `'guest'`.
    - Provide this state via a React Context (`AuthContext`) in `App.jsx` so the whole app knows the auth state.
  </action>
  <verify>test -f client/src/hooks/useAuth.js && grep "signInWithCustomToken" client/src/hooks/useAuth.js</verify>
  <done>useAuth hook abstracts Clerk and Firebase authentication bridging.</done>
</task>

## Success Criteria
- [ ] Clerk SDK is installed and configured.
- [ ] `useAuth` seamlessly converts a Clerk session to a Firebase session.
