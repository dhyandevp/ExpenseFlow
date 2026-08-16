---
phase: 20
plan: 2
wave: 2
---

# Plan 20.2: Financial Math and Split Integrity Tests

## Objective
Write comprehensive unit tests for financial math, ensuring settlement logic and split integrity are completely accurate.

## Context
- .gsd/SPEC.md
- tests/unit.test.js

## Tasks

<task type="auto">
  <name>Math Tests</name>
  <files>
    tests/unit.test.js
  </files>
  <action>
    - In `tests/unit.test.js`, import `calculateFairnessScore` and `calculateBalances` from `../shared/balanceMath.js`.
    - Import `calculateSettlement` from `../shared/fairness.js`.
    - Write a suite for `calculateFairnessScore` with different scenarios (equal split, completely off, ahead of fair share).
    - Write a suite for `calculateSettlement` (greedy settle logic) confirming it optimizes transfers (e.g. 1 payer, multiple borrowers).
  </action>
  <verify>grep "calculateFairnessScore" tests/unit.test.js && grep "calculateSettlement" tests/unit.test.js</verify>
  <done>Unit tests cover fairness score and settlement logic.</done>
</task>

<task type="auto">
  <name>Split Integrity Test</name>
  <files>
    tests/unit.test.js
  </files>
  <action>
    - In the `calculateBalances` test suite, create a test named "Split Integrity: sum of splits equals total".
    - Pass an array of mock members (e.g., 3 members) and a set of expenses (e.g., total 100).
    - Run `calculateBalances`.
    - Ensure the sum of each member's calculated split / fair share / net balance exactly resolves the total expense without floating-point remainder loss.
  </action>
  <verify>grep -i "Split Integrity" tests/unit.test.js</verify>
  <done>Split Integrity test specifically verifies penny-perfect sum.</done>
</task>

## Success Criteria
- [ ] `calculateFairnessScore` and `calculateSettlement` are tested.
- [ ] "Split Integrity" test exists in `calculateBalances` suite.
