# ROADMAP.md

> **Current Milestone**: v2.0 — Production Cleanup & Professional UX Optimization
> **Goal**: Transform ExpenseFlow from a cluttered, inconsistent MVP into a clean, professional, production-ready financial SaaS application. Audit → Remove → Simplify → Standardize → Repair → Verify.

## Must-Haves
- [ ] Complete architecture audit and product surface map
- [ ] Route map with all pages classified (existing / missing / broken / dead)
- [ ] Authentication lifecycle verified end-to-end (sign in → profile → home → group → logout → sign in again)
- [ ] Professional post-login ExpenseFlow Home with group selection, create, and join
- [ ] Clean global navigation (sidebar + mobile bottom nav) with consistent behavior
- [ ] Focused group Dashboard answering "How are we doing financially?"
- [ ] Clean Expenses page with compact list, clear expense form, and proper states
- [ ] Understandable Scenario Planner clearly separating real from hypothetical data
- [ ] Professional Fairness Report with clean print output
- [ ] Organized Settings with danger zone separation
- [ ] Standardized component library (Button, Card, Input, Modal, EmptyState, ErrorState, Skeleton)
- [ ] Consistent icon system using Lucide only — no emoji clutter
- [ ] Responsive design verified at 390px, 768px, 1280px, 1440px
- [ ] Accessibility fixes (keyboard nav, focus states, form labels, heading hierarchy, contrast)
- [ ] Dead code removal (unused components, debug scripts, test files in API, obsolete CSS)
- [ ] Playwright production QA against https://expenseflow.site
- [ ] All regressions fixed after cleanup
- [ ] Production build passes, unit tests pass, no unexpected console errors

## Phases

### Phase 1: Architecture & UI Audit
**Status**: ✅ Complete
**Objective**: Deep-inspect the running application and repository to understand every route, component, hook, API call, and UI primitive. Create a comprehensive PRODUCT_SURFACE_AUDIT.md documenting what exists, what's broken, what's duplicated, and what's dead. Trust actual code over documentation.

**Tasks**:
- [ ] Inspect all routes in App.jsx and map actual navigation flow
- [ ] Catalog every page component with purpose, size, and dependencies
- [ ] Catalog every shared component with usage count
- [ ] Catalog every hook with usage count
- [ ] Identify dead/debug files at project root (fix_*.mjs, test_*.mjs, qa-*.cjs, etc.)
- [ ] Identify dead test files in api/ (test1.js–test4.js)
- [ ] Audit CSS design tokens and utility classes for consistency
- [ ] Document all Firestore queries and their locations
- [ ] Check for console errors, broken imports, unused dependencies

**Verification**:
- [x] PRODUCT_SURFACE_AUDIT.md created with full inventory

---

### Phase 2: Route & User Flow Mapping
**Status**: ✅ Complete
**Objective**: Map every route to its purpose, classify pages (public / authenticated / group-scoped), and identify the complete user journey from visitor → sign in → profile → home → group → usage → logout → sign in again.

**Tasks**:
- [ ] Create route classification table (public, global auth, group-scoped)
- [ ] Map the primary user lifecycle flow
- [ ] Identify missing pages (e.g., dedicated sign-up, sign-in pages if needed)
- [ ] Identify unreachable or orphaned routes
- [ ] Identify broken navigation links between pages
- [ ] Document group context flow (how currentGroup gets set/cleared)
- [ ] Document auth state flow (Clerk → JWT bridge → Firebase → Firestore)

**Verification**:
- [x] Route map document created
- [x] Primary user lifecycle validated against actual code

---

### Phase 3: Authentication & Session Lifecycle
**Status**: ⬜ Not Started
**Objective**: Verify and fix the complete auth lifecycle: sign in, Google auth, session restoration, profile setup redirect, protected route guards, logout, and re-login. Ensure every auth state renders useful UI (loading, error, no-profile, authenticated).
**Depends on**: Phase 2

**Tasks**:
- [ ] Verify Clerk sign-in flow works end-to-end
- [ ] Verify Google OAuth redirect and SSO callback
- [ ] Verify JWT bridge (Clerk → Firebase custom token)
- [ ] Verify session restoration on page refresh at every protected route
- [ ] Verify profile setup redirect for new users without profiles
- [ ] Verify logout clears all state (Clerk, Firebase, localStorage)
- [ ] Verify re-login after logout works cleanly
- [ ] Fix any auth state that renders blank/null
- [ ] Ensure loading, error, and no-profile states show useful UI
- [ ] Verify guest auth (code + PIN) flow still works

**Verification**:
- [ ] All auth flows tested via Playwright MCP on production
- [ ] No blank screens during any auth transition

---

### Phase 4: Post-Login ExpenseFlow Home
**Status**: ⬜ Not Started
**Objective**: Refine GroupsHome.jsx to be a clean, professional authenticated home screen. Show greeting, existing groups, and get-started actions. Never show a blank dashboard, never auto-open an arbitrary group, never expose technical IDs prominently.
**Depends on**: Phase 3

**Tasks**:
- [ ] Verify greeting section shows correct time-of-day and user name
- [ ] Clean group cards to show: name (visual priority), member count, currency, "Open group"
- [ ] Remove or de-emphasize group codes from card display
- [ ] Remove decorative background blobs if they add visual noise without value
- [ ] Ensure zero-group state shows clear CTA (Create / Join)
- [ ] Ensure loading state shows skeleton UI
- [ ] Ensure error state shows retry option
- [ ] Verify Create Group button navigates to /setup
- [ ] Verify Join Group inline form works correctly

**Verification**:
- [ ] GroupsHome renders correctly with 0, 1, and 3+ groups
- [ ] No blank states in any scenario

---

### Phase 5: Global Navigation Cleanup
**Status**: ⬜ Not Started
**Objective**: Standardize the desktop sidebar and mobile bottom nav + header. Fix inconsistent nav labels, ensure group switching works, verify the FAB and mobile menu. Remove duplicate navigation paths.
**Depends on**: Phase 4

**Tasks**:
- [ ] Audit desktop sidebar nav items vs mobile bottom nav items for consistency
- [ ] Fix mobile bottom nav label "Groups" pointing to /settings (incorrect mapping)
- [ ] Ensure AccountMenu works consistently in both desktop sidebar and mobile header
- [ ] Verify group switcher dropdown works on desktop
- [ ] Verify "Global Home" link works from mobile menu
- [ ] Verify mobile FAB (Add Expense) appears on correct pages
- [ ] Clean up mobile hamburger menu items
- [ ] Ensure "No Group Selected" state redirects cleanly to /home

**Verification**:
- [ ] Navigation is consistent at 390px and 1280px
- [ ] Every nav item leads to the correct page

---

### Phase 6: Dashboard Cleanup
**Status**: ⬜ Not Started
**Objective**: Clean the group dashboard to answer "How are we doing financially?" with focused metrics: total spending, balances, fairness, settlements, then trends and breakdown. Remove duplicate cards, meaningless metrics, and decorative noise.
**Depends on**: Phase 5

**Tasks**:
- [ ] Audit all 467 lines of Dashboard.jsx for duplicate/unnecessary cards
- [ ] Prioritize: total spending → balances → fairness → settlement status
- [ ] Remove giant decorative numbers and repeated information
- [ ] Ensure charts provide useful information (remove charts that don't)
- [ ] Ensure all dashboard data loads with proper loading/empty/error states
- [ ] Verify formatINR/formatCurrency works correctly
- [ ] Verify settlement history component renders cleanly within dashboard
- [ ] Verify time filter functionality works

**Verification**:
- [ ] Dashboard renders correctly with real data
- [ ] Dashboard renders correctly with zero expenses
- [ ] No duplicate information visible

---

### Phase 7: Expenses Page Cleanup
**Status**: ⬜ Not Started
**Objective**: Clean the expense page to prioritize: balance → add expense → recent expenses → filters. Each expense shows description, amount, payer, category, date, and receipt indicator. Clean the expense form to use a simple sequential flow.
**Depends on**: Phase 6

**Tasks**:
- [ ] Audit ExpenseLogger.jsx (406 lines) for unnecessary complexity
- [ ] Ensure expense list is compact and scannable
- [ ] Ensure each expense clearly shows: description, amount, payer, category, date, receipt
- [ ] Audit ExpenseForm.jsx (317 lines) for UX issues
- [ ] Ensure form follows: Amount → Paid by → Category → Split → Date → Description → Receipt → Save
- [ ] Prevent duplicate submission
- [ ] Prevent invalid values
- [ ] Ensure clear error states for failed operations
- [ ] Verify receipt upload integration works (Cloudinary)

**Verification**:
- [ ] Expense creation works end-to-end
- [ ] Expense list renders correctly with 0 and 10+ expenses
- [ ] Form validation prevents invalid submissions

---

### Phase 8: Scenario Planner Cleanup
**Status**: ⬜ Not Started
**Objective**: Make the Scenario Planner feel like a focused simulation tool. Clearly distinguish real financial data from hypothetical scenario data.
**Depends on**: Phase 7

**Tasks**:
- [ ] Audit ScenarioPlanner.jsx (461 lines) for clarity
- [ ] Ensure clear visual separation between real data and hypothetical projections
- [ ] Simplify input flow: Scenario → Inputs → Run → Results
- [ ] Remove unnecessary decorative elements
- [ ] Ensure loading/empty/error states exist

**Verification**:
- [ ] Scenario creation and simulation works
- [ ] Real vs hypothetical data is visually distinct

---

### Phase 9: Fairness Report Cleanup
**Status**: ⬜ Not Started
**Objective**: Clean the report page to follow: Overview → Fairness → Members → Categories → Settlement → Export. Make print output professional. Remove decorative noise.
**Depends on**: Phase 8

**Tasks**:
- [ ] Audit FairnessReport.jsx (381 lines) for noise
- [ ] Ensure structured flow: overview → fairness → members → categories → settlement → export
- [ ] Verify PDF export works
- [ ] Verify print layout is professional
- [ ] Remove decorative gradients or animated elements
- [ ] Ensure all sections have loading/empty states

**Verification**:
- [ ] Report renders correctly with real data
- [ ] PDF export produces clean output
- [ ] Print view is professional

---

### Phase 10: Settings Cleanup
**Status**: ⬜ Not Started
**Objective**: Organize settings into clear sections: Group → Members → Categories → Access & Security → Preferences → Danger Zone. Keep destructive operations clearly separated.
**Depends on**: Phase 9

**Tasks**:
- [ ] Audit Settings.jsx (405 lines) for organization
- [ ] Group sections logically with clear headers
- [ ] Separate danger zone (delete group, leave group) with visual warning
- [ ] Verify member management works
- [ ] Verify category management works (AddCategoryModal.jsx)
- [ ] Verify group code/PIN display and sharing
- [ ] Ensure all settings mutations show loading/success/error feedback

**Verification**:
- [ ] Settings page is organized and readable
- [ ] Destructive actions require confirmation
- [ ] All settings operations work end-to-end

---

### Phase 11: Design System & Component Standardization
**Status**: ⬜ Not Started
**Objective**: Standardize the visual language across the app. Audit typography, spacing, radius, shadows, and colors. Replace emoji with Lucide icons. Standardize repeated components (Button, Card, Input, Modal, EmptyState, ErrorState, Skeleton).
**Depends on**: Phase 10

**Tasks**:
- [ ] Audit CSS design tokens in index.css for completeness
- [ ] Standardize typography hierarchy: page title, section title, body, label, helper, financial value
- [ ] Standardize spacing scale usage
- [ ] Standardize border-radius (consistent set)
- [ ] Audit shadows for subtlety
- [ ] Audit all pages for emoji usage — replace with Lucide icons
- [ ] Identify genuinely repeated component patterns and extract if not already done
- [ ] Verify btn-primary, btn-secondary, btn-ghost, card, card-hover, input-field classes are used consistently
- [ ] Remove any ad-hoc inline styles that should use design tokens

**Verification**:
- [ ] No emoji in professional UI context
- [ ] Consistent visual language across all pages
- [ ] All buttons, cards, and inputs use standardized classes

---

### Phase 12: Responsive Design & Accessibility
**Status**: ⬜ Not Started
**Objective**: Test and fix responsive layout at 390px, 768px, 1280px, and 1440px. Fix accessibility: keyboard navigation, focus states, form labels, heading hierarchy, contrast, touch targets.
**Depends on**: Phase 11

**Tasks**:
- [ ] Test every page at 390px — fix horizontal scrolling, clipped content, overflow
- [ ] Test every page at 768px — fix tablet layout issues
- [ ] Test every page at 1280px and 1440px — fix desktop layout issues
- [ ] Fix charts that overflow on mobile
- [ ] Fix modals that break on small screens
- [ ] Add missing form labels and aria attributes
- [ ] Verify heading hierarchy (single h1 per page, proper nesting)
- [ ] Verify focus states on all interactive elements
- [ ] Verify keyboard navigation through nav and forms
- [ ] Verify icon-only buttons have aria-labels
- [ ] Verify touch targets are at least 44x44px
- [ ] Check color contrast against WCAG AA

**Verification**:
- [ ] No horizontal scrolling at any breakpoint
- [ ] All forms are keyboard-navigable
- [ ] Touch targets meet minimum size

---

### Phase 13: Dead Code & Junk Removal
**Status**: ⬜ Not Started
**Objective**: Remove dead components, unused hooks, duplicate files, debug scripts, test stubs in api/, obsolete CSS, unnecessary dependencies. Verify usage before deleting.
**Depends on**: Phase 12

**Tasks**:
- [ ] Delete debug scripts from project root: fix_app.mjs, fix_applayout.mjs, fix_guards.mjs, test_blank.mjs, login.mjs, find_icons.cjs, qa-debug.cjs, qa-script.cjs, run_test.cjs, test_prod.cjs, qa-seed.js, seed_prod.js, test_custom_token.js, test_token.js
- [ ] Delete test stubs from api/: test1.js, test2.js, test3.js, test4.js
- [ ] Delete debug screenshots from root: after_login.png, blank_screen.png, test_error.png, test_modal.png
- [ ] Verify and remove unused npm dependencies
- [ ] Remove any unused imports across all source files
- [ ] Remove commented-out code blocks
- [ ] Remove unused CSS classes
- [ ] Clean up visual-audit/ directory if no longer needed

**Verification**:
- [ ] `npm run build` still succeeds after removals
- [ ] `npx vitest run` still passes
- [ ] No import errors

---

### Phase 14: Playwright Production QA
**Status**: ⬜ Not Started
**Objective**: Use Playwright MCP against https://expenseflow.site to test the complete user lifecycle as a real user. Capture screenshots at 390x844, 1280x720, and 1440x900.
**Depends on**: Phase 13

**Tasks**:
- [ ] Test: Landing → Sign in → ExpenseFlow Home
- [ ] Test: Home → Create group → Group Setup → Dashboard
- [ ] Test: Home → Open existing group → Dashboard
- [ ] Test: Home → Join group → Code → Dashboard
- [ ] Test: Dashboard → Expenses → Add expense
- [ ] Test: Dashboard → Scenarios → Report → Settings
- [ ] Test: Logout → Landing → Login again → Home
- [ ] Test: Refresh at every authenticated route
- [ ] Capture screenshots at 390x844 (mobile)
- [ ] Capture screenshots at 1280x720 (desktop)
- [ ] Capture screenshots at 1440x900 (wide desktop)
- [ ] Inspect console for errors at every page
- [ ] Inspect network for failed requests

**Verification**:
- [ ] All user flows complete without errors
- [ ] No unexpected console errors
- [ ] No failed network requests
- [ ] Screenshots captured and reviewed

---

### Phase 15: Regression Fixes
**Status**: ⬜ Not Started
**Objective**: Fix any bugs or regressions found during Playwright QA in Phase 14. Do not suppress errors — fix root causes.
**Depends on**: Phase 14

**Tasks**:
- [ ] Fix any console errors found during QA
- [ ] Fix any broken navigation discovered
- [ ] Fix any layout issues at tested breakpoints
- [ ] Fix any failed network requests
- [ ] Fix any auth flow issues
- [ ] Re-run Playwright tests to verify fixes

**Verification**:
- [ ] All previously failing tests now pass
- [ ] No new regressions introduced

---

### Phase 16: Final Build, Tests & Deployment Verification
**Status**: ⬜ Not Started
**Objective**: Final verification: production build passes, unit tests pass, no console errors, no unresolved network failures. Create PRODUCTION_CLEANUP_REPORT.md documenting everything that was done.
**Depends on**: Phase 15

**Tasks**:
- [ ] Run `npx vitest run` — all tests pass
- [ ] Run `npx vite build` — production build succeeds
- [ ] Run final Playwright sweep on production
- [ ] Verify bundle size hasn't regressed significantly
- [ ] Create PRODUCTION_CLEANUP_REPORT.md with:
  - Current state (what was wrong)
  - Cleanup (what was removed)
  - UX (what was improved)
  - Authentication (what was fixed)
  - Post-login Home (how group selection works)
  - Core pages (Dashboard, Expenses, Scenarios, Report, Settings)
  - Responsive (mobile and desktop fixes)
  - Accessibility (changes made)
  - Bugs (found and fixed)
  - Verification (build, tests, Playwright, production QA)
  - Remaining issues (only real unresolved issues)

**Verification**:
- [ ] Production build passes
- [ ] All unit tests pass
- [ ] Playwright QA passes
- [ ] PRODUCTION_CLEANUP_REPORT.md created
- [ ] Git tagged as v2.0
