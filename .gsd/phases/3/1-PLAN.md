---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Verify & Audit Auth Lifecycle Core

## Objective
Verify the complete auth lifecycle including Clerk sign-in, JWT bridge to Firebase, session restoration, and profile setup redirection. Ensure robust handling of UI states in `ProtectedRoute`.

## Context
- `client/src/hooks/useAuth.jsx`
- `client/src/App.jsx`
- `client/src/api/client.js`

## Tasks

<task type="auto">
  <name>Audit JWT Bridge & Session Logic</name>
  <files>
    - AUTH_AUDIT_REPORT.md
  </files>
  <action>
    - Create `AUTH_AUDIT_REPORT.md` in the workspace root.
    - Analyze `useAuth.jsx` and document the exact mechanics for `syncClerkToFirebase` and `onIdTokenChanged`.
    - Document how session restoration works during a page refresh (tracking `isClerkLoaded`, `isBridgePending`, and `isFirebaseLoaded`).
    - Note the explicit handling of `firebaseAuthError` and how the bridge recovers from a failed API call.
  </action>
  <verify>cat AUTH_AUDIT_REPORT.md | grep "Session Logic"</verify>
  <done>AUTH_AUDIT_REPORT.md contains a detailed breakdown of the JWT bridge and session restoration logic.</done>
</task>

<task type="auto">
  <name>Audit ProtectedRoute & UI States</name>
  <files>
    - AUTH_AUDIT_REPORT.md
  </files>
  <action>
    - Analyze `ProtectedRoute` in `client/src/App.jsx`.
    - Document the UI rendering conditions: Error state, Loading state, Unauthenticated redirect, and Profile Setup redirect.
    - Append this to `AUTH_AUDIT_REPORT.md` under a "Protected Route Architecture" section.
  </action>
  <verify>cat AUTH_AUDIT_REPORT.md | grep "Protected Route Architecture"</verify>
  <done>AUTH_AUDIT_REPORT.md explains the conditional rendering logic of ProtectedRoute.</done>
</task>

## Success Criteria
- [ ] The full authentication and session restoration lifecycle is verified and documented.
- [ ] `AUTH_AUDIT_REPORT.md` provides empirical proof that all required phase objectives are structurally satisfied by the current implementation.
