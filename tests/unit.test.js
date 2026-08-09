import { describe, it, expect } from 'vitest';
import { csvSafe } from '../shared/csv.js';
import { applyRecurringTemplate } from '../client/src/api/client.js';
import { calculateFairnessScore, calculateBalances } from '../shared/balanceMath.js';
import { calculateSettlement } from '../shared/fairness.js';

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

  it('should wrap values with commas in double quotes', () => {
    expect(csvSafe('Hello, World')).toBe('"Hello, World"');
  });

  it('should escape double quotes and wrap in double quotes', () => {
    expect(csvSafe('Hello "World"')).toBe('"Hello ""World"""');
  });

  it('should return normal strings unchanged', () => {
    expect(csvSafe('Normal String')).toBe('Normal String');
  });
});

describe('applyRecurringTemplate', () => {
  it('should return success object', async () => {
    const result = await applyRecurringTemplate();
    expect(result).toEqual({ success: true });
  });
});

describe('calculateFairnessScore', () => {
  it('should return a score of 100 for equal splits', () => {
    const members = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
    const expenses = [
      { amount: 50, paid_by: '1' },
      { amount: 50, paid_by: '2' },
    ];
    const result = calculateFairnessScore(members, expenses);
    expect(result.group_score).toBe(100);
    expect(result.scores.every(s => s.score === 100)).toBe(true);
  });

  it('should penalize unequal contributions', () => {
    const members = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
    const expenses = [
      { amount: 100, paid_by: '1' },
    ];
    const result = calculateFairnessScore(members, expenses);
    expect(result.group_score).toBeLessThan(100);
    const bob = result.scores.find(s => s.name === 'Bob');
    expect(bob.score).toBeLessThan(100);
  });
});

describe('calculateSettlement', () => {
  it('should optimize transfers for 1 payer and multiple borrowers', () => {
    // Balances: positive means they owe money, negative means they are owed money.
    // Let's assume standard logic: Alice paid 100 for Alice and Bob. Alice is owed 50. Bob owes 50.
    // If calculateSettlement expects positive as owed, negative as owes, we need to pass correct signs.
    // Let's pass typical array of member balances.
    const balances = [
      { id: '1', name: 'Alice', netBalance: -50 }, // owed 50
      { id: '2', name: 'Bob', netBalance: 50 },    // owes 50
    ];
    const settlements = calculateSettlement(balances);
    expect(settlements.length).toBe(1);
    expect(settlements[0].from).toBe('2');
    expect(settlements[0].to).toBe('1');
    expect(settlements[0].amount).toBe(50);
  });
});

describe('calculateBalances', () => {
  it('Split Integrity: sum of splits equals total', () => {
    const members = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }, { id: '3', name: 'Charlie' }];
    // Create an amount that doesn't divide evenly by 3
    const expenses = [{ id: 'e1', amount: 100, paid_by: '1' }];
    
    // calculateBalances modifies and returns members array with netBalance
    const result = calculateBalances(members, expenses, []);
    
    // The sum of netBalance should exactly equal 0 (closed system)
    const netSum = result.reduce((sum, m) => sum + m.netBalance, 0);
    
    // Check penny-perfect exactness. In floating point, this should be incredibly close to 0.
    // Using toBeCloseTo handles small IEEE 754 floating point errors, but we should assert 
    // that the logic attempts to balance it.
    expect(Math.abs(netSum)).toBeLessThan(0.01);
  });
});
