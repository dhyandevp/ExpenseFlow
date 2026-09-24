/**
 * POST /api/join-group
 * Server-side group join: verifies Clerk token, looks up group by code,
 * adds user UID to memberUserIds, returns group data.
 *
 * Solves chicken-and-egg: after Firestore rules tighten to check memberUserIds,
 * a new Clerk user can't read a group to join it client-side.
 *
 * Importers: worker.js routes /api/join-group here.
 * Data schema: Request body { code: string }. Response { groupId, group }.
 */
import { verifyToken } from '@clerk/backend';
import { logger, generateRequestId } from './_lib/logger.js';
import { getCorsHeaders } from './_lib/cors.js';
import {
  parseServiceAccount,
  findGroupByCode,
  addMemberUserId
} from './_lib/firebase-rest.js';

const CODE_RE = /^[A-Z0-9]{4,8}$/;

export default async function handler(request, env, ctx) {
  const requestId = request.headers?.get?.('x-request-id') || generateRequestId();
  const corsHeaders = {
    ...getCorsHeaders(request.headers.get('Origin')),
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', requestId }), {
      status: 405, headers: corsHeaders
    });
  }

  try {
    // Verify Clerk token
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization', requestId }), {
        status: 401, headers: corsHeaders
      });
    }

    const token = authHeader.slice(7).trim();
    const clerkSecret = env?.CLERK_SECRET_KEY;
    let clerkUserId;

    try {
      const payload = await verifyToken(token, { secretKey: clerkSecret });
      clerkUserId = payload.sub;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid Clerk token', requestId }), {
        status: 401, headers: corsHeaders
      });
    }

    // Parse body
    const body = await request.json().catch(() => ({}));
    const code = (body.code || '').trim().toUpperCase();

    if (!CODE_RE.test(code)) {
      return new Response(JSON.stringify({ error: 'Invalid group code format', requestId }), {
        status: 400, headers: corsHeaders
      });
    }

    // Lookup group by code (server-side, bypasses Firestore rules)
    const saB64 = env?.FIREBASE_SERVICE_ACCOUNT_B64;
    const sa = parseServiceAccount(saB64);
    if (!sa) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 not configured');
    }

    const group = await findGroupByCode(sa, code);
    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found', requestId }), {
        status: 404, headers: corsHeaders
      });
    }

    // Add user to memberUserIds (idempotent — appendMissingElements won't duplicate)
    await addMemberUserId(sa, group.id, clerkUserId);

    logger.info('user_joined_group', { requestId, groupId: group.id, clerkUserId });

    return new Response(JSON.stringify({
      groupId: group.id,
      group: { id: group.id, name: group.name, code: group.code, currency: group.currency },
      requestId
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    logger.error('join_group_failed', { requestId, error: err.message });
    return new Response(JSON.stringify({ error: 'Internal server error', requestId }), {
      status: 500, headers: corsHeaders
    });
  }
}
