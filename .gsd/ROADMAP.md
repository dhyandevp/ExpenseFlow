# ROADMAP.md

> **Current Milestone**: v1.0 — Full ExpenseFlow Rebuild
> **Goal**: Transform BalanceBoard into ExpenseFlow with a fully serverless architecture, modern auth, mobile-first UI, receipt uploads via Cloudinary, SEO, unit tests, and a clean git history.

## Must-Haves
- [ ] Complete brand rename from BalanceBoard to ExpenseFlow
- [ ] Firebase Firestore migration replacing SQLite + Express
- [ ] Firestore Security Rules (strict, tested)
- [ ] Balance trigger Netlify Function (denormalized currentBalances)
- [ ] SQLite → Firestore one-time migration script
- [ ] Clerk hybrid authentication (authenticated + guest with PIN)
- [ ] Cloudinary receipt image uploads replacing Firebase Storage
- [ ] Mobile-first liquid glass UI redesign
- [ ] Full SEO (meta tags, sitemap, robots.txt, PWA manifest, og:image, 404 page)
- [ ] Vitest unit tests for all financial math logic
- [ ] Git history cleanup and credential security
- [ ] Legal pages (Terms, Privacy, Contact)

## Phases

### Phase 1: Git Cleanup & Brand Rename
**Status**: ✅ Complete
**Objective**: Secure the repository by cleaning exposed credentials from git history, then rename every brand reference from BalanceBoard to ExpenseFlow. At the end, the app builds and runs as "ExpenseFlow" with no leaked secrets in the commit log.

**Tasks** (ordered):
1. Rotate the live Clerk secret key immediately in the Clerk dashboard (Prompt 6 — Step 1)
2. Add `server/.env` to `.gitignore` if not already there (Prompt 6 — Step 2)
3. Perform git history cleanup — either fresh `git init` or `git-filter-repo` depending on commit count (Prompt 6 — Steps 3–5)
4. Add a pre-commit hook to block `.env` files from being committed (Prompt 6 — Step 6)
5. Create `.env.example` with placeholder values and commit it (Prompt 6 — implied)
6. Replace every occurrence of "BalanceBoard" / "balanceboard" / "balance-board" / "balance_board" with the correct ExpenseFlow case variant across the entire codebase (Prompt 1)
7. Update HTML `<title>` tags, meta descriptions, og:title, og:description tags (Prompt 1)
8. Update README.md with the new project name (Prompt 1)
9. Update `package.json` "name" field in both `/server` and `/client` (Prompt 1)
10. Update `render.yaml` service name (Prompt 1)
11. Update `netlify.toml` site name references (Prompt 1)
12. Update the database filename from "balanceboard.db" to "expenseflow.db" in `db.js` (Prompt 1)
13. Output a complete list of every file modified with the specific line(s) changed (Prompt 1)
14. Verify app builds and runs with the new name

---

### Phase 2: Firebase Firestore Migration
**Status**: ✅ Complete
**Objective**: Replace SQLite + Express with Firestore as the data layer. At the end, all data is stored in Firestore, balances are calculated dynamically on the frontend (Ponytail Ultra), and the app runs fully serverless without Netlify Functions.

**Tasks** (ordered):
1. Install `firebase` in client and `firebase-admin` in netlify/functions (Prompt 2)
2. Create `firebase.js` config file in `client/src/` with offline persistence via `enableIndexedDbPersistence` (Prompt 2)
3. Implement the Firestore collection structure: groups, expenses, members, categories, settlements, fairnessSnapshots (Prompt 2)
4. Move server-side math (greedy debt simplification, fairness score) to `client/src/utils/` as pure functions (Prompt 2)
5. Rewrite each API client call in `client/src/api/client.js` to use Firestore SDK directly (Prompt 2)
6. Create Netlify Function: `balance-trigger.js` — recalculates currentBalances, settlementSuggestions, and fairnessScores on expense writes; uses Firebase Admin SDK with base64-encoded service account (Prompts 2, 9, 6)
7. Create Netlify Function: `export-csv.js` — accepts groupId + date range, returns CSV (Prompt 2)
8. Create Netlify Function: `export-pdf.js` — generates PDF fairness report (Prompt 2)
9. Store `FIREBASE_SERVICE_ACCOUNT_B64` in Netlify environment variables; decode in functions with `Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64')` (Prompt 6)
10. Update `netlify.toml` to point functions directory to `/netlify/functions` (Prompt 2)
11. Write the SQLite → Firestore one-time migration script in `scripts/` directory; use batched writes of 500; preserve SQLite integer IDs as strings; run balance calculation after migration; do verification pass; add to `.netlifyignore` (Prompt 11)
12. Run the migration script locally to seed Firestore
13. Verify app builds and runs against Firestore (dashboard reads single group document)

---

### Phase 3: Firestore Security Rules
**Status**: ✅ Complete
**Objective**: Write and test the complete `firestore.rules` file enforcing all authorization at the database level. At the end, every access pattern is locked down and verified with Firebase Emulator tests (Ponytail Ultra applied to remove rate limiting and service account restrictions).

**Tasks** (ordered):
1. Write helper functions: `isClerkMember()`, `isGuestMember()`, `isGroupMember()` (Prompt 10)
2. Write rules: authenticated user can read a group if their userId is in members subcollection (Prompt 10)
3. Write rules: guest token can only read the group matching its `guestGroupId` claim (Prompt 10)
4. Write rules: only Clerk-authenticated users can create new groups; guests cannot (Prompt 10)
5. Write rules: expense read/write restricted to group members (Prompt 10)
6. Write rules: `currentBalances`, `settlementSuggestions`, `fairnessScores` fields writable only by service account; readable by group members (Prompt 10)
7. Write rules: member document — users can read all members in their group; can only write their own (Prompt 10)
8. Write rules: settlement documents — creatable by group members; immutable after creation (Prompt 10)
9. Write rules: category documents — readable by group members; writable only by Clerk-authenticated members (Prompt 10)
10. Rate limit: enforce 10 reads per 15 minutes on group-by-code lookups via Firestore counter document with TTL (Prompt 2)
11. Write complete Firebase Emulator test cases covering allowed and denied cases for every collection (Prompt 10)
12. Run emulator tests and verify all pass

---

### Phase 4: Clerk Hybrid Authentication
**Status**: ✅ Complete
**Objective**: Implement Clerk-based authentication with both authenticated and guest access modes, wired to Firebase custom tokens via the jwt-bridge function. At the end, users can sign in with Clerk or join with a code+PIN, and Firestore Security Rules enforce scoped access.

**Tasks** (ordered):
1. Install `@clerk/clerk-react` in client (Prompt 3)
2. Wrap `App.jsx` in `<ClerkProvider publishableKey={...}>` (Prompt 3)
3. Create Netlify Function: `jwt-bridge.js` — exchanges Clerk session token for Firebase custom token; for guests: verifies code+PIN against Firestore, issues scoped token with `{ guestGroupId, mode: "guest" }` claim, 1-hour expiry (Prompts 2, 3)
4. Implement jwt-bridge rate limiting: 10 attempts per 15 minutes per IP; block IP for 1 hour after 3 consecutive PIN failures (Prompt 3)
5. Create Netlify Function: `clerk-webhook.js` — handles `user.created` from Clerk, seeds Firestore user document (Prompt 2)
6. Create `<SignInModal>` using Clerk's `<SignIn />` component with modal appearance (Prompt 3)
7. Create `PINVerification.jsx` component: 6-digit masked input, `inputMode="numeric"`, auto-advance, show/hide toggle, shake animation on wrong PIN, Aurora Forest tokens (Prompt 5 — Verification Flow)
8. Create guest join modal: group code input (6 chars) + PIN input + "Join group" button (Prompt 3)
9. After auth, call `firebase.auth().signInWithCustomToken()` (Prompt 3)
10. Create `useAuth()` custom hook returning `{ user, authMode, groupAccess, signOut, isLoaded }` (Prompt 3)
11. Store auth mode (`clerk | guest`) in React Context (Prompt 3)
12. Implement UI flows: Landing page with two CTAs — "Sign in with Clerk" and "Join with a code" (Prompt 3)
13. After any auth, redirect to `/dashboard` (Prompt 3)
14. Group setup page only available to Clerk-authenticated users (Prompt 3)
15. Settings page shows auth mode badge: "Signed in" (green) or "Guest access" (grey) with upgrade option (Prompt 3)
16. Handle error states: wrong PIN, code not found, locked out, network error (Prompt 5 — Verification Flow)
17. Verify Clerk + guest auth both work end-to-end against Firestore Security Rules

---

### Phase 5: Cloudinary Receipt Uploads
**Status**: ✅ Complete
**Objective**: Replace Firebase Storage with Cloudinary for all receipt image uploads. At the end, receipts upload directly to Cloudinary with automatic WebP compression, and the Firestore expense document stores a permanent Cloudinary URL.

**Tasks** (ordered):
1. Set up Cloudinary upload preset: `expenseflow_receipts`, unsigned, folder `receipts/`, allowed formats jpg/png/webp, max 5 MB, incoming transformations (format: webp, quality: auto, width: 1600 crop: limit) (Prompt 8)
2. Add `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` to `client/.env` and Netlify environment variables (Prompt 8)
3. `npm uninstall browser-image-compression` in client (Prompt 8)
4. Remove `firebase/storage` import from `firebase.js` (Prompt 8)
5. Remove `getStorage`, `uploadBytesResumable`, `getDownloadURL` imports everywhere (Prompt 8)
6. Delete `storage.rules` file (Prompt 8)
7. Create `client/src/hooks/useReceiptUpload.js` with XHR-based upload, progress tracking, file type/size validation (Prompt 8)
8. Update `ReceiptUpload.jsx` / `ExpenseForm.jsx` to use `useReceiptUpload()` hook (Prompt 8)
9. Rename `receiptPath` field to `receiptUrl` in Firestore expense document schema; update all reads in UI (Prompt 8)
10. Update receipt display to use Cloudinary URL directly in `<img>` tags with `loading="lazy"` (Prompt 8)
11. Implement thumbnail URL transformation for expense list view (`/upload/w_200,f_auto,q_auto/`) (Prompt 8)
12. Run the Prompt 8 checklist: test 4 MB JPEG → WebP, test SVG rejection, verify `receiptUrl` in Firestore, verify `<img>` renders (Prompt 8)

---

### Phase 6: Mobile-First UI Redesign (Liquid Glass Theme)
**Status**: ✅ Complete
**Objective**: Redesign the entire UI as mobile-first with liquid glass aesthetic using Stitch MCP and Motion AI, preserving the Aurora Forest color palette. At the end, the app is fully responsive at 390px and 768px breakpoints with performant glass effects and animations.

**Tasks** (ordered):
1. Run `npx stitch generate --from tailwind.config.js --output src/tokens/` to generate design tokens (Prompt 4)
2. Import stitch tokens in `index.css` as CSS custom properties (Prompt 4)
3. Define liquid glass CSS: `backdrop-filter: blur()` only on bottom nav, sticky header, modal overlays — never on full-page backgrounds or card grids (Prompt 4)
4. Add performance fallback: `@media (prefers-reduced-transparency: reduce)` disables all blur (Prompt 4)
5. Glass tint: `rgba(235, 250, 219, 0.72)`; glass border: `1px solid rgba(194, 203, 201, 0.4)` (Prompt 4)
6. Run `npx motion-ai` to generate animation presets (Prompt 4)
7. Implement motion animations: page transitions (slide-up/fade-out 150ms), card hover (desktop only), FAB spring scale, balance count-up (800ms), fairness gauge arc draw (600ms), sheet slide-up (350ms spring) (Prompt 4)
8. Redesign `AppLayout.jsx` — glass bottom navigation bar (Home · Add · Groups · Reports) + glass sticky top header (Prompt 4)
9. Redesign `Dashboard.jsx` — mobile-optimized card grid + swipeable chart tabs (Prompt 4)
10. Redesign `ExpenseLogger.jsx` — bottom sheet instead of page transition (Prompt 4)
11. Redesign `Landing.jsx` — hero section with subtle glass card; two CTAs wired to auth (Prompt 4)
12. Redesign `GroupSetup.jsx` — wizard step cards (mobile-friendly steps) (Prompt 4)
13. Redesign `SettlementHistory.jsx` — timeline list view (Prompt 4)
14. Implement swipe gestures on expense list: swipe-left to delete, swipe-right to edit (Framer Motion drag) (Prompt 4)
15. Mobile layout targets: FAB bottom-right with --primary color, cards full-width on mobile / 2-column on tablet, dashboard charts horizontal scroll on mobile (Prompt 4)
16. Verify UI at 390px and 768px; ensure `will-change: transform` only on animated glass elements (Prompt 4)

---

### Phase 7: SEO, Meta Tags, Legal Pages & 404
**Status**: ✅ Complete
**Objective**: Implement full SEO infrastructure, legal pages, the 404 page, and PWA manifest. At the end, the site is search-engine ready with proper meta tags, structured data, sitemap, and all legal/utility pages in place.

**Tasks** (ordered):
1. Add all base meta tags to `client/index.html`: charset, viewport, title, description, keywords, author, theme-color, Open Graph, Twitter Card, canonical, JSON-LD structured data (Prompt 5)
2. Install `react-helmet-async`; create `useSEO(config)` custom hook in `client/src/utils/seo.js` (Prompt 5)
3. Add `<HelmetProvider>` to `client/src/App.jsx` (Prompt 5)
4. Apply `useSEO()` in each page component with unique title, description, canonical (Prompt 5)
5. Create `/public/sitemap.xml` with all public routes (Prompt 5)
6. Create `/public/robots.txt` — allow `/`, disallow `/api/`, `/dashboard/`, `/group/` (Prompt 5)
7. Create `/public/manifest.json` — PWA manifest with name, icons, theme_color, background_color (Prompt 5)
8. Generate `og-image.png` (1200×630px) — Aurora Forest palette, ExpenseFlow wordmark, tagline, fairness gauge; place in client public directory (Prompt 13)
9. Create 404 page component at correct path for Netlify; register as catch-all in React Router; Aurora Forest palette; "Go home" and "Join group" actions; `<title>` = "404 — Page Not Found"; noindex meta tag (Prompt 12)
10. Configure `netlify.toml` to return actual 404 HTTP status code for unmatched routes (Prompt 12)
11. Create Terms and Conditions page at `/terms` route (Part 2 — Legal)
12. Create Privacy Policy page at `/privacy` route (Part 2 — Legal)
13. Create Contact page at `/contact` route (Part 2 — Legal)
14. Verify: Lighthouse audit, opengraph.xyz preview, unique titles per page, structured data validation, mobile-friendly test (Prompts 5, 13, Part 3)

---

### Phase 8: Vitest Unit Tests
**Status**: ✅ Complete
**Objective**: Add comprehensive unit tests for all financial math logic using Vitest. At the end, all balance calculations, fairness scores, recurring logic, CSV safety, and split models are tested and passing.

**Tasks** (ordered):
1. Install `vitest` and `@vitest/ui` as dev dependencies in client (Prompt 7)
2. Add `"test": "vitest"` and `"test:ui": "vitest --ui"` to `package.json` scripts (Prompt 7)
3. Create `client/src/utils/__tests__/balanceMath.test.js` (Prompt 7)
4. Test `greedySettle()`: 3-member case, 4-member unequal splits (≤ N-1 transactions), all-settled (empty array), single member (Prompt 7)
5. Test `fairnessScore()`: equal contributions (all 100), one payer (100/0), range [0,100], rounds to integer (Prompt 7)
6. Test `applyRecurring()`: weekly trigger (7+ days), monthly no-trigger (<30 days), next_run advancement (Prompt 7)
7. Test `csvSafe()`: values starting with `=` or `+` get `'` prefix, normal strings unchanged, numbers unchanged (Prompt 7)
8. Test `calculateSplits()`: equal split, custom percentage, rounding (sum equals total) (Prompt 7)
9. Run `npx vitest run` and verify all tests pass (Prompt 7)

---

### Phase 9: Final Cleanup & Server Removal
**Status**: ✅ Complete
**Objective**: Remove the legacy Express/SQLite server directory and verify the fully serverless app runs end-to-end with no references to the old stack.

**Tasks** (ordered):
1. Delete the `/server` directory entirely (Prompt 2 — Step 6)
2. Remove `render.yaml` (no longer deploying to Render)
3. Remove any remaining references to Express, better-sqlite3, or Render from package.json, README, and config files
4. Update README.md with final architecture description, setup instructions, and deployment guide
5. Final end-to-end verification: auth flows, expense CRUD, balance calculation, receipt upload, CSV/PDF export, all pages render, all tests pass
6. Run the complete Security Testing Checklist from Part 4 of the docs

---

### Phase 10: Desktop UI Redesign (Using Stitch MCP & Motion-AI)
**Status**: ✅ Complete
**Objective**: Build a Desktop-optimized view utilizing stitch mcp for layout primitives and npx motion-ai for interactions, applying multi-column grid layouts and strict Aurora Forest / Timeless Grey color constraints (no alarmist red).
**Depends on**: Phase 9

**Tasks**:
- [ ] TBD (run /plan 10 to create)

**Verification**:
- TBD

---

### Phase 11: Database Schema & Shared Architecture
**Status**: ⬜ Not Started
**Objective**: Correct the Firestore database schema structure and extract financial math logic into a shared directory for reuse between client and serverless functions.
**Depends on**: Phase 10

**Tasks**:
- [ ] TBD (run /plan 11 to create)

**Verification**:
- TBD

---

### Phase 12: Firestore Security Rules
**Status**: ✅ Complete
**Objective**: Implement strict deny-all default security rules with appropriate role-based access control.
**Depends on**: Phase 11

**Tasks**:
- [ ] TBD (run /plan 12 to create)

**Verification**:
- TBD

---

### Phase 13: Netlify Functions Infrastructure & Auth Bridge
**Status**: ✅ Complete
**Objective**: Scaffold the Netlify functions directory and implement the JWT token exchange for hybrid authentication.
**Depends on**: Phase 12

**Tasks**:
- [x] Configure Netlify Functions Environment
- [x] Implement jwt-bridge.js Core Logic

**Verification**:
- [x] Verified via npm list and grep "functions" netlify.toml
- [x] Verified via npx vitest run tests/jwt-bridge.test.js

---

### Phase 14: Netlify Functions Webhooks & Triggers
**Status**: ✅ Complete
**Objective**: Implement server-side logic for balancing expenses and syncing Clerk users.
**Depends on**: Phase 13

**Tasks**:
- [x] Configure Clerk webhook function (`clerk-webhook.js`)
- [x] Implement Balance Trigger function (`balance-trigger.js`)

**Verification**:
- [x] Verified via `vitest run tests/clerk-webhook.test.js` (5 passing tests)
- [x] Verified via `vitest run tests/balance-trigger.test.js` (4 passing tests)

---

### Phase 15: Authentication State & Landing Routing
**Status**: ✅ Complete
**Objective**: Implement the hybrid authentication hooks and dual call-to-action landing page.
**Depends on**: Phase 14

**Tasks**:
- [x] Enforce authMode in useAuth.js
- [x] Block Guest Group Creation
- [x] Add Auth Badge to Settings
- [x] Update Landing Page CTAs
- [x] Mandatory PIN in Join Flow

**Verification**:
- [x] Visually verified UI updates in Landing, JoinGroup, Settings, and GroupSetup.

---

### Phase 16: PIN Verification Component
**Status**: ✅ Complete
**Objective**: Build a secure, accessible, and robust PIN entry component.
**Depends on**: Phase 15

**Tasks**:
- [x] Framer Motion Shake
- [x] Remove Unauthorized Colors
- [x] Lockout Logic
- [x] Accessibility Fixes

**Verification**:
- [x] Verified `PINVerification.jsx` uses `framer-motion` and `--accent` colors.
- [x] Verified attempt lockout logic and `aria-live` region.

---

### Phase 17: Cloudinary Receipt Uploads
**Status**: ✅ Complete
**Objective**: Implement direct-to-Cloudinary receipt uploads and remove Firebase Storage.
**Depends on**: Phase 16

**Tasks**:
- [x] Remove Legacy Mock Upload

**Verification**:
- [x] Verified `useReceiptUpload.js` correctly implements Cloudinary XMLHttpRequest uploads.
- [x] Verified legacy mocks are removed from `client.js`.

---

### Phase 18: Mobile-First UI & Styling Enforcement
**Status**: ✅ Complete
**Objective**: Enforce strict mobile layouts, glassmorphism constraints, and palette adherence.
**Depends on**: Phase 17

**Tasks**:
- [x] Navigation Components
- [x] Floating Action Button
- [x] Mobile Layout & Scrolling
- [x] Transitions and Colors

**Verification**:
- [x] Verified bottom nav and FAB exist on mobile layouts.
- [x] Verified charts/tables fit 390px without horizontal scroll.
- [x] Verified red colors purged from the UI.

---

### Phase 19: Data Export Functions
**Status**: ✅ Complete
**Objective**: Implement secure CSV and PDF data export endpoints.
**Depends on**: Phase 18

**Tasks**:
- [x] CSV Export and Sanitization
- [x] PDF Export Function

**Verification**:
- [x] Confirmed `csvSafe` logic exists and neutralizes formulas.
- [x] Verified `export-csv.js` returns proper CSV headers.
- [x] Verified `export-pdf.js` returns base64 encoded PDF.

---

### Phase 20: Vitest Unit Testing
**Status**: ⬜ Not Started
**Objective**: Ensure comprehensive unit test coverage for all financial math and utilities.
**Depends on**: Phase 19

**Tasks**:
- [ ] TBD (run /plan 20 to create)

**Verification**:
- TBD

---

### Phase 21: Data Migration Script
**Status**: ⬜ Not Started
**Objective**: Safely migrate legacy SQLite data to the new Firestore structure.
**Depends on**: Phase 20

**Tasks**:
- [ ] TBD (run /plan 21 to create)

**Verification**:
- TBD

---

### Phase 22: Legal Pages & Footer
**Status**: ⬜ Not Started
**Objective**: Add required legal documentation and developer links.
**Depends on**: Phase 21

**Tasks**:
- [ ] TBD (run /plan 22 to create)

**Verification**:
- TBD

---

### Phase 23: SEO, Meta Tags & 404 Routing
**Status**: ⬜ Not Started
**Objective**: Finalize search engine optimization and routing fallbacks.
**Depends on**: Phase 22

**Tasks**:
- [ ] TBD (run /plan 23 to create)

**Verification**:
- TBD

---

### Phase 24: Git Security & Cleanup
**Status**: ⬜ Not Started
**Objective**: Clean the repository of legacy references and secure git commits.
**Depends on**: Phase 23

**Tasks**:
- [ ] TBD (run /plan 24 to create)

**Verification**:
- TBD
