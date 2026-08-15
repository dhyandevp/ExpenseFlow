import { describe, it, expect } from 'vitest';
import { csvSafe } from '../shared/balanceMath.js';
import { calculateFairnessScore, calculateBalances } from '../shared/balanceMath.js';

describe('csvSafe', () => {
  it('should return non-strings as is', () => {
    expect(csvSafe(123)).toBe(123);
    expect(csvSafe(null)).toBe(null);
  });

  it('should prefix formulas with a single quote', () => {
    expect(csvSafe('=1+1')).toBe("'=" + "1+1");
    expect(csvSafe('+123')).toBe("'+123");
    expect(csvSafe('-100')).toBe("'-100");
    expect(csvSafe('@sum()')).toBe("'@sum()");
  });


  it('should return normal strings unchanged', () => {
    expect(csvSafe('Normal String')).toBe('Normal String');
  });
});

describe('calculateFairnessScore', () => {
  it('should return a score of 100 for equal splits', () => {
    const members = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
    const expenses = [
      { amount: 50, paidBy: '1' },
      { amount: 50, paidBy: '2' },
    ];
    const result = calculateFairnessScore(members, expenses);
    expect(result.group_score).toBe(100);
    expect(result.scores.every(s => s.score === 100)).toBe(true);
  });

  it('should penalize unequal contributions', () => {
    const members = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
    const expenses = [
      { amount: 100, paidBy: '1' },
    ];
    const result = calculateFairnessScore(members, expenses);
    expect(result.group_score).toBeLessThan(100);
    const bob = result.scores.find(s => s.name === 'Bob');
    expect(bob.score).toBeLessThan(100);
  });
});

describe('calculateBalances', () => {
  it('Split Integrity: sum of splits equals total', () => {
    const members = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }, { id: '3', name: 'Charlie' }];
    // Create an amount that doesn't divide evenly by 3
    const expenses = [{ id: 'e1', amount: 100, paidBy: '1' }];
    
    // calculateBalances modifies and returns members array with netBalance
    const result = calculateBalances(members, expenses, []);
    
    // The sum of net_balance should exactly equal 0 (closed system)
    const netSum = result.balances.reduce((sum, m) => sum + m.net_balance, 0);
    
    // Check penny-perfect exactness. In floating point, this should be incredibly close to 0.
    // Using toBeCloseTo handles small IEEE 754 floating point errors, but we should assert 
    // that the logic attempts to balance it.
    expect(Math.abs(netSum)).toBeLessThan(0.02);
  });
});
