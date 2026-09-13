import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Generate a dummy RSA private key for testing JWT signing
const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Mock dependencies before importing the module
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  cert: vi.fn(),
  getApps: vi.fn(() => []),
}));

const mockDocGet = vi.fn();
const mockDocSet = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockGet = vi.fn();

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn((collName) => {
      if (collName === 'rateLimits') {
        return {
          doc: vi.fn(() => ({
            get: mockDocGet,
            set: mockDocSet,
          })),
        };
      }
      if (collName === 'groups') {
        return {
          where: mockWhere,
        };
      }
    }),
  })),
  FieldValue: {},
}));

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from '@clerk/backend';
import vercelHandler from '../api/auth/jwt-bridge.js';

function handler(event) {
  return new Promise((resolve) => {
    const req = {
      method: event.httpMethod,
      headers: event.headers || {},
      body: event.body ? JSON.parse(event.body) : undefined,
    };
    const _headers = {};
    const res = {
      setHeader(k, v) { _headers[k] = v; },
      status(code) {
        return {
          json(data) { resolve({ statusCode: code, headers: _headers, body: JSON.stringify(data) }); },
          end() { resolve({ statusCode: code, headers: _headers, body: '' }); },
        };
      },
    };
    vercelHandler(req, res);
  });
}

describe('jwt-bridge function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIREBASE_SERVICE_ACCOUNT_B64 = Buffer.from(JSON.stringify({ 
      project_id: 'test',
      client_email: 'test@example.com',
      private_key: privateKey
    })).toString('base64');
    process.env.CLERK_SECRET_KEY = 'sk_test_mock';
    
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ get: mockGet });
  });

  it('Mode A: Successfully exchanges Clerk token for Firebase token', async () => {
    verifyToken.mockResolvedValueOnce({ sub: 'user_123' });

    const event = {
      httpMethod: 'POST',
      headers: {
        authorization: 'Bearer clerk_token_here',
      },
    };

    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.firebaseToken).toBeDefined();
    expect(typeof body.firebaseToken).toBe('string');
    expect(verifyToken).toHaveBeenCalledWith('clerk_token_here', { secretKey: 'sk_test_mock' });
  });

  it('Mode B: Successfully authenticates guest with group code only (no PIN)', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ code: 'ABCDEF' }),
    };

    mockDocGet.mockResolvedValueOnce({ exists: false }); // No rate limit doc yet
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        { id: 'group_456', data: () => ({ name: 'Test Group' }) }
      ]
    });

    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.firebaseToken).toBeDefined();
    expect(body.groupId).toBe('group_456');
    expect(mockWhere).toHaveBeenCalledWith('code', '==', 'ABCDEF');
  });

  it('Mode B: Rejects request if code is missing', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({}),
    };

    const response = await handler(event);
    
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Code is required for guest access');
  });

  it('Mode B: Returns 404 when group is not found', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ code: 'NOTFOUND' }),
    };

    mockDocGet.mockResolvedValueOnce({ exists: false });
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] });

    const response = await handler(event);
    
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Group not found');
  });

  it('Mode B: Rejects request if IP is blocked by rate limiting', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ code: 'ABCDEF' }),
    };

    mockDocGet.mockResolvedValueOnce({ 
      exists: true, 
      data: () => ({ attempts: [], blockUntil: Date.now() + 10000 }) 
    });

    const response = await handler(event);
    
    expect(response.statusCode).toBe(429);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Too many attempts');
  });
});
