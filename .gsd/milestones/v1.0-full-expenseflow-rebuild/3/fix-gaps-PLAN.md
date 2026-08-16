---
phase: 3
plan: fix-gaps
wave: 1
gap_closure: true
---

# Fix Plan: Verification Gaps

## Problem
Phase 3 verification identified several gaps: app crashes on missing env variables, `/setup` is unprotected, 404 is missing `noindex`, and mobile layout components (FAB, sticky header, bottom nav with 4 tabs) are incomplete.

## Tasks

<task type="auto">
  <name>Fix useAuth missing env crashes</name>
  <files>client/src/hooks/useAuth.jsx</files>
  <action>Add try/catch around Firebase initialization or a fallback so the app doesn't throw a fatal error when keys are missing. Wait, the Firebase error happens in `firebase.js` where `initializeApp` is called, or when `getAuth` is used. We should handle missing Clerk keys in `App.jsx` or provide a default fallback key. We can add an ErrorBoundary to `App.jsx` to catch Clerk errors.</action>
  <verify>App loads and shows error UI instead of white screen when env variables are missing</verify>
  <done>Error boundary added or Firebase initialization made safe</done>
</task>

<task type="auto">
  <name>Protect /setup route</name>
  <files>client/src/App.jsx</files>
  <action>Wrap the `/setup` route with an authentication check. Redirect to `/` if not logged in.</action>
  <verify>Navigate to `/setup` when logged out redirects to `/`</verify>
  <done>Route is protected</done>
</task>

<task type="auto">
  <name>Add noindex to 404 page</name>
  <files>client/src/pages/NotFound.jsx</files>
  <action>Add a `meta robots` tag with `noindex` using Helmet to the NotFound component.</action>
  <verify>404 page contains `<meta name="robots" content="noindex" />`</verify>
  <done>Tag added</done>
</task>

<task type="auto">
  <name>Implement Mobile Navigation & Layout</name>
  <files>client/src/components/AppLayout.jsx, client/src/components/MobileNav.jsx</files>
  <action>Create a bottom navigation bar with 4 tabs, sticky header, and FAB. The `AppLayout` should render these on mobile viewports.</action>
  <verify>Navigation and FAB are visible on 390px screens</verify>
  <done>Components added and styled correctly</done>
</task>
