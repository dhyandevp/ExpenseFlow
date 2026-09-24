import { verifyToken } from '@clerk/backend';
import { logger, generateRequestId } from '../_lib/logger.js';
import { parseServiceAccount, getDoc, setDoc } from '../_lib/firebase-rest.js';
import { getCorsHeaders } from '../_lib/cors.js';
import { validateReceiptPublicId, destroyCloudinaryAsset } from '../_lib/cloudinary.js';

const ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export async function handleDeleteReceiptRequest({ method, headers, body, env, requestId }) {
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

    const { groupId, expenseId, publicId } = body || {};
    if (!groupId || !ID_RE.test(groupId)) {
      return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Valid groupId is required', requestId }) };
    }

    const saB64 = env?.FIREBASE_SERVICE_ACCOUNT_B64 || (typeof process !== 'undefined' ? process.env?.FIREBASE_SERVICE_ACCOUNT_B64 : null);
    const sa = parseServiceAccount(saB64);
    if (!sa) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 not configured');
    }

    // 1. Verify group membership
    const groupDoc = await getDoc(sa, `groups/${groupId}`);
    if (!groupDoc) {
      return { status: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Group not found', requestId }) };
    }

    const isMember = groupDoc.createdBy === clerkUserId || (Array.isArray(groupDoc.memberUserIds) && groupDoc.memberUserIds.includes(clerkUserId));
    if (!isMember) {
      return { status: 403, headers: corsHeaders, body: JSON.stringify({ error: 'You are not a member of this group', requestId }) };
    }

    const cloudName = env?.CLOUDINARY_CLOUD_NAME || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_CLOUD_NAME : null);
    const apiKey = env?.CLOUDINARY_API_KEY || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_KEY : null);
    const apiSecret = env?.CLOUDINARY_API_SECRET || (typeof process !== 'undefined' ? process.env?.CLOUDINARY_API_SECRET : null);

    // Case 2: Unattached/orphaned upload cleanup (no expenseId, explicit publicId)
    if (!expenseId && publicId) {
      if (!validateReceiptPublicId(publicId, groupId)) {
        logger.error('unattached_public_id_invalid_for_group', { requestId, groupId, publicId });
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Receipt public ID is invalid for this group', requestId }) };
      }

      const destroyRes = await destroyCloudinaryAsset({
        cloudName,
        apiKey,
        apiSecret,
        publicId
      });

      if (!destroyRes.success) {
        logger.error('cloudinary_unattached_destroy_failed', { requestId, groupId, publicId, error: destroyRes.error });
        return { status: 502, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to delete receipt image', requestId }) };
      }

      logger.info('unattached_receipt_cleaned_up', { requestId, groupId, publicId });
      return { status: 200, headers: corsHeaders, body: JSON.stringify({ success: true, unattached: true, requestId }) };
    }

    // Case 1: Authoritative expense receipt deletion
    if (!expenseId || !ID_RE.test(expenseId)) {
      return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Valid expenseId is required', requestId }) };
    }

    const expenseDoc = await getDoc(sa, `groups/${groupId}/expenses/${expenseId}`);
    if (!expenseDoc) {
      return { status: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Expense not found', requestId }) };
    }

    const authoritativePublicId = expenseDoc.receiptPublicId;

    if (authoritativePublicId) {
      if (!validateReceiptPublicId(authoritativePublicId, groupId)) {
        logger.error('corrupted_receipt_public_id', { requestId, groupId, expenseId, authoritativePublicId });
        return { status: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Stored receipt public ID is invalid for this group', requestId }) };
      }

      const destroyRes = await destroyCloudinaryAsset({
        cloudName,
        apiKey,
        apiSecret,
        publicId: authoritativePublicId
      });

      if (!destroyRes.success) {
        // Generic client error: keep internal Cloudinary details strictly in server logs
        logger.error('cloudinary_receipt_destroy_failed', { requestId, groupId, expenseId, error: destroyRes.error });
        return { status: 502, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to delete receipt image', requestId }) };
      }
    }

    // Clear Firestore receipt fields
    await setDoc(sa, `groups/${groupId}/expenses/${expenseId}`, {
      receiptUrl: null,
      receiptPublicId: null,
      receiptAssetId: null
    }, { merge: true });

    logger.info('receipt_deleted_successfully', { requestId, groupId, expenseId });
    return { status: 200, headers: corsHeaders, body: JSON.stringify({ success: true, requestId }) };
  } catch (error) {
    logger.error('delete_receipt_failed', { requestId, error });
    return { status: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error', requestId }) };
  }
}

export default async function handler(reqOrRequest, resOrEnv, ctx) {
  const isNode = resOrEnv && typeof resOrEnv.status === 'function';
  if (isNode) {
    const req = reqOrRequest;
    const res = resOrEnv;
    const requestId = req.headers?.['x-request-id'] || generateRequestId();
    const result = await handleDeleteReceiptRequest({
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

  const result = await handleDeleteReceiptRequest({
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
