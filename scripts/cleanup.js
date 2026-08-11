import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';

// Node 20+ --env-file or manual parse for dotenv
if (fs.existsSync('client/.env.local')) {
  const envConfig = fs.readFileSync('client/.env.local', 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}



const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanup() {
  console.log("Fetching groups...");
  const snapshot = await getDocs(collection(db, 'groups'));
  const groupsToDelete = [];
  
  snapshot.forEach(document => {
    const data = document.data();
    const name = data.name || "";
    if (name.toLowerCase().includes('test') || name.length < 3) {
      groupsToDelete.push(document.id);
    }
  });

  console.log(`Found ${groupsToDelete.length} groups to delete.`);

  for (const groupId of groupsToDelete) {
    console.log(`Deleting group ${groupId}...`);
    
    // Delete expenses subcollection
    const expensesSnap = await getDocs(collection(db, `groups/${groupId}/expenses`));
    if (!expensesSnap.empty) {
      const batch = writeBatch(db);
      let count = 0;
      expensesSnap.forEach(document => {
        batch.delete(document.ref);
        count++;
      });
      await batch.commit();
      console.log(`Deleted ${count} expenses for group ${groupId}`);
    }

    // Delete members
    const membersSnap = await getDocs(collection(db, `groups/${groupId}/members`));
    if (!membersSnap.empty) {
      const batch = writeBatch(db);
      membersSnap.forEach(document => batch.delete(document.ref));
      await batch.commit();
      console.log(`Deleted members for group ${groupId}`);
    }

    // Delete categories
    const catSnap = await getDocs(collection(db, `groups/${groupId}/categories`));
    if (!catSnap.empty) {
      const batch = writeBatch(db);
      catSnap.forEach(document => batch.delete(document.ref));
      await batch.commit();
      console.log(`Deleted categories for group ${groupId}`);
    }

    // Delete group document
    await deleteDoc(doc(db, 'groups', groupId));
    console.log(`Group ${groupId} deleted.`);
  }
  console.log('Cleanup complete.');
}

cleanup().catch(console.error);
