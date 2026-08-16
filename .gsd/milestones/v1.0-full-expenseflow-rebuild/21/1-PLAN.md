---
phase: 21
plan: 1
wave: 1
---

# Plan 21.1: Migration Script Creation

## Objective
Create a script to migrate legacy SQLite data (`expenseflow.db`) to the new Firestore architecture, preserving relationships through the new subcollection structure and standardizing schema fields.

## Context
- .gsd/SPEC.md
- ExpenseFlow_AI_Agent_Implementation_Prompts.md (Phase 21)

## Tasks

<task type="auto">
  <name>Create Migration Script</name>
  <files>
    scripts/migrate.js
  </files>
  <action>
    - Create `scripts/migrate.js`.
    - It should require `better-sqlite3` and `firebase-admin/app` + `firebase-admin/firestore`.
    - Implement batched writes (max 500 ops per batch using `db.batch()`).
    - Migrate tables in order: `groups`, `members`, `categories`, `expenses`, `settlements`, `fairness_snapshots`, `recurring_templates`.
    - For `groups`: generate random alphanumeric ID for Firestore, keeping `code`, `currency`, `settlementThreshold` (from `settlement_threshold`), `createdAt` (from `created_at`), `name`, `pinHash` (from `pin_hash`). Also add `currentBalances: {}`. Store a mapping of SQLite group `id` to Firestore `groupId`.
    - For `members`, `categories`, `expenses`, `settlements`, `fairness_snapshots`, `recurring_templates`: write these as subcollections under the mapped `groups/{groupId}`.
    - Transform fields appropriately for expenses (`paid_by` -> `paidBy`, `expense_date` -> `createdAt`, `receipt_path` -> `receiptUrl`).
    - After migration, perform a `SELECT COUNT(*)` on each SQLite table, and compare it with the size of the Firestore collection/subcollection aggregations. Log the counts and any discrepancies.
  </action>
  <verify>ls scripts/migrate.js</verify>
  <done>Script `scripts/migrate.js` exists and contains batching logic and count verification.</done>
</task>

## Success Criteria
- [ ] `scripts/migrate.js` uses `db.batch()`.
- [ ] Script processes tables in the correct order.
- [ ] Document counting verification is included at the end.
