import { getFirestore } from 'firebase-admin/firestore';
import { initFirebase } from './auth/jwt-bridge.js';
import logger from './_lib/logger.js';
import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Math.random().toString(36).substr(2, 9)}`;

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    return res.status(204).end();
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  };

  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initFirebase(requestId);
    const db = getFirestore();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    let clerkUserId;
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      clerkUserId = payload.sub;
    } catch (error) {
      logger.error('clerk_verification_failed', { requestId, error });
      return res.status(401).json({ error: 'Invalid Clerk token' });
    }

    const { groupId } = req.query;
    if (!groupId) {
      return res.status(400).json({ error: 'groupId is required' });
    }

    const groupRef = db.collection('groups').doc(groupId);
    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Use Admin SDK recursive delete to safely remove the group and all its subcollections
    await db.recursiveDelete(groupRef);

    logger.info('group_deleted_successfully', { requestId, groupId, clerkUserId, durationMs: Date.now() - startTime });
    return res.status(200).json({ success: true });

  } catch (error) {
    logger.error('group_deletion_failed', { requestId, error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
