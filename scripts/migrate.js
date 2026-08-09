import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Setup environment and DB paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE_DB_PATH = path.join(__dirname, '../server/expenseflow.db');

console.log("ExpenseFlow Data Migration Script (SQLite -> Firestore)");

if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.warn(`WARNING: SQLite database not found at ${SQLITE_DB_PATH}`);
  console.warn("If this is a fresh setup and the server directory is gone, migration may not be needed.");
}

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`ERROR: serviceAccountKey.json not found at ${serviceAccountPath}`);
  console.error("Please set GOOGLE_APPLICATION_CREDENTIALS or place the file in the correct location.");
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({
  credential: cert(serviceAccount)
});

const firestore = getFirestore();
let sqliteDb;
try {
  sqliteDb = new Database(SQLITE_DB_PATH, { fileMustExist: true });
} catch (e) {
  console.log("Could not open SQLite DB, exiting.");
  process.exit(0);
}

// Helper: batched writes
async function processBatch(collectionArray, batchProcessor) {
  let batch = firestore.batch();
  let count = 0;
  let totalCommitted = 0;

  for (const item of collectionArray) {
    batchProcessor(batch, item);
    count++;

    if (count === 500) {
      await batch.commit();
      totalCommitted += count;
      batch = firestore.batch();
      count = 0;
      console.log(`Committed ${totalCommitted} documents...`);
    }
  }

  if (count > 0) {
    await batch.commit();
    totalCommitted += count;
    console.log(`Committed final batch. Total: ${totalCommitted} documents.`);
  }
}

function generateId() {
  return firestore.collection('_temp').doc().id;
}

// Migration logic
async function runMigration() {
  console.log("Starting migration...");

  // Mapping from SQLite IDs to Firestore Document IDs
  const groupIdsMap = {};
  const memberIdsMap = {};
  const categoryIdsMap = {}; // by group_id and name

  // 1. Groups
  const groups = sqliteDb.prepare("SELECT * FROM groups").all();
  console.log(`Found ${groups.length} groups in SQLite.`);
  await processBatch(groups, (batch, group) => {
    const newId = generateId();
    groupIdsMap[group.id] = newId;
    const docRef = firestore.collection('groups').doc(newId);
    batch.set(docRef, {
      name: group.name,
      code: group.code,
      currency: group.currency || '₹',
      settlementThreshold: group.settlement_threshold || 0,
      createdAt: group.created_at,
      pinHash: group.pin_hash || null,
      currentBalances: {} // Empty for now, client balances are calculated on-the-fly
    });
  });

  // 2. Members
  const members = sqliteDb.prepare("SELECT * FROM members").all();
  console.log(`Found ${members.length} members in SQLite.`);
  await processBatch(members, (batch, member) => {
    const newId = generateId();
    memberIdsMap[member.id] = newId;
    const groupId = groupIdsMap[member.group_id];
    if (groupId) {
      const docRef = firestore.collection('groups').doc(groupId).collection('members').doc(newId);
      batch.set(docRef, {
        name: member.name,
        color: member.color,
        emoji: member.emoji || '😊',
        createdAt: member.created_at
      });
    }
  });

  // 3. Categories
  const categories = sqliteDb.prepare("SELECT * FROM categories").all();
  console.log(`Found ${categories.length} categories in SQLite.`);
  await processBatch(categories, (batch, category) => {
    const groupId = groupIdsMap[category.group_id];
    if (groupId) {
      const newId = generateId();
      categoryIdsMap[`${category.group_id}_${category.name}`] = newId;
      const docRef = firestore.collection('groups').doc(groupId).collection('categories').doc(newId);
      batch.set(docRef, {
        name: category.name,
        emoji: category.emoji,
        color: category.color,
        splitModel: category.split_model,
        isDefault: category.is_default === 1,
        sortOrder: category.sort_order,
        createdAt: category.created_at
      });
    }
  });

  // 4. Expenses
  const expenses = sqliteDb.prepare("SELECT * FROM expenses").all();
  const splits = sqliteDb.prepare("SELECT * FROM expense_splits").all();
  console.log(`Found ${expenses.length} expenses in SQLite.`);
  await processBatch(expenses, (batch, expense) => {
    const groupId = groupIdsMap[expense.group_id];
    const memberId = memberIdsMap[expense.paid_by];
    if (groupId && memberId) {
      const newId = generateId();
      const docRef = firestore.collection('groups').doc(groupId).collection('expenses').doc(newId);
      
      const expenseSplits = splits.filter(s => s.expense_id === expense.id).map(s => ({
        memberId: memberIdsMap[s.member_id],
        shareAmount: s.share_amount,
        sharePercent: s.share_percent
      }));

      batch.set(docRef, {
        paidBy: memberId,
        amount: expense.amount,
        category: expense.category,
        description: expense.description || '',
        createdAt: expense.expense_date || expense.created_at, // Use standardized field
        receiptUrl: expense.receipt_path || null,
        splitType: expense.split_type,
        splits: expenseSplits.length > 0 ? expenseSplits : null
      });
    }
  });

  // 5. Settlements
  const settlements = sqliteDb.prepare("SELECT * FROM settlements").all();
  console.log(`Found ${settlements.length} settlements in SQLite.`);
  await processBatch(settlements, (batch, settlement) => {
    const groupId = groupIdsMap[settlement.group_id];
    const fromMember = memberIdsMap[settlement.from_member];
    const toMember = memberIdsMap[settlement.to_member];
    
    if (groupId && fromMember && toMember) {
      const newId = generateId();
      const docRef = firestore.collection('groups').doc(groupId).collection('settlements').doc(newId);
      batch.set(docRef, {
        fromMember: fromMember,
        toMember: toMember,
        amount: settlement.amount,
        date: settlement.date,
        note: settlement.note || ''
      });
    }
  });

  // 6. Fairness Snapshots
  const fairnessSnapshots = sqliteDb.prepare("SELECT * FROM fairness_snapshots").all();
  console.log(`Found ${fairnessSnapshots.length} fairness_snapshots in SQLite.`);
  await processBatch(fairnessSnapshots, (batch, snapshot) => {
    const groupId = groupIdsMap[snapshot.group_id];
    const memberId = memberIdsMap[snapshot.member_id];
    
    if (groupId && memberId) {
      const newId = generateId();
      const docRef = firestore.collection('groups').doc(groupId).collection('fairnessSnapshots').doc(newId);
      batch.set(docRef, {
        snapshotMonth: snapshot.snapshot_month,
        memberId: memberId,
        score: snapshot.score,
        totalPaid: snapshot.total_paid,
        totalShare: snapshot.total_share,
        createdAt: snapshot.created_at
      });
    }
  });

  // 7. Recurring Templates
  const templates = sqliteDb.prepare("SELECT * FROM recurring_templates").all();
  console.log(`Found ${templates.length} recurring_templates in SQLite.`);
  await processBatch(templates, (batch, template) => {
    const groupId = groupIdsMap[template.group_id];
    const memberId = memberIdsMap[template.paid_by];
    
    if (groupId && memberId) {
      const newId = generateId();
      const docRef = firestore.collection('groups').doc(groupId).collection('recurringTemplates').doc(newId);
      batch.set(docRef, {
        paidBy: memberId,
        amount: template.amount,
        category: template.category,
        description: template.description || '',
        splitType: template.split_type,
        frequency: template.frequency,
        nextDue: template.next_due,
        isActive: template.is_active === 1,
        createdAt: template.created_at
      });
    }
  });

  console.log("Migration complete. Running verification pass...");
  await verifyMigration(groups.length);
}

async function verifyMigration(expectedGroupsCount) {
  // A simple verification: counting top-level groups
  const snapshot = await firestore.collection('groups').count().get();
  const firestoreGroups = snapshot.data().count;
  
  console.log(`--- Verification ---`);
  console.log(`SQLite Groups: ${expectedGroupsCount}`);
  console.log(`Firestore Groups: ${firestoreGroups}`);
  
  if (expectedGroupsCount === firestoreGroups) {
    console.log("✅ Verification Passed: Group counts match.");
  } else {
    console.warn("⚠️ Verification Failed: Document counts differ.");
  }
}

runMigration().catch(console.error);
