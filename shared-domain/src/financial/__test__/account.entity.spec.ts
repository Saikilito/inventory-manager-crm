import { describe, it, expect } from 'vitest';
import { makeAccount } from '../account.entity.js';
import { IdVO } from '../../shared/value-objects/id.vo.js';
import { PositiveNumberVO } from '../../shared/value-objects/positive-number.vo.js';
import { ValidationError } from '../../shared/validation-error.js';

describe('Account Entity', () => {
  const baseProps = {
    name: 'Test Account',
    currency: 'USD',
    balance: 1000,
  };

  describe('isSame', () => {
    it('returns true when accounts have the same id', () => {
      const id = IdVO.generate().toString();
      const acc1 = makeAccount({ ...baseProps, id });
      const acc2 = makeAccount({ ...baseProps, id });
      expect(acc1.isSame(acc2)).toBe(true);
    });

    it('returns false when accounts have different ids', () => {
      const acc1 = makeAccount({ ...baseProps, id: IdVO.generate().toString() });
      const acc2 = makeAccount({ ...baseProps, id: IdVO.generate().toString() });
      expect(acc1.isSame(acc2)).toBe(false);
    });

    it('returns false when account has no id', () => {
      const acc1 = makeAccount({ ...baseProps });
      const acc2 = makeAccount({ ...baseProps, id: IdVO.generate().toString() });
      expect(acc1.isSame(acc2)).toBe(false);
    });
  });

  describe('canDebit', () => {
    it('returns true when balance is greater than amount', () => {
      const acc = makeAccount({ ...baseProps, balance: 1000 });
      const amount = PositiveNumberVO.create(500);
      expect(acc.canDebit(amount)).toBe(true);
    });

    it('returns true when balance equals amount (exact)', () => {
      const acc = makeAccount({ ...baseProps, balance: 1000 });
      const amount = PositiveNumberVO.create(1000);
      expect(acc.canDebit(amount)).toBe(true);
    });

    it('returns false when balance is less than amount', () => {
      const acc = makeAccount({ ...baseProps, balance: 100 });
      const amount = PositiveNumberVO.create(500);
      expect(acc.canDebit(amount)).toBe(false);
    });

    it('returns false when balance is zero', () => {
      const acc = makeAccount({ ...baseProps, balance: 0 });
      const amount = PositiveNumberVO.create(1);
      expect(acc.canDebit(amount)).toBe(false);
    });
  });

  describe('debit', () => {
    it('returns new account with reduced balance', () => {
      const acc = makeAccount({ ...baseProps, balance: 1000 });
      const amount = PositiveNumberVO.create(300);
      const debited = acc.debit(amount);
      expect(debited.balance).toBe(700);
    });

    it('does not mutate the original account', () => {
      const acc = makeAccount({ ...baseProps, balance: 1000 });
      const amount = PositiveNumberVO.create(300);
      acc.debit(amount);
      expect(acc.balance).toBe(1000);
    });

    it('can debit exact balance leaving zero', () => {
      const acc = makeAccount({ ...baseProps, balance: 1000 });
      const amount = PositiveNumberVO.create(1000);
      const debited = acc.debit(amount);
      expect(debited.balance).toBe(0);
    });
  });

  describe('credit', () => {
    it('returns new account with increased balance', () => {
      const acc = makeAccount({ ...baseProps, balance: 500 });
      const amount = PositiveNumberVO.create(300);
      const credited = acc.credit(amount);
      expect(credited.balance).toBe(800);
    });

    it('does not mutate the original account', () => {
      const acc = makeAccount({ ...baseProps, balance: 500 });
      const amount = PositiveNumberVO.create(300);
      acc.credit(amount);
      expect(acc.balance).toBe(500);
    });
  });

  describe('calculateCreditFor', () => {
    it('returns same amount when currencies match', () => {
      const source = makeAccount({ ...baseProps, currency: 'USD' });
      const target = makeAccount({ ...baseProps, currency: 'USD' });
      const amount = PositiveNumberVO.create(100);
      const result = source.calculateCreditFor(target, amount);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBe(100);
    });

    it('multiplies amount by exchange rate when currencies differ', () => {
      const source = makeAccount({ ...baseProps, currency: 'USD' });
      const target = makeAccount({ ...baseProps, currency: 'VES' });
      const amount = PositiveNumberVO.create(10);
      const exchangeRate = PositiveNumberVO.create(45);
      const result = source.calculateCreditFor(target, amount, exchangeRate);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBe(450);
    });

    it('fails when currencies differ and no exchange rate provided', () => {
      const source = makeAccount({ ...baseProps, currency: 'USD' });
      const target = makeAccount({ ...baseProps, currency: 'VES' });
      const amount = PositiveNumberVO.create(10);
      const result = source.calculateCreditFor(target, amount);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(ValidationError);
      expect(result.getError().message).toContain('Exchange rate');
    });
  });
});
