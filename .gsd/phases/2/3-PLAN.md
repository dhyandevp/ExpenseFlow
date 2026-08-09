---
phase: 2
plan: 3
wave: 2
---

# Plan 2.3: SQLite to Firestore Migration Script

## Objective
Write a standalone Node.js script to migrate all existing data from the SQLite database to the new Firestore database structure. 

## Context
- .gsd/SPEC.md
- server/db.js
- scripts/migrate-to-firestore.js

## Tasks

<task type="auto">
  <name>Write Migration Script</name>
  <files>
    scripts/migrate-to-firestore.js
    server/package.json
  </files>
  <action>
    - Add `firebase-admin` and `dotenv` to `server/package.json` for the migration script.
    - Write `scripts/migrate-to-firestore.js`.
    - Connect to `server/expenseflow.db` (SQLite) and Firebase Admin (via `process.env.FIREBASE_SERVICE_ACCOUNT_B64`).
    - Read all groups, members, categories, expenses, and settlements.
    - Map SQLite integer IDs to strings for Firestore document IDs to preserve references (e.g., `paid_by` maps to the string version of the member ID).
    - Use batched writes (up to 500 ops per batch) to write data to Firestore collections (`groups`, `members`, `categories`, `expenses`, `settlements`).
    - Run balance recalculations during migration? No, since Plan 2.1 made balances purely dynamic on the frontend. Just migrate the core data.
  </action>
  <verify>test -f scripts/migrate-to-firestore.js && grep "batch.commit()" scripts/migrate-to-firestore.js</verify>
  <done>Migration script is written and uses Firestore batch writes.</done>
</task>

<task type="checkpoint:human-verify">
  <name>Execute Migration</name>
  <files>
    scripts/migrate-to-firestore.js
  </files>
  <action>
    - The user must provide the `FIREBASE_SERVICE_ACCOUNT_B64` environment variable.
    - Run the migration script locally to populate the production Firestore instance.
    - Verify data appears in Firebase Console.
    - Start the React app and verify that the dashboard reads the migrated data correctly.
  </action>
  <verify>echo "Human verification required"</verify>
  <done>Production Firestore instance is seeded with legacy SQLite data.</done>
</task>

## Success Criteria
- [ ] `migrate-to-firestore.js` script successfully moves all tables to Firestore.
- [ ] Referential integrity (IDs) is preserved.
- [ ] Client application can read and display the migrated data correctly.
