---
phase: 13
plan: 1
wave: 1
---

# Plan 13.1 Summary: Netlify Functions Setup and Auth Bridge

## Work Completed
- Configured Netlify Functions environment.
- Installed `firebase-admin` and `@clerk/clerk-sdk-node` to the root `package.json`.
- Set `functions = "netlify/functions"` in `netlify.toml`.
- Implemented `netlify/functions/jwt-bridge.js`.
- Implemented Mode A (Clerk authentication) that exchanges a Clerk JWT for a Firebase custom token.
- Implemented Mode B (Guest authentication) that verifies group code and `pinHash`.
- Added rate limiting for Guest auth (10 attempts per 15 minutes, blocked for 1 hour on 3 failed PIN attempts).
- Wrote and passed comprehensive Vitest unit tests in `tests/jwt-bridge.test.js`.

## Verifications
- `npm list` confirmed `firebase-admin` and `@clerk/clerk-sdk-node` installed.
- `grep` verified `netlify.toml` configuration.
- `vitest run tests/jwt-bridge.test.js` executed 5 tests covering all logic modes, 100% passing.
