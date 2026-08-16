---
phase: 9
plan: 1
wave: 1
---

# Plan 9.1: Fairness Report Cleanup

## Objective
Reorganize the Fairness Report to follow a logical flow (Overview → Fairness → Members → Categories → Settlement → Export). Simplify the UI by removing decorative noise and ensure print output is professional. Fix currency formatting to use group-specific currency.

## Context
- `client/src/pages/FairnessReport.jsx`
- `.gsd/ROADMAP.md`

## Tasks

<task type="auto">
  <name>Currency & Layout Restructuring</name>
  <files>
    - client/src/pages/FairnessReport.jsx
  </files>
  <action>
    - Import `formatINR as formatCurrency` from `../utils/formatCurrency`.
    - Update all instances of `formatINR` to `formatCurrency(val, currentGroup?.currency)`.
    - Reorder sections to match: Summary Narrative -> Fairness Overview -> Settlement Plan -> Category Grid.
    - Remove excessive background colors from cards to reduce decorative noise.
    - Add `print:hidden` to buttons and navigation elements to ensure professional print output.
  </action>
  <verify>cat client/src/pages/FairnessReport.jsx | grep -q "formatCurrency" && echo "Pass" || echo "Fail"</verify>
  <done>Report uses dynamic currency, follows logical flow, and has professional print styling.</done>
</task>

## Success Criteria
- [ ] Correct section order is implemented.
- [ ] Print styles hide unnecessary UI (buttons, period selector).
- [ ] Currency format relies on `currentGroup.currency`.
