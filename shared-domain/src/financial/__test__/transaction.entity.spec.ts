import { describe, expect, it } from 'vitest';
import { makeTransactionResult, TransactionType } from '../transaction.entity.js';

describe('Transaction Entity', () => {
  // Pre-generate valid IDs
  const validAccountId = crypto.randomUUID();
  const validFinancialDayId = crypto.randomUUID();

  const baseProps = {
    accountId: validAccountId,
    amount: 100.5,
    currency: 'USD',
    description: 'Test transaction',
    date: '2026-06-30',
    financialDayId: validFinancialDayId,
    source: 'MANUAL'
  };

  describe('makeTransactionResult', () => {
    it('should create a valid credit transaction', () => {
      const txResult = makeTransactionResult({ ...baseProps, type: TransactionType.CREDIT });
      expect(txResult.isFailure).toBe(false);
      const tx = txResult.getValue();
      expect(tx.type).toBe(TransactionType.CREDIT);
      expect(tx.amount).toBe(100.5);
      expect(tx.currency).toBe('USD');
      expect(tx.source).toBe('MANUAL');
    });

    it('should create a valid debit transaction', () => {
      const txResult = makeTransactionResult({ ...baseProps, type: TransactionType.DEBIT });
      expect(txResult.isFailure).toBe(false);
      const tx = txResult.getValue();
      expect(tx.type).toBe(TransactionType.DEBIT);
    });

    it('should normalize transaction type to uppercase', () => {
      const txResult = makeTransactionResult({ ...baseProps, type: 'credit' });
      expect(txResult.isFailure).toBe(false);
      const tx = txResult.getValue();
      expect(tx.type).toBe(TransactionType.CREDIT);
    });

    it('should fail for unsupported transaction type', () => {
      const result = makeTransactionResult({ ...baseProps, type: 'INVALID_TYPE' });
      expect(result.isFailure).toBe(true);
    });

    it('should fail for non-positive amount', () => {
      expect(makeTransactionResult({ ...baseProps, amount: 0 }).isFailure).toBe(true);
      expect(makeTransactionResult({ ...baseProps, amount: -100 }).isFailure).toBe(true);
    });

    it('should fail for empty description', () => {
      expect(makeTransactionResult({ ...baseProps, description: '' }).isFailure).toBe(true);
    });

    it('should fail for invalid UUIDs', () => {
      expect(makeTransactionResult({ ...baseProps, accountId: 'not-a-uuid' }).isFailure).toBe(true);
    });

    it('should require sourceReferenceId when source is non-MANUAL', () => {
      const result = makeTransactionResult({
        ...baseProps,
        type: TransactionType.CREDIT,
        source: 'ORDER_PAYMENT',
      });
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.getError().message).toContain('sourceReferenceId is required when transaction source is ORDER_PAYMENT');
      }
    });

    it('should create transaction when non-MANUAL source has sourceReferenceId', () => {
      const refId = crypto.randomUUID();
      const result = makeTransactionResult({
        ...baseProps,
        type: TransactionType.CREDIT,
        source: 'ORDER_PAYMENT',
        sourceReferenceId: refId,
      });
      expect(result.isFailure).toBe(false);
      if (!result.isFailure) {
        expect(result.getValue().source).toBe('ORDER_PAYMENT');
        expect(result.getValue().sourceReferenceId?.toString()).toBe(refId);
      }
    });
  });
});
