# Plan 11.1 Summary

- **Client API Fixes:** Updated `getBalances`, `getFairnessScore`, and `getReport` in `client.js` to query `settlements` from the `groups/{groupId}/settlements` subcollection instead of the root collection.
- **Export Functions Fixes:** Updated `export-csv.js` and `export-pdf.js` to query `expenses` from the `groups/{groupId}/expenses` subcollection. Changed `orderBy('date')` to `orderBy('createdAt')` and updated property mapping to use `paidBy` and `createdAt`.

All verification steps passed successfully.
