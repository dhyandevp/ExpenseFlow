import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { calculateBalances, calculateFairnessScore } from '../../shared/balanceMath.js';

// Initialize Firebase Admin
function initFirebase() {
  if (getApps().length === 0) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_B64 environment variable not set');
    } else {
      try {
        const serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
        );
        initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (err) {
        console.error('Failed to initialize Firebase Admin:', err);
      }
    }
  }
}

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { groupId } = body;

    if (!groupId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'groupId is required' }),
      };
    }

    initFirebase();
    const db = getFirestore();
    const groupRef = db.collection('groups').doc(groupId);
    
    // Check if group exists
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Group not found' }),
      };
    }

    // Fetch subcollections concurrently
    const [membersSnap, expensesSnap, settlementsSnap] = await Promise.all([
      groupRef.collection('members').get(),
      groupRef.collection('expenses').get(),
      groupRef.collection('settlements').get()
    ]);

    const members = membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const settlements = settlementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate new data
    const balanceResult = calculateBalances(members, expenses, settlements);
    const fairnessScore = calculateFairnessScore(members, expenses);

    // Update group document
    await groupRef.update({
      currentBalances: balanceResult.balances || [],
      settlementSuggestions: balanceResult.settlement_suggestions || [],
      fairnessScore: fairnessScore || 0,
      lastCalculatedAt: FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Balances recalculated successfully' }),
    };
  } catch (error) {
    console.error('Error in balance-trigger:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
