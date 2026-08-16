const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const snapshot = await db.collection('groups').where('code', '==', 'TESTA').get();
  console.log(`Found ${snapshot.size} groups with code TESTA.`);
  snapshot.forEach(doc => console.log(doc.id, doc.data()));
  process.exit(0);
}
run();
