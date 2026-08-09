---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Rewrite API Client & Data Access

## Objective
Refactor the React application to use the Firestore SDK directly instead of fetching from the old Express REST API. Implement CSV exports purely on the frontend.

## Context
- .gsd/SPEC.md
- .gsd/phases/2/RESEARCH.md
- client/src/api/client.js
- client/src/pages/FairnessReport.jsx

## Tasks

<task type="auto">
  <name>Rewrite API Client to Firestore</name>
  <files>
    client/src/api/client.js
  </files>
  <action>
    - Rewrite `client/src/api/client.js` entirely. Remove all `fetch()` calls to the Express API.
    - Import `db` from `../firebase.js`.
    - Implement the identical exported function signatures (`getGroup`, `createGroup`, `addExpense`, `getMembers`, `getExpenses`, `getBalances`, `getFairnessScore`, `getCategoryBreakdown`, etc.).
    - For `getBalances`, `getFairnessScore`, and `getCategoryBreakdown`, use the functions from `utils/balanceMath.js` locally by first fetching the required expenses and members from Firestore.
    - Delete `server/routes/balances.js` and `server/routes/reports.js` to prevent accidental usage.
  </action>
  <verify>grep "getDocs" client/src/api/client.js || grep "getDoc" client/src/api/client.js</verify>
  <done>API client is fully powered by Firestore queries.</done>
</task>

<task type="auto">
  <name>Client-Side Exports (CSV)</name>
  <files>
    client/src/pages/FairnessReport.jsx
  </files>
  <action>
    - Currently CSV is downloaded via an API endpoint.
    - Update `FairnessReport.jsx` to generate the CSV locally using the already fetched expense data.
    - Use `csvSafe` logic (prevent formula injection) directly in the frontend.
    - Create a Blob and trigger a download via `URL.createObjectURL(blob)`.
    - Apply Ponytail: Add a comment documenting that client-side export avoids a Netlify function.
  </action>
  <verify>grep "createObjectURL" client/src/pages/FairnessReport.jsx || grep "Blob" client/src/pages/FairnessReport.jsx</verify>
  <done>CSV is generated and downloaded securely on the client side.</done>
</task>

## Success Criteria
- [ ] The React app fetches data directly from Firestore.
- [ ] Balance and report metrics are calculated locally.
- [ ] CSV reports are generated and downloaded on the client side.
