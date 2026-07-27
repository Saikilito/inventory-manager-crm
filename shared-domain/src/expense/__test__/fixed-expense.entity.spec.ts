import { describe, it, expect } from 'vitest';
import { makeFixedExpense, makeFixedExpensePayment } from '../fixed-expense.entity.js';

describe('FixedExpense Entity', () => {
  describe('makeFixedExpense', () => {
    it('should create a valid fixed expense entity', () => {
      const fe = makeFixedExpense({
        name: 'Internet Fiber',
        category: 'UTILITIES',
        amount: 50,
      });

      expect(fe.name.toString()).toBe('Internet Fiber');
      expect(fe.category).toBe('UTILITIES');
      expect(Number(fe.amount)).toBe(50);
      expect(fe.isActive).toBe(true);
    });
  });

  describe('makeFixedExpensePayment', () => {
    it('should create a valid fixed expense payment when paid with paidAt', () => {
      const payment = makeFixedExpensePayment({
        fixedExpenseId: '507f1f77bcf86cd799439011',
        billingMonth: '2026-07',
        isPaid: true,
        amountPaid: 50,
        paidAt: '2026-07-20T10:00:00.000Z',
      });

      expect(payment.fixedExpenseId.toString()).toBe('507f1f77bcf86cd799439011');
      expect(payment.billingMonth.toString()).toBe('2026-07');
      expect(payment.isPaid).toBe(true);
      expect(Number(payment.amountPaid)).toBe(50);
      expect(payment.paidAt).toBeDefined();
    });

    it('should create a valid fixed expense payment when unpaid without paidAt', () => {
      const payment = makeFixedExpensePayment({
        fixedExpenseId: '507f1f77bcf86cd799439011',
        billingMonth: '2026-07',
        isPaid: false,
        amountPaid: 50,
      });

      expect(payment.isPaid).toBe(false);
      expect(payment.paidAt).toBeUndefined();
    });

    it('should throw validation error when billingMonth is not in YYYY-MM format', () => {
      expect(() =>
        makeFixedExpensePayment({
          fixedExpenseId: '507f1f77bcf86cd799439011',
          billingMonth: '2026/07',
          isPaid: false,
          amountPaid: 50,
        }),
      ).toThrow('Billing month must be in YYYY-MM format');
    });

    it('should throw validation error when isPaid is true but paidAt is missing', () => {
      expect(() =>
        makeFixedExpensePayment({
          fixedExpenseId: '507f1f77bcf86cd799439011',
          billingMonth: '2026-07',
          isPaid: true,
          amountPaid: 50,
        }),
      ).toThrow('paidAt is required when payment is marked as paid');
    });

    it('should throw validation error when isPaid is false but paidAt is provided', () => {
      expect(() =>
        makeFixedExpensePayment({
          fixedExpenseId: '507f1f77bcf86cd799439011',
          billingMonth: '2026-07',
          isPaid: false,
          amountPaid: 50,
          paidAt: '2026-07-20T10:00:00.000Z',
        }),
      ).toThrow('paidAt cannot be provided when payment is not marked as paid');
    });
  });
});
