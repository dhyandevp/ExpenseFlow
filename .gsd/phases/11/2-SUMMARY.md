# Plan 11.2 Summary

- **Client API Expense Schema:** Updated `createExpense` to solely accept standard fields (`paidBy`, `createdAt`, `receiptUrl`) and explicitly set `splits` to null if not provided. Updated `getExpenses` to no longer map fields to legacy equivalents, allowing standard database schemas to pass straight through to components.
- **Shared Math Logic:** Updated `calculateBalances`, `calculateCategoryBreakdown`, and `calculateFairnessScore` in `shared/balanceMath.js` to rely exclusively on `e.paidBy` instead of `e.paid_by`.

All verification steps passed successfully.
