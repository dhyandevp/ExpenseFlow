import { describe, it, expect } from 'vitest';
import { calculateFairnessScore, calculateBalances, csvSafe } from '../../../../shared/balanceMath';

describe('balanceMath.js', () => {
  describe('calculateFairnessScore', () => {
    it('returns 100 for equal contributions', () => {
      const members = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const expenses = [
        { paid_by: 1, amount: 100 },
        { paid_by: 2, amount: 100 }
      ];
      const result = calculateFairnessScore(members, expenses);
      
      expect(result.group_score).toBe(100);
      expect(result.scores.length).toBe(2);
      expect(result.scores[0].score).toBe(100);
      expect(result.scores[1].score).toBe(100);
    });

    it('handles extreme disparity (one payer)', () => {
      const members = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const expenses = [
        { paid_by: 1, amount: 200 }
      ];
      // Total 200, equal share 100. 
      // Alice paid 200, diff 100, ratio 1. score = 100 - 50 = 50.
      // Bob paid 0, diff 100, ratio 1. score = 100 - 50 = 50.
      const result = calculateFairnessScore(members, expenses);
      
      expect(result.group_score).toBe(50);
      expect(result.scores[0].score).toBe(50);
      expect(result.scores[1].score).toBe(50);
    });

    it('handles no expenses boundary condition', () => {
      const members = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const result = calculateFairnessScore(members, []);
      
      expect(result.group_score).toBe(100); // Defaults to fair
      expect(result.scores[0].score).toBe(100);
    });
  });

  describe('calculateBalances', () => {
    it('calculates single expense correctly', () => {
      const members = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const expenses = [
        { paid_by: 1, amount: 100 }
      ];
      
      const { balances, total_expenses } = calculateBalances(members, expenses);
      
      expect(total_expenses).toBe(100);
      
      const alice = balances.find(b => b.member_id === 1);
      const bob = balances.find(b => b.member_id === 2);
      
      expect(alice.total_paid).toBe(100);
      expect(alice.total_share).toBe(50);
      expect(alice.net_balance).toBe(50);
      
      expect(bob.total_paid).toBe(0);
      expect(bob.total_share).toBe(50);
      expect(bob.net_balance).toBe(-50);
    });

    it('calculates multiple expenses and ensures net balances sum to zero', () => {
      const members = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ];
      const expenses = [
        { paid_by: 1, amount: 90 },
        { paid_by: 2, amount: 30 }
      ];
      // Total 120. Fair share 40.
      // Alice paid 90, net +50
      // Bob paid 30, net -10
      // Charlie paid 0, net -40
      
      const { balances } = calculateBalances(members, expenses);
      
      const netSum = balances.reduce((sum, b) => sum + b.net_balance, 0);
      expect(netSum).toBe(0);
      
      const charlie = balances.find(b => b.member_id === 3);
      expect(charlie.net_balance).toBe(-40);
    });

    it('incorporates settlements correctly', () => {
      const members = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const expenses = [
        { paid_by: 1, amount: 100 }
      ];
      const settlements = [
        { from_member: 2, to_member: 1, amount: 50 }
      ];
      // Bob owes Alice 50. Settlement pays it. Net balance should be 0.
      
      const { balances } = calculateBalances(members, expenses, settlements);
      
      expect(balances[0].net_balance).toBe(0);
      expect(balances[1].net_balance).toBe(0);
    });
  });

  describe('csvSafe', () => {
    it('prefixes dangerous characters with single quote', () => {
      expect(csvSafe('=SUM(A1:B1)')).toBe("'=SUM(A1:B1)");
      expect(csvSafe('+12345')).toBe("'+12345");
      expect(csvSafe('-100')).toBe("'-100");
      expect(csvSafe('@hack')).toBe("'@hack");
    });

    it('leaves normal strings unchanged', () => {
      expect(csvSafe('Hello World')).toBe('Hello World');
      expect(csvSafe('12345')).toBe('12345');
    });

    it('handles non-string types gracefully', () => {
      expect(csvSafe(100)).toBe(100);
      expect(csvSafe(null)).toBe(null);
      expect(csvSafe(undefined)).toBe(undefined);
    });
  });
});
