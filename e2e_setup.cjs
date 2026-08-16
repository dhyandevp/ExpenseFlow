const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const code = 'TESTA';
  const pin = '123456';
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

  // Check if group exists
  const snapshot = await db.collection('groups').where('code', '==', code).get();
  for (const doc of snapshot.docs) {
    await db.recursiveDelete(doc.ref);
    console.log(`Deleted existing group with code ${code}`);
  }

  // Create a dummy user
  const userRef = db.collection('users').doc('clerk_test_user_id');
  await userRef.set({
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  });

  // Create the group
  const groupRef = await db.collection('groups').add({
    name: 'E2E Test Group',
    code: code,
    pinHash: pinHash,
    createdBy: 'clerk_test_user_id',
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: { currency: 'USD', defaultSplit: 'EQUAL' }
  });

  // Add members
  const membersRef = groupRef.collection('members');
  await membersRef.doc('m1').set({
    id: 1,
    name: 'Alice',
    joinedAt: new Date()
  });
  await membersRef.doc('m2').set({
    id: 2,
    name: 'Bob',
    joinedAt: new Date()
  });

  console.log(`Created group with code ${code} and ID ${groupRef.id}`);
  process.exit(0);
}
run();
