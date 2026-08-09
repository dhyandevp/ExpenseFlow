---
phase: 11
plan: 3
wave: 3
---

# Plan 11.3: Expense Schema Frontend Standardization

## Objective
Update all frontend components and pages to consume and submit the standardized schema fields (`paidBy`, `createdAt`, `receiptUrl`).

## Context
- .gsd/SPEC.md
- client/src/components/ExpenseForm.jsx
- client/src/pages/ExpenseLogger.jsx
- client/src/pages/FairnessReport.jsx
- client/src/pages/ScenarioPlanner.jsx
- tests/unit.test.js

## Tasks

<task type="auto">
  <name>Update ExpenseForm</name>
  <files>
    client/src/components/ExpenseForm.jsx
  </files>
  <action>
    - Replace `paid_by` state field with `paidBy`.
    - Replace `expense_date` state field with `createdAt`.
    - Replace `receipt_url` state field with `receiptUrl`.
    - Update all `<select>`, `<input type="date">`, and event handlers to use the new names.
    - Ensure `onSubmit` passes these fields correctly.
  </action>
  <verify>grep -c "paid_by" client/src/components/ExpenseForm.jsx | grep "0"</verify>
  <done>ExpenseForm uses `paidBy`, `createdAt`, `receiptUrl`.</done>
</task>

<task type="auto">
  <name>Update Frontend Consumers</name>
  <files>
    client/src/pages/ExpenseLogger.jsx
    client/src/pages/FairnessReport.jsx
    client/src/pages/ScenarioPlanner.jsx
    tests/unit.test.js
  </files>
  <action>
    - In `ExpenseLogger.jsx`, replace any instances of `expense.paid_by` or `expense.expense_date` with `expense.paidBy` and `expense.createdAt`.
    - In `FairnessReport.jsx` and `ScenarioPlanner.jsx`, ensure they use `createdAt` when formatting dates and `paidBy` when displaying who paid.
    - In `tests/unit.test.js`, replace `paid_by` with `paidBy` inside the mock expenses used in `calculateFairnessScore` tests.
  </action>
  <verify>grep -r "paid_by" client/src/pages/ | grep -v "node_modules" | wc -l | grep "0"</verify>
  <done>No components or pages use `paid_by` or `expense_date`.</done>
</task>

## Success Criteria
- [ ] `ExpenseForm` submits correctly using new fields.
- [ ] List views render correctly using `createdAt`.
- [ ] Unit tests pass with updated field names.
