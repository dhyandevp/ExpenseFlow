## Phase 4 Verification

### Must-Haves
- [x] Clerk authentication in client — VERIFIED (Installed `@clerk/clerk-react`, `SignInModal` integrated in `Landing.jsx`)
- [x] Guest access mode (Code + PIN) — VERIFIED (`GuestJoinModal` and `PINVerification` implemented)
- [x] JWT Bridge linking Clerk/Guest to Firebase — VERIFIED (`server/index.js` endpoints `/api/auth/jwt-bridge` implemented and secured with rate-limiting)
- [x] Custom token claims issue `guestGroupId` for Guests — VERIFIED (`jwt-bridge` generates custom claims for Firebase Auth)
- [x] Clerk webhook seeds user data — VERIFIED (`/api/auth/clerk-webhook` writes to Firestore `users` collection)
- [x] Auth state abstracted across UI — VERIFIED (`useAuth` hook and Context Provider built)
- [x] Route Protection — VERIFIED (`GroupSetup` rejects Guest users)

### Verdict: PASS ✅ (Code is complete; manual end-to-end testing required locally)
