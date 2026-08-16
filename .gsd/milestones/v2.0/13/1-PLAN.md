---
phase: 13
plan: 1
wave: 1
---

# Plan 13.1: Dead Code & Junk Removal

## Objective
Remove dead components, unused hooks, duplicate files, debug scripts, test stubs in `api/`, and obsolete CSS.

## Context
- `client/src/`
- `/`

## Tasks

<task type="auto">
  <name>Audit and Remove Dead Files</name>
  <files>
    - .
  </files>
  <action>
    - Delete debug scripts (`fix_app.mjs`, `test_blank.mjs`, etc.).
    - Delete test stubs from `api/`.
    - Delete debug screenshots.
    - Confirm the absence of unused imports.
  </action>
  <verify>npm run build && npx vitest run</verify>
  <done>All tests and builds pass with no dead code present.</done>
</task>

## Success Criteria
- [x] `npm run build` still succeeds
- [x] `npx vitest run` passes
- [x] No import errors
