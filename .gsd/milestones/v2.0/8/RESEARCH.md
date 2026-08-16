# Phase 8 Research

## Discovery Scope
Identify the target utility functions for Vitest unit testing, verifying their current location and naming since the backend transition to Supabase.

## Findings
- **`greedySettle()`**: This logic now exists as `calculateSettlement(balances)` in `client/src/utils/fairness.js`.
- **`fairnessScore()`**: This logic exists as `calculateFairnessScore(members, expenses)` inside `client/src/utils/balanceMath.js`.
- **`csvSafe()`**: This function exists exactly as named in `client/src/utils/balanceMath.js`.
- **`applyRecurring()`** & **`calculateSplits()`**: Recurring triggers have been moved to stubs or Edge Functions in the serverless transition. We will omit the backend `applyRecurring` test and focus on the math functions that dictate UI logic. We can test `calculateBalances()` instead of `calculateSplits()` as it encompasses the split mathematics.

## Conclusion
We will set up Vitest and write comprehensive tests for:
1. `client/src/utils/balanceMath.js`
2. `client/src/utils/fairness.js`
