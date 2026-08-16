---
phase: 10
plan: 4
wave: 2
---

# Plan 10.4: Modals & Strict Color Audit

## Objective
Enhance modal overlays with fluid spring animations and enforce the strict UX philosophy regarding colors: absolutely no "alarmist red" for debts/negative balances, using Timeless Grey (`text-text-muted`) instead.

## Context
- .gsd/ROADMAP.md
- client/src/components/ExpenseForm.jsx
- client/src/components/ExpenseLogger.jsx
- client/src/utils/fairness.js

## Tasks

<task type="auto">
  <name>Fluid Modal Animations</name>
  <files>
    client/src/components/ExpenseForm.jsx
  </files>
  <action>
    - Ensure modal backdrops (`bg-black/50` or similar) fade in smoothly.
    - Animate the modal container using a fluid spring transition (e.g., `initial={{ scale: 0.9, opacity: 0 }}` with `type: "spring"`).
  </action>
  <verify>grep "type: \\\"spring\\\"" client/src/components/ExpenseForm.jsx</verify>
  <done>Modals use spring animations for reveals.</done>
</task>

<task type="auto">
  <name>Strict Color Audit (No Alarmist Red)</name>
  <files>
    client/src/pages/Dashboard.jsx
    client/src/components/SettlementHistory.jsx
    client/src/utils/fairness.js
  </files>
  <action>
    - Audit codebase for negative balances or "behind" states.
    - If `text-red-500`, `text-red-400`, or `text-alert` is used for negative balances, replace it with `text-text-muted` (Timeless Grey).
    - Note: `--accent` (yellow/gold) is allowed for general warnings, but negative balances must explicitly be muted.
  </action>
  <verify>grep -i "red" client/src/pages/Dashboard.jsx || echo "No red found"</verify>
  <done>Zero instances of red are used for negative financial states.</done>
</task>

## Success Criteria
- [ ] Modals spring open smoothly.
- [ ] Debts and negative balances are styled with Timeless Grey (`text-text-muted`), promoting calm money conversations.
