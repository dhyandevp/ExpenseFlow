---
phase: 6
plan: 3
wave: 3
---

# Plan 6.3: Data Views & Interactions

## Objective
Apply mobile-first paradigms to complex data views (Dashboard, Expense Logger, Settlements) and implement swipe gestures.

## Context
- .gsd/SPEC.md
- client/src/pages/Dashboard.jsx
- client/src/pages/ExpenseLogger.jsx
- client/src/components/SettlementHistory.jsx

## Tasks

<task type="auto">
  <name>Enhance ExpenseLogger</name>
  <files>
    client/src/pages/ExpenseLogger.jsx
    client/src/components/ExpenseForm.jsx
  </files>
  <action>
    - Convert `ExpenseForm` into a bottom sheet layout using the `sheetSlide` motion variant, anchored to the bottom on mobile screens.
    - Add a Floating Action Button (FAB) in `ExpenseLogger` using the `springScale` variant to trigger the bottom sheet.
    - Add Framer Motion `drag="x"` to expense list items, enabling a swipe-left-to-delete gesture pattern. Ensure `will-change: transform` is applied.
  </action>
  <verify>grep "drag=" client/src/pages/ExpenseLogger.jsx</verify>
  <done>Expense items are swipeable, and forms appear as animated bottom sheets.</done>
</task>

<task type="auto">
  <name>Refine Dashboard & Settlements</name>
  <files>
    client/src/pages/Dashboard.jsx
    client/src/components/SettlementHistory.jsx
  </files>
  <action>
    - In `Dashboard.jsx`, ensure all cards are full-width on mobile. Implement horizontal scroll (`overflow-x-auto snap-x`) for charts or multi-card groups to save vertical space.
    - In `SettlementHistory.jsx`, redesign the layout into a vertical timeline view suitable for mobile screens.
  </action>
  <verify>grep "overflow-x-auto" client/src/pages/Dashboard.jsx</verify>
  <done>Dashboards utilize horizontal scrolling, and history is timeline-formatted.</done>
</task>

## Success Criteria
- [ ] Swipe-to-delete interactions are functional on expense items.
- [ ] Dashboards are compact and horizontally scrollable on mobile.
