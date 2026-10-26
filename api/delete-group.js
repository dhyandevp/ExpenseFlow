import { verifyToken } from '@clerk/backend';
import { logger, generateRequestId } from './_lib/logger.js';
import { parseServiceAccount, getDoc, listCollectionDocs, fromFirestoreDoc, recursiveDeleteGroup } from './_lib/firebase-rest.js';
import { destroyCloudinaryAsset } from './_lib/cloudinary.js';
import { getCorsHeaders } from './_lib/cors.js';

// ponytail: groupId format — alphanumeric + hyphens, up to 128 chars. Tighten if Firestore auto-IDs are always 20 chars.
const GROUP_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export async function handleDeleteGroupRequest({ method, headers, query, env, requestId }) {
  const startTime = Date.now();

  const corsHeaders = {
    ...getCorsHeaders(headers.origin),
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
    if (!groupId || !GROUP_ID_RE.test(groupId)) {
      return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'groupId is required and must be alphanumeric', requestId }) };
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

    // Ownership check: only the creator can delete
    if (groupDoc.createdBy && groupDoc.createdBy !== clerkUserId) {
      return { status: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Only the group owner can delete this group', requestId }) };
    }

    // Cascade delete exact Cloudinary assets belonging to this group
    const expenses = await listCollectionDocs(sa, `groups/${groupId}/expenses`);
    const cloudName = env?.CLOUDINARY_CLOUD_NAME || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_CLOUD_NAME : null);
    const apiKey = env?.CLOUDINARY_API_KEY || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_KEY : null);
    const apiSecret = env?.CLOUDINARY_API_SECRET || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_SECRET : null);

    if (Array.isArray(expenses)) {
      for (const exp of expenses) {
        const parsed = fromFirestoreDoc(exp);
        const publicId = parsed?.receiptPublicId;
        if (publicId && publicId.startsWith(`expenseflow/groups/${groupId}/receipts/`)) {
          const destroyRes = await destroyCloudinaryAsset({ cloudName, apiKey, apiSecret, publicId });
          if (!destroyRes.success) {
            logger.error('group_receipt_cleanup_failed', { requestId, groupId, publicId, error: destroyRes.error });
            return {
              status: 502,
              headers: corsHeaders,
              body: JSON.stringify({ error: 'Failed to delete receipt image from Cloudinary', details: destroyRes.error, requestId })
            };
          }
        }
      }
    }

    await recursiveDeleteGroup(sa, groupId);

    logger.info('group_deleted_successfully', { requestId, groupId, clerkUserId, durationMs: Date.now() - startTime });
    return { status: 200, headers: corsHeaders, body: JSON.stringify({ success: true, requestId }) };

  } catch (error) {
    logger.error('group_deletion_failed', { requestId, error });
    return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error', requestId }) };
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
