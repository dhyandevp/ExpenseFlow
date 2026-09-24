# Design Document: ExpenseFlow Hostname-Based App and Marketing Separation

## Date: 2026-09-24
## Status: Approved

## 1. Overview
ExpenseFlow is currently a unified React/Vite single-page application (SPA) backed by Firebase Firestore and Cloudflare Workers (handling `/api/*` and serving static assets).
This design specifies the architectural separation of:
- **Showcase / Marketing Website:** `https://expenseflow.site`
- **Product Application:** `https://app.expenseflow.site`

Using a **Unified Hostname-Aware SPA + Cloudflare Worker Host Dispatch** architecture. Both surfaces share the same Vite build, the same Cloudflare Worker, and shared UI primitives, while delivering strictly separated routing, SEO, authentication, and navigation behaviors.

---

## 2. Host Dispatch & Detection

### 2.1 Cloudflare Worker (`worker.js`)
The Worker inspects `request.headers.get('host')` or `new URL(request.url).hostname`:
- **Marketing Hosts**: `expenseflow.site`, `www.expenseflow.site`, `localhost`, `127.0.0.1`
- **App Hosts**: `app.expenseflow.site`, `app.localhost`

#### Edge Behaviors:
1. **Robots.txt Routing (`/robots.txt`)**:
   - `app.expenseflow.site` / `app.localhost`: Returns `text/plain` response:
     ```text
     User-agent: *
     Disallow: /
     ```
   - `expenseflow.site` / `localhost`: Returns the indexable marketing `robots.txt` referencing `https://expenseflow.site/sitemap.xml`.
2. **Edge Redirects for Cross-Surface URLs**:
   - If a request lands on a marketing host for product routes (e.g., `/dashboard`, `/home`, `/group/*`, `/setup`, `/account`, `/login`, `/signup`), the Worker redirects `302` to `https://app.expenseflow.site${pathname}${search}`.
3. **API & Static Assets**:
   - `/api/*` endpoints are available for both hosts.
   - Hashed assets (`/assets/*`) and static files (`/favicon.ico`, etc.) are served uniformly from `env.ASSETS` for both hosts.
   - Fallback is SPA `index.html` for client routing.

### 2.2 Client-Side Host Utility (`client/src/lib/host.js`)
Centralized helper for detecting current surface and generating cross-surface links:
- `isAppHost()`: Returns `true` if `window.location.hostname === 'app.expenseflow.site'` or `window.location.hostname.startsWith('app.localhost')` (or query param/env override for testing).
- `isMarketingHost()`: `!isAppHost()`.
- `getAppUrl(path = '')`: In production, returns `https://app.expenseflow.site${path}`. In development, returns `http://app.localhost:${port}${path}`.
- `getSiteUrl(path = '')`: In production, returns `https://expenseflow.site${path}`. In development, returns `http://localhost:${port}${path}`.

---

## 3. Routing Architecture

### 3.1 Marketing Surface (`expenseflow.site`)
Only public showcase content is rendered:
- `/`: Marketing Landing page (features, testimonials, interactive preview, FAQ).
- Legal/Informational: `/terms`, `/privacy`, `/contact`, `/cookie-policy`, `/refund-policy`.
- Catch-all / 404: `NotFound` component.
- **Cross-Domain Redirect Guard**:
  If a visitor navigates on marketing host to `/home`, `/setup`, `/account`, `/group/:code/*`, `/login`, or `/signup`, the client router performs an external redirect to `getAppUrl(pathname + search)`.
- **Call-to-Action (CTA) Links**:
  All buttons (Sign In, Get Started, Join as Guest, Try ExpenseFlow) link to `getAppUrl('/login')`, `getAppUrl('/signup')`, or `getAppUrl('/join/' + code)`.

### 3.2 Product Surface (`app.expenseflow.site`)
Only product and authentication interfaces are rendered:
- **Authentication**:
  - `/login`: Dedicated login page with email/password, Google OAuth, and link to signup / guest access. Supports `?returnUrl=...`.
  - `/signup`: Dedicated signup page with email verification, Google OAuth, Terms acceptance. Supports `?returnUrl=...`.
  - `/sso-callback`: Clerk OAuth redirect callback handler.
- **Onboarding & Account**:
  - `/home`: Groups home / selection (protected).
  - `/setup`: Create new group (protected).
  - `/profile-setup`: Initial user profile completion (protected).
  - `/account`: User profile & settings (protected).
- **Group Workspace**:
  - `/join/:code`: Join group by code (supports guest / authenticated).
  - `/group/:code`: Expense logger.
  - `/group/:code/dashboard`: Balance & fairness dashboard.
  - `/group/:code/scenarios`: Scenario planner.
  - `/group/:code/report`: Fairness report.
  - `/group/:code/settings`: Group settings.
- **Root on App (`/`)**:
  - If authenticated: redirects to `/home`.
  - If unauthenticated: redirects to `/login`.
- **Navigation Back to Marketing**:
  - App sidebar and mobile menu include "← ExpenseFlow" link pointing to `getSiteUrl('/')`.

---

## 4. Authentication & Session Flow
- **Clerk Configuration**:
  - Operates on `app.expenseflow.site`.
  - Protected routes check `user`. If unauthenticated:
    ```js
    navigate(`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    ```
  - After successful sign in/sign up, user is redirected to `returnUrl` (default `/home`).
  - Sign out redirects to `/login`.
  - Clerk session tokens continue to bridge to Firebase via `/api/auth/jwt-bridge`.

---

## 5. Security & CORS
- **CORS Allowlist (`api/_lib/cors.js`)**:
  Add `https://app.expenseflow.site`, `http://app.localhost:5173`, and `http://app.localhost:8787`.
  Ensure `Access-Control-Allow-Credentials: true` is retained with specific origin mirroring.
- **Cookies**:
  No broadening of cookies to `.expenseflow.site` required beyond Clerk standard custom domain config.
- **Open Redirect Guard**:
  `returnUrl` is sanitized to ensure it starts with `/` and not `//` or external schemas.

---

## 6. SEO & Metadata
- **Product (`app.expenseflow.site`)**:
  - Worker returns `Disallow: /` on `/robots.txt`.
  - React Helmet sets `<meta name="robots" content="noindex, nofollow" />` across the entire app surface.
  - Excluded from `sitemap.xml`.
- **Marketing (`expenseflow.site`)**:
  - Public `robots.txt` referencing `sitemap.xml`.
  - Canonical tags point to `https://expenseflow.site/...`.
  - `sitemap.xml` includes only marketing routes (`/`, `/terms`, `/privacy`, `/contact`, `/cookie-policy`, `/refund-policy`). Removed `/setup`.

---

## 7. Local Development & Testing Strategy
- `client/vite.config.js`: Set `server: { host: true, port: 5173 }` to accept `app.localhost:5173` and `localhost:5173`.
- Both `http://localhost:5173` (marketing) and `http://app.localhost:5173` (product) work seamlessly out of the box in Chromium/Firefox/WebKit without `/etc/hosts` changes.
- Automated tests verifying:
  - Host detection logic.
  - CORS header responses.
  - Worker robots dispatch.
  - Safe returnUrl validation.
  - Route guards and redirect behavior.
