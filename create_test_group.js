import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

// Decode service account
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function createTestGroup() {
    console.log("Creating test group...");
    
    // Create a mock user in Firebase Auth
    const uid = 'test-agent-' + Date.now();
    await auth.createUser({
        uid: uid,
        email: uid + '@example.com',
        emailVerified: true,
        displayName: 'Test Agent'
    });
    console.log("Created user:", uid);

    // Save profile to Firestore
    await db.collection('users').doc(uid).set({
        email: uid + '@example.com',
        displayName: 'Test Agent',
        avatarUrl: null,
        createdAt: new Date(),
        lastActiveAt: new Date()
    });

    // Create a group
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupRef = db.collection('groups').doc();
    const groupId = groupRef.id;

    const pin = "123456";
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

    await groupRef.set({
        name: 'Agent Test Group',
        description: 'Testing expenseflow',
        currency: 'USD',
        code: code,
        pinHash: pinHash,
        members: [uid],
        createdBy: uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        settings: {
            requireReceipts: false,
            allowGuestAddingExpenses: true
        }
    });

    // Save group mapping
    await db.collection('groups').doc(groupId).collection('members').doc(uid).set({
        userId: uid,
        role: 'owner',
        displayName: 'Test Agent',
        joinedAt: new Date()
    });

    console.log("Created group with ID:", groupId);
    console.log("JOIN CODE:", code);
    
    fs.writeFileSync('.test-group.json', JSON.stringify({ uid, groupId, code, pin }));
    process.exit(0);
}

createTestGroup().catch(console.error);
