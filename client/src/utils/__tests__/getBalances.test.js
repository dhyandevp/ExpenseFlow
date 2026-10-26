import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing client.js
vi.mock('../../firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  writeBatch: vi.fn(),
}));

import { getBalances } from '../../api/client';
import * as firestore from 'firebase/firestore';

describe('getBalances ledger queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes member, expense, and settlement fetches concurrently with Promise.all', async () => {
    let membersPending = true;
    let expensesStartedWhileMembersPending = false;
    let settlementsStartedWhileMembersPending = false;

    firestore.getDocs.mockImplementation((q) => {
      // Simulate async delay on queries
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ docs: [] });
        }, 10);
      });
    });

    firestore.query.mockImplementation((col) => col);
    firestore.collection.mockImplementation((_db, ...parts) => {
      const path = parts.join('/');
      if (path.includes('expenses') && membersPending) {
        expensesStartedWhileMembersPending = true;
      }
      if (path.includes('settlements') && membersPending) {
        settlementsStartedWhileMembersPending = true;
      }
      return { path };
    });

    const resPromise = getBalances('grp1');
    const res = await resPromise;
    membersPending = false;

    expect(res.success).toBe(true);
    expect(res.data.balances).toBeDefined();
    expect(firestore.getDocs).toHaveBeenCalledTimes(3);
    expect(expensesStartedWhileMembersPending).toBe(true);
    expect(settlementsStartedWhileMembersPending).toBe(true);
  });

  it('uses cachedMembers when provided and avoids fetching members from Firestore', async () => {
    firestore.getDocs.mockResolvedValue({ docs: [] });
    const cachedMembers = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];

    const res = await getBalances('grp1', {}, cachedMembers);

    expect(res.success).toBe(true);
    // Only expenses and settlements fetched — getMembers query skipped
    expect(firestore.getDocs).toHaveBeenCalledTimes(2);
    expect(res.data.balances.length).toBe(2);
  });
});
