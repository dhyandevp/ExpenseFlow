import { verifyToken } from '@clerk/backend';
import { logger, generateRequestId } from '../_lib/logger.js';
import { parseServiceAccount, getDoc } from '../_lib/firebase-rest.js';
import { getCorsHeaders } from '../_lib/cors.js';
import { generateUploadSignature } from '../_lib/cloudinary.js';

const GROUP_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export async function handleSignUploadRequest({ method, headers, body, env, requestId }) {
  const corsHeaders = {
    ...getCorsHeaders(headers.origin),
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders, body: '' };
  }

  if (method !== 'POST') {
    return { status: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed', requestId }) };
  }

  try {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Missing or invalid authorization header', requestId }) };
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    const clerkSecret = env?.CLERK_SECRET_KEY || (typeof process !== 'undefined' ? process.env?.CLERK_SECRET_KEY : null);

    let clerkUserId;
    try {
      const payload = await verifyToken(token, { secretKey: clerkSecret });
      clerkUserId = payload.sub;
    } catch (error) {
      logger.error('clerk_verification_failed', { requestId, error });
      return { status: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid Clerk token', requestId }) };
    }

    const groupId = body?.groupId;
    if (!groupId || !GROUP_ID_RE.test(groupId)) {
      return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Valid groupId is required', requestId }) };
    }

    const cloudName = env?.CLOUDINARY_CLOUD_NAME || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_CLOUD_NAME : null);
    const apiKey = env?.CLOUDINARY_API_KEY || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_KEY : null);
    const apiSecret = env?.CLOUDINARY_API_SECRET || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_SECRET : null);

    if (!cloudName || !apiKey || !apiSecret) {
      logger.error('cloudinary_config_missing', { requestId });
      return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Cloudinary server configuration missing', requestId }) };
    }

    // Verify group membership in Firestore
    const saB64 = env?.FIREBASE_SERVICE_ACCOUNT_B64 || (typeof process !== 'undefined' ? process.env?.FIREBASE_SERVICE_ACCOUNT_B64 : null);
    const sa = parseServiceAccount(saB64);
    if (!sa) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 not configured');
    }

    const groupDoc = await getDoc(sa, `groups/${groupId}`);
    if (!groupDoc) {
      return { status: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Group not found', requestId }) };
    }

    const isMember = groupDoc.createdBy === clerkUserId || (Array.isArray(groupDoc.memberUserIds) && groupDoc.memberUserIds.includes(clerkUserId));
    if (!isMember) {
      return { status: 403, headers: corsHeaders, body: JSON.stringify({ error: 'You are not a member of this group', requestId }) };
    }

    // Authoritative folder assignment: client cannot override
    const folder = `expenseflow/groups/${groupId}/receipts`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateUploadSignature({ folder, timestamp, apiSecret });

    return {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder
      })
    };
  } catch (error) {
    logger.error('sign_upload_failed', { requestId, error });
    return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error', requestId }) };
  }
}

export default async function handler(reqOrRequest, resOrEnv, ctx) {
  const isNode = resOrEnv && typeof resOrEnv.status === 'function';
  if (isNode) {
    const req = reqOrRequest;
    const res = resOrEnv;
    const requestId = req.headers?.['x-request-id'] || generateRequestId();
    const result = await handleSignUploadRequest({
      method: req.method,
      headers: req.headers || {},
      body: req.body || {},
      env: typeof process !== 'undefined' ? process.env : {},
      requestId
    });
    if (result.headers) {
      Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v));
    }
    if (result.status === 204) return res.status(204).end();
    return res.status(result.status).json(JSON.parse(result.body));
  }

  // Cloudflare Worker Fetch handler
  const request = reqOrRequest;
  const env = resOrEnv || {};
  const requestId = request.headers?.get?.('x-request-id') || generateRequestId();
  let body = {};
  if (request.method !== 'GET' && request.method !== 'OPTIONS') {
    try {
      body = await request.json();
    } catch {}
  }

  const result = await handleSignUploadRequest({
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    env,
    requestId
  });

  return new Response(result.body, {
    status: result.status,
    headers: result.headers
  });
}
