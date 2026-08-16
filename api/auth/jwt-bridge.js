import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyToken } from '@clerk/backend';
import crypto from 'crypto';
import { logger, generateRequestId } from '../_lib/logger.js';

// Initialize Firebase Admin (Only needed for Firestore)
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

// Ensure constant time comparison for security
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}


// Generate Firebase Custom Token without requiring firebase-admin/auth which causes Vercel bundle issues
function createFirebaseCustomToken(uid, claims = {}, requestId) {
  logger.info('firebase_custom_token_started', { requestId, uid });
  try {
    const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));
    const header = { alg: 'RS256', typ: 'JWT' };
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: iat,
      exp: iat + 3600,
      uid: uid,
      claims: claims
    };

    const b64url = str => Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedHeader = b64url(JSON.stringify(header));
    const encodedPayload = b64url(JSON.stringify(payload));

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(encodedHeader + '.' + encodedPayload);
    const signature = sign.sign(sa.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    logger.info('firebase_custom_token_success', { requestId, uid });
    return encodedHeader + '.' + encodedPayload + '.' + signature;
  } catch (err) {
    logger.error('firebase_custom_token_failed', { requestId, error: err });
    throw err;
  }
}

export default async function handler(req, res) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const route = '/api/auth/jwt-bridge';

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  };

  logger.info('request_received', {
    requestId,
    method: req.method,
    route,
    userAgent: req.headers['user-agent']
  });

  try {
    initFirebase(requestId);
    const db = getFirestore();
    const ip = req.headers['x-forwarded-for'] || req.headers['client-ip'] || 'unknown-ip';

    // Mode A: Authenticated user (Clerk)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      logger.info('authentication_started', { requestId, mode: 'clerk' });
      const token = authHeader.split(' ')[1];
      try {
        logger.info('clerk_verification_started', { requestId });
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        const clerkUserId = payload.sub;
        logger.info('clerk_verification_success', { requestId, clerkUserId });

        const firebaseToken = createFirebaseCustomToken(clerkUserId, { mode: 'clerk' }, requestId);
        
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        logger.info('request_completed', { requestId, status: 200, route, method: req.method, durationMs: Date.now() - startTime });
        return res.status(200).json({ firebaseToken, requestId });
      } catch (error) {
        logger.error('clerk_verification_failed', { requestId, error: error.message, stack: error.stack });
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        logger.error('request_failed', { requestId, status: 401, route, method: req.method, durationMs: Date.now() - startTime });
        return res.status(401).json({ error: 'Invalid Clerk token or signing error: ' + error.message, requestId });
      }
    }

    // Mode B: Guest Access (code + pinHash)
    if (req.method === 'POST') {
      logger.info('guest_auth_started', { requestId });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { code, pin } = body;

      if (!code || !pin) {
        logger.warn('guest_auth_failure', { requestId, reason: 'missing_credentials' });
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        logger.warn('request_completed', { requestId, status: 400, route, method: req.method, durationMs: Date.now() - startTime });
        return res.status(400).json({ error: 'Code and pin are required for guest access', requestId });
      }

      // Check Rate Limits
      const rateLimitRef = db.collection('rateLimits').doc(ip);
      const rateLimitDoc = await rateLimitRef.get();
      const now = Date.now();
      
      let attempts = [];
      let consecutiveFailures = 0;
      let blockUntil = 0;

      if (rateLimitDoc.exists) {
        const data = rateLimitDoc.data();
        attempts = data.attempts || [];
        consecutiveFailures = data.consecutiveFailures || 0;
        blockUntil = data.blockUntil || 0;

        // Check if IP is blocked
        if (now < blockUntil) {
          logger.warn('rate_limit_triggered', { requestId, ip, blockUntil });
          Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
          return res.status(429).json({ 
            error: 'Too many attempts. Please try again later.',
            blockUntil,
            requestId
          });
        }

        // Clean up attempts older than 15 minutes
        attempts = attempts.filter(time => now - time < 15 * 60 * 1000);
      }

      if (attempts.length >= 10) {
        logger.warn('rate_limit_triggered', { requestId, ip, reason: '10_attempts_in_15_mins' });
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(429).json({ error: 'Rate limit exceeded (10 attempts / 15 mins)', requestId });
      }

      // Lookup Group
      logger.info('guest_group_lookup', { requestId, groupCodeLength: code.length });
      const groupsSnapshot = await db.collection('groups').where('code', '==', code).limit(1).get();
      
      if (groupsSnapshot.empty) {
        // Record failure
        attempts.push(now);
        await rateLimitRef.set({ attempts, consecutiveFailures, blockUntil });
        logger.warn('guest_auth_failure', { requestId, reason: 'group_not_found' });
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        logger.warn('request_completed', { requestId, status: 404, route, method: req.method, durationMs: Date.now() - startTime });
        return res.status(404).json({ error: 'Group not found', requestId });
      }

      const groupDoc = groupsSnapshot.docs[0];
      const groupData = groupDoc.data();
      const groupId = groupDoc.id;

      // Verify PIN
      logger.info('guest_pin_validation', { requestId, groupId });
      const computedPinHash = crypto.createHash('sha256').update(pin).digest('hex');
      const isValid = safeCompare(computedPinHash, groupData.pinHash);

      if (!isValid) {
        consecutiveFailures += 1;
        attempts.push(now);
        
        if (consecutiveFailures >= 3) {
          blockUntil = now + 60 * 60 * 1000; // block for 1 hour
        }

        await rateLimitRef.set({ attempts, consecutiveFailures, blockUntil });

        logger.warn('guest_auth_failure', { requestId, reason: 'incorrect_pin', groupId });
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        logger.warn('request_completed', { requestId, status: 401, route, method: req.method, durationMs: Date.now() - startTime });
        return res.status(401).json({ 
          error: 'Incorrect PIN',
          remainingAttempts: Math.max(0, 3 - consecutiveFailures),
          blockUntil,
          requestId
        });
      }

      // Success! Reset failures
      await rateLimitRef.set({ attempts, consecutiveFailures: 0, blockUntil: 0 });

      // Create Custom Token for Guest
      const guestUid = 'guest_' + crypto.randomUUID().replace(/-/g, '');
      const firebaseToken = createFirebaseCustomToken(guestUid, { 
        guestGroupId: groupId, 
        mode: 'guest' 
      }, requestId);

      logger.info('guest_auth_success', { requestId, groupId, guestUid });
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      logger.info('request_completed', { requestId, status: 200, route, method: req.method, durationMs: Date.now() - startTime });
      return res.status(200).json({ 
        firebaseToken,
        groupId,
        expiresIn: 3600, // 1 hour token
        requestId
      });
    }

    logger.warn('request_failed', { requestId, status: 405, route, method: req.method, durationMs: Date.now() - startTime, reason: 'method_not_allowed' });
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ error: 'Method not allowed', requestId });

  } catch (error) {
    logger.error('request_failed', { requestId, error: error.message, stack: error.stack, status: 500, route, method: req.method, durationMs: Date.now() - startTime });
    return res.status(500).json({ error: 'Internal server error: ' + error.message, requestId });
  }
}
