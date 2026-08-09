---
phase: 11
plan: 1
wave: 1
---

# Plan 11.1: Firestore Subcollection Fixes

## Objective
Ensure all queries in the client API and Netlify functions correctly use the `groups/{groupId}/` subcollections for `expenses` and `settlements` instead of the root-level collections.

## Context
- .gsd/SPEC.md
- client/src/api/client.js
- netlify/functions/export-csv.js
- netlify/functions/export-pdf.js

## Tasks

<task type="auto">
  <name>Fix Client API Settlements Collections</name>
  <files>
    client/src/api/client.js
  </files>
  <action>
    - In `getBalances`, change `collection(db, "settlements")` to `collection(db, "groups", groupId, "settlements")`.
    - In `getFairnessScore`, change `collection(db, "settlements")` to `collection(db, "groups", groupId, "settlements")`.
    - In `getReport`, change `collection(db, "settlements")` to `collection(db, "groups", groupId, "settlements")`.
  </action>
  <verify>grep -c "collection(db, \\\"settlements\\\")" client/src/api/client.js | grep "0"</verify>
  <done>All read queries for settlements use the group subcollection.</done>
</task>

<task type="auto">
  <name>Fix Export Functions Collections</name>
  <files>
    netlify/functions/export-csv.js
    netlify/functions/export-pdf.js
  </files>
  <action>
    - In both files, change the expenses query from `db.collection('expenses').where('group_id', '==', groupId)` to `db.collection('groups').doc(groupId).collection('expenses')`.
    - Also change `.orderBy('date', 'desc')` to `.orderBy('createdAt', 'desc')` to align with the new schema.
    - In `export-csv.js`, replace `data.date` with `data.createdAt` and `data.paid_by` with `data.paidBy`.
    - In `export-pdf.js`, replace `e.date` with `e.createdAt` and `e.paid_by` with `e.paidBy`.
  </action>
  <verify>grep -c "db.collection('expenses')" netlify/functions/export-csv.js | grep "0"</verify>
  <done>Export functions correctly query the group subcollection and use the new field names.</done>
</task>

## Success Criteria
- [ ] Root collection query for `settlements` is removed from `client.js`.
- [ ] Netlify functions query the `expenses` subcollection.
- [ ] Netlify functions order by `createdAt`.
