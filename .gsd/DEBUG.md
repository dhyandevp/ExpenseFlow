# Debug Session: Production Auth

## Symptom
Authentication is not working correctly on the production website https://expenseflow.site. The system needs to be traced end-to-end (Browser → Clerk → Vercel API → Firebase Custom Token → Firebase Auth → Firestore) to find the root cause.

**When:** During production sign in / sign up / joining group
**Expected:** Users should be able to authenticate and access protected routes.
**Actual:** Authentication fails somewhere in the flow.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Vercel API `/api/auth/jwt-bridge` failing (e.g. missing env vars, crash) | 80% | UNTESTED |
| 2 | Clerk configuration mismatch (wrong domain/keys) | 60% | UNTESTED |
| 3 | Firebase Admin initialization error | 60% | UNTESTED |
| 4 | Client-side Firebase custom token sign-in failure | 50% | UNTESTED |
| 5 | ProtectedRoute rendering logic / redirect loop | 40% | UNTESTED |
