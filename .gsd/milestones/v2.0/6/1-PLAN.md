---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Dashboard Layout & Metric Cleanup

## Objective
Clean up the group dashboard to focus on answering "How are we doing financially?". Prioritize Total Spending, Balances, Fairness, and Settlement Status. Remove decorative noise and ensure the correct currency formatting is used dynamically instead of hardcoded INR.

## Context
- `client/src/pages/Dashboard.jsx`
- `client/src/utils/formatCurrency.js`

## Tasks

<task type="auto">
  <name>Update Currency Formatting</name>
  <files>
    - client/src/pages/Dashboard.jsx
  </files>
  <action>
    - Import `formatCurrency` instead of `formatINR` from `../utils/formatCurrency.js`.
    - Replace all instances of `formatINR(value)` with `formatCurrency(value, currentGroup.currency)`.
    - Ensure Tooltips in Recharts use `formatCurrency`.
  </action>
  <verify>cat client/src/pages/Dashboard.jsx | grep -q "formatINR" && echo "Fail" || echo "Pass"</verify>
  <done>No hardcoded formatINR remains in Dashboard.jsx.</done>
</task>

<task type="auto">
  <name>Implement Total Spending & Layout Priority</name>
  <files>
    - client/src/pages/Dashboard.jsx
  </files>
  <action>
    - Calculate `totalSpending` by summing `data.total` across all categories in `breakdown.breakdown` (or return 0 if no data).
    - Reorder the dashboard layout to prioritize:
      1. Top row: Total Spending (large, clean number)
      2. Net Balances and Settlement Suggestions
      3. Fairness Score
      4. Settlement History
      5. Charts (Paid vs Share, Category Breakdown)
    - Remove the overly decorative container around the Fairness Score (e.g. the large circle background) to match the clean UI.
    - Consolidate settlement suggestions into a cleaner list format within the Balances section.
  </action>
  <verify>cat client/src/pages/Dashboard.jsx | grep -q "totalSpending" && echo "Pass" || echo "Fail"</verify>
  <done>Dashboard renders Total Spending at the top and follows the prioritized layout.</done>
</task>

<task type="auto">
  <name>Clean Empty & Loading States</name>
  <files>
    - client/src/pages/Dashboard.jsx
  </files>
  <action>
    - Audit the rendering of charts to ensure they don't render empty boxes if `chartData.length === 0` or `catStackData.length === 0`. Display a clean "No expenses yet" message instead if `totalSpending === 0`.
    - Ensure the time filter UI remains accessible even during loading/empty states.
  </action>
  <verify>cat client/src/pages/Dashboard.jsx | grep -q "No expenses" && echo "Pass" || echo "Fail"</verify>
  <done>Dashboard fails gracefully and cleanly when a group has no data.</done>
</task>

## Success Criteria
- [ ] Dashboard uses `currentGroup.currency` via `formatCurrency`.
- [ ] Total spending is prominently displayed.
- [ ] Layout follows: Total Spending -> Balances -> Fairness -> Settlements -> Charts.
- [ ] No empty charts are rendered; clean empty state is shown when no data exists.
