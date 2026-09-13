import { Webhook } from 'svix';
import { logger, generateRequestId } from './_lib/logger.js';
import { parseServiceAccount, setDoc } from './_lib/firebase-rest.js';

export async function handleClerkWebhookRequest({ method, headers, rawBody, env, requestId }) {
  const startTime = Date.now();
  const route = '/api/clerk-webhook';

  logger.info('request_received', {
    requestId,
    method,
    route,
    userAgent: headers['user-agent']
  });

  if (method !== 'POST') {
    logger.warn('request_failed', { requestId, status: 405, route, method, durationMs: Date.now() - startTime, reason: 'method_not_allowed' });
    return { status: 405, body: JSON.stringify({ error: 'Method not allowed', requestId }) };
  }

  const webhookSecret = env?.CLERK_WEBHOOK_SECRET || (typeof process !== 'undefined' ? process.env?.CLERK_WEBHOOK_SECRET : null);

  if (!webhookSecret) {
    logger.error('webhook_verification_failed', { requestId, reason: 'Missing CLERK_WEBHOOK_SECRET' });
    logger.error('request_failed', { requestId, status: 500, route, method, durationMs: Date.now() - startTime });
    return { status: 500, body: JSON.stringify({ error: 'Webhook secret not configured', requestId }) };
  }

  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn('webhook_verification_failed', { requestId, reason: 'Missing svix headers' });
    logger.warn('request_failed', { requestId, status: 400, route, method, durationMs: Date.now() - startTime });
    return { status: 400, body: JSON.stringify({ error: 'Missing svix headers', requestId }) };
  }

  const wh = new Webhook(webhookSecret);
  let evt;

  try {
    evt = wh.verify(rawBody, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
    logger.info('webhook_verified', { requestId, type: evt.type });
  } catch (err) {
    logger.error('webhook_verification_failed', { requestId, error: err });
    logger.error('request_failed', { requestId, status: 400, route, method, durationMs: Date.now() - startTime });
    return { status: 400, body: JSON.stringify({ error: 'Error verifying webhook', requestId }) };
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data || {};

    let email = '';
    if (email_addresses && email_addresses.length > 0) {
      const primary = email_addresses.find(e => e.id === evt.data.primary_email_address_id) || email_addresses[0];
      email = primary.email_address;
    }

    const userData = {
      email,
      firstName: first_name || '',
      lastName: last_name || '',
      createdAt: new Date().toISOString(),
    };

    try {
      logger.info('webhook_processing_started', { requestId, type: eventType, userId: id });

      // Vitest / test environment path
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
        const appMod = 'firebase-admin/app';
        const fsMod = 'firebase-admin/firestore';
        const { initializeApp, cert, getApps } = await import(/* @vite-ignore */ appMod);
        const { getFirestore } = await import(/* @vite-ignore */ fsMod);

        if (getApps().length === 0) {
          const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_B64);
          initializeApp({ credential: cert(sa) });
        }
        const db = getFirestore();
        const userRef = db.collection('users').doc(id);
        await userRef.set(userData);

        logger.info('webhook_processed', { requestId, type: eventType, userId: id, action: 'user_created_in_firestore' });
        logger.info('request_completed', { requestId, status: 200, route, method, durationMs: Date.now() - startTime });
        return { status: 200, body: JSON.stringify({ message: 'User created in Firestore', requestId }) };
      }

      // Cloudflare Worker / Production path using Firestore REST API
      const saB64 = env?.FIREBASE_SERVICE_ACCOUNT_B64 || (typeof process !== 'undefined' ? process.env?.FIREBASE_SERVICE_ACCOUNT_B64 : null);
      const sa = parseServiceAccount(saB64);

      if (!sa) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 not configured');
      }

      await setDoc(sa, `users/${id}`, userData, { merge: true });

      logger.info('webhook_processed', { requestId, type: eventType, userId: id, action: 'user_created_in_firestore' });
      logger.info('request_completed', { requestId, status: 200, route, method, durationMs: Date.now() - startTime });
      return { status: 200, body: JSON.stringify({ message: 'User created in Firestore', requestId }) };
    } catch (dbError) {
      logger.error('webhook_processing_failed', { requestId, type: eventType, userId: id, error: dbError });
      logger.error('request_failed', { requestId, status: 500, route, method, durationMs: Date.now() - startTime });
      return { status: 500, body: JSON.stringify({ error: 'Error saving user to database', requestId }) };
    }
  }

  logger.info('webhook_processed', { requestId, type: eventType, action: 'ignored' });
  logger.info('request_completed', { requestId, status: 200, route, method, durationMs: Date.now() - startTime });
  return { status: 200, body: JSON.stringify({ message: 'Webhook received but event type not handled', requestId }) };
}

function getRawBodyFromNodeStream(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(reqOrRequest, resOrEnv, ctx) {
  const isNode = resOrEnv && typeof resOrEnv.status === 'function';

  if (isNode) {
    const req = reqOrRequest;
    const res = resOrEnv;
    const requestId = req.headers?.['x-request-id'] || generateRequestId();

    let rawBody = '';
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (typeof req.on === 'function') {
      rawBody = await getRawBodyFromNodeStream(req);
    } else if (req.body) {
      rawBody = JSON.stringify(req.body);
    }

    const result = await handleClerkWebhookRequest({
      method: req.method,
      headers: req.headers || {},
      rawBody,
      env: typeof process !== 'undefined' ? process.env : {},
      requestId
    });

    res.setHeader('Content-Type', 'application/json');
    return res.status(result.status).json(JSON.parse(result.body));
  }

  // Cloudflare Worker Fetch handler
  const request = reqOrRequest;
  const env = resOrEnv || {};
  const requestId = request.headers?.get?.('x-request-id') || generateRequestId();
  const rawBody = await request.text();

  const result = await handleClerkWebhookRequest({
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    rawBody,
    env,
    requestId
  });

  return new Response(result.body, {
    status: result.status,
    headers: { 'Content-Type': 'application/json', 'x-request-id': requestId }
  });
}
