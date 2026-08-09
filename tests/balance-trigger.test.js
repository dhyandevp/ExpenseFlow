import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  cert: vi.fn(),
  getApps: vi.fn(() => []),
}));

const mockGroupUpdate = vi.fn();
const mockMembersGet = vi.fn();
const mockExpensesGet = vi.fn();
const mockSettlementsGet = vi.fn();
const mockGroupGet = vi.fn();

vi.mock('firebase-admin/firestore', () => {
  return {
    getFirestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: mockGroupGet,
          update: mockGroupUpdate,
          collection: vi.fn((sub) => {
            if (sub === 'members') return { get: mockMembersGet };
            if (sub === 'expenses') return { get: mockExpensesGet };
            if (sub === 'settlements') return { get: mockSettlementsGet };
          }),
        })),
      })),
    })),
    FieldValue: {
      serverTimestamp: vi.fn(() => 'mock_timestamp'),
    },
  };
});

vi.mock('../../shared/balanceMath.js', () => ({
  calculateBalances: vi.fn(() => ({
    balances: [{ net_balance: 10 }],
    settlement_suggestions: [{ amount: 10 }]
  })),
  calculateFairnessScore: vi.fn(() => 85),
}));

import { handler } from '../netlify/functions/balance-trigger.js';
import { calculateBalances, calculateFairnessScore } from '../../shared/balanceMath.js';

describe('balance-trigger function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIREBASE_SERVICE_ACCOUNT_B64 = Buffer.from(JSON.stringify({ project_id: 'test' })).toString('base64');
  });

  it('Rejects non-POST requests', async () => {
    const event = { httpMethod: 'GET' };
    const response = await handler(event, {});
    expect(response.statusCode).toBe(405);
  });

  it('Rejects request missing groupId', async () => {
    const event = { httpMethod: 'POST', body: '{}' };
    const response = await handler(event, {});
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('groupId is required');
  });

  it('Returns 404 if group does not exist', async () => {
    mockGroupGet.mockResolvedValueOnce({ exists: false });
    
    const event = { httpMethod: 'POST', body: '{"groupId":"grp1"}' };
    const response = await handler(event, {});
    
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Group not found');
  });

  it('Fetches subcollections, recalculates, and updates group', async () => {
    mockGroupGet.mockResolvedValueOnce({ exists: true });
    
    mockMembersGet.mockResolvedValueOnce({ docs: [{ id: 'm1', data: () => ({ name: 'A' }) }] });
    mockExpensesGet.mockResolvedValueOnce({ docs: [{ id: 'e1', data: () => ({ amount: 100 }) }] });
    mockSettlementsGet.mockResolvedValueOnce({ docs: [{ id: 's1', data: () => ({ amount: 50 }) }] });
    
    mockGroupUpdate.mockResolvedValueOnce();

    const event = { httpMethod: 'POST', body: '{"groupId":"grp1"}' };
    const response = await handler(event, {});
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe('Balances recalculated successfully');



    expect(mockGroupUpdate).toHaveBeenCalledWith({
      currentBalances: expect.any(Array),
      settlementSuggestions: expect.any(Array),
      fairnessScore: expect.anything(),
      lastCalculatedAt: 'mock_timestamp'
    });
  });
});
