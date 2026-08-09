import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check for Service Account
if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_B64 environment variable.");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf-8")
);

initializeApp({
  credential: cert(serviceAccount)
});

const firestore = getFirestore();
const dbPath = path.join(__dirname, "../server/expenseflow.db");

console.log(`Connecting to SQLite DB at: ${dbPath}`);
let sqlite;
try {
  sqlite = new Database(dbPath, { fileMustExist: true });
} catch (e) {
  console.error("SQLite database not found at", dbPath);
  process.exit(1);
}

// Read tables
const groups = sqlite.prepare("SELECT * FROM groups").all();
const members = sqlite.prepare("SELECT * FROM members").all();
const categories = sqlite.prepare("SELECT * FROM categories").all();
const expenses = sqlite.prepare("SELECT * FROM expenses").all();
const expenseSplits = sqlite.prepare("SELECT * FROM expense_splits").all();
const settlements = sqlite.prepare("SELECT * FROM settlements").all();
const scenarios = sqlite.prepare("SELECT * FROM scenarios").all();
const recurring = sqlite.prepare("SELECT * FROM recurring_templates").all();
const snapshots = sqlite.prepare("SELECT * FROM fairness_snapshots").all();
const models = sqlite.prepare("SELECT * FROM fairness_models").all();

console.log(`Read ${groups.length} groups, ${members.length} members, ${expenses.length} expenses.`);

async function migrateData() {
  let batch = firestore.batch();
  let opCount = 0;

  const commitBatchIfNeeded = async () => {
    if (opCount >= 450) {
      console.log("Committing batch...");
      await batch.commit();
      batch = firestore.batch();
      opCount = 0;
    }
  };

  // Migrate Groups
  for (const group of groups) {
    const docRef = firestore.collection("groups").doc(group.id.toString());
    batch.set(docRef, {
      ...group,
      id: group.id.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Members
  for (const m of members) {
    const docRef = firestore.collection("members").doc(m.id.toString());
    batch.set(docRef, {
      ...m,
      id: m.id.toString(),
      group_id: m.group_id.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Categories
  for (const c of categories) {
    const docRef = firestore.collection("categories").doc(c.id.toString());
    batch.set(docRef, {
      ...c,
      id: c.id.toString(),
      group_id: c.group_id.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Expenses
  for (const e of expenses) {
    const docRef = firestore.collection("expenses").doc(e.id.toString());
    batch.set(docRef, {
      ...e,
      id: e.id.toString(),
      group_id: e.group_id.toString(),
      paid_by: e.paid_by.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Expense Splits
  for (const es of expenseSplits) {
    const docRef = firestore.collection("expense_splits").doc(es.id.toString());
    batch.set(docRef, {
      ...es,
      id: es.id.toString(),
      expense_id: es.expense_id.toString(),
      member_id: es.member_id.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Settlements
  for (const s of settlements) {
    const docRef = firestore.collection("settlements").doc(s.id.toString());
    batch.set(docRef, {
      ...s,
      id: s.id.toString(),
      group_id: s.group_id.toString(),
      from_member: s.from_member.toString(),
      to_member: s.to_member.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Scenarios
  for (const sc of scenarios) {
    const docRef = firestore.collection("scenarios").doc(sc.id.toString());
    batch.set(docRef, {
      ...sc,
      id: sc.id.toString(),
      group_id: sc.group_id.toString(),
      // Some fields like actions might be JSON strings in SQLite, we'll just migrate as strings for now
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Recurring
  for (const r of recurring) {
    const docRef = firestore.collection("recurring_templates").doc(r.id.toString());
    batch.set(docRef, {
      ...r,
      id: r.id.toString(),
      group_id: r.group_id.toString(),
      paid_by: r.paid_by.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Snapshots
  for (const sn of snapshots) {
    const docRef = firestore.collection("fairness_snapshots").doc(sn.id.toString());
    batch.set(docRef, {
      ...sn,
      id: sn.id.toString(),
      group_id: sn.group_id.toString(),
      member_id: sn.member_id.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  // Migrate Models
  for (const fm of models) {
    const docRef = firestore.collection("fairness_models").doc(fm.id.toString());
    batch.set(docRef, {
      ...fm,
      id: fm.id.toString(),
      group_id: fm.group_id.toString()
    });
    opCount++;
    await commitBatchIfNeeded();
  }

  if (opCount > 0) {
    console.log("Committing final batch...");
    await batch.commit();
  }

  console.log("Migration complete!");
}

migrateData().catch(console.error);
