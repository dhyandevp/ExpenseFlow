import { describe, it, expect } from 'vitest';
import { 
  calculateSettlement, 
  getFairnessColor, 
  getBalanceColor 
} from '../../../../shared/fairness';

describe('fairness.js', () => {
  describe('calculateSettlement', () => {
    it('handles 3-member case where one person paid for two others', () => {
      // Alice paid 150. Bob owes 50, Charlie owes 50.
      const balances = [
        { name: 'Alice', net_balance: 100 },
        { name: 'Bob', net_balance: -50 },
        { name: 'Charlie', net_balance: -50 }
      ];
      
      const settlements = calculateSettlement(balances);
      
      expect(settlements.length).toBe(2);
      expect(settlements).toEqual(expect.arrayContaining([
        { from: 'Bob', to: 'Alice', amount: 50 },
        { from: 'Charlie', to: 'Alice', amount: 50 }
      ]));
    });

    it('handles 4-member unequal splits in ≤ N-1 transactions', () => {
      // Net balances sum to 0
      // A: +100, B: +50, C: -80, D: -70
      const balances = [
        { name: 'A', net_balance: 100 },
        { name: 'B', net_balance: 50 },
        { name: 'C', net_balance: -80 },
        { name: 'D', net_balance: -70 }
      ];
      
      const settlements = calculateSettlement(balances);
      
      // For N=4, max transactions = 3. 
      expect(settlements.length).toBeLessThanOrEqual(3);
      
      // Calculate resulting balances if settlements were applied
      let netA = 100, netB = 50, netC = -80, netD = -70;
      settlements.forEach(s => {
        if (s.to === 'A') netA -= s.amount;
        if (s.to === 'B') netB -= s.amount;
        if (s.from === 'C') netC += s.amount;
        if (s.from === 'D') netD += s.amount;
      });
      
      expect(Math.abs(netA)).toBeLessThan(0.01);
      expect(Math.abs(netB)).toBeLessThan(0.01);
      expect(Math.abs(netC)).toBeLessThan(0.01);
      expect(Math.abs(netD)).toBeLessThan(0.01);
    });

    it('returns empty array when all settled (net balances are 0)', () => {
      const balances = [
        { name: 'A', net_balance: 0 },
        { name: 'B', net_balance: 0 }
      ];
      
      const settlements = calculateSettlement(balances);
      
      expect(settlements.length).toBe(0);
    });
  });

  describe('Aesthetic utility functions', () => {
    it('getFairnessColor returns correct Aurora Forest hex codes', () => {
      expect(getFairnessColor(100)).toBe('#009A6E'); // Mayan Jade
      expect(getFairnessColor(80)).toBe('#009A6E');  
      expect(getFairnessColor(60)).toBe('#E8E300');  // Neo Solar
      expect(getFairnessColor(30)).toBe('#767F7D');  // Timeless Grey (No Red)
    });

    it('getBalanceColor adheres to "No Alarmist Red" constraint', () => {
      expect(getBalanceColor(50)).toBe('text-success');
      expect(getBalanceColor(0)).toBe('text-text-dark');
      // Negative balance must not be red!
      expect(getBalanceColor(-50)).toBe('text-text-muted'); 
    });
  });
});
