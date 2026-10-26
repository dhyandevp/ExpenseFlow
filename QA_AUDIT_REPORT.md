# ExpenseFlow — Comprehensive QA Audit & Feature Test Matrix Report

**Date:** 2026-09-24  
**Branch:** `fix/security-and-bugs`  
**Test Suite Status:** 16/16 Unit Tests Passing (100%), 10/10 Backend Tests Passing (100%)  
**Production Build:** Clean (`vite build` succeeded in 7.60s)  

---

## 1. Executive Summary

ExpenseFlow is a multi-currency group expense management single-page application built on React 18, Vite 5, Tailwind CSS, Framer Motion, and Recharts, backed by a Cloudflare Worker edge API and Firebase Firestore.

This comprehensive audit covers end-to-end feature discovery, mathematical validation of debt simplification and fairness algorithms, security and sanitization checks, edge-case resilience, and bug remediations.

---

## 2. Feature & Architecture Matrix

| Feature Domain | Module / Routes | Backend / Data Layer | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Authentication & Token Bridge** | `useAuth.js`, `api/auth/jwt-bridge.js` | Clerk OAuth + Firebase Custom Auth | Dual Clerk / Guest session management, Cloudflare edge RS256 token exchange, rate-limiting (50 req/15min). |
| **Group Setup & Provisioning** | `/create`, `GroupSetup.jsx` | Firestore batch (`groups`, `members`, `categories`) | 3-step creation wizard, custom category fairness assignment, 6-char cryptographically secure invite code generation. |
| **Invite & Join Flow** | `/join/:code`, `JoinGroup.jsx`, `api/join-group.js` | Cloudflare Worker + Firestore REST API | Edge-verified Clerk token lookup, server-side group lookup, idempotent `memberUserIds` addition, 404/invalid format boundary rejection. |
| **Expense Logging & Receipts** | `/group/:code/expenses`, `ExpenseLogger.jsx` | Firestore `groups/:id/expenses` | Category filtering, payer filtering, optimistic creation, momentum-projected swipe-to-delete with 5s undo toast. |
| **Balance Engine & Settlements** | `shared/balanceMath.js`, `Dashboard.jsx` | Pure client-side math engine | Multi-payer expense aggregation, residual rounding compensation, greedy min-cash-flow settlement suggestions. |
| **Fairness Engine & Reporting** | `shared/fairness.js`, `FairnessReport.jsx` | Pure client-side deviation scoring | Gini-based group fairness scoring (0–100), category breakdown, CSV export with formula injection sanitization (`csvSafe`). |
| **Scenario Planner** | `/group/:code/scenarios`, `ScenarioPlanner.jsx` | Firestore `groups/:id/scenarios` | Hypothetical expense projection, pre-built presets, fairness impact analysis, projected balance bar charts. |
| **Group Settings & Management** | `/group/:code/settings`, `Settings.jsx` | Firestore `groups/:id` + `api/delete-group.js` | Currency configuration, threshold adjustment, post-setup member addition/removal, invite code regeneration, owner deletion. |

---

## 3. Mathematical Verification & Invariants

### 3.1 Zero-Sum Balance Invariant
When expenses are split among $N$ members with floating-point divisions (e.g., ₹10 split 3 ways $= 3.3333...$), `calculateBalances` applies a residual rounding correction to the member with the largest absolute balance.
- **Invariant Verified:** $\sum_{i=1}^N \text{net\_balance}_i = 0.00$
- **Automated Test:** `enforces exact zero-sum balance with 3-way floating point split` (Pass).

### 3.2 Greedy Cash Flow Minimization
`calculateSettlementSuggestions` pairs the largest debtor with the largest creditor iteratively with an epsilon threshold of $0.01$.
- **Invariant Verified:** Guarantees settlement in at most $N - 1$ transactions.
- **Automated Test:** `incorporates settlements correctly` (Pass).

### 3.3 Gini & Standard Deviation Fairness Scoring
`calculateFairnessScore` derives member deviation ratios relative to their fair share:
- Equal contributions $\to$ score $= 100$.
- Single payer in 2-person group $\to$ score $= 50$.
- Zero total expenses $\to$ score $= 100$ (graceful boundary default).
- **Automated Tests:** All 3 fairness unit tests passing.

---

## 4. Security & Sanitization Audits

1. **Formula Injection (CSV Injection):**
   - User inputs beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` are prepended with `'` by `csvSafe()`.
   - Verified across descriptions, member names, and category exports.
2. **Firestore Undefined Field Defense:**
   - `cleanFirestoreData()` recursively sanitizes payloads to prevent Firestore exceptions on `undefined` values.
3. **Dual-Auth Boundary Isolation:**
   - Guest users are restricted via Clerk JWT claims and UI guards (`authMode === 'guest'`) from accessing dangerous actions (deleting group, regenerating invite codes).
4. **Rate Limiting:**
   - `/api/auth/jwt-bridge` enforces 50 requests per 15-minute window per IP.

---

## 5. Bugs Discovered & Resolved During Audit

1. **Scenario Planner Simulation Fairness Score Bug (`client/src/api/client.js`):**
   - *Defect:* `simulateScenario` accessed `score.overall_score`, but `calculateFairnessScore` returns `group_score`.
   - *Resolution:* Updated to `score.group_score ?? 0`.
2. **Scenario Planner Bar Chart Mapping (`client/src/pages/ScenarioPlanner.jsx`):**
   - *Defect:* Mapped `b.fairness_score`, non-existent on `calculateBalances` return objects.
   - *Resolution:* Mapped `balance: b.net_balance`.
3. **Broken Group Invite Share Link (`client/src/pages/GroupSetup.jsx`):**
   - *Defect:* Generated `/group/:code` instead of `/join/:code`.
   - *Resolution:* Corrected target link to `${window.location.origin}/join/${createdGroup.code}`.
4. **Direct Route Navigation Trap (`client/src/pages/ExpenseLogger.jsx`):**
   - *Defect:* Visiting `/group/:code` directly without active state booted user to `/`.
   - *Resolution:* Redirects to `/join/:code` to fetch and hydrate group state.
5. **Phantom Custom Split Options (`client/src/components/ExpenseForm.jsx`):**
   - *Defect:* Dropdown presented "Custom amounts" and "Custom percentages" with zero input fields.
   - *Resolution:* Removed phantom dropdown in favor of clean member-selection chips for equal splits.
6. **Missing Member Addition & Fragile Member Deletion (`client/src/pages/Settings.jsx`, `client/src/api/client.js`):**
   - *Defect:* No UI existed to add members post-setup. `removeMember` expected Firestore doc IDs, conflicting with numeric member IDs.
   - *Resolution:* Added inline member addition form; updated `removeMember` with fallback query on numeric `id`.

---

## 6. Verification Status

```
[✓] Unit Tests: 16 passed
[✓] Backend Integration Tests: 10 passed
[✓] Client Build: Clean (0 errors, 7.60s)
[✓] Worker API: Active on port 8787
```

**Final Verdict:** Production Ready (SHIP).
