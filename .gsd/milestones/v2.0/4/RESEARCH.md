# Phase 4 Research: Clerk Hybrid Authentication & Auth Bridge Topology

## Discovery Level 1.5

### Analysis of Roadmap Tasks
The roadmap dictates creating two Netlify Functions for Phase 4:
- `jwt-bridge.js`: Exchanges Clerk token for Firebase Custom Token, issues Guest tokens.
- `clerk-webhook.js`: Seeds Firestore user documents on `user.created`.

### Ponytail Simplifications (Architectural Pivot)
**Issue:** Implementing Netlify Functions introduces a new deployment topology. The project currently has an Express backend (`server/index.js`) deployed on Render, and we already installed `firebase-admin` there during the Phase 2 migration. Setting up Netlify Functions requires modifying `netlify.toml`, managing a new `package.json`, and configuring environment variables in a separate platform.

**Solution:** Instead of creating Netlify Functions *now*, we will implement `jwt-bridge` and `clerk-webhook` as standard Express routes (`/api/auth/jwt-bridge` and `/api/auth/clerk-webhook`) within the existing `server/` directory.
- *Why:* It's the path of least resistance. The server is already there, already has `firebase-admin`, and already proxies `/api/*` from the frontend.
- *Future-proofing:* In Phase 9 (Final Cleanup & Server Removal), if the user truly wants to go 100% serverless, it is much better to migrate these two endpoints to **Firebase Cloud Functions** rather than Netlify Functions, keeping the entire backend tightly integrated in the Firebase ecosystem.

### Task Breakdown & Wave Planning
We have a large number of frontend tasks (17 total). We will group them into waves aggressively:

**Wave 1: Backend Auth Bridge**
- Add `/api/auth/jwt-bridge` (Clerk -> Custom Token & Guest -> Custom Token).
- Add `/api/auth/clerk-webhook` (Sync users to Firestore).
- Implement basic rate limiting in Express (memory-based for MVP).

**Wave 2: Frontend Auth Infrastructure**
- Install `@clerk/clerk-react`.
- Wrap `App.jsx` in `ClerkProvider`.
- Create `useAuth()` hook managing Clerk vs Guest modes and Firebase `signInWithCustomToken()`.
- Store auth mode in React Context.

**Wave 3: Authentication UI**
- Create `<SignInModal>`.
- Create `<PINVerification>` component.
- Create Guest Join Modal.
- Update Landing Page CTAs and routing.
- Add Settings page badge.
