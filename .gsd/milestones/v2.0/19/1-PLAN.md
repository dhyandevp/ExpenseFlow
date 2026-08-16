---
phase: 19
plan: 1
wave: 1
---

# Plan 19.1: CSV Export and Sanitization

## Objective
Implement a secure CSV export endpoint for group expenses and a `csvSafe` utility to prevent CSV injection attacks.

## Context
- .gsd/SPEC.md
- netlify/functions/

## Tasks

<task type="auto">
  <name>CSV Sanitization Utility</name>
  <files>
    shared/csv.js
  </files>
  <action>
    - Create `shared/csv.js`.
    - Implement and export `csvSafe(value)`. 
    - The function should check if the value is a string and starts with `=`, `+`, `-`, or `@`. If it does, prefix it with a single quote `'` to prevent CSV injection (e.g. `+100` becomes `'+100`).
  </action>
  <verify>grep "csvSafe" shared/csv.js</verify>
  <done>csvSafe utility is created.</done>
</task>

<task type="auto">
  <name>CSV Export Function</name>
  <files>
    netlify/functions/export-csv.js
  </files>
  <action>
    - Create `netlify/functions/export-csv.js`.
    - Accept `groupId` from query parameters (`event.queryStringParameters`).
    - Use `firebase-admin` to fetch all expenses for the given `groupId`.
    - Format expenses as CSV. For each row, use `csvSafe` on text fields like `description`.
    - Ensure CSV has a header row: `Date,Description,Amount,Paid By,Category`.
    - Return a response with `statusCode: 200`, `Content-Type: text/csv`, and a `Content-Disposition` header to trigger download as `expenses-{groupId}.csv`.
  </action>
  <verify>grep "export-csv" netlify/functions/export-csv.js || grep "csvSafe" netlify/functions/export-csv.js</verify>
  <done>export-csv endpoint is implemented.</done>
</task>

## Success Criteria
- [ ] `csvSafe` function exists in `shared/csv.js`.
- [ ] `export-csv.js` endpoint correctly queries Firestore and returns CSV.
