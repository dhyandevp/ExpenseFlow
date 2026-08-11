import { v2 as cloudinary } from 'cloudinary';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Ensure fetch is available in Node
import fetch from 'node-fetch';
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

function loadEnv() {
  const envFiles = ['.env', 'client/.env.local'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const envConfig = fs.readFileSync(file, 'utf8');
      envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const val = match[2].trim().replace(/^"|"$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
      });
    }
  });
}

async function cleanupCloudinary() {
  loadEnv();

  cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

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

  console.log("Fetching Cloudinary images in 'expenseflow' folder...");
  
  let allImages = [];
  let nextCursor = null;

  do {
    const res = await cloudinary.search
      .expression('folder:expenseflow')
      .max_results(500)
      .next_cursor(nextCursor)
      .execute();
    allImages = allImages.concat(res.resources);
    nextCursor = res.next_cursor;
  } while (nextCursor);

  console.log(`Found ${allImages.length} images in Cloudinary.`);

  if (allImages.length === 0) {
    console.log("No images to clean up.");
    return;
  }

  const dbImages = new Set();
  const groupsSnap = await getDocs(collection(db, 'groups'));
  
  console.log(`Checking ${groupsSnap.size} groups for expenses with receipts...`);
  
  for (const groupDoc of groupsSnap.docs) {
    const expensesSnap = await getDocs(collection(db, `groups/${groupDoc.id}/expenses`));
    expensesSnap.forEach(expense => {
      const receiptUrl = expense.data().receiptUrl;
      if (receiptUrl) {
        dbImages.add(receiptUrl);
      }
    });
  }
  
  console.log(`Found ${dbImages.size} unique receipt URLs in database.`);

  let deletedCount = 0;
  for (const image of allImages) {
    const url = image.secure_url;
    if (!dbImages.has(url)) {
      console.log(`Image ${url} is orphaned. Deleting...`);
      await cloudinary.uploader.destroy(image.public_id);
      deletedCount++;
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} orphaned images.`);
}

cleanupCloudinary().catch(console.error);
