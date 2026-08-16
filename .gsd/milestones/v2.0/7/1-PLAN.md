---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: Expense Form UX Cleanup

## Objective
Clean the expense form (`ExpenseForm.jsx`) to follow a logical sequential flow (Amount → Paid by → Category → Split → Date → Description → Receipt → Save). Improve error states and prevent duplicate submissions.

## Context
- `client/src/components/ExpenseForm.jsx`
- `.gsd/ROADMAP.md`

## Tasks

<task type="auto">
  <name>Sequential Flow & Duplicate Prevention</name>
  <files>
    - client/src/components/ExpenseForm.jsx
  </files>
  <action>
    - Ensure the input fields follow the logical order: Amount, Paid By, Category, Split, Date, Description, Receipt, Save.
    - Implement a loading state on the submit button (`disabled={loading}`) to prevent duplicate submissions.
    - Add clear error messaging (`setError`) if validation fails or API calls fail.
    - Validate the `amount` (must be > 0), `description` (must not be empty), and `paidBy` (must be selected) before submission.
  </action>
  <verify>cat client/src/components/ExpenseForm.jsx | grep -q "disabled={isSubmitting}" && echo "Pass" || echo "Fail"</verify>
  <done>Expense form follows sequential layout and prevents multi-click submissions.</done>
</task>

## Success Criteria
- [ ] Expense form fields are ordered logically.
- [ ] Duplicate submissions are blocked via `isSubmitting` state.
- [ ] Invalid inputs throw clear error messages before API hit.
