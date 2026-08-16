# Authentication & Session Lifecycle Audit Report

## 1. Session Logic & JWT Bridge
The authentication lifecycle securely links a Clerk session to a Firebase session through a custom JWT bridge.

### Mechanisms:
- **`syncClerkToFirebase` Effect (`useAuth.jsx`)**:
  - Triggers when `isClerkLoaded` becomes true.
  - If a Clerk user and session exist, it requests a session token from Clerk (`session.getToken()`).
  - Calls the Vercel backend (`/api/auth/jwt-bridge`) with this token.
  - The backend verifies the token and mints a Firebase custom token, which is returned to the client.
  - The client calls `signInWithCustomToken(auth, firebaseToken)` to establish the Firebase session.
  - **Error Handling**: If the bridge fails, it catches the error, sets `firebaseAuthError`, sets `isBridgePending` to false, and forces `isFirebaseLoaded` to true so the application doesn't hang in a loading state forever.

### Session Restoration on Page Refresh:
- On initial page load, `isClerkLoaded` is false. The global `isLoaded` flag in `useAuth` is `isClerkLoaded && isFirebaseLoaded && !isBridgePending`.
- Once Clerk initializes (`isClerkLoaded = true`), the `syncClerkToFirebase` effect checks for a cached session.
- If a session is found, it sets `isBridgePending = true` and performs the bridge request.
- Simultaneously, Firebase's `onIdTokenChanged` listener may fire if a cached Firebase session exists.
- The `isLoaded` flag only becomes true when the bridge process is fully complete (`isBridgePending = false`) and the Firebase token listener has fired at least once (`isFirebaseLoaded = true`), ensuring the UI does not render protected content prematurely.

## 2. Protected Route Architecture
The `ProtectedRoute` component (`client/src/App.jsx`) acts as a robust gatekeeper for authenticated pages.

### Conditional Rendering Flow:
1. **Error State**: 
   - Condition: `if (firebaseAuthError)`
   - Renders a user-friendly error screen ("Session Error") with a "Try again" button that triggers a full page reload.
2. **Loading State**: 
   - Condition: `if (!isLoaded || (authMode === 'clerk' && !isProfileLoaded))`
   - Renders a full-screen spinner with "Loading your account..." text. This prevents any flicker of unauthenticated content during session restoration or profile fetching.
3. **Unauthenticated Redirect**: 
   - Condition: `if (!user)`
   - Redirects visitors to the Landing page (`/`) via `<Navigate to="/" replace />`.
4. **Profile Setup Redirect**: 
   - Condition: `if (requireProfile && authMode === 'clerk' && !userProfile)`
   - Redirects users who have successfully authenticated but lack a Firestore profile document to the `/profile-setup` route.
5. **Authenticated (Pass-through)**: 
   - Condition: All above checks pass.
   - Renders the `children` components.

## Conclusion
The authentication architecture is structurally sound, handling all edge cases (loading, bridge failures, missing profiles, caching) gracefully. No codebase modifications are necessary for Phase 3.
