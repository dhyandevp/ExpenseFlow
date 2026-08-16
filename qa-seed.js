import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const app = initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project' });
const db = getFirestore(app);
const auth = getAuth(app);

async function seed() {
  console.log("Seeding emulator data...");
  const groupId = "TEST4";
  
  // Create a fake clerk user in Firebase Auth Emulator
  try {
    await auth.createUser({
      uid: "clerk_user_1",
      email: "qa@expenseflow.site",
      password: "password123",
      displayName: "QA User",
    });
  } catch (e) {
    if (e.code !== 'auth/uid-already-exists') throw e;
  }
  
  // Set custom claims (simulate Clerk)
  await auth.setCustomUserClaims("clerk_user_1", { clerk: true });
  
  // Seed Firestore Group
  await db.collection("groups").doc(groupId).set({
    name: "QA Test Group",
    code: groupId,
    currency: "INR",
    createdAt: new Date().toISOString()
  });

  // Seed Members Subcollection
  const membersData = [
    { id: "m1", name: "Alice", emoji: "👩🏻", userId: "clerk_user_1" },
    { id: "m2", name: "Bob", emoji: "👨🏻" },
    { id: "m3", name: "Charlie", emoji: "👱🏻" }
  ];

  for (const m of membersData) {
    await db.collection(`groups/${groupId}/members`).doc(m.id).set(m);
  }

  // Seed some expenses
  const expensesRef = db.collection(`groups/${groupId}/expenses`);
  await expensesRef.add({
    description: "Dinner",
    category: "Outings",
    amount: 1200,
    paidBy: "m1",
    splitType: "EQUAL",
    splitAmong: ["m1", "m2", "m3"],
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });

  await expensesRef.add({
    description: "Groceries",
    category: "Groceries",
    amount: 800,
    paidBy: "m2",
    splitType: "EXACT",
    splitAmong: ["m1", "m2"],
    splitDetails: { m1: 500, m2: 300 },
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });

  console.log("Seeding complete!");
}

seed().catch(console.error);
