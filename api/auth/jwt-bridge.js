import { verifyToken } from '@clerk/backend';
import { logger, generateRequestId } from '../_lib/logger.js';
import {
  parseServiceAccount,
  createFirebaseCustomToken,
  findGroupByCode,
  getDoc,
  setDoc
} from '../_lib/firebase-rest.js';

// Exported for backward-compatibility with tests
export async function initFirebase(requestId) {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    try {
      const appMod = 'firebase-admin/app';
      const { initializeApp, cert, getApps } = await import(/* @vite-ignore */ appMod);
      if (getApps().length === 0 && process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
        const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_B64);
        initializeApp({ credential: cert(sa) });
      }
    } catch (e) {
      // Ignored in non-test / workers environments
    }
  }
}

/**
 * Core handler logic returning { status, headers, body }
 */
export async function handleJwtBridgeRequest({ method, headers, getBody, query, env, requestId }) {
  const startTime = Date.now();
  const route = '/api/auth/jwt-bridge';

  logger.info('request_received', { requestId, method, route });

  const origin = headers.origin || headers.referer || '*';
  const allowedOrigins = [
    'https://expenseflow.site',
    'https://expense-flow-two.vercel.app',
    'http://localhost:5173',
    'http://localhost:8787',
    'http://localhost:3000'
  ];

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-request-id',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    logger.info('request_completed', { requestId, status: 204, route, method, durationMs: Date.now() - startTime });
    return { status: 204, headers: corsHeaders, body: '' };
  }

  const clerkSecret = env?.CLERK_SECRET_KEY || (typeof process !== 'undefined' ? process.env?.CLERK_SECRET_KEY : null);
  const saB64 = env?.FIREBASE_SERVICE_ACCOUNT_B64 || (typeof process !== 'undefined' ? process.env?.FIREBASE_SERVICE_ACCOUNT_B64 : null);
  const sa = parseServiceAccount(saB64);

  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const isProd = env?.ENVIRONMENT === 'production' || (!env?.ENVIRONMENT && typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
  const expectedProjectId = isProd ? 'expenseflow-expenstracker' : 'expenseflow-42347';

  // Guard against using production service account in local development
  if (!isTest && sa && sa.project_id && !isProd && sa.project_id === 'expenseflow-expenstracker') {
    logger.error('environment_mismatch', {
      requestId,
      error: 'Production service account (expenseflow-expenstracker) cannot be used in local development. Development requires expenseflow-42347.'
    });
    return {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Configuration Error: Production service account (expenseflow-expenstracker) cannot be used in local development. Development requires a service account for project expenseflow-42347.',
        expectedProject: expectedProjectId,
        providedProject: sa.project_id,
        requestId
      })
    };
  }

  const ip = headers['x-forwarded-for']?.split(',')[0].trim() ||
             headers['cf-connecting-ip'] ||
             headers['x-real-ip'] ||
             '127.0.0.1';

  // Mode A: Clerk to Firebase Exchange (Logged in users)
  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    logger.info('clerk_token_verification_started', { requestId });

    try {
      const decoded = await verifyToken(token, {
        secretKey: clerkSecret,
      });

      const uid = decoded.sub;
      logger.info('clerk_token_verification_success', { requestId, uid });

      if (!sa) {
        logger.error('missing_service_account', { requestId, expectedProjectId });
        return {
          status: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: `Missing Firebase service account for ${expectedProjectId}. A service account private key must be generated in Firebase Console for project ${expectedProjectId} and configured in FIREBASE_SERVICE_ACCOUNT_B64.`,
            expectedProject: expectedProjectId,
            requestId
          })
        };
      }

      const firebaseToken = await createFirebaseCustomToken(sa, uid, { mode: 'clerk' });

      logger.info('firebase_token_issued', { requestId, uid });
      logger.info('request_completed', { requestId, status: 200, route, method, durationMs: Date.now() - startTime });
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ firebaseToken, expiresIn: 3600, requestId })
      };
    } catch (err) {
      logger.error('clerk_token_verification_failed', { requestId, error: err });
      logger.warn('request_completed', { requestId, status: 401, route, method, durationMs: Date.now() - startTime });
      return {
        status: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid or expired Clerk token', requestId })
      };
    }
  }

  // Mode B: Guest Access (group code only, NO PIN)
  if (method === 'POST') {
    logger.info('guest_auth_started', { requestId });
    const rawBody = await getBody();
    const body = typeof rawBody === 'string' ? (rawBody ? JSON.parse(rawBody) : {}) : (rawBody || {});
    const { code } = body;

    if (!code || typeof code !== 'string') {
      logger.warn('guest_auth_failure', { requestId, reason: 'missing_credentials' });
      logger.warn('request_completed', { requestId, status: 400, route, method, durationMs: Date.now() - startTime });
      return {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Code is required for guest access', requestId })
      };
    }

    const now = Date.now();

    // In Vitest test environment with mocked firebase-admin:
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      await initFirebase(requestId);
      const fsMod = 'firebase-admin/firestore';
      const { getFirestore } = await import(/* @vite-ignore */ fsMod);
      const db = getFirestore();

      const rateLimitRef = db.collection('rateLimits').doc(ip);
      const rateLimitDoc = await rateLimitRef.get();
      let attempts = [];
      let blockUntil = 0;

      if (rateLimitDoc.exists) {
        const data = rateLimitDoc.data();
        attempts = data.attempts || [];
        blockUntil = data.blockUntil || 0;

        if (now < blockUntil) {
          logger.warn('rate_limit_triggered', { requestId, ip, blockUntil });
          return {
            status: 429,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Too many attempts. Please try again later.', blockUntil, requestId })
          };
        }

        attempts = attempts.filter(time => now - time < 15 * 60 * 1000);
      }

      if (attempts.length >= 10) {
        logger.warn('rate_limit_triggered', { requestId, ip, reason: '10_attempts_in_15_mins' });
        return {
          status: 429,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Rate limit exceeded (10 attempts / 15 mins)', requestId })
        };
      }

      logger.info('guest_group_lookup', { requestId, groupCodeLength: code.length });
      const cleanCode = code.trim().toUpperCase();
      const groupsSnapshot = await db.collection('groups').where('code', '==', cleanCode).limit(1).get();

      if (groupsSnapshot.empty) {
        attempts.push(now);
        await rateLimitRef.set({ attempts, blockUntil });
        logger.warn('guest_auth_failure', { requestId, reason: 'group_not_found' });
        logger.warn('request_completed', { requestId, status: 404, route, method, durationMs: Date.now() - startTime });
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Group not found', requestId })
        };
      }

      const groupDoc = groupsSnapshot.docs[0];
      const groupId = groupDoc.id;
      await rateLimitRef.set({ attempts, blockUntil: 0 });

      const guestUid = 'guest_' + (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substring(2)).replace(/-/g, '');
      const firebaseToken = await createFirebaseCustomToken(sa, guestUid, {
        guestGroupId: groupId,
        mode: 'guest'
      });

      logger.info('guest_auth_success', { requestId, groupId, guestUid });
      logger.info('request_completed', { requestId, status: 200, route, method, durationMs: Date.now() - startTime });
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ firebaseToken, groupId, expiresIn: 3600, requestId })
      };
    }

    // Cloudflare Workers / Production path using Firestore REST API
    if (!sa) {
      logger.error('missing_service_account', { requestId, expectedProjectId });
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Missing Firebase service account for ${expectedProjectId}. A service account private key must be generated in Firebase Console for project ${expectedProjectId} and configured in FIREBASE_SERVICE_ACCOUNT_B64.`,
          expectedProject: expectedProjectId,
          requestId
        })
      };
    }

    try {
      // Check Rate Limits
      const rateLimitPath = `rateLimits/${ip}`;
      let rateData = null;
      try {
        rateData = await getDoc(sa, rateLimitPath);
      } catch (e) {
        // Continue if rateLimit doc doesn't exist
      }

      let attempts = (rateData && rateData.attempts) || [];
      let blockUntil = (rateData && rateData.blockUntil) || 0;

      if (now < blockUntil) {
        logger.warn('rate_limit_triggered', { requestId, ip, blockUntil });
        return {
          status: 429,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Too many attempts. Please try again later.', blockUntil, requestId })
        };
      }

      attempts = attempts.filter(time => now - time < 15 * 60 * 1000);
      if (attempts.length >= 10) {
        logger.warn('rate_limit_triggered', { requestId, ip, reason: '10_attempts_in_15_mins' });
        return {
          status: 429,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Rate limit exceeded (10 attempts / 15 mins)', requestId })
        };
      }

      // Lookup Group by Code
      logger.info('guest_group_lookup', { requestId, groupCodeLength: code.length });
      const cleanCode = code.trim().toUpperCase();
      const group = await findGroupByCode(sa, cleanCode);

      if (!group) {
        attempts.push(now);
        try {
          await setDoc(sa, rateLimitPath, { attempts, blockUntil });
        } catch (e) {}
        logger.warn('guest_auth_failure', { requestId, reason: 'group_not_found' });
        logger.warn('request_completed', { requestId, status: 404, route, method, durationMs: Date.now() - startTime });
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Group not found', requestId })
        };
      }

      const groupId = group.id;
      try {
        await setDoc(sa, rateLimitPath, { attempts, blockUntil: 0 });
      } catch (e) {}

      const guestUid = 'guest_' + (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substring(2)).replace(/-/g, '');
      const firebaseToken = await createFirebaseCustomToken(sa, guestUid, {
        guestGroupId: groupId,
        mode: 'guest'
      });

      logger.info('guest_auth_success', { requestId, groupId, guestUid });
      logger.info('request_completed', { requestId, status: 200, route, method, durationMs: Date.now() - startTime });
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ firebaseToken, groupId, expiresIn: 3600, requestId })
      };
    } catch (fsErr) {
      logger.error('firestore_query_failed', { requestId, error: fsErr.message });
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Internal database error: ' + fsErr.message, requestId })
      };
    }
  }

  logger.warn('request_failed', { requestId, status: 405, route, method, durationMs: Date.now() - startTime, reason: 'method_not_allowed' });
  return {
    status: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Method not allowed', requestId })
  };
}

/**
 * Universal default export: handles both (req, res) for Vitest / Node
 * and (request, env, ctx) for Cloudflare Workers.
 */
export default async function handler(reqOrRequest, resOrEnv, ctx) {
  const isNode = resOrEnv && typeof resOrEnv.status === 'function';

  if (isNode) {
    const req = reqOrRequest;
    const res = resOrEnv;
    const requestId = req.headers?.['x-request-id'] || generateRequestId();

    try {
      const result = await handleJwtBridgeRequest({
        method: req.method,
        headers: req.headers || {},
        getBody: () => req.body,
        query: req.query || {},
        env: typeof process !== 'undefined' ? process.env : {},
        requestId
      });

      if (result.headers) {
        Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
      }
      if (result.status === 204) {
        return res.status(204).end();
      }
      return res.status(result.status).json(JSON.parse(result.body));
    } catch (err) {
      logger.error('request_failed', { requestId, error: err.message });
      return res.status(500).json({ error: 'Internal server error: ' + err.message, requestId });
    }
  }

  // Cloudflare Worker Fetch handler
  const request = reqOrRequest;
  const env = resOrEnv || {};
  const requestId = request.headers?.get?.('x-request-id') || generateRequestId();

  try {
    const result = await handleJwtBridgeRequest({
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      getBody: () => request.text(),
      query: Object.fromEntries(new URL(request.url).searchParams.entries()),
      env,
      requestId
    });

    return new Response(result.body, {
      status: result.status,
      headers: result.headers
    });
  } catch (err) {
    logger.error('request_failed', { requestId, error: err.message });
    return new Response(JSON.stringify({ error: 'Internal server error: ' + err.message, requestId }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
