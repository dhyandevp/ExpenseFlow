const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
if (!admin.apps.length) admin.initializeApp();
const db = getFirestore();
async function run() {
  const snapshot = await db.collection('groups').where('code', '==', 'TESTA').get();
  for (const doc of snapshot.docs) {
    await db.recursiveDelete(doc.ref);
  }
  console.log("Deleted TESTA group");
  process.exit(0);
}
run();
