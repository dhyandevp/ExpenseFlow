# Security Policy

## Supported Versions

Only the latest commit on the `main` branch deployed to production is actively supported with security patches.

| Version / Surface | Supported | Notes |
|-------------------|-----------|-------|
| `main` (`app.expenseflow.site`) | Yes | Production web application |
| `main` (`expenseflow.site`) | Yes | Production marketing landing |
| `main` (Cloudflare Worker API) | Yes | Edge API runtime (`worker.js`) |
| Local development branches | No | Please reproduce on `main` before reporting |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in ExpenseFlow, disclose it privately:

1. **Email:** Send details to `dhyandevp@proton.me`
2. **Subject:** `[SECURITY] ExpenseFlow Vulnerability - <Brief Description>`
3. **Include the following information:**
   - Type of vulnerability (e.g., Auth Bypass, IDOR, Privilege Escalation, XSS, Secret Leak)
   - Affected surface or endpoint (e.g., `/api/auth/jwt-bridge`, `firestore.rules`, UI route)
   - Step-by-step reproduction instructions or minimal proof-of-concept
   - Potential impact and severity assessment
   - Suggested remediation (optional)

### Response Timeline & SLA

- **Acknowledgment:** Within 48 hours of receipt
- **Triage & Assessment:** Within 5 business days
- **Fix & Patch Deployment:** Target within 14 business days for Critical and High severity issues
- **Coordinated Disclosure:** Security advisory published only after fix is deployed to production

## Security Architecture & Boundaries

ExpenseFlow enforces defense-in-depth across the following boundaries:

### 1. Edge Isolation & Host Dispatch
- Cloudflare Worker (`worker.js`) enforces strict hostname separation between public marketing content (`expenseflow.site`) and authenticated product routes (`app.expenseflow.site`).
- HTTP response headers automatically include:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### 2. Authentication & JWT Bridging
- Primary authentication handled through Clerk.
- Cloudflare Worker endpoint (`/api/auth/jwt-bridge`) validates Clerk session tokens and mints scoped Firebase custom tokens via RS256 Web Crypto.
- Guest access utilizes ephemeral tokens scoped strictly to the specified group without persistent identity escalation.

### 3. Database Authorization (`firestore.rules`)
- All database operations are validated directly by Firebase Firestore Security Rules.
- Client SDK requests have zero administrator privileges. Group reads, writes, and expense modifications require verified group membership.

### 4. Webhook Integrity
- Webhooks received from Clerk at `/api/clerk-webhook` are verified via `svix` cryptographic signature headers (`svix-id`, `svix-timestamp`, `svix-signature`) using `CLERK_WEBHOOK_SECRET`.

### 5. Secret Management
- Zero secrets committed to source control.
- Client builds strictly expose public keys prefixed with `VITE_`.
- Server-side secrets (`CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `FIREBASE_SERVICE_ACCOUNT_B64`) are managed through Cloudflare Worker secrets (`wrangler secret put`) and `.dev.vars` for local development.

## Out of Scope

The following areas are out of scope for security bug bounties/reports:

- Denial of Service (DoS/DDoS) attacks against Cloudflare edge infrastructure
- Rate-limiting nuances on third-party provider endpoints (Clerk, Cloudinary)
- Issues requiring physical access to an unlocked user device
- Attacks requiring outdated, modified, or unsupported web browsers
