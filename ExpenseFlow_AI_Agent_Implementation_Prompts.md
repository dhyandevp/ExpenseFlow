# ExpenseFlow --- AI Agent Implementation Roadmap

This document contains the complete, atomic implementation roadmap for the ExpenseFlow project. Execute the phases strictly in order, preserving existing functionality unless a task explicitly requires changing it. Verify each phase using the provided `<verify>` block before moving to the next.

------------------------------------------------------------------------

## Phase 11: Database Schema & Shared Architecture

**Objective:** Correct the Firestore database schema structure and extract financial math logic into a shared directory for reuse between client and serverless functions.

**Tasks:**
1. **Shared Architecture:** Create a `shared/` directory at the project root. Move the financial math and fairness logic (`balanceMath.js`, `fairness.js`, etc.) from `client/src/utils/` to `shared/`. Update all client imports to reference this new location.
2. **Schema Refactoring (`client.js` / `firebase.js`):** Refactor Firestore calls so that `expenses`, `members`, `categories`, `settlements`, and `fairnessSnapshots` are created as **subcollections** under `groups/{groupId}`, and NOT at the root level.
3. **Group Schema Updates:** Update the group creation schema to strictly include: `name`, `code`, `pinHash`, `currency`, `settlementThreshold`, `currentBalances` (as a map), and `createdAt` (replace `created_at`).
4. **Expense Schema Updates:** Update the expense creation schema to include: `paidBy`, `amount`, `category`, `description`, `receiptUrl` (replace all instances of `receiptPath`), `splits`, and `createdAt` (replace `expense_date`).

**<verify>**
- Confirm `shared/` directory exists and client builds without import errors.
- Confirm Firestore queries in `client.js` use the `collection(db, "groups", groupId, "expenses")` pattern.
- Confirm new groups contain the `currentBalances` map and `createdAt` timestamp.
**</verify>**

------------------------------------------------------------------------

## Phase 12: Firestore Security Rules

**Objective:** Implement strict deny-all default security rules with appropriate role-based access control.

**Tasks:**
1. **Default & Helpers:** Rewrite `firestore.rules` to default to deny all. Add helper functions `isGroupMember`, `isClerkMember`, and `isGuestMember`.
2. **Read Access:** Fix rules so unauthenticated users CANNOT read/list groups. Ensure authenticated Clerk users and guests (using `request.auth.token.guestGroupId`) can *only* read their specific group.
3. **Write Access:** Block guests from creating groups. Lock down `settlements` so they cannot be edited or deleted by anyone.
4. **Service Account Restrictions:** Restrict `currentBalances`, `settlementSuggestions`, and `fairnessScores` on the group document so they can only be written by the Admin SDK (service account), preventing client-side manipulation.
5. **Testing:** Write emulator test cases in `tests/firestore.rules.test.js` covering both allowed and denied scenarios.

**<verify>**
- Run `npm run test:rules` (ensure firebase emulator is running) and confirm all tests pass.
- Verify rules block unauthenticated reads on the `groups` collection.
**</verify>**

------------------------------------------------------------------------

## Phase 13: Netlify Functions Infrastructure & Auth Bridge

**Objective:** Scaffold the Netlify functions directory and implement the JWT token exchange for hybrid authentication.

**Tasks:**
1. **Infrastructure:** Create the `netlify/functions` directory. Update `netlify.toml` to include `[functions]` pointing to `netlify/functions`.
2. **JWT Bridge (`jwt-bridge.js`):** Create this function to exchange a Clerk session token for a scoped Firebase custom token containing the user's `guestGroupId` (if applicable) and standard claims.
3. **Rate Limiting:** Implement IP-based rate limiting in `jwt-bridge.js` (10 attempts per 15 minutes). Block IPs for 1 hour after 3 failed PIN attempts.
4. **Admin SDK Initialization:** Initialize the Firebase Admin SDK inside Netlify functions by decoding a base64 environment variable (`FIREBASE_SERVICE_ACCOUNT_BASE64`), NOT by reading a JSON file.

**<verify>**
- Confirm `netlify/functions/jwt-bridge.js` exists.
- Confirm `netlify.toml` explicitly sets the functions directory.
- Confirm Admin SDK uses the base64 env var approach.
**</verify>**

------------------------------------------------------------------------

## Phase 14: Netlify Functions Webhooks & Triggers

**Objective:** Implement server-side logic for balancing expenses and syncing Clerk users.

**Tasks:**
1. **Balance Trigger (`balance-trigger.js`):** Create a function that listens to expense writes (creates, updates, deletes) in Firestore. It must recalculate `currentBalances`, `settlementSuggestions`, and `fairnessScores` for the group by importing the shared logic from `../../shared/balanceMath.js`.
2. **Clerk Webhook (`clerk-webhook.js`):** Create a function that handles the `user.created` event from Clerk to seed a Firestore user document.

**<verify>**
- Confirm `balance-trigger.js` correctly imports and uses the shared math utilities.
- Confirm `clerk-webhook.js` verifies Svix webhook signatures.
**</verify>**

------------------------------------------------------------------------

## Phase 15: Authentication State & Landing Routing

**Objective:** Implement the hybrid authentication hooks and dual call-to-action landing page.

**Tasks:**
1. **Auth Hook (`useAuth.js`):** Create a custom hook returning `user`, `authMode` (strictly exactly `'clerk'` or `'guest'`), `groupAccess`, `signOut`, and `isLoaded`.
2. **Landing Page:** Update `Landing.jsx` with dual CTAs: one for Clerk sign-in, one for Guest Code + PIN access.
3. **Join Flow:** Update the Join Group flow to require both the 6-character code and a mandatory PIN (do not accept code alone).
4. **Permissions:** Add logic to block group creation for guest users and users without verified Clerk emails.
5. **Auth Badge:** Add an auth mode badge ("Signed in" or "Guest") to the Settings page.

**<verify>**
- Confirm `authMode` logic enforces strictly `'clerk'` or `'guest'`.
- Confirm the UI blocks group creation when signed in as a guest.
- Confirm Join flow requests both Code and PIN.
**</verify>**

------------------------------------------------------------------------

## Phase 16: PIN Verification Component

**Objective:** Build a secure, accessible, and robust PIN entry component.

**Tasks:**
1. **UI & State (`PINVerification.jsx`):** Ensure the component uses individual inputs per digit, auto-advances focus, and handles backspace. Disable the submit button until all 6 digits are entered.
2. **Lockout Logic:** Add state to track attempts and clear inputs automatically after 3 failed attempts.
3. **Animations:** Remove ALL raw CSS keyframes and implement the error shake animation using `framer-motion`.
4. **Color Constraints:** Remove all unauthorized red colors (`text-red-500`, `border-red-500`) and replace them with `--accent` or `--text-muted` to adhere to the Aurora Forest palette.
5. **Accessibility:** Add `aria-labels` to all inputs and an `aria-live` region for screen-reader error announcements.

**<verify>**
- Confirm no `text-red-500` or raw `@keyframes` exist in `PINVerification.jsx`.
- Confirm component clears state after 3 failed attempts.
- Confirm `aria-live` is implemented.
**</verify>**

------------------------------------------------------------------------

## Phase 17: Cloudinary Receipt Uploads

**Objective:** Implement direct-to-Cloudinary receipt uploads and remove Firebase Storage.

**Tasks:**
1. **Cleanup:** Ensure `browser-image-compression` is uninstalled. Delete `storage.rules` and remove all `firebase/storage` imports.
2. **Upload Hook (`useReceiptUpload.js`):** Implement the hook using `XMLHttpRequest` for precise upload progress tracking (do not use `fetch`).
3. **Validation:** Validate file type (reject SVG/HTML, allow only JPG/PNG/WEBP) and file size (under 5MB) *before* any network call is made.
4. **Cloudinary API:** Ensure the upload uses the unsigned preset `expenseflow_receipts` via the environment variables `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`.
5. **Return Data:** The hook must return `secure_url`. Ensure the frontend displays receipts directly using this stored URL.

**<verify>**
- Confirm `storage.rules` is deleted and `firebase/storage` is not in package.json.
- Confirm `XMLHttpRequest` is used in `useReceiptUpload.js`.
- Confirm 5MB size and type validation logic exists.
**</verify>**

------------------------------------------------------------------------

## Phase 18: Mobile-First UI & Styling Enforcement

**Objective:** Enforce strict mobile layouts, glassmorphism constraints, and palette adherence.

**Tasks:**
1. **Layout & Scrolling:** Fix all charts, tables, and grids to ensure they render correctly at a 390px viewport width without horizontal scrolling.
2. **Navigation:** Create a sticky top header (Wordmark left, Auth badge right) and a bottom navigation bar with exactly four tabs (Home, Add, Groups, Reports).
3. **Glass Effect:** Apply `backdrop-filter: blur` to the bottom nav, header, and modals. Ensure a `prefers-reduced-transparency` media query fallback provides a solid background color. Do not apply blur to full-page backgrounds.
4. **FAB:** Add a floating action button (FAB) at the bottom right to trigger the add expense flow.
5. **Transitions & Colors:** Implement slide-up enter and fade-out exit page transitions. Scan the entire UI and delete any reference to red colors, ensuring all negative balance indicators use Timeless Grey (`--text-muted`).

**<verify>**
- Confirm bottom nav and FAB exist on mobile layouts.
- Confirm `prefers-reduced-transparency` is used in CSS/Tailwind.
- Confirm no red colors exist anywhere in the codebase.
**</verify>**

------------------------------------------------------------------------

## Phase 19: Data Export Functions

**Objective:** Implement secure CSV and PDF data export endpoints.

**Tasks:**
1. **Sanitization (`csvSafe`):** Create a `csvSafe` utility in `shared/` to prefix `=`, `+`, `-`, `@` characters with a single quote to prevent CSV injection.
2. **CSV Export (`export-csv.js`):** Create a Netlify function that accepts `groupId` and date ranges, queries Firestore, and returns sanitized CSV data.
3. **PDF Export (`export-pdf.js`):** Create a Netlify function to generate and return a fairness report PDF for a given group.

**<verify>**
- Confirm `csvSafe` correctly sanitizes formula strings.
- Confirm `export-csv.js` and `export-pdf.js` exist in `netlify/functions/`.
**</verify>**

------------------------------------------------------------------------

## Phase 20: Vitest Unit Testing

**Objective:** Ensure comprehensive unit test coverage for all financial math and utilities.

**Tasks:**
1. **Setup:** Ensure `vitest` is installed and the `test` script exists in `client/package.json`.
2. **Test Suites:** Create Vitest suites in `tests/` covering `greedySettle`, `fairnessScore`, `applyRecurring`, `csvSafe`, and `calculateSplits`.
3. **Split Integrity Test:** Ensure the `calculateSplits` test suite includes a specific test confirming that the sum of all calculated splits exactly equals the total expense amount with no floating point remainder or missing pennies.

**<verify>**
- Run `npm run test` in the project and confirm all tests pass.
- Confirm the specific split sum test exists and passes.
**</verify>**

------------------------------------------------------------------------

## Phase 11: Data Migration Script

**Objective:** Safely migrate legacy SQLite data to the new Firestore structure.

**Tasks:**
1. **Migration Script (`scripts/migrate.js`):** Create a script at the project root to read the legacy `expenseflow.db` SQLite file and push data to Firestore.
2. **Batched Writes & Order:** Use Firestore batched writes (max 500 documents per batch). Process collections in this exact order: groups, members, categories, expenses, settlements, fairnessSnapshots, recurring templates.
3. **Verification Logging:** Implement a verification pass at the end of the script that counts documents in SQLite vs Firestore and logs any discrepancies.
4. **Deployment Exclusions:** Add the `scripts/` directory to `.netlifyignore` to ensure it is never deployed to production.

**<verify>**
- Confirm `scripts/migrate.js` implements 500-doc batching.
- Confirm `.netlifyignore` contains `scripts/`.
**</verify>**

------------------------------------------------------------------------

## Phase 12: Legal Pages & Footer

**Objective:** Add required legal documentation and developer links.

**Tasks:**
1. **Legal Components:** Create `Terms.jsx`, `Privacy.jsx`, and `Contact.jsx` in `client/src/pages/`.
2. **Contact Details:** The Contact page must explicitly list the email `dhyandevp@proton.me`, the developer link `https://linktr.ee/DhyandevRTX`, and identify the creator as a Development Specialist.
3. **Footer Linking:** Link all three pages from the footer of the Landing page.

**<verify>**
- Confirm the 3 pages exist and routes are accessible.
- Confirm the contact email and linktr.ee URL are exactly as specified.
**</verify>**

------------------------------------------------------------------------

## Phase 13: SEO, Meta Tags & 404 Routing

**Objective:** Finalize search engine optimization and routing fallbacks.

**Tasks:**
1. **SEO Hook (`useSEO.js`):** Create this hook and implement it across all page components to dynamically set document title and meta tags using `react-helmet-async`.
2. **404 Page (`404.jsx`):** Create a 404 page containing a `<meta name="robots" content="noindex" />` tag. Register it as a catch-all route (`*`) in React Router.
3. **Server-side 404:** Update `netlify.toml` `[[redirects]]` to ensure unmatched routes return an actual 404 HTTP status code alongside the `index.html` fallback.
4. **Sitemap:** Ensure all legal pages and valid routes are included in `public/sitemap.xml`.

**<verify>**
- Confirm `useSEO` is called in page components.
- Confirm `404.jsx` contains the `noindex` tag.
- Confirm `netlify.toml` returns status `404` for the catch-all redirect (if applicable for SPAs).
**</verify>**

------------------------------------------------------------------------

## Phase 14: Git Security & Cleanup

**Objective:** Clean the repository of legacy references and secure git commits.

**Tasks:**
1. **Git Hook:** Create a `.git/hooks/pre-commit` bash script that checks staged files and blocks the commit if any `.env` file is included. Ensure it is executable.
2. **Lockfile Scrub:** Delete `bun.lock` (or `package-lock.json`) and regenerate it to flush out old `balanceboard-client` package name references.
3. **Sitemap Scrub:** Remove any "balance-board" strings from `client/public/sitemap.xml` and `client/public/robots.txt`.

**<verify>**
- Confirm `.git/hooks/pre-commit` exists and blocks `.env` files.
- Run `grep -ri "balanceboard" .` and confirm 0 results (excluding `.gsd` docs).
**</verify>**

------------------------------------------------------------------------

# Final Review Execution

After completing Phase 14, the AI agent must output a concise report containing:
- **Completed:** Count of phases successfully implemented.
- **Tests:** Final Vitest execution result.
- **Build:** Final production build result.
- **Security:** Confirmation of Git protection and Firestore deny-all status.
