import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Webhook } from 'svix';

// Disable Vercel's automatic body parsing — Svix needs the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

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

// Read raw body from request stream
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Read raw body for signature verification
  const payload = await getRawBody(req);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err.message);
    return res.status(400).json({ error: 'Error verifying webhook' });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // Find primary email
    let email = '';
    if (email_addresses && email_addresses.length > 0) {
      // Find the one marked as primary, or just take the first one
      const primary = email_addresses.find(e => e.id === evt.data.primary_email_address_id) || email_addresses[0];
      email = primary.email_address;
    }

    try {
      initFirebase();
      const db = getFirestore();
      
      const userRef = db.collection('users').doc(id);
      await userRef.set({
        email,
        firstName: first_name || '',
        lastName: last_name || '',
        createdAt: new Date().toISOString(),
      });

      return res.status(200).json({ message: 'User created in Firestore' });
    } catch (dbError) {
      console.error('Error saving user to Firestore:', dbError);
      return res.status(500).json({ error: 'Error saving user to database' });
    }
  }

  return res.status(200).json({ message: 'Webhook received but event type not handled' });
}

export default handler;

// Named export for test compatibility
export { handler };
