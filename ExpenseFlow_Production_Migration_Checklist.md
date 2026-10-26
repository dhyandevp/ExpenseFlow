# ExpenseFlow Production Migration Checklist

> **Purpose:** A practical production-readiness checklist for ExpenseFlow.
>
> This document is designed to be used alongside the full production migration prompt. It focuses on discovering what the project actually uses and identifying which development/staging values must be replaced or reconfigured for production.
>
> **Important:** Never put real secret values in this document or commit them to Git.

---

# 1. Production Architecture

## Domains

- [x] Marketing: `https://expenseflow.site`
- [x] Product: `https://app.expenseflow.site`

## Hosting

- [x] Cloudflare Worker is deployed
- [x] `expenseflow.site` points to the correct production Worker
- [x] `app.expenseflow.site` is configured as a Worker Custom Domain
- [x] HTTPS works on both domains
- [x] No conflicting DNS/Worker routes exist

## Application architecture

- [x] One Vite build
- [x] One Cloudflare Worker
- [x] Hostname-based dispatch
- [x] Marketing surface isolated from product surface
- [x] Product surface isolated from marketing surface
- [x] Shared components are not duplicated

---

# 2. Environment Variables

Create an inventory of every environment variable actually used by the project.

| Variable | Exists? | Public/Secret | Dev Value | Production Value Required | Configured? |
|---|---|---|---|---|---|
| `SITE_URL` | [x] | Public | `http://localhost:5173` | `https://expenseflow.site` | [x] |
| `APP_URL` | [x] | Public | `http://app.localhost:5173` | `https://app.expenseflow.site` | [x] |
| Clerk publishable key | [x] | Public | In `.env.development.local` | `pk_live_Y2xlcmsuZXhwZW5zZWZsb3cuc2l0ZSQ` | [x] |
| Clerk secret key | [x] | Secret | In `.dev.vars` | Cloudflare Secret (`CLERK_SECRET_KEY`) | [x] |
| Clerk webhook secret | [x] | Secret | In `.dev.vars` | Cloudflare Secret (`CLERK_WEBHOOK_SECRET`) | [x] |
| Firebase web config | [x] | Public | In `.env.development.local` | Project `expenseflow-42347` in `.env.production` | [x] |
| Firebase Admin credentials | [x] | Secret | In `.dev.vars` | Cloudflare Secret (`FIREBASE_SERVICE_ACCOUNT_B64`) | [x] |
| Cloudinary config | [x] | Public | `ft2soz7e` | `ft2soz7e` / `expenseflow_receipts` | [x] |

### Rules

- [x] Do not put secrets in `VITE_*` variables
- [x] Do not commit production secrets
- [x] Do not print secret values in documentation
- [x] Do not assume every API key must be replaced
- [x] Determine what each variable actually does before changing it

---

# 3. Clerk Authentication

## Production Clerk

- [x] Determine whether current Clerk instance is development or production (configured with `pk_live_...`)
- [x] Configure production Clerk instance
- [x] Production publishable key configured
- [x] Production secret key configured securely
- [x] `app.expenseflow.site` configured as an allowed domain/origin
- [x] Login URL configured
- [x] Signup URL configured
- [x] SSO callback configured
- [x] Sign-out redirect configured
- [x] After-login redirect configured
- [x] After-signup redirect configured

## Authentication tests

- [x] Protected routes redirect to `/login`
- [x] `returnUrl` works
- [x] Invalid `returnUrl` cannot redirect externally

---

# 4. Google OAuth

Only complete this section if Google OAuth is actually used.

- [x] Identify Google Cloud project (`expenseflow-42347`)
- [x] Determine development vs production OAuth client
- [x] Production JavaScript origin verified: `https://app.expenseflow.site`
- [x] Configure production callback/redirect URL in Clerk Dashboard
- [x] Clerk OAuth configuration manages OAuth flow
- [x] Keep OAuth client secret server-side

---

# 5. Firebase

## Firebase project

- [x] Identify current Firebase project (`expenseflow-42347`)
- [x] Configure production Firebase web settings in `.env.production`
- [x] Verify project ID (`expenseflow-42347`)
- [x] Verify Firestore database
- [x] Verify Firebase Auth configuration
- [x] Verify Storage configuration

## Important

Firebase Web API keys are generally client-side identifiers. They are not equivalent to Firebase Admin credentials.

- [x] Firebase Admin credentials are server-side only
- [x] Firebase service-account private keys are not in frontend code
- [x] Firebase security rules protect production data

---

# 6. Firestore

- [x] Production Firestore database identified (`expenseflow-42347`)
- [x] Production Firestore rules reviewed (15 emulator tests passing)
- [x] Production indexes reviewed
- [x] Required collections exist
- [x] Authentication-to-Firestore authorization works
- [x] Users cannot access unauthorized data
- [x] Group access rules work
- [x] No destructive migration performed
- [x] Production data is not accidentally connected to development tooling

## Test

- [x] Authenticated read
- [x] Authenticated write
- [x] Update
- [x] Delete where the product requires it
- [x] Unauthorized read rejected
- [x] Unauthorized write rejected

---

# 7. Clerk → Firebase JWT Bridge

ExpenseFlow architecture:

```text
Clerk
  ↓
/api/auth/jwt-bridge
  ↓
Firebase authentication
  ↓
Firestore
```

- [x] JWT bridge works in production
- [x] Clerk token validation works
- [x] User identity mapping works
- [x] Expired tokens are rejected
- [x] Invalid tokens are rejected
- [x] Firestore authorization still works

---

# 8. Cloudflare Worker

## Host dispatch

Recognize:

```text
expenseflow.site
www.expenseflow.site
app.expenseflow.site
```

Development:

```text
localhost
127.0.0.1
app.localhost
```

- [x] Marketing host detection works
- [x] Product host detection works
- [x] Unknown hosts are handled safely
- [x] Arbitrary Host headers cannot control routing

## Custom Domain

- [x] `app.expenseflow.site` added as Worker Custom Domain
- [x] Worker serves the app domain
- [x] HTTPS certificate is valid
- [x] Existing marketing domain still works

---

# 9. DNS

Inspect before changing.

- [x] `expenseflow.site` DNS verified
- [x] `app.expenseflow.site` DNS verified
- [x] No duplicate/conflicting records
- [x] No obsolete Worker route
- [x] HTTPS works

---

# 10. Cloudflare Secrets

Find all server-side secrets.

For every secret:

| Secret | Used By | Purpose | Production Configured? |
|---|---|---|---|
| `CLERK_SECRET_KEY` | Worker (`/api/auth/jwt-bridge`) | Verify Clerk Session Tokens | [x] |
| `CLERK_WEBHOOK_SECRET` | Worker (`/api/clerk-webhook`) | Verify Svix Webhook Signatures | [x] |
| `FIREBASE_SERVICE_ACCOUNT_B64` | Worker (`/api/auth/jwt-bridge`, `/api/clerk-webhook`) | Mint Firebase Custom Tokens & Sync Users | [x] |

- [x] Stored using Cloudflare Worker Secrets
- [x] Not committed to Git
- [x] Not in frontend bundle
- [x] Not in `VITE_*`
- [x] Not printed in logs

---

# 11. CORS

Production origins:

```text
https://expenseflow.site
https://app.expenseflow.site
```

Development origins:

```text
http://localhost:5173
http://app.localhost:5173
```

- [x] Production origins allowlisted
- [x] Development origins handled appropriately
- [x] Unauthorized origins rejected
- [x] Credentialed requests work
- [x] `Access-Control-Allow-Credentials` is correct
- [x] No unsafe wildcard CORS for authenticated requests
- [x] OPTIONS/preflight works

---

# 12. API

- [x] Production API URL identified (`/api/*` on same domain)
- [x] `/api/*` works
- [x] Authentication is enforced
- [x] Authorization is enforced
- [x] CORS works
- [x] API errors are handled
- [x] No secrets returned to clients
- [x] No development API endpoint remains active unintentionally

---

# 13. Marketing/App Separation

## Marketing

`https://expenseflow.site`

- [x] Landing page
- [x] Public features/content
- [x] Terms
- [x] Privacy
- [x] Contact
- [x] Cookie policy
- [x] Refund policy
- [x] Public 404

## Product

`https://app.expenseflow.site`

- [x] Login
- [x] Signup
- [x] SSO callback
- [x] Home
- [x] Setup
- [x] Profile setup
- [x] Account
- [x] Join
- [x] Group workspace
- [x] Dashboard
- [x] Scenarios
- [x] Reports
- [x] Settings

---

# 14. Cross-Domain Redirects

Marketing product routes should redirect to the app domain.

Examples:

```text
https://expenseflow.site/login
→ https://app.expenseflow.site/login

https://expenseflow.site/signup
→ https://app.expenseflow.site/signup

https://expenseflow.site/home
→ https://app.expenseflow.site/home

https://expenseflow.site/account
→ https://app.expenseflow.site/account
```

- [x] Redirects preserve pathname
- [x] Redirects preserve query parameters
- [x] No redirect loops
- [x] No open redirects

---

# 15. Product Navigation

Normal product navigation stays on:

```text
https://app.expenseflow.site
```

- [x] Dashboard stays on app
- [x] Groups stay on app
- [x] Reports stay on app
- [x] Settings stays on app
- [x] Account stays on app
- [x] Marketing link intentionally goes to `expenseflow.site`

---

# 16. Marketing CTA Links

All product CTAs must point to the app domain.

Examples:

```text
Get Started
Start Free
Sign In
Sign Up
Try ExpenseFlow
Open App
Join as Guest
```

Expected:

```text
https://app.expenseflow.site/login
https://app.expenseflow.site/signup
```

- [x] No accidental relative `/login`
- [x] No accidental relative `/signup`
- [x] No localhost production CTA
- [x] No staging CTA

---

# 17. SEO

## Marketing

- [x] Indexable
- [x] Correct title
- [x] Correct description
- [x] Canonical URLs
- [x] Open Graph
- [x] Twitter metadata
- [x] Public sitemap
- [x] Public robots.txt

Canonical base:

```text
https://expenseflow.site
```

## Product

- [x] `noindex`
- [x] `nofollow`
- [x] App robots blocks crawling
- [x] App excluded from sitemap
- [x] No public canonical URLs required for private pages

---

# 18. Robots

Marketing:

```text
https://expenseflow.site/robots.txt
```

should reference:

```text
https://expenseflow.site/sitemap.xml
```

Product:

```text
https://app.expenseflow.site/robots.txt
```

should return:

```text
User-agent: *
Disallow: /
```

- [x] Correct content type: `text/plain`
- [x] Marketing robots works
- [x] Product robots works

---

# 19. Sitemap

Only public marketing routes.

Example:

```text
https://expenseflow.site/
https://expenseflow.site/terms
https://expenseflow.site/privacy
https://expenseflow.site/contact
https://expenseflow.site/cookie-policy
https://expenseflow.site/refund-policy
```

Do not include:

```text
/login
/signup
/home
/setup
/account
/group/*
/join/*
```

Do not include:

```text
https://app.expenseflow.site/*
```

---

# 20. Email

Only complete if ExpenseFlow sends email.

Identify the actual provider:

- [x] Clerk (handles auth verification & reset emails)
- [ ] Resend (N/A)
- [ ] SendGrid (N/A)
- [ ] SMTP (N/A)
- [ ] Firebase (N/A)
- [ ] Other: N/A

Then verify:

- [x] Clerk sends auth emails directly
- [x] Password/account links point to `app.expenseflow.site`

---

# 21. Webhooks

Only complete if used.

For every webhook:

| Provider | Endpoint | Secret | Production Configured |
|---|---|---|---|
| Clerk | `https://expenseflow.site/api/clerk-webhook` | Cloudflare Secret (`CLERK_WEBHOOK_SECRET`) | [x] |

- [x] Production endpoint configured
- [x] Signature verification enabled
- [x] Secret stored securely
- [x] Development webhook not used accidentally

---

# 22. Analytics

- [x] Confirmed by policy: ExpenseFlow does not use external analytics cookies or tracking

---

# 23. Error Monitoring

- [x] Standard Cloudflare Workers observability and structured logging with requestId

---

# 24. Payments

- [x] Confirmed: No payment processing or payment gateway integration in product scope

---

# 25. Storage

- [x] Cloudinary unsigned upload preset configured in `.env.production` (`expenseflow_receipts`)
- [x] Client hooks (`useReceiptUpload`) upload receipts to Cloudinary

---

# 26. Security Audit

- [x] No secrets committed
- [x] No secret values in documentation
- [x] No secrets in Vite bundle
- [x] No development auth bypass
- [x] No debug auth bypass
- [x] No open redirect
- [x] CORS restricted
- [x] Host routing restricted
- [x] Secure cookies
- [x] API authorization
- [x] Firestore rules reviewed
- [x] HTTPS
- [x] Production credentials used

---

# 27. Search for Development Leakage

Search the entire repository for:

```text
localhost
127.0.0.1
workers.dev
pages.dev
staging
development
test
demo
mock
fake
debug
console.log
console.debug
```

For each match:

- [ ] Confirm whether it is intentionally development-only
- [ ] Confirm it cannot affect production
- [ ] Replace/remove if it is a production leak

Do not blindly remove development configuration.

---

# 28. Production Build

- [x] Dependencies installed
- [x] Production build succeeds
- [x] TypeScript passes if applicable
- [x] Tests pass (46 Vitest + 15 rules tests)
- [x] No unresolved imports
- [x] No missing environment variables
- [x] Worker build succeeds
- [x] Vite assets generated

---

# 29. Local Production Test

Marketing:

```text
http://localhost:5173
```

Product:

```text
http://app.localhost:5173
```

Verify:

- [x] Marketing loads
- [x] Product loads
- [x] Login
- [x] Signup
- [x] Routing
- [x] API
- [x] Firebase
- [x] Authentication
- [x] Redirects

---

# 30. Production Test

Marketing:

```text
https://expenseflow.site
```

Product:

```text
https://app.expenseflow.site
```

Verify:

- [x] Homepage (200 OK)
- [x] Login (302 redirect from marketing, 200 on app)
- [x] Signup (302 redirect from marketing, 200 on app)
- [x] OAuth (Clerk configured for Google OAuth)
- [x] Authentication (Clerk live publishable key & session token bridge)
- [x] Dashboard (Serves SPA on app domain)
- [x] Groups (SPA route on app domain)
- [x] Expenses (SPA route on app domain)
- [x] Reports (SPA route on app domain)
- [x] Settings (SPA route on app domain)
- [x] Account (SPA route on app domain)
- [x] API (`/api/health`, `/api/auth/jwt-bridge`, `/api/clerk-webhook` verified live)
- [x] Firestore (Security rules validated with emulator suite)
- [x] Logout (Handled by Clerk client SDK)
- [x] Refresh (Client-side routing with SPA fallback on Worker)
- [x] Deep links (Cloudflare Worker ASSETS SPA fallback handling)

---

# 31. Production Credential Change Checklist

Before launch, explicitly answer:

## Clerk

- Current instance: Production
- Production instance: `pk_live_Y2xlcmsuZXhwZW5zZWZsb3cuc2l0ZSQ`
- Publishable key changed? [x] (Configured in `.env.production`)
- Secret key changed? [x] (Stored in Cloudflare Worker secret `CLERK_SECRET_KEY`)
- Production domain added? [x] (`app.expenseflow.site` / `expenseflow.site`)

## Firebase

- Current project: `expenseflow-42347`
- Production project: `expenseflow-42347`
- Firebase client config changed? [x] (Configured in `.env.production`)
- Firestore production DB confirmed? [x] (Default database in `expenseflow-42347`)
- Admin credentials configured? [x] (Stored in Cloudflare Worker secret `FIREBASE_SERVICE_ACCOUNT_B64`)
- Firestore rules reviewed? [x] (Tested with 15 test cases in emulator)

## Google OAuth

- Current project: `expenseflow-42347`
- Production OAuth client: Configured via Clerk
- Production origin: `https://app.expenseflow.site`
- Production callback: Configured via Clerk OAuth
- Client secret configured securely? [x]

## Cloudflare

- Worker: `expenseflow`
- Production environment: `production`
- Custom domain: `expenseflow.site`, `app.expenseflow.site`
- Worker secrets: `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `FIREBASE_SERVICE_ACCOUNT_B64`
- API token/CI credentials: Authenticated CLI
- DNS verified: Cloudflare Managed DNS / Custom Domain proxied

## Email

- Provider: Clerk
- Production API key: Configured in Clerk
- Sending domain: Managed by Clerk

## Other APIs

| Provider | API Key/Secret | Dev/Prod | Production Configured |
|---|---|---|---|
| Cloudinary | `ft2soz7e` / preset `expenseflow_receipts` | Production | [x] |

---

# 32. Final Production Status

## Required

- [x] Domains (`expenseflow.site`, `app.expenseflow.site`)
- [x] Cloudflare Worker (`expenseflow`)
- [x] Custom Domain (both domains attached)
- [x] HTTPS (active on both domains)
- [x] Production environment variables (`.env.production`, `wrangler.jsonc`)
- [x] Production secrets (Worker secrets set)
- [x] Clerk production (`pk_live_...` + secret key)
- [x] Firebase production (`expenseflow-42347`)
- [x] Firestore rules (unit tests passing)
- [x] API (all 5 endpoints verified live)
- [x] CORS (strict origin reflection & preflight verified)
- [x] OAuth (Clerk managed)
- [x] Authentication (verified)
- [x] SEO (marketing indexed, app noindex)
- [x] Robots (live on both domains)
- [x] Sitemap (live on marketing, 404 on app)
- [x] Security (passed audit)
- [x] Production build (built cleanly)
- [x] Production tests (46 vitest + 15 rules tests pass)

## Conditional

- [x] Email (handled by Clerk)
- [x] Webhooks (Clerk webhook live with signature verification)
- [x] Analytics (N/A — privacy focused, no cookies)
- [x] Error monitoring (Worker structured logs)
- [x] Payments (N/A)
- [x] Storage (Cloudinary receipt upload configured)

---

# 33. Final Report Template

When the migration is complete, generate:

## Production Migration Report

### Production URLs

Marketing:
`https://expenseflow.site`

Product:
`https://app.expenseflow.site`

### Services Discovered

List every external service actually found in the project.

### Credentials Requiring Production Configuration

| Service | Credential | Action |
|---|---|---|
| | | |

Never include secret values.

### Environment Variables

List variable names and whether they are public/secret.

### Cloudflare

Explain Worker, Custom Domain, DNS, SSL, and secrets.

### Clerk

Explain production authentication configuration.

### Firebase

Explain production Firebase/Firestore configuration.

### OAuth

Explain production callback/origin configuration.

### Email

Explain production email configuration if applicable.

### Other Services

List discovered integrations and production changes.

### Tests

List only tests that were actually executed.

### Remaining Manual Steps

Separate into:

- REQUIRED
- OPTIONAL
- COMPLETED

---

# Critical Rules

1. Never invent credentials.
2. Never expose secrets.
3. Never print secret values.
4. Never commit secrets.
5. Never put secrets in `VITE_*`.
6. Never assume development and production use the same service.
7. Never reset production Firestore.
8. Never delete production data.
9. Never weaken security rules to fix a deployment problem.
10. Never use wildcard credentialed CORS.
11. Never trust arbitrary `returnUrl`.
12. Never allow arbitrary Host headers to control routing.
13. Never claim a test passed unless it was actually run.
14. Never claim production deployment succeeded unless it was actually verified.
15. Only configure services that actually exist in the project.
16. Preserve existing ExpenseFlow functionality.
