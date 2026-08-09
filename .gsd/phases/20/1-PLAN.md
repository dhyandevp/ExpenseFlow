---
phase: 20
plan: 1
wave: 1
---

# Plan 20.1: Vitest Setup and Utility Tests

## Objective
Configure Vitest for unit testing and write tests for utility functions (`csvSafe`, `applyRecurringTemplate`).

## Context
- .gsd/SPEC.md
- tests/

## Tasks

<task type="auto">
  <name>Test Script Setup</name>
  <files>
    package.json
  </files>
  <action>
    - Add `"test:unit": "vitest run tests/unit.test.js"` to the root `package.json` scripts.
  </action>
  <verify>grep "test:unit" package.json</verify>
  <done>test:unit script exists in package.json.</done>
</task>

<task type="auto">
  <name>Utility Tests</name>
  <files>
    tests/unit.test.js
  </files>
  <action>
    - Create `tests/unit.test.js`.
    - Import `describe`, `it`, `expect` from `vitest`.
    - Import `csvSafe` from `../shared/csv.js`.
    - Import `applyRecurringTemplate` from `../client/src/api/client.js`.
    - Write a suite for `csvSafe` testing normal strings, formula injections (`=`, `+`, `-`, `@`), and values with commas/quotes.
    - Write a suite for `applyRecurringTemplate` ensuring it resolves to an object with `success: true`.
  </action>
  <verify>grep "csvSafe" tests/unit.test.js && grep "applyRecurringTemplate" tests/unit.test.js</verify>
  <done>unit.test.js contains tests for csvSafe and applyRecurringTemplate.</done>
</task>

## Success Criteria
- [ ] `test:unit` script is added.
- [ ] `csvSafe` test suite exists and covers negative cases (injection).
- [ ] `applyRecurringTemplate` test suite exists.
