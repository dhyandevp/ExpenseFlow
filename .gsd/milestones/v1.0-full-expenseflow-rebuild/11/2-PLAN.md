---
phase: 11
plan: 2
wave: 2
---

# Plan 11.2: Expense Schema Field Standardization (API & Math)

## Objective
Standardize the expense schema fields across the client API and shared math logic. We will strictly use `paidBy`, `createdAt`, and `receiptUrl`.

## Context
- .gsd/SPEC.md
- client/src/api/client.js
- shared/balanceMath.js

## Tasks

<task type="auto">
  <name>Update Client API Expense Schema</name>
  <files>
    client/src/api/client.js
  </files>
  <action>
    - In `createExpense`, remove the mapping of `paid_by` and `expense_date`. Accept only standard fields and use `data.paidBy`, `data.createdAt`, `data.receiptUrl`.
    - Also explicitly add `splits: data.splits || null` to the `expenseData` payload.
    - In `getExpenses`, remove the `let expenses = snap.docs.map(...)` transformation that adds `paid_by`, `expense_date`, `receiptPath`. Just return the native documents `id: d.id, ...d.data()`.
  </action>
  <verify>grep -c "expense_date: data.createdAt" client/src/api/client.js | grep "0"</verify>
  <done>Client API uses and returns standardized fields only.</done>
</task>

<task type="auto">
  <name>Update Shared Math Logic</name>
  <files>
    shared/balanceMath.js
  </files>
  <action>
    - In `calculateBalances`, change `e.paidBy || e.paid_by` to strictly `e.paidBy`.
    - In `calculateCategoryBreakdown`, change `e.paidBy || e.paid_by` to strictly `e.paidBy`.
    - In `calculateFairnessScore`, change `e.paidBy || e.paid_by` to strictly `e.paidBy`.
  </action>
  <verify>grep -c "e.paid_by" shared/balanceMath.js | grep "0"</verify>
  <done>Shared math functions strictly expect `paidBy`.</done>
</task>

## Success Criteria
- [ ] `createExpense` sets `paidBy`, `createdAt`, `receiptUrl`, and `splits`.
- [ ] `getExpenses` returns unmutated document data.
- [ ] `balanceMath.js` relies exclusively on `paidBy`.
