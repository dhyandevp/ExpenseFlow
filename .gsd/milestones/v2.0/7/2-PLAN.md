---
phase: 7
plan: 2
wave: 2
---

# Plan 7.2: Expense List Cleanup

## Objective
Clean up `ExpenseLogger.jsx` to ensure the expense list is compact, scannable, and clearly displays all critical expense information (description, amount, payer, category, date, and receipt indicator).

## Context
- `client/src/pages/ExpenseLogger.jsx`
- `.gsd/ROADMAP.md`

## Tasks

<task type="auto">
  <name>Compact Expense List</name>
  <files>
    - client/src/pages/ExpenseLogger.jsx
  </files>
  <action>
    - Refactor the list rendering logic so each expense card is compact (less padding, tighter layout).
    - Ensure every expense item visibly shows: Description, Amount (with proper currency formatting via `formatCurrency`), Payer (using `Avatar` or name), Category (using `CategoryIcon`), Date (formatted clearly), and a Receipt indicator (e.g. a small paperclip icon if `receipt_url` exists).
    - Improve the empty state when there are 0 expenses.
  </action>
  <verify>cat client/src/pages/ExpenseLogger.jsx | grep -q "formatCurrency" && echo "Pass" || echo "Fail"</verify>
  <done>ExpenseLogger list is compact and shows all required data points cleanly.</done>
</task>

## Success Criteria
- [ ] Expense items are dense and highly scannable.
- [ ] Receipt icons indicate attachments.
- [ ] `formatCurrency` is correctly used.
