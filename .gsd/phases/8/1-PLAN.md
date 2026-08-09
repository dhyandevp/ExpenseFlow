---
phase: 8
plan: 1
wave: 1
---

# Plan 8.1: Vitest Setup and Balance Math Tests

## Objective
Set up Vitest in the client workspace and write comprehensive unit tests for the core financial mathematics located in `balanceMath.js`. This ensures the foundation of the ledger is mathematically sound.

## Context
- .gsd/ROADMAP.md
- client/src/utils/balanceMath.js

## Tasks

<task type="auto">
  <name>Install Vitest</name>
  <files>client/package.json</files>
  <action>
    - Install `vitest` and `@vitest/ui` as dev dependencies inside the `client` directory.
    - Add `"test": "vitest run"` and `"test:ui": "vitest --ui"` to `client/package.json` scripts.
  </action>
  <verify>npm run test --prefix client -- --help</verify>
  <done>vitest is installed and scripts are present in package.json.</done>
</task>

<task type="auto">
  <name>Test balanceMath.js</name>
  <files>client/src/utils/__tests__/balanceMath.test.js</files>
  <action>
    - Create `client/src/utils/__tests__/balanceMath.test.js`.
    - Write unit tests for `calculateFairnessScore`: Test equal contributions, extreme disparity (e.g. one payer), and boundary conditions.
    - Write unit tests for `calculateBalances`: Test single expense, split expenses, and verify that the sum of net balances is zero.
    - Write unit tests for `csvSafe`: Verify that strings starting with `=`, `+`, `-`, or `@` are safely prefixed with a single quote `'`.
  </action>
  <verify>npm run test --prefix client -- run</verify>
  <done>All tests in balanceMath.test.js pass successfully.</done>
</task>

## Success Criteria
- [ ] Vitest test runner is configured and functional.
- [ ] `calculateFairnessScore`, `calculateBalances`, and `csvSafe` are fully covered by passing unit tests.
