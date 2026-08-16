# Phase 2 Research: Firestore Migration & Ponytail Ultra Simplifications

## Discovery Level 2

### Analysis of Server-Side Logic
The current Express server provides several routes, notably:
- `balances.js` (computes net balances and greedy settlement)
- `reports.js` (computes fairness scores and generates CSVs)
- `expenses.js`, `groups.js`, etc. (basic CRUD)

All the math in `balances.js` and `reports.js` is synchronous JavaScript that iterates over arrays of objects (expenses, members) to compute sums and distributions. 

### Ponytail Ultra Simplifications (YAGNI / Minimum Viable)

The roadmap originally called for setting up **Netlify Functions** with `firebase-admin` for three things:
1. `balance-trigger.js`: A background function to recalculate and denormalize balances on every expense write.
2. `export-csv.js`: A function to generate CSV reports.
3. `export-pdf.js`: A function to generate PDF reports.

**Ceiling / Simplification 1: Dynamic Client-Side Calculation vs. Triggers**
- *Why:* Denormalizing balances using a trigger is a premature optimization. A typical expense sharing group has <1,000 expenses. Fetching these and running the `balances.js` reduction logic on the client takes milliseconds.
- *Action:* Skip `balance-trigger.js` and Netlify Functions entirely. The client will calculate balances dynamically based on real-time Firestore listeners. 
- *Upgrade Path:* If a group exceeds 10,000 expenses and client-side reduction becomes slow, we can introduce Cloud Functions or Netlify Functions to denormalize balances.

**Ceiling / Simplification 2: Client-Side Exports**
- *Why:* Generating a CSV or PDF from data the client already has via Firestore does not require a server. The browser can easily construct a CSV string and trigger a download via a Blob URL. (The client already imports `jspdf` per Phase 8 planning, so PDFs are also client-side).
- *Action:* Skip `export-csv.js` and `export-pdf.js`. Implement exports purely in the frontend.

**Ceiling / Simplification 3: Zero Serverless Backend for Phase 2**
- *Why:* By moving all math and exports to the client, we completely eliminate the need for `firebase-admin`, service accounts, and Netlify Functions for Phase 2. The client uses the standard Firebase Client SDK directly. (Authentication functions in Phase 4 might still need a bridge, but for Phase 2 data migration, we need zero backend).
- *Action:* Omit tasks 6, 7, 8, 9, 10 from the original Phase 2 roadmap.

### Plan Structure
- **Plan 2.1:** Setup Firebase Client SDK & port the math utils to the frontend.
- **Plan 2.2:** Rewrite `client/src/api/client.js` to use Firestore directly and implement client-side exports.
- **Plan 2.3:** Write and execute the SQLite-to-Firestore migration script locally.
