import { describe, it, expect } from 'vitest';
import { getISOWeekKey } from '../utils/date-utils.js';

describe('date-utils', () => {
  describe('getISOWeekKey', () => {
    it('should calculate correct week key for year/month/day string arguments', () => {
      // 2026-01-01 is a Thursday, which is in 2026-W01
      expect(getISOWeekKey('2026', '1', '1')).toBe('2026-W01');
      // 2026-03-09 is a Monday, which is in 2026-W11
      expect(getISOWeekKey('2026', '3', '9')).toBe('2026-W11');
      // 2026-12-31 is a Thursday, which is in 2026-W53
      expect(getISOWeekKey('2026', '12', '31')).toBe('2026-W53');
    });

    it('should calculate correct week key for Date objects', () => {
      const date1 = new Date(2026, 0, 1); // 2026-01-01
      expect(getISOWeekKey(date1)).toBe('2026-W01');

      const date2 = new Date(2026, 2, 9); // 2026-03-09
      expect(getISOWeekKey(date2)).toBe('2026-W11');

      const date3 = new Date(2026, 11, 31); // 2026-12-31
      expect(getISOWeekKey(date3)).toBe('2026-W53');
    });

    it('should calculate correct week key for YYYY-MM-DD strings', () => {
      expect(getISOWeekKey('2026-01-01')).toBe('2026-W01');
      expect(getISOWeekKey('2026-03-09')).toBe('2026-W11');
      expect(getISOWeekKey('2026-12-31')).toBe('2026-W53');
    });

    it('should calculate correct week key for ISO date-time strings', () => {
      expect(getISOWeekKey('2026-03-09T09:00:00.000+0000')).toBe('2026-W11');
    });

    it('should throw an error for invalid date inputs', () => {
      expect(() => getISOWeekKey('invalid-date')).toThrow();
    });
  });
});
