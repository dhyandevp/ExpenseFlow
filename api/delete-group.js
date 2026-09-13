import { verifyToken } from '@clerk/backend';
import { logger, generateRequestId } from './_lib/logger.js';
import { parseServiceAccount, getDoc, recursiveDeleteGroup } from './_lib/firebase-rest.js';

export async function handleDeleteGroupRequest({ method, headers, query, env, requestId }) {
  const startTime = Date.now();
  const route = '/api/delete-group';

  const origin = headers.origin || headers.referer || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-request-id',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders, body: '' };
  }

  if (method !== 'DELETE') {
    return { status: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed', requestId }) };
  }

  try {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Missing or invalid authorization header', requestId }) };
    }

    const token = authHeader.split('Bearer ')[1]?.trim() || authHeader.split(' ')[1]?.trim();
    const clerkSecret = env?.CLERK_SECRET_KEY || (typeof process !== 'undefined' ? process.env?.CLERK_SECRET_KEY : null);

    let clerkUserId;
    try {
      const payload = await verifyToken(token, {
        secretKey: clerkSecret,
      });
      clerkUserId = payload.sub;
    } catch (error) {
      logger.error('clerk_verification_failed', { requestId, error });
      return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid Clerk token', requestId }) };
    }

    const groupId = query.groupId;
    if (!groupId) {
      return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'groupId is required', requestId }) };
    }

    // Vitest test environment with mocked firebase-admin
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      const fsMod = 'firebase-admin/firestore';
      const { getFirestore } = await import(/* @vite-ignore */ fsMod);
      const db = getFirestore();
      const groupRef = db.collection('groups').doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        return { status: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Group not found', requestId }) };
      }

      await db.recursiveDelete(groupRef);
      logger.info('group_deleted_successfully', { requestId, groupId, clerkUserId, durationMs: Date.now() - startTime });
      return { status: 200, headers: corsHeaders, body: JSON.stringify({ success: true, requestId }) };
    }

    // Cloudflare Workers / Production path using Firestore REST API
    const saB64 = env?.FIREBASE_SERVICE_ACCOUNT_B64 || (typeof process !== 'undefined' ? process.env?.FIREBASE_SERVICE_ACCOUNT_B64 : null);
    const sa = parseServiceAccount(saB64);

    if (!sa) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 not configured');
    }

    const groupDoc = await getDoc(sa, `groups/${groupId}`);
    if (!groupDoc) {
      return { status: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Group not found', requestId }) };
    }

    await recursiveDeleteGroup(sa, groupId);

    logger.info('group_deleted_successfully', { requestId, groupId, clerkUserId, durationMs: Date.now() - startTime });
    return { status: 200, headers: corsHeaders, body: JSON.stringify({ success: true, requestId }) };

  } catch (error) {
    logger.error('group_deletion_failed', { requestId, error });
    return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error: ' + error.message, requestId }) };
  }
}

export default async function handler(reqOrRequest, resOrEnv, ctx) {
  const isNode = resOrEnv && typeof resOrEnv.status === 'function';

  if (isNode) {
    const req = reqOrRequest;
    const res = resOrEnv;
    const requestId = req.headers?.['x-request-id'] || generateRequestId();

    const result = await handleDeleteGroupRequest({
      method: req.method,
      headers: req.headers || {},
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
  }

  // Cloudflare Worker Fetch handler
  const request = reqOrRequest;
  const env = resOrEnv || {};
  const requestId = request.headers?.get?.('x-request-id') || generateRequestId();
  const url = new URL(request.url);

  const result = await handleDeleteGroupRequest({
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    query: Object.fromEntries(url.searchParams.entries()),
    env,
    requestId
  });

  return new Response(result.body, {
    status: result.status,
    headers: result.headers
  });
}
