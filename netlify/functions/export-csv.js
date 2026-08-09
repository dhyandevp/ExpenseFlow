import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { csvSafe } from '../../shared/csv.js';

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
  try {
    const groupId = event.queryStringParameters?.groupId;
    
    if (!groupId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing groupId parameter' })
      };
    }

    initFirebase();
    const db = getFirestore();

    const expensesSnapshot = await db
      .collection('groups')
      .doc(groupId)
      .collection('expenses')
      .orderBy('createdAt', 'desc')
      .get();

    const header = 'Date,Description,Amount,Paid By,Category\n';
    let csvData = header;

    expensesSnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.createdAt ? new Date(new Date(data.createdAt).getTime()).toISOString().split('T')[0] : '';
      const desc = csvSafe(data.description || '');
      const amount = data.amount || 0;
      const paidBy = csvSafe(data.paidBy || '');
      const category = csvSafe(data.category || '');

      csvData += `${date},${desc},${amount},${paidBy},${category}\n`;
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="expenses-${groupId}.csv"`
      },
      body: csvData
    };
  } catch (error) {
    console.error('CSV Export Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate CSV' })
    };
  }
};
