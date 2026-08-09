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

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    initFirebase();
    const db = getFirestore();
    const auth = getAuth();
    const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown-ip';

    // Mode A: Authenticated user (Clerk)
    const authHeader = event.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        const clerkUserId = payload.sub;

        // Generate Firebase Custom Token
        const firebaseToken = await auth.createCustomToken(clerkUserId, { mode: 'clerk' });
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ firebaseToken }),
        };
      } catch (error) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid Clerk token' }),
        };
      }
    }

    // Mode B: Guest Access (code + pinHash)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { code, pinHash } = body;

      if (!code || !pinHash) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Code and pinHash are required for guest access' }),
        };
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
          return {
            statusCode: 429,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: 'Too many attempts. Please try again later.',
              blockUntil
            }),
          };
        }

        // Clean up attempts older than 15 minutes
        attempts = attempts.filter(time => now - time < 15 * 60 * 1000);
      }

      if (attempts.length >= 10) {
        return {
          statusCode: 429,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Rate limit exceeded (10 attempts / 15 mins)' }),
        };
      }

      // Lookup Group
      const groupsSnapshot = await db.collection('groups').where('code', '==', code).limit(1).get();
      
      if (groupsSnapshot.empty) {
        // Record failure
        attempts.push(now);
        await rateLimitRef.set({ attempts, consecutiveFailures, blockUntil });
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Group not found' }),
        };
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

        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Incorrect PIN',
            remainingAttempts: Math.max(0, 3 - consecutiveFailures),
            blockUntil
          }),
        };
      }

      // Success! Reset failures
      await rateLimitRef.set({ attempts, consecutiveFailures: 0, blockUntil: 0 });

      // Create Custom Token for Guest
      const guestUid = 'guest_' + crypto.randomUUID().replace(/-/g, '');
      const firebaseToken = await auth.createCustomToken(guestUid, { 
        guestGroupId: groupId, 
        mode: 'guest' 
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          firebaseToken,
          groupId,
          expiresIn: 3600 // 1 hour token
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error in jwt-bridge:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
