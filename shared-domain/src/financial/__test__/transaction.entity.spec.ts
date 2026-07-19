import { describe, it, expect } from 'vitest';
import { makeTransaction, TransactionType } from '../transaction.entity.js';
import { IdVO } from '../../shared/value-objects/id.vo.js';

describe('Transaction Entity', () => {
  const validProps = {
    accountId: IdVO.generate().toString(),
    type: TransactionType.CREDIT,
    amount: 100,
    currency: 'USD',
    description: 'Test transaction',
    date: '2026-07-09',
    financialDayId: IdVO.generate().toString(),
    referenceId: IdVO.generate().toString(),
  };

  describe('makeTransaction', () => {
    it('creates a valid CREDIT transaction', () => {
      const tx = makeTransaction({ ...validProps, type: TransactionType.CREDIT });
      expect(tx.type).toBe(TransactionType.CREDIT);
      expect(tx.amount).toBe(100);
      expect(tx.currency.toString()).toBe('USD');
    });

    it('creates a valid DEBIT transaction', () => {
      const tx = makeTransaction({ ...validProps, type: TransactionType.DEBIT });
      expect(tx.type).toBe(TransactionType.DEBIT);
    });

    it('normalizes type to uppercase', () => {
      const tx = makeTransaction({ ...validProps, type: 'credit' });
      expect(tx.type).toBe(TransactionType.CREDIT);
    });

    it('throws on invalid transaction type', () => {
      expect(() =>
        makeTransaction({ ...validProps, type: 'INVALID_TYPE' })
      ).toThrow();
    });

    it('throws on negative or zero amount', () => {
      expect(() =>
        makeTransaction({ ...validProps, amount: 0 })
      ).toThrow();
      expect(() =>
        makeTransaction({ ...validProps, amount: -100 })
      ).toThrow();
    });

    it('throws on empty description', () => {
      expect(() =>
        makeTransaction({ ...validProps, description: '' })
      ).toThrow();
    });

    it('throws on invalid accountId', () => {
      expect(() =>
        makeTransaction({ ...validProps, accountId: 'not-a-uuid' })
      ).toThrow();
    });
  });
});
