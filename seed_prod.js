import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seed() {
  // We need to create a test group for Playwright
  const groupId = "PWTEST";
  
  // Hash the PIN '123456' the same way the frontend does it
  // Wait, frontend hashes it using SHA-256
  const pinHash = crypto.createHash('sha256').update('123456').digest('hex');

  await db.collection("groups").doc(groupId).set({
    name: "Playwright Test Group",
    code: groupId,
    currency: "USD",
    pinHash: pinHash,
    createdAt: new Date().toISOString()
  });

  const membersData = [
    { id: "m1", name: "Playwright", emoji: "🤖" },
    { id: "m2", name: "User", emoji: "👤" }
  ];

  for (const m of membersData) {
    await db.collection(`groups/${groupId}/members`).doc(m.id).set(m);
  }

  console.log(`Successfully seeded group ${groupId} with PIN 123456`);
}

seed().catch(console.error);
