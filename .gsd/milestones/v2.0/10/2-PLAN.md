---
phase: 10
plan: 2
wave: 1
---

# Plan 10.2: Desktop Dashboard Grid Layout

## Objective
Re-architect the Dashboard to utilize the wider desktop viewport. Implement a multi-column CSS Grid layout (Expense Feed on the left, Fairness Analytics/Balances fixed on the right) and replace mobile accordions with expanded grid cards.

## Context
- .gsd/ROADMAP.md
- client/src/pages/Dashboard.jsx
- client/src/components/SettlementHistory.jsx

## Tasks

<task type="auto">
  <name>Generate Dashboard Grid via Stitch MCP</name>
  <files>None</files>
  <action>
    - Use Stitch MCP to generate a 2-column desktop layout for the dashboard.
    - Prompt: "2-column desktop dashboard layout for an expense tracker. Left column (2/3 width) contains a scrolling feed of expenses. Right column (1/3 width, sticky) contains balance summary cards. Use standard data tables or expanded grid cards. Use strictly Aurora Forest CSS variables."
  </action>
  <verify>echo "Stitch MCP grid generation complete"</verify>
  <done>Grid structure generated via Stitch.</done>
</task>

<task type="auto">
  <name>Implement Multi-Column Dashboard</name>
  <files>
    client/src/pages/Dashboard.jsx
  </files>
  <action>
    - Refactor `Dashboard.jsx` into a CSS grid (`grid-cols-1 lg:grid-cols-3` or similar) for desktop.
    - Place the Expense Feed in the main column.
    - Place the Balances and Fairness Analytics in the right column, making them sticky (`sticky top-4`).
    - Expand data tables or grid cards that were previously hidden behind mobile accordions.
  </action>
  <verify>grep "grid-cols" client/src/pages/Dashboard.jsx</verify>
  <done>Dashboard renders as a multi-column grid on desktop.</done>
</task>

## Success Criteria
- [ ] Dashboard uses a multi-column layout on desktop.
- [ ] Mobile view remains functional.
- [ ] Analytics/Balances are fixed/sticky on the right side.
