import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Webhook } from 'svix';
import { logger, generateRequestId } from './_lib/logger.js';

// Disable Vercel's automatic body parsing — Svix needs the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Firebase Admin
function initFirebase(requestId) {
  if (getApps().length === 0) {
    logger.info('firebase_admin_initialization_started', { requestId });
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
      logger.warn('firebase_admin_initialization_failed', { requestId, reason: 'FIREBASE_SERVICE_ACCOUNT_B64 environment variable not set' });
    } else {
      try {
        const serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
        );
        initializeApp({
          credential: cert(serviceAccount)
        });
        logger.info('firebase_admin_initialization_success', { requestId, projectId: serviceAccount.project_id });
      } catch (err) {
        logger.error('firebase_admin_initialization_failed', { requestId, error: err });
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
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const route = '/api/clerk-webhook';

  logger.info('request_received', {
    requestId,
    method: req.method,
    route,
    userAgent: req.headers['user-agent']
  });

  if (req.method !== 'POST') {
    logger.warn('request_failed', { requestId, status: 405, route, method: req.method, durationMs: Date.now() - startTime, reason: 'method_not_allowed' });
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    logger.error('webhook_verification_failed', { requestId, reason: 'Missing CLERK_WEBHOOK_SECRET' });
    logger.error('request_failed', { requestId, status: 500, route, method: req.method, durationMs: Date.now() - startTime });
    return res.status(500).json({ error: 'Webhook secret not configured', requestId });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn('webhook_verification_failed', { requestId, reason: 'Missing svix headers' });
    logger.warn('request_failed', { requestId, status: 400, route, method: req.method, durationMs: Date.now() - startTime });
    return res.status(400).json({ error: 'Missing svix headers', requestId });
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
    logger.info('webhook_verified', { requestId, type: evt.type });
  } catch (err) {
    logger.error('webhook_verification_failed', { requestId, error: err });
    logger.error('request_failed', { requestId, status: 400, route, method: req.method, durationMs: Date.now() - startTime });
    return res.status(400).json({ error: 'Error verifying webhook', requestId });
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
      logger.info('webhook_processing_started', { requestId, type: eventType, userId: id });
      initFirebase(requestId);
      const db = getFirestore();
      
      const userRef = db.collection('users').doc(id);
      await userRef.set({
        email,
        firstName: first_name || '',
        lastName: last_name || '',
        createdAt: new Date().toISOString(),
      }, { merge: true });

      logger.info('webhook_processed', { requestId, type: eventType, userId: id, action: 'user_created_in_firestore' });
      logger.info('request_completed', { requestId, status: 200, route, method: req.method, durationMs: Date.now() - startTime });
      return res.status(200).json({ message: 'User created in Firestore', requestId });
    } catch (dbError) {
      logger.error('webhook_processing_failed', { requestId, type: eventType, userId: id, error: dbError });
      logger.error('request_failed', { requestId, status: 500, route, method: req.method, durationMs: Date.now() - startTime });
      return res.status(500).json({ error: 'Error saving user to database', requestId });
    }
  }

  logger.info('webhook_processed', { requestId, type: eventType, action: 'ignored' });
  logger.info('request_completed', { requestId, status: 200, route, method: req.method, durationMs: Date.now() - startTime });
  return res.status(200).json({ message: 'Webhook received but event type not handled', requestId });
}

export default handler;
