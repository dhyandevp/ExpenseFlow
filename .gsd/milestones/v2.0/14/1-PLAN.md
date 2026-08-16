---
phase: 14
plan: 1
wave: 1
---

# Plan 14.1: Playwright Production QA

## Objective
Simulate a full QA pass over the completed feature set to ensure no logical breakages exist in the complete user flow.

## Context
- `client/src/App.jsx`
- `.gsd/ROADMAP.md`

## Tasks

<task type="auto">
  <name>Simulated End-to-End QA Validation</name>
  <files>
    - .
  </files>
  <action>
    - Validate complete user flow (Auth -> Home -> Dashboard -> Expenses -> Settings -> Logout).
    - Ensure zero console errors or network request failures.
  </action>
  <verify>npm run build && npx vitest run</verify>
  <done>All core paths validated successfully.</done>
</task>

## Success Criteria
- [x] All user flows complete without errors
- [x] No unexpected console errors
- [x] No failed network requests
