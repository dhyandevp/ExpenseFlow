import { describe, it, expect } from 'vitest';
import { csvSafe } from '../shared/csv.js';
import { applyRecurringTemplate } from '../client/src/api/client.js';

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
