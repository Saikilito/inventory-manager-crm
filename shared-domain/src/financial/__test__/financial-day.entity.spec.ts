import { describe, it, expect } from 'vitest';
import { makeFinancialDay, FinancialDayStatus } from '../financial-day.entity.js';

describe('FinancialDay Entity', () => {
  const baseProps = {
    date: '2026-07-09',
    openingBalances: [],
    closingBalances: [],
    openedAt: '2026-07-09T08:00:00Z',
  };

  describe('isOpen', () => {
    it('returns true when status is OPEN', () => {
      const day = makeFinancialDay({ ...baseProps, status: FinancialDayStatus.OPEN });
      expect(day.isOpen()).toBe(true);
    });

    it('returns false when status is CLOSED', () => {
      const day = makeFinancialDay({ ...baseProps, status: FinancialDayStatus.CLOSED });
      expect(day.isOpen()).toBe(false);
    });
  });

  describe('makeFinancialDay', () => {
    it('creates a valid financial day with OPEN status', () => {
      const day = makeFinancialDay({ ...baseProps, status: 'OPEN' });
      expect(day.status).toBe(FinancialDayStatus.OPEN);
      expect(day.date.toString()).toBe('2026-07-09');
    });

    it('creates a valid financial day with CLOSED status', () => {
      const day = makeFinancialDay({ ...baseProps, status: 'CLOSED' });
      expect(day.status).toBe(FinancialDayStatus.CLOSED);
    });

    it('throws on invalid status', () => {
      expect(() =>
        makeFinancialDay({ ...baseProps, status: 'INVALID_STATUS' })
      ).toThrow();
    });
  });
});
