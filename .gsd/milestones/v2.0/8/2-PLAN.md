---
phase: 8
plan: 2
wave: 2
---

# Plan 8.2: Fairness Math Tests

## Objective
Write comprehensive unit tests for the core debt settlement logic located in `fairness.js`. This ensures the greedy settlement algorithm optimizes transactions accurately.

## Context
- .gsd/ROADMAP.md
- client/src/utils/fairness.js

## Tasks

<task type="auto">
  <name>Test fairness.js</name>
  <files>client/src/utils/__tests__/fairness.test.js</files>
  <action>
    - Create `client/src/utils/__tests__/fairness.test.js`.
    - Write unit tests for `calculateSettlement`:
      - Test 3-member case where one person paid for two others.
      - Test 4-member unequal splits to ensure the greedy algorithm settles in `≤ N-1` transactions.
      - Test all-settled (all net balances are 0) which should return an empty array.
    - Write unit tests for the aesthetic utility functions (`getFairnessColor`, `getBalanceColor`) to ensure they return the correct Aurora Forest hex codes and strictly adhere to the "No Alarmist Red" constraint.
  </action>
  <verify>npm run test --prefix client -- run</verify>
  <done>All tests in fairness.test.js pass successfully.</done>
</task>

## Success Criteria
- [ ] `calculateSettlement` logic is verified for optimal transaction calculation.
- [ ] Aesthetic utility functions are tested for correctness against the design system.
