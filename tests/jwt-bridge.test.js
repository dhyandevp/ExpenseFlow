import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  cert: vi.fn(),
  getApps: vi.fn(() => []),
}));

const mockCreateCustomToken = vi.fn();
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    createCustomToken: mockCreateCustomToken,
  })),
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

vi.mock('@clerk/clerk-sdk-node', () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from '@clerk/clerk-sdk-node';
import { handler as vercelHandler } from '../api/auth/jwt-bridge.js';

// Adapter: convert Netlify-style event to Vercel (req, res) and return Netlify-style response
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
    process.env.FIREBASE_SERVICE_ACCOUNT_B64 = Buffer.from(JSON.stringify({ project_id: 'test' })).toString('base64');
    
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ get: mockGet });
  });

  it('Mode A: Successfully exchanges Clerk token for Firebase token', async () => {
    verifyToken.mockResolvedValueOnce({ sub: 'user_123' });
    mockCreateCustomToken.mockResolvedValueOnce('firebase_custom_token');

    const event = {
      httpMethod: 'POST',
      headers: {
        authorization: 'Bearer clerk_token_here',
      },
    };

    const response = await handler(event, {});
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).firebaseToken).toBe('firebase_custom_token');
    expect(verifyToken).toHaveBeenCalledWith('clerk_token_here', expect.any(Object));
    expect(mockCreateCustomToken).toHaveBeenCalledWith('user_123', { mode: 'clerk' });
  });

  it('Mode B: Successfully authenticates guest and issues scoped token', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ code: 'ABCDEF', pinHash: 'hash123' }),
    };

    mockDocGet.mockResolvedValueOnce({ exists: false }); // No rate limit doc yet
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        { id: 'group_456', data: () => ({ pinHash: 'hash123' }) }
      ]
    });
    mockCreateCustomToken.mockResolvedValueOnce('guest_firebase_token');

    const response = await handler(event, {});
    
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.firebaseToken).toBe('guest_firebase_token');
    expect(body.groupId).toBe('group_456');
    expect(mockCreateCustomToken).toHaveBeenCalledWith(expect.stringContaining('guest_'), { guestGroupId: 'group_456', mode: 'guest' });
  });

  it('Mode B: Rejects invalid PIN and updates rate limit', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ code: 'ABCDEF', pinHash: 'wronghash' }),
    };

    mockDocGet.mockResolvedValueOnce({ 
      exists: true, 
      data: () => ({ attempts: [], consecutiveFailures: 0, blockUntil: 0 }) 
    });
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        { id: 'group_456', data: () => ({ pinHash: 'hash123' }) }
      ]
    });

    const response = await handler(event, {});
    
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Incorrect PIN');
    expect(mockDocSet).toHaveBeenCalledWith(expect.objectContaining({
      consecutiveFailures: 1
    }));
  });

  it('Mode B: Blocks IP after 3 consecutive failed PIN attempts', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ code: 'ABCDEF', pinHash: 'wronghash' }),
    };

    mockDocGet.mockResolvedValueOnce({ 
      exists: true, 
      data: () => ({ attempts: [Date.now(), Date.now()], consecutiveFailures: 2, blockUntil: 0 }) 
    });
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        { id: 'group_456', data: () => ({ pinHash: 'hash123' }) }
      ]
    });

    const response = await handler(event, {});
    
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.blockUntil).toBeGreaterThan(Date.now()); // blocked
    expect(mockDocSet).toHaveBeenCalledWith(expect.objectContaining({
      consecutiveFailures: 3,
      blockUntil: expect.any(Number)
    }));
  });

  it('Mode B: Rejects request if IP is blocked', async () => {
    const event = {
      httpMethod: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({ code: 'ABCDEF', pinHash: 'hash123' }),
    };

    mockDocGet.mockResolvedValueOnce({ 
      exists: true, 
      data: () => ({ attempts: [], consecutiveFailures: 3, blockUntil: Date.now() + 10000 }) 
    });

    const response = await handler(event, {});
    
    expect(response.statusCode).toBe(429);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('Too many attempts');
  });
});
