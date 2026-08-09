import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import PDFDocument from 'pdfkit';

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

    const groupDoc = await db.collection('groups').doc(groupId).get();
    if (!groupDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Group not found' })
      };
    }
    const groupData = groupDoc.data();

    const expensesSnapshot = await db
      .collection('expenses')
      .where('group_id', '==', groupId)
      .orderBy('date', 'desc')
      .get();
      
    let totalExpenses = 0;
    expensesSnapshot.forEach(doc => {
      totalExpenses += doc.data().amount || 0;
    });

    const doc = new PDFDocument();
    
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="report-${groupId}.pdf"`
          },
          isBase64Encoded: true,
          body: pdfData.toString('base64')
        });
      });

      doc.fontSize(25).text(`ExpenseFlow Report: ${groupData.name}`, 50, 50);
      doc.fontSize(12).text(`Group Code: ${groupData.code}`, 50, 90);
      doc.text(`Total Expenses: INR ${totalExpenses}`, 50, 110);
      doc.text(`Total Members: ${groupData.members ? groupData.members.length : 0}`, 50, 130);
      
      doc.moveDown();
      doc.fontSize(16).text('Recent Expenses:');
      doc.moveDown();
      
      let count = 0;
      expensesSnapshot.forEach(expenseDoc => {
        if (count < 20) {
          const e = expenseDoc.data();
          const date = e.date ? new Date(e.date.toMillis()).toISOString().split('T')[0] : '';
          doc.fontSize(12).text(`${date} - ${e.description} (INR ${e.amount}) paid by ${e.paid_by}`);
          count++;
        }
      });
      
      if (expensesSnapshot.size > 20) {
        doc.moveDown().text(`...and ${expensesSnapshot.size - 20} more expenses.`);
      }

      doc.end();
    });
  } catch (error) {
    console.error('PDF Export Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate PDF' })
    };
  }
};
