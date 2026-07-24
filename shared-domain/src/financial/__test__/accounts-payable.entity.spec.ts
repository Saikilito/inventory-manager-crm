import { describe, it, expect } from 'vitest';
import { makeAccountsPayable, makePaymentRecord, addPaymentToAccountsPayable } from '../accounts-payable.entity.js';

describe('AccountsPayable Entity', () => {
  describe('makePaymentRecord', () => {
    it('should create a valid payment record', () => {
      const record = makePaymentRecord({
        amount: 5000,
        accountId: '507f1f77bcf86cd799439011',
        transactionId: '507f1f77bcf86cd799439012',
        expenseId: '507f1f77bcf86cd799439013',
      });

      expect(Number(record.amount)).toBe(5000);
      expect(record.accountId.toString()).toBe('507f1f77bcf86cd799439011');
      expect(record.transactionId.toString()).toBe('507f1f77bcf86cd799439012');
      expect(record.expenseId.toString()).toBe('507f1f77bcf86cd799439013');
    });

    it('should throw validation error for non-positive amount', () => {
      expect(() =>
        makePaymentRecord({
          amount: 0,
          accountId: '507f1f77bcf86cd799439011',
          transactionId: '507f1f77bcf86cd799439012',
          expenseId: '507f1f77bcf86cd799439013',
        }),
      ).toThrow('Payment amount must be positive');
    });

    it('should throw validation error for missing account ID', () => {
      expect(() =>
        makePaymentRecord({
          amount: 5000,
          accountId: '',
          transactionId: '507f1f77bcf86cd799439012',
          expenseId: '507f1f77bcf86cd799439013',
        }),
      ).toThrow('Account ID is required');
    });
  });

  describe('makeAccountsPayable', () => {
    it('should create a valid accounts payable with PENDING status', () => {
      const payable = makeAccountsPayable({
        stockLotId: '507f1f77bcf86cd799439011',
        supplier: 'TechSupply Co',
        totalAmount: 8750,
      });

      expect(payable.stockLotId.toString()).toBe('507f1f77bcf86cd799439011');
      expect(payable.supplier.toString()).toBe('TechSupply Co');
      expect(Number(payable.totalAmount)).toBe(8750);
      expect(Number(payable.remainingBalance)).toBe(8750);
      expect(payable.status).toBe('PENDING');
      expect(payable.payments).toHaveLength(0);
    });

    it('should allow creating AccountsPayable without stock lot ID (for CREDIT flow)', () => {
      const payable = makeAccountsPayable({
        stockLotId: '',
        supplier: 'TechSupply Co',
        totalAmount: 8750,
      });
      expect(payable.supplier).toBe('TechSupply Co');
      expect(Number(payable.totalAmount)).toBe(8750);
      expect(payable.status).toBe('PENDING');
    });

    it('should throw validation error for non-positive total amount', () => {
      expect(() =>
        makeAccountsPayable({
          stockLotId: '507f1f77bcf86cd799439011',
          supplier: 'TechSupply Co',
          totalAmount: 0,
        }),
      ).toThrow('Total amount must be positive');
    });
  });

  describe('addPaymentToAccountsPayable', () => {
    it('should add payment and update balance correctly', () => {
      const payable = makeAccountsPayable({
        stockLotId: '507f1f77bcf86cd799439011',
        supplier: 'TechSupply Co',
        totalAmount: 10000,
      });

      const payment = makePaymentRecord({
        amount: 4000,
        accountId: '507f1f77bcf86cd799439012',
        transactionId: '507f1f77bcf86cd799439013',
        expenseId: '507f1f77bcf86cd799439014',
      });

      const updated = addPaymentToAccountsPayable(payable, payment);

      expect(Number(updated.remainingBalance)).toBe(6000);
      expect(updated.status).toBe('PARTIAL');
      expect(updated.payments).toHaveLength(1);
    });

    it('should set status to PAID when fully paid', () => {
      const payable = makeAccountsPayable({
        stockLotId: '507f1f77bcf86cd799439011',
        supplier: 'TechSupply Co',
        totalAmount: 10000,
      });

      const payment = makePaymentRecord({
        amount: 10000,
        accountId: '507f1f77bcf86cd799439012',
        transactionId: '507f1f77bcf86cd799439013',
        expenseId: '507f1f77bcf86cd799439014',
      });

      const updated = addPaymentToAccountsPayable(payable, payment);

      expect(Number(updated.remainingBalance)).toBe(0);
      expect(updated.status).toBe('PAID');
    });

    it('should throw validation error when payment exceeds balance', () => {
      const payable = makeAccountsPayable({
        stockLotId: '507f1f77bcf86cd799439011',
        supplier: 'TechSupply Co',
        totalAmount: 3000,
      });

      const payment = makePaymentRecord({
        amount: 5000,
        accountId: '507f1f77bcf86cd799439012',
        transactionId: '507f1f77bcf86cd799439013',
        expenseId: '507f1f77bcf86cd799439014',
      });

      expect(() => addPaymentToAccountsPayable(payable, payment)).toThrow(
        'Payment cannot exceed remaining balance',
      );
    });
  });
});
