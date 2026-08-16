import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyToken } from '@clerk/clerk-sdk-node';
import crypto from 'crypto';

// Initialize Firebase Admin
function initFirebase() {
  if (getApps().length === 0) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_B64 environment variable not set');
    } else {
      try {
        const serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
        );
        initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (err) {
        console.error('Failed to initialize Firebase Admin:', err);
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

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    initFirebase();
    const db = getFirestore();
    const auth = getAuth();
    const ip = req.headers['x-forwarded-for'] || req.headers['client-ip'] || 'unknown-ip';

    // Mode A: Authenticated user (Clerk)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        const clerkUserId = payload.sub;

        // Generate Firebase Custom Token
        const firebaseToken = await auth.createCustomToken(clerkUserId, { mode: 'clerk' });
        
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(200).json({ firebaseToken });
      } catch (error) {
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(401).json({ error: 'Invalid Clerk token' });
      }
    }

    // Mode B: Guest Access (code + pinHash)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { code, pinHash } = body;

      if (!code || !pinHash) {
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(400).json({ error: 'Code and pinHash are required for guest access' });
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
          Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
          return res.status(429).json({ 
            error: 'Too many attempts. Please try again later.',
            blockUntil
          });
        }

        // Clean up attempts older than 15 minutes
        attempts = attempts.filter(time => now - time < 15 * 60 * 1000);
      }

      if (attempts.length >= 10) {
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(429).json({ error: 'Rate limit exceeded (10 attempts / 15 mins)' });
      }

      // Lookup Group
      const groupsSnapshot = await db.collection('groups').where('code', '==', code).limit(1).get();
      
      if (groupsSnapshot.empty) {
        // Record failure
        attempts.push(now);
        await rateLimitRef.set({ attempts, consecutiveFailures, blockUntil });
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(404).json({ error: 'Group not found' });
      }

      const groupDoc = groupsSnapshot.docs[0];
      const groupData = groupDoc.data();
      const groupId = groupDoc.id;

      // Verify PIN
      const isValid = safeCompare(pinHash, groupData.pinHash);

      if (!isValid) {
        consecutiveFailures += 1;
        attempts.push(now);
        
        if (consecutiveFailures >= 3) {
          blockUntil = now + 60 * 60 * 1000; // block for 1 hour
        }

        await rateLimitRef.set({ attempts, consecutiveFailures, blockUntil });

        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(401).json({ 
          error: 'Incorrect PIN',
          remainingAttempts: Math.max(0, 3 - consecutiveFailures),
          blockUntil
        });
      }

      // Success! Reset failures
      await rateLimitRef.set({ attempts, consecutiveFailures: 0, blockUntil: 0 });

      // Create Custom Token for Guest
      const guestUid = 'guest_' + crypto.randomUUID().replace(/-/g, '');
      const firebaseToken = await auth.createCustomToken(guestUid, { 
        guestGroupId: groupId, 
        mode: 'guest' 
      });

      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(200).json({ 
        firebaseToken,
        groupId,
        expiresIn: 3600 // 1 hour token
      });
    }

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in jwt-bridge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;

// Named export for test compatibility
export { handler };
