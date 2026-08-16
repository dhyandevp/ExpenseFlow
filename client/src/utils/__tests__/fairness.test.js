import { describe, it, expect } from 'vitest';
import { 
  getFairnessColor, 
  getBalanceColor 
} from '../../../../shared/fairness';

describe('fairness.js', () => {

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
