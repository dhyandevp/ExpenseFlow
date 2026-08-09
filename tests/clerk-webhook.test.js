import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  cert: vi.fn(),
  getApps: vi.fn(() => []),
}));

const mockDocSet = vi.fn();
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn((collName) => {
      if (collName === 'users') {
        return {
          doc: vi.fn(() => ({
            set: mockDocSet,
          })),
        };
      }
    }),
  })),
}));

// Mock Svix
const mockVerify = vi.fn();
vi.mock('svix', () => {
  return {
    Webhook: class {
      verify(payload, headers) {
        return mockVerify(payload, headers);
      }
    }
  };
});

import { handler } from '../netlify/functions/clerk-webhook.js';

describe('clerk-webhook function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIREBASE_SERVICE_ACCOUNT_B64 = Buffer.from(JSON.stringify({ project_id: 'test' })).toString('base64');
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test123';
  });

  it('Rejects non-POST requests', async () => {
    const event = { httpMethod: 'GET' };
    const response = await handler(event, {});
    expect(response.statusCode).toBe(405);
  });

  it('Rejects requests missing svix headers', async () => {
    const event = { 
      httpMethod: 'POST',
      headers: {},
      body: '{}'
    };
    const response = await handler(event, {});
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Missing svix headers');
  });

  it('Rejects requests with invalid svix signature', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const event = { 
      httpMethod: 'POST',
      headers: {
        'svix-id': 'msg_123',
        'svix-timestamp': '1614556800',
        'svix-signature': 'v1,invalid_sig',
      },
      body: '{}'
    };

    const response = await handler(event, {});
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('Error verifying webhook');
  });

  it('Processes user.created event and saves to Firestore', async () => {
    mockVerify.mockReturnValue({
      type: 'user.created',
      data: {
        id: 'user_2Nne',
        first_name: 'John',
        last_name: 'Doe',
        primary_email_address_id: 'idn_1',
        email_addresses: [
          { id: 'idn_1', email_address: 'john@example.com' }
        ]
      }
    });
    mockDocSet.mockResolvedValueOnce();

    const event = { 
      httpMethod: 'POST',
      headers: {
        'svix-id': 'msg_123',
        'svix-timestamp': '1614556800',
        'svix-signature': 'v1,valid_sig',
      },
      body: '{"type":"user.created","data":{"id":"user_2Nne"}}'
    };

    const response = await handler(event, {});
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe('User created in Firestore');
    
    expect(mockDocSet).toHaveBeenCalledWith(expect.objectContaining({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: expect.any(String)
    }));
  });

  it('Ignores unhandled event types', async () => {
    mockVerify.mockReturnValue({
      type: 'user.updated',
      data: { id: 'user_2Nne' }
    });

    const event = { 
      httpMethod: 'POST',
      headers: {
        'svix-id': 'msg_123',
        'svix-timestamp': '1614556800',
        'svix-signature': 'v1,valid_sig',
      },
      body: '{"type":"user.updated"}'
    };

    const response = await handler(event, {});
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe('Webhook received but event type not handled');
    expect(mockDocSet).not.toHaveBeenCalled();
  });
});
