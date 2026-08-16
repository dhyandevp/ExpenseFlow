---
phase: 8
plan: 1
wave: 1
---

# Plan 8.1: Scenario Planner Cleanup

## Objective
Make the Scenario Planner feel like a focused simulation tool by distinguishing hypothetical projections from real data. Update currency formatting to use group-specific currency.

## Context
- `client/src/pages/ScenarioPlanner.jsx`
- `.gsd/ROADMAP.md`

## Tasks

<task type="auto">
  <name>Currency & Visual Separation Update</name>
  <files>
    - client/src/pages/ScenarioPlanner.jsx
  </files>
  <action>
    - Import `formatINR as formatCurrency` from `../utils/formatCurrency`.
    - Update all `formatINR` calls to `formatCurrency(val, currentGroup?.currency)`.
    - Add a clear visual indicator (e.g., a banner or badge) to the Results section stating "Simulated Projections" so it is clearly not real data.
    - Ensure saved scenarios handle empty states correctly.
  </action>
  <verify>cat client/src/pages/ScenarioPlanner.jsx | grep -q "formatCurrency" && echo "Pass" || echo "Fail"</verify>
  <done>Scenario Planner uses correct currency and distinguishes simulated data visually.</done>
</task>

## Success Criteria
- [ ] Currency formatting respects group settings.
- [ ] Visual separation between inputs and results is clear.
- [ ] No unnecessary decorative noise.
